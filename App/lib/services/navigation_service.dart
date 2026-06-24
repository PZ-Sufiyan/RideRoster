import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:url_launcher/url_launcher.dart';

import '../model/job_model.dart';
import '../routes/app_routes.dart';

/// Google Maps launches + global navigator for push notification deep links.
class NavigationService {
  static final GlobalKey<NavigatorState> navigatorKey =
      GlobalKey<NavigatorState>();

  static void openDriverDashboard() {
    navigatorKey.currentState?.pushNamedAndRemoveUntil(
      AppRoutes.driverDashboard,
      (route) => false,
    );
  }

  static void openDriverNotifications() {
    navigatorKey.currentState?.pushNamed(AppRoutes.driverNotifications);
  }

  static void openPaNotifications() {
    navigatorKey.currentState?.pushNamed(AppRoutes.paNotifications);
  }

  /// Routes push taps: message/leave → notifications, otherwise dashboard.
  static void handlePushOpened(Map<String, dynamic> data) {
    final type = data['type']?.toString() ?? '';
    if (type == 'message' || type == 'leave_status' || type == 'job_assignment') {
      final user = Supabase.instance.client.auth.currentUser;
      final meta = user?.userMetadata ?? user?.appMetadata;
      final role = meta?['role']?.toString();
      if (role == 'passenger_assistant') {
        openPaNotifications();
      } else {
        openDriverNotifications();
      }
      return;
    }
    final user = Supabase.instance.client.auth.currentUser;
    final meta = user?.userMetadata ?? user?.appMetadata;
    final role = meta?['role']?.toString();
    if (role == 'passenger_assistant') {
      navigatorKey.currentState?.pushNamedAndRemoveUntil(
        AppRoutes.paDashboard,
        (route) => false,
      );
    } else {
      openDriverDashboard();
    }
  }

  /// Opens Google Maps showing current location, all pickups, and dropoff.
  Future<void> openFullRoute({
    required List<PickupStop> pickups,
    required DropoffStop? dropoff,
  }) async {
    Position? pos;
    try {
      pos = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
        ),
      );
    } catch (_) {}

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

    if (segments.length < 2) return;

    final path = segments.map(Uri.encodeComponent).join('/');
    final url = Uri.parse('https://www.google.com/maps/dir/$path');
    await launchUrl(url, mode: LaunchMode.externalApplication);
  }

  /// Opens Google Maps from current location to one destination.
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
