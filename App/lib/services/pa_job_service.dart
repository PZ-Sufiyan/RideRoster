import 'package:supabase_flutter/supabase_flutter.dart';
import '../model/pa_job_model.dart';

// Re-use the same status enums from the driver layer.
// ignore: implementation_imports
import '../model/job_model.dart'
    show DropoffStatus, pickupStatusFromDb, dropoffStatusFromDb;

/// Read-only Supabase queries for the Passenger Assistant job view.
///
/// The PA is assigned via [jobs.assigned_pa_id].  All data comes from the
/// same tables the driver uses — this service never writes anything.
///
/// Direction priority (mirrors JobService._pickDirection):
///   1. Active session wins unconditionally.
///   2. Outbound before inbound when both are pending.
///   3. Inbound when outbound is done / absent.
///   4. null → nothing to show today.
class PaJobService {
  SupabaseClient get _supabase => Supabase.instance.client;

  // ── Public API ─────────────────────────────────────────────────────────────

  Future<PaJobModel?> fetchCurrentJob() async {
    final userId = _supabase.auth.currentUser?.id;
    if (userId == null || userId.isEmpty) return null;

    final today = DateTime.now();
    final todayDate = _dateString(today);
    final weekday = _weekdayKey(today);

    // ── 1. Find assigned job ────────────────────────────────────────────────
    final jobRows = await _supabase
        .from('jobs')
        .select(
          'id, job_name, assigned_driver_id, '
          'has_outbound, has_inbound, '
          'morning_start_time, evening_start_time, '
          'semester_start, semester_end, status',
        )
        .eq('assigned_pa_id', userId)
        .eq('driver_approval_status', 'accepted')
        .neq('status', 'cancelled')
        .lte('semester_start', todayDate)
        .gte('semester_end', todayDate)
        .limit(1);

    if (jobRows.isEmpty) return null;
    final jobRow = Map<String, dynamic>.from(jobRows.first);
    final jobDbId = (jobRow['id'] ?? '').toString();
    if (jobDbId.isEmpty) return null;

    // ── 2. Load today's sessions ────────────────────────────────────────────
    final allSessions = await _supabase
        .from('job_sessions')
        .select('id, direction, status')
        .eq('job_id', jobDbId)
        .eq('session_date', todayDate);

    final sessionMap = <String, Map<String, dynamic>>{};
    for (final s in allSessions) {
      final dir = (s['direction'] ?? '').toString();
      sessionMap[dir] = Map<String, dynamic>.from(s as Map);
    }

    // ── 3. Pick direction ───────────────────────────────────────────────────
    final direction = _pickDirection(jobRow: jobRow, sessionMap: sessionMap);
    if (direction == null) return null;

    final hasDirection = direction == 'outbound'
        ? jobRow['has_outbound'] == true
        : jobRow['has_inbound'] == true;
    if (!hasDirection) return null;

    final existingSession = sessionMap[direction];
    final sessionId = existingSession?['id']?.toString() ?? '';
    final sessionStatus = existingSession?['status']?.toString() ?? '';
    final sessionExists = sessionId.isNotEmpty;

    // ── 4. Resolve schedule rows ────────────────────────────────────────────
    final scheduleRows = await _resolvedScheduleForDay(
      jobDbId: jobDbId,
      weekday: weekday,
      direction: direction,
      todayDate: todayDate,
    );

    if (scheduleRows.isEmpty) return null;

    final scheduleByPassenger = <String, Map<String, dynamic>>{};
    for (final s in scheduleRows) {
      final pid = (s['passenger_id'] ?? '').toString();
      if (pid.isNotEmpty) scheduleByPassenger[pid] = s;
    }

    // ── 5. Get session passenger rows (status) ──────────────────────────────
    // Maps passenger_id → status string.  Empty if session not started.
    final sessionStatusMap = <String, String>{};

    if (sessionExists) {
      final spRows = await _supabase
          .from('job_session_passengers')
          .select('passenger_id, status')
          .eq('session_id', sessionId);

      for (final row in spRows) {
        final pid = (row['passenger_id'] ?? '').toString();
        final status = (row['status'] ?? 'pending').toString();
        if (pid.isNotEmpty) sessionStatusMap[pid] = status;
      }
    }

    // ── 6. Fetch passenger profiles ─────────────────────────────────────────
    final passengerIds = scheduleRows
        .map((r) => r['passenger_id']?.toString())
        .whereType<String>()
        .where((id) => id.isNotEmpty)
        .toSet()
        .toList();

    final profileMap = await _fetchPassengerProfiles(passengerIds);

    // ── 7. Build PaPassengerStop list ───────────────────────────────────────
    final stops = <PaPassengerStop>[];

    for (final row in scheduleRows) {
      final pid = (row['passenger_id'] ?? '').toString();
      final profile = profileMap[pid];

      final firstName = (profile?['first_name'] ?? '').toString().trim();
      final surname = (profile?['surname'] ?? '').toString().trim();
      final fullName = [
        firstName,
        surname,
      ].where((s) => s.isNotEmpty).join(' ');

      final address = (row['pickup_address'] ?? '').toString();
      final order = _asInt(row['stop_order']);
      final scheduledTime = _formatTime(row['pickup_time']);

      final rawStatus = sessionStatusMap[pid] ?? 'pending';
      final pickupStatus = pickupStatusFromDb(rawStatus);

      stops.add(
        PaPassengerStop(
          passengerId: pid,
          passengerName: fullName.isEmpty ? 'Student' : fullName,
          address: address,
          scheduledTime: scheduledTime,
          stopNumber: order == 0 ? stops.length + 1 : order,
          wheelchairRequired: profile?['wheelchair_required'] == true,
          harnessRequired: profile?['harness_required'] == true,
          status: pickupStatus,
        ),
      );
    }

    // ── 8. Build PaDropoffStop list ─────────────────────────────────────────
    final dropoffs = <PaDropoffStop>[];

    if (direction == 'outbound') {
      // Group by school address — one stop per school.
      final schoolOrder = <String>[];
      final schoolPassengers = <String, List<String>>{};
      final schoolMeta = <String, Map<String, dynamic>>{};

      for (final row in scheduleRows) {
        final pid = (row['passenger_id'] ?? '').toString();
        final profile = profileMap[pid];
        if (profile == null) continue;

        final schoolAddress = (profile['educational_site_address'] ?? '')
            .toString();
        if (schoolAddress.isEmpty) continue;

        if (!schoolPassengers.containsKey(schoolAddress)) {
          schoolOrder.add(schoolAddress);
          schoolPassengers[schoolAddress] = [];
          schoolMeta[schoolAddress] = {
            'dropoff_time': profile['educational_site_dropoff_time'],
          };
        }

        final firstName = (profile['first_name'] ?? '').toString().trim();
        final surname = (profile['surname'] ?? '').toString().trim();
        final fullName = [
          firstName,
          surname,
        ].where((s) => s.isNotEmpty).join(' ');
        schoolPassengers[schoolAddress]!.add(
          fullName.isEmpty ? 'Student' : fullName,
        );
      }

      for (final schoolAddress in schoolOrder) {
        // Outbound school dropoff: check if all passengers for this school
        // are dropped_off in the session.
        final schoolPids = scheduleRows
            .where((r) {
              final pid = (r['passenger_id'] ?? '').toString();
              final profile = profileMap[pid];
              return (profile?['educational_site_address'] ?? '') ==
                  schoolAddress;
            })
            .map((r) => (r['passenger_id'] ?? '').toString())
            .toList();

        final allDropped =
            sessionExists &&
            schoolPids.isNotEmpty &&
            schoolPids.every(
              (pid) =>
                  (sessionStatusMap[pid] ?? 'pending').toLowerCase() ==
                  'dropped_off',
            );

        dropoffs.add(
          PaDropoffStop(
            address: schoolAddress,
            scheduledTime: _formatTime(
              schoolMeta[schoolAddress]?['dropoff_time'],
            ),
            passengerNames: schoolPassengers[schoolAddress] ?? [],
            status: allDropped
                ? DropoffStatus.completed
                : DropoffStatus.pending,
          ),
        );
      }
    } else {
      // Inbound: one dropoff per passenger (home address).
      for (final row in scheduleRows) {
        final pid = (row['passenger_id'] ?? '').toString();
        final profile = profileMap[pid];

        final firstName = (profile?['first_name'] ?? '').toString().trim();
        final surname = (profile?['surname'] ?? '').toString().trim();
        final fullName = [
          firstName,
          surname,
        ].where((s) => s.isNotEmpty).join(' ');

        final homeAddress = (row['dropoff_address'] ?? '').toString();
        final dropoffTime = _formatTime(row['dropoff_time']);

        final rawStatus = sessionStatusMap[pid] ?? 'pending';
        final dropoffStatus = dropoffStatusFromDb(rawStatus);

        dropoffs.add(
          PaDropoffStop(
            address: homeAddress.isNotEmpty ? homeAddress : 'Home address',
            scheduledTime: dropoffTime,
            passengerNames: [fullName.isEmpty ? 'Student' : fullName],
            status: dropoffStatus,
          ),
        );
      }
    }

    // ── 9. Resolve driver name ──────────────────────────────────────────────
    final driverName = await _fetchDriverName(jobRow['assigned_driver_id']);

    // ── 10. Start time ──────────────────────────────────────────────────────
    final rawStartTime = direction == 'outbound'
        ? jobRow['morning_start_time']
        : jobRow['evening_start_time'];
    final startTime = _formatTime(rawStartTime);

    return PaJobModel(
      jobDbId: jobDbId,
      jobName: (jobRow['job_name'] ?? '').toString(),
      direction: direction,
      sessionId: sessionId,
      sessionStatus: sessionStatus,
      driverName: driverName,
      startTime: startTime,
      stops: stops,
      dropoffs: dropoffs,
    );
  }

