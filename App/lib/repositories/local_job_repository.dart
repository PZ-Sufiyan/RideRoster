import 'dart:convert';
import 'package:drift/drift.dart';
import 'package:uuid/uuid.dart';
import '../database/app_database.dart';
import '../../model/job_model.dart';
import '../../model/pa_job_model.dart';
import '../services/sync_scheduler.dart';
import '../services/connectivity_service.dart';
import '../services/vehicle_safety_check_service.dart';

/// Replaces the network calls in [JobService] with local drift reads/writes.
///
/// READS  → always from drift (cache + write tables).
/// WRITES → write to local tables first, then enqueue a sync_queue op.
///          When online, [SyncScheduler] flushes the queue immediately;
///          otherwise [SyncEngine] replays on reconnect.
///
/// [JobProvider] should call these methods instead of [JobService] directly.
/// The only time [JobService] is still called directly is inside [SyncEngine]
/// during queue processing.
class LocalJobRepository {
  final AppDatabase _db;
  static const _uuid = Uuid();

  LocalJobRepository(this._db);

  /// Exposed for [SyncEngine] internal queries only.
  AppDatabase get appDb => _db;

  // ── ID resolution helpers (used by JobProvider) ───────────────────────────

  /// Given a sessionId that may be either a local UUID or a server UUID,
  /// returns the [SessionsLocal.localId].
  ///
  /// JobModel.sessionId is the server ID when available, otherwise the local ID.
  /// This resolves back to the local ID so write operations use the correct FK.
  String resolveLocalSessionId(String sessionId) {
    // We can't do async here since it's called inline in mutations.
    // Instead, callers that need async resolution should call
    // resolveLocalSessionIdAsync.
    return sessionId; // fallback — see resolveLocalSessionIdAsync
  }

  /// Async version — looks up sessions_local by either localId or serverId.
  Future<String> resolveLocalSessionIdAsync(String sessionId) async {
    if (sessionId.isEmpty) return sessionId;

    // Try localId first (most common during an offline session)
    final byLocal = await (_db.select(
      _db.sessionsLocal,
    )..where((t) => t.localId.equals(sessionId))).getSingleOrNull();
    if (byLocal != null) return byLocal.localId;

    // Try serverId (session was created online and synced)
    final byServer = await (_db.select(
      _db.sessionsLocal,
    )..where((t) => t.serverId.equals(sessionId))).getSingleOrNull();
    if (byServer != null) return byServer.localId;

    return sessionId; // not found — return as-is
  }

  /// Looks up [PassengersLocal.localId] for a given session + passenger ID.
  Future<String?> resolvePassengerLocalId({
    required String localSessionId,
    required String passengerId,
  }) async {
    final row =
        await (_db.select(_db.passengersLocal)..where(
              (t) =>
                  t.localSessionId.equals(localSessionId) &
                  t.passengerId.equals(passengerId),
            ))
            .getSingleOrNull();
    return row?.localId;
  }

  // ── Fetch current job (from local cache) ──────────────────────────────────
  //
  // Mirrors JobService.fetchCurrentJob() but reads entirely from drift.
  // Returns null if no job is cached or no matching session/schedule exists.

