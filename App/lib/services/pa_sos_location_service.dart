import 'package:flutter/widgets.dart';
import 'package:geolocator/geolocator.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'location_service.dart';

/// Handles SOS alert creation for Passenger Assistants.
///
/// Stores `passenger_assistant_id` and the job's `assigned_driver_id` on the `sos` row.
/// Vehicle is resolved from the PA's active job → assigned driver → vehicle.
class PaSosLocationService {
  PaSosLocationService._internal();
  static final PaSosLocationService _instance =
      PaSosLocationService._internal();
  factory PaSosLocationService() => _instance;

  final SupabaseClient _supabase = Supabase.instance.client;
  final LocationService _locationService = LocationService();

  String? _paId;
  String? _companyId;
  bool _initialized = false;

  static const Duration _networkTimeout = Duration(seconds: 4);

  String _companyIdPrefsKey(String userId) => 'pa_company_id_$userId';

  Future<void> init() async {
    if (_initialized) return;
    _initialized = true;
    await _ensurePaContext();
  }

  Future<void> _ensurePaContext() async {
    final user = _supabase.auth.currentUser;
    if (user == null) return;

    _paId = user.id;

    if (_companyId == null || _companyId!.isEmpty) {
      final prefs = await SharedPreferences.getInstance();
      _companyId = prefs.getString(_companyIdPrefsKey(user.id));
    }

    try {
      final paRow = await _supabase
          .from('passenger_assistant')
          .select('company_id')
          .eq('id', user.id)
          .maybeSingle()
          .timeout(_networkTimeout);

      final companyId = paRow?['company_id']?.toString();
      if (companyId == null || companyId.isEmpty) return;

      _companyId = companyId;
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_companyIdPrefsKey(user.id), companyId);
    } catch (_) {
      // Offline — paId is set; companyId may come from prefs.
    }
  }

  Future<String> createSosAlert({String? notes, BuildContext? context}) async {
    final hasPermission = await _locationService.ensurePermission(
      context: context,
    );
    if (!hasPermission) {
      throw StateError('Location permission is required to send SOS.');
    }

    await _ensurePaContext();

    final paId = _paId;
    final companyId = _companyId;
    if (paId == null || companyId == null) {
      throw StateError(
        'Unable to send SOS while offline. Reconnect and try again.',
      );
    }

    final position = await Geolocator.getCurrentPosition(
      locationSettings: const LocationSettings(accuracy: LocationAccuracy.high),
    );

    try {
      final today = DateTime.now();
      final todayDate =
          '${today.year.toString().padLeft(4, '0')}-'
          '${today.month.toString().padLeft(2, '0')}-'
          '${today.day.toString().padLeft(2, '0')}';

      final activeJobs = await _supabase
          .from('jobs')
          .select('id, assigned_driver_id')
          .eq('assigned_pa_id', paId)
          .eq('driver_approval_status', 'accepted')
          .neq('status', 'cancelled')
          .lte('semester_start', todayDate)
          .gte('semester_end', todayDate)
          .order('semester_start', ascending: true)
          .limit(1)
          .timeout(_networkTimeout);

      if (activeJobs.isEmpty) {
        throw StateError(
          'No active job found. Call the safety line if you need help.',
        );
      }

      final activeJob = Map<String, dynamic>.from(activeJobs.first);
      final jobId = activeJob['id']?.toString();
      final driverId = activeJob['assigned_driver_id']?.toString();

      if (jobId == null || jobId.isEmpty) {
        throw StateError(
          'No active job found. Call the safety line if you need help.',
        );
      }

      if (driverId == null || driverId.isEmpty) {
        throw StateError(
          'No assigned vehicle found for your current job.',
        );
      }

      final vehicles = await _supabase
          .from('vehicles')
          .select('id')
          .eq('driver_id', driverId)
          .limit(1)
          .timeout(_networkTimeout);

      if (vehicles.isEmpty) {
        throw StateError(
          'No assigned vehicle found for your current job.',
        );
      }
      final vehicleId = vehicles.first['id']?.toString();
      if (vehicleId == null || vehicleId.isEmpty) {
        throw StateError(
          'No assigned vehicle found for your current job.',
        );
      }

      int passengerCount = 0;

      final sessionRows = await _supabase
          .from('job_sessions')
          .select('id')
          .eq('job_id', jobId)
          .eq('session_date', todayDate)
          .eq('status', 'active')
          .limit(1)
          .timeout(_networkTimeout);

      if (sessionRows.isNotEmpty) {
        final sessionId = sessionRows.first['id']?.toString();
        if (sessionId != null && sessionId.isNotEmpty) {
          final spRows = await _supabase
              .from('job_session_passengers')
              .select('passenger_id')
              .eq('session_id', sessionId)
              .neq('status', 'missed')
              .timeout(_networkTimeout);

          final uniquePassengers = spRows
              .map((r) => r['passenger_id']?.toString())
              .whereType<String>()
              .where((id) => id.isNotEmpty)
              .toSet();
          passengerCount = uniquePassengers.length;
        }
      } else {
        final weekdayKeys = [
          'mon',
          'tue',
          'wed',
          'thu',
          'fri',
          'sat',
          'sun',
        ];
        final weekday = weekdayKeys[today.weekday - 1];

        final scheduleRows = await _supabase
            .from('passenger_schedules')
            .select('passenger_id')
            .eq('job_id', jobId)
            .eq('weekday', weekday)
            .isFilter('exception_date', null)
            .timeout(_networkTimeout);

        final uniquePassengers = scheduleRows
            .map((r) => r['passenger_id']?.toString())
            .whereType<String>()
            .where((id) => id.isNotEmpty)
            .toSet();
        passengerCount = uniquePassengers.length;
      }

      final insertPayload = <String, dynamic>{
        'vehicle_id': vehicleId,
        'company_id': companyId,
        'passenger_assistant_id': paId,
        'driver_id': driverId,
        'longitude': position.longitude,
        'latitude': position.latitude,
        'number_of_passenger': passengerCount,
        'notes': (notes ?? '').trim().isEmpty
            ? 'SOS triggered from PA app.'
            : notes!.trim(),
        'job_id': jobId,
      };

      final inserted = await _supabase
          .from('sos')
          .insert(insertPayload)
          .select('id')
          .single()
          .timeout(_networkTimeout);

      final sosId = inserted['id']?.toString();
      if (sosId == null || sosId.isEmpty) {
        throw StateError('SOS was created but no id was returned.');
      }

      return sosId;
    } on StateError {
      rethrow;
    } catch (_) {
      throw StateError(
        'Unable to send SOS. Check your connection and try again.',
      );
    }
  }

  Future<void> refresh() async {
    _initialized = false;
    await init();
  }

  Future<void> dispose() async {
    _initialized = false;
  }
}
