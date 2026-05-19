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
class PaJobProvider extends ChangeNotifier {
  final PaJobService _service = PaJobService();
  final RealtimeService _realtimeService = RealtimeService();

  PaJobModel? _job;
  bool _isLoading = false;
  String? _error;
  bool _hasLoadedOnce = false;

  StreamSubscription<Map<String, dynamic>>? _jobSub;
  StreamSubscription<Map<String, dynamic>>? _sessionSub;
  StreamSubscription<Map<String, dynamic>>? _passengerSub;
  Timer? _reloadDebounce;

  PaJobProvider() {
    _listenToRealtime();
  }

  // ── Getters ────────────────────────────────────────────────────────────────

  PaJobModel? get job => _job;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get hasLoadedOnce => _hasLoadedOnce;

  // ── Realtime ───────────────────────────────────────────────────────────────

  void _listenToRealtime() {
    // Reload whenever the driver changes job/session/passenger status.
    _jobSub = _realtimeService.onJobChange.listen((_) => _scheduleReload());
    _sessionSub = _realtimeService.onSessionChange.listen(
      (_) => _scheduleReload(),
    );
    _passengerSub = _realtimeService.onPassengerChange.listen((record) {
      // Only reload if the change belongs to the current session.
      final sessionId = record['session_id']?.toString() ?? '';
      final currentSessionId = _job?.sessionId ?? '';
      if (currentSessionId.isEmpty || sessionId == currentSessionId) {
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

    try {
      _job = await _service.fetchCurrentJob();
      _error = null;
    } catch (e) {
      if (blockUi) _error = e.toString();
      // Silent refresh: keep existing job, don't flash error.
    } finally {
      if (blockUi) _isLoading = false;
      _hasLoadedOnce = true;
      notifyListeners();
    }
  }

  void reset() {
    _job = null;
    _hasLoadedOnce = false;
    _error = null;
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
