import 'dart:async';

import 'package:geolocator/geolocator.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'location_service.dart';

class SosLocationService {
  SosLocationService._internal();
  static final SosLocationService _instance = SosLocationService._internal();
  factory SosLocationService() => _instance;

  final SupabaseClient _supabase = Supabase.instance.client;
  final LocationService _locationService = LocationService();

  RealtimeChannel? _sosChannel;
  StreamSubscription<Position>? _locationSub;

  String? _driverId;
  String? _companyId;
  String? _activeSosId;
  bool _initialized = false;
  bool _streaming = false;
  Position? _latestPosition;

  Future<void> init() async {
    if (_initialized) return;
    _initialized = true;
    await _ensureDriverContext();

    await _subscribeToSos();
    await _syncCurrentActiveSos();
  }

  Future<void> _ensureDriverContext() async {
    final user = _supabase.auth.currentUser;
    if (user == null) return;

    _driverId = user.id;

    final driverRow = await _supabase
        .from('drivers')
        .select('company_id')
        .eq('id', user.id)
        .maybeSingle();

    final companyId = driverRow?['company_id']?.toString();
    if (companyId == null || companyId.isEmpty) return;
    _companyId = companyId;
  }

  Future<String> createSosAlert({String? notes}) async {
    await _ensureDriverContext();

    final driverId = _driverId;
    final companyId = _companyId;
    if (driverId == null || companyId == null) {
      throw StateError('Unable to determine the current driver profile.');
    }

    final hasPermission = await _locationService.ensurePermission();
    if (!hasPermission) {
      throw StateError('Location permission is required to send SOS.');
    }

    final position = await Geolocator.getCurrentPosition(
      locationSettings: const LocationSettings(accuracy: LocationAccuracy.high),
    );
    _latestPosition = position;

    final vehicles = await _supabase
        .from('vehicles')
        .select('id')
        .eq('driver_id', driverId)
        .limit(1);

    if (vehicles.isEmpty) {
      throw StateError('No assigned vehicle found for this driver.');
    }

    final vehicleId = vehicles.first['id']?.toString();
    if (vehicleId == null || vehicleId.isEmpty) {
      throw StateError('No assigned vehicle found for this driver.');
    }

    final activeJobs = await _supabase
        .from('jobs')
        .select('id, assigned_pa_id')
        .eq('assigned_driver_id', driverId)
        .filter('status', 'not.in', '(completed,cancelled)')
        .order('job_date', ascending: true)
        .order('pickup_time', ascending: true)
        .limit(1);

    String? jobId;
    String? passengerAssistantId;
    int passengerCount = 0;

    if (activeJobs.isNotEmpty) {
      final activeJob = Map<String, dynamic>.from(activeJobs.first);
      final resolvedJobId = activeJob['id']?.toString();
      if (resolvedJobId != null && resolvedJobId.isNotEmpty) {
        jobId = resolvedJobId;
        passengerAssistantId = activeJob['assigned_pa_id']?.toString();

        final routeRows = await _supabase
            .from('job_passenger_routes')
            .select('passenger_id')
            .eq('job_id', resolvedJobId);

        final uniquePassengers = routeRows
            .map((row) => row['passenger_id']?.toString())
            .whereType<String>()
            .where((id) => id.isNotEmpty)
            .toSet();
        passengerCount = uniquePassengers.length;
      }
    }

    final insertPayload = <String, dynamic>{
      'vehicle_id': vehicleId,
      'company_id': companyId,
      'driver_id': driverId,
      'longitude': position.longitude,
      'latitude': position.latitude,
      'number_of_passenger': passengerCount,
      'notes': (notes ?? '').trim().isEmpty
          ? 'SOS triggered from driver app.'
          : notes!.trim(),
      if (jobId != null) 'job_id': jobId,
      if (passengerAssistantId != null && passengerAssistantId.isNotEmpty)
        'passenger_assistant_id': passengerAssistantId,
    };

    final inserted = await _supabase
        .from('sos')
        .insert(insertPayload)
        .select('id')
        .single();

    final sosId = inserted['id']?.toString();
    if (sosId == null || sosId.isEmpty) {
      throw StateError('SOS was created but no id was returned.');
    }

    return sosId;
  }

