import 'package:supabase_flutter/supabase_flutter.dart';
import '../model/job_request_model.dart';
import '../utils/utc_time.dart';

/// Fetches pending job approval requests for the driver.
///
/// Timeline order:
///   1. Morning Pickup stops   (outbound, grouped by address+time)
///   2. Morning Dropoff        (school arrival)
///   3. Return from School     (inbound pickup — school only, no home dropoffs)
class DriverJobRequestService {
  SupabaseClient get _supabase => Supabase.instance.client;
  static const String statusCounterRequest = 'counter request';

  Future<List<DriverJobRequest>> fetchPendingRequests({
    required String driverId,
  }) async {
    if (driverId.trim().isEmpty) return [];

    final rows = await _supabase
        .from('jobs')
        .select(
          'id, job_name, internal_job_id, client_school_name, '
          'driver_pay, has_outbound, has_inbound, '
          'morning_start_time, evening_start_time, '
          'semester_start, semester_end, assigned_pa_id',
        )
        .eq('assigned_driver_id', driverId)
        .eq('driver_approval_status', 'pending')
        .order('semester_start', ascending: true)
        .order('job_name', ascending: true);

    if (rows.isEmpty) return [];

    return Future.wait(
      rows.map((item) async {
        final row = Map<String, dynamic>.from(item as Map);
        final jobId = (row['id'] ?? '').toString();
        final hasOutbound = row['has_outbound'] == true;
        final hasInbound = row['has_inbound'] == true;

        // All base schedule rows — all weekdays, all directions
        final scheduleRows = await _supabase
            .from('passenger_schedules')
            .select(
              'passenger_id, weekday, direction, stop_order, '
              'pickup_address, pickup_postcode, '
              'pickup_latitude, pickup_longitude, pickup_time',
            )
            .eq('job_id', jobId)
            .isFilter('exception_date', null)
            .order('direction', ascending: true)
            .order('stop_order', ascending: true);

        final schedules = scheduleRows
            .map((r) => Map<String, dynamic>.from(r as Map))
            .toList();

        // Passenger profiles for school address + accessibility info
        final passengerIds = schedules
            .map((r) => r['passenger_id']?.toString())
            .whereType<String>()
            .where((id) => id.isNotEmpty)
            .toSet()
            .toList();

        List<Map<String, dynamic>> profiles = [];
        if (passengerIds.isNotEmpty) {
          final profileRows = await _supabase
              .from('passenger')
              .select(
                'id, educational_site_address, educational_site_postcode, '
                'educational_site_latitude, educational_site_longitude, '
                'educational_site_dropoff_time, '
                'wheelchair_required, harness_required',
              )
              .inFilter('id', passengerIds);
          profiles = profileRows
              .map((r) => Map<String, dynamic>.from(r as Map))
              .toList();
        }

        final passengerCount = passengerIds.length;
        final requiresWheelchair = profiles.any(
          (p) => p['wheelchair_required'] == true,
        );

        final firstProfile = profiles.isNotEmpty ? profiles.first : null;
        final schoolAddress = (firstProfile?['educational_site_address'] ?? '')
            .toString()
            .trim();
        final schoolDropoffTime = _formatTime(
          firstProfile?['educational_site_dropoff_time'] ??
              row['morning_start_time'],
        );
        final schoolLat = _asDouble(firstProfile?['educational_site_latitude']);
        final schoolLng = _asDouble(
          firstProfile?['educational_site_longitude'],
        );

        // Split schedules by direction
        final outboundSchedules = schedules
            .where((s) => s['direction'] == 'outbound')
            .toList();
        final inboundSchedules = schedules
            .where((s) => s['direction'] == 'inbound')
            .toList();

        // Group outbound pickup stops by address+time (removes duplicates)
        final outboundGroups = _groupByAddressTime(
          schedules: outboundSchedules,
          fallbackTime: row['morning_start_time'],
        );

        // ── Build stops list ──────────────────────────────────────────────
        final stops = <DriverJobRequestStop>[];

        // 1. Morning pickup stops
        if (hasOutbound) {
          for (final g in outboundGroups.values) {
            stops.add(
              DriverJobRequestStop(
                type: 'Morning Pickup',
                address: g.address,
                time: g.time,
                latitude: g.lat,
                longitude: g.lng,
                weekdays: g.sortedWeekdays,
                direction: 'outbound',
              ),
            );
          }

          // 2. Morning dropoff — school arrival
          if (schoolAddress.isNotEmpty) {
            stops.add(
              DriverJobRequestStop(
                type: 'Morning Dropoff',
                address: schoolAddress,
                time: schoolDropoffTime,
                latitude: schoolLat,
                longitude: schoolLng,
                weekdays: _collectWeekdays(outboundSchedules),
                direction: 'outbound',
              ),
            );
          }
        }

        // 3. Evening — return from school pickup only
        if (hasInbound && inboundSchedules.isNotEmpty) {
          stops.add(
            DriverJobRequestStop(
              type: 'Return from School',
              address: schoolAddress.isNotEmpty ? schoolAddress : 'School',
              time: _formatTime(row['evening_start_time']),
              latitude: schoolLat,
              longitude: schoolLng,
              weekdays: _collectWeekdays(inboundSchedules),
              direction: 'inbound',
            ),
          );
        }

        // Display strings
        final firstPickupAddr = outboundGroups.isNotEmpty
            ? outboundGroups.values.first.address
            : 'N/A';
        final dropoffDisplay = schoolAddress.isNotEmpty ? schoolAddress : 'N/A';
        final displayTime = outboundGroups.isNotEmpty
            ? outboundGroups.values.first.time
            : _formatTime(row['morning_start_time']);

        return DriverJobRequest(
          id: jobId,
          title: (row['job_name'] ?? row['client_school_name'] ?? '')
              .toString(),
          internalJobId: row['internal_job_id']?.toString(),
          earnings: _formatCurrency(row['driver_pay']),
          pickup: firstPickupAddr,
          dropoff: dropoffDisplay,
          timeAndStudents: passengerCount > 0
              ? '$displayTime • $passengerCount students'
              : displayTime,
          accessibilityNote: requiresWheelchair
              ? 'Wheelchair Accessible Van Required'
              : '',
          stops: stops,
          semesterLabel: _formatSemester(
            row['semester_start'],
            row['semester_end'],
          ),
        );
      }),
    );
  }

