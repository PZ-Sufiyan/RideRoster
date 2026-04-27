import 'package:supabase_flutter/supabase_flutter.dart';

import '../users/driver/models/job_request_model.dart';

class DriverJobRequestService {
  SupabaseClient get _supabase => Supabase.instance.client;

  Future<List<DriverJobRequest>> fetchPendingRequests({
    required String driverId,
  }) async {
    if (driverId.trim().isEmpty) return [];

    final rows = await _supabase
        .from('jobs')
        .select(
          'id, job_name, internal_job_id, client_school_name, '
          'pickup_time, estimated_dropoff_time, driver_pay',
        )
        .eq('assigned_driver_id', driverId)
        .eq('driver_approval_status', 'pending')
        .order('job_date', ascending: true)
        .order('pickup_time', ascending: true);

    if (rows.isEmpty) return [];

    return Future.wait(
      rows.map((item) async {
        final row = Map<String, dynamic>.from(item as Map);
        final jobId = (row['id'] ?? '').toString();

        final pickupsResponse = await _supabase
            .from('job_pickups')
            .select('pickup_order, address, scheduled_time, latitude, longitude')
            .eq('job_id', jobId)
            .order('pickup_order', ascending: true);

        final dropoffsResponse = await _supabase
            .from('job_dropoffs')
            .select(
              'dropoff_order, address, scheduled_time, latitude, longitude',
            )
            .eq('job_id', jobId)
            .order('dropoff_order', ascending: true);

        final passengerRoutesResponse = await _supabase
            .from('job_passenger_routes')
            .select('wheelchair_required')
            .eq('job_id', jobId);

        final pickups = pickupsResponse
            .map((r) => Map<String, dynamic>.from(r as Map))
            .toList();
        final dropoffs = dropoffsResponse
            .map((r) => Map<String, dynamic>.from(r as Map))
            .toList();
        final passengerRoutes = passengerRoutesResponse
            .map((r) => Map<String, dynamic>.from(r as Map))
            .toList();

        final passengerCount = passengerRoutes.length;
        final requiresWheelchair = passengerRoutes.any(
          (route) => route['wheelchair_required'] == true,
        );

        final firstPickup = pickups.isNotEmpty
            ? (pickups.first['address'] ?? '').toString()
            : 'N/A';
        final firstDropoff = dropoffs.isNotEmpty
            ? (dropoffs.first['address'] ?? '').toString()
            : ((row['client_school_name'] ?? '').toString().trim().isEmpty
                  ? 'N/A'
                  : row['client_school_name'].toString());

        final displayTime = _formatTime(
          pickups.isNotEmpty
              ? pickups.first['scheduled_time'] ?? row['pickup_time']
              : row['pickup_time'],
        );

        final stops = <DriverJobRequestStop>[
          ...pickups.map(
            (pickup) => DriverJobRequestStop(
              type: 'Pickup',
              address: (pickup['address'] ?? '').toString(),
              time: _formatTime(
                pickup['scheduled_time'] ?? row['pickup_time'],
              ),
              isDropoff: false,
              latitude: _asDouble(pickup['latitude']),
              longitude: _asDouble(pickup['longitude']),
            ),
          ),
          ...dropoffs.map(
            (dropoff) => DriverJobRequestStop(
              type: 'Dropoff',
              address: (dropoff['address'] ?? '').toString(),
              time: _formatTime(
                dropoff['scheduled_time'] ?? row['estimated_dropoff_time'],
              ),
              isDropoff: true,
              latitude: _asDouble(dropoff['latitude']),
              longitude: _asDouble(dropoff['longitude']),
            ),
          ),
        ];

        return DriverJobRequest(
          id: jobId,
          title: (row['job_name'] ?? row['client_school_name'] ?? '').toString(),
          internalJobId: row['internal_job_id']?.toString(),
          earnings: _formatCurrency(row['driver_pay']),
          pickup: firstPickup,
          dropoff: firstDropoff,
          timeAndStudents: passengerCount > 0
              ? '$displayTime • $passengerCount students'
              : displayTime,
          accessibilityNote: requiresWheelchair
              ? 'Wheelchair Accessible Van Required'
              : '',
          stops: stops,
        );
      }),
    );
  }

  Future<void> updateApprovalStatus({
    required String jobId,
    required String status,
  }) async {
    await _supabase
        .from('jobs')
        .update({
          'driver_approval_status': status,
          'updated_at': DateTime.now().toIso8601String(),
        })
        .eq('id', jobId);
  }

  String _formatCurrency(dynamic value) {
    final amount = _asDouble(value) ?? 0;
    return '\$${amount.toStringAsFixed(2)}';
  }

  double? _asDouble(dynamic value) {
    if (value == null) return null;
    if (value is double) return value;
    if (value is num) return value.toDouble();
    return double.tryParse(value.toString());
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
