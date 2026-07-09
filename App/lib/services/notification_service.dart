import 'dart:ui' show Color;

import 'package:flutter_local_notifications/flutter_local_notifications.dart';

import 'navigation_service.dart';
import '../routes/app_routes.dart';

/// Singleton local notification service.
/// Call [init] once in main() before runApp().
class NotificationService {
  NotificationService._internal();
  static final NotificationService _instance = NotificationService._internal();
  factory NotificationService() => _instance;

  final FlutterLocalNotificationsPlugin _plugin =
      FlutterLocalNotificationsPlugin();

  static const _channelId = 'ride_roster_channel';
  static const _channelName = 'RideRoster Notifications';
  static const _pushNotificationIdBase = 1000;

  int _nextPushNotificationId = _pushNotificationIdBase;

  static const AndroidNotificationChannel _androidChannel =
      AndroidNotificationChannel(
        _channelId,
        _channelName,
        description: 'Arrival alerts and job assignment notifications',
        importance: Importance.high,
      );

  Future<void> init({bool requestIosPermissions = true}) async {
    const androidInit = AndroidInitializationSettings('@mipmap/ic_launcher');
    const iosInit = DarwinInitializationSettings(
      requestSoundPermission: false,
      requestAlertPermission: false,
      requestBadgePermission: false,
    );
    const initSettings = InitializationSettings(
      android: androidInit,
      iOS: iosInit,
    );

    await _plugin.initialize(
      initSettings,
      onDidReceiveNotificationResponse: _onNotificationTapped,
    );

    await _plugin
        .resolvePlatformSpecificImplementation<
          AndroidFlutterLocalNotificationsPlugin
        >()
        ?.createNotificationChannel(_androidChannel);

    await _plugin
        .resolvePlatformSpecificImplementation<
          AndroidFlutterLocalNotificationsPlugin
        >()
        ?.requestNotificationsPermission();

    if (requestIosPermissions) {
      await _plugin
          .resolvePlatformSpecificImplementation<
            IOSFlutterLocalNotificationsPlugin
          >()
          ?.requestPermissions(alert: true, badge: true, sound: true);
    }
  }

  /// Shows an arrival notification.
  ///
  /// [locationName] — the stop name/address shown in the body.
  /// [isPickup]     — true for pickup stops, false for dropoff.
  Future<void> showArrivalNotification(
    String locationName, {
    bool isPickup = true,
  }) async {
    const androidDetails = AndroidNotificationDetails(
      _channelId,
      _channelName,
      channelDescription: 'Arrival notifications for job stops',
      importance: Importance.high,
      priority: Priority.high,
    );
    const iosDetails = DarwinNotificationDetails();
    const details = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );

    final title = isPickup ? 'Arrived at pickup' : 'Arrived at drop-off';
    final body = isPickup
        ? 'You have reached $locationName'
        : 'You have arrived at the drop-off: $locationName';

    // Use different IDs so pickup and dropoff notifications don't overwrite each other.
    final notifId = isPickup ? 1 : 2;

    await _plugin.show(notifId, title, body, details);
  }

  /// Each push gets a unique ID so new alerts do not replace earlier ones.
  int _uniquePushNotificationId({Map<String, dynamic>? data}) {
    final type = data?['type']?.toString() ?? '';
    final jobId = data?['job_id']?.toString() ?? '';
    final direction = data?['direction']?.toString() ?? '';
    if (type.isNotEmpty || jobId.isNotEmpty) {
      final key = '$type|$jobId|$direction|${DateTime.now().millisecondsSinceEpoch}';
      return key.hashCode.remainder(2147483646).abs() + 1;
    }

    _nextPushNotificationId = (_nextPushNotificationId + 1) % 2147483647;
    if (_nextPushNotificationId < _pushNotificationIdBase) {
      _nextPushNotificationId = _pushNotificationIdBase;
    }
    return _nextPushNotificationId;
  }

  /// Shows a push notification while the app is in the foreground.
  Future<void> showPushNotification({
    required String title,
    required String body,
    String? payload,
    Map<String, dynamic>? data,
  }) async {
    final notificationId = _uniquePushNotificationId(data: data);
    final androidDetails = AndroidNotificationDetails(
      _channelId,
      _channelName,
      channelDescription: 'Job assignment and status notifications',
      importance: Importance.high,
      priority: Priority.high,
      styleInformation: BigTextStyleInformation(body),
      color: const Color(0xFF4A90D9),
    );
    const iosDetails = DarwinNotificationDetails();
    final details = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );

    await _plugin.show(
      notificationId,
      title,
      body,
      details,
      payload: payload,
    );
  }

  void _onNotificationTapped(NotificationResponse response) {
    final payload = response.payload;
    if (payload == 'driver_notifications') {
      NavigationService.openDriverNotifications();
      return;
    }
    if (payload == 'pa_notifications') {
      NavigationService.openPaNotifications();
      return;
    }
    if (payload == null || payload.isEmpty) {
      NavigationService.openDriverDashboard();
      return;
    }

    NavigationService.navigatorKey.currentState?.pushNamed(
      AppRoutes.driverDashboard,
    );
  }
}
