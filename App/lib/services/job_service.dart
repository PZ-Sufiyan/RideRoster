import 'package:supabase_flutter/supabase_flutter.dart';
import '../users/driver/models/job_model.dart';

/// All Supabase queries for the active job + session flow.
///
/// Key design for outbound vs inbound:
///
/// OUTBOUND (morning — home → school):
///   Pickups  = passenger home addresses (different per passenger)
///   Dropoffs = school (one shared stop, from passenger.educational_site_*)
///
/// INBOUND (evening — school → home):
///   Pickups  = school address (same for all, from passenger_schedules.pickup_address)
///   Dropoffs = passenger home addresses (different per passenger,
///              from passenger_schedules.dropoff_address / dropoff_lat / dropoff_lng)
///
/// passenger_schedules.dropoff_address is the correct source for inbound
/// dropoffs — NOT passenger.educational_site_address.
class JobService {
  SupabaseClient get _supabase => Supabase.instance.client;

  // ── Fetch current job ─────────────────────────────────────────────────────

  Future<JobModel?> fetchCurrentJob() async {
    final userId = _supabase.auth.currentUser?.id;
    if (userId == null || userId.isEmpty) return null;

    final today = DateTime.now();
    final todayDate = _dateString(today);
    final weekday = _weekdayKey(today);

    // Find the job (direction-independent)
    final jobRows = await _supabase
        .from('jobs')
        .select(
          'id, job_name, internal_job_id, assigned_pa_id, '
          'has_outbound, has_inbound, '
          'morning_start_time, morning_end_time, evening_start_time, '
          'semester_start, semester_end, status',
        )
        .eq('assigned_driver_id', userId)
        .eq('driver_approval_status', 'accepted')
        .neq('status', 'cancelled')
        .lte('semester_start', todayDate)
        .gte('semester_end', todayDate)
        .limit(1);

    if (jobRows.isEmpty) return null;

    final jobRow = Map<String, dynamic>.from(jobRows.first);
    final jobDbId = (jobRow['id'] ?? '').toString();
    if (jobDbId.isEmpty) return null;

    // Load all today's sessions to decide direction
    final allSessionsToday = await _supabase
        .from('job_sessions')
        .select('id, direction, status')
        .eq('job_id', jobDbId)
        .eq('session_date', todayDate);

    final sessionMap = <String, Map<String, dynamic>>{};
    for (final s in allSessionsToday) {
      final dir = (s['direction'] ?? '').toString();
      sessionMap[dir] = Map<String, dynamic>.from(s as Map);
    }

    final direction = _pickDirection(
      jobRow: jobRow,
      sessionMap: sessionMap,
      now: today,
    );
    if (direction == null) return null;

    final hasDirection = direction == 'outbound'
        ? jobRow['has_outbound'] == true
        : jobRow['has_inbound'] == true;
    if (!hasDirection) return null;

    final existingSession = sessionMap[direction];
    final sessionId = existingSession?['id']?.toString() ?? '';
    final sessionExists = sessionId.isNotEmpty;

    // ── Build passenger rows ──────────────────────────────────────────────

    // scheduleRows holds the full passenger_schedules rows (with dropoff coords)
    // needed for both preview and time injection into session passengers.
    List<Map<String, dynamic>> scheduleRows = [];
    List<Map<String, dynamic>> passengerRows = [];

    // Always fetch schedules — needed for:
    //   - preview (no session yet)
    //   - time injection (session exists)
    //   - inbound dropoff addresses (session exists, inbound direction)
    scheduleRows = await _resolvedScheduleForDay(
      jobDbId: jobDbId,
      weekday: weekday,
      direction: direction,
      todayDate: todayDate,
    );

    // Build schedule lookup by passenger_id
    final scheduleByPassenger = <String, Map<String, dynamic>>{};
    for (final s in scheduleRows) {
      final pid = (s['passenger_id'] ?? '').toString();
      if (pid.isNotEmpty) scheduleByPassenger[pid] = s;
    }

    if (sessionExists) {
      final spRows = await _supabase
          .from('job_session_passengers')
          .select(
            'id, passenger_id, stop_order, status, '
            'pickup_address, pickup_latitude, pickup_longitude, '
            'dropoff_address, picked_up_at, dropped_off_at, notes',
          )
          .eq('session_id', sessionId)
          .order('stop_order', ascending: direction == 'outbound');

      passengerRows = spRows
          .map((r) => Map<String, dynamic>.from(r as Map))
          .toList();

      // Inject pickup_time and dropoff coords from passenger_schedules
      for (final row in passengerRows) {
        final pid = (row['passenger_id'] ?? '').toString();
        final schedule = scheduleByPassenger[pid];
        if (schedule != null) {
          row['scheduled_time'] = schedule['pickup_time'] ?? '';
          // Inject inbound dropoff address+coords from schedule
          // (job_session_passengers only stores pickup coords)
          if (direction == 'inbound') {
            row['inbound_dropoff_address'] = schedule['dropoff_address'] ?? '';
            row['inbound_dropoff_lat'] = schedule['dropoff_latitude'];
            row['inbound_dropoff_lng'] = schedule['dropoff_longitude'];
          }
        }
      }
    } else {
      // Preview from schedules
      passengerRows = scheduleRows.map((r) {
        return {
          'id': '',
          'passenger_id': r['passenger_id'],
          'stop_order': r['stop_order'],
          'status': 'pending',
          'pickup_address': r['pickup_address'],
          'pickup_latitude': r['pickup_latitude'],
          'pickup_longitude': r['pickup_longitude'],
          'dropoff_address': r['dropoff_address'] ?? '',
          'scheduled_time': r['pickup_time'],
          'notes': r['notes'],
          // inbound dropoff from schedule
          if (direction == 'inbound') ...{
            'inbound_dropoff_address': r['dropoff_address'] ?? '',
            'inbound_dropoff_lat': r['dropoff_latitude'],
            'inbound_dropoff_lng': r['dropoff_longitude'],
          },
        };
      }).toList();
    }

    if (passengerRows.isEmpty) return null;

    // ── Passenger profiles ────────────────────────────────────────────────

    final passengerIds = passengerRows
        .map((r) => r['passenger_id']?.toString())
        .whereType<String>()
        .where((id) => id.isNotEmpty)
        .toSet()
        .toList();

    final profileMap = await _fetchPassengerProfiles(passengerIds);

    // ── Build PickupStop list ─────────────────────────────────────────────

    final pickups = <PickupStop>[];

    for (final row in passengerRows) {
      final passengerId = (row['passenger_id'] ?? '').toString();
      final profile = profileMap[passengerId];

      final firstName = (profile?['first_name'] ?? '').toString().trim();
      final surname = (profile?['surname'] ?? '').toString().trim();
      final fullName = [
        firstName,
        surname,
      ].where((s) => s.isNotEmpty).join(' ');
      final phone = (profile?['contact_number_1'] ?? '').toString().trim();

      final address = (row['pickup_address'] ?? '').toString();
      final lat = _asDouble(row['pickup_latitude']);
      final lng = _asDouble(row['pickup_longitude']);
      final order = _asInt(row['stop_order']);
      final scheduledTime = _formatTime(row['scheduled_time']);

      pickups.add(
        PickupStop(
          id: (row['id'] ?? '').toString(),
          stopNumber: order == 0 ? pickups.length + 1 : order,
          passengerName: fullName.isEmpty ? 'Student' : fullName,
          passengerPhone: phone,
          locationName: address,
          address: address,
          eta: 'ETA pending',
          scheduledTime: scheduledTime,
          lat: lat,
          lng: lng,
          status: sessionExists
              ? _toPickupStatus(row['status'])
              : PickupStatus.pending,
        ),
      );
    }

    // ── Build DropoffStop list ────────────────────────────────────────────
    //
    // OUTBOUND: one shared school dropoff (from passenger profile)
    // INBOUND:  one dropoff per passenger (home address from schedule)

    final dropoffs = <DropoffStop>[];

    if (direction == 'outbound') {
      // One shared school dropoff
      final firstProfile = passengerIds.isNotEmpty
          ? profileMap[passengerIds.first]
          : null;
      final schoolAddress = (firstProfile?['educational_site_address'] ?? '')
          .toString();
      final schoolLat = _asDouble(firstProfile?['educational_site_latitude']);
      final schoolLng = _asDouble(firstProfile?['educational_site_longitude']);
      final dropoffTime = _formatTime(
        firstProfile?['educational_site_dropoff_time'],
      );
      final dropoffStopId = passengerRows.isNotEmpty
          ? (passengerRows.first['id'] ?? '').toString()
          : '';

      if (schoolAddress.isNotEmpty) {
        dropoffs.add(
          DropoffStop(
            id: dropoffStopId,
            dropoffOrder: 1,
            address: schoolAddress,
            scheduledTime: dropoffTime,
            lat: schoolLat,
            lng: schoolLng,
            status: _toDropoffStatus(
              sessionExists && passengerRows.isNotEmpty
                  ? passengerRows.first['status']
                  : null,
            ),
          ),
        );
      }
    } else {
      // INBOUND: one dropoff per passenger — their home address
      for (int i = 0; i < passengerRows.length; i++) {
        final row = passengerRows[i];
        final passengerId = (row['passenger_id'] ?? '').toString();
        final profile = profileMap[passengerId];
        final firstName = (profile?['first_name'] ?? '').toString().trim();
        final surname = (profile?['surname'] ?? '').toString().trim();
        final fullName = [
          firstName,
          surname,
        ].where((s) => s.isNotEmpty).join(' ');

        final homeAddress = (row['inbound_dropoff_address'] ?? '').toString();
        final homeLat = _asDouble(row['inbound_dropoff_lat']);
        final homeLng = _asDouble(row['inbound_dropoff_lng']);

        // Dropoff time for inbound comes from schedule dropoff_time,
        // which may be null — fall back to evening_start_time if needed
        final schedule = scheduleByPassenger[passengerId];
        final dropoffTime = _formatTime(schedule?['dropoff_time']);

        dropoffs.add(
          DropoffStop(
            id: (row['id'] ?? '').toString(),
            dropoffOrder: i + 1,
            address: homeAddress.isNotEmpty ? homeAddress : 'Home address',
            scheduledTime: dropoffTime,
            lat: homeLat,
            lng: homeLng,
            passengerName: fullName.isEmpty ? 'Student' : fullName,
            status: sessionExists
                ? _toDropoffStatus(row['status'])
                : DropoffStatus.pending,
          ),
        );
      }
    }

    // ── PA name ───────────────────────────────────────────────────────────

    final paName = await _fetchPaName(jobRow['assigned_pa_id']);

    // ── Derived display fields ────────────────────────────────────────────

    final nextPending = pickups
        .where((p) => p.status == PickupStatus.pending)
        .toList();

    // For the dashboard "Next pickup" label
    final nextPickupTime = nextPending.isNotEmpty
        ? nextPending.first.scheduledTime
        : (dropoffs.isNotEmpty ? dropoffs.first.scheduledTime : '--:--');

    // Primary dropoff label for dashboard card
    final primaryDropoffLocation = direction == 'outbound'
        ? (dropoffs.isNotEmpty ? dropoffs.first.address : '')
        : (dropoffs.isNotEmpty ? '${dropoffs.length} home drop-offs' : '');

    // Dropoff ETA for dashboard card
    final primaryDropoffEta = dropoffs.isNotEmpty
        ? dropoffs.first.scheduledTime
        : '--:--';

    final displayJobId = (jobRow['internal_job_id'] ?? jobDbId.substring(0, 8))
        .toString();

    return JobModel(
      jobDbId: jobDbId,
      sessionId: sessionId,
      jobId: displayJobId,
      routeNumber: (jobRow['job_name'] ?? '').toString(),
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

  // ── Direction picker ──────────────────────────────────────────────────────

  String? _pickDirection({
    required Map<String, dynamic> jobRow,
    required Map<String, Map<String, dynamic>> sessionMap,
    required DateTime now,
  }) {
    final hasOutbound = jobRow['has_outbound'] == true;
    final hasInbound = jobRow['has_inbound'] == true;

    // Priority 1: active session
    for (final entry in sessionMap.entries) {
      if (entry.value['status'] == 'active') return entry.key;
    }

    final outboundDone = sessionMap['outbound']?['status'] == 'completed';
    final inboundDone = sessionMap['inbound']?['status'] == 'completed';

    if ((!hasOutbound || outboundDone) && (!hasInbound || inboundDone)) {
      return null;
    }

    final preferOutbound = now.hour < 13;

    if (preferOutbound) {
      if (hasOutbound && !outboundDone) return 'outbound';
      if (hasInbound && !inboundDone) return 'inbound';
    } else {
      if (hasInbound && !inboundDone) return 'inbound';
      if (hasOutbound && !outboundDone) return 'outbound';
    }

    return null;
  }

  // ── Session management ────────────────────────────────────────────────────

  Future<String> startSession({
    required String jobDbId,
    required String direction,
  }) async {
    final userId = _supabase.auth.currentUser?.id;
    if (userId == null) throw Exception('Not authenticated.');

    final today = DateTime.now();
    final todayDate = _dateString(today);
    final weekday = _weekdayKey(today);

    final sessionResult = await _supabase
        .from('job_sessions')
        .upsert({
          'job_id': jobDbId,
          'session_date': todayDate,
          'direction': direction,
          'status': 'active',
          'driver_id': userId,
          'started_at': DateTime.now().toIso8601String(),
        }, onConflict: 'job_id,session_date,direction')
        .select('id')
        .single();

    final sessionId = (sessionResult['id'] ?? '').toString();
    if (sessionId.isEmpty) throw Exception('Failed to create session.');

    final existing = await _supabase
        .from('job_session_passengers')
        .select('id')
        .eq('session_id', sessionId)
        .limit(1);

    if (existing.isNotEmpty) return sessionId;

    final scheduleRows = await _resolvedScheduleForDay(
      jobDbId: jobDbId,
      weekday: weekday,
      direction: direction,
      todayDate: todayDate,
    );

    if (scheduleRows.isEmpty) return sessionId;

    final passengerIds = scheduleRows
        .map((r) => r['passenger_id']?.toString())
        .whereType<String>()
        .toList();

    final profileMap = await _fetchPassengerProfiles(passengerIds);
    final insertRows = <Map<String, dynamic>>[];

    for (final row in scheduleRows) {
      final passengerId = (row['passenger_id'] ?? '').toString();
      final profile = profileMap[passengerId];

      final pickupAddress = (row['pickup_address'] ?? '').toString();
      final pickupPostcode = (row['pickup_postcode'] ?? '').toString();
      final pickupLat = _asDouble(row['pickup_latitude']);
      final pickupLng = _asDouble(row['pickup_longitude']);

      // Dropoff address: for outbound use school, for inbound use home
      final dropoffAddress = direction == 'outbound'
          ? (profile?['educational_site_address'] ?? '').toString()
          : (row['dropoff_address'] ?? '').toString();
      final dropoffPostcode = direction == 'outbound'
          ? (profile?['educational_site_postcode'] ?? '').toString()
          : (row['dropoff_postcode'] ?? '').toString();

      insertRows.add({
        'session_id': sessionId,
        'passenger_id': passengerId,
        'stop_order': _asInt(row['stop_order']),
        'status': 'pending',
        'pickup_address': pickupAddress,
        'pickup_postcode': pickupPostcode.isNotEmpty ? pickupPostcode : null,
        'pickup_latitude': pickupLat,
        'pickup_longitude': pickupLng,
        'dropoff_address': dropoffAddress,
        'dropoff_postcode': dropoffPostcode.isNotEmpty ? dropoffPostcode : null,
        'notes': row['notes'],
      });
    }

    if (insertRows.isNotEmpty) {
      await _supabase.from('job_session_passengers').insert(insertRows);
    }

    return sessionId;
  }

  // ── Status mutations ──────────────────────────────────────────────────────

  Future<void> updatePickupStatus(String pickupId, PickupStatus status) async {
    if (pickupId.isEmpty) return;
    final update = <String, dynamic>{
      'status': _dbPickupStatus(status),
      'updated_at': DateTime.now().toIso8601String(),
    };
    if (status == PickupStatus.completed) {
      update['picked_up_at'] = DateTime.now().toIso8601String();
    }
    await _supabase
        .from('job_session_passengers')
        .update(update)
        .eq('id', pickupId);
  }

  Future<void> updateDropoffStatus(
    String dropoffId,
    DropoffStatus status,
  ) async {
    if (dropoffId.isEmpty) return;
    final update = <String, dynamic>{
      'status': status == DropoffStatus.completed ? 'dropped_off' : 'pending',
      'updated_at': DateTime.now().toIso8601String(),
    };
    if (status == DropoffStatus.completed) {
      update['dropped_off_at'] = DateTime.now().toIso8601String();
    }
    await _supabase
        .from('job_session_passengers')
        .update(update)
        .eq('id', dropoffId);
  }

  Future<void> completeJob({
    required String sessionId,
    String? comments,
  }) async {
    if (sessionId.isEmpty) return;

    await _supabase
        .from('job_session_passengers')
        .update({
          'status': 'dropped_off',
          'dropped_off_at': DateTime.now().toIso8601String(),
          'updated_at': DateTime.now().toIso8601String(),
        })
        .eq('session_id', sessionId)
        .eq('status', 'picked_up');

    await _supabase
        .from('job_sessions')
        .update({
          'status': 'completed',
          'completed_at': DateTime.now().toIso8601String(),
          'updated_at': DateTime.now().toIso8601String(),
        })
        .eq('id', sessionId);
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  Future<List<Map<String, dynamic>>> _resolvedScheduleForDay({
    required String jobDbId,
    required String weekday,
    required String direction,
    required String todayDate,
  }) async {
    // Include dropoff_address + dropoff_latitude + dropoff_longitude
    // needed for inbound per-passenger home dropoffs
    final baseRows = await _supabase
        .from('passenger_schedules')
        .select(
          'passenger_id, stop_order, pickup_address, pickup_postcode, '
          'pickup_latitude, pickup_longitude, pickup_time, '
          'dropoff_address, dropoff_postcode, '
          'dropoff_latitude, dropoff_longitude, dropoff_time, notes',
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
          'dropoff_address, dropoff_postcode, '
          'dropoff_latitude, dropoff_longitude, dropoff_time, '
          'exception_type, notes',
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
          'educational_site_dropoff_time, wheelchair_required, harness_required',
        )
        .inFilter('id', passengerIds);
    final map = <String, Map<String, dynamic>>{};
    for (final row in rows) {
      final id = (row['id'] ?? '').toString();
      if (id.isNotEmpty) map[id] = Map<String, dynamic>.from(row as Map);
    }
    return map;
  }

  Future<String> _fetchPaName(dynamic assignedPaId) async {
    final paId = (assignedPaId ?? '').toString();
    if (paId.isEmpty) return 'Unassigned';
    final row = await _supabase
        .from('passenger_assistant')
        .select('first_name, surname')
        .eq('id', paId)
        .maybeSingle();
    if (row == null) return 'Unassigned';
    final first = (row['first_name'] ?? '').toString().trim();
    final last = (row['surname'] ?? '').toString().trim();
    final full = [first, last].where((x) => x.isNotEmpty).join(' ');
    return full.isEmpty ? 'Unassigned' : full;
  }

  // ── Status converters ─────────────────────────────────────────────────────

  PickupStatus _toPickupStatus(dynamic raw) {
    final s = (raw ?? '').toString().toLowerCase();
    if (s == 'picked_up') return PickupStatus.completed;
    if (s == 'missed') return PickupStatus.notPicked;
    return PickupStatus.pending;
  }

  DropoffStatus _toDropoffStatus(dynamic raw) {
    final s = (raw ?? '').toString().toLowerCase();
    return s == 'dropped_off' ? DropoffStatus.completed : DropoffStatus.pending;
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

  // ── Date / time helpers ───────────────────────────────────────────────────

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

  double? _asDouble(dynamic value) {
    if (value == null) return null;
    if (value is double) return value;
    if (value is num) return value.toDouble();
    return double.tryParse(value.toString());
  }
}
