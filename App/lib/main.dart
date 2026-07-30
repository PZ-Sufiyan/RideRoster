import 'dart:async';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:geolocator/geolocator.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'config/supabase_config.dart';
import 'database/app_database.dart';
import 'providers/auth_provider.dart';
import 'providers/leave_provider.dart';
import 'providers/driver_profile_provider.dart';
import 'providers/job_provider.dart';
import 'providers/pa_job_provider.dart';
import 'providers/pa_profile_provider.dart';
import 'repositories/cache_repository.dart';
import 'repositories/local_job_repository.dart';
import 'routes/app_routes.dart';
import 'services/connectivity_service.dart';
import 'providers/connectivity_provider.dart';
import 'services/location_service.dart';
import 'services/fcm_service.dart';
import 'services/navigation_service.dart';
import 'services/notification_service.dart';
import 'services/sos_location_service.dart';
import 'services/sync_engine.dart';
import 'services/sync_scheduler.dart';
import 'services/session_cleanup.dart';
import 'users/auth/pages/login.dart';
import 'users/driver/pages/dashboard/dashboard.dart';
import 'users/PA/pages/dashboard/dashboard.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
  ]);

  // ── Supabase ──────────────────────────────────────────────────────────────
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

  // ── Offline infrastructure ────────────────────────────────────────────────
  // Order matters: DB → repo → connectivity → sync engine → cache warm-up.

  final db = AppDatabase();
  final localRepo = LocalJobRepository(db);
  final cacheRepo = CacheRepository(db);

  // Init connectivity — pass the same Supabase URL/key the client uses for probes.
  await ConnectivityService().init(
    probeBaseUrl: normalizedUrl,
    probeAnonKey: normalizedAnonKey,
  );

  SyncEngine.init(localRepo);
  SyncScheduler.register(() => SyncEngine.instance.processQueue());
  SessionCleanup.init(localRepo);

  // Cache refresh runs after the UI is up — JobProvider loads local data first,
  // then refreshes when [ConnectivityService.canReachServer] is true.
  ConnectivityService().onReconnect.listen((_) async {
    try {
      await cacheRepo.forceRefresh();
    } catch (_) {}
    await SyncEngine.instance.processQueue();
  });

  runApp(RideRosterApp(localRepo: localRepo, cacheRepo: cacheRepo));

  FcmService().setOnMessageOpenedHandler(
    (message) => NavigationService.handlePushOpened(message.data),
  );

  // Defer native notification / Firebase work until after the first frame.
  WidgetsBinding.instance.addPostFrameCallback((_) {
    unawaited(_initDeviceServices());
  });
}

Future<void> _initDeviceServices() async {
  try {
    await NotificationService().init(requestIosPermissions: false);

    // On iOS, Firebase initializes after login to avoid cold-start crashes.
    if (!Platform.isIOS) {
      await FcmService().init(
        onMessageOpened: (message) =>
            NavigationService.handlePushOpened(message.data),
      );
    }
  } catch (error, stack) {
    debugPrint('Device services init failed: $error');
    debugPrint('$stack');
  }
}