  Future<void> updateApprovalStatus({
    required String jobId,
    required String status,
    double? counterOfferPay,
  }) async {
    final normalizedStatus = status.trim().toLowerCase();
    final Map<String, dynamic> payload = {
      'driver_approval_status': normalizedStatus,
      'updated_at': UtcTime.nowIso(),
    };

    // Only write the counter amount when sending a counter request.
    // Clear it for accept/reject so stale values do not linger.
    if (normalizedStatus == statusCounterRequest) {
      final offer = _asDouble(counterOfferPay);
      if (offer == null || offer <= 0) {
        throw Exception('A valid counter offer amount is required.');
      }
      payload['driver_counter_offer_pay'] = double.parse(
        offer.toStringAsFixed(2),
      );
    } else {
      payload['driver_counter_offer_pay'] = null;
    }

    await _supabase.from('jobs').update(payload).eq('id', jobId);
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  Map<String, _StopGroup> _groupByAddressTime({
    required List<Map<String, dynamic>> schedules,
    required dynamic fallbackTime,
  }) {
    final groups = <String, _StopGroup>{};
    for (final s in schedules) {
      final addr = (s['pickup_address'] ?? '').toString().trim();
      if (addr.isEmpty) continue;
      final time = _formatTime(s['pickup_time'] ?? fallbackTime);
      final key = '$addr||$time';
      if (!groups.containsKey(key)) {
        groups[key] = _StopGroup(
          address: addr,
          time: time,
          lat: _asDouble(s['pickup_latitude']),
          lng: _asDouble(s['pickup_longitude']),
        );
      }
      groups[key]!.addWeekday((s['weekday'] ?? '').toString());
    }
    return groups;
  }

  List<String> _collectWeekdays(List<Map<String, dynamic>> schedules) {
    const order = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    final days = schedules
        .map((s) => (s['weekday'] ?? '').toString().toLowerCase())
        .where((d) => d.isNotEmpty)
        .toSet();
    return order.where(days.contains).toList();
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

  String _formatSemester(dynamic start, dynamic end) {
    String fmt(dynamic raw) {
      final dt = DateTime.tryParse((raw ?? '').toString());
      if (dt == null) return '';
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
      return '${months[dt.month - 1]} ${dt.year}';
    }

    final s = fmt(start);
    final e = fmt(end);
    if (s.isEmpty && e.isEmpty) return '';
    if (s.isEmpty) return e;
    if (e.isEmpty) return s;
    return '$s – $e';
  }
}

// ── Internal grouping helper ──────────────────────────────────────────────────

class _StopGroup {
  final String address;
  final String time;
  final double? lat;
  final double? lng;
  final Set<String> _weekdays = {};

  _StopGroup({
    required this.address,
    required this.time,
    required this.lat,
    required this.lng,
  });

  void addWeekday(String day) {
    if (day.isNotEmpty) _weekdays.add(day.toLowerCase());
  }

  List<String> get sortedWeekdays {
    const order = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    return order.where((d) => _weekdays.contains(d)).toList();
  }
}
