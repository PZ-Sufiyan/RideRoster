import 'dart:async';
import 'dart:convert';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../database/app_database.dart';
import '../repositories/local_job_repository.dart';
import 'connectivity_service.dart';
import 'package:drift/drift.dart';

/// Processes the [sync_queue] table in order, replaying offline mutations
/// against Supabase when connectivity returns.
///
/// Guaranteed ordering:
///   start_session → pickup_status / dropoff_status / dropoff_status_bulk
///                 → complete_job
///   save_checklist is independent and can run in any relative order.
///
/// Provisional ID resolution:
///   When [start_session] completes, the real server session UUID is returned.
///   SyncEngine immediately patches [sessions_local.serverId] and rewrites
///   any queued ops that still carry the provisional [local_session_id] so
///   they reference the real server ID before executing.
///
/// Retry policy:
///   Transient failures (network timeout, 5xx): increment retry_count, leave
///   as 'failed'. Retried on next [processQueue] call (next reconnect).
///   Hard failures (constraint violation, 4xx): abandon at retry_count >= 5.
class SyncEngine {
  final LocalJobRepository _local;
  SupabaseClient get _supabase => Supabase.instance.client;

  bool _isProcessing = false;
  StreamSubscription<void>? _reconnectSub;

  SyncEngine._(this._local);

  // Static initialiser — call once in main() after AppDatabase is ready.
  static late SyncEngine _initialized;
  static void init(LocalJobRepository repo) {
    _initialized = SyncEngine._(repo);
  }

  static SyncEngine get instance => _initialized;

  /// Start listening for reconnect events. Call once in main().
  void listenForReconnect() {
    _reconnectSub?.cancel();
    _reconnectSub = ConnectivityService().onReconnect.listen((_) {
      processQueue();
    });
  }

  /// Process all pending ops in created_at order.
  /// Safe to call even if already processing — guards with [_isProcessing].
  Future<void> processQueue() async {
    if (_isProcessing) return;
    _isProcessing = true;

    try {
      final ops = await _local.getPendingOps();
      if (ops.isEmpty) return;

      // Build a local→server session ID map as we process start_session ops.
      // Used to rewrite subsequent ops in the same queue pass.
      final sessionIdMap = <String, String>{}; // localId → serverId

      for (final op in ops) {
        await _local.markOpSyncing(op.id);
        try {
          await _processOp(op, sessionIdMap);
          await _local.markOpDone(op.id);
        } catch (e) {
          await _local.incrementRetryCount(op.id);
          await _local.markOpFailed(op.id, e.toString());
          // Do not break — continue processing independent ops (e.g. checklist).
        }
      }
    } finally {
      _isProcessing = false;
    }
  }

  Future<void> _processOp(
    SyncQueueData op,
    Map<String, String> sessionIdMap,
  ) async {
    final payload = jsonDecode(op.payloadJson) as Map<String, dynamic>;

    switch (op.opType) {
      case 'start_session':
        await _handleStartSession(payload, sessionIdMap);
        break;

      case 'pickup_status':
        await _handlePickupStatus(payload, sessionIdMap);
        break;

      case 'dropoff_status':
        await _handleDropoffStatus(payload, sessionIdMap);
        break;

      case 'dropoff_status_bulk':
        await _handleDropoffStatusBulk(payload, sessionIdMap);
        break;

      case 'complete_job':
        await _handleCompleteJob(payload, sessionIdMap);
        break;

      case 'save_checklist':
        await _handleSaveChecklist(payload);
        break;

      default:
        throw Exception('Unknown op_type: ${op.opType}');
    }
  }

  // ── start_session ─────────────────────────────────────────────────────────
  //
  // Payload: { local_session_id, job_id, direction, session_date,
  //            driver_id, started_at }
  //
  // Creates job_sessions row via upsert (same as JobService.startSession).
  // Then inserts job_session_passengers rows from passengersLocal where
  // localSessionId == local_session_id and serverId is still null.
  // Patches sessions_local.serverId and all passengersLocal.serverId.

