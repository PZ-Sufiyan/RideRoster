import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../model/job_model.dart';
import '../repositories/cache_repository.dart';
import '../repositories/local_job_repository.dart';
import '../services/connectivity_service.dart';
import '../services/realtime_service.dart';
import '../services/navigation_service.dart';
import '../services/location_service.dart';
import '../services/location_task.dart';
import '../services/notification_service.dart';

/// Manages active job + session state for the driver flow.
///
/// All reads and writes go through [LocalJobRepository] (drift-backed).
/// [LocalJobRepository] writes locally first and enqueues a sync_queue op —
/// so every mutation works identically whether online or offline.
///
/// [RealtimeService] still subscribes when online and triggers silent
/// reloads, which read from the local DB (already up to date from optimistic
/// writes). This means the UI stays consistent without needing a round-trip.
class JobProvider extends ChangeNotifier {
  final LocalJobRepository _localRepo;
  final CacheRepository _cacheRepo;
  final RealtimeService _realtimeService = RealtimeService();
  final NavigationService _navService = NavigationService();
  final LocationService _locationService = LocationService();

  JobModel? _job;
  bool _isLoading = false;
  String? _error;
  bool _hasLoadedOnce = false;
  String? _lastLoadedDayKey;
  bool _checklistCompletedToday = false;

  int _jobDataEpoch = 0;
  int _activePickupIndex = 0;
  bool _isTracking = false;
  double? _currentDistanceMeters;
  bool _hasArrivedAtPickup = false;
  bool _hasArrivedAtDropoff = false;
  String? _trackingPickupStopId;

  StreamSubscription<Map<String, dynamic>>? _jobSub;
  StreamSubscription<Map<String, dynamic>>? _sessionSub;
  StreamSubscription<Map<String, dynamic>>? _passengerSub;
  StreamSubscription<void>? _reconnectSub;
  StreamSubscription<bool>? _onlineSub;
  StreamSubscription<AuthState>? _authSub;
  Timer? _reloadDebounce;
  bool _serverRefreshInFlight = false;

  JobProvider({
    required LocalJobRepository localRepo,
    required CacheRepository cacheRepo,
  }) : _localRepo = localRepo,
       _cacheRepo = cacheRepo {
    _listenToRealtime();
    _reconnectSub = ConnectivityService().onReconnect.listen((_) {
      _refreshFromServerInBackground();
    });
    _authSub = Supabase.instance.client.auth.onAuthStateChange.listen((event) {
      if (event.session?.user.id == null) return;
      if (!_hasLoadedOnce) {
        loadJob();
      }
    });
    _onlineSub = ConnectivityService().onlineStream.listen((online) {
      if (online) _refreshFromServerInBackground();
    });
  }

  // ── Public getters ────────────────────────────────────────────────────────

  JobModel? get job => _job;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get hasLoadedOnce => _hasLoadedOnce;
  bool get checklistCompletedToday => _checklistCompletedToday;
  int get jobDataEpoch => _jobDataEpoch;
  int get activePickupIndex => _activePickupIndex;
  bool get isTracking => _isTracking;
  double? get currentDistanceMeters => _currentDistanceMeters;
  bool get sessionStarted => _job != null && _job!.sessionId.isNotEmpty;
  bool get hasArrivedAtPickup => _hasArrivedAtPickup;
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
  // Realtime still fires when online — it triggers a silent local reload,
  // which is cheap because it reads from drift, not Supabase.

  void _listenToRealtime() {
    _jobSub = _realtimeService.onJobChange.listen((record) {
      _handleJobTableChange(record);
      _scheduleReload();
    });
    _sessionSub = _realtimeService.onSessionChange.listen(
      (_) => _scheduleReload(),
    );
    _passengerSub = _realtimeService.onPassengerChange.listen((record) {
      final sessionId = record['session_id']?.toString() ?? '';
      final currentSessionId = _job?.sessionId ?? '';
      if (currentSessionId.isNotEmpty && sessionId == currentSessionId) {
        _scheduleReload();
      }
    });
  }

