import 'package:flutter/material.dart';
import '../../../../components/app_button.dart';
import '../../../../routes/app_routes.dart';
import '../../../../utils/app_colors.dart';
import '../../../../utils/size_confg.dart';

class DriverDashboardPage extends StatelessWidget {
  const DriverDashboardPage({super.key});

  @override
  Widget build(BuildContext context) {
    SizeConfig.init(context);
    return Scaffold(
      backgroundColor: AppColors.surfaceGray,
      body: SafeArea(
        child: Column(
          children: [
            _DashboardAppBar(),
            Expanded(
              child: SingleChildScrollView(
                padding: EdgeInsets.symmetric(
                  horizontal: SizeConfig.hPad,
                  vertical: SizeConfig.spaceSM,
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _CurrentJobCard(),
                    SizedBox(height: SizeConfig.spaceSM),
                    _StatsGrid(),
                    SizedBox(height: SizeConfig.spaceSM),
                    _JobRequestsSection(),
                    SizedBox(height: SizeConfig.spaceSM),
                    _QuickActionsSection(),
                    SizedBox(height: SizeConfig.spaceMD),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// App Bar
// ─────────────────────────────────────────────────────────────────────────────

class _DashboardAppBar extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      color: AppColors.background,
      padding: EdgeInsets.symmetric(
        horizontal: SizeConfig.hPad,
        vertical: SizeConfig.r(12),
      ),
      child: Row(
        children: [
          // Avatar — tap to open profile
          GestureDetector(
            onTap: () => Navigator.pushNamed(context, AppRoutes.driverProfile),
            child: CircleAvatar(
              radius: SizeConfig.r(22),
              backgroundColor: AppColors.primaryLight,
              child: Icon(
                Icons.person,
                color: AppColors.primary,
                size: SizeConfig.r(24),
              ),
            ),
          ),
          SizedBox(width: SizeConfig.r(10)),
          // Name + Status
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Marcus Johnson',
                  style: TextStyle(
                    fontSize: SizeConfig.sp(15),
                    fontWeight: FontWeight.w700,
                    color: AppColors.textDark,
                  ),
                ),
                SizedBox(height: SizeConfig.r(2)),
                Row(
                  children: [
                    Container(
                      width: SizeConfig.r(8),
                      height: SizeConfig.r(8),
                      decoration: const BoxDecoration(
                        color: AppColors.success,
                        shape: BoxShape.circle,
                      ),
                    ),
                    SizedBox(width: SizeConfig.r(5)),
                    Text(
                      'On Duty',
                      style: TextStyle(
                        fontSize: SizeConfig.sp(12),
                        fontWeight: FontWeight.w500,
                        color: AppColors.success,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          // Leave button
          GestureDetector(
            onTap: () {},
            child: Row(
              children: [
                Icon(
                  Icons.logout,
                  color: AppColors.primary,
                  size: SizeConfig.r(18),
                ),
              ],
            ),
          ),
          SizedBox(width: SizeConfig.r(14)),
          // Notification bell
          _BadgeIcon(
            icon: Icons.notifications_outlined,
            badgeColor: AppColors.warning,
            badgeLabel: '2',
          ),
        ],
      ),
    );
  }
}

class _BadgeIcon extends StatelessWidget {
  final IconData icon;
  final Color badgeColor;
  final String badgeLabel;

  const _BadgeIcon({
    required this.icon,
    required this.badgeColor,
    required this.badgeLabel,
  });

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        Icon(icon, color: AppColors.textDark, size: SizeConfig.r(24)),
        Positioned(
          right: 0,
          top: 0,
          child: Container(
            padding: EdgeInsets.all(SizeConfig.r(2)),
            decoration: BoxDecoration(
              color: badgeColor,
              shape: BoxShape.circle,
            ),
            constraints: BoxConstraints(
              minWidth: SizeConfig.r(16),
              minHeight: SizeConfig.r(16),
            ),
            child: Text(
              badgeLabel,
              style: TextStyle(
                color: Colors.white,
                fontSize: SizeConfig.sp(9),
                fontWeight: FontWeight.w700,
              ),
              textAlign: TextAlign.center,
            ),
          ),
        ),
      ],
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Current Job Card
// ─────────────────────────────────────────────────────────────────────────────

class _CurrentJobCard extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: EdgeInsets.all(SizeConfig.r(18)),
      decoration: BoxDecoration(
        color: AppColors.primaryLight,
        borderRadius: BorderRadius.circular(SizeConfig.radiusLG),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Current Job',
            style: TextStyle(
              fontSize: SizeConfig.sp(16),
              fontWeight: FontWeight.w700,
              color: AppColors.primaryDark,
            ),
          ),
          SizedBox(height: SizeConfig.r(14)),
          _JobInfoRow(icon: Icons.access_time, label: 'Next pickup: 8:15 AM'),
          SizedBox(height: SizeConfig.r(9)),
          _JobInfoRow(icon: Icons.badge_outlined, label: 'Job ID: R-2024-001'),
          SizedBox(height: SizeConfig.r(9)),
          _JobInfoRow(icon: Icons.group_outlined, label: '5 students'),
          SizedBox(height: SizeConfig.r(9)),
          _JobInfoRow(icon: Icons.person_outline, label: 'PA: Sarah Miller'),
          SizedBox(height: SizeConfig.r(18)),
          AppButton(
            label: 'Start Job',
            height: SizeConfig.r(46),
            borderRadius: SizeConfig.radius,
            trailingIcon: Icon(
              Icons.arrow_forward,
              color: Colors.white,
              size: SizeConfig.r(18),
            ),
            onPressed: () =>
                Navigator.pushNamed(context, AppRoutes.routeDetail),
          ),
        ],
      ),
    );
  }
}

class _JobInfoRow extends StatelessWidget {
  final IconData icon;
  final String label;

  const _JobInfoRow({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, color: const Color(0xFF0284C7), size: SizeConfig.r(16)),
        SizedBox(width: SizeConfig.r(8)),
        Text(
          label,
          style: TextStyle(
            fontSize: SizeConfig.sp(13),
            color: AppColors.textDark,
            fontWeight: FontWeight.w400,
          ),
        ),
      ],
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Stats Grid
// ─────────────────────────────────────────────────────────────────────────────

class _StatsGrid extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final stats = [
      _StatData(
        icon: Icons.directions_car,
        iconColor: AppColors.primary,
        count: '2',
        label: 'Jobs Today',
      ),
      _StatData(
        icon: Icons.assignment_outlined,
        iconColor: AppColors.warning,
        count: '3',
        label: 'Assigned Requests',
      ),
      _StatData(
        icon: Icons.format_list_bulleted,
        iconColor: AppColors.primaryDark,
        count: '2',
        label: 'Checklist Pending',
        onTap: () => Navigator.pushNamed(context, AppRoutes.vehicleChecklist),
      ),
      _StatData(
        icon: Icons.check_circle,
        iconColor: AppColors.success,
        count: '12',
        label: 'Completed Jobs',
      ),
    ];

    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: stats.length,
      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        mainAxisSpacing: SizeConfig.r(10),
        crossAxisSpacing: SizeConfig.r(10),
        childAspectRatio: 1.35,
      ),
      itemBuilder: (_, i) => _StatCard(data: stats[i]),
    );
  }
}

class _StatData {
  final IconData icon;
  final Color iconColor;
  final String count;
  final String label;
  final VoidCallback? onTap;

