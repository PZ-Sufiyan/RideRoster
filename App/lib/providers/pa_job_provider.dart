import 'dart:async';
import 'package:flutter/foundation.dart';
import '../model/pa_job_model.dart';
import '../services/pa_job_service.dart';
import '../services/realtime_service.dart';

// ─────────────────────────────────────────────────────────────────────────────
// PaJobProvider  —  live job view (dashboard + current job page)
// ─────────────────────────────────────────────────────────────────────────────

/// Read-only live job state for the Passenger Assistant.
///
/// Realtime: listens to RealtimeService so the PA's view updates as the
/// driver marks pickups and dropoffs.
///
/// [completionOverlay]: when the driver completes a run but another run is
/// still pending today, [job] switches to the next run for the dashboard
/// while [completionOverlay] keeps the finished run for PaCurrentJobPage
/// until the PA leaves that screen.
class PaJobProvider extends ChangeNotifier {
  final PaJobService _service = PaJobService();
  final RealtimeService _realtimeService = RealtimeService();

  PaJobModel? _job;
  PaJobModel? _completionOverlay;
  bool _isLoading = false;
  String? _error;
  bool _hasLoadedOnce = false;
  int _jobDataEpoch = 0;

  StreamSubscription<Map<String, dynamic>>? _jobSub;
  StreamSubscription<Map<String, dynamic>>? _sessionSub;
  StreamSubscription<Map<String, dynamic>>? _passengerSub;
  Timer? _reloadDebounce;

  PaJobProvider() {
    _listenToRealtime();
  }

  // ── Getters ────────────────────────────────────────────────────────────────

  PaJobModel? get job => _job;
  PaJobModel? get completionOverlay => _completionOverlay;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get hasLoadedOnce => _hasLoadedOnce;
  int get jobDataEpoch => _jobDataEpoch;

  // ── Realtime ───────────────────────────────────────────────────────────────

  void _listenToRealtime() {
    _jobSub = _realtimeService.onJobChange.listen((_) => _scheduleReload());
    _sessionSub = _realtimeService.onSessionChange.listen(
      (_) => _scheduleReload(),
    );
    _passengerSub = _realtimeService.onPassengerChange.listen((record) {
      final sessionId = record['session_id']?.toString() ?? '';
      final currentSessionId = _job?.sessionId ?? '';
      final overlaySessionId = _completionOverlay?.sessionId ?? '';
      if (currentSessionId.isEmpty ||
          sessionId == currentSessionId ||
          sessionId == overlaySessionId) {
        _scheduleReload();
      }
    });
  }

  void _scheduleReload() {
    _reloadDebounce?.cancel();
    _reloadDebounce = Timer(const Duration(milliseconds: 400), () {
      loadJob(silent: true);
    });
  }

  // ── Load ───────────────────────────────────────────────────────────────────

  Future<void> loadJob({bool silent = false}) async {
    final blockUi = !silent && _job == null && !_hasLoadedOnce;

    if (blockUi) {
      _isLoading = true;
      _error = null;
      notifyListeners();
    }

    final previous = _job;
    final previousSessionId = previous?.sessionId ?? '';
    final previousWasIncomplete =
        previous != null && !previous.isSessionCompleted;

    try {
      final updated = await _service.fetchCurrentJob();

      if (previousWasIncomplete && previousSessionId.isNotEmpty) {
        final switchedSession =
            updated == null || updated.sessionId != previousSessionId;

        if (switchedSession) {
          final morningCompleted = await _service.isSessionCompleted(
            previousSessionId,
          );
          if (morningCompleted) {
            _job = updated;
            _completionOverlay = previous.copyWith(sessionStatus: 'completed');
            _error = null;
            if (blockUi) _isLoading = false;
            _hasLoadedOnce = true;
            _jobDataEpoch++;
            notifyListeners();
            return;
          }
        } else if (updated!.isSessionCompleted) {
          _job = updated;
          _completionOverlay = updated;
          _error = null;
          if (blockUi) _isLoading = false;
          _hasLoadedOnce = true;
          _jobDataEpoch++;
          notifyListeners();
          return;
        }
      }

      _job = updated;
      if (updated == null || !updated.isSessionCompleted) {
        _completionOverlay = null;
      } else if (_completionOverlay == null) {
        _completionOverlay = updated;
      }
      _error = null;
    } catch (e) {
      if (blockUi) _error = e.toString();
    } finally {
      if (blockUi) _isLoading = false;
      _hasLoadedOnce = true;
      _jobDataEpoch++;
      notifyListeners();
    }
  }

  void clearCompletionOverlay() {
    if (_completionOverlay == null) return;
    _completionOverlay = null;
    notifyListeners();
  }

  void reset() {
    _job = null;
    _completionOverlay = null;
    _hasLoadedOnce = false;
    _error = null;
    _jobDataEpoch = 0;
    notifyListeners();
  }

  @override
  void dispose() {
    _reloadDebounce?.cancel();
    _jobSub?.cancel();
    _sessionSub?.cancel();
    _passengerSub?.cancel();
    super.dispose();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PaAssignedJobsProvider  —  weekly schedule view (assigned jobs page)
// ─────────────────────────────────────────────────────────────────────────────

/// Holds the PA's weekly recurring schedule.
///
/// Load strategy:
///   - First visit: shows loading indicator, fetches, caches result.
///   - Subsequent visits: returns cached data instantly, silently refreshes
///     in the background — UI only updates if data changed.
///   - Manual pull-to-refresh: call [refresh()].
class PaAssignedJobsProvider extends ChangeNotifier {
  final PaJobService _service = PaJobService();

  PaAssignedJobModel? _job;
  bool _isLoading = false;
  String? _error;
  bool _hasLoadedOnce = false;
  bool _isRefreshing = false;

  PaAssignedJobModel? get job => _job;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get hasLoadedOnce => _hasLoadedOnce;
  bool get isRefreshing => _isRefreshing;

  /// Call on every page entry — instant if cached, background refresh otherwise.
  Future<void> loadIfNeeded() async {
    if (!_hasLoadedOnce) {
      await _fetch(blockUi: true);
    } else {
      _fetch(blockUi: false); // fire-and-forget
    }
  }

  /// Force a full reload (pull-to-refresh).
  Future<void> refresh() async {
    await _fetch(blockUi: false);
  }

  Future<void> _fetch({required bool blockUi}) async {
    if (blockUi) {
      _isLoading = true;
      _error = null;
      notifyListeners();
    } else {
      _isRefreshing = true;
      // No notifyListeners — don't flash UI just because refresh started.
    }

    try {
      final updated = await _service.fetchAssignedJob();
      _job = updated;
      _error = null;
    } catch (e) {
      if (blockUi) _error = e.toString();
      // Background refresh: swallow error, keep existing data visible.
    } finally {
      _isLoading = false;
      _isRefreshing = false;
      _hasLoadedOnce = true;
      notifyListeners();
    }
  }

  void reset() {
    _job = null;
    _hasLoadedOnce = false;
    _isLoading = false;
    _isRefreshing = false;
    _error = null;
    notifyListeners();
  }
}
