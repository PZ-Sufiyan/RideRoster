import 'package:supabase_flutter/supabase_flutter.dart';
import '../model/pa_job_model.dart';
import '../model/job_model.dart' show PickupStatus, DropoffStatus;
import '../repositories/local_job_repository.dart';
import '../services/connectivity_service.dart';
import '../utils/session_schedule.dart';

/// All Supabase queries for the Passenger Assistant — with offline-first fallback.
///
/// Every public method tries local drift cache first (via [LocalJobRepository]).
/// If local data is unavailable, falls back to Supabase when online.
/// Supabase calls use a 4-second timeout to fail fast on "WiFi but no internet".
class PaJobService {
  final LocalJobRepository _localRepo;
  SupabaseClient get _supabase => Supabase.instance.client;

  PaJobService(this._localRepo);

  // ══════════════════════════════════════════════════════════════════════════
  // 1. LIVE JOB VIEW
  // ══════════════════════════════════════════════════════════════════════════

  /// Whether [sessionId] has status `completed`.
  /// Reads from local sessions_local first — falls back to Supabase.
  Future<bool> isSessionCompleted(String sessionId) async {
    if (sessionId.isEmpty) return false;

    // Local check first — sessions_local is always up to date from driver writes
    final localResult = await _localRepo.isPaSessionCompleted(sessionId);
    if (localResult) return true;

    // Not completed locally — check Supabase if online
    if (!ConnectivityService().canReachServer) return false;
    try {
      final row = await _supabase
          .from('job_sessions')
          .select('status')
          .eq('id', sessionId)
          .maybeSingle()
          .timeout(const Duration(seconds: 4));
      return (row?['status'] ?? '').toString() == 'completed';
    } catch (_) {
      return false;
    }
  }

  Future<PaJobModel?> fetchCurrentJob() async {
    final userId = _supabase.auth.currentUser?.id;
    if (userId == null || userId.isEmpty) return null;

    // When online, pull live session/passenger state from Supabase first.
    // PA devices are read-only — the driver writes from another device, so
    // local sessions_local / passengers_local go stale without this refresh.
    if (ConnectivityService().canReachServer) {
      try {
        await _syncPaLiveStateFromServer(userId);
      } catch (_) {}

      try {
        final local = await _localRepo.fetchPaCurrentJob(userId);
        if (local != null) return local;
      } catch (_) {}

      try {
        return await _fetchCurrentJobFromSupabase(userId);
      } catch (_) {}
    }

    // Offline — read mirrored local state only.
    try {
      return await _localRepo.fetchPaCurrentJob(userId);
    } catch (_) {
      return null;
    }
  }

  /// Pulls today's job_sessions + job_session_passengers from Supabase into
  /// local drift tables so [fetchPaCurrentJob] reflects driver progress.
  Future<void> _syncPaLiveStateFromServer(String paUserId) async {
    final todayDate = _dateString(DateTime.now());

    final assignedRows = await _supabase
        .from('jobs')
        .select('id')
        .eq('assigned_pa_id', paUserId)
        .eq('driver_approval_status', 'accepted')
        .neq('status', 'cancelled')
        .limit(1)
        .timeout(const Duration(seconds: 4));

    if (assignedRows.isEmpty) {
      await _localRepo.unassignPaFromCachedJobs(paUserId);
      return;
    }

    final jobRows = await _supabase
        .from('jobs')
        .select('id')
        .eq('assigned_pa_id', paUserId)
        .eq('driver_approval_status', 'accepted')
        .neq('status', 'cancelled')
        .lte('semester_start', todayDate)
        .gte('semester_end', todayDate)
        .limit(1)
        .timeout(const Duration(seconds: 4));

    if (jobRows.isEmpty) return;
    final jobDbId = (jobRows.first['id'] ?? '').toString();
    if (jobDbId.isEmpty) return;

    final sessionRows = await _supabase
        .from('job_sessions')
        .select(
          'id, direction, status, driver_id, started_at, completed_at, note',
        )
        .eq('job_id', jobDbId)
        .eq('session_date', todayDate)
        .timeout(const Duration(seconds: 4));

    final sessions = sessionRows
        .map((s) => Map<String, dynamic>.from(s as Map))
        .toList();
    if (sessions.isEmpty) return;

    final passengersByServerSessionId = <String, List<Map<String, dynamic>>>{};
    for (final session in sessions) {
      final sessionId = (session['id'] ?? '').toString();
      if (sessionId.isEmpty) continue;

      final passengerRows = await _supabase
          .from('job_session_passengers')
          .select(
            'id, passenger_id, stop_order, status, '
            'pickup_address, pickup_postcode, pickup_latitude, pickup_longitude, '
            'dropoff_address, dropoff_postcode, notes, '
            'picked_up_at, dropped_off_at',
          )
          .eq('session_id', sessionId)
          .timeout(const Duration(seconds: 4));

      passengersByServerSessionId[sessionId] = passengerRows
          .map((r) => Map<String, dynamic>.from(r as Map))
          .toList();
    }

    await _localRepo.mirrorPaLiveStateFromServer(
      jobId: jobDbId,
      todayDate: todayDate,
      sessions: sessions,
      passengersByServerSessionId: passengersByServerSessionId,
    );
  }

