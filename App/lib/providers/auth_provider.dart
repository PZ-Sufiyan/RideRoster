import 'package:flutter/foundation.dart';
import '../services/auth_service.dart';

enum AuthStatus { idle, loading, authenticated, unauthenticated, error }

class AuthProvider extends ChangeNotifier {
  final AuthService _authService = AuthService();

  AuthStatus _status = AuthStatus.unauthenticated;
  String? _token;
  String? _userId;
  String? _userName;
  String? _userEmail;
  String? _errorMessage;

  // ---------------------------------------------------------------------------
  // Getters
  // ---------------------------------------------------------------------------
  AuthStatus get status => _status;
  String? get token => _token;
  String? get userId => _userId;
  String? get userName => _userName;
  String? get userEmail => _userEmail;
  String? get errorMessage => _errorMessage;
  bool get isLoading => _status == AuthStatus.loading;
  bool get isAuthenticated => _status == AuthStatus.authenticated;

  // ---------------------------------------------------------------------------
  // Driver Login
  // ---------------------------------------------------------------------------
  Future<bool> driverLogin({
    required String email,
    required String password,
  }) async {
    _setStatus(AuthStatus.loading);

    final result = await _authService.driverLogin(
      email: email,
      password: password,
    );

    if (result.success) {
      _token = result.token;
      _userId = result.userId;
      _userName = result.name;
      _userEmail = result.email;
      _errorMessage = null;
      _setStatus(AuthStatus.authenticated);
      return true;
    } else {
      _errorMessage = result.error;
      _setStatus(AuthStatus.error);
      return false;
    }
  }

  // ---------------------------------------------------------------------------
  // Forgot Password
  // ---------------------------------------------------------------------------
  Future<String?> driverForgotPassword({required String email}) async {
    _setStatus(AuthStatus.loading);
    final result = await _authService.driverForgotPassword(email: email);
    _setStatus(AuthStatus.unauthenticated);
    if (result.success) return null; // null = no error
    return result.error;
  }

  // ---------------------------------------------------------------------------
  // Logout
  // ---------------------------------------------------------------------------
  Future<void> logout() async {
    await _authService.driverLogout();
    _token = null;
    _userId = null;
    _userName = null;
    _userEmail = null;
    _errorMessage = null;
    _setStatus(AuthStatus.unauthenticated);
  }

  void clearError() {
    _errorMessage = null;
    if (_status == AuthStatus.error) {
      _setStatus(AuthStatus.unauthenticated);
    }
  }

  void _setStatus(AuthStatus s) {
    _status = s;
    notifyListeners();
  }
}
