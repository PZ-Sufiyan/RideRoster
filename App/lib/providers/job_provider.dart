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
///
/// Arrival behaviour (pickup and dropoff tracking):
///   When the driver enters the threshold radius, tracking stops and a
///   notification is shown. The driver must still tap the action button
///   ("Pickup complete" / "Arrived at Drop-off") to confirm.
///   Auto-completing on arrival was removed because:
///     - GPS accuracy in urban areas can drift ±20–50 m.
///     - Drivers sometimes pass close to an address without stopping.
///     - A wrongly auto-confirmed pickup is difficult to undo.
///   [hasArrivedAtPickup] and [hasArrivedAtDropoff] expose arrival state
///   so the UI can highlight the confirm button or show a banner.
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

  /// True after the driver has entered the pickup threshold radius.
  /// Cleared when tracking starts for the next stop or on job reset.
  bool _hasArrivedAtPickup = false;

  /// True after the driver has entered the dropoff threshold radius.
  /// Cleared when tracking starts for a new dropoff or on job reset.
  bool _hasArrivedAtDropoff = false;

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

  /// True once the driver has entered the arrival radius for the current pickup.
  /// UI can use this to highlight the "Pickup complete" button.
  bool get hasArrivedAtPickup => _hasArrivedAtPickup;

  /// True once the driver has entered the arrival radius for the current dropoff.
  /// UI can use this to highlight the "Arrived at Drop-off" button.
  bool get hasArrivedAtDropoff => _hasArrivedAtDropoff;

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
    _jobSub = _realtimeService.onJobChange.listen((_) {
      _scheduleReload();
    });

    _sessionSub = _realtimeService.onSessionChange.listen((_) {
      _scheduleReload();
    });

    _passengerSub = _realtimeService.onPassengerChange.listen((record) {
      final sessionId = record['session_id']?.toString() ?? '';
      final currentSessionId = _job?.sessionId ?? '';
      if (currentSessionId.isNotEmpty && sessionId == currentSessionId) {
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

  // ── Load ──────────────────────────────────────────────────────────────────

  Future<void> loadJob({bool silent = false}) async {
    if (!silent) {
      _isLoading = true;
      _error = null;
      notifyListeners();
    }

    try {
      final updatedJob = await _jobService.fetchCurrentJob();

      final sameJob =
          updatedJob != null &&
          _job != null &&
          updatedJob.jobDbId == _job!.jobDbId;

      _job = updatedJob;

      if (_job != null) {
        if (!sameJob) {
          _setActiveToFirstPending();
        } else {
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

  /// Lightweight refresh hook for pages that mutate job approval/request
  /// state outside this provider (e.g. requested jobs review flow).
  Future<void> refreshJobDataSilently() async {
    await loadJob(silent: true);
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

  /// Launches Google Maps to the current pickup stop and starts proximity
  /// tracking. When the driver enters the arrival radius, tracking stops and
  /// a notification fires — but the pickup is NOT auto-completed.
  /// The driver must tap "Pickup complete" in the UI to confirm.
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
    _hasArrivedAtPickup = false;
    await _navService.openSingleStop(lat: stop.lat!, lng: stop.lng!);
    _startPickupTracking(stop);
  }

  /// Launches Google Maps to the current dropoff stop and starts proximity
  /// tracking. When the driver enters the arrival radius, tracking stops and
  /// a notification fires — but the dropoff is NOT auto-completed.
  /// The driver must tap the confirm button in complete_job_page.
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
    _hasArrivedAtDropoff = false;
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
      _hasArrivedAtPickup = false;
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
      _hasArrivedAtPickup = false;
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
  ///   via updateDropoffStatusForSchool().
  Future<void> markDropoffAsCompleted() async {
    final dropoff = _job?.currentDropoff;
    if (dropoff == null) return;

    try {
      if (_job!.isInbound) {
        await _jobService.updateDropoffStatus(
          dropoff.id,
          DropoffStatus.completed,
        );
      } else {
        await _jobService.updateDropoffStatusForSchool(
          sessionId: _job!.sessionId,
          schoolAddress: dropoff.address,
        );
      }
      dropoff.status = DropoffStatus.completed;
      _hasArrivedAtDropoff = false;
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
    _hasArrivedAtPickup = false;

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
    _hasArrivedAtPickup = false;
    _hasArrivedAtDropoff = false;
    notifyListeners();
  }

  // ── Background tracking ───────────────────────────────────────────────────
  //
  // Both _startPickupTracking and _startDropoffTracking follow the same
  // pattern:
  //   1. Stream GPS ticks and update _currentDistanceMeters for live display.
  //   2. When threshold is reached: stop tracking, fire a notification, set
  //      the arrived flag so the UI can highlight the confirm button.
  //   3. Do NOT call any mark*AsCompleted method — the driver confirms manually.

  void _startPickupTracking(PickupStop stop) {
    _isTracking = true;
    _currentDistanceMeters = null;
    _hasArrivedAtPickup = false;
    notifyListeners();

    BackgroundLocationTask.start(
      targetLat: stop.lat!,
      targetLng: stop.lng!,
      onDistanceUpdate: (distance) {
        _currentDistanceMeters = distance;
        notifyListeners();
      },
      onArrived: () async {
        // Stop tracking — driver is at the stop.
        // Show a notification so they know even if the app is in the background.
        // Do NOT auto-complete: driver taps "Pickup complete" to confirm.
        _isTracking = false;
        _currentDistanceMeters = null;
        _hasArrivedAtPickup = true;
        await NotificationService().showArrivalNotification(
          stop.locationName,
          isPickup: true,
        );
        notifyListeners();
      },
    );
  }

  void _startDropoffTracking(DropoffStop dropoff) {
    _isTracking = true;
    _currentDistanceMeters = null;
    _hasArrivedAtDropoff = false;
    notifyListeners();

    BackgroundLocationTask.start(
      targetLat: dropoff.lat!,
      targetLng: dropoff.lng!,
      onDistanceUpdate: (distance) {
        _currentDistanceMeters = distance;
        notifyListeners();
      },
      onArrived: () async {
        // Stop tracking — driver is at the dropoff location.
        // Show a notification. Driver taps the confirm button to record dropoff.
        _isTracking = false;
        _currentDistanceMeters = null;
        _hasArrivedAtDropoff = true;
        await NotificationService().showArrivalNotification(
          dropoff.address,
          isPickup: false,
        );
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
