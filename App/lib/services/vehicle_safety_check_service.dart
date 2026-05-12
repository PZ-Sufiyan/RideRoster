import 'package:supabase_flutter/supabase_flutter.dart';

/// Vehicle row + fields needed for the driver safety checklist screen.
class DriverVehicleSafetyInfo {
  final String id;
  final String companyId;
  final String? name;
  final String? make;
  final String? model;
  final String taxiLicensePlateNumber;
  final DateTime? yearOfFirstRegistration;

  const DriverVehicleSafetyInfo({
    required this.id,
    required this.companyId,
    required this.name,
    required this.make,
    required this.model,
    required this.taxiLicensePlateNumber,
    required this.yearOfFirstRegistration,
  });

  String get titleLine {
    final n = name?.trim();
    if (n != null && n.isNotEmpty) return n;
    final plate = taxiLicensePlateNumber.trim();
    if (plate.isNotEmpty) return 'Vehicle $plate';
    return 'Your vehicle';
  }

  String get subtitleLine {
    final parts = <String>[
      if ((make ?? '').trim().isNotEmpty) make!.trim(),
      if ((model ?? '').trim().isNotEmpty) model!.trim(),
      if (yearOfFirstRegistration != null) '${yearOfFirstRegistration!.year}',
    ];
    final s = parts.join(' ');
    return s.isEmpty ? '—' : s;
  }
}

/// Row from [vehicle_safety_checks] for the driver's local calendar day,
/// matched on [updated_at] (when the checklist was last saved).
class VehicleSafetyCheckToday {
  final String id;
  final String status;
  final Map<String, String?> checksByColumn;
  final DateTime updatedAt;

  const VehicleSafetyCheckToday({
    required this.id,
    required this.status,
    required this.checksByColumn,
    required this.updatedAt,
  });

  /// Read-only when the checklist is fully passed and saved as [completed].
  /// [pending] = no submit yet (default); [incomplete] = saved with at least
  /// one fail — user may edit and resubmit.
  bool get isReadOnlyLocked => status.trim().toLowerCase() == 'completed';
}

class VehicleSafetyCheckService {
  SupabaseClient get _supabase => Supabase.instance.client;

  static const List<String> checkColumns = [
    'fuel',
    'oil_level',
    'coolant_level',
    'battery',
    'brake_fluid',
    'lights',
    'indicators',
    'reflectors',
    'washer',
    'wipers',
    'windscreen',
    'mirrors',
    'number_plates',
    'horn',
    'footbrake',
    'handbrake',
    'tyre_condition',
    'tyre_pressure',
    'wheel_nuts',
    'safe_load',
    'sign_panels',
    'first_aid_kits',
    'fire_extinguisher',
  ];

  /// Start of [anchor]'s local calendar day as UTC (for PostgREST filters).
  String _localDayStartUtcIso(DateTime anchor) {
    final l = anchor.toLocal();
    return DateTime(l.year, l.month, l.day).toUtc().toIso8601String();
  }

  /// Start of the *next* local calendar day as UTC (exclusive upper bound).
  String _localDayEndUtcExclusiveIso(DateTime anchor) {
    final l = anchor.toLocal();
    final start = DateTime(l.year, l.month, l.day);
    return start.add(const Duration(days: 1)).toUtc().toIso8601String();
  }

  /// Latest vehicle assigned to this driver (same ordering as profile).
  Future<DriverVehicleSafetyInfo?> fetchDriverVehicle() async {
    final userId = _supabase.auth.currentUser?.id;
    if (userId == null || userId.isEmpty) return null;

    final row = await _supabase
        .from('vehicles')
        .select(
          'id, company_id, name, make, model, taxi_license_plate_number, '
          'year_of_first_registration',
        )
        .eq('driver_id', userId)
        .order('created_at', ascending: false)
        .limit(1)
        .maybeSingle();

    if (row == null) return null;
    final m = Map<String, dynamic>.from(row);
    DateTime? year;
    final rawYear = m['year_of_first_registration'];
    if (rawYear != null) {
      year = DateTime.tryParse(rawYear.toString());
    }
    return DriverVehicleSafetyInfo(
      id: (m['id'] ?? '').toString(),
      companyId: (m['company_id'] ?? '').toString(),
      name: m['name']?.toString(),
      make: m['make']?.toString(),
      model: m['model']?.toString(),
      taxiLicensePlateNumber: (m['taxi_license_plate_number'] ?? '').toString(),
      yearOfFirstRegistration: year,
    );
  }