  Future<void> _subscribeToSos() async {
    final companyId = _companyId;
    final driverId = _driverId;
    if (companyId == null || driverId == null) return;

    await _sosChannel?.unsubscribe();

    final channel = _supabase.channel('sos-location-$companyId-$driverId');

    channel.onPostgresChanges(
      event: PostgresChangeEvent.insert,
      schema: 'public',
      table: 'sos',
      filter: PostgresChangeFilter(
        type: PostgresChangeFilterType.eq,
        column: 'company_id',
        value: companyId,
      ),
      callback: (payload) async {
        final row = payload.newRecord;
        final status = row['status']?.toString();
        final sosId = row['id']?.toString();
        if (sosId == null || sosId.isEmpty) return;
        if (status != 'active') return;

        _activeSosId = sosId;
        await _startLocationStream();
      },
    );

    channel.onPostgresChanges(
      event: PostgresChangeEvent.update,
      schema: 'public',
      table: 'sos',
      filter: PostgresChangeFilter(
        type: PostgresChangeFilterType.eq,
        column: 'company_id',
        value: companyId,
      ),
      callback: (payload) async {
        final row = payload.newRecord;
        final status = row['status']?.toString();
        final sosId = row['id']?.toString();
        if (sosId == null || sosId.isEmpty) return;

        if (status != 'active') {
          if (_activeSosId == null || _activeSosId == sosId) {
            _activeSosId = null;
            await _stopLocationStream(markOffline: true);
          }
        }
      },
    );

    await channel.subscribe();
    _sosChannel = channel;
  }

  Future<void> _syncCurrentActiveSos() async {
    final companyId = _companyId;
    if (companyId == null) return;

    final rows = await _supabase
        .from('sos')
        .select('id, status')
        .eq('company_id', companyId)
        .eq('status', 'active')
        .order('created_at', ascending: false)
        .limit(1);

    if (rows.isEmpty) {
      _activeSosId = null;
      await _stopLocationStream(markOffline: true);
      return;
    }

    final sosId = rows.first['id']?.toString();
    if (sosId == null || sosId.isEmpty) return;
    _activeSosId = sosId;
    await _startLocationStream();
  }

  Future<void> _startLocationStream() async {
    if (_streaming) return;

    final hasPermission = await _locationService.ensurePermission();
    if (!hasPermission) return;

    _streaming = true;

    _locationSub = Geolocator.getPositionStream(
      locationSettings: const LocationSettings(
        accuracy: LocationAccuracy.high,
        distanceFilter: 5,
      ),
    ).listen((position) async {
      _latestPosition = position;
      await _upsertLocation(position: position, isOnline: true);
    });
  }

  Future<void> _upsertLocation({
    required Position position,
    required bool isOnline,
  }) async {
    final driverId = _driverId;
    final companyId = _companyId;
    if (driverId == null || companyId == null) return;

    await _supabase.from('driver_locations').upsert({
      'driver_id': driverId,
      'company_id': companyId,
      'latitude': position.latitude,
      'longitude': position.longitude,
      'is_online': isOnline,
      'updated_at': DateTime.now().toIso8601String(),
    }, onConflict: 'driver_id');
  }

  Future<void> _stopLocationStream({required bool markOffline}) async {
    _streaming = false;
    await _locationSub?.cancel();
    _locationSub = null;

    if (markOffline) {
      final latest = _latestPosition;
      if (latest != null) {
        await _upsertLocation(position: latest, isOnline: false);
      } else {
        final driverId = _driverId;
        if (driverId != null) {
          await _supabase.from('driver_locations').upsert({
            'driver_id': driverId,
            'company_id': _companyId,
            'latitude': 0,
            'longitude': 0,
            'is_online': false,
            'updated_at': DateTime.now().toIso8601String(),
          }, onConflict: 'driver_id');
        }
      }
    }
  }

  Future<void> setDriverOffline() async {
    await _stopLocationStream(markOffline: true);
  }

  Future<void> refresh() async {
    _initialized = false;
    await init();
  }

  Future<void> dispose() async {
    _initialized = false;
    await _stopLocationStream(markOffline: true);
    await _sosChannel?.unsubscribe();
    _sosChannel = null;
  }
}
