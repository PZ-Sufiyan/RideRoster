import 'dart:async';
import 'package:flutter/foundation.dart';
import '../users/driver/models/job_model.dart';
import '../services/job_service.dart';
import '../services/realtime_service.dart';
import '../services/navigation_service.dart';
import '../services/location_service.dart';
import '../services/location_task.dart';
import '../services/notification_service.dart';

/// Manages active job + session state for the driver flow.
///
/// Realtime behaviour:
///   - Subscribes to RealtimeService streams on construction.
///   - Job changes (approval_status, status) → full reload via loadJob().
///   - Session changes → full reload (session status affects UI state).
///   - Passenger changes → reload only if the change belongs to the
///     current session (avoids unnecessary reloads from other sessions).
///
/// Dropoff mutations:
///   - Inbound: markDropoffAsCompleted() calls updateDropoffStatus() for a
///     single job_session_passengers row (one passenger, one home address).
///   - Outbound: markDropoffAsCompleted() calls updateDropoffStatusForSchool()
///     which bulk-updates ALL passengers sharing the same school address in one
///     query — because the whole group arrives at the school simultaneously.
class JobProvider extends ChangeNotifier {
  final JobService _jobService = JobService();
  final RealtimeService _realtimeService = RealtimeService();
  final NavigationService _navService = NavigationService();
  final LocationService _locationService = LocationService();

  JobModel? _job;
  bool _isLoading = false;
  String? _error;

  /// Incremented every time [loadJob] finishes (success or error). Listeners
  /// (e.g. dashboard job requests) can refresh when this changes.
  int _jobDataEpoch = 0;
  int _activePickupIndex = 0;
  bool _isTracking = false;
  double? _currentDistanceMeters;

  // Realtime stream subscriptions
  StreamSubscription<Map<String, dynamic>>? _jobSub;
  StreamSubscription<Map<String, dynamic>>? _sessionSub;
  StreamSubscription<Map<String, dynamic>>? _passengerSub;

  // Debounce timer — prevents multiple rapid reloads from burst events
  Timer? _reloadDebounce;

  JobProvider() {
    _listenToRealtime();
  }

  // ── Public getters ────────────────────────────────────────────────────────

  JobModel? get job => _job;
  bool get isLoading => _isLoading;
  String? get error => _error;
  int get jobDataEpoch => _jobDataEpoch;
  int get activePickupIndex => _activePickupIndex;
  bool get isTracking => _isTracking;
  double? get currentDistanceMeters => _currentDistanceMeters;
  bool get sessionStarted => _job != null && _job!.sessionId.isNotEmpty;

  PickupStop? get activePickup {
    if (_job == null || _job!.pickups.isEmpty) return null;
    if (_activePickupIndex < 0 || _activePickupIndex >= _job!.pickups.length) {
      return null;
    }
    final current = _job!.pickups[_activePickupIndex];
    if (current.status != PickupStatus.pending) return null;
    return current;
  }

  List<PickupStop> get upcomingPickups {
    if (_job == null) return [];
    return _job!.pickups
        .skip(_activePickupIndex + 1)
        .where((p) => p.status == PickupStatus.pending)
        .toList();
  }

  bool get allResolved => _job?.allPickupsResolved ?? false;

  // ── Realtime setup ────────────────────────────────────────────────────────

  void _listenToRealtime() {
    // Job changes → reload everything (approval, status, assignment)
    _jobSub = _realtimeService.onJobChange.listen((_) {
      _scheduleReload();
    });

    // Session changes → reload (session status, started_at, completed_at)
    _sessionSub = _realtimeService.onSessionChange.listen((_) {
      _scheduleReload();
    });

    // Passenger changes → reload only if it's for the current session
    _passengerSub = _realtimeService.onPassengerChange.listen((record) {
      final sessionId = record['session_id']?.toString() ?? '';
      final currentSessionId = _job?.sessionId ?? '';

      // Only reload if this change belongs to our active session
      if (currentSessionId.isNotEmpty && sessionId == currentSessionId) {
        _scheduleReload();
      }
    });
  }

  /// Debounces rapid bursts of realtime events into a single reload.
  /// e.g. if 5 passengers are inserted at once, we reload once after 400ms.
  void _scheduleReload() {
    _reloadDebounce?.cancel();
    _reloadDebounce = Timer(const Duration(milliseconds: 400), () {
      // Always reload on realtime — skipping while isLoading dropped events
      // during the initial dashboard fetch.
      loadJob(silent: true);
    });
  }

