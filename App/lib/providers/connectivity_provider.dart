import 'dart:async';
import 'package:flutter/foundation.dart';
import '../services/connectivity_service.dart';

/// Single source of truth for network state in the widget tree.
///
/// All UI reads [isOnline] via context.watch. Value stays true while a link
/// exists unless multiple probes fail or the link drops. Successful Supabase
/// traffic also keeps the app marked online.
///
/// Add to MultiProvider BEFORE JobProvider so JobProvider can
/// optionally read it too.
class ConnectivityProvider extends ChangeNotifier {
  bool _isOnline = false;
  /// True when the device can reach your Supabase host (not just Wi‑Fi/mobile).
  bool get isOnline => _isOnline;
  bool get canReachServer => _isOnline;

  StreamSubscription<bool>? _sub;

  ConnectivityProvider() {
    // Seed immediately from current state (sync — no await needed)
    _isOnline = ConnectivityService().canReachServer;

    // React to every change from the service
    _sub = ConnectivityService().onlineStream.listen((online) {
      if (_isOnline == online) return;
      _isOnline = online;
      notifyListeners();
    });
  }

  @override
  void dispose() {
    _sub?.cancel();
    super.dispose();
  }
}
