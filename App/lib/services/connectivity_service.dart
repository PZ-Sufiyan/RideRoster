import 'dart:async';
import 'dart:io';
import 'package:connectivity_plus/connectivity_plus.dart';
import '../config/supabase_config.dart';

/// Tracks whether the device can reach the Supabase project — not just link state.
///
/// Design goals (avoids false "offline" banner):
///   • Optimistic when a network link exists — one failed probe does not flip UI.
///   • Requires [_failuresBeforeOffline] consecutive probe failures before offline.
///   • Successful Supabase API traffic ([noteSuccessfulRequest]) confirms online.
///   • HTTP probe to the same REST endpoint the app uses (not raw TCP).
///   • Probes on link restore + periodic timer — not every connectivity_plus noise event.
///
///   canReachServer = hasLink AND server reachable (with grace after recent success)
class ConnectivityService {
  ConnectivityService._internal();
  static final ConnectivityService _instance = ConnectivityService._internal();
  factory ConnectivityService() => _instance;

  static const int _failuresBeforeOffline = 2;
  static const Duration _onlineProbeInterval = Duration(seconds: 30);
  static const Duration _offlineProbeInterval = Duration(seconds: 8);
  static const Duration _successGrace = Duration(seconds: 60);
  static const Duration _probeTimeout = Duration(seconds: 5);

  final Connectivity _connectivity = Connectivity();

  bool _hasLink = true;
  bool _serverReachable = false;
  int _consecutiveFailures = 0;
  DateTime? _lastSuccessAt;
  bool _probing = false;
  bool _pendingProbe = false;

  String _probeBaseUrl = SupabaseConfig.url;
  String _probeAnonKey = SupabaseConfig.anonKey;

  /// True when Wi‑Fi/mobile/ethernet link is up (may still be probing server).
  bool get hasNetworkLink => _hasLink;

  /// The single truth the rest of the app uses.
  bool get canReachServer {
    if (!_hasLink) return false;
    if (_serverReachable) return true;
    final last = _lastSuccessAt;
    if (last != null &&
        DateTime.now().difference(last) < _successGrace &&
        _consecutiveFailures < _failuresBeforeOffline) {
      return true;
    }
    return false;
  }

  final _onlineController = StreamController<bool>.broadcast();
  final _reconnectController = StreamController<void>.broadcast();

  Stream<bool> get onlineStream => _onlineController.stream;
  Stream<void> get onReconnect => _reconnectController.stream;

  StreamSubscription<List<ConnectivityResult>>? _linkSub;
  Timer? _periodicTimer;
  bool? _lastEmittedOnline;

  Future<void> init({
    String? probeBaseUrl,
    String? probeAnonKey,
  }) async {
    if (probeBaseUrl != null && probeBaseUrl.trim().isNotEmpty) {
      _probeBaseUrl = probeBaseUrl.trim().replaceAll(RegExp(r'/+$'), '');
    }
    if (probeAnonKey != null && probeAnonKey.trim().isNotEmpty) {
      _probeAnonKey = probeAnonKey.trim();
    }

    final initial = await _connectivity.checkConnectivity();
    _hasLink = _resultsHaveLink(initial);
    // Optimistic until a probe proves otherwise — avoids offline flash at launch.
    _serverReachable = _hasLink;

    await _probe();
    _notifyIfChanged();

    _linkSub = _connectivity.onConnectivityChanged.listen((results) {
      final hadLink = _hasLink;
      _hasLink = _resultsHaveLink(results);

      if (!_hasLink) {
        _consecutiveFailures = 0;
        _serverReachable = false;
        _notifyIfChanged();
        _restartPeriodicProbe();
        return;
      }

      // Link restored after being down — optimistic online, then verify.
      if (!hadLink) {
        _consecutiveFailures = 0;
        _serverReachable = true;
        _notifyIfChanged();
        _restartPeriodicProbe();
        _probe();
      }
    });

    _restartPeriodicProbe();
  }

  /// Call from WidgetsBindingObserver on resumed.
  Future<void> triggerProbe() async {
    if (_hasLink) await _probe();
  }

  /// Call after any successful Supabase HTTP request — best reachability signal.
  void noteSuccessfulRequest() {
    _consecutiveFailures = 0;
    _lastSuccessAt = DateTime.now();
    if (!_serverReachable) {
      _serverReachable = true;
      _notifyIfChanged();
    }
  }

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

  // ── Probe ─────────────────────────────────────────────────────────────────

  void _restartPeriodicProbe() {
    _periodicTimer?.cancel();
    final interval =
        canReachServer ? _onlineProbeInterval : _offlineProbeInterval;
    _periodicTimer = Timer.periodic(interval, (_) {
      if (_hasLink) _probe();
    });
  }

  Future<void> _probe() async {
    if (_probing) {
      _pendingProbe = true;
      return;
    }
    _probing = true;
    try {
      final ok = await _httpProbe();
      if (ok) {
        _consecutiveFailures = 0;
        _lastSuccessAt = DateTime.now();
        if (!_serverReachable) {
          _serverReachable = true;
          _notifyIfChanged();
        }
      } else {
        _consecutiveFailures++;
        if (_consecutiveFailures >= _failuresBeforeOffline && _serverReachable) {
          _serverReachable = false;
          _notifyIfChanged();
        }
      }
    } finally {
      _probing = false;
      if (_pendingProbe) {
        _pendingProbe = false;
        await _probe();
      }
    }
  }

  /// HEAD to Supabase REST — same host/path/TLS stack as real app traffic.
  Future<bool> _httpProbe() async {
    if (_probeBaseUrl.isEmpty || _probeAnonKey.isEmpty) return false;

    final client = HttpClient();
    client.connectionTimeout = _probeTimeout;
    try {
      final uri = Uri.parse('$_probeBaseUrl/rest/v1/');
      final request = await client.headUrl(uri).timeout(_probeTimeout);
      request.headers.set('apikey', _probeAnonKey);
      request.headers.set('Authorization', 'Bearer $_probeAnonKey');
      final response = await request.close().timeout(_probeTimeout);
      await response.drain();
      return response.statusCode > 0;
    } catch (_) {
      return false;
    } finally {
      client.close(force: true);
    }
  }

  void _notifyIfChanged() {
    final next = canReachServer;
    final prev = _lastEmittedOnline;
    if (prev != null && prev == next) return;
    _lastEmittedOnline = next;
    _onlineController.add(next);
    if (prev == false && next == true) {
      _reconnectController.add(null);
    }
    _restartPeriodicProbe();
  }

  bool _resultsHaveLink(List<ConnectivityResult> results) {
    return results.any(
      (r) =>
          r == ConnectivityResult.mobile ||
          r == ConnectivityResult.wifi ||
          r == ConnectivityResult.ethernet,
    );
  }
}
