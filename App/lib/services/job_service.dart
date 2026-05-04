import 'package:supabase_flutter/supabase_flutter.dart';
import '../users/driver/models/job_model.dart';

/// All Supabase queries for the active job + session flow.
///
/// Schema overview:
///   jobs               → semester-based job row
///   job_sessions       → one row per (job_id, date, direction); created on start
///   job_session_passengers → per-passenger status within a session
///   passenger_schedules    → base schedule rows (exception_date IS NULL)
///                            + exception rows (exception_date IS NOT NULL)
///   passenger              → profile including educational_site coords
class JobService {
  SupabaseClient get _supabase => Supabase.instance.client;

  // ── Fetch current job ─────────────────────────────────────────────────────

  /// Returns the active job + today's session for the signed-in driver.
  ///
  /// Flow:
  ///   1. Find an active job assigned to this driver (semester covers today).
  ///   2. Determine today's weekday and direction (outbound before noon, else inbound).
  ///   3. Check for an existing job_session for (job, today, direction).
  ///   4. If session exists → load its job_session_passengers.
  ///      If no session yet → build a preview from passenger_schedules
  ///      (session is created lazily when driver taps Start Run).
  ///   5. Map to JobModel.
  Future<JobModel?> fetchCurrentJob() async {
    final userId = _supabase.auth.currentUser?.id;
    if (userId == null || userId.isEmpty) return null;

    final today = DateTime.now();
    final todayDate = _dateString(today); // 'YYYY-MM-DD'
    final weekday = _weekdayKey(today); // 'mon' | 'tue' | ...
    final direction = _resolveDirection(today); // 'outbound' | 'inbound'

    // ── 1. Find active job ─────────────────────────────────────────────────
    final jobRows = await _supabase
        .from('jobs')
        .select(
          'id, job_name, internal_job_id, assigned_pa_id, '
          'has_outbound, has_inbound, '
          'morning_start_time, morning_end_time, evening_start_time, '
          'semester_start, semester_end, status',
        )
        .eq('assigned_driver_id', userId)
        .eq('status', 'active')
        .lte('semester_start', todayDate)
        .gte('semester_end', todayDate)
        .limit(1);

    if (jobRows.isEmpty) return null;

    final jobRow = Map<String, dynamic>.from(jobRows.first);
    final jobDbId = (jobRow['id'] ?? '').toString();
    if (jobDbId.isEmpty) return null;

    // ── 2. Check direction availability ───────────────────────────────────
    final hasDirection = direction == 'outbound'
        ? jobRow['has_outbound'] == true
        : jobRow['has_inbound'] == true;
    if (!hasDirection) return null;

    // ── 3. Look for existing session today ────────────────────────────────
    final sessionRows = await _supabase
        .from('job_sessions')
        .select('id, status, started_at, completed_at')
        .eq('job_id', jobDbId)
        .eq('session_date', todayDate)
        .eq('direction', direction)
        .limit(1);

    String sessionId = '';
    bool sessionExists = false;

    if (sessionRows.isNotEmpty) {
      sessionId = (sessionRows.first['id'] ?? '').toString();
      sessionExists = sessionId.isNotEmpty;
    }

    // ── 4a. Session exists → load its passengers ──────────────────────────
    List<Map<String, dynamic>> passengerRows = [];

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
    } else {
      // ── 4b. No session yet → preview from passenger_schedules ─────────
      passengerRows = await _buildSchedulePreview(
        jobDbId: jobDbId,
        weekday: weekday,
        direction: direction,
        today: todayDate,
      );
    }

    if (passengerRows.isEmpty) return null;

    // ── 5. Enrich with passenger profile data ─────────────────────────────
    final passengerIds = passengerRows
        .map((r) => r['passenger_id']?.toString())
        .whereType<String>()
        .where((id) => id.isNotEmpty)
        .toSet()
        .toList();

    final profileMap = await _fetchPassengerProfiles(passengerIds);

    // ── 6. Build PickupStop list ──────────────────────────────────────────
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