  Future<PaJobModel?> _fetchCurrentJobFromSupabase(String userId) async {
    final today = DateTime.now();
    final todayDate = _dateString(today);
    final weekday = _weekdayKey(today);

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
        .limit(1)
        .timeout(const Duration(seconds: 4));

    if (jobRows.isEmpty) return null;
    final jobRow = Map<String, dynamic>.from(jobRows.first);
    final jobDbId = (jobRow['id'] ?? '').toString();
    if (jobDbId.isEmpty) return null;

    final allSessions = await _supabase
        .from('job_sessions')
        .select('id, direction, status')
        .eq('job_id', jobDbId)
        .eq('session_date', todayDate)
        .timeout(const Duration(seconds: 4));

    final sessionMap = <String, Map<String, dynamic>>{};
    for (final s in allSessions) {
      final dir = (s['direction'] ?? '').toString();
      sessionMap[dir] = Map<String, dynamic>.from(s as Map);
    }

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

    final sessionStatusMap = <String, String>{};
    if (sessionExists) {
      final spRows = await _supabase
          .from('job_session_passengers')
          .select('passenger_id, status')
          .eq('session_id', sessionId)
          .timeout(const Duration(seconds: 4));
      for (final row in spRows) {
        final pid = (row['passenger_id'] ?? '').toString();
        final status = (row['status'] ?? 'pending').toString();
        if (pid.isNotEmpty) sessionStatusMap[pid] = status;
      }
    }

    final passengerIds = scheduleRows
        .map((r) => r['passenger_id']?.toString())
        .whereType<String>()
        .where((id) => id.isNotEmpty)
        .toSet()
        .toList();

    final profileMap = await _fetchPassengerProfiles(passengerIds);

    final stops = <PaPassengerStop>[];
    for (final row in scheduleRows) {
      final pid = (row['passenger_id'] ?? '').toString();
      final profile = profileMap[pid];
      final fullName = _fullName(profile);
      final rawStatus = sessionStatusMap[pid] ?? 'pending';
      final order = _asInt(row['stop_order']);
      stops.add(
        PaPassengerStop(
          passengerId: pid,
          passengerName: fullName.isEmpty ? 'Student' : fullName,
          address: (row['pickup_address'] ?? '').toString(),
          scheduledTime: _formatTime(row['pickup_time']),
          stopNumber: order == 0 ? stops.length + 1 : order,
          wheelchairRequired: profile?['wheelchair_required'] == true,
          harnessRequired: profile?['harness_required'] == true,
          status: _toPickupStatus(rawStatus),
        ),
      );
    }

    final dropoffs = <PaDropoffStop>[];
    if (direction == 'outbound') {
      final schoolOrder = <String>[];
      final schoolPassengers = <String, List<String>>{};
      final schoolPids = <String, List<String>>{};
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
          schoolPids[schoolAddress] = [];
          schoolMeta[schoolAddress] = {
            'dropoff_time': profile['educational_site_dropoff_time'],
          };
        }
        schoolPassengers[schoolAddress]!.add(
          _fullName(profile).isEmpty ? 'Student' : _fullName(profile),
        );
        schoolPids[schoolAddress]!.add(pid);
      }

