import 'package:drift/drift.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../database/app_database.dart';
import '../services/connectivity_service.dart';

/// Populates and refreshes the 4 read-only cache tables.
///
/// Call [ensureFresh] on app launch (when online).
/// All reads during a run go through [AppDatabase] — never directly to Supabase.
///
/// Vehicle freshness: re-fetch if the oldest jobs_cache row is >
/// [_maxAgeHours] old, or if the cache is empty.
///
/// Job assignment metadata is always refreshed when online — accept/reject/remove
/// can happen at any time, not only when the cache is stale.
///
/// [passenger_schedules] are always refreshed on [ensureFresh] when online —
/// they change independently of job metadata (e.g. weekday toggles).
class CacheRepository {
  final AppDatabase _db;
  SupabaseClient get _supabase => Supabase.instance.client;

  static const int _maxAgeHours = 4;

  CacheRepository(this._db);

  /// Entry point. Call on launch and before each job load when online.
  /// Job assignment is always synced; schedules are always refreshed.
  Future<void> ensureFresh() async {
    final userId = _supabase.auth.currentUser?.id;
    if (userId == null || userId.isEmpty) return;

    final stale = await _isCacheStale();
    final vehicleMissing = await _isVehicleCacheEmpty();

    // Jobs + vehicle in parallel — schedules need job ids from jobs_cache next.
    await Future.wait([
      _refreshJobs(userId),
      _refreshPaJobs(userId),
      if (stale || vehicleMissing)
        _refreshVehicle(userId)
      else
        Future<void>.value(),
    ]);

    await _refreshSchedulesAndPassengers(userId);
    ConnectivityService().noteSuccessfulRequest();
  }

  /// Force-refresh regardless of age. Call after SyncEngine drains the queue
  /// so the cache reflects the server truth.
  Future<void> forceRefresh() async {
    final userId = _supabase.auth.currentUser?.id;
    if (userId == null || userId.isEmpty) return;
    await Future.wait([
      _refreshJobs(userId),
      _refreshPaJobs(userId),
      _refreshVehicle(userId),
    ]);
    await _refreshSchedulesAndPassengers(userId);
    ConnectivityService().noteSuccessfulRequest();
  }

  // ── Staleness check ────────────────────────────────────────────────────────

  Future<bool> _isVehicleCacheEmpty() async {
    final row = await (_db.select(
      _db.vehiclesCache,
    )..limit(1)).getSingleOrNull();
    return row == null;
  }

  Future<bool> _isCacheStale() async {
    final row =
        await (_db.select(_db.jobsCache)
              ..orderBy([(t) => OrderingTerm.asc(t.cachedAt)])
              ..limit(1))
            .getSingleOrNull();

    if (row == null) return true;

    final age = DateTime.now().difference(row.cachedAt);
    return age.inHours >= _maxAgeHours;
  }

  // ── Jobs ───────────────────────────────────────────────────────────────────

