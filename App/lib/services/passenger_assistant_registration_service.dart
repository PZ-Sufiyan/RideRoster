import 'dart:io';

import 'package:supabase_flutter/supabase_flutter.dart';

import 'api_service.dart';
import 'auth_result.dart';

/// Registers a passenger assistant: Supabase Auth sign-up, then
/// `passenger_assistant` and `passenger_assistant_documents`.
///
/// Uses the auth user id as `passenger_assistant.id` so the profile row matches
/// the authenticated user (same pattern as drivers).
///
/// [assistant_document_type] in your database allows one row per type per PA
/// (`uq_passenger_doc_per_type`). Only these types are inserted:
/// `passport`, `safeguarding_certificate`, `background_check`, `first_aid_certificate`.
/// Additional “other” certificates from the UI are uploaded to company storage
/// for audit only until the enum supports extra types.
class PassengerAssistantRegistrationService extends ApiService {
  SupabaseClient get _supabase => Supabase.instance.client;
  static const String _companyDocsBucket = 'company-documents';

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

  Future<String?> _uploadFile({
    required String companyId,
    required String scopeId,
    required String docType,
    required String localPath,
  }) async {
    if (localPath.trim().isEmpty) return null;
    final file = File(localPath);
    if (!await file.exists()) return null;

    final storagePath = _buildStoragePath(
      companyId: companyId,
      scopeType: 'passenger-assistants',
      scopeId: scopeId,
      docType: docType,
      sourcePath: localPath,
    );

    await _supabase.storage.from(_companyDocsBucket).upload(
          storagePath,
          file,
          fileOptions: const FileOptions(upsert: true),
        );
    return _supabase.storage.from(_companyDocsBucket).getPublicUrl(storagePath);
  }

