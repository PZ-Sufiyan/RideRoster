import 'dart:io';

import 'api_service.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class AuthService extends ApiService {
  SupabaseClient get _supabase => Supabase.instance.client;
  static const String _companyDocsBucket = 'company-documents';

  static const Set<String> _allowedRoles = {
    'driver',
    'passenger_assistant',
  };

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
    final filename = ext.isEmpty ? '${safeDoc}_$millis' : '${safeDoc}_$millis.$ext';
    return '$companyId/$scopeType/$scopeId/$safeDoc/$filename';
  }

  Future<String?> _uploadFile({
    required String companyId,
    required String scopeType,
    required String scopeId,
    required String docType,
    required String localPath,
  }) async {
    if (localPath.trim().isEmpty) return null;
    final file = File(localPath);
    if (!await file.exists()) return null;

    final storagePath = _buildStoragePath(
      companyId: companyId,
      scopeType: scopeType,
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

  String? _extractRole(User user) {
    final appMetaRole = user.appMetadata['role']?.toString();
    final userMetaRole = user.userMetadata?['role']?.toString();
    return appMetaRole ?? userMetaRole;
  }

  String? _extractDisplayName(User user) {
    return user.userMetadata?['full_name']?.toString() ??
        user.userMetadata?['name']?.toString();
  }

  // ---------------------------------------------------------------------------
  // Driver Auth
  // ---------------------------------------------------------------------------

  /// Login with email/password.
  /// Returns [AuthResult] — check [AuthResult.success] before reading [AuthResult.token].
  Future<AuthResult> driverLogin({
    required String email,
    required String password,
  }) async {
    if (email.isEmpty || password.isEmpty) {
      return AuthResult.failure('Email and password are required.');
    }
    if (!email.contains('@')) {
      return AuthResult.failure('Please enter a valid email address.');
    }
    if (password.length < 6) {
      return AuthResult.failure('Password must be at least 6 characters.');
    }

    try {
      final response = await _supabase.auth.signInWithPassword(
        email: email,
        password: password,
      );
      final user = response.user;
      final session = response.session;

      if (user == null || session == null) {
        return AuthResult.failure('Unable to sign in. Please try again.');
      }

      final role = _extractRole(user);
      if (role == null || !_allowedRoles.contains(role)) {
        await _supabase.auth.signOut();
        return AuthResult.failure(
          'Access denied. Only drivers and passenger assistants can sign in.',
        );
      }

      return AuthResult.success(
        token: session.accessToken,
        userId: user.id,
        name: _extractDisplayName(user),
        email: user.email,
      );
    } on AuthException catch (e) {
      return AuthResult.failure(e.message);
    } catch (_) {
      return AuthResult.failure(
        'Login failed due to an unexpected error. Please try again.',
      );
    }
  }

  /// Send password-reset email.
  Future<AuthResult> driverForgotPassword({required String email}) async {
    if (!email.contains('@')) {
      return AuthResult.failure('Please enter a valid email address.');
    }
    try {
      await _supabase.auth.resetPasswordForEmail(email);
      return AuthResult.success(message: 'Password reset link sent to $email');
    } on AuthException catch (e) {
      return AuthResult.failure(e.message);
    } catch (_) {
      return AuthResult.failure(
        'Unable to send reset link right now. Please try again.',
      );
    }
  }

  /// Register a new driver account.
  ///
  /// TO SWAP TO REAL API:
  ///   Build a multipart/form-data request with all fields + files.
  ///   Example:
  ///     final request = http.MultipartRequest(
  ///       'POST', Uri.parse('${ApiService.baseUrl}/auth/driver/register'),
  ///     );
  ///     request.fields['fullName'] = fullName;
  ///     request.fields['email'] = email;
  ///     // ... add all fields
  ///     if (drivingLicenseFrontPath != null) {
  ///       request.files.add(await http.MultipartFile.fromPath(
  ///         'drivingLicenseFront', drivingLicenseFrontPath,
  ///       ));
  ///     }
  ///     final response = await request.send();
  Future<AuthResult> driverRegister({
    required String fullName,
    String? firstName,
    String? lastName,
    required String email,
    required String password,
    required String companyId,
    required String companyName,
    required String countryCode,
    required String mobileNumber,
    String? residentialAddress,
    String? emergencyContactName,
    String? emergencyContactPhone,
    String? passportNumber,
    String? rightToWorkCode,
    required String registrationNumber,
    required String taxiPlateNumber,
    required String make,
    required String model,
    String? vehicleColour,
    DateTime? yearOfFirstRegistration,
    required String licensingType,
    required String bodyStyle,
    required String passengerSeats,
    required bool wheelchairAccessible,
    // File paths — replace with real multipart upload when backend ready
    String? drivingLicenseFrontPath,
    String? drivingLicenseBackPath,
    DateTime? drivingLicenseExpiry,
    String? taxiBadgeFrontPath,
    String? taxiBadgeBackPath,
    DateTime? taxiBadgeExpiry,
    String? dbsCertFrontPath,
    String? dbsCertBackPath,
    DateTime? dbsCertExpiry,
    String? dbsServiceUpdateId,
    String? safeguardingCertPath,
    String? licenseNumber,
    String? v5DocumentFrontPath,
    String? v5DocumentInsidePath,
    String? motCertificatePath,
    DateTime? motCertificateExpiry,
    String? taxiLicensePlatePath,
    String? taxiLicensePlateNumber,
    DateTime? taxiLicensePlateExpiry,
    String? insuranceCertificatePath,
    DateTime? insuranceCertificateExpiry,
    String? vehiclePhotoPath,
  }) async {
    if (fullName.isEmpty || email.isEmpty || password.isEmpty || companyId.isEmpty) {
      return AuthResult.failure('Please complete all required fields.');
    }
    if (!email.contains('@')) {
      return AuthResult.failure('Please enter a valid email address.');
    }

    if (firstName == null || firstName.trim().isEmpty) {
      return AuthResult.failure('First name is required.');
    }
    if (lastName == null || lastName.trim().isEmpty) {
      return AuthResult.failure('Last name is required.');
    }
    if (mobileNumber.trim().isEmpty) {
      return AuthResult.failure('Mobile number is required.');
    }
    if (residentialAddress == null || residentialAddress.trim().isEmpty) {
      return AuthResult.failure('Residential address is required.');
    }
    if (emergencyContactName == null || emergencyContactName.trim().isEmpty) {
      return AuthResult.failure('Emergency contact name is required.');
    }
    if (emergencyContactPhone == null || emergencyContactPhone.trim().isEmpty) {
      return AuthResult.failure('Emergency contact phone is required.');
    }
    if (licenseNumber == null || licenseNumber.trim().isEmpty) {
      return AuthResult.failure('License number is required.');
    }
    if (taxiPlateNumber.trim().isEmpty) {
      return AuthResult.failure('Taxi plate number is required.');
    }

    try {
      final authResponse = await _supabase.auth.signUp(
        email: email,
        password: password,
        data: {
          'role': 'driver',
          'full_name': fullName,
          'company_id': companyId,
          'company_name': companyName,
        },
      );

      final authUser = authResponse.user;
      if (authUser == null) {
        return AuthResult.failure('Could not create auth account.');
      }

      final driverInsert = await _supabase
          .from('drivers')
          .insert({
            'id': authUser.id,
            'company_id': companyId,
            'first_name': firstName.trim(),
            'last_name': lastName.trim(),
            'email': email,
            'phone': '$countryCode${mobileNumber.trim()}',
            'residential_address': residentialAddress.trim(),
            'emergency_contact_name': emergencyContactName.trim(),
            'emergency_contact_phone': emergencyContactPhone.trim(),
            'passport_number': passportNumber?.trim().isEmpty == true
                ? null
                : passportNumber?.trim(),
            'right_to_work_code': rightToWorkCode?.trim().isEmpty == true
                ? null
                : rightToWorkCode?.trim(),
            'license_no': licenseNumber.trim(),
            'status': 'pending',
          })
          .select('id')
          .single();

      final driverId = driverInsert['id']?.toString();
      if (driverId == null || driverId.isEmpty) {
        return AuthResult.failure('Driver profile could not be created.');
      }

      final driverDocs = <Map<String, dynamic>>[];
      Future<void> addDriverDoc({
        required String docType,
        required String? localPath,
        DateTime? expiryDate,
      }) async {
        if (localPath == null || localPath.trim().isEmpty) return;
        final publicUrl = await _uploadFile(
          companyId: companyId,
          scopeType: 'drivers',
          scopeId: driverId,
          docType: docType,
          localPath: localPath,
        );
        if (publicUrl == null) return;
        driverDocs.add({
          'company_id': companyId,
          'driver_id': driverId,
          'document_type': docType,
          'file_url': publicUrl,
          'expiry_date': expiryDate?.toIso8601String().split('T').first,
        });
      }

      await addDriverDoc(
        docType: 'driving_license_front',
        localPath: drivingLicenseFrontPath,
        expiryDate: drivingLicenseExpiry,
      );
      await addDriverDoc(
        docType: 'driving_license_back',
        localPath: drivingLicenseBackPath,
        expiryDate: drivingLicenseExpiry,
      );
      await addDriverDoc(
        docType: 'taxi_badge_front',
        localPath: taxiBadgeFrontPath,
        expiryDate: taxiBadgeExpiry,
      );
      await addDriverDoc(
        docType: 'taxi_badge_back',
        localPath: taxiBadgeBackPath,
        expiryDate: taxiBadgeExpiry,
      );
      await addDriverDoc(
        docType: 'dbs_certificate_front',
        localPath: dbsCertFrontPath,
        expiryDate: dbsCertExpiry,
      );
      await addDriverDoc(
        docType: 'dbs_certificate_back',
        localPath: dbsCertBackPath,
        expiryDate: dbsCertExpiry,
      );
      await addDriverDoc(
        docType: 'safeguarding_certificate',
        localPath: safeguardingCertPath,
      );

      if (driverDocs.isNotEmpty) {
        await _supabase.from('driver_documents').insert(driverDocs);
      }

      final vehiclePhotoUrl = await _uploadFile(
        companyId: companyId,
        scopeType: 'vehicles',
        scopeId: driverId,
        docType: 'vehicle_photo',
        localPath: vehiclePhotoPath ?? '',
      );

      final seats = int.tryParse(passengerSeats.trim());
      final vehicleInsert = await _supabase
          .from('vehicles')
          .insert({
            'company_id': companyId,
            'driver_id': driverId,
            'taxi_license_plate_number':
                (taxiLicensePlateNumber?.trim().isNotEmpty ?? false)
                    ? taxiLicensePlateNumber!.trim()
                    : taxiPlateNumber.trim(),
            'vehicle_photo_url': vehiclePhotoUrl,
            'seating_capacity': seats,
            'name': '$make $model'.trim(),
            'registration_number': registrationNumber.trim().isEmpty
                ? null
                : registrationNumber.trim(),
            'make': make.trim().isEmpty ? null : make.trim(),
            'model': model.trim().isEmpty ? null : model.trim(),
            'vehicle_colour': vehicleColour?.trim().isEmpty == true
                ? null
                : vehicleColour?.trim(),
            'year_of_first_registration': yearOfFirstRegistration
                ?.toIso8601String()
                .split('T')
                .first,
            'licensing_type': licensingType.trim().isEmpty
                ? null
                : licensingType.trim(),
            'body_style': bodyStyle.trim().isEmpty ? null : bodyStyle.trim(),
            'wheelchair_accessible': wheelchairAccessible,
          })
          .select('id')
          .single();

      final vehicleId = vehicleInsert['id']?.toString();
      if (vehicleId == null || vehicleId.isEmpty) {
        return AuthResult.failure('Vehicle profile could not be created.');
      }

      final vehicleDocs = <Map<String, dynamic>>[];
      Future<void> addVehicleDoc({
        required String docType,
        required String? localPath,
        DateTime? expiryDate,
      }) async {
        if (localPath == null || localPath.trim().isEmpty) return;
        final publicUrl = await _uploadFile(
          companyId: companyId,
          scopeType: 'vehicles',
          scopeId: vehicleId,
          docType: docType,
          localPath: localPath,
        );
        if (publicUrl == null) return;
        vehicleDocs.add({
          'company_id': companyId,
          'vehicle_id': vehicleId,
          'document_type': docType,
          'file_url': publicUrl,
          'expiry_date': expiryDate?.toIso8601String().split('T').first,
        });
      }

      await addVehicleDoc(
        docType: 'v5_front',
        localPath: v5DocumentFrontPath,
      );
      await addVehicleDoc(
        docType: 'v5_inside',
        localPath: v5DocumentInsidePath,
      );
      await addVehicleDoc(
        docType: 'mot_certificate',
        localPath: motCertificatePath,
        expiryDate: motCertificateExpiry,
      );
      await addVehicleDoc(
        docType: 'taxi_license_plate',
        localPath: taxiLicensePlatePath,
        expiryDate: taxiLicensePlateExpiry,
      );
      await addVehicleDoc(
        docType: 'insurance_certificate',
        localPath: insuranceCertificatePath,
        expiryDate: insuranceCertificateExpiry,
      );

      if (vehicleDocs.isNotEmpty) {
        await _supabase.from('vehicle_documents').insert(vehicleDocs);
      }

      return AuthResult.success(
        token: authResponse.session?.accessToken,
        userId: authUser.id,
        name: fullName,
        email: email,
        message: 'Registration successful. Check your email to confirm account.',
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

  /// Logout — clear token from storage.
  Future<void> driverLogout() async {
    await _supabase.auth.signOut();
  }

  /// Restore current auth session if one exists.
  Future<AuthResult> restoreSession() async {
    try {
      final session = _supabase.auth.currentSession;
      final user = _supabase.auth.currentUser;
      if (session == null || user == null) {
        return AuthResult.failure('No active session.');
      }

      final role = _extractRole(user);
      if (role == null || !_allowedRoles.contains(role)) {
        await _supabase.auth.signOut();
        return AuthResult.failure(
          'Access denied. Only drivers and passenger assistants can sign in.',
        );
      }

      return AuthResult.success(
        token: session.accessToken,
        userId: user.id,
        name: _extractDisplayName(user),
        email: user.email,
      );
    } catch (_) {
      return AuthResult.failure('Could not restore session.');
    }
  }
}

// ---------------------------------------------------------------------------
// Result model
// ---------------------------------------------------------------------------

class AuthResult {
  final bool success;
  final String? token;
  final String? userId;
  final String? name;
  final String? email;
  final String? message;
  final String? error;

  AuthResult._({
    required this.success,
    this.token,
    this.userId,
    this.name,
    this.email,
    this.message,
    this.error,
  });

  factory AuthResult.success({
    String? token,
    String? userId,
    String? name,
    String? email,
    String? message,
  }) {
    return AuthResult._(
      success: true,
      token: token,
      userId: userId,
      name: name,
      email: email,
      message: message,
    );
  }

  factory AuthResult.failure(String error) {
    return AuthResult._(success: false, error: error);
  }
}
