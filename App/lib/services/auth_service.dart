import 'dart:async';
import 'dart:io';

import 'dart:convert';

import 'package:supabase_flutter/supabase_flutter.dart';

import '../config/supabase_config.dart';
import 'api_service.dart';
import 'auth_result.dart';
import 'connectivity_service.dart';
import 'email_confirmation_service.dart';
import 'passenger_assistant_registration_service.dart';

export 'auth_result.dart';

class AuthService extends ApiService {
  SupabaseClient get _supabase => Supabase.instance.client;
  static const Duration _profileLookupTimeout = Duration(seconds: 3);
  static const String _companyDocsBucket = 'company-documents';

  static const Set<String> _allowedRoles = {'driver', 'passenger_assistant'};

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

    await _supabase.storage
        .from(_companyDocsBucket)
        .upload(
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

  String? _buildName(String? firstName, String? lastName) {
    final first = (firstName ?? '').trim();
    final last = (lastName ?? '').trim();
    final full = '$first $last'.trim();
    return full.isEmpty ? null : full;
  }

  Future<String?> _resolveDisplayName({
    required User user,
    required String? role,
  }) async {
    final metaName = _extractDisplayName(user);

    if (role != 'driver' || !ConnectivityService().canReachServer) {
      return metaName;
    }

    try {
      final row = await _supabase
          .from('drivers')
          .select('first_name, last_name')
          .eq('id', user.id)
          .maybeSingle()
          .timeout(_profileLookupTimeout);

      if (row is Map<String, dynamic>) {
        final tableName = _buildName(
          row['first_name']?.toString(),
          row['last_name']?.toString(),
        );
        if (tableName != null) return tableName;
      }
    } catch (_) {
      // Fall back to auth metadata when profile lookup is unavailable.
    }

    return metaName;
  }

  // ---------------------------------------------------------------------------
  // Driver Auth
  // ---------------------------------------------------------------------------

  /// Login with email/password.
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
        email: email.trim().toLowerCase(),
        password: password,
      );
      final user = response.user;
      final session = response.session;

      if (user == null || session == null) {
        return AuthResult.failure(
          'Unable to sign in right now. Please try again.',
        );
      }

      if (user.emailConfirmedAt == null) {
        await _supabase.auth.signOut();
        return AuthResult.failure(
          'Please check your email and confirm your account before logging in.',
        );
      }

      final role = _extractRole(user);
      if (role == null || !_allowedRoles.contains(role)) {
        await _supabase.auth.signOut();
        return AuthResult.failure(
          'Access denied. Only drivers and passenger assistants can sign in.',
        );
      }

      final resolvedName = await _resolveDisplayName(user: user, role: role);