  const _StatData({
    required this.icon,
    required this.iconColor,
    required this.count,
    required this.label,
    this.onTap,
  });
}

class _StatCard extends StatelessWidget {
  final _StatData data;

  const _StatCard({required this.data});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: data.onTap,
      child: Container(
        padding: EdgeInsets.all(SizeConfig.r(14)),
        decoration: BoxDecoration(
          color: AppColors.background,
          borderRadius: BorderRadius.circular(SizeConfig.radiusLG),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.05),
              blurRadius: 6,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(data.icon, color: data.iconColor, size: SizeConfig.r(20)),
            SizedBox(height: SizeConfig.r(8)),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  data.count,
                  style: TextStyle(
                    fontSize: SizeConfig.sp(24),
                    fontWeight: FontWeight.w800,
                    color: AppColors.textDark,
                    height: 1.1,
                  ),
                ),
                Text(
                  data.label,
                  style: TextStyle(
                    fontSize: SizeConfig.sp(12),
                    fontWeight: FontWeight.w500,
                    color: AppColors.textMedium,
                  ),
                ),
                SizedBox(height: SizeConfig.r(2)),
                Text(
                  'Updated just now',
                  style: TextStyle(
                    fontSize: SizeConfig.sp(10),
                    color: AppColors.textLight,
                  ),
                ),
              ],
            ),
          ],
        ),
      ), // Container
    ); // GestureDetector
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Job Requests Section
// ─────────────────────────────────────────────────────────────────────────────

