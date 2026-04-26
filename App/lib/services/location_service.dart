import 'package:geolocator/geolocator.dart';

/// Handles location service and permission checks for navigation/tracking flows.
class LocationService {
  /// Ensures location services are enabled and app permissions are granted.
  /// Returns true only when location access can be used right now.
  Future<bool> ensurePermission() async {
    final serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) return false;

    var permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }

    return permission == LocationPermission.always ||
        permission == LocationPermission.whileInUse;
  }
}