  Future<JobModel?> fetchCurrentJob(String userId) async {
    final today = DateTime.now();
    final todayDate = _dateString(today);
    final weekday = _weekdayKey(today);

    // 1. Find the cached job for this driver
    final jobRow =
        await (_db.select(_db.jobsCache)
              ..where(
                (t) =>
                    t.assignedDriverId.equals(userId) &
                    t.status.isNotIn(['cancelled']) &
                    t.driverApprovalStatus.equalsNullable('accepted'),
              )
              ..limit(1))
            .getSingleOrNull();

    if (jobRow == null) return null;

    // 2. Find or determine the session direction
    final sessions =
        await (_db.select(_db.sessionsLocal)..where(
              (t) =>
                  t.jobId.equals(jobRow.id) & t.sessionDate.equals(todayDate),
            ))
            .get();

    final sessionMap = {for (final s in sessions) s.direction: s};
    final direction = _pickDirection(jobRow: jobRow, sessionMap: sessionMap);
    if (direction == null) return null;

    final existingSession = sessionMap[direction];
    final sessionLocalId = existingSession?.localId ?? '';
    final sessionServerId = existingSession?.serverId ?? '';
    // JobModel.sessionId should be the server ID when available, otherwise
    // the local ID so the provider can detect "not yet on server" state.
    final sessionId = sessionServerId.isNotEmpty
        ? sessionServerId
        : sessionLocalId;
    final sessionExists = sessionLocalId.isNotEmpty;

    // 3. Resolve schedules for today
    final scheduleRows = await _resolvedScheduleForDay(
      jobId: jobRow.id,
      weekday: weekday,
      direction: direction,
      todayDate: todayDate,
    );

    if (scheduleRows.isEmpty) return null;

    final scheduleByPassenger = {
      for (final s in scheduleRows) s.passengerId: s,
    };

    // 4. Build passenger row list
    List<PassengersLocalData> localPassengers = [];
    if (sessionExists) {
      localPassengers =
          await (_db.select(_db.passengersLocal)
                ..where((t) => t.localSessionId.equals(sessionLocalId))
                ..orderBy([
                  (t) => OrderingTerm(
                    expression: t.stopOrder,
                    mode: direction == 'outbound'
                        ? OrderingMode.asc
                        : OrderingMode.desc,
                  ),
                ]))
              .get();
    }

    // 5. Passenger profiles
    final passengerIds = scheduleRows.map((s) => s.passengerId).toList();
    final profiles = await (_db.select(
      _db.passengersCache,
    )..where((t) => t.id.isIn(passengerIds))).get();
    final profileMap = {for (final p in profiles) p.id: p};

    // 6. Build PickupStop list
    final pickups = <PickupStop>[];

    if (sessionExists) {
      for (final lp in localPassengers) {
        final profile = profileMap[lp.passengerId];
        final schedule = scheduleByPassenger[lp.passengerId];
        final fullName = _fullName(profile);
        final phone = profile?.contactNumber1 ?? '';
        final scheduledTime = _formatTime(schedule?.pickupTime);

        pickups.add(
          PickupStop(
            id: lp.serverId ?? lp.localId, // use server ID for mutations
            stopNumber: lp.stopOrder,
            passengerName: fullName.isEmpty ? 'Student' : fullName,
            passengerPhone: phone,
            locationName: lp.pickupAddress,
            address: lp.pickupAddress,
            eta: 'ETA pending',
            scheduledTime: scheduledTime,
            lat: lp.pickupLatitude,
            lng: lp.pickupLongitude,
            status: _toPickupStatus(lp.status),
          ),
        );
      }
    } else {
      // Preview from schedules — no session yet
      int order = 1;
      for (final s in scheduleRows) {
        final profile = profileMap[s.passengerId];
        final fullName = _fullName(profile);
        pickups.add(
          PickupStop(
            id: '',
            stopNumber: s.stopOrder ?? order,
            passengerName: fullName.isEmpty ? 'Student' : fullName,
            passengerPhone: profile?.contactNumber1 ?? '',
            locationName: s.pickupAddress,
            address: s.pickupAddress,
            eta: 'ETA pending',
            scheduledTime: _formatTime(s.pickupTime),
            lat: s.pickupLatitude,
            lng: s.pickupLongitude,
            status: PickupStatus.pending,
          ),
        );
        order++;
      }
    }

    // 7. Build DropoffStop list (mirrors JobService logic)
    final dropoffs = <DropoffStop>[];

    if (direction == 'outbound') {
      final schoolOrder = <String>[];
      final schoolPassengers = <String, List<PassengersLocalData>>{};
      final schoolMeta = <String, Map<String, dynamic>>{};

      for (final lp
          in (sessionExists ? localPassengers : <PassengersLocalData>[])) {
        final profile = profileMap[lp.passengerId];
        final schoolAddress = profile?.educationalSiteAddress ?? '';
        if (schoolAddress.isEmpty) continue;
        if (!schoolPassengers.containsKey(schoolAddress)) {
          schoolOrder.add(schoolAddress);
          schoolPassengers[schoolAddress] = [];
          schoolMeta[schoolAddress] = {
            'lat': profile?.educationalSiteLatitude,
            'lng': profile?.educationalSiteLongitude,
            'dropoff_time': profile?.educationalSiteDropoffTime,
          };
        }
        schoolPassengers[schoolAddress]!.add(lp);
      }

      int order = 1;
      for (final addr in schoolOrder) {
        final rows = schoolPassengers[addr]!;
        final meta = schoolMeta[addr]!;
        final allDropped =
            sessionExists && rows.every((r) => r.status == 'dropped_off');
        final pIds = rows.map((r) => r.passengerId).toList();
        dropoffs.add(
          DropoffStop(
            id: rows.first.serverId ?? rows.first.localId,
            dropoffOrder: order++,
            address: addr,
            scheduledTime: _formatTime(meta['dropoff_time']),
            lat: meta['lat'] as double?,
            lng: meta['lng'] as double?,
            passengerIds: pIds,
            status: allDropped
                ? DropoffStatus.completed
                : DropoffStatus.pending,
          ),
        );
      }
    } else {
      // Inbound: one dropoff per passenger home
      final source = sessionExists ? localPassengers : <PassengersLocalData>[];
      for (int i = 0; i < source.length; i++) {
        final lp = source[i];
        final profile = profileMap[lp.passengerId];
        final schedule = scheduleByPassenger[lp.passengerId];
        final homeAddress = lp.dropoffAddress;
        dropoffs.add(
          DropoffStop(
            id: lp.serverId ?? lp.localId,
            dropoffOrder: i + 1,
            address: homeAddress.isNotEmpty ? homeAddress : 'Home address',
            scheduledTime: _formatTime(schedule?.dropoffTime),
            lat: schedule?.dropoffLatitude,
            lng: schedule?.dropoffLongitude,
            passengerName: _fullName(profile),
            passengerIds: [lp.passengerId],
            status: _toDropoffStatus(lp.status),
          ),
        );
      }
    }

    // 8. PA name from cache
    final paName = await _fetchPaName(jobRow.assignedPaId);

    // 9. Derived display fields
    final nextPending = pickups
        .where((p) => p.status == PickupStatus.pending)
        .toList();
    final nextPickupTime = nextPending.isNotEmpty
        ? nextPending.first.scheduledTime
        : (dropoffs.isNotEmpty ? dropoffs.first.scheduledTime : '--:--');

    final primaryDropoffLocation = dropoffs.isEmpty
        ? ''
        : dropoffs.length == 1
        ? dropoffs.first.address
        : direction == 'outbound'
        ? '${dropoffs.length} schools'
        : '${dropoffs.length} home drop-offs';

    final primaryDropoffEta = dropoffs.isNotEmpty
        ? dropoffs.first.scheduledTime
        : '--:--';

    final displayJobId = jobRow.internalJobId ?? jobRow.id.substring(0, 8);

    return JobModel(
      jobDbId: jobRow.id,
      sessionId: sessionId,
      jobId: displayJobId,
      routeNumber: jobRow.jobName,
      paName: paName,
      nextPickupTime: nextPickupTime,
      totalEta: '',
      totalDistance: '',
      dropoffLocation: primaryDropoffLocation,
      dropoffEta: primaryDropoffEta,
      direction: direction,
      pickups: pickups,
      dropoffs: dropoffs,
    );
  }

  // ── Session start (write-first) ────────────────────────────────────────────

  /// Creates a local session row and snapshot passengers into [passengersLocal].
  /// Enqueues a [start_session] op for Supabase sync.
  /// Returns the [localId] of the created session.
  Future<String> startSessionLocally({
    required String jobId,
    required String direction,
    required String driverId,
  }) async {
    final today = DateTime.now();
    final todayDate = _dateString(today);
    final weekday = _weekdayKey(today);
    final localSessionId = _uuid.v4();
    final now = DateTime.now();

    // Check if session already exists locally for this job+date+direction
    final existing =
        await (_db.select(_db.sessionsLocal)..where(
              (t) =>
                  t.jobId.equals(jobId) &
                  t.sessionDate.equals(todayDate) &
                  t.direction.equals(direction),
            ))
            .getSingleOrNull();
    if (existing != null) return existing.localId;

    // Resolve today's schedule
    final scheduleRows = await _resolvedScheduleForDay(
      jobId: jobId,
      weekday: weekday,
      direction: direction,
      todayDate: todayDate,
    );

    final passengerIds = scheduleRows.map((s) => s.passengerId).toList();
    final profiles = await (_db.select(
      _db.passengersCache,
    )..where((t) => t.id.isIn(passengerIds))).get();
    final profileMap = {for (final p in profiles) p.id: p};

    await _db.transaction(() async {
      // Write session row
      await _db
          .into(_db.sessionsLocal)
          .insert(
            SessionsLocalCompanion.insert(
              localId: localSessionId,
              serverId: const Value(null),
              jobId: jobId,
              sessionDate: todayDate,
              direction: direction,
              driverId: driverId,
              startedAt: Value(now),
              isSynced: const Value(false),
            ),
          );

      // Snapshot passengers
      for (final s in scheduleRows) {
        final profile = profileMap[s.passengerId];
        final dropoffAddress = direction == 'outbound'
            ? (profile?.educationalSiteAddress ?? '')
            : (s.dropoffAddress);

        await _db
            .into(_db.passengersLocal)
            .insert(
              PassengersLocalCompanion.insert(
                localId: _uuid.v4(),
                serverId: const Value(null),
                localSessionId: localSessionId,
                passengerId: s.passengerId,
                stopOrder: s.stopOrder ?? 0,
                pickupAddress: s.pickupAddress,
                pickupPostcode: Value(s.pickupPostcode),
                pickupLatitude: Value(s.pickupLatitude),
                pickupLongitude: Value(s.pickupLongitude),
                dropoffAddress: dropoffAddress,
                dropoffPostcode: Value(s.dropoffPostcode),
                notes: Value(s.notes),
                isSynced: const Value(false),
              ),
            );
      }

      // Enqueue sync op (flush after transaction commits).
      await _insertSyncOp(
        opType: 'start_session',
        payload: {
          'local_session_id': localSessionId,
          'job_id': jobId,
          'direction': direction,
          'session_date': todayDate,
          'driver_id': driverId,
          'started_at': now.toIso8601String(),
        },
      );
    });

    await SyncScheduler.flushIfOnline();

    return localSessionId;
  }

