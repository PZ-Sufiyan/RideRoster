import 'dart:io';

import 'package:supabase_flutter/supabase_flutter.dart';

class DriverProfileEditService {
  SupabaseClient get _supabase => Supabase.instance.client;
  static const String _companyDocsBucket = 'company-documents';
  static const Duration _networkTimeout = Duration(seconds: 30);

  String get _userId {
    final id = _supabase.auth.currentUser?.id;
    if (id == null || id.isEmpty) {
      throw Exception('No authenticated driver session found.');
    }
    return id;
  }

  Future<Map<String, dynamic>> _fetchDriverRow() async {
    final row = await _supabase
        .from('drivers')
        .select('id, company_id, profile_picture_url')
        .eq('id', _userId)
        .maybeSingle()
        .timeout(_networkTimeout);
    if (row == null) {
      throw Exception('Driver profile record was not found.');
    }
    return Map<String, dynamic>.from(row);
  }

  String _fileExtension(String path) {
    final idx = path.lastIndexOf('.');
    if (idx == -1 || idx == path.length - 1) return '';
    return path.substring(idx + 1).toLowerCase();
  }

  String _safePathSegment(String value) {
    final cleaned = value
        .trim()
        .toLowerCase()
        .replaceAll(RegExp(r'[^a-z0-9]+'), '_')
        .replaceAll(RegExp(r'_+'), '_')
        .replaceAll(RegExp(r'^_|_$'), '');
    return cleaned.isEmpty ? 'file' : cleaned;
  }

  String _buildDocumentStoragePath({
    required String companyId,
    required String scopeType,
    required String scopeId,
    required String docType,
    required String sourcePath,
  }) {
    final ext = _fileExtension(sourcePath);
    final millis = DateTime.now().millisecondsSinceEpoch;
    final safeDoc = _safePathSegment(docType);
    final filename = ext.isEmpty
        ? '${safeDoc}_$millis'
        : '${safeDoc}_$millis.$ext';
    return '$companyId/$scopeType/$scopeId/$safeDoc/$filename';
  }

  String _buildProfileStoragePath({
    required String companyId,
    required String driverId,
    required String sourcePath,
  }) {
    final ext = _fileExtension(sourcePath);
    final millis = DateTime.now().millisecondsSinceEpoch;
    final safeName = _safePathSegment(
      sourcePath.split(Platform.pathSeparator).last,
    );
    final filename = ext.isEmpty ? '${millis}_$safeName' : '${millis}_$safeName';
    return '$companyId/drivers/$driverId/profile/$filename';
  }

  Future<String> _uploadLocalFile({
    required String storagePath,
    required String localPath,
  }) async {
    final file = File(localPath);
    if (!await file.exists()) {
      throw Exception('Selected file could not be found.');
    }
    await _supabase.storage.from(_companyDocsBucket).upload(
          storagePath,
          file,
          fileOptions: const FileOptions(upsert: true),
        );
    return _supabase.storage.from(_companyDocsBucket).getPublicUrl(storagePath);
  }

  String? _formatExpiry(DateTime? date) {
    if (date == null) return null;
    final y = date.year.toString().padLeft(4, '0');
    final m = date.month.toString().padLeft(2, '0');
    final d = date.day.toString().padLeft(2, '0');
    return '$y-$m-$d';
  }

  String? _nullableText(String? value) {
    final trimmed = (value ?? '').trim();
    return trimmed.isEmpty ? null : trimmed;
  }

  Future<void> updateProfilePicture({required String localPath}) async {
    final driver = await _fetchDriverRow();
    final companyId = driver['company_id']?.toString() ?? '';
    final driverId = driver['id']?.toString() ?? '';
    if (companyId.isEmpty || driverId.isEmpty) {
      throw Exception('Driver profile record was not found.');
    }

    final storagePath = _buildProfileStoragePath(
      companyId: companyId,
      driverId: driverId,
      sourcePath: localPath,
    );
    final publicUrl = await _uploadLocalFile(
      storagePath: storagePath,
      localPath: localPath,
    );

    await _supabase
        .from('drivers')
        .update({
          'profile_picture_url': publicUrl,
          'updated_at': DateTime.now().toUtc().toIso8601String(),
        })
        .eq('id', driverId)
        .timeout(_networkTimeout);
  }

