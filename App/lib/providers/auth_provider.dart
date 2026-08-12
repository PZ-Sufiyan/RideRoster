import 'dart:async';

import 'package:flutter/foundation.dart';
import '../services/auth_service.dart';
import '../services/fcm_service.dart';
import '../services/realtime_service.dart';
import '../services/session_cleanup.dart';

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
  Future<void>? _logoutCleanup;

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
    await _awaitLogoutCleanup();
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
      // Realtime + FCM + profile name refresh must not block cold start offline.
      unawaited(_completeAuthenticatedSetup());
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
    await _awaitLogoutCleanup();
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
      unawaited(_completeAuthenticatedSetup());
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
    _errorMessage = null;
    _setStatus(AuthStatus.loading);
    final result = await _authService.driverForgotPassword(email: email);
    _setStatus(AuthStatus.unauthenticated);
    if (result.success) return null;
    _errorMessage = result.error;
    notifyListeners();
    return result.error;
  }

  Future<String?> resetPasswordWithCode({
    required String email,
    required String code,
    required String password,
    required String confirmPassword,
  }) async {
    _errorMessage = null;
    _setStatus(AuthStatus.loading);
    final result = await _authService.resetPasswordWithCode(
      email: email,
      code: code,
      password: password,
      confirmPassword: confirmPassword,
    );
    _setStatus(AuthStatus.unauthenticated);
    if (result.success) return null;
    _errorMessage = result.error;
    notifyListeners();
    return result.error;
  }

  // ---------------------------------------------------------------------------
  // Logout
  // ---------------------------------------------------------------------------
  Future<void> logout() async {
    await _awaitLogoutCleanup();

    final wasDriver = isDriver;

    // Navigate to login immediately — cleanup runs in the background.
    _token = null;
    _userId = null;
    _userName = null;
    _userEmail = null;
    _userRole = null;
    _errorMessage = null;
    _setStatus(AuthStatus.unauthenticated);

    final cleanup = _runLogoutCleanup(wasDriver);
    _logoutCleanup = cleanup;
    unawaited(
      cleanup.whenComplete(() {
        if (identical(_logoutCleanup, cleanup)) {
          _logoutCleanup = null;
        }
      }),
    );
  }

  /// Permanently delete the current account, then clear local session.
  ///
  /// Returns `null` on success, or an error message on failure.
  Future<String?> deleteAccount() async {
    await _awaitLogoutCleanup();

    final result = await _authService.deleteAccount();
    if (!result.success) {
      return result.error ?? 'Could not delete account. Please try again.';
    }

    // Auth user is gone — clear local state (signOut may fail; cleanup tolerates it).
    await logout();
    return null;
  }

  Future<void> _runLogoutCleanup(bool wasDriver) async {
    try {
      await RealtimeService().unsubscribe();
      if (wasDriver) {
        await FcmService().unregisterCurrentToken();
      }
      await SessionCleanup.clearOnLogout();
      await _authService.driverLogout();
    } catch (error, stack) {
      debugPrint('Logout cleanup failed: $error\n$stack');
    }
  }

  Future<void> _awaitLogoutCleanup() async {
    final task = _logoutCleanup;
    if (task != null) await task;
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

  Future<void> _completeAuthenticatedSetup() async {
    await _subscribeRealtime();
    await _registerPushTokenIfNeeded();
    await _refreshDisplayNameWhenOnline();
  }

  Future<void> _refreshDisplayNameWhenOnline() async {
    try {
      final name = await _authService.refreshDisplayNameForSession();
      if (name == null || name.isEmpty || name == _userName) return;
      _userName = name;
      notifyListeners();
    } catch (_) {}
  }

  Future<void> _registerPushTokenIfNeeded() async {
    if (!isDriver && !isPassengerAssistant) return;
    final id = _userId;
    if (id == null || id.isEmpty) return;
    try {
      await FcmService().registerForUser(id);
    } catch (error) {
      debugPrint('FCM token registration failed: $error');
    }
  }
}
