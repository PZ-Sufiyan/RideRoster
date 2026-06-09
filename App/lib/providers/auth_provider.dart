import 'package:flutter/foundation.dart';
import '../services/auth_service.dart';
import '../services/fcm_service.dart';
import '../services/realtime_service.dart';

enum AuthStatus { idle, loading, authenticated, unauthenticated, error }

/// Supported user roles returned from Supabase auth metadata.
class UserRoles {
  static const String driver = 'driver';
  static const String passengerAssistant = 'passenger_assistant';
}

class AuthProvider extends ChangeNotifier {
  final AuthService _authService = AuthService();

  AuthStatus _status = AuthStatus.idle;
  String? _token;
  String? _userId;
  String? _userName;
  String? _userEmail;
  String? _userRole;
  String? _errorMessage;

  AuthProvider() {
    restoreSession();
  }

  // ---------------------------------------------------------------------------
  // Getters
  // ---------------------------------------------------------------------------
  AuthStatus get status => _status;
  String? get token => _token;
  String? get userId => _userId;
  String? get userName => _userName;
  String? get userEmail => _userEmail;
  String? get userRole => _userRole;
  bool get isDriver => _userRole == UserRoles.driver;
  bool get isPassengerAssistant => _userRole == UserRoles.passengerAssistant;
  String? get errorMessage => _errorMessage;
  bool get isLoading => _status == AuthStatus.loading;
  bool get isAuthenticated => _status == AuthStatus.authenticated;

  // ---------------------------------------------------------------------------
  // Restore session
  // ---------------------------------------------------------------------------
  Future<void> restoreSession() async {
    _setStatus(AuthStatus.loading);
    final result = await _authService.restoreSession();
    if (result.success) {
      _token = result.token;
      _userId = result.userId;
      _userName = result.name;
      _userEmail = result.email;
      _userRole = result.role;
      _errorMessage = null;
      _setStatus(AuthStatus.authenticated);
      // Subscribe AFTER status is set and userId is populated.
      // RealtimeService.subscribe() will also wait for the Supabase session
      // internally, but calling it here after result.success ensures the
      // auth token is valid before we open channels.
      await _subscribeRealtime();
      await _registerPushTokenIfDriver();
    } else {
      _token = null;
      _userId = null;
      _userName = null;
      _userEmail = null;
      _userRole = null;
      _errorMessage = null;
      _setStatus(AuthStatus.unauthenticated);
    }
  }

  // ---------------------------------------------------------------------------
  // Driver login
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
      _userRole = result.role;
      _errorMessage = null;
      _setStatus(AuthStatus.authenticated);
      // Subscribe after successful login — userId is now set
      await _subscribeRealtime();
      await _registerPushTokenIfDriver();
      return true;
    } else {
      _errorMessage = result.error;
      _setStatus(AuthStatus.error);
      return false;
    }
  }

  // ---------------------------------------------------------------------------
  // Forgot password
  // ---------------------------------------------------------------------------
  Future<String?> driverForgotPassword({required String email}) async {
    _setStatus(AuthStatus.loading);
    final result = await _authService.driverForgotPassword(email: email);
    _setStatus(AuthStatus.unauthenticated);
    if (result.success) return null;
    return result.error;
  }

  // ---------------------------------------------------------------------------
  // Logout
  // ---------------------------------------------------------------------------
  Future<void> logout() async {
    // Tear down realtime channels before clearing auth state
    await RealtimeService().unsubscribe();
    if (isDriver) {
      await FcmService().unregisterCurrentToken();
    }
    await _authService.driverLogout();
    _token = null;
    _userId = null;
    _userName = null;
    _userEmail = null;
    _userRole = null;
    _errorMessage = null;
    _setStatus(AuthStatus.unauthenticated);
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------
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

  Future<void> _subscribeRealtime() async {
    final audience = isPassengerAssistant
        ? RealtimeAudience.passengerAssistant
        : RealtimeAudience.driver;
    await RealtimeService().subscribe(audience: audience);
  }

  Future<void> _registerPushTokenIfDriver() async {
    if (!isDriver) return;
    final id = _userId;
    if (id == null || id.isEmpty) return;
    try {
      await FcmService().registerForUser(id);
    } catch (error) {
      debugPrint('FCM token registration failed: $error');
    }
  }
}