      // Scheduled time: from schedule preview rows OR from session rows
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

    // ── 7. Build DropoffStop (one: the school) ────────────────────────────
    // Use the educational site of the first passenger as the shared dropoff.
    final firstProfile = passengerIds.isNotEmpty
        ? profileMap[passengerIds.first]
        : null;

    final dropoffAddress = (firstProfile?['educational_site_address'] ?? '')
        .toString();
    final dropoffLat = _asDouble(firstProfile?['educational_site_latitude']);
    final dropoffLng = _asDouble(firstProfile?['educational_site_longitude']);
    final dropoffTime = _formatTime(
      firstProfile?['educational_site_dropoff_time'],
    );

    // For the dropoff stop id: use the session passenger id of first row
    // (dropoff is tracked by marking all passengers dropped_off).
    final dropoffStopId = passengerRows.isNotEmpty
        ? (passengerRows.first['id'] ?? '').toString()
        : '';

    final dropoffs = dropoffAddress.isNotEmpty
        ? [
            DropoffStop(
              id: dropoffStopId,
              dropoffOrder: 1,
              address: dropoffAddress,
              scheduledTime: dropoffTime,
              lat: dropoffLat,
              lng: dropoffLng,
              status: _toDropoffStatus(
                sessionExists && passengerRows.isNotEmpty
                    ? passengerRows.first['status']
                    : null,
              ),
            ),
          ]
        : <DropoffStop>[];

    // ── 8. PA name ────────────────────────────────────────────────────────
    final paName = await _fetchPaName(jobRow['assigned_pa_id']);

    // ── 9. Compute derived display fields ─────────────────────────────────
    final nextPending = pickups
        .where((p) => p.status == PickupStatus.pending)
        .toList();
    final nextPickupTime = nextPending.isNotEmpty
        ? nextPending.first.scheduledTime
        : dropoffTime;

    final displayJobId = (jobRow['internal_job_id'] ?? jobDbId.substring(0, 8))
        .toString();