  /// Today's checklist row: [updated_at] falls within the device's local
  /// calendar day for [localDay] (queried via UTC half-open range so the row
  /// is found even when there are many older checks). If several exist, the
  /// one with the latest [updated_at] wins.
  Future<VehicleSafetyCheckToday?> fetchCheckForLocalDay({
    required String driverId,
    required String vehicleId,
    required DateTime localDay,
  }) async {
    final gte = _localDayStartUtcIso(localDay);
    final lt = _localDayEndUtcExclusiveIso(localDay);

    final rows = await _supabase
        .from('vehicle_safety_checks')
        .select(
          'id, status, created_at, updated_at, '
          '${checkColumns.join(', ')}',
        )
        .eq('driver_id', driverId)
        .eq('vehicle_id', vehicleId)
        .gte('updated_at', gte)
        .lt('updated_at', lt)
        .order('updated_at', ascending: false)
        .limit(10);

    final list = (rows as List<dynamic>)
        .map((raw) => Map<String, dynamic>.from(raw as Map<dynamic, dynamic>))
        .toList();

    if (list.isEmpty) return null;

    final m = list.first;
    final checks = <String, String?>{};
    for (final c in checkColumns) {
      final v = m[c]?.toString();
      checks[c] = (v == null || v.isEmpty) ? null : v;
    }
    final updatedRaw = m['updated_at']?.toString();
    return VehicleSafetyCheckToday(
      id: (m['id'] ?? '').toString(),
      status: (m['status'] ?? 'pending').toString(),
      checksByColumn: checks,
      updatedAt:
          DateTime.tryParse(updatedRaw ?? '')?.toUtc() ??
          DateTime.now().toUtc(),
    );
  }

  /// True if the driver has at least one job session on the given local calendar day.
  Future<bool> driverHasJobSessionOnLocalDay(DateTime localDay) async {
    final userId = _supabase.auth.currentUser?.id;
    if (userId == null || userId.isEmpty) return false;

    final dateStr =
        '${localDay.year.toString().padLeft(4, '0')}-'
        '${localDay.month.toString().padLeft(2, '0')}-'
        '${localDay.day.toString().padLeft(2, '0')}';

    final rows = await _supabase
        .from('job_sessions')
        .select('id')
        .eq('driver_id', userId)
        .eq('session_date', dateStr)
        .limit(1);

    return rows.isNotEmpty;
  }

  Future<String> saveChecklist({
    required String driverId,
    required DriverVehicleSafetyInfo vehicle,
    required Map<String, String> checksPassFail,
    String? existingRowId,
  }) async {
    assert(checksPassFail.length == checkColumns.length);

    int passed = 0;
    int failed = 0;
    for (final c in checkColumns) {
      final v = checksPassFail[c];
      if (v == 'pass') {
        passed++;
      } else if (v == 'fail') {
        failed++;
      }
    }

    final allPass = failed == 0 && passed == checkColumns.length;
    // completed = all pass; incomplete = at least one fail (submitted);
    // pending is only the table default when no checklist save has happened.
    final status = allPass ? 'completed' : 'incomplete';
    final nowIso = DateTime.now().toUtc().toIso8601String();

    final payload = <String, dynamic>{
      'company_id': vehicle.companyId,
      'vehicle_id': vehicle.id,
      'driver_id': driverId,
      'total_checks': checkColumns.length,
      'passed_checks': passed,
      'failed_checks': failed,
      'status': status,
      'updated_at': nowIso,
      for (final c in checkColumns) c: checksPassFail[c],
      if (allPass) 'completed_at': nowIso,
    };

    if (!allPass) {
      payload['completed_at'] = null;
    }

    if (existingRowId != null && existingRowId.isNotEmpty) {
      await _supabase
          .from('vehicle_safety_checks')
          .update(payload)
          .eq('id', existingRowId);
      return existingRowId;
    }
    final inserted = await _supabase
        .from('vehicle_safety_checks')
        .insert(payload)
        .select('id')
        .single();
    return (inserted['id'] ?? '').toString();
  }

  /// Returns true if the driver has a completed safety check for today's
  /// local calendar day on their currently assigned vehicle.
  Future<bool> isChecklistCompletedToday() async {
    final userId = _supabase.auth.currentUser?.id;
    if (userId == null || userId.isEmpty) return false;

    final vehicle = await fetchDriverVehicle();
    if (vehicle == null) return false;

    final row = await fetchCheckForLocalDay(
      driverId: userId,
      vehicleId: vehicle.id,
      localDay: DateTime.now(),
    );

    return row?.isReadOnlyLocked ?? false;
  }
}