  Future<void> updatePersonalInfo({
    required String firstName,
    required String lastName,
    required String phone,
    required String residentialAddress,
    required String emergencyContactName,
    required String emergencyContactPhone,
    String? passportNumber,
    required String nationality,
    String? rightToWorkCode,
  }) async {
    if (firstName.trim().isEmpty || lastName.trim().isEmpty) {
      throw Exception('First and last name are required.');
    }
    if (phone.trim().isEmpty) {
      throw Exception('Phone number is required.');
    }
    if (nationality.trim().isEmpty) {
      throw Exception('Nationality is required.');
    }

    await _supabase
        .from('drivers')
        .update({
          'first_name': firstName.trim(),
          'last_name': lastName.trim(),
          'phone': phone.trim(),
          'residential_address': residentialAddress.trim(),
          'emergency_contact_name': emergencyContactName.trim(),
          'emergency_contact_phone': emergencyContactPhone.trim(),
          'passport_number': _nullableText(passportNumber),
          'nationality': nationality.trim(),
          'right_to_work_code': nationality.trim().toLowerCase() == 'british'
              ? null
              : _nullableText(rightToWorkCode),
          'updated_at': DateTime.now().toUtc().toIso8601String(),
        })
        .eq('id', _userId)
        .timeout(_networkTimeout);
  }

  Future<void> updateProfessionalDetails({
    required String licenseNo,
    String? dbsServiceUpdateId,
    String? taxiPlateNumber,
    String? registrationNumber,
  }) async {
    if (licenseNo.trim().isEmpty) {
      throw Exception('License number is required.');
    }

    await _supabase
        .from('drivers')
        .update({
          'license_no': licenseNo.trim(),
          'dbs_service_update_id': _nullableText(dbsServiceUpdateId),
          'updated_at': DateTime.now().toUtc().toIso8601String(),
        })
        .eq('id', _userId)
        .timeout(_networkTimeout);

    final vehicleRow = await _supabase
        .from('vehicles')
        .select('id')
        .eq('driver_id', _userId)
        .order('created_at', ascending: false)
        .limit(1)
        .maybeSingle()
        .timeout(_networkTimeout);

    if (vehicleRow == null) return;

    final vehicleId = vehicleRow['id']?.toString();
    if (vehicleId == null || vehicleId.isEmpty) return;

    final updates = <String, dynamic>{
      'updated_at': DateTime.now().toUtc().toIso8601String(),
    };
    if (taxiPlateNumber != null) {
      updates['taxi_license_plate_number'] = taxiPlateNumber.trim();
    }
    if (registrationNumber != null) {
      updates['registration_number'] = _nullableText(registrationNumber);
    }

    if (updates.length > 1) {
      await _supabase
          .from('vehicles')
          .update(updates)
          .eq('id', vehicleId)
          .timeout(_networkTimeout);
    }
  }

  Future<void> upsertDriverDocument({
    required String documentType,
    String? localPath,
    DateTime? expiryDate,
    String? existingDocId,
  }) async {
    final driver = await _fetchDriverRow();
    final companyId = driver['company_id']?.toString() ?? '';
    final driverId = driver['id']?.toString() ?? '';

    String? fileUrl;
    if (localPath != null && localPath.trim().isNotEmpty) {
      final storagePath = _buildDocumentStoragePath(
        companyId: companyId,
        scopeType: 'drivers',
        scopeId: driverId,
        docType: documentType,
        sourcePath: localPath,
      );
      fileUrl = await _uploadLocalFile(
        storagePath: storagePath,
        localPath: localPath,
      );
    }

    final payload = <String, dynamic>{
      if (fileUrl != null) 'file_url': fileUrl,
      if (expiryDate != null || fileUrl != null)
        'expiry_date': _formatExpiry(expiryDate),
      if (fileUrl != null)
        'uploaded_at': DateTime.now().toUtc().toIso8601String(),
    };

    if (existingDocId != null && existingDocId.isNotEmpty) {
      if (payload.isEmpty) return;
      await _supabase
          .from('driver_documents')
          .update(payload)
          .eq('id', existingDocId)
          .timeout(_networkTimeout);
      return;
    }

    if (fileUrl == null) {
      throw Exception('Please upload a document file.');
    }

    await _supabase.from('driver_documents').insert({
      'company_id': companyId,
      'driver_id': driverId,
      'document_type': documentType,
      'file_url': fileUrl,
      'expiry_date': _formatExpiry(expiryDate),
    }).timeout(_networkTimeout);
  }