  /// Jobs-table updates include assignment changes. Clear the current job
  /// immediately when this driver is removed so schedule sync cannot flash
  /// stale UI before [ensureFresh] finishes.
  void _handleJobTableChange(Map<String, dynamic> record) {
    if (!record.containsKey('assigned_driver_id') &&
        !record.containsKey('driver_approval_status')) {
      return;
    }

    final userId = Supabase.instance.client.auth.currentUser?.id;
    if (userId == null || userId.isEmpty) return;

    final recordJobId = record['id']?.toString();
    if (recordJobId == null || recordJobId.isEmpty) return;
    if (_job == null || _job!.jobDbId != recordJobId) return;

    final assignedDriverId = record['assigned_driver_id']?.toString();
    final approval = record['driver_approval_status']?.toString();
    if (assignedDriverId != userId || approval != 'accepted') {
      _job = null;
      _activePickupIndex = 0;
      notifyListeners();
    }
  }

  void _scheduleReload() {
    _reloadDebounce?.cancel();
    _reloadDebounce = Timer(const Duration(milliseconds: 400), () {
      loadJob(silent: true);
    });
  }

  // ── Load — local DB first, server refresh in background ───────────────────

  Future<void> loadJob({bool silent = false}) async {
    final userId = Supabase.instance.client.auth.currentUser?.id;
    if (userId == null || userId.isEmpty) return;

    final todayKey = _todayKey(DateTime.now());
    if (_lastLoadedDayKey != null && _lastLoadedDayKey != todayKey) {
      _job = null;
      _activePickupIndex = 0;
      _hasArrivedAtPickup = false;
      _hasArrivedAtDropoff = false;
      _isTracking = false;
      _currentDistanceMeters = null;
      _trackingPickupStopId = null;
      _checklistCompletedToday = false;
      _error = null;
      await _localRepo.clearWriteTablesForNewDay();
      notifyListeners();
    }

    final blockUiWithLoading = !silent && _job == null && !_hasLoadedOnce;
    if (blockUiWithLoading) {
      _isLoading = true;
      _error = null;
      notifyListeners();
    }

    try {
      final results = await Future.wait<dynamic>([
        _localRepo.fetchCurrentJob(userId),
        _localRepo.isChecklistCompletedToday(userId),
      ]);
      final updatedJob = results[0] as JobModel?;
      _checklistCompletedToday = results[1] as bool;

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
      _error = null;
    } catch (e) {
      if (blockUiWithLoading) _error = e.toString();
    } finally {
      if (blockUiWithLoading) _isLoading = false;
      _lastLoadedDayKey = todayKey;
      _hasLoadedOnce = true;
      _jobDataEpoch++;
      notifyListeners();
    }

    _refreshFromServerInBackground();
  }

  /// Pulls server truth into the cache, then silently re-reads local tables.
  /// Never blocks the first paint — call only after local data is on screen.
  Future<void> _refreshFromServerInBackground() async {
    if (_serverRefreshInFlight) return;
    if (!ConnectivityService().canReachServer) return;

    final userId = Supabase.instance.client.auth.currentUser?.id;
    if (userId == null || userId.isEmpty) return;

    _serverRefreshInFlight = true;
    try {
      await _cacheRepo.ensureFresh();

      final assignmentRevokedMessage = await _localRepo.discardStaleLocalWork(
        userId,
      );

      try {
        await _localRepo.ensureChecklistCachedFromServer(userId);
      } catch (_) {}

      await _reloadJobFromLocal(userId);

      if (assignmentRevokedMessage != null && _job == null) {
        _error = assignmentRevokedMessage;
        _jobDataEpoch++;
        notifyListeners();
      }
    } catch (_) {
      // Local cache remains authoritative until the next reconnect.
    } finally {
      _serverRefreshInFlight = false;
    }
  }

