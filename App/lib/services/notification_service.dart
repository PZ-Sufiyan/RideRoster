import 'package:flutter_local_notifications/flutter_local_notifications.dart';

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

  static const AndroidNotificationChannel _androidChannel =
      AndroidNotificationChannel(
        _channelId,
        _channelName,
        description: 'Arrival alerts and job status notifications',
        importance: Importance.high,
      );

  Future<void> init() async {
    const androidInit = AndroidInitializationSettings('@mipmap/ic_launcher');
    const iosInit = DarwinInitializationSettings(
      requestSoundPermission: true,
      requestAlertPermission: true,
      requestBadgePermission: true,
    );
    const initSettings = InitializationSettings(
      android: androidInit,
      iOS: iosInit,
    );

    await _plugin.initialize(initSettings);

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

    await _plugin
        .resolvePlatformSpecificImplementation<
          IOSFlutterLocalNotificationsPlugin
        >()
        ?.requestPermissions(alert: true, badge: true, sound: true);
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
}