  // ── Pickup status update (write-first) ────────────────────────────────────

  /// Updates a passenger's pickup status locally and enqueues sync.
  /// [passengerId] here is the [PassengersLocal.localId] or [serverId].
  Future<void> updatePickupStatusLocally({
    required String passengerLocalId,
    required PickupStatus status,
  }) async {
    final now = DateTime.now();
    final dbStatus = _dbPickupStatus(status);

    await (_db.update(
      _db.passengersLocal,
    )..where((t) => t.localId.equals(passengerLocalId))).write(
      PassengersLocalCompanion(
        status: Value(dbStatus),
        pickedUpAt: status == PickupStatus.completed
            ? Value(now)
            : const Value.absent(),
        updatedAt: Value(now),
        isSynced: const Value(false),
      ),
    );

    final row = await (_db.select(
      _db.passengersLocal,
    )..where((t) => t.localId.equals(passengerLocalId))).getSingleOrNull();
    if (row == null) return;

    await _enqueue(
      opType: 'pickup_status',
      payload: {
        'passenger_local_id': passengerLocalId,
        'passenger_server_id': row.serverId,
        'local_session_id': row.localSessionId,
        'status': dbStatus,
        'picked_up_at': status == PickupStatus.completed
            ? now.toIso8601String()
            : null,
      },
    );
  }

  // ── Dropoff status update — single (write-first) ──────────────────────────

  Future<void> updateDropoffStatusLocally({
    required String passengerLocalId,
  }) async {
    final now = DateTime.now();

    await (_db.update(
      _db.passengersLocal,
    )..where((t) => t.localId.equals(passengerLocalId))).write(
      PassengersLocalCompanion(
        status: const Value('dropped_off'),
        droppedOffAt: Value(now),
        updatedAt: Value(now),
        isSynced: const Value(false),
      ),
    );

    final row = await (_db.select(
      _db.passengersLocal,
    )..where((t) => t.localId.equals(passengerLocalId))).getSingleOrNull();
    if (row == null) return;

    await _enqueue(
      opType: 'dropoff_status',
      payload: {
        'passenger_local_id': passengerLocalId,
        'passenger_server_id': row.serverId,
        'local_session_id': row.localSessionId,
        'dropped_off_at': now.toIso8601String(),
      },
    );
  }

  // ── Dropoff status update — bulk school (write-first) ─────────────────────

  Future<void> updateDropoffStatusForSchoolLocally({
    required String localSessionId,
    required String schoolAddress,
  }) async {
    final now = DateTime.now();

    await (_db.update(_db.passengersLocal)..where(
          (t) =>
              t.localSessionId.equals(localSessionId) &
              t.dropoffAddress.equals(schoolAddress),
        ))
        .write(
          PassengersLocalCompanion(
            status: const Value('dropped_off'),
            droppedOffAt: Value(now),
            updatedAt: Value(now),
            isSynced: const Value(false),
          ),
        );

    // Get session server ID if available
    final session = await (_db.select(
      _db.sessionsLocal,
    )..where((t) => t.localId.equals(localSessionId))).getSingleOrNull();

    await _enqueue(
      opType: 'dropoff_status_bulk',
      payload: {
        'local_session_id': localSessionId,
        'server_session_id': session?.serverId,
        'school_address': schoolAddress,
        'dropped_off_at': now.toIso8601String(),
      },
    );
  }

  // ── Complete job (write-first) ─────────────────────────────────────────────

  Future<void> completeJobLocally({
    required String localSessionId,
    String? comments,
  }) async {
    final now = DateTime.now();

    // Mark any still-picked_up passengers as dropped_off
    await (_db.update(_db.passengersLocal)..where(
          (t) =>
              t.localSessionId.equals(localSessionId) &
              t.status.equals('picked_up'),
        ))
        .write(
          PassengersLocalCompanion(
            status: const Value('dropped_off'),
            droppedOffAt: Value(now),
            updatedAt: Value(now),
            isSynced: const Value(false),
          ),
        );

    // Mark session complete
    await (_db.update(
      _db.sessionsLocal,
    )..where((t) => t.localId.equals(localSessionId))).write(
      SessionsLocalCompanion(
        status: const Value('completed'),
        completedAt: Value(now),
        updatedAt: Value(now),
        isSynced: const Value(false),
      ),
    );

    final session = await (_db.select(
      _db.sessionsLocal,
    )..where((t) => t.localId.equals(localSessionId))).getSingleOrNull();

    await _enqueue(
      opType: 'complete_job',
      payload: {
        'local_session_id': localSessionId,
        'server_session_id': session?.serverId,
        'completed_at': now.toIso8601String(),
        'comments': comments ?? '',
      },
    );
  }

  // ── Checklist (write-first) ────────────────────────────────────────────────

  Future<String> saveChecklistLocally({
    required String driverId,
    required String vehicleId,
    required String vehicleCompanyId,
    required Map<String, String> checksPassFail,
    String? existingLocalId,
  }) async {
    final allPass = checksPassFail.values.every((v) => v == 'pass');
    final status = allPass ? 'completed' : 'incomplete';
    final now = DateTime.now();
    final todayDate = _dateString(now);
    final localId = existingLocalId ?? _uuid.v4();

    await _db
        .into(_db.checklistLocal)
        .insertOnConflictUpdate(
          ChecklistLocalCompanion.insert(
            id: localId,
            driverId: driverId,
            vehicleId: vehicleId,
            vehicleCompanyId: vehicleCompanyId,
            sessionDate: todayDate,
            checksJson: jsonEncode(checksPassFail),
            status: status,
            isLocked: Value(allPass),
            isSynced: const Value(false),
            updatedAt: Value(now),
          ),
        );

    await _enqueue(
      opType: 'save_checklist',
      payload: {
        'local_id': localId,
        'driver_id': driverId,
        'vehicle_id': vehicleId,
        'vehicle_company_id': vehicleCompanyId,
        'checks': checksPassFail,
        'status': status,
        'all_pass': allPass,
        'updated_at': now.toIso8601String(),
      },
    );

    return localId;
  }

