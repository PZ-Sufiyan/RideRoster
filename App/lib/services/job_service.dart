import 'package:supabase_flutter/supabase_flutter.dart';
import '../users/driver/models/job_model.dart';

/// Job service backed by Supabase.
class JobService {
  SupabaseClient get _supabase => Supabase.instance.client;

  /// Returns the current active job for the signed-in driver.
  /// Returns null if no assigned active/upcoming job exists.
  Future<JobModel?> fetchCurrentJob() async {
    final userId = _supabase.auth.currentUser?.id;
    if (userId == null || userId.isEmpty) return null;

    final jobsResponse = await _supabase
        .from('jobs')
        .select(
          'id, job_name, internal_job_id, pickup_time, estimated_dropoff_time, '
          'assigned_pa_id, status',
        )
        .eq('assigned_driver_id', userId)
        .filter('status', 'not.in', '(completed,cancelled)')
        .order('job_date', ascending: true)
        .order('pickup_time', ascending: true)
        .limit(1);

    if (jobsResponse.isEmpty) return null;

    final jobRow = Map<String, dynamic>.from(jobsResponse.first);
    final jobId = (jobRow['id'] ?? '').toString();
    if (jobId.isEmpty) return null;

    final results = await Future.wait([
      _supabase
          .from('job_pickups')
          .select('id, pickup_order, address, scheduled_time, status')
          .eq('job_id', jobId)
          .order('pickup_order', ascending: true),
      _supabase
          .from('job_dropoffs')
          .select('address, scheduled_time')
          .eq('job_id', jobId)
          .order('dropoff_order', ascending: true)
          .limit(1),
      _supabase
          .from('job_passenger_routes')
          .select('pickup_id, passenger_id, passenger:passenger_id(first_name, surname)')
          .eq('job_id', jobId),
    ]);

    final pickupRows = (results[0] as List)
        .map((row) => Map<String, dynamic>.from(row as Map))
        .toList();
    final dropoffRows = (results[1] as List)
        .map((row) => Map<String, dynamic>.from(row as Map))
        .toList();
    final routeRows = (results[2] as List)
        .map((row) => Map<String, dynamic>.from(row as Map))
        .toList();

    final paName = await _fetchPaName(jobRow['assigned_pa_id']);
    final passengerNamesByPickup = _buildPassengerNamesByPickup(routeRows);
    final pickups = pickupRows.map((row) {
      final pickupId = (row['id'] ?? '').toString();
      final order = _asInt(row['pickup_order']);
      final names = passengerNamesByPickup[pickupId] ?? const <String>[];
      final firstPassenger = names.isNotEmpty ? names.first : 'Student';

      return PickupStop(
        id: pickupId,
        stopNumber: order == 0 ? 1 : order,
        passengerName: firstPassenger,
        passengerPhone: '',
        locationName: (row['address'] ?? '').toString(),
        address: (row['address'] ?? '').toString(),
        eta: 'ETA pending',
        scheduledTime: _formatTime(row['scheduled_time'] ?? jobRow['pickup_time']),
        status: _toPickupStatus(row['status']),
      );
    }).toList();

    final dropoffAddress = dropoffRows.isNotEmpty
        ? (dropoffRows.first['address'] ?? '').toString()
        : '';
    final dropoffEta = dropoffRows.isNotEmpty
        ? _formatTime(dropoffRows.first['scheduled_time'] ?? jobRow['estimated_dropoff_time'])
        : _formatTime(jobRow['estimated_dropoff_time']);

    final nextPending = pickups.where((p) => p.status == PickupStatus.pending).toList();
    final nextActionTime = nextPending.isNotEmpty
        ? nextPending.first.scheduledTime
        : dropoffEta;

    return JobModel(
      backendJobId: jobId,
      jobId: (jobRow['internal_job_id'] ?? jobRow['id']).toString(),
      routeNumber: (jobRow['job_name'] ?? '').toString(),
      paName: paName,
      nextPickupTime: nextActionTime,
      totalEta: '',
      totalDistance: '',
      dropoffLocation: dropoffAddress,
      dropoffEta: dropoffEta,
      pickups: pickups,
    );
  }

  /// Updates the status of a pickup stop (no-op for dummy; provider owns state).
  Future<void> updatePickupStatus(String pickupId, PickupStatus status) async {
    if (pickupId.isEmpty) return;
    await _supabase.from('job_pickups').update({
      'status': _dbPickupStatus(status),
    }).eq('id', pickupId);
  }

  Future<void> completeJob({
    required String backendJobId,
    String? comments,
  }) async {
    if (backendJobId.isEmpty) return;

    // Complete all drop-off stops first; only then mark the job completed.
    await _supabase
        .from('job_dropoffs')
        .update({
          'status': 'completed',
        })
        .eq('job_id', backendJobId);

    await _supabase.from('jobs').update({
      'status': 'completed',
      'updated_at': DateTime.now().toIso8601String(),
      // Jobs schema does not currently include a comments/notes column.
    }).eq('id', backendJobId);
    if (comments != null && comments.isNotEmpty) {
      // Reserved for future backend column or related notes table.
    }
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

  Map<String, List<String>> _buildPassengerNamesByPickup(
    List<Map<String, dynamic>> routeRows,
  ) {
    final map = <String, List<String>>{};
    for (final row in routeRows) {
      final pickupId = (row['pickup_id'] ?? '').toString();
      if (pickupId.isEmpty) continue;
      final passenger = row['passenger'];
      String name = 'Student';
      if (passenger is Map) {
        final passengerMap = Map<String, dynamic>.from(passenger);
        final first = (passengerMap['first_name'] ?? '').toString().trim();
        final last = (passengerMap['surname'] ?? '').toString().trim();
        final full = [first, last].where((x) => x.isNotEmpty).join(' ');
        if (full.isNotEmpty) name = full;
      }
      map.putIfAbsent(pickupId, () => <String>[]).add(name);
    }
    return map;
  }

  PickupStatus _toPickupStatus(dynamic rawStatus) {
    final status = (rawStatus ?? '').toString().toLowerCase().trim();
    if (status == 'completed') return PickupStatus.completed;
    if (status == 'not_picked' || status == 'no_pickup' || status == 'notpicked') {
      return PickupStatus.notPicked;
    }
    return PickupStatus.pending;
  }

  String _dbPickupStatus(PickupStatus status) {
    switch (status) {
      case PickupStatus.completed:
        return 'completed';
      case PickupStatus.notPicked:
        return 'not_picked';
      case PickupStatus.pending:
        return 'pending';
    }
  }

  int _asInt(dynamic value) {
    if (value is int) return value;
    if (value is num) return value.toInt();
    return int.tryParse(value?.toString() ?? '') ?? 0;
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
}
