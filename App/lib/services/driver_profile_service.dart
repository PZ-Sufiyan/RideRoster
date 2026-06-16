import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../model/driver_profile_model.dart';

class DriverProfileService {
  SupabaseClient get _supabase => Supabase.instance.client;

  static const Duration _networkTimeout = Duration(seconds: 4);

  String _cacheKey(String userId) => 'driver_profile_cache_$userId';

  Future<DriverProfileModel?> loadCachedProfile(String userId) async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_cacheKey(userId));
    if (raw == null || raw.isEmpty) return null;
    try {
      final json = jsonDecode(raw) as Map<String, dynamic>;
      return DriverProfileModel.fromJson(json);
    } catch (_) {
      return null;
    }
  }

  Future<void> cacheProfile(String userId, DriverProfileModel profile) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_cacheKey(userId), jsonEncode(profile.toJson()));
  }

  Future<DriverProfileModel> fetchProfile() async {
    final userId = _supabase.auth.currentUser?.id;
    if (userId == null || userId.isEmpty) {
      throw Exception('No authenticated driver session found.');
    }

    final driverRow = await _supabase
        .from('drivers')
        .select(
          'id, company_id, first_name, last_name, email, phone, '
          'residential_address, emergency_contact_name, emergency_contact_phone, '
          'passport_number, right_to_work_code, nationality, profile_picture_url, '
          'license_no, status, dbs_service_update_id',
        )
        .eq('id', userId)
        .maybeSingle()
        .timeout(_networkTimeout);

    if (driverRow == null) {
      throw Exception('Driver profile record was not found.');
    }

    final driverMap = Map<String, dynamic>.from(driverRow);

    final vehicleRow = await _supabase
        .from('vehicles')
        .select(
          'id, name, make, model, taxi_license_plate_number, registration_number, '
          'vehicle_photo_url, vehicle_colour, seating_capacity, wheelchair_accessible',
        )
        .eq('driver_id', userId)
        .order('created_at', ascending: false)
        .limit(1)
        .maybeSingle()
        .timeout(_networkTimeout);

    DriverVehicleModel? vehicle;
    if (vehicleRow != null) {
      vehicle = DriverVehicleModel.fromMap(
        Map<String, dynamic>.from(vehicleRow),
      );
    }

    final driverDocsResponse = await _supabase
        .from('driver_documents')
        .select('id, document_type, file_url, expiry_date')
        .eq('driver_id', userId)
        .order('uploaded_at', ascending: false)
        .timeout(_networkTimeout);

    final driverDocs = (driverDocsResponse as List)
        .map(
          (item) =>
              DriverDocumentModel.fromMap(Map<String, dynamic>.from(item)),
        )
        .toList();

    final vehicleDocs = <VehicleDocumentModel>[];
    if (vehicle != null) {
      final vehicleDocsResponse = await _supabase
          .from('vehicle_documents')
          .select('id, document_type, file_url, expiry_date')
          .eq('vehicle_id', vehicle.id)
          .order('uploaded_at', ascending: false)
          .timeout(_networkTimeout);

      vehicleDocs.addAll(
        (vehicleDocsResponse as List)
            .map(
              (item) => VehicleDocumentModel.fromMap(
                Map<String, dynamic>.from(item),
              ),
            )
            .toList(),
      );
    }

    final profile = DriverProfileModel.fromMap(
      driverMap,
      vehicle: vehicle,
      driverDocuments: driverDocs,
      vehicleDocuments: vehicleDocs,
    );

    await cacheProfile(userId, profile);
    return profile;
  }
}
