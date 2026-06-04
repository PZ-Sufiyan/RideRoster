import 'dart:async';
import 'package:flutter/foundation.dart';
import '../services/connectivity_service.dart';

/// Single source of truth for network state in the widget tree.
///
/// All UI reads [isOnline] / [canReachServer] via context.watch — same value:
/// link up AND last TCP probe to Supabase succeeded.
/// No page calls ConnectivityService directly.
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
