/// Result of auth / registration operations used by [AuthService] and
/// related services.
class AuthResult {
  final bool success;
  final String? token;
  final String? userId;
  final String? name;
  final String? email;
  final String? role;
  final String? message;
  final String? error;

  AuthResult._({
    required this.success,
    this.token,
    this.userId,
    this.name,
    this.email,
    this.role,
    this.message,
    this.error,
  });

  factory AuthResult.success({
    String? token,
    String? userId,
    String? name,
    String? email,
    String? role,
    String? message,
  }) {
    return AuthResult._(
      success: true,
      token: token,
      userId: userId,
      name: name,
      email: email,
      role: role,
      message: message,
    );
  }

  factory AuthResult.failure(String error) {
    return AuthResult._(success: false, error: error);
  }
}
