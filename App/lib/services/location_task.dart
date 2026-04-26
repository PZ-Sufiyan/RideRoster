import 'dart:async';
import 'package:flutter_background_service/flutter_background_service.dart';
import 'package:geolocator/geolocator.dart';

/// Tracks driver location in the background and fires [onArrived] when the
/// driver is within [thresholdMeters] of the target coordinates.
///
/// Designed to work with any state management (ChangeNotifier, Riverpod, etc.)
/// via a plain callback — no direct Provider/Riverpod dependency.
class BackgroundLocationTask {
  static StreamSubscription<Position>? _sub;

  /// Whether tracking is currently active.
  static bool get isRunning => _sub != null;

  /// Starts tracking toward [targetLat]/[targetLng].
  ///
  /// [onArrived]        — called once when driver arrives (≤ threshold).
  /// [onDistanceUpdate] — called on every GPS tick with current distance in meters.
  /// [thresholdMeters]  — arrival radius (default 50 m).
  static Future<void> start({
    required double targetLat,
    required double targetLng,
    required Future<void> Function() onArrived,
    void Function(double distanceMeters)? onDistanceUpdate,
    double thresholdMeters = 50,
  }) async {
    // Guard: don't start a second stream if already running.
    if (_sub != null) await stop();

    // Start the background service so the app stays alive when minimised.
    final service = FlutterBackgroundService();
    if (!await service.isRunning()) {
      await service.startService();
    }

    _sub =
        Geolocator.getPositionStream(
          locationSettings: const LocationSettings(
            accuracy: LocationAccuracy.high,
            distanceFilter: 5, // update every 5 m of movement
          ),
        ).listen((pos) async {
          final distance = Geolocator.distanceBetween(
            pos.latitude,
            pos.longitude,
            targetLat,
            targetLng,
          );

          // Report distance to provider for optional UI display.
          onDistanceUpdate?.call(distance);

          if (distance <= thresholdMeters) {
            // Cancel FIRST to prevent duplicate callbacks.
            await stop();
            await onArrived();
          }
        });
  }

  /// Stops the location stream and the background service.
  static Future<void> stop() async {
    await _sub?.cancel();
    _sub = null;

    // Optionally stop the background service when no longer needed.
    final service = FlutterBackgroundService();
    if (await service.isRunning()) {
      service.invoke('stopService');
    }
  }
}
