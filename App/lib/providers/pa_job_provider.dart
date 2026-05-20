import 'dart:async';
import 'package:flutter/foundation.dart';
import '../model/pa_job_model.dart';
import '../services/pa_job_service.dart';
import '../services/realtime_service.dart';

/// Read-only job state for the Passenger Assistant.
///
/// Mirrors the reload behaviour of [JobProvider] but has no write methods,
/// no location tracking, and no pickup/dropoff mutation logic.
///
/// Realtime: listens to the same [RealtimeService] streams so the PA's view
/// updates in real-time as the driver marks pickups and dropoffs.
///
/// [completionOverlay]: when the driver completes a run but another run is
/// still pending today (e.g. morning done, evening next), [job] switches to
/// the next run for the dashboard while [completionOverlay] keeps the finished
/// run for [PaCurrentJobPage] until the PA leaves that screen.
class PaJobProvider extends ChangeNotifier {
  final PaJobService _service = PaJobService();
  final RealtimeService _realtimeService = RealtimeService();

  PaJobModel? _job;
  PaJobModel? _completionOverlay;
  bool _isLoading = false;
  String? _error;
  bool _hasLoadedOnce = false;

  /// Incremented every time [loadJob] finishes. Dashboard sections can refresh
  /// when this changes without flashing the whole page.
  int _jobDataEpoch = 0;

  StreamSubscription<Map<String, dynamic>>? _jobSub;
  StreamSubscription<Map<String, dynamic>>? _sessionSub;
  StreamSubscription<Map<String, dynamic>>? _passengerSub;
  Timer? _reloadDebounce;

  PaJobProvider() {
    _listenToRealtime();
  }

  // ── Getters ────────────────────────────────────────────────────────────────

  /// Current run for dashboard / list views (may be evening after morning ends).
  PaJobModel? get job => _job;

  /// Finished run shown on current-job completion screen only.
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
            _completionOverlay = previous.copyWith(
              sessionStatus: 'completed',
            );
            _error = null;
            if (blockUi) _isLoading = false;
            _hasLoadedOnce = true;
            _jobDataEpoch++;
            notifyListeners();
            return;
          }
        } else if (updated.isSessionCompleted) {
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