  Future<void> _refreshJobs(String userId) async {
    final today = _dateString(DateTime.now());

    final rows = await _supabase
        .from('jobs')
        .select(
          'id, job_name, internal_job_id, assigned_driver_id, assigned_pa_id, '
          'has_outbound, has_inbound, morning_start_time, morning_end_time, '
          'evening_start_time, semester_start, semester_end, status, '
          'driver_approval_status',
        )
        .eq('assigned_driver_id', userId)
        .eq('driver_approval_status', 'accepted')
        .neq('status', 'cancelled')
        .lte('semester_start', today)
        .gte('semester_end', today);

    // Collect unique driver IDs across all jobs so we can batch-fetch names.
    final jobList = (rows as List<dynamic>)
        .map((r) => Map<String, dynamic>.from(r as Map))
        .toList();

    final driverIds = jobList
        .map((m) => (m['assigned_driver_id'] ?? '').toString())
        .where((id) => id.isNotEmpty)
        .toSet()
        .toList();

    // Batch-fetch driver names from the drivers table.
    final driverNameMap = <String, String>{};
    if (driverIds.isNotEmpty) {
      try {
        final driverRows = await _supabase
            .from('drivers')
            .select('id, first_name, last_name')
            .inFilter('id', driverIds);
        for (final d in driverRows as List<dynamic>) {
          final dm = Map<String, dynamic>.from(d as Map);
          final id = (dm['id'] ?? '').toString();
          if (id.isEmpty) continue;
          final first = (dm['first_name'] ?? '').toString().trim();
          final last = (dm['last_name'] ?? '').toString().trim();
          final full = [first, last].where((s) => s.isNotEmpty).join(' ');
          driverNameMap[id] = full.isEmpty ? 'Driver' : full;
        }
      } catch (_) {
        // Non-fatal — driver name falls back to null, shown as 'Driver' in UI
      }
    }

    final companions = jobList.map((m) {
      final driverId = (m['assigned_driver_id'] ?? '').toString();
      return JobsCacheCompanion.insert(
        id: (m['id'] ?? '').toString(),
        jobName: (m['job_name'] ?? '').toString(),
        internalJobId: Value(m['internal_job_id']?.toString()),
        assignedDriverId: driverId,
        assignedPaId: Value(m['assigned_pa_id']?.toString()),
        driverName: Value(driverNameMap[driverId]),
        hasOutbound: Value(m['has_outbound'] == true),
        hasInbound: Value(m['has_inbound'] == true),
        morningStartTime: Value(m['morning_start_time']?.toString()),
        morningEndTime: Value(m['morning_end_time']?.toString()),
        eveningStartTime: Value(m['evening_start_time']?.toString()),
        semesterStart: (m['semester_start'] ?? '').toString(),
        semesterEnd: (m['semester_end'] ?? '').toString(),
        status: (m['status'] ?? '').toString(),
        driverApprovalStatus: Value(m['driver_approval_status']?.toString()),
        cachedAt: Value(DateTime.now()),
      );
    }).toList();

    await _db.transaction(() async {
      await _db.delete(_db.jobsCache).go();
      if (companions.isNotEmpty) {
        await _db.batch((b) => b.insertAll(_db.jobsCache, companions));
      }
    });
  }

  // ── PA Jobs ───────────────────────────────────────────────────────────────
  // Mirrors _refreshJobs but filters by assigned_pa_id instead of
  // assigned_driver_id. Both can run in parallel — one will return empty rows
  // if the user is not a PA, which is harmless.