  // ── Direction picker (mirrors JobService._pickDirection) ──────────────────

  String? _pickDirection({
    required Map<String, dynamic> jobRow,
    required Map<String, Map<String, dynamic>> sessionMap,
  }) {
    final hasOutbound = jobRow['has_outbound'] == true;
    final hasInbound = jobRow['has_inbound'] == true;

    for (final entry in sessionMap.entries) {
      if (entry.value['status'] == 'active') return entry.key;
    }

    final outboundDone = sessionMap['outbound']?['status'] == 'completed';
    final inboundDone = sessionMap['inbound']?['status'] == 'completed';

    if ((!hasOutbound || outboundDone) && (!hasInbound || inboundDone)) {
      return null;
    }

    if (hasOutbound && !outboundDone) return 'outbound';
    if (hasInbound && !inboundDone) return 'inbound';

    return null;
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  Future<List<Map<String, dynamic>>> _resolvedScheduleForDay({
    required String jobDbId,
    required String weekday,
    required String direction,
    required String todayDate,
  }) async {
    final baseRows = await _supabase
        .from('passenger_schedules')
        .select(
          'passenger_id, stop_order, pickup_address, pickup_postcode, '
          'pickup_latitude, pickup_longitude, pickup_time, '
          'dropoff_address, dropoff_latitude, dropoff_longitude, '
          'dropoff_time, notes',
        )
        .eq('job_id', jobDbId)
        .eq('weekday', weekday)
        .eq('direction', direction)
        .isFilter('exception_date', null)
        .order('stop_order', ascending: direction == 'outbound');

    final exceptionRows = await _supabase
        .from('passenger_schedules')
        .select(
          'passenger_id, stop_order, pickup_address, pickup_postcode, '
          'pickup_latitude, pickup_longitude, pickup_time, '
          'dropoff_address, dropoff_latitude, dropoff_longitude, '
          'dropoff_time, exception_type, notes',
        )
        .eq('job_id', jobDbId)
        .eq('weekday', weekday)
        .eq('direction', direction)
        .eq('exception_date', todayDate);

    final exceptionMap = <String, Map<String, dynamic>>{};
    for (final row in exceptionRows) {
      final pid = (row['passenger_id'] ?? '').toString();
      if (pid.isNotEmpty) {
        exceptionMap[pid] = Map<String, dynamic>.from(row as Map);
      }
    }

    final result = <Map<String, dynamic>>[];
    for (final base in baseRows) {
      final pid = (base['passenger_id'] ?? '').toString();
      final exception = exceptionMap[pid];
      if (exception != null) {
        if ((exception['exception_type'] ?? '') == 'skip') continue;
        result.add(Map<String, dynamic>.from(exception));
      } else {
        result.add(Map<String, dynamic>.from(base as Map));
      }
    }
    return result;
  }

  Future<Map<String, Map<String, dynamic>>> _fetchPassengerProfiles(
    List<String> passengerIds,
  ) async {
    if (passengerIds.isEmpty) return {};
    final rows = await _supabase
        .from('passenger')
        .select(
          'id, first_name, surname, contact_number_1, '
          'educational_site_address, educational_site_postcode, '
          'educational_site_latitude, educational_site_longitude, '
          'educational_site_dropoff_time, '
          'wheelchair_required, harness_required',
        )
        .inFilter('id', passengerIds);
    final map = <String, Map<String, dynamic>>{};
    for (final row in rows) {
      final id = (row['id'] ?? '').toString();
      if (id.isNotEmpty) map[id] = Map<String, dynamic>.from(row as Map);
    }
    return map;
  }

  Future<String> _fetchDriverName(dynamic driverId) async {
    final id = (driverId ?? '').toString();
    if (id.isEmpty) return 'Unassigned';
    final row = await _supabase
        .from('drivers')
        .select('first_name, last_name')
        .eq('id', id)
        .maybeSingle();
    if (row == null) return 'Unassigned';
    final first = (row['first_name'] ?? '').toString().trim();
    final last = (row['last_name'] ?? '').toString().trim();
    final full = [first, last].where((x) => x.isNotEmpty).join(' ');
    return full.isEmpty ? 'Unassigned' : full;
  }

  // ── Date / time helpers ────────────────────────────────────────────────────

  String _weekdayKey(DateTime dt) {
    const keys = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    return keys[dt.weekday - 1];
  }

  String _dateString(DateTime dt) =>
      '${dt.year.toString().padLeft(4, '0')}-'
      '${dt.month.toString().padLeft(2, '0')}-'
      '${dt.day.toString().padLeft(2, '0')}';

  String _formatTime(dynamic rawTime) {
    final raw = (rawTime ?? '').toString().trim();
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

  int _asInt(dynamic value) {
    if (value is int) return value;
    if (value is num) return value.toInt();
    return int.tryParse(value?.toString() ?? '') ?? 0;
  }
}
