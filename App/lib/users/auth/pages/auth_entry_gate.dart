import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../providers/auth_provider.dart';
import 'login.dart';
import 'staff_terms_gate.dart';

/// Single source of truth for what an authenticated/unauthenticated user sees.
///
/// Why this is a reusable widget and not just the `home:` route:
///
/// Logout handlers across the app call
/// `Navigator.pushNamedAndRemoveUntil(context, AppRoutes.login, (route) => false)`.
/// The `(route) => false` predicate removes *every* route, including the root
/// route that hosts the auth-reactive widget. FCM deep links do the same for
/// `AppRoutes.driverDashboard` / `AppRoutes.paDashboard`.
///
/// Once the root route is gone, whatever is pushed on top becomes the only
/// thing on screen for the rest of the session. If that pushed route rendered
/// a bare [LoginPage], nothing would be listening to [AuthProvider] any more,
/// so a successful sign-in would rebuild nothing and the user would stay
/// stuck on the login form (the "second login does nothing" bug).
///
/// Routing every auth-transition entry point through this widget makes the
/// decision reactive in *any* navigator configuration: `/login`,
/// `/driver/dashboard`, `/pa/dashboard` and the app root all re-evaluate
/// against [AuthProvider] on every change.
class AuthEntryGate extends StatelessWidget {
  const AuthEntryGate({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<AuthProvider>(
      builder: (_, auth, __) {
        if (auth.status == AuthStatus.loading ||
            auth.status == AuthStatus.idle) {
          return const Scaffold(
            body: Center(child: CircularProgressIndicator()),
          );
        }
        if (auth.isAuthenticated) {
          return StaffTermsGate(
            blockingCheck: auth.requiresBlockingTermsCheck,
          );
        }
        return const LoginPage();
      },
    );
  }
}
