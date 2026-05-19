class DriverProfileModel {
  final String id;
  final String companyId;
  final String firstName;
  final String lastName;
  final String email;
  final String phone;
  final String residentialAddress;
  final String emergencyContactName;
  final String emergencyContactPhone;
  final String? passportNumber;
  final String? rightToWorkCode;
  final String licenseNo;
  final String? status;
  final String? dbsServiceUpdateId;
  final DriverVehicleModel? vehicle;
  final List<DriverDocumentModel> driverDocuments;
  final List<VehicleDocumentModel> vehicleDocuments;

  const DriverProfileModel({
    required this.id,
    required this.companyId,
    required this.firstName,
    required this.lastName,
    required this.email,
    required this.phone,
    required this.residentialAddress,
    required this.emergencyContactName,
    required this.emergencyContactPhone,
    required this.passportNumber,
    required this.rightToWorkCode,
    required this.licenseNo,
    required this.status,
    required this.dbsServiceUpdateId,
    required this.vehicle,
    required this.driverDocuments,
    required this.vehicleDocuments,
  });

  String get fullName {
    final full = '$firstName $lastName'.trim();
    return full.isEmpty ? 'Driver' : full;
  }

  String get statusLabel {
    final normalized = (status ?? '').trim().toLowerCase();
    if (normalized.isEmpty) return 'Unknown';
    return normalized[0].toUpperCase() + normalized.substring(1);
  }

  bool get isActive => (status ?? '').trim().toLowerCase() == 'active';

  factory DriverProfileModel.fromMap(
    Map<String, dynamic> row, {
    required DriverVehicleModel? vehicle,
    required List<DriverDocumentModel> driverDocuments,
    required List<VehicleDocumentModel> vehicleDocuments,
  }) {
    return DriverProfileModel(
      id: (row['id'] ?? '').toString(),
      companyId: (row['company_id'] ?? '').toString(),
      firstName: (row['first_name'] ?? '').toString().trim(),
      lastName: (row['last_name'] ?? '').toString().trim(),
      email: (row['email'] ?? '').toString().trim(),
      phone: (row['phone'] ?? '').toString().trim(),
      residentialAddress: (row['residential_address'] ?? '').toString().trim(),
      emergencyContactName: (row['emergency_contact_name'] ?? '').toString().trim(),
      emergencyContactPhone: (row['emergency_contact_phone'] ?? '').toString().trim(),
      passportNumber: _toNullableText(row['passport_number']),
      rightToWorkCode: _toNullableText(row['right_to_work_code']),
      licenseNo: (row['license_no'] ?? '').toString().trim(),
      status: _toNullableText(row['status']),
      dbsServiceUpdateId: _toNullableText(row['dbs_service_update_id']),
      vehicle: vehicle,
      driverDocuments: driverDocuments,
      vehicleDocuments: vehicleDocuments,
    );
  }

  static String? _toNullableText(dynamic raw) {
    final value = (raw ?? '').toString().trim();
    return value.isEmpty ? null : value;
  }
}

class DriverVehicleModel {
  final String id;
  final String? name;
  final String? make;
  final String? model;
  final String taxiLicensePlateNumber;
  final String? registrationNumber;
  final String? vehicleColour;
  final int? seatingCapacity;
  final bool wheelchairAccessible;

  const DriverVehicleModel({
    required this.id,
    required this.name,
    required this.make,
    required this.model,
    required this.taxiLicensePlateNumber,
    required this.registrationNumber,
    required this.vehicleColour,
    required this.seatingCapacity,
    required this.wheelchairAccessible,
  });

  String get displayName {
    if (name != null && name!.trim().isNotEmpty) return name!.trim();
    final composed = '${make ?? ''} ${model ?? ''}'.trim();
    return composed.isEmpty ? 'Not assigned' : composed;
  }

  factory DriverVehicleModel.fromMap(Map<String, dynamic> row) {
    return DriverVehicleModel(
      id: (row['id'] ?? '').toString(),
      name: _toNullableText(row['name']),
      make: _toNullableText(row['make']),
      model: _toNullableText(row['model']),
      taxiLicensePlateNumber: (row['taxi_license_plate_number'] ?? '')
          .toString()
          .trim(),
      registrationNumber: _toNullableText(row['registration_number']),
      vehicleColour: _toNullableText(row['vehicle_colour']),
      seatingCapacity: _toNullableInt(row['seating_capacity']),
      wheelchairAccessible: row['wheelchair_accessible'] == true,
    );
  }

  static String? _toNullableText(dynamic raw) {
    final value = (raw ?? '').toString().trim();
    return value.isEmpty ? null : value;
  }

  static int? _toNullableInt(dynamic raw) {
    if (raw == null) return null;
    if (raw is int) return raw;
    if (raw is num) return raw.toInt();
    return int.tryParse(raw.toString());
  }
}

class DriverDocumentModel {
  final String id;
  final String documentType;
  final String fileUrl;
  final DateTime? expiryDate;

  const DriverDocumentModel({
    required this.id,
    required this.documentType,
    required this.fileUrl,
    required this.expiryDate,
  });

  factory DriverDocumentModel.fromMap(Map<String, dynamic> row) {
    return DriverDocumentModel(
      id: (row['id'] ?? '').toString(),
      documentType: (row['document_type'] ?? '').toString().trim(),
      fileUrl: (row['file_url'] ?? '').toString().trim(),
      expiryDate: _parseDate(row['expiry_date']),
    );
  }
}

class VehicleDocumentModel {
  final String id;
  final String documentType;
  final String fileUrl;
  final DateTime? expiryDate;

  const VehicleDocumentModel({
    required this.id,
    required this.documentType,
    required this.fileUrl,
    required this.expiryDate,
  });

  factory VehicleDocumentModel.fromMap(Map<String, dynamic> row) {
    return VehicleDocumentModel(
      id: (row['id'] ?? '').toString(),
      documentType: (row['document_type'] ?? '').toString().trim(),
      fileUrl: (row['file_url'] ?? '').toString().trim(),
      expiryDate: _parseDate(row['expiry_date']),
    );
  }
}

DateTime? _parseDate(dynamic raw) {
  if (raw == null) return null;
  return DateTime.tryParse(raw.toString());
}
