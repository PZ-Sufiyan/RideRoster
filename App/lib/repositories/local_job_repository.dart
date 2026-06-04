import 'dart:convert';
import 'package:drift/drift.dart';
import 'package:uuid/uuid.dart';
import '../database/app_database.dart';
import '../../model/job_model.dart';

/// Replaces the network calls in [JobService] with local drift reads/writes.
///
/// READS  → always from drift (cache + write tables).
/// WRITES → write to local tables first, then enqueue a sync_queue op.
///          SyncEngine replays the queue when connectivity returns.
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

      // Enqueue sync op
      await _enqueue(
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
      final outbound = await _resolvedScheduleForDay(
        jobId: job.id,
        weekday: weekday,
        direction: 'outbound',
        todayDate: todayDate,
      );
      if (outbound.isNotEmpty) return true;
    }
    if (job.hasInbound) {
      final inbound = await _resolvedScheduleForDay(
        jobId: job.id,
        weekday: weekday,
        direction: 'inbound',
        todayDate: todayDate,
      );
      if (inbound.isNotEmpty) return true;
    }
    return false;
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

  // ── Private helpers ────────────────────────────────────────────────────────

  Future<void> _enqueue({
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
        (!jobRow.hasInbound || inboundDone))
      return null;

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

  /// DEV ONLY — wipes all local tables. Use during debugging to reset state.
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
}