  Future<void> updatePassportSection({
    String? passportNumber,
    String? localPath,
    DateTime? expiryDate,
    String? existingDocId,
  }) async {
    final number = _nullableText(passportNumber);
    final hasDoc = localPath != null || existingDocId != null;

    if (number != null && !hasDoc) {
      throw Exception(
        'Passport document is required when a passport number is provided.',
      );
    }
    if (localPath != null && expiryDate == null) {
      throw Exception('Passport expiry date is required.');
    }

    await _supabase
        .from('drivers')
        .update({
          'passport_number': number,
          'updated_at': DateTime.now().toUtc().toIso8601String(),
        })
        .eq('id', _userId)
        .timeout(_networkTimeout);

    if (hasDoc) {
      await upsertDriverDocument(
        documentType: 'passport',
        localPath: localPath,
        expiryDate: expiryDate,
        existingDocId: existingDocId,
      );
    }
  }

  Future<void> updateDriverDocumentPair({
    required String frontType,
    required String backType,
    String? frontPath,
    String? backPath,
    DateTime? expiryDate,
    String? existingFrontId,
    String? existingBackId,
  }) async {
    final hasNewFile =
        (frontPath != null && frontPath.isNotEmpty) ||
        (backPath != null && backPath.isNotEmpty);
    final hasExisting = existingFrontId != null || existingBackId != null;

    if (hasNewFile && expiryDate == null && !hasExisting) {
      throw Exception('Expiry date is required when uploading documents.');
    }

    if (frontPath != null && frontPath.isNotEmpty) {
      await upsertDriverDocument(
        documentType: frontType,
        localPath: frontPath,
        expiryDate: expiryDate,
        existingDocId: existingFrontId,
      );
    } else if (expiryDate != null && existingFrontId != null) {
      await upsertDriverDocument(
        documentType: frontType,
        expiryDate: expiryDate,
        existingDocId: existingFrontId,
      );
    }

    if (backPath != null && backPath.isNotEmpty) {
      await upsertDriverDocument(
        documentType: backType,
        localPath: backPath,
        expiryDate: expiryDate,
        existingDocId: existingBackId,
      );
    } else if (expiryDate != null && existingBackId != null) {
      await upsertDriverDocument(
        documentType: backType,
        expiryDate: expiryDate,
        existingDocId: existingBackId,
      );
    }
  }

  Future<void> updateDrivingLicenseSection({
    required String licenseNo,
    String? frontPath,
    String? backPath,
    DateTime? expiryDate,
    String? existingFrontId,
    String? existingBackId,
  }) async {
    if (licenseNo.trim().isEmpty) {
      throw Exception('License number is required.');
    }

    await _supabase
        .from('drivers')
        .update({
          'license_no': licenseNo.trim(),
          'updated_at': DateTime.now().toUtc().toIso8601String(),
        })
        .eq('id', _userId)
        .timeout(_networkTimeout);

    await updateDriverDocumentPair(
      frontType: 'driving_license_front',
      backType: 'driving_license_back',
      frontPath: frontPath,
      backPath: backPath,
      expiryDate: expiryDate,
      existingFrontId: existingFrontId,
      existingBackId: existingBackId,
    );
  }

  Future<void> updateDbsSection({
    String? dbsServiceUpdateId,
    String? frontPath,
    String? backPath,
    DateTime? expiryDate,
    String? existingFrontId,
    String? existingBackId,
  }) async {
    await _supabase
        .from('drivers')
        .update({
          'dbs_service_update_id': _nullableText(dbsServiceUpdateId),
          'updated_at': DateTime.now().toUtc().toIso8601String(),
        })
        .eq('id', _userId)
        .timeout(_networkTimeout);

    await updateDriverDocumentPair(
      frontType: 'dbs_certificate_front',
      backType: 'dbs_certificate_back',
      frontPath: frontPath,
      backPath: backPath,
      expiryDate: expiryDate,
      existingFrontId: existingFrontId,
      existingBackId: existingBackId,
    );
  }

  Future<void> updateVehicleDocumentPair({
    required String frontType,
    required String backType,
    String? frontPath,
    String? backPath,
    String? existingFrontId,
    String? existingBackId,
  }) async {
    if (frontPath != null && frontPath.isNotEmpty) {
      await upsertVehicleDocument(
        documentType: frontType,
        localPath: frontPath,
        existingDocId: existingFrontId,
      );
    }
    if (backPath != null && backPath.isNotEmpty) {
      await upsertVehicleDocument(
        documentType: backType,
        localPath: backPath,
        existingDocId: existingBackId,
      );
    }
  }