  // ── Checklist read helpers ─────────────────────────────────────────────────

  Future<ChecklistLocalData?> fetchChecklistForToday(String driverId) async {
    final todayDate = _dateString(DateTime.now());
    return (_db.select(_db.checklistLocal)
          ..where(
            (t) =>
                t.driverId.equals(driverId) & t.sessionDate.equals(todayDate),
          )
          ..orderBy([(t) => OrderingTerm.desc(t.updatedAt)])
          ..limit(1))
        .getSingleOrNull();
  }

  Future<bool> isChecklistCompletedToday(String driverId) async {
    final row = await fetchChecklistForToday(driverId);
    return row?.isLocked ?? false;
  }

  /// After logout the local checklist row is wiped — pull today's row from
  /// Supabase when online so the dashboard reflects server truth.
  Future<void> ensureChecklistCachedFromServer(String driverId) async {
    if (driverId.trim().isEmpty) return;
    if (await fetchChecklistForToday(driverId) != null) return;
    if (!ConnectivityService().canReachServer) return;

    final service = VehicleSafetyCheckService();
    String? vehicleId;
    String? vehicleCompanyId;

    final cachedVehicle =
        await (_db.select(_db.vehiclesCache)..limit(1)).getSingleOrNull();
    if (cachedVehicle != null) {
      vehicleId = cachedVehicle.id;
      vehicleCompanyId = cachedVehicle.companyId;
    } else {
      final vehicle = await service.fetchDriverVehicle();
      if (vehicle == null) return;
      vehicleId = vehicle.id;
      vehicleCompanyId = vehicle.companyId;
    }

    final serverRow = await service.fetchCheckForLocalDay(
      driverId: driverId,
      vehicleId: vehicleId,
      localDay: DateTime.now(),
    );
    if (serverRow == null) return;

    await hydrateChecklistFromServer(
      driverId: driverId,
      vehicleId: vehicleId,
      vehicleCompanyId: vehicleCompanyId,
      serverRow: serverRow,
    );
  }

  /// Inserts a checklist row from Supabase without enqueueing sync.
  Future<void> hydrateChecklistFromServer({
    required String driverId,
    required String vehicleId,
    required String vehicleCompanyId,
    required VehicleSafetyCheckToday serverRow,
  }) async {
    final checks = <String, String>{};
    for (final entry in serverRow.checksByColumn.entries) {
      final value = entry.value;
      if (value != null && value.isNotEmpty) {
        checks[entry.key] = value;
      }
    }

    final todayDate = _dateString(DateTime.now());
    await _db.into(_db.checklistLocal).insertOnConflictUpdate(
          ChecklistLocalCompanion.insert(
            id: _uuid.v4(),
            driverId: driverId,
            vehicleId: vehicleId,
            vehicleCompanyId: vehicleCompanyId,
            sessionDate: todayDate,
            checksJson: jsonEncode(checks),
            status: serverRow.status.trim().toLowerCase(),
            isLocked: Value(serverRow.isReadOnlyLocked),
            serverId: Value(serverRow.id),
            isSynced: const Value(true),
            updatedAt: Value(serverRow.updatedAt),
          ),
        );
  }

  /// True if the driver has at least one session_local row for today.
  /// Used by VehicleCheckListPage to show the job banner without a network call.
  Future<bool> hasSessionToday(String driverId) async {
    final todayDate = _dateString(DateTime.now());
    final row =
        await (_db.select(_db.sessionsLocal)
              ..where(
                (t) =>
                    t.driverId.equals(driverId) &
                    t.sessionDate.equals(todayDate),
              )
              ..limit(1))
            .getSingleOrNull();
    return row != null;
  }

  // ── Stats helpers (for DashboardStatsService offline fallback) ────────────

  Future<int> countScheduledDirectionsToday() async {
    final today = DateTime.now();
    final todayDate = _dateString(today);
    final weekday = _weekdayKey(today);

    final jobs = await _db.select(_db.jobsCache).get();
    var total = 0;

    for (final job in jobs) {
      if (job.hasOutbound) {
        final rows = await _resolvedScheduleForDay(
          jobId: job.id,
          weekday: weekday,
          direction: 'outbound',
          todayDate: todayDate,
        );
        if (rows.isNotEmpty) total++;
      }
      if (job.hasInbound) {
        final rows = await _resolvedScheduleForDay(
          jobId: job.id,
          weekday: weekday,
          direction: 'inbound',
          todayDate: todayDate,
        );
        if (rows.isNotEmpty) total++;
      }
    }
    return total;
  }

  // ── Day boundary clear ────────────────────────────────────────────────────
  //
  // Called by the midnight timer in JobProvider (same logic as current
  // _lastLoadedDayKey check). Clears write tables only — cache stays valid.

  /// True if the driver has schedule rows for today in cache (no session required).
  /// Used by VehicleCheckListPage to show the job banner without a network call.
  Future<bool> hasJobScheduledToday(String driverId) async {
    final today = DateTime.now();
    final todayDate = _dateString(today);
    final weekday = _weekdayKey(today);

    final job =
        await (_db.select(_db.jobsCache)
              ..where(
                (t) =>
                    t.assignedDriverId.equals(driverId) &
                    t.status.isNotIn(['cancelled']) &
                    t.driverApprovalStatus.equalsNullable('accepted'),
              )
              ..limit(1))
            .getSingleOrNull();

    if (job == null) return false;

    if (job.hasOutbound) {
      final rows = await _resolvedScheduleForDay(
        jobId: job.id,
        weekday: weekday,
        direction: 'outbound',
        todayDate: todayDate,
      );
      if (rows.isNotEmpty) return true;
    }
    if (job.hasInbound) {
      final rows = await _resolvedScheduleForDay(
        jobId: job.id,
        weekday: weekday,
        direction: 'inbound',
        todayDate: todayDate,
      );
      if (rows.isNotEmpty) return true;
    }
    return false;
  }

  Future<void> clearWriteTablesForNewDay() async {
    await _db.transaction(() async {
      await _db.delete(_db.sessionsLocal).go();
      await _db.delete(_db.passengersLocal).go();
      await _db.delete(_db.checklistLocal).go();
      // Keep sync_queue — any unsynced ops from previous day must still flush.
      // SyncEngine will handle them and they'll land on the correct date
      // because payload carries session_date.
    });
  }

