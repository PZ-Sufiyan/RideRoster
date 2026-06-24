import 'dart:async';

import 'package:supabase_flutter/supabase_flutter.dart';

class UserNotificationItem {
  final String id;
  final String notificationType;
  final String title;
  final String body;
  final Map<String, dynamic> payload;
  final String? referenceId;
  final DateTime? readAt;
  final DateTime createdAt;

  const UserNotificationItem({
    required this.id,
    required this.notificationType,
    required this.title,
    required this.body,
    required this.payload,
    this.referenceId,
    this.readAt,
    required this.createdAt,
  });

  bool get isUnread => readAt == null;

  String get fullMessage {
    final fromPayload = payload['full_message']?.toString().trim();
    if (fromPayload != null && fromPayload.isNotEmpty) return fromPayload;
    return body;
  }

  String? get adminNotes {
    final notes = payload['admin_notes']?.toString().trim();
    if (notes == null || notes.isEmpty) return null;
    return notes;
  }

  String? get leaveStatus => payload['status']?.toString();

  String? get leaveType => payload['leave_type']?.toString();

  String? get jobName => payload['job_name']?.toString();

  String? get jobSchool => payload['client_school_name']?.toString();

  String? get jobId => payload['job_id']?.toString();

  factory UserNotificationItem.fromRow(Map<String, dynamic> row) {
    final payloadRaw = row['payload'];
    final payload = payloadRaw is Map
        ? Map<String, dynamic>.from(payloadRaw)
        : <String, dynamic>{};

    return UserNotificationItem(
      id: row['id']?.toString() ?? '',
      notificationType: row['notification_type']?.toString() ?? '',
      title: row['title']?.toString() ?? '',
      body: row['body']?.toString() ?? '',
      payload: payload,
      referenceId: row['reference_id']?.toString(),
      readAt: row['read_at'] != null
          ? DateTime.tryParse(row['read_at'].toString())
          : null,
      createdAt: DateTime.tryParse(row['created_at']?.toString() ?? '') ??
          DateTime.now(),
    );
  }
}

class UserNotificationService {
  UserNotificationService._internal();
  static final UserNotificationService _instance =
      UserNotificationService._internal();
  factory UserNotificationService() => _instance;

  SupabaseClient get _supabase => Supabase.instance.client;
  RealtimeChannel? _channel;

  String? get _userId => _supabase.auth.currentUser?.id;

  Future<List<UserNotificationItem>> fetchNotifications() async {
    final userId = _userId;
    if (userId == null || userId.isEmpty) return [];

    final rows = await _supabase
        .from('user_notifications')
        .select(
          'id, notification_type, title, body, payload, reference_id, read_at, created_at',
        )
        .eq('user_id', userId)
        .order('created_at', ascending: false);

    return (rows as List)
        .map((row) => UserNotificationItem.fromRow(
              Map<String, dynamic>.from(row as Map),
            ))
        .toList();
  }

  Future<void> markAsRead(Iterable<String> notificationIds) async {
    final userId = _userId;
    if (userId == null || userId.isEmpty) return;

    final ids = notificationIds.where((id) => id.isNotEmpty).toList();
    if (ids.isEmpty) return;

    final now = DateTime.now().toUtc().toIso8601String();
    await _supabase
        .from('user_notifications')
        .update({'read_at': now})
        .eq('user_id', userId)
        .inFilter('id', ids)
        .isFilter('read_at', null);
  }

  Future<void> markAllAsRead() async {
    final userId = _userId;
    if (userId == null || userId.isEmpty) return;

    final now = DateTime.now().toUtc().toIso8601String();
    await _supabase
        .from('user_notifications')
        .update({'read_at': now})
        .eq('user_id', userId)
        .isFilter('read_at', null);
  }

  Future<int> fetchUnreadCount() async {
    final userId = _userId;
    if (userId == null || userId.isEmpty) return 0;

    final rows = await _supabase
        .from('user_notifications')
        .select('id')
        .eq('user_id', userId)
        .isFilter('read_at', null);

    return (rows as List).length;
  }

  final List<void Function()> _listeners = [];

  void subscribeRealtime(void Function() onChange) {
    final userId = _userId;
    if (userId == null || userId.isEmpty) return;

    if (!_listeners.contains(onChange)) {
      _listeners.add(onChange);
    }
    _ensureChannel(userId);
  }

  void unsubscribeRealtime([void Function()? onChange]) {
    if (onChange != null) {
      _listeners.remove(onChange);
    } else {
      _listeners.clear();
    }
    if (_listeners.isEmpty) {
      _teardownChannel();
    }
  }

  void _notifyListeners() {
    for (final listener in List<void Function()>.from(_listeners)) {
      listener();
    }
  }

  void _ensureChannel(String userId) {
    if (_channel != null) return;

    _channel = _supabase
        .channel('user-notifications-$userId')
        .onPostgresChanges(
          event: PostgresChangeEvent.insert,
          schema: 'public',
          table: 'user_notifications',
          filter: PostgresChangeFilter(
            type: PostgresChangeFilterType.eq,
            column: 'user_id',
            value: userId,
          ),
          callback: (_) => _notifyListeners(),
        )
        .onPostgresChanges(
          event: PostgresChangeEvent.update,
          schema: 'public',
          table: 'user_notifications',
          filter: PostgresChangeFilter(
            type: PostgresChangeFilterType.eq,
            column: 'user_id',
            value: userId,
          ),
          callback: (_) => _notifyListeners(),
        );

    _channel!.subscribe();
  }

  void _teardownChannel() {
    final channel = _channel;
    if (channel == null) return;
    _supabase.removeChannel(channel);
    _channel = null;
  }
}

String formatNotificationRelativeTime(DateTime dateTime) {
  final now = DateTime.now();
  final diff = now.difference(dateTime);

  if (diff.inSeconds < 60) return 'Just now';
  if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
  if (diff.inHours < 24) return '${diff.inHours}h ago';
  if (diff.inDays == 1) return 'Yesterday';
  if (diff.inDays < 7) return '${diff.inDays}d ago';

  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  return '${months[dateTime.month - 1]} ${dateTime.day}';
}