  // ── Load ──────────────────────────────────────────────────────────────────

  /// [silent] = true skips the loading spinner — used for background reloads
  /// triggered by realtime events so the UI doesn't flash.
  Future<void> loadJob({bool silent = false}) async {
    if (!silent) {
      _isLoading = true;
      _error = null;
      notifyListeners();
    }

    try {
      final updatedJob = await _jobService.fetchCurrentJob();

      // Preserve active pickup index if the same job is reloaded
      final sameJob =
          updatedJob != null &&
          _job != null &&
          updatedJob.jobDbId == _job!.jobDbId;

      _job = updatedJob;

      if (_job != null) {
        if (!sameJob) {
          // Different job or first load — reset to first pending
          _setActiveToFirstPending();
        } else {
          // Same job — keep the current index but clamp to valid range
          _activePickupIndex = _activePickupIndex.clamp(
            0,
            _job!.pickups.length,
          );
        }
      } else {
        _activePickupIndex = 0;
      }

      if (!silent) _error = null;
    } catch (e) {
      if (!silent) _error = e.toString();
    } finally {
      if (!silent) {
        _isLoading = false;
      }
      _jobDataEpoch++;
      notifyListeners();
    }
  }

  // ── Session start ─────────────────────────────────────────────────────────

  Future<void> ensureSessionStarted() async {
    final job = _job;
    if (job == null) return;
    if (job.sessionId.isNotEmpty) return;

    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      await _jobService.startSession(
        jobDbId: job.jobDbId,
        direction: job.direction,
      );
      _job = await _jobService.fetchCurrentJob();
      if (_job != null) _setActiveToFirstPending();
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // ── Navigation ────────────────────────────────────────────────────────────

  Future<void> navigateFullRoute() async {
    if (_job == null) return;
    final hasPermission = await _locationService.ensurePermission();
    if (!hasPermission) {
      _error = 'Location permission required for navigation.';
      notifyListeners();
      return;
    }
    await _navService.openFullRoute(
      pickups: _job!.pickups,
      dropoff: _job!.dropoffs.isNotEmpty ? _job!.dropoffs.first : null,
    );
  }

  Future<void> navigateToCurrentPickup() async {
    final stop = activePickup;
    if (stop == null) return;
    if (!stop.hasCoordinates) {
      _error = 'No GPS coordinates for this stop.';
      notifyListeners();
      return;
    }
    final hasPermission = await _locationService.ensurePermission();
    if (!hasPermission) {
      _error = 'Location permission required for tracking.';
      notifyListeners();
      return;
    }
    await _navService.openSingleStop(lat: stop.lat!, lng: stop.lng!);
    _startPickupTracking(stop);
  }

  Future<void> navigateToDropoff() async {
    final dropoff = _job?.currentDropoff;
    if (dropoff == null) return;
    if (!dropoff.hasCoordinates) {
      _error = 'No GPS coordinates for drop-off.';
      notifyListeners();
      return;
    }
    final hasPermission = await _locationService.ensurePermission();
    if (!hasPermission) {
      _error = 'Location permission required for tracking.';
      notifyListeners();
      return;
    }
    await _navService.openSingleStop(lat: dropoff.lat!, lng: dropoff.lng!);
    _startDropoffTracking(dropoff);
  }

  // ── Status mutations ──────────────────────────────────────────────────────

  Future<void> markCurrentAsCompleted() async {
    if (_job == null) return;
    await ensureSessionStarted();

    try {
      final stop = _job!.pickups[_activePickupIndex];
      if (stop.id.isEmpty) {
        _error = 'Session not ready. Please try again.';
        notifyListeners();
        return;
      }
      await _jobService.updatePickupStatus(stop.id, PickupStatus.completed);
      // Optimistic update — realtime will confirm
      _job!.pickups[_activePickupIndex].status = PickupStatus.completed;
      _error = null;
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      notifyListeners();
    }
  }

  Future<void> markCurrentAsNotPicked() async {
    if (_job == null) return;
    await ensureSessionStarted();

    try {
      final stop = _job!.pickups[_activePickupIndex];
      if (stop.id.isEmpty) {
        _error = 'Session not ready. Please try again.';
        notifyListeners();
        return;
      }
      await _jobService.updatePickupStatus(stop.id, PickupStatus.notPicked);
      _job!.pickups[_activePickupIndex].status = PickupStatus.notPicked;
      _error = null;
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      notifyListeners();
    }
  }

  /// Marks the current pending dropoff as completed.
  ///
  /// - Inbound: updates a single job_session_passengers row by ID.
  /// - Outbound: bulk-updates ALL passengers sharing the same school address
  ///   via updateDropoffStatusForSchool() — because the entire group is
  ///   dropped off at the same school simultaneously.
  Future<void> markDropoffAsCompleted() async {
    final dropoff = _job?.currentDropoff;
    if (dropoff == null) return;

    try {
      if (_job!.isInbound) {
        // Inbound: single passenger row update
        await _jobService.updateDropoffStatus(
          dropoff.id,
          DropoffStatus.completed,
        );
      } else {
        // Outbound: bulk update all passengers going to this school
        await _jobService.updateDropoffStatusForSchool(
          sessionId: _job!.sessionId,
          schoolAddress: dropoff.address,
        );
      }
      // Optimistic update — realtime will confirm
      dropoff.status = DropoffStatus.completed;
      _error = null;
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      notifyListeners();
    }
  }

  bool advanceToNextPickup() {
    if (_job == null) return false;

    BackgroundLocationTask.stop();
    _isTracking = false;
    _currentDistanceMeters = null;

    for (int i = _activePickupIndex + 1; i < _job!.pickups.length; i++) {
      if (_job!.pickups[i].status == PickupStatus.pending) {
        _activePickupIndex = i;
        notifyListeners();
        return true;
      }
    }
    _activePickupIndex = _job!.pickups.length;
    notifyListeners();
    return false;
  }

  Future<void> completeCurrentJob({String? comments}) async {
    if (_job == null) return;
    if (_job!.sessionId.isEmpty) {
      _error = 'No active session to complete.';
      notifyListeners();
      return;
    }

    await BackgroundLocationTask.stop();
    _isTracking = false;

    try {
      await _jobService.completeJob(
        sessionId: _job!.sessionId,
        comments: comments,
      );
      _error = null;
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      rethrow;
    }
  }

  void reset() {
    BackgroundLocationTask.stop();
    _job = null;
    _activePickupIndex = 0;
    _isTracking = false;
    _currentDistanceMeters = null;
    notifyListeners();
  }

  // ── Background tracking ───────────────────────────────────────────────────

  void _startPickupTracking(PickupStop stop) {
    _isTracking = true;
    _currentDistanceMeters = null;
    notifyListeners();

    BackgroundLocationTask.start(
      targetLat: stop.lat!,
      targetLng: stop.lng!,
      onDistanceUpdate: (distance) {
        _currentDistanceMeters = distance;
        notifyListeners();
      },
      onArrived: () async {
        await markCurrentAsCompleted();
        await NotificationService().showArrivalNotification(
          stop.locationName,
          isPickup: true,
        );
        _isTracking = false;
        _currentDistanceMeters = null;
        notifyListeners();
      },
    );
  }

  void _startDropoffTracking(DropoffStop dropoff) {
    _isTracking = true;
    _currentDistanceMeters = null;
    notifyListeners();

    BackgroundLocationTask.start(
      targetLat: dropoff.lat!,
      targetLng: dropoff.lng!,
      onDistanceUpdate: (distance) {
        _currentDistanceMeters = distance;
        notifyListeners();
      },
      onArrived: () async {
        await markDropoffAsCompleted();
        await NotificationService().showArrivalNotification(
          dropoff.address,
          isPickup: false,
        );
        _isTracking = false;
        _currentDistanceMeters = null;
        notifyListeners();
      },
    );
  }

  void _setActiveToFirstPending() {
    if (_job == null || _job!.pickups.isEmpty) {
      _activePickupIndex = 0;
      return;
    }
    final idx = _job!.pickups.indexWhere(
      (p) => p.status == PickupStatus.pending,
    );
    _activePickupIndex = idx == -1 ? _job!.pickups.length : idx;
  }

  @override
  void dispose() {
    _reloadDebounce?.cancel();
    _jobSub?.cancel();
    _sessionSub?.cancel();
    _passengerSub?.cancel();
    BackgroundLocationTask.stop();
    super.dispose();
  }
}