      return AuthResult.success(
        token: session.accessToken,
        userId: user.id,
        name: resolvedName,
        email: user.email,
        role: role,
      );
    } on AuthException catch (e) {
      return AuthResult.failure(_friendlyLoginError(e.message));
    } on SocketException {
      return AuthResult.failure(
        'Connection problem. Check your internet and try again.',
      );
    } on TimeoutException {
      return AuthResult.failure(
        'Connection problem. Check your internet and try again.',
      );
    } catch (e) {
      return AuthResult.failure(_friendlyLoginError(e.toString()));
    }
  }

  /// User-facing login errors only — never raw network/auth text.
  String _friendlyLoginError(String? raw) {
    final msg = (raw ?? '').toLowerCase();
    if (msg.contains('email not confirmed') ||
        msg.contains('email_not_confirmed') ||
        msg.contains('confirm your email') ||
        msg.contains('check your email and confirm')) {
      return 'Please check your email and confirm your account before logging in.';
    }
    if (msg.contains('invalid login credentials') ||
        msg.contains('invalid credentials') ||
        msg.contains('wrong password') ||
        msg.contains('user not found')) {
      return 'Incorrect email or password.';
    }
    if (msg.contains('failed to fetch') ||
        msg.contains('socket') ||
        msg.contains('network') ||
        msg.contains('timeout') ||
        msg.contains('timed out') ||
        msg.contains('offline') ||
        msg.contains('connection') ||
        msg.contains('clientexception') ||
        msg.contains('handshake')) {
      return 'Connection problem. Check your internet and try again.';
    }
    if (msg.contains('server') ||
        msg.contains('500') ||
        msg.contains('502') ||
        msg.contains('503') ||
        msg.contains('504') ||
        msg.contains('internal')) {
      return 'Something went wrong on our side. Please try again in a moment.';
    }
    return 'Unable to sign in right now. Please try again.';
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
      return AuthResult.failure(_friendlyLoginError(e.message));
    } on SocketException {
      return AuthResult.failure(
        'Connection problem. Check your internet and try again.',
      );
    } on TimeoutException {
      return AuthResult.failure(
        'Connection problem. Check your internet and try again.',
      );
    } catch (e) {
      return AuthResult.failure(_friendlyLoginError(e.toString()));
    }
  }

  /// Register a new driver account.
  ///
  /// [nationality] is stored on the driver row. 'British' drivers have no
  /// right-to-work requirement so [rightToWorkCode] will be null/empty for them.
  ///
  /// [otherCertificateLabels] and [otherCertificatePaths] are parallel lists
  /// of additional certificates (English proficiency, epilepsy cert, etc.).
  /// Each pair is uploaded as a separate `driver_documents` row with
  /// document_type = 'other_certificate'.
  ///
  /// TO SWAP TO REAL API:
  ///   Build a multipart/form-data request with all fields + files.
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
    // Passport copy upload + expiry (stored as driver_documents row of type 'passport')
    String? passportFilePath,
    DateTime? passportExpiry,
    // Nationality — 'British' or free-text (e.g. 'Pakistani')
    String? nationality,
    // Right-to-work code — null/empty for British nationals
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
    // Driver document paths
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
    // Other certificates — parallel lists (label + file path per entry)
    List<String> otherCertificateLabels = const [],
    List<String> otherCertificatePaths = const [],
    // Vehicle document paths
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
    // ── Validation ────────────────────────────────────────────────────────────
    if (fullName.isEmpty ||
        email.isEmpty ||
        password.isEmpty ||
        companyId.isEmpty) {
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
    if (nationality == null || nationality.trim().isEmpty) {
      return AuthResult.failure('Nationality is required.');
    }
    if (licenseNumber == null || licenseNumber.trim().isEmpty) {
      return AuthResult.failure('License number is required.');
    }
    if (taxiPlateNumber.trim().isEmpty) {
      return AuthResult.failure('Taxi plate number is required.');
    }

    // Validate other-certificate lists are consistent
    if (otherCertificateLabels.length != otherCertificatePaths.length) {
      return AuthResult.failure(
        'Other certificate data is inconsistent. Please try again.',
      );
    }

    try {
      final emailNorm = email.trim().toLowerCase();
      const role = 'driver';

      // ── 1. Create unconfirmed auth user (server) + session for uploads ───
      late final User authUser;
      try {
        authUser =
            await EmailConfirmationService.instance.createUnconfirmedUserAndSignIn(
          email: emailNorm,
          password: password,
          role: role,
          userMetadata: {
            'role': role,
            'full_name': fullName,
            'company_id': companyId,
            'company_name': companyName,
          },
        );
      } catch (e) {
        try {
          await _supabase.auth.signOut();
        } catch (_) {}
        final msg = e.toString().replaceFirst(RegExp(r'^Exception:\s*'), '');
        return AuthResult.failure(
          msg.isEmpty ? 'Could not create auth account.' : msg,
        );
      }

      // ── 2. Insert driver row ─────────────────────────────────────────────
      final driverInsert = await _supabase
          .from('drivers')
          .insert({
            'id': authUser.id,
            'company_id': companyId,
            'first_name': firstName.trim(),
            'last_name': lastName.trim(),
            'email': emailNorm,
            'phone': '$countryCode${mobileNumber.trim()}',
            'residential_address': residentialAddress.trim(),
            'emergency_contact_name': emergencyContactName.trim(),
            'emergency_contact_phone': emergencyContactPhone.trim(),
            'passport_number': passportNumber?.trim().isEmpty == true
                ? null
                : passportNumber?.trim(),
            'nationality': nationality.trim(),
            // British nationals have no right-to-work requirement
            'right_to_work_code': rightToWorkCode?.trim().isEmpty == true
                ? null
                : rightToWorkCode?.trim(),
            'license_no': licenseNumber.trim(),
            'dbs_service_update_id': dbsServiceUpdateId?.trim().isEmpty == true
                ? null
                : dbsServiceUpdateId?.trim(),
            'status': 'pending',
          })
          .select('id')
          .single();

      final driverId = driverInsert['id']?.toString();
      if (driverId == null || driverId.isEmpty) {
        return AuthResult.failure('Driver profile could not be created.');
      }

      // ── 3. Upload & insert driver documents ──────────────────────────────
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
      await addDriverDoc(
        docType: 'passport',
        localPath: passportFilePath,
        expiryDate: passportExpiry,
      );

      // Other certificates — upload each with its user-defined label stored
      // in the document_type field as 'other_certificate' and the label
      // encoded in the path so it is traceable in storage.
      for (var i = 0; i < otherCertificateLabels.length; i++) {
        final label = otherCertificateLabels[i];
        final path = otherCertificatePaths[i];
        if (path.trim().isEmpty) continue;

        // Use the label as part of the storage docType so files are grouped
        // by name inside storage (e.g. other_certificate_english_proficiency/)
        final safeLabel = _safePathSegment(label);
        final storageDocType = 'other_certificate_$safeLabel';

        final publicUrl = await _uploadFile(
          companyId: companyId,
          scopeType: 'drivers',
          scopeId: driverId,
          docType: storageDocType,
          localPath: path,
        );
        if (publicUrl == null) continue;

        driverDocs.add({
          'company_id': companyId,
          'driver_id': driverId,
          // Stored as 'other_certificate' enum value in the DB.
          // The human-readable label is recoverable from the file_url path.
          'document_type': 'other_certificate',
          'file_url': publicUrl,
          'expiry_date': null,
        });
      }

      if (driverDocs.isNotEmpty) {
        await _supabase.from('driver_documents').insert(driverDocs);
      }

      // ── 4. Upload vehicle photo & insert vehicle row ──────────────────────
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

      // ── 5. Upload & insert vehicle documents ─────────────────────────────
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

      await addVehicleDoc(docType: 'v5_front', localPath: v5DocumentFrontPath);
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

      // Do not leave a logged-in session until email is confirmed.
      if (_supabase.auth.currentSession != null) {
        await _supabase.auth.signOut();
      }

      return AuthResult.success(
        userId: authUser.id,
        name: fullName,
        email: emailNorm,
        message:
            'Registration successful. Check your email to confirm your account before logging in.',
      );
    } on AuthException catch (e) {
      final msg = e.message.toLowerCase();
      if (msg.contains('already') || msg.contains('registered')) {
        return AuthResult.failure(
          'An account with this email already exists. Use a different email or sign in.',
        );
      }
      return AuthResult.failure(e.message);
    } on PostgrestException catch (e) {
      final msg = e.message.toLowerCase();
      if (msg.contains('duplicate') || msg.contains('unique')) {
        return AuthResult.failure(
          'An account with this email already exists. Use a different email or sign in.',
        );
      }
      return AuthResult.failure(e.message);
    } on StorageException catch (e) {
      return AuthResult.failure(e.message);
    } catch (e) {
      return AuthResult.failure('Registration failed: $e');
    }
  }

  /// Self-service passenger assistant registration (delegates to
  /// [PassengerAssistantRegistrationService]).
  Future<AuthResult> passengerAssistantRegister({
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
  }) {
    return PassengerAssistantRegistrationService().registerPassengerAssistant(
      firstName: firstName,
      lastName: lastName,
      email: email,
      password: password,
      companyId: companyId,
      companyName: companyName,
      countryCode: countryCode,
      mobileNumber: mobileNumber,
      residentialAddress: residentialAddress,
      nationality: nationality,
      isBritishPassportHolder: isBritishPassportHolder,
      rightToWorkCode: rightToWorkCode,
      emergencyContactName: emergencyContactName,
      emergencyContactPhone: emergencyContactPhone,
      profilePhotoPath: profilePhotoPath,
      passportNumber: passportNumber,
      passportFilePath: passportFilePath,
      passportExpiry: passportExpiry,
      safeguardingFilePath: safeguardingFilePath,
      safeguardingExpiry: safeguardingExpiry,
      backgroundCheckFilePath: backgroundCheckFilePath,
      firstAidFilePath: firstAidFilePath,
      otherCertificateLabels: otherCertificateLabels,
      otherCertificatePaths: otherCertificatePaths,
    );
  }

  /// Logout — clear token from storage.
  Future<void> driverLogout() async {
    await _supabase.auth.signOut();
  }

  /// Permanently delete the signed-in driver / PA account via push-api.
  Future<AuthResult> deleteAccount() async {
    final session = _supabase.auth.currentSession;
    final accessToken = session?.accessToken;
    if (accessToken == null || accessToken.isEmpty) {
      return AuthResult.failure('You must be signed in to delete your account.');
    }

    final client = HttpClient();
    try {
      final uri = Uri.parse('${SupabaseConfig.pushApiUrl}/auth/delete-account');
      final request =
          await client.postUrl(uri).timeout(const Duration(seconds: 60));
      request.headers.set(HttpHeaders.contentTypeHeader, 'application/json');
      request.headers.set(HttpHeaders.authorizationHeader, 'Bearer $accessToken');
      request.add(utf8.encode('{}'));

      final response =
          await request.close().timeout(const Duration(seconds: 60));
      final body = await response.transform(utf8.decoder).join();

      if (response.statusCode < 200 || response.statusCode >= 300) {
        String message = 'Could not delete account. Please try again.';
        try {
          final decoded = jsonDecode(body);
          if (decoded is Map && decoded['error'] != null) {
            message = decoded['error'].toString();
          }
        } catch (_) {
          /* keep default */
        }
        return AuthResult.failure(message);
      }

      return AuthResult.success(message: 'Account deleted.');
    } on SocketException {
      return AuthResult.failure(
        'Connection problem. Check your internet and try again.',
      );
    } on TimeoutException {
      return AuthResult.failure(
        'Connection problem. Check your internet and try again.',
      );
    } catch (e) {
      return AuthResult.failure('Could not delete account. Please try again.');
    } finally {
      client.close(force: true);
    }
  }

  /// Restore current auth session if one exists.
  ///
  /// Uses auth metadata for the display name so cold start never waits on
  /// Supabase. Call [refreshDisplayNameForSession] in the background when online.
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

      if (user.emailConfirmedAt == null) {
        await _supabase.auth.signOut();
        return AuthResult.failure(
          'Please check your email and confirm your account before logging in.',
        );
      }

      return AuthResult.success(
        token: session.accessToken,
        userId: user.id,
        name: _extractDisplayName(user),
        email: user.email,
        role: role,
      );
    } catch (_) {
      return AuthResult.failure('Could not restore session.');
    }
  }

  /// Fetches the profile display name when online. Safe to call in background.
  Future<String?> refreshDisplayNameForSession() async {
    final user = _supabase.auth.currentUser;
    if (user == null) return null;
    return _resolveDisplayName(user: user, role: _extractRole(user));
  }
}