  Future<void> _handleStartSession(
    Map<String, dynamic> payload,
    Map<String, String> sessionIdMap,
  ) async {
    final localSessionId = payload['local_session_id'] as String;
    final jobId = payload['job_id'] as String;
    final direction = payload['direction'] as String;
    final sessionDate = payload['session_date'] as String;
    final driverId = payload['driver_id'] as String;
    final startedAt = payload['started_at'] as String;

    // Upsert session row — matches JobService.startSession behaviour
    final sessionResult = await _supabase
        .from('job_sessions')
        .upsert({
          'job_id': jobId,
          'session_date': sessionDate,
          'direction': direction,
          'status': 'active',
          'driver_id': driverId,
          'started_at': startedAt,
        }, onConflict: 'job_id,session_date,direction')
        .select('id')
        .single();

    final serverSessionId = (sessionResult['id'] ?? '').toString();
    if (serverSessionId.isEmpty) {
      throw Exception('start_session: server returned empty session ID');
    }

    // Remember mapping for this queue pass
    sessionIdMap[localSessionId] = serverSessionId;

    // Patch local session row
    await _local.patchSessionServerId(
      localId: localSessionId,
      serverId: serverSessionId,
    );

    // Insert job_session_passengers rows that don't exist on server yet
    final localPassengers =
        await (_local.appDb.select(_local.appDb.passengersLocal)..where(
              (t) =>
                  t.localSessionId.equals(localSessionId) & t.serverId.isNull(),
            ))
            .get();

    if (localPassengers.isEmpty) return;

    final insertRows = localPassengers
        .map(
          (lp) => {
            'session_id': serverSessionId,
            'passenger_id': lp.passengerId,
            'stop_order': lp.stopOrder,
            'status': lp.status,
            'pickup_address': lp.pickupAddress,
            'pickup_postcode': lp.pickupPostcode,
            'pickup_latitude': lp.pickupLatitude,
            'pickup_longitude': lp.pickupLongitude,
            'dropoff_address': lp.dropoffAddress,
            'dropoff_postcode': lp.dropoffPostcode,
            'notes': lp.notes,
          },
        )
        .toList();

    // Insert and get back IDs so we can patch serverId
    final inserted = await _supabase
        .from('job_session_passengers')
        .insert(insertRows)
        .select('id, passenger_id');

    // Patch each passengersLocal row with its server ID
    for (final row in inserted) {
      final serverId = (row['id'] ?? '').toString();
      final passengerId = (row['passenger_id'] ?? '').toString();
      final localRow = localPassengers.firstWhere(
        (lp) => lp.passengerId == passengerId,
        orElse: () => localPassengers.first,
      );
      await _local.patchPassengerServerId(
        localId: localRow.localId,
        serverId: serverId,
      );
    }
  }

  // ── pickup_status ─────────────────────────────────────────────────────────
  //
  // Payload: { passenger_local_id, passenger_server_id, local_session_id,
  //            status, picked_up_at }
  //
  // Uses passenger_server_id if available; otherwise looks it up from local DB
  // (it may have been patched by a start_session op earlier in this pass).

  Future<void> _handlePickupStatus(
    Map<String, dynamic> payload,
    Map<String, String> sessionIdMap,
  ) async {
    final passengerLocalId = payload['passenger_local_id'] as String;
    String? serverPassengerId = payload['passenger_server_id'] as String?;

    // If server ID wasn't in payload, look it up — may have been patched now
    if (serverPassengerId == null || serverPassengerId.isEmpty) {
      final row = await (_local.appDb.select(
        _local.appDb.passengersLocal,
      )..where((t) => t.localId.equals(passengerLocalId))).getSingleOrNull();
      serverPassengerId = row?.serverId;
    }

    if (serverPassengerId == null || serverPassengerId.isEmpty) {
      throw Exception(
        'pickup_status: no server ID for passenger $passengerLocalId — '
        'start_session may not have synced yet',
      );
    }

    final update = <String, dynamic>{
      'status': payload['status'],
      'updated_at': DateTime.now().toIso8601String(),
    };
    if (payload['picked_up_at'] != null) {
      update['picked_up_at'] = payload['picked_up_at'];
    }

    await _supabase
        .from('job_session_passengers')
        .update(update)
        .eq('id', serverPassengerId);

    // Mark passenger as synced
    await (_local.appDb.update(_local.appDb.passengersLocal)
          ..where((t) => t.localId.equals(passengerLocalId)))
        .write(PassengersLocalCompanion(isSynced: Value(true)));
  }

  // ── dropoff_status ────────────────────────────────────────────────────────

  Future<void> _handleDropoffStatus(
    Map<String, dynamic> payload,
    Map<String, String> sessionIdMap,
  ) async {
    final passengerLocalId = payload['passenger_local_id'] as String;
    String? serverPassengerId = payload['passenger_server_id'] as String?;

    if (serverPassengerId == null || serverPassengerId.isEmpty) {
      final row = await (_local.appDb.select(
        _local.appDb.passengersLocal,
      )..where((t) => t.localId.equals(passengerLocalId))).getSingleOrNull();
      serverPassengerId = row?.serverId;
    }

    if (serverPassengerId == null || serverPassengerId.isEmpty) {
      throw Exception(
        'dropoff_status: no server ID for passenger $passengerLocalId',
      );
    }

    await _supabase
        .from('job_session_passengers')
        .update({
          'status': 'dropped_off',
          'dropped_off_at': payload['dropped_off_at'],
          'updated_at': DateTime.now().toIso8601String(),
        })
        .eq('id', serverPassengerId);

    await (_local.appDb.update(_local.appDb.passengersLocal)
          ..where((t) => t.localId.equals(passengerLocalId)))
        .write(PassengersLocalCompanion(isSynced: Value(true)));
  }

