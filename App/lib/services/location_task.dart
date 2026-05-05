import 'dart:async';
import 'package:flutter_background_service/flutter_background_service.dart';
import 'package:geolocator/geolocator.dart';

/// Tracks driver location in the background and fires [onArrived] when the
/// driver is within [thresholdMeters] of the target coordinates.
///
/// IMPORTANT — arrival behaviour:
///   [onArrived] is called once when the driver enters the threshold radius.
///   It is the caller's responsibility to decide what happens on arrival.
///
///   For PICKUPS: the provider shows an arrival notification and stops
///   tracking — the driver must still tap "Pickup complete" manually.
///   Auto-completing a pickup without confirmation risks wrong pickups
///   being recorded (GPS drift, driver passing nearby, etc.).
///
///   For DROPOFFS: same pattern — notify arrival, driver confirms.
///
/// [onDistanceUpdate] is called on every GPS tick so the UI can display
/// "X m away" to help the driver know they are approaching.
class BackgroundLocationTask {
  static StreamSubscription<Position>? _sub;

  /// Whether tracking is currently active.
  static bool get isRunning => _sub != null;

  /// Starts tracking toward [targetLat]/[targetLng].
  ///
  /// [onArrived]        — called once when driver is within [thresholdMeters].
  ///                      Does NOT auto-complete anything — caller decides.
  /// [onDistanceUpdate] — called on every GPS tick with distance in meters.
  /// [thresholdMeters]  — arrival radius (default 30 m; wider than 10 m to
  ///                      account for urban GPS accuracy variance).
  static Future<void> start({
    required double targetLat,
    required double targetLng,
    required Future<void> Function() onArrived,
    void Function(double distanceMeters)? onDistanceUpdate,
    double thresholdMeters = 30,
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

          // Report distance to provider for live "X m away" UI display.
          onDistanceUpdate?.call(distance);

          if (distance <= thresholdMeters) {
            // Cancel FIRST to prevent duplicate callbacks on subsequent ticks.
            await stop();
            // Notify caller — caller decides what to do (show notification,
            // update UI state, etc.) but does NOT auto-mark anything complete.
            await onArrived();
          }
        });
  }

  /// Stops the location stream and the background service.
  static Future<void> stop() async {
    await _sub?.cancel();
    _sub = null;

    final service = FlutterBackgroundService();
    if (await service.isRunning()) {
      service.invoke('stopService');
    }
  }
}