  Future<void> _refreshPaJobs(String userId) async {
    final today = _dateString(DateTime.now());

    final rows = await _supabase
        .from('jobs')
        .select(
          'id, job_name, internal_job_id, assigned_driver_id, assigned_pa_id, '
          'has_outbound, has_inbound, morning_start_time, morning_end_time, '
          'evening_start_time, semester_start, semester_end, status, '
          'driver_approval_status',
        )
        .eq('assigned_pa_id', userId)
        .eq('driver_approval_status', 'accepted')
        .neq('status', 'cancelled')
        .lte('semester_start', today)
        .gte('semester_end', today);

    if ((rows as List<dynamic>).isEmpty) return;

    final jobList = rows
        .map((r) => Map<String, dynamic>.from(r as Map))
        .toList();

    // Batch-fetch driver names
    final driverIds = jobList
        .map((m) => (m['assigned_driver_id'] ?? '').toString())
        .where((id) => id.isNotEmpty)
        .toSet()
        .toList();

    final driverNameMap = <String, String>{};
    if (driverIds.isNotEmpty) {
      try {
        final driverRows = await _supabase
            .from('drivers')
            .select('id, first_name, last_name')
            .inFilter('id', driverIds);
        for (final d in driverRows as List<dynamic>) {
          final dm = Map<String, dynamic>.from(d as Map);
          final id = (dm['id'] ?? '').toString();
          if (id.isEmpty) continue;
          final first = (dm['first_name'] ?? '').toString().trim();
          final last = (dm['last_name'] ?? '').toString().trim();
          final full = [first, last].where((s) => s.isNotEmpty).join(' ');
          driverNameMap[id] = full.isEmpty ? 'Driver' : full;
        }
      } catch (_) {}
    }

    final companions = jobList.map((m) {
      final driverId = (m['assigned_driver_id'] ?? '').toString();
      return JobsCacheCompanion.insert(
        id: (m['id'] ?? '').toString(),
        jobName: (m['job_name'] ?? '').toString(),
        internalJobId: Value(m['internal_job_id']?.toString()),
        assignedDriverId: driverId,
        assignedPaId: Value(m['assigned_pa_id']?.toString()),
        driverName: Value(driverNameMap[driverId]),
        hasOutbound: Value(m['has_outbound'] == true),
        hasInbound: Value(m['has_inbound'] == true),
        morningStartTime: Value(m['morning_start_time']?.toString()),
        morningEndTime: Value(m['morning_end_time']?.toString()),
        eveningStartTime: Value(m['evening_start_time']?.toString()),
        semesterStart: (m['semester_start'] ?? '').toString(),
        semesterEnd: (m['semester_end'] ?? '').toString(),
        status: (m['status'] ?? '').toString(),
        driverApprovalStatus: Value(m['driver_approval_status']?.toString()),
        cachedAt: Value(DateTime.now()),
      );
    }).toList();

    // Use insertOnConflictUpdate so driver rows already in cache aren't wiped.
    // PA job rows are inserted alongside driver rows, not instead of them.
    await _db.transaction(() async {
      await _db.batch(
        (b) => b.insertAllOnConflictUpdate(_db.jobsCache, companions),
      );
    });
  }

  // ── Vehicle ────────────────────────────────────────────────────────────────

  Future<void> _refreshVehicle(String userId) async {
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

    await _db.transaction(() async {
      await _db.delete(_db.vehiclesCache).go();
      if (row != null) {
        final m = Map<String, dynamic>.from(row);
        await _db
            .into(_db.vehiclesCache)
            .insert(
              VehiclesCacheCompanion.insert(
                id: (m['id'] ?? '').toString(),
                companyId: (m['company_id'] ?? '').toString(),
                name: Value(m['name']?.toString()),
                make: Value(m['make']?.toString()),
                model: Value(m['model']?.toString()),
                taxiLicensePlateNumber: (m['taxi_license_plate_number'] ?? '')
                    .toString(),
                yearOfFirstRegistration: Value(
                  m['year_of_first_registration']?.toString(),
                ),
                cachedAt: Value(DateTime.now()),
              ),
            );
      }
    });
  }

  // ── Schedules + passengers ─────────────────────────────────────────────────

