import 'package:geolocator/geolocator.dart';

/// Handles location service and permission checks for navigation/tracking flows.
class LocationService {
  /// Ensures location services are enabled and app permissions are granted.
  /// Returns true only when location access can be used right now.
  Future<bool> ensurePermission({bool requestIfDenied = true}) async {
    var permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.always ||
        permission == LocationPermission.whileInUse) {
      return Geolocator.isLocationServiceEnabled();
    }

    if (permission == LocationPermission.deniedForever) {
      return false;
    }

    if (!await Geolocator.isLocationServiceEnabled()) {
      await Future<void>.delayed(const Duration(milliseconds: 250));
      if (!await Geolocator.isLocationServiceEnabled()) {
        return false;
      }
    }

    if (permission == LocationPermission.denied && requestIfDenied) {
      permission = await Geolocator.requestPermission();
    }

    return permission == LocationPermission.always ||
        permission == LocationPermission.whileInUse;
  }

  /// Returns the device's current GPS position. Works offline.
  Future<Position?> getCurrentPosition() async {
    if (!await ensurePermission()) return null;

    try {
      return await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.medium,
          timeLimit: Duration(seconds: 8),
        ),
      ).timeout(const Duration(seconds: 10));
    } catch (_) {
      return null;
    }
  }

  /// Haversine distance from the device to [targetLat]/[targetLng] in meters.
  /// Returns null when GPS is unavailable.
  Future<double?> distanceTo(double targetLat, double targetLng) async {
    final position = await getCurrentPosition();
    if (position == null) return null;

    return Geolocator.distanceBetween(
      position.latitude,
      position.longitude,
      targetLat,
      targetLng,
    );
  }

  /// Whether the device is within [radiusMeters] of the target. Works offline.
  Future<bool> isWithinRadius(
    double targetLat,
    double targetLng,
    double radiusMeters,
  ) async {
    final distance = await distanceTo(targetLat, targetLng);
    if (distance == null) return false;
    return distance <= radiusMeters;
  }
}