  String _basename(String localPath) {
    return localPath.replaceAll(r'\', '/').split('/').last;
  }

  /// Core registration used by [AuthService.passengerAssistantRegister].
  Future<AuthResult> registerPassengerAssistant({
    required String firstName,
    required String lastName,
    required String email,
    required String password,
    required String companyId,
    required String companyName,
    required String countryCode,
    required String mobileNumber,
    String? residentialAddress,
    required String nationality,
    required bool isBritishPassportHolder,
    String? rightToWorkCode,
    required String emergencyContactName,
    required String emergencyContactPhone,
    String? profilePhotoPath,
    String? passportNumber,
    String? passportFilePath,
    DateTime? passportExpiry,
    String? safeguardingFilePath,
    DateTime? safeguardingExpiry,
    String? backgroundCheckFilePath,
    String? firstAidFilePath,
    List<String> otherCertificateLabels = const [],
    List<String> otherCertificatePaths = const [],
  }) async {
    final fullName = '${firstName.trim()} ${lastName.trim()}'.trim();
    final emailNorm = email.trim().toLowerCase();

    if (fullName.isEmpty ||
        emailNorm.isEmpty ||
        password.isEmpty ||
        companyId.isEmpty) {
      return AuthResult.failure('Please complete all required fields.');
    }
    if (!emailNorm.contains('@')) {
      return AuthResult.failure('Please enter a valid email address.');
    }
    if (firstName.trim().isEmpty || lastName.trim().isEmpty) {
      return AuthResult.failure('First and last name are required.');
    }
    if (mobileNumber.trim().isEmpty) {
      return AuthResult.failure('Phone number is required.');
    }
    if (nationality.trim().isEmpty) {
      return AuthResult.failure('Nationality is required.');
    }
    if (!isBritishPassportHolder &&
        (rightToWorkCode == null || rightToWorkCode.trim().isEmpty)) {
      return AuthResult.failure(
        'Right to work is required for non-British passport holders.',
      );
    }
    if (emergencyContactName.trim().isEmpty ||
        emergencyContactPhone.trim().isEmpty) {
      return AuthResult.failure('Emergency contact details are required.');
    }
    if (passportFilePath != null &&
        passportFilePath.trim().isNotEmpty &&
        passportExpiry == null) {
      return AuthResult.failure(
        'Passport expiry is required when a passport document is uploaded.',
      );
    }
    if (safeguardingFilePath != null &&
        safeguardingFilePath.trim().isNotEmpty &&
        safeguardingExpiry == null) {
      return AuthResult.failure(
        'Safeguarding expiry is required when a safeguarding file is uploaded.',
      );
    }
    if (otherCertificateLabels.length != otherCertificatePaths.length) {
      return AuthResult.failure(
        'Other certificate data is inconsistent. Please try again.',
      );
    }

    try {
      // 1) Supabase Authentication — metadata matches app usage (role, company, etc.)
      final authResponse = await _supabase.auth.signUp(
        email: emailNorm,
        password: password,
        data: {
          'role': 'passenger_assistant',
          'email': emailNorm,
          'full_name': fullName,
          'first_name': firstName.trim(),
          'last_name': lastName.trim(),
          'company_id': companyId,
          'company_name': companyName.trim(),
          if (passportNumber != null && passportNumber.trim().isNotEmpty)
            'passport_number': passportNumber.trim(),
        },
      );

      final authUser = authResponse.user;
      if (authUser == null) {
        return AuthResult.failure('Could not create auth account.');
      }

      final assistantId = authUser.id;

      // 2) Profile image → public URL
      String? profilePictureUrl;
      final profilePath = profilePhotoPath?.trim();
      if (profilePath != null && profilePath.isNotEmpty) {
        profilePictureUrl = await _uploadFile(
          companyId: companyId,
          scopeId: assistantId,
          docType: 'profile',
          localPath: profilePath,
        );
      }

      // 3) passenger_assistant row — id = auth user id for a stable link
      await _supabase.from('passenger_assistant').insert({
        'id': assistantId,
        'company_id': companyId,
        'first_name': firstName.trim(),
        'surname': lastName.trim(),
        'email': emailNorm,
        'phone': '$countryCode${mobileNumber.trim()}',
        'residential_address':
            residentialAddress == null || residentialAddress.trim().isEmpty
                ? null
                : residentialAddress.trim(),
        'profile_picture_url': profilePictureUrl,
        'emergency_contact_name': emergencyContactName.trim(),
        'emergency_contact_phone': emergencyContactPhone.trim(),
        'nationality': nationality.trim(),
        'right_to_work_code': isBritishPassportHolder
            ? null
            : (rightToWorkCode?.trim().isEmpty ?? true
                ? null
                : rightToWorkCode!.trim()),
        'status': 'pending',
      });

      // 4) Standard documents (enum + unique constraint: one row per type)
      final docRows = <Map<String, dynamic>>[];

      Future<void> addStandardDoc({
        required String documentType,
        required String? localPath,
        DateTime? expiryDate,
        String? displayFileName,
      }) async {
        if (localPath == null || localPath.trim().isEmpty) return;
        final url = await _uploadFile(
          companyId: companyId,
          scopeId: assistantId,
          docType: documentType,
          localPath: localPath,
        );
        if (url == null) return;
        docRows.add({
          'passenger_assistant_id': assistantId,
          'document_type': documentType,
          'file_name': displayFileName ?? _basename(localPath),
          'file_url': url,
          'expiry_date': expiryDate?.toIso8601String().split('T').first,
          'verified': false,
        });
      }

      await addStandardDoc(
        documentType: 'passport',
        localPath: passportFilePath,
        expiryDate: passportExpiry,
      );
      await addStandardDoc(
        documentType: 'safeguarding_certificate',
        localPath: safeguardingFilePath,
        expiryDate: safeguardingExpiry,
      );
      await addStandardDoc(
        documentType: 'background_check',
        localPath: backgroundCheckFilePath,
      );
      await addStandardDoc(
        documentType: 'first_aid_certificate',
        localPath: firstAidFilePath,
      );

      if (docRows.isNotEmpty) {
        await _supabase.from('passenger_assistant_documents').insert(docRows);
      }

      // 5) Optional extra certificates — storage only (see class dartdoc)
      for (var i = 0; i < otherCertificateLabels.length; i++) {
        final path = otherCertificatePaths[i];
        if (path.trim().isEmpty) continue;
        final label = otherCertificateLabels[i].trim();
        final docType = label.isEmpty
            ? 'optional_certificate_$i'
            : 'optional_${_safePathSegment(label)}_$i';
        await _uploadFile(
          companyId: companyId,
          scopeId: assistantId,
          docType: docType,
          localPath: path,
        );
      }

      return AuthResult.success(
        token: authResponse.session?.accessToken,
        userId: assistantId,
        name: fullName,
        email: emailNorm,
        message:
            'Registration successful. Check your email to confirm your account.',
      );
    } on AuthException catch (e) {
      return AuthResult.failure(e.message);
    } on PostgrestException catch (e) {
      return AuthResult.failure(e.message);
    } on StorageException catch (e) {
      return AuthResult.failure(e.message);
    } catch (e) {
      return AuthResult.failure('Registration failed: $e');
    }
  }
}