  /// Drops today's local sessions and pending sync ops for jobs this driver
  /// no longer owns according to [jobsCache]. Returns a user-facing message
  /// when anything was cleared, otherwise null.
  Future<String?> discardStaleLocalWork(String userId) async {
    if (userId.trim().isEmpty) return null;

    final todayDate = _dateString(DateTime.now());
    final assignedJobIds = (await (_db.select(_db.jobsCache)..where(
          (t) => t.assignedDriverId.equals(userId),
        ))
        .get())
        .map((j) => j.id)
        .toSet();

    final localSessions =
        await (_db.select(_db.sessionsLocal)..where(
              (t) =>
                  t.driverId.equals(userId) &
                  t.sessionDate.equals(todayDate),
            ))
            .get();

    final orphanedJobIds = localSessions
        .map((s) => s.jobId)
        .where((id) => !assignedJobIds.contains(id))
        .toSet();

    if (orphanedJobIds.isEmpty) return null;

    final orphanedSessionLocalIds = localSessions
        .where((s) => orphanedJobIds.contains(s.jobId))
        .map((s) => s.localId)
        .toList();

    await _db.transaction(() async {
      for (final localSessionId in orphanedSessionLocalIds) {
        await (_db.delete(
          _db.passengersLocal,
        )..where((t) => t.localSessionId.equals(localSessionId))).go();
      }

      for (final jobId in orphanedJobIds) {
        await (_db.delete(_db.sessionsLocal)..where(
              (t) =>
                  t.jobId.equals(jobId) &
                  t.driverId.equals(userId) &
                  t.sessionDate.equals(todayDate),
            ))
            .go();
      }

      final pendingOps = await getPendingOps();
      for (final op in pendingOps) {
        final payload = jsonDecode(op.payloadJson) as Map<String, dynamic>;
        final jobId = payload['job_id']?.toString();
        final localSessionId = payload['local_session_id']?.toString();
        final isOrphaned =
            (jobId != null && orphanedJobIds.contains(jobId)) ||
            (localSessionId != null &&
                orphanedSessionLocalIds.contains(localSessionId));
        if (isOrphaned) {
          await markOpDone(op.id);
        }
      }
    });

    return 'This job was removed while you were offline. Local session data was cleared.';
  }

  /// Wipes all local tables. Called on logout and from debug tooling.
  Future<void> clearAllLocalData() async {
    await _db.transaction(() async {
      await _db.delete(_db.syncQueue).go();
      await _db.delete(_db.passengersLocal).go();
      await _db.delete(_db.sessionsLocal).go();
      await _db.delete(_db.checklistLocal).go();
      await _db.delete(_db.jobsCache).go();
      await _db.delete(_db.schedulesCache).go();
      await _db.delete(_db.passengersCache).go();
      await _db.delete(_db.vehiclesCache).go();
    });
  }

  // ── Sync queue helpers (used by SyncEngine) ───────────────────────────────

  Future<List<SyncQueueData>> getPendingOps() {
    return (_db.select(_db.syncQueue)
          ..where((t) => t.status.isIn(['pending', 'failed']))
          ..where((t) => t.retryCount.isSmallerThanValue(5))
          ..orderBy([(t) => OrderingTerm.asc(t.createdAt)]))
        .get();
  }

  Future<void> markOpSyncing(String opId) {
    return (_db.update(_db.syncQueue)..where((t) => t.id.equals(opId))).write(
      SyncQueueCompanion(
        status: const Value('syncing'),
        updatedAt: Value(DateTime.now()),
      ),
    );
  }

  Future<void> markOpDone(String opId) {
    return (_db.update(_db.syncQueue)..where((t) => t.id.equals(opId))).write(
      SyncQueueCompanion(
        status: const Value('done'),
        updatedAt: Value(DateTime.now()),
      ),
    );
  }

  Future<void> markOpFailed(String opId, String error) {
    return (_db.update(_db.syncQueue)..where((t) => t.id.equals(opId))).write(
      SyncQueueCompanion(
        status: const Value('failed'),
        lastError: Value(error),
        retryCount: const Value.absent(), // incremented below
        updatedAt: Value(DateTime.now()),
      ),
    );
  }

  Future<void> incrementRetryCount(String opId) async {
    final op = await (_db.select(
      _db.syncQueue,
    )..where((t) => t.id.equals(opId))).getSingleOrNull();
    if (op == null) return;
    await (_db.update(_db.syncQueue)..where((t) => t.id.equals(opId))).write(
      SyncQueueCompanion(
        retryCount: Value(op.retryCount + 1),
        status: const Value('failed'),
        updatedAt: Value(DateTime.now()),
      ),
    );
  }

  /// Patch sessions_local.serverId after SyncEngine creates the real row.
  Future<void> patchSessionServerId({
    required String localId,
    required String serverId,
  }) async {
    await (_db.update(
      _db.sessionsLocal,
    )..where((t) => t.localId.equals(localId))).write(
      SessionsLocalCompanion(
        serverId: Value(serverId),
        isSynced: const Value(true),
        updatedAt: Value(DateTime.now()),
      ),
    );
  }

  /// Patch passengersLocal.serverId after SyncEngine inserts rows.
  Future<void> patchPassengerServerId({
    required String localId,
    required String serverId,
  }) async {
    await (_db.update(
      _db.passengersLocal,
    )..where((t) => t.localId.equals(localId))).write(
      PassengersLocalCompanion(
        serverId: Value(serverId),
        isSynced: const Value(true),
        updatedAt: Value(DateTime.now()),
      ),
    );
  }

  Future<void> patchChecklistServerId({
    required String localId,
    required String serverId,
  }) async {
    await (_db.update(
      _db.checklistLocal,
    )..where((t) => t.id.equals(localId))).write(
      ChecklistLocalCompanion(
        serverId: Value(serverId),
        isSynced: const Value(true),
        updatedAt: Value(DateTime.now()),
      ),
    );
  }

  // ── PA read methods ──────────────────────────────────────────────────────────
  //
  // These mirror PaJobService queries but read entirely from drift cache +
  // write tables. Called by PaJobProvider/PaAssignedJobsProvider when offline.

