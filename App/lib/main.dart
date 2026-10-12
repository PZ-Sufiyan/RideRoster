import 'dart:async';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:geolocator/geolocator.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:phone_form_field/phone_form_field.dart';
import 'package:provider/provider.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'config/supabase_config.dart';
import 'database/app_database.dart';
import 'providers/auth_provider.dart';
import 'providers/leave_provider.dart';
import 'providers/driver_profile_provider.dart';
import 'providers/job_provider.dart';
import 'providers/driver_assigned_jobs_provider.dart';
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
import 'users/auth/pages/auth_entry_gate.dart';
import 'users/driver/pages/dashboard/dashboard.dart' show clearDriverDashboardSessionCaches;
import 'utils/startup_trace.dart';

// Cold-start diagnostics: every line below is logged with the `RRTRACE` tag
// (debug builds only, or force it with --dart-define=RR_TRACE=true). To read the
// timeline of a real startup:
//
//     adb logcat -c && adb logcat | Select-String RRTRACE
//
// A healthy run for an already-remembered driver shows exactly one
// `DriverDashboardPage.initState`, no `_AppRuntimeGuard → SPINNER`, and no
// `dispose (UNMOUNTED)` for the dashboard.
Future<void> main() async {
  StartupTrace.mark('main() enter');
  WidgetsFlutterBinding.ensureInitialized();
  StartupTrace.mark('binding ready');

  // NOTE: portrait lock is already enforced natively by
  // android:screenOrientation="portrait" in AndroidManifest.xml. Re-applying it
  // here used to add a platform-channel round trip *before the first frame*,
  // which kept the native splash on screen for no benefit. It is applied on
  // first frame instead (see [_applyOrientationLock]).

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

  // Restores the persisted session from shared_preferences synchronously enough
  // that `supabase.auth.currentSession` is populated before runApp(). It does
  // NOT await a network refresh (recoverSession() is fire-and-forget inside the
  // package), so this is the one startup step that genuinely gates the UI:
  // without it the app cannot know whether to show login or the dashboard.
  await Supabase.initialize(url: normalizedUrl, anonKey: normalizedAnonKey);
  StartupTrace.mark('Supabase.initialize done (session restored from disk)');

  // ── Offline infrastructure ────────────────────────────────────────────────
  // Order matters: DB → repo → connectivity → sync engine → cache warm-up.

  final db = AppDatabase();
  final localRepo = LocalJobRepository(db);
  final cacheRepo = CacheRepository(db);
  StartupTrace.mark('repos created');

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
  StartupTrace.mark('runApp() returned');

  // Connectivity is deliberately started AFTER runApp and NOT awaited: it is a
  // platform-channel round trip that has nothing to do with which screen to
  // show. Until it completes, ConnectivityService reports optimistically
  // online, so no startup work is skipped and the offline banner never flashes.
  unawaited(
    ConnectivityService().init(
      probeBaseUrl: normalizedUrl,
      probeAnonKey: normalizedAnonKey,
    ),
  );

  FcmService().setOnMessageOpenedHandler(
    (message) => NavigationService.handlePushOpened(message.data),
  );

  // Defer native notification / Firebase work until after the first frame.
  WidgetsBinding.instance.addPostFrameCallback((_) {
    StartupTrace.mark('FIRST FRAME rendered');
    unawaited(_applyOrientationLock());
    unawaited(_initDeviceServices());
  });
}