class RideRosterApp extends StatelessWidget {
  final LocalJobRepository localRepo;
  final CacheRepository cacheRepo;
  const RideRosterApp({
    super.key,
    required this.localRepo,
    required this.cacheRepo,
  });

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        // ConnectivityProvider must be first — JobProvider may read it.
        ChangeNotifierProvider(create: (_) => ConnectivityProvider()),
        Provider<LocalJobRepository>.value(value: localRepo),
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(
          create: (_) =>
              JobProvider(localRepo: localRepo, cacheRepo: cacheRepo),
        ),
        ChangeNotifierProvider(
          create: (_) => PaJobProvider(localRepo: localRepo),
        ),
        ChangeNotifierProvider(
          create: (_) => PaAssignedJobsProvider(localRepo: localRepo),
        ),
        ChangeNotifierProvider(create: (_) => DriverProfileProvider()),
        ChangeNotifierProvider(create: (_) => PaProfileProvider()),
        ChangeNotifierProvider(create: (_) => DriverLeaveProvider()),
        ChangeNotifierProvider(create: (_) => PaLeaveProvider()),
      ],
      child: _SessionBindings(
        child: MaterialApp(
          navigatorKey: NavigationService.navigatorKey,
          title: 'RideRoster',
          debugShowCheckedModeBanner: false,
          theme: ThemeData(
            colorScheme: ColorScheme.fromSeed(
              seedColor: const Color(0xFF4A90D9),
              brightness: Brightness.light,
            ),
            scaffoldBackgroundColor: Colors.white,
            // Avoid blocking first paint on iOS while Google Fonts downloads.
            textTheme: Platform.isIOS
                ? Typography.material2021(platform: TargetPlatform.iOS).black
                : GoogleFonts.manropeTextTheme(),
            primaryTextTheme: Platform.isIOS
                ? Typography.material2021(platform: TargetPlatform.iOS).black
                : GoogleFonts.manropeTextTheme(),
          ),
          home: const _AppRuntimeGuard(),
          onGenerateRoute: (settings) =>
              AppRoutes.generateRoute(settings, localRepo: localRepo),
        ),
      ),
    );
  }
}

/// Registers in-memory resets that run when [AuthProvider.logout] clears data.
class _SessionBindings extends StatefulWidget {
  final Widget child;
  const _SessionBindings({required this.child});

  @override
  State<_SessionBindings> createState() => _SessionBindingsState();
}

class _SessionBindingsState extends State<_SessionBindings> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      SessionCleanup.registerMemoryReset(() {
        context.read<JobProvider>().reset();
        context.read<PaJobProvider>().reset();
        context.read<PaAssignedJobsProvider>().reset();
        clearDriverDashboardSessionCaches();
      });
    });
  }

  @override
  Widget build(BuildContext context) => widget.child;
}

// ─── Everything below is unchanged from your original main.dart ───────────────

class _AppRuntimeGuard extends StatefulWidget {
  const _AppRuntimeGuard();

  @override
  State<_AppRuntimeGuard> createState() => _AppRuntimeGuardState();
}