class _JobRequestsSection extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Job Requests',
          style: TextStyle(
            fontSize: SizeConfig.sp(17),
            fontWeight: FontWeight.w700,
            color: AppColors.textDark,
          ),
        ),
        SizedBox(height: SizeConfig.r(10)),
        _JobRequestCard(
          price: '\$45.00',
          pickup: 'Lincoln Elementary',
          dropoff: 'Washington High',
          time: '7:30 AM • 8 students',
        ),
        SizedBox(height: SizeConfig.r(10)),
        _JobRequestCard(
          price: '\$38.50',
          pickup: 'Roosevelt Middle',
          dropoff: 'Kennedy Elementary',
          time: '3:15 PM • 12 students',
        ),
      ],
    );
  }
}

class _JobRequestCard extends StatelessWidget {
  final String price;
  final String pickup;
  final String dropoff;
  final String time;

  const _JobRequestCard({
    required this.price,
    required this.pickup,
    required this.dropoff,
    required this.time,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.all(SizeConfig.r(16)),
      decoration: BoxDecoration(
        color: AppColors.background,
        borderRadius: BorderRadius.circular(SizeConfig.radiusLG),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Badge + Price row
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: EdgeInsets.symmetric(
                  horizontal: SizeConfig.r(10),
                  vertical: SizeConfig.r(4),
                ),
                decoration: BoxDecoration(
                  color: AppColors.primary,
                  borderRadius: BorderRadius.circular(SizeConfig.r(20)),
                ),
                child: Text(
                  'New',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: SizeConfig.sp(11),
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
              Text(
                price,
                style: TextStyle(
                  fontSize: SizeConfig.sp(16),
                  fontWeight: FontWeight.w700,
                  color: AppColors.textDark,
                ),
              ),
            ],
          ),
          SizedBox(height: SizeConfig.r(12)),
          // Pickup row
          Row(
            children: [
              Container(
                width: SizeConfig.r(10),
                height: SizeConfig.r(10),
                decoration: const BoxDecoration(
                  color: AppColors.success,
                  shape: BoxShape.circle,
                ),
              ),
              SizedBox(width: SizeConfig.r(8)),
              Text(
                'Pickup: $pickup',
                style: TextStyle(
                  fontSize: SizeConfig.sp(13),
                  color: AppColors.textMedium,
                ),
              ),
            ],
          ),
          SizedBox(height: SizeConfig.r(7)),
          // Drop-off row
          Row(
            children: [
              Container(
                width: SizeConfig.r(10),
                height: SizeConfig.r(10),
                decoration: const BoxDecoration(
                  color: AppColors.error,
                  shape: BoxShape.circle,
                ),
              ),
              SizedBox(width: SizeConfig.r(8)),
              Text(
                'Drop-off: $dropoff',
                style: TextStyle(
                  fontSize: SizeConfig.sp(13),
                  color: AppColors.textMedium,
                ),
              ),
            ],
          ),
          SizedBox(height: SizeConfig.r(7)),
          // Time row
          Row(
            children: [
              Icon(
                Icons.access_time,
                size: SizeConfig.r(14),
                color: AppColors.textLight,
              ),
              SizedBox(width: SizeConfig.r(6)),
              Text(
                time,
                style: TextStyle(
                  fontSize: SizeConfig.sp(13),
                  color: AppColors.textLight,
                ),
              ),
            ],
          ),
          SizedBox(height: SizeConfig.r(14)),
          AppButton(
            label: 'Review Request',
            height: SizeConfig.r(44),
            borderRadius: SizeConfig.radius,
            onPressed: () =>
                Navigator.pushNamed(context, AppRoutes.requestedJobs),
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Quick Actions Section
// ─────────────────────────────────────────────────────────────────────────────

class _QuickActionsSection extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final actions = [
      _QuickActionData(
        icon: Icons.play_arrow_rounded,
        label: 'Start Ride',
        iconBgColor: AppColors.success,
        onTap: () => Navigator.pushNamed(context, AppRoutes.routeDetail),
      ),
      _QuickActionData(
        icon: Icons.assignment_outlined,
        label: 'Vehicle\nChecklist',
        iconBgColor: AppColors.primary,
        onTap: () => Navigator.pushNamed(context, AppRoutes.vehicleChecklist),
      ),
      _QuickActionData(
        icon: Icons.alt_route,
        label: 'View Routes',
        iconBgColor: const Color(0xFF7C3AED),
      ),
      _QuickActionData(
        icon: Icons.warning_amber_rounded,
        label: 'Report\nIssue',
        iconBgColor: AppColors.warning,
      ),
      _QuickActionData(
        icon: Icons.phone,
        label: 'SOS',
        iconBgColor: AppColors.error,
        onTap: () => Navigator.pushNamed(context, AppRoutes.sos),
      ),
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Quick Actions',
          style: TextStyle(
            fontSize: SizeConfig.sp(17),
            fontWeight: FontWeight.w700,
            color: AppColors.textDark,
          ),
        ),
        SizedBox(height: SizeConfig.r(10)),
        // Row 1: 3 items
        Row(
          children: List.generate(3, (i) {
            return Expanded(
              child: Padding(
                padding: EdgeInsets.only(right: i < 2 ? SizeConfig.r(10) : 0),
                child: _QuickActionCard(data: actions[i]),
              ),
            );
          }),
        ),
        SizedBox(height: SizeConfig.r(10)),
        // Row 2: 2 items (left-aligned in same 3-col grid)
        Row(
          children: [
            Expanded(child: _QuickActionCard(data: actions[3])),
            SizedBox(width: SizeConfig.r(10)),
            Expanded(child: _QuickActionCard(data: actions[4])),
            Expanded(child: const SizedBox()),
          ],
        ),
      ],
    );
  }
}