  Future<void> _reloadJobFromLocal(String userId) async {
    try {
      final results = await Future.wait<dynamic>([
        _localRepo.fetchCurrentJob(userId),
        _localRepo.isChecklistCompletedToday(userId),
      ]);
      final updatedJob = results[0] as JobModel?;
      _checklistCompletedToday = results[1] as bool;

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

      _jobDataEpoch++;
      notifyListeners();
    } catch (_) {}
  }

  Future<void> refreshJobDataSilently() async => loadJob(silent: true);

  // ── Session start ─────────────────────────────────────────────────────────

  Future<void> ensureSessionStarted() async {
    final job = _job;
    if (job == null) return;

    final userId = Supabase.instance.client.auth.currentUser?.id ?? '';
    if (userId.isEmpty) return;

    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      // Idempotent — creates session if missing, or re-enqueues sync when
      // passengers still lack server IDs.
      await _localRepo.startSessionLocally(
        jobId: job.jobDbId,
        direction: job.direction,
        driverId: userId,
      );
      _job = await _localRepo.fetchCurrentJob(userId);
      if (_job != null) _setActiveToFirstPending();
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // ── Navigation (unchanged) ────────────────────────────────────────────────

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

  /// Starts background distance tracking toward the active pickup so arrival
  /// notifications fire even when the driver does not open Google Maps.
  Future<void> startTrackingCurrentPickup() async {
    final stop = activePickup;
    if (stop == null) return;
    if (!stop.hasCoordinates) return;

    if (_trackingPickupStopId == stop.id &&
        (_isTracking || _hasArrivedAtPickup)) {
      return;
    }

    final hasPermission = await _locationService.ensurePermission();
    if (!hasPermission) {
      _error = 'Location permission required for arrival tracking.';
      notifyListeners();
      return;
    }

    _startPickupTracking(stop);
  }

  Future<void> navigateToCurrentPickup() async {
    final stop = activePickup;
    if (stop == null) return;
    if (!stop.hasCoordinates) {
      _error = 'No GPS coordinates for this stop.';
      notifyListeners();
      return;
    }
    await _navService.openSingleStop(lat: stop.lat!, lng: stop.lng!);
    await startTrackingCurrentPickup();
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
    _hasArrivedAtDropoff = false;
    await _navService.openSingleStop(lat: dropoff.lat!, lng: dropoff.lng!);
    _startDropoffTracking(dropoff);
  }

  // ── Status mutations — write-first via LocalJobRepository ─────────────────

  Future<void> markCurrentAsCompleted() async {
    if (_job == null) return;
    await ensureSessionStarted();

    try {
      final stop = _job!.pickups[_activePickupIndex];
      // Resolve the local session ID, then find the passenger's local row ID.
      final localSessionId = await _localRepo.resolveLocalSessionIdAsync(
        _job!.sessionId,
      );
      final localId =
          await _localRepo.resolvePassengerLocalIdFromStopId(
            localSessionId: localSessionId,
            stopId: stop.id,
          ) ??
          stop.id;

      if (localId.isEmpty) {
        _error = 'Session not ready. Please try again.';
        notifyListeners();
        return;
      }
      await _localRepo.updatePickupStatusLocally(
        passengerLocalId: localId,
        status: PickupStatus.completed,
        localSessionId: localSessionId,
      );
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
      final localSessionId = await _localRepo.resolveLocalSessionIdAsync(
        _job!.sessionId,
      );
      final localId =
          await _localRepo.resolvePassengerLocalIdFromStopId(
            localSessionId: localSessionId,
            stopId: stop.id,
          ) ??
          stop.id;
      if (localId.isEmpty) {
        _error = 'Session not ready. Please try again.';
        notifyListeners();
        return;
      }
      await _localRepo.updatePickupStatusLocally(
        passengerLocalId: localId,
        status: PickupStatus.notPicked,
        localSessionId: localSessionId,
      );
      _job!.pickups[_activePickupIndex].status = PickupStatus.notPicked;
      _hasArrivedAtPickup = false;
      _error = null;
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      notifyListeners();
    }
  }

  /// Saves extended wait minutes for the active pickup (status stays pending).
  Future<void> saveExtendedWait({required int minutes}) async {
    if (_job == null || minutes <= 0) return;
    await ensureSessionStarted();

    try {
      final stop = _job!.pickups[_activePickupIndex];
      final localSessionId = await _localRepo.resolveLocalSessionIdAsync(
        _job!.sessionId,
      );
      final localId =
          await _localRepo.resolvePassengerLocalIdFromStopId(
            localSessionId: localSessionId,
            stopId: stop.id,
          ) ??
          stop.id;
      if (localId.isEmpty) {
        _error = 'Session not ready. Please try again.';
        notifyListeners();
        return;
      }
      await _localRepo.saveExtendedWaitLocally(
        passengerLocalId: localId,
        minutes: minutes,
        localSessionId: localSessionId,
      );
      _error = null;
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      notifyListeners();
    }
  }

  Future<void> markDropoffAsCompleted() async {
    final dropoff = _job?.currentDropoff;
    if (dropoff == null) return;

    try {
      final localSessionId = await _localRepo.resolveLocalSessionIdAsync(
        _job!.sessionId,
      );

      if (_job!.isInbound) {
        await _localRepo.updateDropoffStatusLocally(
          passengerLocalId: dropoff.id,
          localSessionId: localSessionId,
        );
      } else {
        await _localRepo.updateDropoffStatusForSchoolLocally(
          localSessionId: localSessionId,
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
    _trackingPickupStopId = null;

    for (int i = _activePickupIndex + 1; i < _job!.pickups.length; i++) {
      if (_job!.pickups[i].status == PickupStatus.pending) {
        _activePickupIndex = i;
        notifyListeners();
        unawaited(startTrackingCurrentPickup());
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
      final localSessionId = await _localRepo.resolveLocalSessionIdAsync(
        _job!.sessionId,
      );
      await _localRepo.completeJobLocally(
        localSessionId: localSessionId,
        comments: comments,
      );
      _error = null;
      // Reload so outbound completion transitions to evening/inbound run.
      await loadJob(silent: true);
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      rethrow;
    }
  }

  void reset() {
    BackgroundLocationTask.stop();
    _job = null;
    _hasLoadedOnce = false;
    _lastLoadedDayKey = null;
    _checklistCompletedToday = false;
    _activePickupIndex = 0;
    _isTracking = false;
    _currentDistanceMeters = null;
    _hasArrivedAtPickup = false;
    _hasArrivedAtDropoff = false;
    _trackingPickupStopId = null;
    notifyListeners();
  }

  // ── Background tracking ───────────────────────────────────────────────────

  void _startPickupTracking(PickupStop stop) {
    final isNewStop = _trackingPickupStopId != stop.id;
    _trackingPickupStopId = stop.id;
    _isTracking = true;
    _currentDistanceMeters = null;
    if (isNewStop) _hasArrivedAtPickup = false;
    notifyListeners();

    BackgroundLocationTask.start(
      targetLat: stop.lat!,
      targetLng: stop.lng!,
      onDistanceUpdate: (distance) {
        _currentDistanceMeters = distance;
        notifyListeners();
      },
      onArrived: () async {
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

  String _todayKey(DateTime dt) =>
      '${dt.year.toString().padLeft(4, '0')}-'
      '${dt.month.toString().padLeft(2, '0')}-'
      '${dt.day.toString().padLeft(2, '0')}';

  @override
  void dispose() {
    _reloadDebounce?.cancel();
    _reconnectSub?.cancel();
    _onlineSub?.cancel();
    _authSub?.cancel();
    _jobSub?.cancel();
    _sessionSub?.cancel();
    _passengerSub?.cancel();
    BackgroundLocationTask.stop();
    super.dispose();
  }
}
