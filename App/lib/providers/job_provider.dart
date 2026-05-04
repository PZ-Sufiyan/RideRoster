import 'package:flutter/foundation.dart';
import '../users/driver/models/job_model.dart';
import '../services/job_service.dart';
import '../services/navigation_service.dart';
import '../services/location_service.dart';
import '../services/location_task.dart';
import '../services/notification_service.dart';

/// Manages active job + session state for the driver flow.
///
/// Key change from old model:
///   - [_job.sessionId] may be empty before the driver starts the run.
///   - Call [ensureSessionStarted] before any status mutation — it creates
///     the job_session + job_session_passengers rows if they don't exist yet,
///     then refreshes the job so stop IDs are populated.
///   - Status mutations now write to job_session_passengers (not job_pickups).
class JobProvider extends ChangeNotifier {
  final JobService _jobService = JobService();
  final NavigationService _navService = NavigationService();
  final LocationService _locationService = LocationService();

  JobModel? _job;
  bool _isLoading = false;
  String? _error;
  int _activePickupIndex = 0;

  bool _isTracking = false;
  double? _currentDistanceMeters;

  // ── Public getters ────────────────────────────────────────────────────────

  JobModel? get job => _job;
  bool get isLoading => _isLoading;
  String? get error => _error;
  int get activePickupIndex => _activePickupIndex;
  bool get isTracking => _isTracking;
  double? get currentDistanceMeters => _currentDistanceMeters;

  /// Whether a live session exists in the DB (session was started).
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

  // ── Load ──────────────────────────────────────────────────────────────────

  Future<void> loadJob() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _job = await _jobService.fetchCurrentJob();
      if (_job != null) {
        _setActiveToFirstPending();
      } else {
        _activePickupIndex = 0;
      }
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // ── Session start ─────────────────────────────────────────────────────────

  /// Ensures a job_session exists in the DB for today.
  ///
  /// Call this when the driver taps "Continue Journey" / "Start Job" for
  /// the first time. After creation the job is reloaded so all PickupStop.id
  /// values are real job_session_passengers UUIDs.
  ///
  /// Safe to call multiple times — the service upserts on the unique constraint.
  Future<void> ensureSessionStarted() async {
    final job = _job;
    if (job == null) return;

    // Session already started — nothing to do
    if (job.sessionId.isNotEmpty) return;

    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      await _jobService.startSession(
        jobDbId: job.jobDbId,
        direction: job.direction,
      );
      // Reload so stop IDs are populated from job_session_passengers
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

  /// Marks the current pickup as picked_up in job_session_passengers.
  /// Ensures a session exists first (creates one if needed).
  Future<void> markCurrentAsCompleted() async {
    if (_job == null) return;
    await ensureSessionStarted();

    try {
      final stop = _job!.pickups[_activePickupIndex];

      // If session was just created, stop.id is now populated after reload.
      if (stop.id.isEmpty) {
        _error = 'Session not ready. Please try again.';
        notifyListeners();
        return;
      }

      await _jobService.updatePickupStatus(stop.id, PickupStatus.completed);
      _job!.pickups[_activePickupIndex].status = PickupStatus.completed;
      _error = null;
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      notifyListeners();
    }
  }

  /// Marks the current pickup as missed in job_session_passengers.
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

  /// Marks the current dropoff as dropped_off in job_session_passengers.
  Future<void> markDropoffAsCompleted() async {
    final dropoff = _job?.currentDropoff;
    if (dropoff == null) return;

    try {
      await _jobService.updateDropoffStatus(
        dropoff.id,
        DropoffStatus.completed,
      );
      dropoff.status = DropoffStatus.completed;
      _error = null;
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      notifyListeners();
    }
  }

  /// Advances to the next pending pickup. Returns true if one exists.
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

  /// Completes the session — marks job_sessions.status = 'completed'.
  Future<void> completeCurrentJob({String? comments}) async {
    if (_job == null) return;

    // Must have a real session to complete
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
    BackgroundLocationTask.stop();
    super.dispose();
  }
}