      for (final addr in schoolOrder) {
        final pids = schoolPids[addr]!;
        final allDropped =
            sessionExists &&
            pids.isNotEmpty &&
            pids.every(
              (pid) =>
                  (sessionStatusMap[pid] ?? '').toLowerCase() == 'dropped_off',
            );
        dropoffs.add(
          PaDropoffStop(
            address: addr,
            scheduledTime: _formatTime(schoolMeta[addr]?['dropoff_time']),
            passengerNames: schoolPassengers[addr] ?? [],
            status: allDropped
                ? DropoffStatus.completed
                : DropoffStatus.pending,
          ),
        );
      }
    } else {
      for (final row in scheduleRows) {
        final pid = (row['passenger_id'] ?? '').toString();
        final profile = profileMap[pid];
        final homeAddress = (row['dropoff_address'] ?? '').toString();
        final rawStatus = sessionStatusMap[pid] ?? 'pending';
        dropoffs.add(
          PaDropoffStop(
            address: homeAddress.isNotEmpty ? homeAddress : 'Home address',
            scheduledTime: _formatTime(row['dropoff_time']),
            passengerNames: [
              _fullName(profile).isEmpty ? 'Student' : _fullName(profile),
            ],
            status: _toDropoffStatus(rawStatus),
          ),
        );
      }
    }

    final driverName = await _fetchDriverName(jobRow['assigned_driver_id']);
    final rawStartTime = direction == 'outbound'
        ? jobRow['morning_start_time']
        : jobRow['evening_start_time'];

    return PaJobModel(
      jobDbId: jobDbId,
      jobName: (jobRow['job_name'] ?? '').toString(),
      direction: direction,
      sessionId: sessionId,
      sessionStatus: sessionStatus,
      driverName: driverName,
      startTime: _formatTime(rawStartTime),
      stops: stops,
      dropoffs: dropoffs,
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 2. WEEKLY SCHEDULE VIEW
  // ══════════════════════════════════════════════════════════════════════════

  Future<PaAssignedJobModel?> fetchAssignedJob() async {
    final userId = _supabase.auth.currentUser?.id;
    if (userId == null || userId.isEmpty) return null;

    // When online, server assignment is the source of truth. Local cache can
    // still hold a job after admin removes this PA (assigned_pa_id → null).
    if (ConnectivityService().canReachServer) {
      try {
        final remote = await _fetchAssignedJobFromSupabase(userId);
        await _localRepo.unassignPaFromCachedJobs(
          userId,
          keepJobId: remote?.jobDbId,
        );
        return remote;
      } catch (_) {}
    }

    try {
      return await _localRepo.fetchPaAssignedJob(userId);
    } catch (_) {
      return null;
    }
  }

  Future<PaAssignedJobModel?> _fetchAssignedJobFromSupabase(
    String userId,
  ) async {
    final jobRows = await _supabase
        .from('jobs')
        .select(
          'id, job_name, assigned_driver_id, '
          'has_outbound, has_inbound, '
          'morning_start_time, evening_start_time, '
          'semester_start, semester_end',
        )
        .eq('assigned_pa_id', userId)
        .eq('driver_approval_status', 'accepted')
        .neq('status', 'cancelled')
        .limit(1)
        .timeout(const Duration(seconds: 4));

    if (jobRows.isEmpty) return null;
    final jobRow = Map<String, dynamic>.from(jobRows.first);
    final jobDbId = (jobRow['id'] ?? '').toString();
    if (jobDbId.isEmpty) return null;

    final hasOutbound = jobRow['has_outbound'] == true;
    final hasInbound = jobRow['has_inbound'] == true;
    final morningStartTime = _formatTime(jobRow['morning_start_time']);
    final eveningStartTime = _formatTime(jobRow['evening_start_time']);
    final driverName = await _fetchDriverName(jobRow['assigned_driver_id']);

    final scheduleRows = await _supabase
        .from('passenger_schedules')
        .select(
          'passenger_id, weekday, direction, stop_order, '
          'pickup_address, pickup_time, dropoff_address',
        )
        .eq('job_id', jobDbId)
        .isFilter('exception_date', null)
        .order('weekday')
        .order('direction')
        .order('stop_order', ascending: true)
        .timeout(const Duration(seconds: 4));

    if (scheduleRows.isEmpty) {
      return PaAssignedJobModel(
        jobDbId: jobDbId,
        jobName: (jobRow['job_name'] ?? '').toString(),
        semesterStart: _formatDate(jobRow['semester_start']),
        semesterEnd: _formatDate(jobRow['semester_end']),
        activeDays: [],
        schedule: {},
      );
    }

    final passengerIds = scheduleRows
        .map((r) => r['passenger_id']?.toString())
        .whereType<String>()
        .where((id) => id.isNotEmpty)
        .toSet()
        .toList();

    final profileMap = await _fetchPassengerProfiles(passengerIds);

    final rawMap = <String, Map<String, List<Map<String, dynamic>>>>{};
    for (final row in scheduleRows) {
      final weekday = (row['weekday'] ?? '').toString();
      final direction = (row['direction'] ?? '').toString();
      if (weekday.isEmpty || direction.isEmpty) continue;
      if (direction == 'outbound' && !hasOutbound) continue;
      if (direction == 'inbound' && !hasInbound) continue;
      rawMap.putIfAbsent(weekday, () => {});
      rawMap[weekday]!.putIfAbsent(direction, () => []);
      rawMap[weekday]![direction]!.add(Map<String, dynamic>.from(row as Map));
    }

    final schedule = <String, Map<String, PaDayRun>>{};
    for (final weekday in rawMap.keys) {
      schedule[weekday] = {};
      for (final direction in rawMap[weekday]!.keys) {
        final rows = rawMap[weekday]![direction]!
          ..sort(
            (a, b) =>
                _asInt(a['stop_order']).compareTo(_asInt(b['stop_order'])),
          );

        final paStops = rows.map((row) {
          final pid = (row['passenger_id'] ?? '').toString();
          final profile = profileMap[pid];
          final name = _fullName(profile);
          return PaScheduleStop(
            passengerName: name.isEmpty ? 'Student' : name,
            pickupAddress: (row['pickup_address'] ?? '').toString(),
            dropoffAddress: (row['dropoff_address'] ?? '').toString(),
            pickupTime: _formatTime(row['pickup_time']),
            wheelchairRequired: profile?['wheelchair_required'] == true,
            harnessRequired: profile?['harness_required'] == true,
            stopOrder: _asInt(row['stop_order']),
          );
        }).toList();

        schedule[weekday]![direction] = PaDayRun(
          direction: direction,
          startTime: direction == 'outbound'
              ? morningStartTime
              : eveningStartTime,
          driverName: driverName,
          stops: paStops,
        );
      }
    }

    return PaAssignedJobModel(
      jobDbId: jobDbId,
      jobName: (jobRow['job_name'] ?? '').toString(),
      semesterStart: _formatDate(jobRow['semester_start']),
      semesterEnd: _formatDate(jobRow['semester_end']),
      activeDays: rawMap.keys.toList(),
      schedule: schedule,
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SHARED PRIVATE HELPERS
  // ══════════════════════════════════════════════════════════════════════════

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
        .order('stop_order', ascending: direction == 'outbound')
        .timeout(const Duration(seconds: 4));

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
        .eq('exception_date', todayDate)
        .timeout(const Duration(seconds: 4));

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
        .inFilter('id', passengerIds)
        .timeout(const Duration(seconds: 4));
    final map = <String, Map<String, dynamic>>{};
    for (final row in rows) {
      final id = (row['id'] ?? '').toString();
      if (id.isNotEmpty) map[id] = Map<String, dynamic>.from(row as Map);
    }
    return map;
  }

  Future<String> _fetchDriverName(dynamic driverId) async {
    final id = (driverId ?? '').toString();
    if (id.isEmpty) return 'Driver';
    try {
      final row = await _supabase
          .from('drivers')
          .select('first_name, last_name')
          .eq('id', id)
          .maybeSingle()
          .timeout(const Duration(seconds: 4));
      if (row == null) return 'Driver';
      final full = [
        (row['first_name'] ?? '').toString().trim(),
        (row['last_name'] ?? '').toString().trim(),
      ].where((x) => x.isNotEmpty).join(' ');
      return full.isEmpty ? 'Driver' : full;
    } catch (_) {
      return 'Driver';
    }
  }

  String? _pickDirection({
    required Map<String, dynamic> jobRow,
    required Map<String, Map<String, dynamic>> sessionMap,
  }) {
    for (final entry in sessionMap.entries) {
      if (entry.value['status'] == 'active') return entry.key;
    }
    final hasOutbound = jobRow['has_outbound'] == true;
    final hasInbound = jobRow['has_inbound'] == true;
    final outboundDone = SessionSchedule.isSettledForDirection(
      sessionMap['outbound']?['status']?.toString(),
    );
    final inboundDone = SessionSchedule.isSettledForDirection(
      sessionMap['inbound']?['status']?.toString(),
    );
    if ((!hasOutbound || outboundDone) && (!hasInbound || inboundDone)) {
      return null;
    }
    if (hasOutbound && !outboundDone) return 'outbound';
    if (hasInbound && !inboundDone) return 'inbound';
    return null;
  }

  String _fullName(Map<String, dynamic>? profile) {
    if (profile == null) return '';
    final first = (profile['first_name'] ?? '').toString().trim();
    final last = (profile['surname'] ?? '').toString().trim();
    return [first, last].where((s) => s.isNotEmpty).join(' ');
  }

  PickupStatus _toPickupStatus(String raw) {
    final s = raw.toLowerCase();
    if (s == 'picked_up' || s == 'dropped_off') return PickupStatus.completed;
    if (s == 'missed') return PickupStatus.notPicked;
    return PickupStatus.pending;
  }

  DropoffStatus _toDropoffStatus(String raw) {
    return raw.toLowerCase() == 'dropped_off'
        ? DropoffStatus.completed
        : DropoffStatus.pending;
  }

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

  String _formatDate(dynamic raw) {
    if (raw == null) return '--';
    final s = raw.toString().trim();
    if (s.isEmpty || s == 'null') return '--';
    try {
      final dt = DateTime.parse(s);
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
      return s;
    }
  }

  int _asInt(dynamic value) {
    if (value is int) return value;
    if (value is num) return value.toInt();
    return int.tryParse(value?.toString() ?? '') ?? 0;
  }
}