class _AppRuntimeGuardState extends State<_AppRuntimeGuard>
    with WidgetsBindingObserver {
  final LocationService _locationService = LocationService();
  final SosLocationService _sosLocationService = SosLocationService();
  bool _locationReady = false;

  /// False until the first permission probe finishes — avoids flashing the
  /// "required" screen while we still don't know the real permission state.
  bool _locationCheckComplete = false;
  bool _isCheckingLocation = false;
  String? _lastAuthUserId;
  bool _locationCheckInFlight = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      final auth = context.read<AuthProvider>();
      auth.addListener(_onAuthChanged);
      _onAuthChanged();
    });
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    try {
      context.read<AuthProvider>().removeListener(_onAuthChanged);
    } catch (_) {}
    super.dispose();
  }

  void _onAuthChanged() {
    if (!mounted) return;
    final auth = context.read<AuthProvider>();
    if (auth.isAuthenticated && auth.isDriver) {
      unawaited(_enforceLocationRequirement());
      return;
    }

    if (!auth.isAuthenticated) {
      setState(() {
        _locationReady = false;
        _locationCheckComplete = false;
        _isCheckingLocation = false;
      });
    }
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      final auth = context.read<AuthProvider>();
      if (auth.isAuthenticated && auth.isDriver) {
        unawaited(_enforceLocationRequirement(showLoader: false));
      }
      _resumeSosTrackingIfAuthenticated();
      // Re-probe on foreground so banner updates quickly after app switch.
      ConnectivityService().triggerProbe();
      return;
    }

    if (state == AppLifecycleState.inactive ||
        state == AppLifecycleState.paused ||
        state == AppLifecycleState.detached) {
      if (!mounted) return;
      final auth = context.read<AuthProvider>();
      if (auth.isAuthenticated && auth.isDriver) {
        _sosLocationService.setDriverOffline();
      }
    }
  }

  Future<void> _enforceLocationRequirement({bool showLoader = true}) async {
    if (!mounted) return;
    final auth = context.read<AuthProvider>();
    if (!auth.isAuthenticated || !auth.isDriver) return;
    if (_locationCheckInFlight) return;

    _locationCheckInFlight = true;
    // Keep the loading screen for the whole permission flow (disclosure +
    // system dialog). Never show LocationRequiredPage underneath those UI.
    if (mounted &&
        (showLoader || !_locationReady || !_locationCheckComplete)) {
      setState(() => _isCheckingLocation = true);
    }
    try {
      var hasPermission = await _locationService
          .ensurePermission(requestIfDenied: false)
          .timeout(const Duration(seconds: 2), onTimeout: () => false);

      if (!hasPermission && mounted) {
        // No timeout here — user may take time on disclosure / system prompt.
        hasPermission = await _locationService.ensurePermission(
          context: context,
        );
      }

      if (!hasPermission && mounted) {
        // Brief re-check after the system dialog closes (some devices lag).
        await Future<void>.delayed(const Duration(milliseconds: 250));
        hasPermission = await _locationService
            .ensurePermission(requestIfDenied: false)
            .timeout(const Duration(seconds: 2), onTimeout: () => false);
      }

      if (!mounted) return;
      setState(() {
        _locationReady = hasPermission;
        _locationCheckComplete = true;
        _isCheckingLocation = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _locationReady = false;
        _locationCheckComplete = true;
        _isCheckingLocation = false;
      });
    } finally {
      _locationCheckInFlight = false;
    }
  }

  Future<void> _startSosTrackingIfAuthenticated() async {
    final auth = context.read<AuthProvider>();
    if (!auth.isAuthenticated) return;
    if (!auth.isDriver) return;
    final currentUserId = auth.userId;
    if (currentUserId == null || currentUserId.isEmpty) return;
    if (_lastAuthUserId == currentUserId) return;
    _lastAuthUserId = currentUserId;
    await _sosLocationService.refresh();
  }

  Future<void> _resumeSosTrackingIfAuthenticated() async {
    final auth = context.read<AuthProvider>();
    if (!auth.isAuthenticated) return;
    if (!auth.isDriver) return;
    await _sosLocationService.refresh();
  }

  Future<void> _stopSosTracking() async {
    if (_lastAuthUserId == null) return;
    _lastAuthUserId = null;
    await _sosLocationService.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<AuthProvider>(
      builder: (_, auth, __) {
        if (auth.isAuthenticated) {
          unawaited(_startSosTrackingIfAuthenticated());
        } else {
          unawaited(_stopSosTracking());
        }

        if (auth.isAuthenticated && auth.isDriver) {
          // Loading while checking / disclosure / system permission dialog.
          if (!_locationCheckComplete || _isCheckingLocation) {
            return const Scaffold(
              body: Center(child: CircularProgressIndicator()),
            );
          }

          // Only after the user has finished the permission flow and denied.
          if (!_locationReady) {
            return LocationRequiredPage(onRetry: _enforceLocationRequirement);
          }
        }

        return const _AuthEntryPage();
      },
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
          if (auth.isPassengerAssistant) return const PaDashboardPage();
          return const DriverDashboardPage();
        }
        return const LoginPage();
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

class LocationRequiredPage extends StatelessWidget {
  final Future<void> Function() onRetry;
  const LocationRequiredPage({super.key, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(
                  Icons.location_off_outlined,
                  color: Colors.redAccent,
                  size: 52,
                ),
                const SizedBox(height: 16),
                const Text(
                  'Location Access Required',
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.w600),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 12),
                const Text(
                  'Location access is required for active job tracking and '
                  'SOS safety features. Tap Retry to review the location '
                  'disclosure and grant permission.',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 14, color: Colors.black87),
                ),
                const SizedBox(height: 20),
                Wrap(
                  spacing: 10,
                  runSpacing: 10,
                  alignment: WrapAlignment.center,
                  children: [
                    ElevatedButton(
                      onPressed: Geolocator.openLocationSettings,
                      child: const Text('Open Location Settings'),
                    ),
                    ElevatedButton(
                      onPressed: Geolocator.openAppSettings,
                      child: const Text('Open App Settings'),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                OutlinedButton(onPressed: onRetry, child: const Text('Retry')),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
