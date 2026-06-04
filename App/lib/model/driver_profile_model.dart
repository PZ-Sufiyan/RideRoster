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

  Map<String, dynamic> toJson() => {
    'id': id,
    'company_id': companyId,
    'first_name': firstName,
    'last_name': lastName,
    'email': email,
    'phone': phone,
    'residential_address': residentialAddress,
    'emergency_contact_name': emergencyContactName,
    'emergency_contact_phone': emergencyContactPhone,
    'passport_number': passportNumber,
    'right_to_work_code': rightToWorkCode,
    'license_no': licenseNo,
    'status': status,
    'dbs_service_update_id': dbsServiceUpdateId,
    'vehicle': vehicle?.toJson(),
    'driver_documents': driverDocuments.map((d) => d.toJson()).toList(),
    'vehicle_documents': vehicleDocuments.map((d) => d.toJson()).toList(),
  };

  factory DriverProfileModel.fromJson(Map<String, dynamic> json) {
    final vehicleRaw = json['vehicle'];
    return DriverProfileModel(
      id: (json['id'] ?? '').toString(),
      companyId: (json['company_id'] ?? '').toString(),
      firstName: (json['first_name'] ?? '').toString(),
      lastName: (json['last_name'] ?? '').toString(),
      email: (json['email'] ?? '').toString(),
      phone: (json['phone'] ?? '').toString(),
      residentialAddress: (json['residential_address'] ?? '').toString(),
      emergencyContactName: (json['emergency_contact_name'] ?? '').toString(),
      emergencyContactPhone: (json['emergency_contact_phone'] ?? '').toString(),
      passportNumber: json['passport_number']?.toString(),
      rightToWorkCode: json['right_to_work_code']?.toString(),
      licenseNo: (json['license_no'] ?? '').toString(),
      status: json['status']?.toString(),
      dbsServiceUpdateId: json['dbs_service_update_id']?.toString(),
      vehicle: vehicleRaw is Map<String, dynamic>
          ? DriverVehicleModel.fromJson(vehicleRaw)
          : null,
      driverDocuments: (json['driver_documents'] as List<dynamic>? ?? [])
          .map((e) => DriverDocumentModel.fromJson(
                Map<String, dynamic>.from(e as Map),
              ))
          .toList(),
      vehicleDocuments: (json['vehicle_documents'] as List<dynamic>? ?? [])
          .map((e) => VehicleDocumentModel.fromJson(
                Map<String, dynamic>.from(e as Map),
              ))
          .toList(),
    );
  }

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

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'make': make,
    'model': model,
    'taxi_license_plate_number': taxiLicensePlateNumber,
    'registration_number': registrationNumber,
    'vehicle_colour': vehicleColour,
    'seating_capacity': seatingCapacity,
    'wheelchair_accessible': wheelchairAccessible,
  };

  factory DriverVehicleModel.fromJson(Map<String, dynamic> json) {
    return DriverVehicleModel(
      id: (json['id'] ?? '').toString(),
      name: _toNullableText(json['name']),
      make: _toNullableText(json['make']),
      model: _toNullableText(json['model']),
      taxiLicensePlateNumber: (json['taxi_license_plate_number'] ?? '')
          .toString(),
      registrationNumber: _toNullableText(json['registration_number']),
      vehicleColour: _toNullableText(json['vehicle_colour']),
      seatingCapacity: _toNullableInt(json['seating_capacity']),
      wheelchairAccessible: json['wheelchair_accessible'] == true,
    );
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

  Map<String, dynamic> toJson() => {
    'id': id,
    'document_type': documentType,
    'file_url': fileUrl,
    'expiry_date': expiryDate?.toIso8601String(),
  };

  factory DriverDocumentModel.fromJson(Map<String, dynamic> json) {
    return DriverDocumentModel(
      id: (json['id'] ?? '').toString(),
      documentType: (json['document_type'] ?? '').toString(),
      fileUrl: (json['file_url'] ?? '').toString(),
      expiryDate: _parseDate(json['expiry_date']),
    );
  }

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

  Map<String, dynamic> toJson() => {
    'id': id,
    'document_type': documentType,
    'file_url': fileUrl,
    'expiry_date': expiryDate?.toIso8601String(),
  };

  factory VehicleDocumentModel.fromJson(Map<String, dynamic> json) {
    return VehicleDocumentModel(
      id: (json['id'] ?? '').toString(),
      documentType: (json['document_type'] ?? '').toString(),
      fileUrl: (json['file_url'] ?? '').toString(),
      expiryDate: _parseDate(json['expiry_date']),
    );
  }

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
