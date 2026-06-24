import 'package:flutter/material.dart';

import '../services/user_notification_service.dart';
import '../utils/app_colors.dart';
import '../utils/size_confg.dart';

/// Notification bell with a live unread-count badge (hidden when zero).
class NotificationBellButton extends StatefulWidget {
  final Future<void> Function()? onTap;
  final double iconSize;

  const NotificationBellButton({
    super.key,
    required this.onTap,
    this.iconSize = 24,
  });

  @override
  State<NotificationBellButton> createState() => _NotificationBellButtonState();
}

class _NotificationBellButtonState extends State<NotificationBellButton> {
  final UserNotificationService _service = UserNotificationService();
  int _unreadCount = 0;

  @override
  void initState() {
    super.initState();
    _refreshCount();
    _service.subscribeRealtime(_refreshCount);
  }

  @override
  void dispose() {
    _service.unsubscribeRealtime(_refreshCount);
    super.dispose();
  }

  Future<void> _refreshCount() async {
    try {
      final count = await _service.fetchUnreadCount();
      if (!mounted) return;
      setState(() => _unreadCount = count);
    } catch (_) {}
  }

  Future<void> _handleTap() async {
    await widget.onTap?.call();
    await _refreshCount();
  }

  String get _badgeLabel {
    if (_unreadCount > 99) return '99+';
    return '$_unreadCount';
  }

  @override
  Widget build(BuildContext context) {
    SizeConfig.init(context);

    return GestureDetector(
      onTap: _handleTap,
      behavior: HitTestBehavior.opaque,
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          Icon(
            Icons.notifications_outlined,
            color: AppColors.textDark,
            size: SizeConfig.r(widget.iconSize),
          ),
          if (_unreadCount > 0)
            Positioned(
              right: -SizeConfig.r(2),
              top: -SizeConfig.r(2),
              child: Container(
                padding: EdgeInsets.symmetric(
                  horizontal: SizeConfig.r(_unreadCount > 9 ? 4 : 3),
                  vertical: SizeConfig.r(2),
                ),
                decoration: const BoxDecoration(
                  color: AppColors.warning,
                  shape: BoxShape.circle,
                ),
                constraints: BoxConstraints(
                  minWidth: SizeConfig.r(16),
                  minHeight: SizeConfig.r(16),
                ),
                child: Text(
                  _badgeLabel,
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: SizeConfig.sp(9),
                    fontWeight: FontWeight.w700,
                    height: 1,
                  ),
                  textAlign: TextAlign.center,
                ),
              ),
            ),
        ],
      ),
    );
  }
}
