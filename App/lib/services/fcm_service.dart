import 'dart:io';

import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';

import '../config/firebase_app_config.dart';
import '../firebase_options.dart';
import 'notification_service.dart';
import 'push_token_service.dart';

@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  if (!isFirebaseConfigured) return;
  await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
}

typedef PushMessageHandler = void Function(RemoteMessage message);

/// Registers FCM tokens and routes incoming push messages to local notifications.
class FcmService {
  FcmService._internal();
  static final FcmService _instance = FcmService._internal();
  factory FcmService() => _instance;

  final PushTokenService _pushTokenService = PushTokenService();
  FirebaseMessaging? _messaging;
  bool _initialized = false;
  String? _activeToken;
  String? _activeUserId;

  Future<void> init({required PushMessageHandler onMessageOpened}) async {
    if (!isFirebaseConfigured) {
      debugPrint(
        'FCM skipped: run flutterfire configure and add google-services.json.',
      );
      return;
    }

    try {
      await Firebase.initializeApp(
        options: DefaultFirebaseOptions.currentPlatform,
      );
      _messaging = FirebaseMessaging.instance;
      _initialized = true;

      FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);

      await _messaging!.requestPermission(
        alert: true,
        badge: true,
        sound: true,
        provisional: false,
      );

      FirebaseMessaging.onMessage.listen(_handleForegroundMessage);
      FirebaseMessaging.onMessageOpenedApp.listen(onMessageOpened);

      final initialMessage = await _messaging!.getInitialMessage();
      if (initialMessage != null) {
        onMessageOpened(initialMessage);
      }

      _messaging!.onTokenRefresh.listen((token) async {
        final userId = _activeUserId;
        if (userId == null || userId.isEmpty) return;
        await _saveToken(userId: userId, token: token);
      });
    } catch (error) {
      debugPrint('FCM init failed: $error');
      _initialized = false;
      _messaging = null;
    }
  }

  Future<void> registerForUser(String userId) async {
    if (!_initialized || _messaging == null) return;
    if (userId.trim().isEmpty) return;
    _activeUserId = userId;

    final token = await _messaging!.getToken();
    if (token == null || token.isEmpty) return;
    await _saveToken(userId: userId, token: token);
  }

  Future<void> unregisterCurrentToken() async {
    if (!_initialized || _messaging == null) return;

    final userId = _activeUserId;
    final token = _activeToken ?? await _messaging!.getToken();

    if (userId != null &&
        userId.isNotEmpty &&
        token != null &&
        token.isNotEmpty) {
      try {
        await _pushTokenService.removeToken(userId: userId, token: token);
      } catch (_) {}
    }

    _activeUserId = null;
    _activeToken = null;

    try {
      await _messaging!.deleteToken();
    } catch (_) {}
  }

  Future<void> _saveToken({
    required String userId,
    required String token,
  }) async {
    _activeToken = token;
    try {
      await _pushTokenService.upsertToken(
        userId: userId,
        token: token,
        platform: _platform,
      );
    } catch (error) {
      debugPrint('Failed to save FCM token: $error');
    }
  }

  Future<void> _handleForegroundMessage(RemoteMessage message) async {
    final notification = message.notification;
    if (notification == null) return;

    await NotificationService().showPushNotification(
      title: notification.title ?? 'RideRoster',
      body: notification.body ?? '',
      payload: message.data['job_id']?.toString(),
    );
  }

  String get _platform {
    if (kIsWeb) return 'android';
    return Platform.isIOS ? 'ios' : 'android';
  }
}
