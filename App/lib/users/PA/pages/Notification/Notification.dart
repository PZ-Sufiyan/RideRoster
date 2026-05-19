import 'package:flutter/material.dart';
import '../../../../utils/app_colors.dart';
import '../../../../utils/size_confg.dart';

/// Notification screen palette — matches the design screenshot.
class _PaNotificationColors {
  static const Color pageBg = Color(0xFFF8F9FB);
  static const Color primary = Color(0xFF0088CC);
  static const Color chipBorder = Color(0xFFE5E7EB);
  static const Color iconBlueBg = Color(0xFFE8F4FC);
  static const Color iconOrange = Color(0xFFF59E0B);
  static const Color iconOrangeBg = Color(0xFFFFF4E5);
  static const Color iconGreen = Color(0xFF10B981);
  static const Color iconGreenBg = Color(0xFFE8F8EF);
  static const Color declineBg = Color(0xFFF3F4F6);
}

class PaNotificationsPage extends StatefulWidget {
  const PaNotificationsPage({super.key});

  @override
  State<PaNotificationsPage> createState() => _PaNotificationsPageState();
}

class _PaNotificationsPageState extends State<PaNotificationsPage> {
  static const int _unreadCount = 3;
  int _selectedFilter = 0;

  @override
  Widget build(BuildContext context) {
    SizeConfig.init(context);
    return Scaffold(
      backgroundColor: _PaNotificationColors.pageBg,
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _NotificationsHeader(unreadCount: _unreadCount),
            SizedBox(height: SizeConfig.r(16)),
            _FilterChips(
              selectedIndex: _selectedFilter,
              onSelected: (i) => setState(() => _selectedFilter = i),
            ),
            SizedBox(height: SizeConfig.r(16)),
            Expanded(
              child: ListView(
                padding: EdgeInsets.symmetric(horizontal: SizeConfig.hPad),
                children: const [
                  _NotificationCard(
                    icon: Icons.chat_bubble_outline,
                    iconColor: _PaNotificationColors.primary,
                    iconBg: _PaNotificationColors.iconBlueBg,
                    title: 'New Message from Admin',
                    time: 'Just now',
                    timeIsPrimary: true,
                    showUnreadDot: true,
                    body:
                        'Please remember to sanitize your vehicle before the next shift starts.',
                  ),
                  _NotificationCard(
                    icon: Icons.route_outlined,
                    iconColor: _PaNotificationColors.primary,
                    iconBg: _PaNotificationColors.iconBlueBg,
                    title: 'New Job Request',
                    time: '2m ago',
                    showUnreadDot: true,
                    body: 'Pickup at . 12 miles trip. Terminal 4, JFK Airport',
                    showActions: true,
                  ),
                  _NotificationCard(
                    icon: Icons.warning_amber_rounded,
                    iconColor: _PaNotificationColors.iconOrange,
                    iconBg: _PaNotificationColors.iconOrangeBg,
                    title: 'Document Expiry Warning',
                    time: '1h ago',
                    showUnreadDot: true,
                    body:
                        'Your vehicle insurance expires in 3 days. Please update it to avoid service interruption.',
                  ),
                  _NotificationCard(
                    icon: Icons.check_circle_outline,
                    iconColor: _PaNotificationColors.iconGreen,
                    iconBg: _PaNotificationColors.iconGreenBg,
                    title: 'Payment Received',
                    time: 'Yesterday',
                    body: 'Weekly payout of has been \$1,240.50 processed.',
                  ),
                  SizedBox(height: 24),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _NotificationsHeader extends StatelessWidget {
  final int unreadCount;
  const _NotificationsHeader({required this.unreadCount});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.fromLTRB(
        SizeConfig.hPad,
        SizeConfig.r(12),
        SizeConfig.hPad,
        0,
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Notifications',
                  style: TextStyle(
                    fontSize: SizeConfig.sp(24),
                    fontWeight: FontWeight.w700,
                    color: AppColors.textDark,
                  ),
                ),
                SizedBox(height: SizeConfig.r(4)),
                RichText(
                  text: TextSpan(
                    style: TextStyle(
                      fontSize: SizeConfig.sp(13),
                      color: AppColors.textLight,
                      fontWeight: FontWeight.w400,
                    ),
                    children: [
                      const TextSpan(text: 'You have unread alerts '),
                      TextSpan(
                        text: '$unreadCount',
                        style: const TextStyle(
                          color: _PaNotificationColors.primary,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          GestureDetector(
            onTap: () {},
            child: Container(
              width: SizeConfig.r(40),
              height: SizeConfig.r(40),
              decoration: const BoxDecoration(
                color: Color(0xFFF3F4F6),
                shape: BoxShape.circle,
              ),
              child: Icon(
                Icons.done_all,
                color: AppColors.textMedium,
                size: SizeConfig.r(20),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _FilterChips extends StatelessWidget {
  final int selectedIndex;
  final ValueChanged<int> onSelected;

  const _FilterChips({required this.selectedIndex, required this.onSelected});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.symmetric(horizontal: SizeConfig.hPad),
      child: Row(
        children: [
          _FilterChip(
            label: 'All',
            isSelected: selectedIndex == 0,
            onTap: () => onSelected(0),
          ),
          SizedBox(width: SizeConfig.r(10)),
          _FilterChip(
            label: 'Jobs',
            badge: '1',
            isSelected: selectedIndex == 1,
            onTap: () => onSelected(1),
          ),
          SizedBox(width: SizeConfig.r(10)),
          _FilterChip(
            label: 'System',
            isSelected: selectedIndex == 2,
            onTap: () => onSelected(2),
          ),
        ],
      ),
    );
  }
}

class _FilterChip extends StatelessWidget {
  final String label;
  final String? badge;
  final bool isSelected;
  final VoidCallback onTap;

  const _FilterChip({
    required this.label,
    this.badge,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: EdgeInsets.symmetric(
          horizontal: SizeConfig.r(16),
          vertical: SizeConfig.r(8),
        ),
        decoration: BoxDecoration(
          color: isSelected ? _PaNotificationColors.primary : Colors.white,
          borderRadius: BorderRadius.circular(SizeConfig.r(20)),
          border: isSelected
              ? null
              : Border.all(color: _PaNotificationColors.chipBorder),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              label,
              style: TextStyle(
                fontSize: SizeConfig.sp(13),
                fontWeight: FontWeight.w600,
                color: isSelected ? Colors.white : AppColors.textMedium,
              ),
            ),
            if (badge != null) ...[
              SizedBox(width: SizeConfig.r(6)),
              Container(
                width: SizeConfig.r(18),
                height: SizeConfig.r(18),
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: isSelected
                      ? Colors.white.withValues(alpha: 0.25)
                      : const Color(0xFFF3F4F6),
                  shape: BoxShape.circle,
                ),
                child: Text(
                  badge!,
                  style: TextStyle(
                    fontSize: SizeConfig.sp(10),
                    fontWeight: FontWeight.w600,
                    color: isSelected ? Colors.white : AppColors.textMedium,
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _NotificationCard extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final Color iconBg;
  final String title;
  final String time;
  final bool timeIsPrimary;
  final bool showUnreadDot;
  final String body;
  final bool showActions;

  const _NotificationCard({
    required this.icon,
    required this.iconColor,
    required this.iconBg,
    required this.title,
    required this.time,
    this.timeIsPrimary = false,
    this.showUnreadDot = false,
    required this.body,
    this.showActions = false,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: EdgeInsets.only(bottom: SizeConfig.r(12)),
      padding: EdgeInsets.all(SizeConfig.r(16)),
      decoration: BoxDecoration(
        color: AppColors.background,
        borderRadius: BorderRadius.circular(SizeConfig.radiusLG),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: SizeConfig.r(8),
            offset: Offset(0, SizeConfig.r(2)),
          ),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: SizeConfig.r(44),
            height: SizeConfig.r(44),
            decoration: BoxDecoration(color: iconBg, shape: BoxShape.circle),
            child: Icon(icon, color: iconColor, size: SizeConfig.r(22)),
          ),
          SizedBox(width: SizeConfig.r(12)),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Text(
                        title,
                        style: TextStyle(
                          fontSize: SizeConfig.sp(14),
                          fontWeight: FontWeight.w700,
                          color: AppColors.textDark,
                        ),
                      ),
                    ),
                    SizedBox(width: SizeConfig.r(8)),
                    Text(
                      time,
                      style: TextStyle(
                        fontSize: SizeConfig.sp(11),
                        fontWeight: FontWeight.w500,
                        color: timeIsPrimary
                            ? _PaNotificationColors.primary
                            : AppColors.textLight,
                      ),
                    ),
                    if (showUnreadDot) ...[
                      SizedBox(width: SizeConfig.r(6)),
                      Container(
                        width: SizeConfig.r(8),
                        height: SizeConfig.r(8),
                        margin: EdgeInsets.only(top: SizeConfig.r(4)),
                        decoration: const BoxDecoration(
                          color: _PaNotificationColors.primary,
                          shape: BoxShape.circle,
                        ),
                      ),
                    ],
                  ],
                ),
                SizedBox(height: SizeConfig.r(6)),
                Text(
                  body,
                  style: TextStyle(
                    fontSize: SizeConfig.sp(12),
                    color: AppColors.textMedium,
                    fontWeight: FontWeight.w400,
                    height: 1.4,
                  ),
                ),
                if (showActions) ...[
                  SizedBox(height: SizeConfig.r(14)),
                  Row(
                    children: [
                      Expanded(
                        flex: 7,
                        child: SizedBox(
                          height: SizeConfig.r(40),
                          child: ElevatedButton(
                            onPressed: () {},
                            style: ElevatedButton.styleFrom(
                              backgroundColor: _PaNotificationColors.primary,
                              foregroundColor: Colors.white,
                              elevation: 0,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(
                                  SizeConfig.radius,
                                ),
                              ),
                            ),
                            child: Text(
                              'Accept',
                              style: TextStyle(
                                fontSize: SizeConfig.sp(13),
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        ),
                      ),
                      SizedBox(width: SizeConfig.r(10)),
                      Expanded(
                        flex: 3,
                        child: SizedBox(
                          height: SizeConfig.r(40),
                          child: ElevatedButton(
                            onPressed: () {},
                            style: ElevatedButton.styleFrom(
                              backgroundColor: _PaNotificationColors.declineBg,
                              foregroundColor: AppColors.textMedium,
                              elevation: 0,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(
                                  SizeConfig.radius,
                                ),
                              ),
                            ),
                            child: Text(
                              'Decline',
                              style: TextStyle(
                                fontSize: SizeConfig.sp(13),
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}
