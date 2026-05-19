import 'package:geolocator/geolocator.dart';
import 'package:url_launcher/url_launcher.dart';
import '../model/job_model.dart';

/// Handles all external Google Maps navigation launches.
///
/// Two modes:
///   1. [openFullRoute]   — current location + all pickups + dropoff
///   2. [openSingleStop]  — current location → one destination only
class NavigationService {
  // ── Full route (multi-stop) ───────────────────────────────────────────────

  /// Opens Google Maps showing the driver's current location, every pickup
  /// stop that has GPS coordinates, and the dropoff as the final destination.
  ///
  /// Uses the /dir/ path format:
  ///   https://www.google.com/maps/dir/origin/stop1/stop2/destination
  ///
  /// The Google Maps app on Android and iOS intercepts this URL and opens
  /// it natively, rendering all waypoints correctly on the map.
  Future<void> openFullRoute({
    required List<PickupStop> pickups,
    required DropoffStop? dropoff,
  }) async {
    // Try to get current GPS position as route origin.
    Position? pos;
    try {
      pos = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
        ),
      );
    } catch (_) {
      // If unavailable, leave origin empty — Maps uses device location.
    }

    // Build ordered segments: origin / pickup1 / pickup2 / ... / dropoff
    final segments = <String>[];

    segments.add(pos != null ? '${pos.latitude},${pos.longitude}' : '');

    for (final p in pickups) {
      if (p.hasCoordinates) {
        segments.add('${p.lat},${p.lng}');
      }
    }

    if (dropoff != null && dropoff.hasCoordinates) {
      segments.add('${dropoff.lat},${dropoff.lng}');
    }

    // Need at least origin + one destination to open Maps.
    if (segments.length < 2) return;

    final path = segments.map(Uri.encodeComponent).join('/');
    final url = Uri.parse('https://www.google.com/maps/dir/$path');

    await launchUrl(url, mode: LaunchMode.externalApplication);
  }

  // ── Single stop ──────────────────────────────────────────────────────────

  /// Opens Google Maps from current location to one destination.
  /// Used by PickupPage ("Navigate") and dropoff navigation.
  ///
  /// Tries native google.navigation URI first (gives turn-by-turn immediately),
  /// falls back to web URL if the Google Maps app is not installed.
  Future<void> openSingleStop({
    required double lat,
    required double lng,
  }) async {
    final native = Uri.parse('google.navigation:q=$lat,$lng&mode=d');
    final web = Uri.parse(
      'https://www.google.com/maps/dir/?api=1&destination=$lat,$lng&travelmode=driving',
    );

    if (await canLaunchUrl(native)) {
      await launchUrl(native, mode: LaunchMode.externalApplication);
    } else {
      await launchUrl(web, mode: LaunchMode.externalApplication);
    }
  }
}