  Future<void> _refreshSchedulesAndPassengers(String userId) async {
    final jobs = await _db.select(_db.jobsCache).get();
    if (jobs.isEmpty) {
      await _db.transaction(() async {
        await _db.delete(_db.schedulesCache).go();
        await _db.delete(_db.passengersCache).go();
      });
      return;
    }

    final jobIds = jobs.map((j) => j.id).toList();

    // Schedules
    final scheduleRows = await _supabase
        .from('passenger_schedules')
        .select(
          'id, job_id, passenger_id, weekday, direction, '
          'pickup_address, pickup_postcode, pickup_latitude, pickup_longitude, '
          'pickup_time, dropoff_address, dropoff_postcode, '
          'dropoff_latitude, dropoff_longitude, dropoff_time, '
          'exception_date, exception_type, notes, stop_order',
        )
        .inFilter('job_id', jobIds);

    final scheduleCompanions = (scheduleRows as List<dynamic>).map((raw) {
      final m = Map<String, dynamic>.from(raw as Map);
      return SchedulesCacheCompanion.insert(
        id: (m['id'] ?? '').toString(),
        jobId: (m['job_id'] ?? '').toString(),
        passengerId: (m['passenger_id'] ?? '').toString(),
        weekday: (m['weekday'] ?? '').toString(),
        direction: (m['direction'] ?? '').toString(),
        pickupAddress: (m['pickup_address'] ?? '').toString(),
        pickupPostcode: Value(m['pickup_postcode']?.toString()),
        pickupLatitude: Value(_asDouble(m['pickup_latitude'])),
        pickupLongitude: Value(_asDouble(m['pickup_longitude'])),
        pickupTime: (m['pickup_time'] ?? '').toString(),
        dropoffAddress: (m['dropoff_address'] ?? '').toString(),
        dropoffPostcode: Value(m['dropoff_postcode']?.toString()),
        dropoffLatitude: Value(_asDouble(m['dropoff_latitude'])),
        dropoffLongitude: Value(_asDouble(m['dropoff_longitude'])),
        dropoffTime: Value(m['dropoff_time']?.toString()),
        exceptionDate: Value(m['exception_date']?.toString()),
        exceptionType: Value(m['exception_type']?.toString()),
        notes: Value(m['notes']?.toString()),
        stopOrder: Value(_asInt(m['stop_order'])),
        cachedAt: Value(DateTime.now()),
      );
    }).toList();

    // Passengers — collect unique IDs from schedules
    final passengerIds = scheduleCompanions
        .map((s) => s.passengerId.value)
        .toSet()
        .toList();

    List<PassengersCacheCompanion> passengerCompanions = [];
    if (passengerIds.isNotEmpty) {
      final passengerRows = await _supabase
          .from('passenger')
          .select(
            'id, first_name, surname, contact_number_1, '
            'educational_site_address, educational_site_postcode, '
            'educational_site_latitude, educational_site_longitude, '
            'educational_site_dropoff_time, wheelchair_required, '
            'harness_required',
          )
          .inFilter('id', passengerIds);

      passengerCompanions = (passengerRows as List<dynamic>).map((raw) {
        final m = Map<String, dynamic>.from(raw as Map);
        return PassengersCacheCompanion.insert(
          id: (m['id'] ?? '').toString(),
          firstName: (m['first_name'] ?? '').toString(),
          surname: (m['surname'] ?? '').toString(),
          contactNumber1: Value(m['contact_number_1']?.toString()),
          educationalSiteAddress: Value(
            m['educational_site_address']?.toString(),
          ),
          educationalSitePostcode: Value(
            m['educational_site_postcode']?.toString(),
          ),
          educationalSiteLatitude: Value(
            _asDouble(m['educational_site_latitude']),
          ),
          educationalSiteLongitude: Value(
            _asDouble(m['educational_site_longitude']),
          ),
          educationalSiteDropoffTime: Value(
            m['educational_site_dropoff_time']?.toString(),
          ),
          wheelchairRequired: Value(m['wheelchair_required'] == true),
          harnessRequired: Value(m['harness_required'] == true),
          cachedAt: Value(DateTime.now()),
        );
      }).toList();
    }

    await _db.transaction(() async {
      await _db.delete(_db.schedulesCache).go();
      await _db.delete(_db.passengersCache).go();
      if (scheduleCompanions.isNotEmpty) {
        await _db.batch(
          (b) => b.insertAll(_db.schedulesCache, scheduleCompanions),
        );
      }
      if (passengerCompanions.isNotEmpty) {
        await _db.batch(
          (b) => b.insertAll(_db.passengersCache, passengerCompanions),
        );
      }
    });
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  String _dateString(DateTime dt) =>
      '${dt.year.toString().padLeft(4, '0')}-'
      '${dt.month.toString().padLeft(2, '0')}-'
      '${dt.day.toString().padLeft(2, '0')}';

  double? _asDouble(dynamic v) {
    if (v == null) return null;
    if (v is double) return v;
    if (v is num) return v.toDouble();
    return double.tryParse(v.toString());
  }

  int? _asInt(dynamic v) {
    if (v == null) return null;
    if (v is int) return v;
    if (v is num) return v.toInt();
    return int.tryParse(v.toString());
  }
}