  Future<void> updateTaxiLicensePlateSection({
    required String plateNumber,
    String? localPath,
    DateTime? expiryDate,
    String? existingDocId,
  }) async {
    if (plateNumber.trim().isEmpty) {
      throw Exception('Taxi license plate number is required.');
    }

    final vehicleId = await _resolveVehicleId();
    if (vehicleId == null || vehicleId.isEmpty) {
      throw Exception('No vehicle is assigned to update documents.');
    }

    await _supabase
        .from('vehicles')
        .update({
          'taxi_license_plate_number': plateNumber.trim(),
          'updated_at': DateTime.now().toUtc().toIso8601String(),
        })
        .eq('id', vehicleId)
        .timeout(_networkTimeout);

    if (localPath != null || existingDocId != null) {
      if (localPath != null && expiryDate == null && existingDocId == null) {
        throw Exception('Expiry date is required when uploading this document.');
      }
      await upsertVehicleDocument(
        documentType: 'taxi_license_plate',
        localPath: localPath,
        expiryDate: expiryDate,
        existingDocId: existingDocId,
      );
    } else if (expiryDate != null && existingDocId != null) {
      await upsertVehicleDocument(
        documentType: 'taxi_license_plate',
        expiryDate: expiryDate,
        existingDocId: existingDocId,
      );
    }
  }

  Future<void> updateVehiclePhoto({required String localPath}) async {
    final driver = await _fetchDriverRow();
    final companyId = driver['company_id']?.toString() ?? '';
    final vehicleId = await _resolveVehicleId();
    if (vehicleId == null || vehicleId.isEmpty) {
      throw Exception('No vehicle is assigned to update the photo.');
    }

    final storagePath = _buildDocumentStoragePath(
      companyId: companyId,
      scopeType: 'vehicles',
      scopeId: vehicleId,
      docType: 'vehicle_photo',
      sourcePath: localPath,
    );
    final publicUrl = await _uploadLocalFile(
      storagePath: storagePath,
      localPath: localPath,
    );

    await _supabase
        .from('vehicles')
        .update({
          'vehicle_photo_url': publicUrl,
          'updated_at': DateTime.now().toUtc().toIso8601String(),
        })
        .eq('id', vehicleId)
        .timeout(_networkTimeout);
  }

  Future<String?> _resolveVehicleId() async {
    final vehicleRow = await _supabase
        .from('vehicles')
        .select('id')
        .eq('driver_id', _userId)
        .order('created_at', ascending: false)
        .limit(1)
        .maybeSingle()
        .timeout(_networkTimeout);
    return vehicleRow?['id']?.toString();
  }

  Future<void> upsertVehicleDocument({
    required String documentType,
    String? localPath,
    DateTime? expiryDate,
    String? existingDocId,
  }) async {
    final driver = await _fetchDriverRow();
    final companyId = driver['company_id']?.toString() ?? '';
    final vehicleId = await _resolveVehicleId();
    if (vehicleId == null || vehicleId.isEmpty) {
      throw Exception('No vehicle is assigned to update documents.');
    }

    String? fileUrl;
    if (localPath != null && localPath.trim().isNotEmpty) {
      final storagePath = _buildDocumentStoragePath(
        companyId: companyId,
        scopeType: 'vehicles',
        scopeId: vehicleId,
        docType: documentType,
        sourcePath: localPath,
      );
      fileUrl = await _uploadLocalFile(
        storagePath: storagePath,
        localPath: localPath,
      );
    }

    final payload = <String, dynamic>{
      if (fileUrl != null) 'file_url': fileUrl,
      if (expiryDate != null || fileUrl != null)
        'expiry_date': _formatExpiry(expiryDate),
      if (fileUrl != null)
        'uploaded_at': DateTime.now().toUtc().toIso8601String(),
    };

    if (existingDocId != null && existingDocId.isNotEmpty) {
      if (payload.isEmpty) return;
      await _supabase
          .from('vehicle_documents')
          .update(payload)
          .eq('id', existingDocId)
          .timeout(_networkTimeout);
      return;
    }

    if (fileUrl == null) {
      throw Exception('Please upload a document file.');
    }

    await _supabase.from('vehicle_documents').insert({
      'company_id': companyId,
      'vehicle_id': vehicleId,
      'document_type': documentType,
      'file_url': fileUrl,
      'expiry_date': _formatExpiry(expiryDate),
    }).timeout(_networkTimeout);
  }
}
