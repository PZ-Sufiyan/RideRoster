import 'package:flutter/material.dart';
import '../users/driver/pages/auth/login.dart';
import '../users/driver/pages/auth/register.dart';
import '../users/driver/pages/dashboard/dashboard.dart';

class AppRoutes {
  // Route name constants
  static const String driverLogin = '/driver/login';
  static const String driverRegister = '/driver/register';
  static const String driverDashboard = '/driver/dashboard';

  static Route<dynamic> generateRoute(RouteSettings settings) {
    switch (settings.name) {
      case driverLogin:
        return MaterialPageRoute(builder: (_) => const DriverLoginPage());

      case driverRegister:
        return MaterialPageRoute(builder: (_) => const DriverRegisterPage());

      case driverDashboard:
        return MaterialPageRoute(builder: (_) => const DriverDashboardPage());

      default:
        return MaterialPageRoute(
          builder: (_) => const DriverLoginPage(),
        );
    }
  }
}