    return JobModel(
      jobDbId: jobDbId,
      sessionId: sessionId, // empty string if session not yet created
      jobId: displayJobId,
      routeNumber: (jobRow['job_name'] ?? '').toString(),
      paName: paName,
      nextPickupTime: nextPickupTime,
      totalEta: '',
      totalDistance: '',
      dropoffLocation: dropoffAddress,
      dropoffEta: dropoffTime,
      direction: direction,
      pickups: pickups,
      dropoffs: dropoffs,
    );
  }

  // ── Session management ────────────────────────────────────────────────────

  /// Creates a job_session and inserts job_session_passengers from
  /// today's passenger_schedules (with exception overrides applied).
  ///
  /// Returns the new session id.
  /// Safe to call multiple times — upsert on (job_id, session_date, direction).
  Future<String> startSession({
    required String jobDbId,
    required String direction,
  }) async {
    final userId = _supabase.auth.currentUser?.id;
    if (userId == null) throw Exception('Not authenticated.');

    final today = DateTime.now();
    final todayDate = _dateString(today);
    final weekday = _weekdayKey(today);

    // Upsert session row
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

    // Check if passengers already inserted (idempotent)
    final existing = await _supabase
        .from('job_session_passengers')
        .select('id')
        .eq('session_id', sessionId)
        .limit(1);

    if (existing.isNotEmpty) return sessionId;

    // Build passenger rows from schedule
    final scheduleRows = await _resolvedScheduleForDay(
      jobDbId: jobDbId,
      weekday: weekday,
      direction: direction,
      todayDate: todayDate,
    );

    if (scheduleRows.isEmpty) return sessionId;

    // Enrich with passenger profile for addresses
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

      final dropoffAddress = (profile?['educational_site_address'] ?? '')
          .toString();
      final dropoffPostcode = (profile?['educational_site_postcode'] ?? '')
          .toString();

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

  /// Marks a single pickup stop as picked_up or missed.
  /// [pickupId] → job_session_passengers.id
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

  /// Marks a dropoff stop as dropped_off.
  /// [dropoffId] → job_session_passengers.id
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

  /// Completes the session:
  ///   - Marks all remaining pending passengers as dropped_off
  ///   - Sets job_sessions.status = 'completed'
  Future<void> completeJob({
    required String sessionId,
    String? comments,
  }) async {
    if (sessionId.isEmpty) return;

    // Mark any still-pending passengers as dropped_off
    await _supabase
        .from('job_session_passengers')
        .update({
          'status': 'dropped_off',
          'dropped_off_at': DateTime.now().toIso8601String(),
          'updated_at': DateTime.now().toIso8601String(),
        })
        .eq('session_id', sessionId)
        .eq('status', 'picked_up'); // only those who were actually on board

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

  /// Builds a preview passenger list from passenger_schedules before a
  /// session is started. Returns rows shaped like job_session_passengers
  /// so the rest of the fetch logic is reusable.
  Future<List<Map<String, dynamic>>> _buildSchedulePreview({
    required String jobDbId,
    required String weekday,
    required String direction,
    required String today,
  }) async {
    final rows = await _resolvedScheduleForDay(
      jobDbId: jobDbId,
      weekday: weekday,
      direction: direction,
      todayDate: today,
    );

    // Shape to match job_session_passengers columns used downstream.
    return rows.map((r) {
      return {
        'id': '', // no DB id yet — session not started
        'passenger_id': r['passenger_id'],
        'stop_order': r['stop_order'],
        'status': 'pending',
        'pickup_address': r['pickup_address'],
        'pickup_latitude': r['pickup_latitude'],
        'pickup_longitude': r['pickup_longitude'],
        'dropoff_address': '',
        'scheduled_time': r['pickup_time'], // for display
        'notes': r['notes'],
      };
    }).toList();
  }

  /// Fetches passenger_schedules for a given job/weekday/direction,
  /// applying exception overrides for today's date.
  ///
  /// Priority: exception rows (exception_date = today) override base rows.
  /// Rows with exception_type = 'skip' are excluded entirely.
  Future<List<Map<String, dynamic>>> _resolvedScheduleForDay({
    required String jobDbId,
    required String weekday,
    required String direction,
    required String todayDate,
  }) async {
    // Fetch base rows
    final baseRows = await _supabase
        .from('passenger_schedules')
        .select(
          'passenger_id, stop_order, pickup_address, pickup_postcode, '
          'pickup_latitude, pickup_longitude, pickup_time, notes',
        )
        .eq('job_id', jobDbId)
        .eq('weekday', weekday)
        .eq('direction', direction)
        .isFilter('exception_date', null)
        .order('stop_order', ascending: direction == 'outbound');

    // Fetch exception rows for today
    final exceptionRows = await _supabase
        .from('passenger_schedules')
        .select(
          'passenger_id, stop_order, pickup_address, pickup_postcode, '
          'pickup_latitude, pickup_longitude, pickup_time, exception_type, notes',
        )
        .eq('job_id', jobDbId)
        .eq('weekday', weekday)
        .eq('direction', direction)
        .eq('exception_date', todayDate);

    // Build exception map: passenger_id → exception row
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
        final type = (exception['exception_type'] ?? '').toString();
        if (type == 'skip') continue; // passenger absent today
        // alternative_location or extra_day: use exception row data
        result.add(Map<String, dynamic>.from(exception));
      } else {
        result.add(Map<String, dynamic>.from(base as Map));
      }
    }

    return result;
  }

  /// Fetches passenger profiles keyed by passenger id.
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
      if (id.isNotEmpty) {
        map[id] = Map<String, dynamic>.from(row as Map);
      }
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

  /// Returns 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'
  String _weekdayKey(DateTime dt) {
    const keys = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    return keys[dt.weekday - 1]; // DateTime.monday = 1
  }

  /// Simple heuristic: before 13:00 = outbound (morning), else inbound (evening).
  String _resolveDirection(DateTime dt) {
    return dt.hour < 13 ? 'outbound' : 'inbound';
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