Future<void> _applyOrientationLock() async {
  try {
    await SystemChrome.setPreferredOrientations([
      DeviceOrientation.portraitUp,
    ]);
  } catch (error) {
    debugPrint('Orientation lock failed: $error');
  }
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
        ChangeNotifierProvider(
          create: (_) => DriverAssignedJobsProvider(localRepo: localRepo),
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
          localizationsDelegates: const [
            ...PhoneFieldLocalization.delegates,
            GlobalMaterialLocalizations.delegate,
            GlobalWidgetsLocalizations.delegate,
            GlobalCupertinoLocalizations.delegate,
          ],
          supportedLocales: const [
            Locale('en'),
          ],
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
        context.read<DriverAssignedJobsProvider>().reset();
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

  /// True once the server-side/OS permission probe has produced an answer.
  ///
  /// False means "not known yet", which must NOT block the dashboard: an
  /// already-granted driver should never see a spinner while we ask Android a
  /// question whose answer they already gave us.
  bool _locationVerified = false;

  /// True only once we have positively established that permission is denied.
  bool _locationDenied = false;

  /// True while the disclosure dialog / system prompt owns the screen.
  bool _isCheckingLocation = false;
  String? _lastAuthUserId;
  bool _locationCheckInFlight = false;
  bool _probeInFlight = false;

  @override
  void initState() {
    super.initState();
    StartupTrace.mark('_AppRuntimeGuard.initState');
    WidgetsBinding.instance.addObserver(this);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      final auth = context.read<AuthProvider>();
      auth.addListener(_onAuthChanged);
      StartupTrace.mark('_AppRuntimeGuard auth listener attached');
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
    StartupTrace.mark(
      '_AppRuntimeGuard._onAuthChanged',
      'status=${auth.status} role=${auth.userRole}',
    );

    if (auth.isAuthenticated) {
      // Side effects belong here (an event), never in build().
      unawaited(_startSosTrackingIfAuthenticated());
    } else {
      unawaited(_stopSosTracking());
    }

    if (auth.isAuthenticated && auth.isDriver) {
      unawaited(_enforceLocationRequirement());
      return;
    }

    if (!auth.isAuthenticated) {
      setState(() {
        _locationVerified = false;
        _locationDenied = false;
        _isCheckingLocation = false;
      });
    }
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    StartupTrace.mark('lifecycle $state');
    if (state == AppLifecycleState.resumed) {
      final auth = context.read<AuthProvider>();
      if (auth.isAuthenticated && auth.isDriver) {
        // Cheap probe only — returning to the app must not re-run the whole
        // permission flow over a dashboard the driver is already using.
        unawaited(_probeLocationPermission());
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

  /// Reads the OS permission without prompting.
  ///
  /// Used on resume: it can only ever *reveal* a problem, never interrupt the
  /// driver with a dialog while they are mid-run.
  Future<void> _probeLocationPermission() async {
    if (!mounted) return;
    if (_probeInFlight) return;
    _probeInFlight = true;
    try {
      if (_locationCheckInFlight) return;
      final granted = await _locationService
          .ensurePermission(requestIfDenied: false)
          .timeout(const Duration(seconds: 2), onTimeout: () => false);
      if (!mounted) return;
      if (granted) {
        if (_locationVerified && !_locationDenied) return;
        setState(() {
          _locationVerified = true;
          _locationDenied = false;
        });
        return;
      }
      // Not granted. If we never asked, ask now (disclosure + system prompt).
      await _enforceLocationRequirement(showLoader: true);
    } catch (_) {
      // Unknown (e.g. timeout) — never downgrade a working dashboard to a
      // blocking error screen because a probe failed.
    } finally {
      _probeInFlight = false;
    }
  }

  /// Ensures location access for a driver, without gating the dashboard.
  ///
  /// The dashboard renders immediately. Only a *positive* denial replaces it,
  /// and only after the disclosure dialog / system prompt have run — i.e. this
  /// can never silently leave an unprovisioned driver on a non-functional
  /// dashboard, but it also never delays an already-provisioned one.
  ///
  /// [showLoader] is true only for the explicit "Retry" flow from
  /// [LocationRequiredPage] while the permission UI owns the screen.
  Future<void> _enforceLocationRequirement({bool showLoader = true}) async {
    if (!mounted) return;
    final auth = context.read<AuthProvider>();
    if (!auth.isAuthenticated || !auth.isDriver) return;
    if (_locationCheckInFlight) {
      StartupTrace.mark('_enforceLocationRequirement skipped (in flight)');
      return;
    }

    _locationCheckInFlight = true;
    StartupTrace.mark(
      '_enforceLocationRequirement START',
      'showLoader=$showLoader verified=$_locationVerified '
          'denied=$_locationDenied ${StartupTrace.where()}',
    );
    final sw = Stopwatch()..start();
    try {
      var hasPermission = await _locationService
          .ensurePermission(requestIfDenied: false)
          .timeout(const Duration(seconds: 2), onTimeout: () => false);
      StartupTrace.mark(
        '_enforceLocationRequirement first probe',
        'hasPermission=$hasPermission ${sw.elapsedMilliseconds}ms',
      );

      if (!hasPermission && mounted) {
        // Disclosure dialog + system prompt. The dashboard stays mounted until
        // this actually fails, so an already-granted driver sees nothing.
        if (showLoader && mounted) {
          setState(() => _isCheckingLocation = true);
        }
        hasPermission = await _locationService.ensurePermission(
          context: context,
        );
        StartupTrace.mark(
          '_enforceLocationRequirement after request',
          'hasPermission=$hasPermission ${sw.elapsedMilliseconds}ms',
        );
      }

      if (!hasPermission && mounted) {
        // Brief re-check after the system dialog closes (some devices lag).
        await Future<void>.delayed(const Duration(milliseconds: 250));
        hasPermission = await _locationService
            .ensurePermission(requestIfDenied: false)
            .timeout(const Duration(seconds: 2), onTimeout: () => false);
        StartupTrace.mark(
          '_enforceLocationRequirement after 250ms re-check',
          'hasPermission=$hasPermission ${sw.elapsedMilliseconds}ms',
        );
      }

      if (!mounted) return;
      setState(() {
        _locationVerified = true;
        _locationDenied = !hasPermission;
        _isCheckingLocation = false;
      });
      StartupTrace.mark(
        '_enforceLocationRequirement DONE',
        'granted=$hasPermission ${sw.elapsedMilliseconds}ms',
      );
    } catch (_) {
      // A probe failure is not a denial — leave the dashboard alone and let a
      // later resume/lifecycle event try again.
      if (!mounted) return;
      setState(() => _isCheckingLocation = false);
      StartupTrace.mark(
        '_enforceLocationRequirement ERROR (treated as unknown)',
        '${sw.elapsedMilliseconds}ms',
      );
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
        StartupTrace.mark(
          '_AppRuntimeGuard.build',
          'status=${auth.status} driver=${auth.isDriver} '
              'verified=$_locationVerified denied=$_locationDenied '
              'checking=$_isCheckingLocation',
        );
        // No side effects here — they live in _onAuthChanged / lifecycle
        // callbacks so that a rebuild cannot re-trigger network work.

        if (auth.isAuthenticated && auth.isDriver) {
          // Only while the disclosure dialog / system prompt is literally on
          // screen, or when we have positively established a denial. An
          // unknown/unverified permission state must never block the dashboard.
          if (_isCheckingLocation) {
            StartupTrace.mark('_AppRuntimeGuard → permission UI in progress');
            return const Scaffold(
              body: Center(child: CircularProgressIndicator()),
            );
          }

          if (_locationVerified && _locationDenied) {
            StartupTrace.mark('_AppRuntimeGuard → LocationRequiredPage');
            return LocationRequiredPage(onRetry: _enforceLocationRequirement);
          }
        }

        StartupTrace.mark('_AppRuntimeGuard → AuthEntryGate');
        return const AuthEntryGate();
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
                  'SOS safety features. Enable location for this app in '
                  'Settings, then return here and tap Retry.',
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
                      onPressed: Geolocator.openAppSettings,
                      child: const Text('Open Settings'),
                    ),
                    OutlinedButton(
                      onPressed: onRetry,
                      child: const Text('Retry'),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
