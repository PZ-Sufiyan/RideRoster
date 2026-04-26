import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'config/supabase_config.dart';
import 'providers/auth_provider.dart';
import 'providers/job_provider.dart';
import 'routes/app_routes.dart';
import 'services/location_service.dart';
import 'services/notification_service.dart';
import 'users/driver/pages/auth/login.dart';
import 'users/driver/pages/dashboard/dashboard.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  const supabaseUrl = String.fromEnvironment(
    'SUPABASE_URL',
    defaultValue: SupabaseConfig.url,
  );
  const supabaseAnonKey = String.fromEnvironment(
    'SUPABASE_ANON_KEY',
    defaultValue: SupabaseConfig.anonKey,
  );
  final normalizedUrl = supabaseUrl.trim();
  final normalizedAnonKey = supabaseAnonKey.trim();

  if (normalizedUrl.isEmpty || normalizedAnonKey.isEmpty) {
    runApp(
      const MissingConfigApp(
        message:
            'Missing Supabase config.\nSet values in lib/config/supabase_config.dart.',
      ),
    );
    return;
  }
  await Supabase.initialize(url: normalizedUrl, anonKey: normalizedAnonKey);
  await LocationService().ensurePermission();
  await NotificationService().init();
  runApp(const RideRosterApp());
}

class RideRosterApp extends StatelessWidget {
  const RideRosterApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => JobProvider()),
      ],
      child: MaterialApp(
        title: 'RideRoster',
        debugShowCheckedModeBanner: false,
        theme: ThemeData(
          fontFamily: 'Roboto',
          colorScheme: ColorScheme.fromSeed(
            seedColor: const Color(0xFF4A90D9),
            brightness: Brightness.light,
          ),
          scaffoldBackgroundColor: Colors.white,
        ),
        home: const _AuthEntryPage(),
        onGenerateRoute: AppRoutes.generateRoute,
      ),
    );
  }
}

class _AuthEntryPage extends StatelessWidget {
  const _AuthEntryPage();

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
          return const DriverDashboardPage();
        }
        return const DriverLoginPage();
      },
    );
  }
}

class MissingConfigApp extends StatelessWidget {
  final String message;

  const MissingConfigApp({super.key, required this.message});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      home: Scaffold(
        body: SafeArea(
          child: Center(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(
                    Icons.error_outline,
                    color: Colors.redAccent,
                    size: 48,
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    'Configuration Required',
                    style: TextStyle(fontSize: 20, fontWeight: FontWeight.w600),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 12),
                  Text(
                    message,
                    textAlign: TextAlign.center,
                    style: const TextStyle(fontSize: 14, color: Colors.black87),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