  /// PA equivalent of fetchCurrentJob — reads from cached tables.
  /// [paUserId] is the PA's Supabase auth user ID (assigned_pa_id on jobs).
  Future<PaJobModel?> fetchPaCurrentJob(String paUserId) async {
    final today = DateTime.now();
    final todayDate = _dateString(today);
    final weekday = _weekdayKey(today);

    // Find job assigned to this PA
    final jobRow =
        await (_db.select(_db.jobsCache)
              ..where(
                (t) =>
                    t.assignedPaId.equalsNullable(paUserId) &
                    t.status.isNotIn(['cancelled']) &
                    t.driverApprovalStatus.equalsNullable('accepted'),
              )
              ..limit(1))
            .getSingleOrNull();

    if (jobRow == null) return null;

    // Sessions from sessions_local (driver-written, PA reads)
    final sessions =
        await (_db.select(_db.sessionsLocal)..where(
              (t) =>
                  t.jobId.equals(jobRow.id) & t.sessionDate.equals(todayDate),
            ))
            .get();

    final sessionMap = {for (final s in sessions) s.direction: s};
    final direction = _pickDirection(jobRow: jobRow, sessionMap: sessionMap);
    if (direction == null) return null;

    final hasDirection = direction == 'outbound'
        ? jobRow.hasOutbound
        : jobRow.hasInbound;
    if (!hasDirection) return null;

    final existingSession = sessionMap[direction];
    final sessionId =
        existingSession?.serverId ?? existingSession?.localId ?? '';
    final sessionStatus = existingSession?.status ?? '';
    final sessionExists = existingSession != null;

    // Resolve schedule rows for today
    final scheduleRows = await _resolvedScheduleForDay(
      jobId: jobRow.id,
      weekday: weekday,
      direction: direction,
      todayDate: todayDate,
    );
    if (scheduleRows.isEmpty) return null;

    // Passenger status from passengers_local
    final statusMap = <String, String>{};
    if (sessionExists &&
        existingSession != null &&
        existingSession.localId.isNotEmpty) {
      final localPassengers = await (_db.select(
        _db.passengersLocal,
      )..where((t) => t.localSessionId.equals(existingSession.localId))).get();
      for (final lp in localPassengers) {
        statusMap[lp.passengerId] = lp.status;
      }
    }

    // Passenger profiles
    final passengerIds = scheduleRows.map((s) => s.passengerId).toList();
    final profiles = await (_db.select(
      _db.passengersCache,
    )..where((t) => t.id.isIn(passengerIds))).get();
    final profileMap = {for (final p in profiles) p.id: p};

    // Build PaPassengerStop list
    final stops = <PaPassengerStop>[];
    for (final s in scheduleRows) {
      final profile = profileMap[s.passengerId];
      final rawStatus = statusMap[s.passengerId] ?? 'pending';
      final order = s.stopOrder ?? stops.length + 1;
      final fullName = _fullName(profile);
      stops.add(
        PaPassengerStop(
          passengerId: s.passengerId,
          passengerName: fullName.isEmpty ? 'Student' : fullName,
          address: s.pickupAddress,
          scheduledTime: _formatTime(s.pickupTime),
          stopNumber: order,
          wheelchairRequired: profile?.wheelchairRequired ?? false,
          harnessRequired: profile?.harnessRequired ?? false,
          status: _toPickupStatus(rawStatus),
        ),
      );
    }

    // Build PaDropoffStop list
    final dropoffs = <PaDropoffStop>[];
    if (direction == 'outbound') {
      // Group by school address
      final schoolOrder = <String>[];
      final schoolNames = <String, List<String>>{};
      final schoolMeta = <String, String>{}; // address → dropoff_time
      final schoolPids = <String, List<String>>{};

      for (final s in scheduleRows) {
        final profile = profileMap[s.passengerId];
        final addr = profile?.educationalSiteAddress ?? '';
        if (addr.isEmpty) continue;
        if (!schoolNames.containsKey(addr)) {
          schoolOrder.add(addr);
          schoolNames[addr] = [];
          schoolMeta[addr] = profile?.educationalSiteDropoffTime ?? '';
          schoolPids[addr] = [];
        }
        schoolNames[addr]!.add(
          _fullName(profile).isEmpty ? 'Student' : _fullName(profile),
        );
        schoolPids[addr]!.add(s.passengerId);
      }

      for (final addr in schoolOrder) {
        final pids = schoolPids[addr]!;
        final allDropped =
            sessionExists &&
            pids.isNotEmpty &&
            pids.every(
              (pid) =>
                  (statusMap[pid] ?? 'pending').toLowerCase() == 'dropped_off',
            );
        dropoffs.add(
          PaDropoffStop(
            address: addr,
            scheduledTime: _formatTime(schoolMeta[addr]),
            passengerNames: schoolNames[addr]!,
            status: allDropped
                ? DropoffStatus.completed
                : DropoffStatus.pending,
          ),
        );
      }
    } else {
      // Inbound — one dropoff per passenger home
      for (final s in scheduleRows) {
        final profile = profileMap[s.passengerId];
        final rawStatus = statusMap[s.passengerId] ?? 'pending';
        final homeAddress = s.dropoffAddress;
        dropoffs.add(
          PaDropoffStop(
            address: homeAddress.isNotEmpty ? homeAddress : 'Home address',
            scheduledTime: _formatTime(s.dropoffTime),
            passengerNames: [
              _fullName(profile).isEmpty ? 'Student' : _fullName(profile),
            ],
            status: _toDropoffStatus(rawStatus),
          ),
        );
      }
    }

    final rawStartTime = direction == 'outbound'
        ? jobRow.morningStartTime
        : jobRow.eveningStartTime;

    return PaJobModel(
      jobDbId: jobRow.id,
      jobName: jobRow.jobName,
      direction: direction,
      sessionId: sessionId,
      sessionStatus: sessionStatus,
      driverName: jobRow.driverName ?? 'Driver',
      startTime: _formatTime(rawStartTime),
      stops: stops,
      dropoffs: dropoffs,
    );
  }

