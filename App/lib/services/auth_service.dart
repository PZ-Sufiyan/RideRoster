import 'api_service.dart';

/// Auth service — currently uses dummy data.
///
/// TO SWAP TO REAL API:
///   Replace every `await Future.delayed(...)` block with an actual HTTP POST.
///   Example (using the `http` package):
///     final response = await http.post(
///       Uri.parse('${ApiService.baseUrl}/auth/driver/login'),
///       body: jsonEncode({'email': email, 'password': password}),
///       headers: {'Content-Type': 'application/json'},
///     );
///     final data = jsonDecode(response.body);
///     if (response.statusCode == 200) return AuthResult.success(data['token']);
///     return AuthResult.failure(data['message']);
class AuthService extends ApiService {
  // ---------------------------------------------------------------------------
  // Driver Auth
  // ---------------------------------------------------------------------------

  /// Login with email/password.
  /// Returns [AuthResult] — check [AuthResult.success] before reading [AuthResult.token].
  Future<AuthResult> driverLogin({
    required String email,
    required String password,
  }) async {
    // --- DUMMY IMPLEMENTATION ---
    await Future.delayed(const Duration(milliseconds: 900));

    if (email.isEmpty || password.isEmpty) {
      return AuthResult.failure('Email and password are required.');
    }
    if (!email.contains('@')) {
      return AuthResult.failure('Please enter a valid email address.');
    }
    if (password.length < 6) {
      return AuthResult.failure('Password must be at least 6 characters.');
    }

    // Simulate a successful login with a dummy token
    return AuthResult.success(
      token: 'dummy_driver_token_${DateTime.now().millisecondsSinceEpoch}',
      userId: 'driver_001',
      name: 'John Driver',
      email: email,
    );
    // --- END DUMMY ---
  }

  /// Send password-reset email.
  Future<AuthResult> driverForgotPassword({required String email}) async {
    // --- DUMMY IMPLEMENTATION ---
    await Future.delayed(const Duration(milliseconds: 700));
    if (!email.contains('@')) {
      return AuthResult.failure('Please enter a valid email address.');
    }
    return AuthResult.success(message: 'Password reset link sent to $email');
    // --- END DUMMY ---
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
    // --- DUMMY IMPLEMENTATION ---
    await Future.delayed(const Duration(milliseconds: 1000));

    if (fullName.isEmpty || email.isEmpty || password.isEmpty) {
      return AuthResult.failure('Please complete all required fields.');
    }
    if (!email.contains('@')) {
      return AuthResult.failure('Please enter a valid email address.');
    }

    return AuthResult.success(
      token: 'dummy_driver_token_${DateTime.now().millisecondsSinceEpoch}',
      userId: 'driver_new_${DateTime.now().millisecondsSinceEpoch}',
      name: fullName,
      email: email,
      message: 'Registration successful. Pending admin approval.',
    );
    // --- END DUMMY ---
  }

  /// Logout — clear token from storage.
  Future<void> driverLogout() async {
    // --- DUMMY IMPLEMENTATION ---
    await Future.delayed(const Duration(milliseconds: 300));
    // Real: clear token from shared_preferences / secure storage
    // --- END DUMMY ---
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
