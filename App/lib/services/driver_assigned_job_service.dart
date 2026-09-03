import 'package:supabase_flutter/supabase_flutter.dart';
import '../model/pa_job_model.dart';
import '../repositories/local_job_repository.dart';
import 'connectivity_service.dart';

/// Weekly schedule fetch for the driver's Job Detail screen.
class DriverAssignedJobService {
  final LocalJobRepository _localRepo;
  SupabaseClient get _supabase => Supabase.instance.client;

  DriverAssignedJobService(this._localRepo);

  Future<PaAssignedJobModel?> fetchAssignedJob() async {
    final userId = _supabase.auth.currentUser?.id;
    if (userId == null || userId.isEmpty) return null;

    try {
      final local = await _localRepo.fetchDriverAssignedJob(userId);
      if (local != null) return local;
    } catch (_) {}

    if (!ConnectivityService().canReachServer) return null;
    try {
      return await _fetchFromSupabase(userId);
    } catch (_) {
      return null;
    }
  }

  Future<PaAssignedJobModel?> _fetchFromSupabase(String userId) async {
    final jobRows = await _supabase
        .from('jobs')
        .select(
          'id, job_name, assigned_pa_id, '
          'has_outbound, has_inbound, '
          'morning_start_time, evening_start_time, '
          'semester_start, semester_end',
        )
        .eq('assigned_driver_id', userId)
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
    final paName = await _fetchPaName(jobRow['assigned_pa_id']);

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

        final stops = rows.map((row) {
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
          driverName: paName,
          stops: stops,
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

  Future<Map<String, Map<String, dynamic>>> _fetchPassengerProfiles(
    List<String> passengerIds,
  ) async {
    if (passengerIds.isEmpty) return {};
    final rows = await _supabase
        .from('passenger')
        .select(
          'id, first_name, surname, wheelchair_required, harness_required',
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

  Future<String> _fetchPaName(dynamic paId) async {
    final id = (paId ?? '').toString();
    if (id.isEmpty) return '';
    try {
      final row = await _supabase
          .from('passenger_assistant')
          .select('first_name, surname')
          .eq('id', id)
          .maybeSingle()
          .timeout(const Duration(seconds: 4));
      if (row == null) return '';
      final full = [
        (row['first_name'] ?? '').toString().trim(),
        (row['surname'] ?? '').toString().trim(),
      ].where((x) => x.isNotEmpty).join(' ');
      return full;
    } catch (_) {
      return '';
    }
  }

  String _fullName(Map<String, dynamic>? profile) {
    if (profile == null) return '';
    final first = (profile['first_name'] ?? '').toString().trim();
    final last = (profile['surname'] ?? '').toString().trim();
    return [first, last].where((s) => s.isNotEmpty).join(' ');
  }

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
