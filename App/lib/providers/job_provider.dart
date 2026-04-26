import 'package:flutter/foundation.dart';
import '../users/driver/models/job_model.dart';
import '../services/job_service.dart';
import '../services/navigation_service.dart';
import '../services/location_service.dart';
import '../services/location_task.dart';
import '../services/notification_service.dart';

/// Manages the active job state for the driver flow.
/// All pages read from and write to this single provider.
class JobProvider extends ChangeNotifier {
  final JobService _jobService = JobService();
  final NavigationService _navService = NavigationService();
  final LocationService _locationService = LocationService();

  JobModel? _job;
  bool _isLoading = false;
  String? _error;
  int _activePickupIndex = 0;

  /// True while background GPS tracking is active for any stop.
  bool _isTracking = false;

  /// Distance to the current tracking target in metres (for optional UI display).
  double? _currentDistanceMeters;

  // ── Public getters ────────────────────────────────────────────────────────

  JobModel? get job => _job;
  bool get isLoading => _isLoading;
  String? get error => _error;
  int get activePickupIndex => _activePickupIndex;
  bool get isTracking => _isTracking;
  double? get currentDistanceMeters => _currentDistanceMeters;

  /// The pickup stop currently shown in PickupQuePage / PickupPage.
  PickupStop? get activePickup {
    if (_job == null || _job!.pickups.isEmpty) return null;
    if (_activePickupIndex < 0 || _activePickupIndex >= _job!.pickups.length) {
      return null;
    }
    final current = _job!.pickups[_activePickupIndex];
    if (current.status != PickupStatus.pending) return null;
    return current;
  }

  /// Pending pickups after the current active one (shown greyed out in queue).
  List<PickupStop> get upcomingPickups {
    if (_job == null) return [];
    return _job!.pickups
        .skip(_activePickupIndex + 1)
        .where((p) => p.status == PickupStatus.pending)
        .toList();
  }

  /// True when all pickups are either completed or not picked.
  bool get allResolved => _job?.allPickupsResolved ?? false;

  // ── Load ─────────────────────────────────────────────────────────────────

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

  // ── Navigation ────────────────────────────────────────────────────────────

  /// Opens Google Maps with ALL pickup stops + dropoff as waypoints.
  /// Called from RouteDetailPage "Start Navigation" button.
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

  /// Opens Google Maps from current location → active pickup stop only.
  /// Called from PickupPage "Navigate" button.
  /// Also starts background arrival tracking for this stop.
  Future<void> navigateToCurrentPickup() async {
    final stop = activePickup;
    if (stop == null) return;

    if (!stop.hasCoordinates) {
      _error = 'No GPS coordinates for this stop.';
      notifyListeners();
      return;
    }

    // Check location permission before anything else.
    final hasPermission = await _locationService.ensurePermission();
    if (!hasPermission) {
      _error = 'Location permission required for tracking.';
      notifyListeners();
      return;
    }

    // Open Google Maps.
    await _navService.openSingleStop(lat: stop.lat!, lng: stop.lng!);

    // Start background tracking for this pickup stop.
    _startPickupTracking(stop);
  }

  /// Opens Google Maps from current location → first pending dropoff.
  /// Called from CompleteJobPage "Navigate to Drop-off" button.
  /// Also starts background arrival tracking for the dropoff.
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

  /// Marks the current pickup as [PickupStatus.completed].
  Future<void> markCurrentAsCompleted() async {
    if (_job == null) return;
    try {
      final stop = _job!.pickups[_activePickupIndex];
      await _jobService.updatePickupStatus(stop.id, PickupStatus.completed);
      _job!.pickups[_activePickupIndex].status = PickupStatus.completed;
      _error = null;
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      notifyListeners();
    }
  }

  /// Marks the current pickup as [PickupStatus.notPicked].
  Future<void> markCurrentAsNotPicked() async {
    if (_job == null) return;
    try {
      final stop = _job!.pickups[_activePickupIndex];
      await _jobService.updatePickupStatus(stop.id, PickupStatus.notPicked);
      _job!.pickups[_activePickupIndex].status = PickupStatus.notPicked;
      _error = null;
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      notifyListeners();
    }
  }

  /// Marks the current (first pending) dropoff as completed.
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

    // Stop any existing tracking — we're moving to a new stop.
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
    if (_job == null || _job!.backendJobId.isEmpty) return;

    // Stop any active tracking.
    await BackgroundLocationTask.stop();
    _isTracking = false;

    try {
      await _jobService.completeJob(
        backendJobId: _job!.backendJobId,
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

  /// Reset the job (e.g. after job completion).
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
        // Auto-complete the pickup in DB.
        await markCurrentAsCompleted();

        // Fire local notification.
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
