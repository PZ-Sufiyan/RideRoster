import 'dart:async';

import 'package:flutter/foundation.dart';
import '../services/auth_service.dart';
import '../services/connectivity_service.dart';
import '../services/fcm_service.dart';
import '../services/realtime_service.dart';
import '../services/session_cleanup.dart';
import '../utils/startup_trace.dart';

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
  /// True only after a successful credential login in this app session.
  /// Session restore uses background Terms & Conditions checks instead.
  bool _requiresBlockingTermsCheck = false;

  AuthProvider() {
    StartupTrace.mark('AuthProvider constructed → restoreSession()');
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
  bool get requiresBlockingTermsCheck => _requiresBlockingTermsCheck;

  // ---------------------------------------------------------------------------
  // Restore session
  // ---------------------------------------------------------------------------
  Future<void> restoreSession() async {
    StartupTrace.mark('AuthProvider.restoreSession START', StartupTrace.where());
    final sw = Stopwatch()..start();
    await _awaitLogoutCleanup();
    _requiresBlockingTermsCheck = false;
    _setStatus(AuthStatus.loading);
    final result = await _authService.restoreSession();
    StartupTrace.mark(
      'AuthProvider.restoreSession authService done',
      'success=${result.success} ${sw.elapsedMilliseconds}ms',
    );
    if (result.success) {
      _token = result.token;
      _userId = result.userId;
      _userName = result.name;
      _userEmail = result.email;
      _userRole = result.role;
      _errorMessage = null;
      _setStatus(AuthStatus.authenticated);
      StartupTrace.mark(
        'AuthProvider → authenticated (dashboard can mount)',
        'role=$_userRole ${sw.elapsedMilliseconds}ms',
      );
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
      StartupTrace.mark(
        'AuthProvider → unauthenticated',
        '${sw.elapsedMilliseconds}ms',
      );
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
      _requiresBlockingTermsCheck = true;
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

    // Navigate to login immediately — cleanup runs in the background.
    _token = null;
    _userId = null;
    _userName = null;
    _userEmail = null;
    _userRole = null;
    _errorMessage = null;
    _requiresBlockingTermsCheck = false;
    _setStatus(AuthStatus.unauthenticated);

    final cleanup = _runLogoutCleanup();
    _logoutCleanup = cleanup;
    unawaited(
      cleanup.whenComplete(() {
        if (identical(_logoutCleanup, cleanup)) {
          _logoutCleanup = null;
        }
      }),
    );
  }

  /// Close the current account on the server, then clear local session.
  ///
  /// Returns `null` on success, or an error message on failure.
  Future<String?> deleteAccount() async {
    await _awaitLogoutCleanup();

    final result = await _authService.deleteAccount();
    if (!result.success) {
      return result.error ?? 'Could not delete account. Please try again.';
    }

    // Account is closed — clear local state (signOut may fail if Auth was banned).
    await logout();
    return null;
  }

  Future<void> _runLogoutCleanup() async {
    try {
      await RealtimeService().unsubscribe();
      await FcmService().unregisterCurrentToken();
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

  /// Called after login-time Terms & Conditions are satisfied (or not required).
  void markTermsCheckCompleted() {
    _requiresBlockingTermsCheck = false;
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
    // Dashboard is already on screen by now — everything below is background.
    await _verifyAccountStillActive();
    await _subscribeRealtime();
    await _registerPushTokenIfNeeded();
    await _refreshDisplayNameWhenOnline();
  }

  /// Server-side "is this account closed?" check.
  ///
  /// Runs *after* the dashboard is visible so a cold start never waits on it.
  /// Fails open: only an explicit `closed` answer signs the user out, so a
  /// flaky network cannot log a valid driver out at startup.
  Future<void> _verifyAccountStillActive() async {
    if (!isDriver && !isPassengerAssistant) return;
    final userId = _userId;
    if (userId == null || userId.isEmpty) return;
    if (!ConnectivityService().canReachServer) {
      StartupTrace.mark('account-active check skipped (offline)');
      return;
    }

    final sw = Stopwatch()..start();
    final state = await _authService.verifyRestoredAccountActive();
    StartupTrace.mark(
      'account-active check done',
      'state=$state ${sw.elapsedMilliseconds}ms',
    );
    if (state != AuthService.accountClosed) return;
    if (_userId != userId) return; // a different session took over meanwhile

    // logout() already flips the whole tree to the login screen; set the
    // message afterwards because logout() clears it.
    await logout();
    _errorMessage = 'This account is closed.';
    notifyListeners();
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