  /// PA equivalent of fetchAssignedJob — reads full weekly schedule from cache.
  Future<PaAssignedJobModel?> fetchPaAssignedJob(String paUserId) async {
    final jobRow =
        await (_db.select(_db.jobsCache)
              ..where(
                (t) =>
                    t.assignedPaId.equalsNullable(paUserId) &
                    t.status.isNotIn(['cancelled']) &
                    t.driverApprovalStatus.equalsNullable('accepted'),
              )
              ..limit(1))
            .getSingleOrNull();

    if (jobRow == null) return null;

    final hasOutbound = jobRow.hasOutbound;
    final hasInbound = jobRow.hasInbound;
    final morningStart = _formatTime(jobRow.morningStartTime);
    final eveningStart = _formatTime(jobRow.eveningStartTime);
    final driverName = jobRow.driverName ?? 'Driver';

    // All base schedule rows (no exception) for this job
    final scheduleRows =
        await (_db.select(_db.schedulesCache)
              ..where(
                (t) => t.jobId.equals(jobRow.id) & t.exceptionDate.isNull(),
              )
              ..orderBy([(t) => OrderingTerm.asc(t.stopOrder)]))
            .get();

    if (scheduleRows.isEmpty) {
      return PaAssignedJobModel(
        jobDbId: jobRow.id,
        jobName: jobRow.jobName,
        semesterStart: _formatDate(jobRow.semesterStart),
        semesterEnd: _formatDate(jobRow.semesterEnd),
        activeDays: [],
        schedule: {},
      );
    }

    // Passenger profiles
    final passengerIds = scheduleRows
        .map((s) => s.passengerId)
        .toSet()
        .toList();
    final profiles = await (_db.select(
      _db.passengersCache,
    )..where((t) => t.id.isIn(passengerIds))).get();
    final profileMap = {for (final p in profiles) p.id: p};

    // Build raw map: weekday → direction → rows
    final rawMap = <String, Map<String, List<SchedulesCacheData>>>{};
    for (final row in scheduleRows) {
      if (row.direction == 'outbound' && !hasOutbound) continue;
      if (row.direction == 'inbound' && !hasInbound) continue;
      rawMap.putIfAbsent(row.weekday, () => {});
      rawMap[row.weekday]!.putIfAbsent(row.direction, () => []);
      rawMap[row.weekday]![row.direction]!.add(row);
    }

    // Convert to PaDayRun / PaScheduleStop
    final schedule = <String, Map<String, PaDayRun>>{};
    for (final weekday in rawMap.keys) {
      schedule[weekday] = {};
      for (final direction in rawMap[weekday]!.keys) {
        final rows = rawMap[weekday]![direction]!
          ..sort((a, b) => (a.stopOrder ?? 0).compareTo(b.stopOrder ?? 0));

        final paStops = rows.map((row) {
          final profile = profileMap[row.passengerId];
          final name = _fullName(profile);
          return PaScheduleStop(
            passengerName: name.isEmpty ? 'Student' : name,
            pickupAddress: row.pickupAddress,
            dropoffAddress: row.dropoffAddress,
            pickupTime: _formatTime(row.pickupTime),
            wheelchairRequired: profile?.wheelchairRequired ?? false,
            harnessRequired: profile?.harnessRequired ?? false,
            stopOrder: row.stopOrder ?? 0,
          );
        }).toList();

        schedule[weekday]![direction] = PaDayRun(
          direction: direction,
          startTime: direction == 'outbound' ? morningStart : eveningStart,
          driverName: driverName,
          stops: paStops,
        );
      }
    }

    return PaAssignedJobModel(
      jobDbId: jobRow.id,
      jobName: jobRow.jobName,
      semesterStart: _formatDate(jobRow.semesterStart),
      semesterEnd: _formatDate(jobRow.semesterEnd),
      activeDays: rawMap.keys.toList(),
      schedule: schedule,
    );
  }

  /// Mirrors server [job_sessions] + [job_session_passengers] into local write
  /// tables so PA devices (read-only) stay in sync after the driver updates
  /// Supabase from another device.
  Future<void> mirrorPaLiveStateFromServer({
    required String jobId,
    required String todayDate,
    required List<Map<String, dynamic>> sessions,
    required Map<String, List<Map<String, dynamic>>> passengersByServerSessionId,
  }) async {
    if (sessions.isEmpty) return;

    await _db.transaction(() async {
      for (final sessionRow in sessions) {
        final serverId = (sessionRow['id'] ?? '').toString();
        if (serverId.isEmpty) continue;

        final direction = (sessionRow['direction'] ?? '').toString();
        final status = (sessionRow['status'] ?? 'active').toString();
        final driverId = (sessionRow['driver_id'] ?? '').toString();
        final startedAt = _parseDateTime(sessionRow['started_at']) ?? DateTime.now();
        final completedAt = _parseDateTime(sessionRow['completed_at']);

        var localSession =
            await (_db.select(_db.sessionsLocal)
                  ..where((t) => t.serverId.equals(serverId)))
                .getSingleOrNull();

        localSession ??=
            await (_db.select(_db.sessionsLocal)..where(
                  (t) =>
                      t.jobId.equals(jobId) &
                      t.sessionDate.equals(todayDate) &
                      t.direction.equals(direction),
                ))
                .getSingleOrNull();

        late final String localSessionId;
        if (localSession != null) {
          localSessionId = localSession.localId;
          await (_db.update(_db.sessionsLocal)
                ..where((t) => t.localId.equals(localSessionId)))
              .write(
            SessionsLocalCompanion(
              serverId: Value(serverId),
              status: Value(status),
              driverId: Value(
                driverId.isNotEmpty ? driverId : localSession.driverId,
              ),
              startedAt: Value(startedAt),
              completedAt: Value(completedAt),
              isSynced: const Value(true),
              updatedAt: Value(DateTime.now()),
            ),
          );
        } else {
          localSessionId = _uuid.v4();
          await _db.into(_db.sessionsLocal).insert(
            SessionsLocalCompanion.insert(
              localId: localSessionId,
              serverId: Value(serverId),
              jobId: jobId,
              sessionDate: todayDate,
              direction: direction,
              status: Value(status),
              driverId: driverId,
              startedAt: Value(startedAt),
              completedAt: Value(completedAt),
              isSynced: const Value(true),
            ),
          );
        }

        final passengerRows = passengersByServerSessionId[serverId] ?? [];
        for (final pr in passengerRows) {
          final serverPassengerId = (pr['id'] ?? '').toString();
          final passengerId = (pr['passenger_id'] ?? '').toString();
          if (passengerId.isEmpty) continue;

          final prStatus = (pr['status'] ?? 'pending').toString();
          final pickedUpAt = _parseDateTime(pr['picked_up_at']);
          final droppedOffAt = _parseDateTime(pr['dropped_off_at']);

          var localPassenger =
              serverPassengerId.isNotEmpty
                  ? await (_db.select(_db.passengersLocal)
                        ..where((t) => t.serverId.equals(serverPassengerId)))
                      .getSingleOrNull()
                  : null;

          localPassenger ??=
              await (_db.select(_db.passengersLocal)..where(
                    (t) =>
                        t.localSessionId.equals(localSessionId) &
                        t.passengerId.equals(passengerId),
                  ))
                  .getSingleOrNull();

          if (localPassenger != null) {
            await (_db.update(_db.passengersLocal)
                  ..where((t) => t.localId.equals(localPassenger!.localId)))
                .write(
              PassengersLocalCompanion(
                serverId: serverPassengerId.isNotEmpty
                    ? Value(serverPassengerId)
                    : const Value.absent(),
                status: Value(prStatus),
                pickedUpAt: Value(pickedUpAt),
                droppedOffAt: Value(droppedOffAt),
                isSynced: const Value(true),
                updatedAt: Value(DateTime.now()),
              ),
            );
          } else {
            await _db.into(_db.passengersLocal).insert(
              PassengersLocalCompanion.insert(
                localId: _uuid.v4(),
                serverId: serverPassengerId.isNotEmpty
                    ? Value(serverPassengerId)
                    : const Value(null),
                localSessionId: localSessionId,
                passengerId: passengerId,
                stopOrder: _asInt(pr['stop_order']),
                status: Value(prStatus),
                pickupAddress: (pr['pickup_address'] ?? '').toString(),
                pickupPostcode: Value(pr['pickup_postcode']?.toString()),
                pickupLatitude: Value(_asDouble(pr['pickup_latitude'])),
                pickupLongitude: Value(_asDouble(pr['pickup_longitude'])),
                dropoffAddress: (pr['dropoff_address'] ?? '').toString(),
                dropoffPostcode: Value(pr['dropoff_postcode']?.toString()),
                pickedUpAt: Value(pickedUpAt),
                droppedOffAt: Value(droppedOffAt),
                notes: Value(pr['notes']?.toString()),
                isSynced: const Value(true),
              ),
            );
          }
        }
      }
    });
  }

