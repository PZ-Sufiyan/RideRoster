import 'dart:async';
import 'dart:io';
import 'package:connectivity_plus/connectivity_plus.dart';
import '../config/supabase_config.dart';

/// Singleton that tracks TRUE network reachability — not just link state.
///
/// Two-signal design:
///   hasLink           — from connectivity_plus (instant, cheap)
///   lastProbeSucceeded — from HTTP HEAD to Supabase (accurate)
///
///   canReachServer = hasLink AND lastProbeSucceeded
///
/// Probes fire on:
///   - init()
///   - link restored (offline→online link transition)
///   - app resume (via triggerProbe() from WidgetsBindingObserver)
///   - periodic 30s timer while app is active
///
/// [onReconnect] fires when canReachServer transitions false→true.
/// [onlineStream] emits canReachServer on every change.
/// Nothing else in the app calls isOnline directly — they watch ConnectivityProvider.
class ConnectivityService {
  ConnectivityService._internal();
  static final ConnectivityService _instance = ConnectivityService._internal();
  factory ConnectivityService() => _instance;

  final Connectivity _connectivity = Connectivity();

  bool _hasLink = true;
  bool _lastProbeSucceeded = false;
  bool _probing = false;
  String _probeHost = Uri.parse(SupabaseConfig.url).host;

  /// The single truth the rest of the app uses.
  bool get canReachServer => _hasLink && _lastProbeSucceeded;

  // Broadcast streams
  final _onlineController = StreamController<bool>.broadcast();
  final _reconnectController = StreamController<void>.broadcast();

  Stream<bool> get onlineStream => _onlineController.stream;
  Stream<void> get onReconnect => _reconnectController.stream;

  StreamSubscription<List<ConnectivityResult>>? _linkSub;
  Timer? _periodicTimer;

  // ── Init ─────────────────────────────────────────────────────────────────

  /// [probeHost] should match the host passed to [Supabase.initialize] (e.g. from
  /// `--dart-define=SUPABASE_URL`), not only [SupabaseConfig.url].
  Future<void> init({String? probeHost}) async {
    if (probeHost != null && probeHost.isNotEmpty) {
      _probeHost = probeHost;
    }

    final initial = await _connectivity.checkConnectivity();
    _hasLink = _resultsHaveLink(initial);

    await _probe(); // establish initial state before anything reads it

    _linkSub = _connectivity.onConnectivityChanged.listen((results) {
      final hadLink = _hasLink;
      _hasLink = _resultsHaveLink(results);

      if (!hadLink && _hasLink) {
        // Link restored — probe to verify real internet
        _probe();
      } else if (!_hasLink) {
        // Link gone — immediately update state without waiting for probe
        _updateState(false);
      }
    });

    // Periodic probe every 30s — catches "Wi-Fi but no internet" recovery
    _periodicTimer = Timer.periodic(const Duration(seconds: 30), (_) {
      if (_hasLink) _probe();
    });
  }

  /// Call from WidgetsBindingObserver.didChangeAppLifecycleState on resumed.
  /// Probes on foreground so the banner updates quickly after app switch.
  Future<void> triggerProbe() async {
    if (_hasLink) await _probe();
  }

  // ── Probe ─────────────────────────────────────────────────────────────────
  // TCP connect to Supabase host:443 — same endpoint HTTPS uses, no HTTP body.
  // 3s timeout; debounced so concurrent calls collapse.

  Future<void> _probe() async {
    if (_probing) return;
    _probing = true;
    try {
      final socket = await Socket.connect(
        _probeHost,
        443,
        timeout: const Duration(seconds: 3),
      );
      socket.destroy();
      _updateState(true);
    } catch (_) {
      _updateState(false);
    } finally {
      _probing = false;
    }
  }

  void _updateState(bool reachable) {
    final prev = canReachServer;
    _lastProbeSucceeded = reachable;
    final next = canReachServer;

    if (prev == next) return; // no change — don't spam listeners

    _onlineController.add(next);

    if (!prev && next) {
      // false → true transition: real reconnect event
      _reconnectController.add(null);
    }
  }

  bool _resultsHaveLink(List<ConnectivityResult> results) {
    return results.any(
      (r) =>
          r == ConnectivityResult.mobile ||
          r == ConnectivityResult.wifi ||
          r == ConnectivityResult.ethernet,
    );
  }

  // Prefer [canReachServer] (sync) or [triggerProbe] — avoid await [isOnline]
  // unless you intentionally need a fresh probe.
  Future<bool> get isOnline async {
    if (_hasLink) await _probe();
    return canReachServer;
  }

  Future<void> dispose() async {
    _periodicTimer?.cancel();
    await _linkSub?.cancel();
    await _onlineController.close();
    await _reconnectController.close();
  }
}