  // ── dropoff_status_bulk ───────────────────────────────────────────────────

  Future<void> _handleDropoffStatusBulk(
    Map<String, dynamic> payload,
    Map<String, String> sessionIdMap,
  ) async {
    final localSessionId = payload['local_session_id'] as String;
    String? serverSessionId = payload['server_session_id'] as String?;

    // Resolve server session ID from map (may have just been patched)
    serverSessionId ??= sessionIdMap[localSessionId];
    if (serverSessionId == null || serverSessionId.isEmpty) {
      final session = await (_local.appDb.select(
        _local.appDb.sessionsLocal,
      )..where((t) => t.localId.equals(localSessionId))).getSingleOrNull();
      serverSessionId = session?.serverId;
    }

    if (serverSessionId == null || serverSessionId.isEmpty) {
      throw Exception(
        'dropoff_status_bulk: no server session ID for $localSessionId',
      );
    }

    await _supabase
        .from('job_session_passengers')
        .update({
          'status': 'dropped_off',
          'dropped_off_at': payload['dropped_off_at'],
          'updated_at': DateTime.now().toIso8601String(),
        })
        .eq('session_id', serverSessionId)
        .eq('dropoff_address', payload['school_address'] as String);
  }

  // ── complete_job ──────────────────────────────────────────────────────────

  Future<void> _handleCompleteJob(
    Map<String, dynamic> payload,
    Map<String, String> sessionIdMap,
  ) async {
    final localSessionId = payload['local_session_id'] as String;
    String? serverSessionId = payload['server_session_id'] as String?;

    serverSessionId ??= sessionIdMap[localSessionId];
    if (serverSessionId == null || serverSessionId.isEmpty) {
      final session = await (_local.appDb.select(
        _local.appDb.sessionsLocal,
      )..where((t) => t.localId.equals(localSessionId))).getSingleOrNull();
      serverSessionId = session?.serverId;
    }

    if (serverSessionId == null || serverSessionId.isEmpty) {
      throw Exception('complete_job: no server session ID for $localSessionId');
    }

    // Mirrors JobService.completeJob exactly
    await _supabase
        .from('job_session_passengers')
        .update({
          'status': 'dropped_off',
          'dropped_off_at': payload['completed_at'],
          'updated_at': DateTime.now().toIso8601String(),
        })
        .eq('session_id', serverSessionId)
        .eq('status', 'picked_up');

    await _supabase
        .from('job_sessions')
        .update({
          'status': 'completed',
          'completed_at': payload['completed_at'],
          'updated_at': DateTime.now().toIso8601String(),
        })
        .eq('id', serverSessionId);
  }

  // ── save_checklist ────────────────────────────────────────────────────────

  Future<void> _handleSaveChecklist(Map<String, dynamic> payload) async {
    final localId = payload['local_id'] as String;
    final checks = Map<String, String>.from(
      payload['checks'] as Map<String, dynamic>,
    );

    final allPass = payload['all_pass'] as bool;

    int passed = 0, failed = 0;
    for (final v in checks.values) {
      if (v == 'pass') passed++;
      if (v == 'fail') failed++;
    }

    final insertPayload = <String, dynamic>{
      'company_id': payload['vehicle_company_id'],
      'vehicle_id': payload['vehicle_id'],
      'driver_id': payload['driver_id'],
      'total_checks': checks.length,
      'passed_checks': passed,
      'failed_checks': failed,
      'status': payload['status'],
      'updated_at': payload['updated_at'],
      for (final entry in checks.entries) entry.key: entry.value,
      if (allPass) 'completed_at': payload['updated_at'],
      if (!allPass) 'completed_at': null,
    };

    // Check if a server row already exists for this localId
    final existing = await (_local.appDb.select(
      _local.appDb.checklistLocal,
    )..where((t) => t.id.equals(localId))).getSingleOrNull();

    String serverId;
    if (existing?.serverId != null && existing!.serverId!.isNotEmpty) {
      // Update existing row
      await _supabase
          .from('vehicle_safety_checks')
          .update(insertPayload)
          .eq('id', existing.serverId!);
      serverId = existing.serverId!;
    } else {
      // Insert new row
      final result = await _supabase
          .from('vehicle_safety_checks')
          .insert(insertPayload)
          .select('id')
          .single();
      serverId = (result['id'] ?? '').toString();
    }

    await _local.patchChecklistServerId(localId: localId, serverId: serverId);
  }

  void dispose() {
    _reconnectSub?.cancel();
  }
}

// Extension to expose the db for SyncEngine internal queries
extension LocalJobRepositoryDbAccess on LocalJobRepository {
  AppDatabase get db => appDb;
}