  /// PA equivalent of isSessionCompleted — reads from sessions_local.
  Future<bool> isPaSessionCompleted(String sessionId) async {
    if (sessionId.isEmpty) return false;
    // Try by serverId first, then localId
    final byServer = await (_db.select(
      _db.sessionsLocal,
    )..where((t) => t.serverId.equals(sessionId))).getSingleOrNull();
    if (byServer != null) return byServer.status == 'completed';

    final byLocal = await (_db.select(
      _db.sessionsLocal,
    )..where((t) => t.localId.equals(sessionId))).getSingleOrNull();
    return byLocal?.status == 'completed';
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  Future<void> _insertSyncOp({
    required String opType,
    required Map<String, dynamic> payload,
  }) async {
    await _db
        .into(_db.syncQueue)
        .insert(
          SyncQueueCompanion.insert(
            id: _uuid.v4(),
            opType: opType,
            payloadJson: jsonEncode(payload),
          ),
        );
  }

  Future<void> _enqueue({
    required String opType,
    required Map<String, dynamic> payload,
  }) async {
    await _insertSyncOp(opType: opType, payload: payload);
    await SyncScheduler.flushIfOnline();
  }

  Future<List<SchedulesCacheData>> _resolvedScheduleForDay({
    required String jobId,
    required String weekday,
    required String direction,
    required String todayDate,
  }) async {
    // Base rows (no exception_date)
    final baseRows =
        await (_db.select(_db.schedulesCache)
              ..where(
                (t) =>
                    t.jobId.equals(jobId) &
                    t.weekday.equals(weekday) &
                    t.direction.equals(direction) &
                    t.exceptionDate.isNull(),
              )
              ..orderBy([
                (t) => OrderingTerm(
                  expression: t.stopOrder,
                  mode: direction == 'outbound'
                      ? OrderingMode.asc
                      : OrderingMode.desc,
                ),
              ]))
            .get();

    // Exception rows for today
    final exceptionRows =
        await (_db.select(_db.schedulesCache)..where(
              (t) =>
                  t.jobId.equals(jobId) &
                  t.weekday.equals(weekday) &
                  t.direction.equals(direction) &
                  t.exceptionDate.equals(todayDate),
            ))
            .get();

    final exceptionMap = {for (final e in exceptionRows) e.passengerId: e};

    final result = <SchedulesCacheData>[];
    for (final base in baseRows) {
      final exception = exceptionMap[base.passengerId];
      if (exception != null) {
        if (exception.exceptionType == 'skip') continue;
        result.add(exception);
      } else {
        result.add(base);
      }
    }
    return result;
  }

  String? _pickDirection({
    required JobsCacheData jobRow,
    required Map<String, SessionsLocalData> sessionMap,
  }) {
    // Priority 1: resume active session
    for (final entry in sessionMap.entries) {
      if (entry.value.status == 'active') return entry.key;
    }

    final outboundDone = sessionMap['outbound']?.status == 'completed';
    final inboundDone = sessionMap['inbound']?.status == 'completed';

    if ((!jobRow.hasOutbound || outboundDone) &&
        (!jobRow.hasInbound || inboundDone)) {
      return null;
    }

    if (jobRow.hasOutbound && !outboundDone) return 'outbound';
    if (jobRow.hasInbound && !inboundDone) return 'inbound';
    return null;
  }

  Future<String> _fetchPaName(String? paId) async {
    if (paId == null || paId.isEmpty) return 'Unassigned';
    // PA name not in cache — return generic label offline.
    // Online, JobService.fetchCurrentJob still has this.
    return 'PA';
  }

  String _fullName(PassengersCacheData? profile) {
    if (profile == null) return '';
    final parts = [
      profile.firstName.trim(),
      profile.surname.trim(),
    ].where((s) => s.isNotEmpty);
    return parts.join(' ');
  }

  PickupStatus _toPickupStatus(String raw) {
    if (raw == 'picked_up' || raw == 'dropped_off') {
      return PickupStatus.completed;
    }
    if (raw == 'missed') return PickupStatus.notPicked;
    return PickupStatus.pending;
  }

  DropoffStatus _toDropoffStatus(String raw) {
    return raw == 'dropped_off'
        ? DropoffStatus.completed
        : DropoffStatus.pending;
  }

  String _dbPickupStatus(PickupStatus status) {
    switch (status) {
      case PickupStatus.completed:
        return 'picked_up';
      case PickupStatus.notPicked:
        return 'missed';
      case PickupStatus.pending:
        return 'pending';
    }
  }

  String _weekdayKey(DateTime dt) {
    const keys = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    return keys[dt.weekday - 1];
  }

  String _dateString(DateTime dt) =>
      '${dt.year.toString().padLeft(4, '0')}-'
      '${dt.month.toString().padLeft(2, '0')}-'
      '${dt.day.toString().padLeft(2, '0')}';

  String _formatDate(String raw) {
    if (raw.isEmpty || raw == 'null') return '--';
    try {
      final dt = DateTime.parse(raw);
      const months = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ];
      return '${months[dt.month - 1]} ${dt.day}, ${dt.year}';
    } catch (_) {
      return raw;
    }
  }

  String _formatTime(String? rawTime) {
    final raw = (rawTime ?? '').trim();
    if (raw.isEmpty) return '--:--';
    final hhmm = raw.length >= 5 ? raw.substring(0, 5) : raw;
    final parts = hhmm.split(':');
    if (parts.length < 2) return raw;
    final hour = int.tryParse(parts[0]);
    final minute = int.tryParse(parts[1]);
    if (hour == null || minute == null) return raw;
    final period = hour >= 12 ? 'PM' : 'AM';
    final h12 = hour % 12 == 0 ? 12 : hour % 12;
    final mm = minute.toString().padLeft(2, '0');
    return '$h12:$mm $period';
  }

  DateTime? _parseDateTime(dynamic raw) {
    if (raw == null) return null;
    final s = raw.toString().trim();
    if (s.isEmpty || s == 'null') return null;
    return DateTime.tryParse(s);
  }

  int _asInt(dynamic value) {
    if (value is int) return value;
    if (value is num) return value.toInt();
    return int.tryParse(value?.toString() ?? '') ?? 0;
  }

  double? _asDouble(dynamic value) {
    if (value == null) return null;
    if (value is double) return value;
    if (value is num) return value.toDouble();
    return double.tryParse(value.toString());
  }
}