class _QuickActionData {
  final IconData icon;
  final String label;
  final Color iconBgColor;
  final VoidCallback? onTap;

  const _QuickActionData({
    required this.icon,
    required this.label,
    required this.iconBgColor,
    this.onTap,
  });
}

class _QuickActionCard extends StatelessWidget {
  final _QuickActionData data;

  const _QuickActionCard({required this.data});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: data.onTap,
      child: Container(
        padding: EdgeInsets.symmetric(
          vertical: SizeConfig.r(14),
          horizontal: SizeConfig.r(8),
        ),
        decoration: BoxDecoration(
          color: AppColors.background,
          borderRadius: BorderRadius.circular(SizeConfig.radiusLG),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.05),
              blurRadius: 6,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: SizeConfig.r(44),
              height: SizeConfig.r(44),
              decoration: BoxDecoration(
                color: data.iconBgColor.withValues(alpha: 0.12),
                shape: BoxShape.circle,
              ),
              child: Icon(
                data.icon,
                color: data.iconBgColor,
                size: SizeConfig.r(22),
              ),
            ),
            SizedBox(height: SizeConfig.r(8)),
            Text(
              data.label,
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: SizeConfig.sp(11),
                fontWeight: FontWeight.w600,
                color: AppColors.textDark,
                height: 1.3,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
