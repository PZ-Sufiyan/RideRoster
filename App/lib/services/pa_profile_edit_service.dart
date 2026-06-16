import 'dart:io';

import 'package:supabase_flutter/supabase_flutter.dart';

class PaProfileEditService {
  SupabaseClient get _supabase => Supabase.instance.client;
  static const String _companyDocsBucket = 'company-documents';
  static const Duration _networkTimeout = Duration(seconds: 30);

  String get _userId {
    final id = _supabase.auth.currentUser?.id;
    if (id == null || id.isEmpty) {
      throw Exception('No authenticated passenger assistant session found.');
    }
    return id;
  }

  Future<Map<String, dynamic>> _fetchAssistantRow() async {
    final row = await _supabase
        .from('passenger_assistant')
        .select('id, company_id, profile_picture_url')
        .eq('id', _userId)
        .maybeSingle()
        .timeout(_networkTimeout);
    if (row == null) {
      throw Exception('Passenger assistant profile record was not found.');
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

  String _buildStoragePath({
    required String companyId,
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
    return '$companyId/passenger-assistants/$scopeId/$safeDoc/$filename';
  }

  String _basename(String localPath) {
    return localPath.replaceAll(r'\', '/').split('/').last;
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
    final row = await _fetchAssistantRow();
    final companyId = row['company_id']?.toString() ?? '';
    final assistantId = row['id']?.toString() ?? '';

    final storagePath = _buildStoragePath(
      companyId: companyId,
      scopeId: assistantId,
      docType: 'profile',
      sourcePath: localPath,
    );
    final publicUrl = await _uploadLocalFile(
      storagePath: storagePath,
      localPath: localPath,
    );

    await _supabase
        .from('passenger_assistant')
        .update({
          'profile_picture_url': publicUrl,
          'updated_at': DateTime.now().toUtc().toIso8601String(),
        })
        .eq('id', assistantId)
        .timeout(_networkTimeout);
  }

  Future<void> updatePersonalInfo({
    required String firstName,
    required String surname,
    required String phone,
    String? residentialAddress,
    required String emergencyContactName,
    required String emergencyContactPhone,
    required String nationality,
    String? rightToWorkCode,
    String? passportNumber,
  }) async {
    if (firstName.trim().isEmpty || surname.trim().isEmpty) {
      throw Exception('First name and surname are required.');
    }
    if (phone.trim().isEmpty) {
      throw Exception('Phone number is required.');
    }
    if (nationality.trim().isEmpty) {
      throw Exception('Nationality is required.');
    }

    await _supabase
        .from('passenger_assistant')
        .update({
          'first_name': firstName.trim(),
          'surname': surname.trim(),
          'phone': phone.trim(),
          'residential_address': _nullableText(residentialAddress),
          'emergency_contact_name': emergencyContactName.trim(),
          'emergency_contact_phone': emergencyContactPhone.trim(),
          'nationality': nationality.trim(),
          'right_to_work_code': nationality.trim().toLowerCase() == 'british'
              ? null
              : _nullableText(rightToWorkCode),
          'passport_number': _nullableText(passportNumber),
          'updated_at': DateTime.now().toUtc().toIso8601String(),
        })
        .eq('id', _userId)
        .timeout(_networkTimeout);
  }

  Future<void> updatePassportSection({
    String? passportNumber,
    String? localPath,
    String? existingDocId,
  }) async {
    final number = _nullableText(passportNumber);
    final hasDoc = localPath != null || existingDocId != null;

    if (number != null && !hasDoc) {
      throw Exception(
        'Passport document is required when a passport number is provided.',
      );
    }

    await _supabase
        .from('passenger_assistant')
        .update({
          'passport_number': number,
          'updated_at': DateTime.now().toUtc().toIso8601String(),
        })
        .eq('id', _userId)
        .timeout(_networkTimeout);

    if (hasDoc) {
      await upsertDocument(
        documentType: 'passport',
        localPath: localPath,
        existingDocId: existingDocId,
      );
    }
  }

  Future<void> upsertDocument({
    required String documentType,
    String? localPath,
    DateTime? expiryDate,
    String? existingDocId,
  }) async {
    final row = await _fetchAssistantRow();
    final assistantId = row['id']?.toString() ?? '';
    final companyId = row['company_id']?.toString() ?? '';

    String? fileUrl;
    String? fileName;
    if (localPath != null && localPath.trim().isNotEmpty) {
      final storagePath = _buildStoragePath(
        companyId: companyId,
        scopeId: assistantId,
        docType: documentType,
        sourcePath: localPath,
      );
      fileUrl = await _uploadLocalFile(
        storagePath: storagePath,
        localPath: localPath,
      );
      fileName = _basename(localPath);
    }

    final payload = <String, dynamic>{
      if (fileUrl != null) 'file_url': fileUrl,
      if (fileName != null) 'file_name': fileName,
      if (expiryDate != null || fileUrl != null)
        'expiry_date': _formatExpiry(expiryDate),
      if (fileUrl != null) ...{
        'uploaded_at': DateTime.now().toUtc().toIso8601String(),
        'verified': false,
      },
    };

    if (existingDocId != null && existingDocId.isNotEmpty) {
      if (payload.isEmpty) return;
      await _supabase
          .from('passenger_assistant_documents')
          .update(payload)
          .eq('id', existingDocId)
          .timeout(_networkTimeout);
      return;
    }

    if (fileUrl == null) {
      throw Exception('Please upload a document file.');
    }

    await _supabase.from('passenger_assistant_documents').insert({
      'passenger_assistant_id': assistantId,
      'document_type': documentType,
      'file_name': fileName,
      'file_url': fileUrl,
      'expiry_date': _formatExpiry(expiryDate),
      'verified': false,
    }).timeout(_networkTimeout);
  }
}
