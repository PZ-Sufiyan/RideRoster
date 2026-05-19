import 'package:supabase_flutter/supabase_flutter.dart';
import '../model/driver_profile_model.dart';

class DriverProfileService {
  SupabaseClient get _supabase => Supabase.instance.client;

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
          'passport_number, right_to_work_code, license_no, status, dbs_service_update_id',
        )
        .eq('id', userId)
        .maybeSingle();

    if (driverRow == null) {
      throw Exception('Driver profile record was not found.');
    }

    final driverMap = Map<String, dynamic>.from(driverRow);

    final vehicleRow = await _supabase
        .from('vehicles')
        .select(
          'id, name, make, model, taxi_license_plate_number, registration_number, '
          'vehicle_colour, seating_capacity, wheelchair_accessible',
        )
        .eq('driver_id', userId)
        .order('created_at', ascending: false)
        .limit(1)
        .maybeSingle();

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
        .order('uploaded_at', ascending: false);

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
          .order('uploaded_at', ascending: false);

      vehicleDocs.addAll(
        (vehicleDocsResponse as List)
            .map(
              (item) =>
                  VehicleDocumentModel.fromMap(Map<String, dynamic>.from(item)),
            )
            .toList(),
      );
    }

    return DriverProfileModel.fromMap(
      driverMap,
      vehicle: vehicle,
      driverDocuments: driverDocs,
      vehicleDocuments: vehicleDocs,
    );
  }
}
