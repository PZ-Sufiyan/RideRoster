import 'api_service.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class AuthService extends ApiService {
  SupabaseClient get _supabase => Supabase.instance.client;

  static const Set<String> _allowedRoles = {
    'driver',
    'passenger_assistant',
  };

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
    required String email,
    required String password,
    required String companyName,
    required String countryCode,
    required String mobileNumber,
    required String registrationNumber,
    required String taxiPlateNumber,
    required String make,
    required String model,
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
  }) async {
    if (fullName.isEmpty || email.isEmpty || password.isEmpty) {
      return AuthResult.failure('Please complete all required fields.');
    }
    if (!email.contains('@')) {
      return AuthResult.failure('Please enter a valid email address.');
    }

    try {
      final response = await _supabase.auth.signUp(
        email: email,
        password: password,
        data: {'role': 'driver', 'full_name': fullName},
      );

      return AuthResult.success(
        token: response.session?.accessToken,
        userId: response.user?.id,
        name: fullName,
        email: email,
        message: 'Registration successful. Check your email to confirm account.',
      );
    } on AuthException catch (e) {
      return AuthResult.failure(e.message);
    } catch (_) {
      return AuthResult.failure(
        'Registration failed due to an unexpected error.',
      );
    }
  }

  /// Logout — clear token from storage.
  Future<void> driverLogout() async {
    await _supabase.auth.signOut();
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
