import 'dart:async';
import 'package:geolocator/geolocator.dart';
import 'location_constants.dart';

/// Foreground proximity tracking toward a target coordinate.
///
/// Uses [Geolocator] only — no background service (which was causing ANRs
/// when started without platform configuration).
class BackgroundLocationTask {
  static StreamSubscription<Position>? _positionSub;
  static StreamSubscription<ServiceStatus>? _serviceStatusSub;
  static bool _enterRadiusNotified = false;

  static const Duration _initialFixTimeout = Duration(seconds: 8);

  /// Whether tracking is currently active.
  static bool get isRunning => _positionSub != null;

  /// Starts continuous proximity tracking toward [targetLat]/[targetLng].
  static Future<void> start({
    required double targetLat,
    required double targetLng,
    required void Function(double distanceMeters) onDistanceUpdate,
    Future<void> Function()? onEnterRadius,
    void Function()? onLocationUnavailable,
    double radiusMeters = LocationConstants.completionRadiusMeters,
  }) async {
    await stop();
    _enterRadiusNotified = false;

    void reportPosition(Position pos) {
      final distance = Geolocator.distanceBetween(
        pos.latitude,
        pos.longitude,
        targetLat,
        targetLng,
      );
      onDistanceUpdate(distance);

      if (distance <= radiusMeters &&
          !_enterRadiusNotified &&
          onEnterRadius != null) {
        _enterRadiusNotified = true;
        unawaited(onEnterRadius());
      }
    }

    // Seed distance immediately instead of waiting for the position stream.
    try {
      final enabled = await Geolocator.isLocationServiceEnabled();
      if (enabled) {
        final initial = await Geolocator.getCurrentPosition(
          locationSettings: const LocationSettings(
            accuracy: LocationAccuracy.medium,
            timeLimit: _initialFixTimeout,
          ),
        ).timeout(_initialFixTimeout);
        reportPosition(initial);
      }
    } catch (_) {
      // Stream may still deliver a fix; unavailable is handled below.
    }

    _positionSub =
        Geolocator.getPositionStream(
          locationSettings: const LocationSettings(
            accuracy: LocationAccuracy.high,
            distanceFilter: 5,
          ),
        ).listen(
          reportPosition,
          onError: (_) {
            onLocationUnavailable?.call();
          },
          cancelOnError: false,
        );

    _serviceStatusSub = Geolocator.getServiceStatusStream().listen((status) {
      if (status == ServiceStatus.disabled) {
        onLocationUnavailable?.call();
        unawaited(stop());
      }
    });
  }

  /// Stops the location stream.
  static Future<void> stop() async {
    await _positionSub?.cancel();
    _positionSub = null;
    await _serviceStatusSub?.cancel();
    _serviceStatusSub = null;
    _enterRadiusNotified = false;
  }
}
