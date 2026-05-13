import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../../providers/auth_provider.dart';
import '../../../../routes/app_routes.dart';
import '../../../../utils/app_colors.dart';
import '../../../../utils/size_confg.dart';
import '../../models/passenger_model.dart';

/// Passenger Assistant — Dashboard
///
/// Renders the PA's home screen using static dummy data while the backend
/// integration is in progress. Mirrors the design provided in the spec
/// screenshot: header → current job card → passengers list → quick actions
/// → SOS emergency button → bottom navigation.
class PaDashboardPage extends StatefulWidget {
  const PaDashboardPage({super.key});

  @override
  State<PaDashboardPage> createState() => _PaDashboardPageState();
}

class _PaDashboardPageState extends State<PaDashboardPage> {
  int _currentTab = 0;

  @override
  Widget build(BuildContext context) {
    SizeConfig.init(context);
    return Scaffold(
      backgroundColor: AppColors.surfaceGray,
      body: SafeArea(
        bottom: false,
        child: Column(
          children: [
            const _PaAppBar(),
            Expanded(
              child: SingleChildScrollView(
                padding: EdgeInsets.symmetric(
                  horizontal: SizeConfig.hPad,
                  vertical: SizeConfig.spaceSM,
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const _CurrentJobCard(job: PaDashboardDummyData.currentJob),
                    SizedBox(height: SizeConfig.r(20)),
                    const _PassengersSection(
                      passengers: PaDashboardDummyData.passengers,
                    ),
                    SizedBox(height: SizeConfig.r(20)),
                    const _QuickActionsSection(),
                    SizedBox(height: SizeConfig.r(18)),
                    const _SosButton(),
                    SizedBox(height: SizeConfig.spaceMD),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
      bottomNavigationBar: _PaBottomNav(
        currentIndex: _currentTab,
        onTap: (i) => setState(() => _currentTab = i),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// App Bar
// ─────────────────────────────────────────────────────────────────────────────

class _PaAppBar extends StatelessWidget {
  const _PaAppBar();

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
          CircleAvatar(
            radius: SizeConfig.r(22),
            backgroundColor: AppColors.primaryLight,
            child: Icon(
              Icons.person,
              color: AppColors.primary,
              size: SizeConfig.r(24),
            ),
          ),
          SizedBox(width: SizeConfig.r(10)),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  PaDashboardDummyData.paName,
                  style: TextStyle(
                    fontSize: SizeConfig.sp(16),
                    fontWeight: FontWeight.w700,
                    color: AppColors.textDark,
                  ),
                ),
                SizedBox(height: SizeConfig.r(3)),
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
                      PaDashboardDummyData.onShift ? 'On Shift' : 'Off Shift',
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
          GestureDetector(
            onTap: () async {
              await context.read<AuthProvider>().logout();
              if (!context.mounted) return;
              Navigator.pushNamedAndRemoveUntil(
                context,
                AppRoutes.login,
                (route) => false,
              );
            },
            child: Icon(
              Icons.logout,
              color: AppColors.primary,
              size: SizeConfig.r(22),
            ),
          ),
          SizedBox(width: SizeConfig.r(14)),
          _NotificationBell(count: PaDashboardDummyData.notificationCount),
        ],
      ),
    );
  }
}

class _NotificationBell extends StatelessWidget {
  final int count;
  const _NotificationBell({required this.count});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: SizeConfig.r(28),
      height: SizeConfig.r(28),
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          Icon(
            Icons.notifications_outlined,
            color: AppColors.textDark,
            size: SizeConfig.r(26),
          ),
          if (count > 0)
            Positioned(
              right: SizeConfig.r(2),
              top: SizeConfig.r(2),
              child: Container(
                width: SizeConfig.r(9),
                height: SizeConfig.r(9),
                decoration: BoxDecoration(
                  color: AppColors.error,
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: AppColors.background,
                    width: SizeConfig.r(1.5),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Current Job Card
// ─────────────────────────────────────────────────────────────────────────────

class _CurrentJobCard extends StatelessWidget {
  final PaCurrentJob job;
  const _CurrentJobCard({required this.job});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: EdgeInsets.all(SizeConfig.r(18)),
      decoration: BoxDecoration(
        color: AppColors.background,
        borderRadius: BorderRadius.circular(SizeConfig.radiusLG),
        border: Border.all(color: AppColors.inputBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Current Job',
                style: TextStyle(
                  fontSize: SizeConfig.sp(18),
                  fontWeight: FontWeight.w700,
                  color: AppColors.textDark,
                ),
              ),
              _StatusPill(status: job.status),
            ],
          ),
          SizedBox(height: SizeConfig.r(16)),
          _DetailRow(label: 'Route', value: job.routeName),
          SizedBox(height: SizeConfig.r(10)),
          _DetailRow(label: 'Driver', value: job.driverName),
          SizedBox(height: SizeConfig.r(10)),
          _DetailRow(label: 'Pickup Time', value: job.pickupTime),
          SizedBox(height: SizeConfig.r(10)),
          _DetailRow(label: 'Total Students', value: '${job.totalStudents}'),
          SizedBox(height: SizeConfig.r(18)),
          SizedBox(
            width: double.infinity,
            height: SizeConfig.r(48),
            child: ElevatedButton(
              onPressed: () {},
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.success,
                foregroundColor: Colors.white,
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(SizeConfig.radius),
                ),
              ),
              child: Text(
                'Start Job',
                style: TextStyle(
                  fontSize: SizeConfig.sp(15),
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _StatusPill extends StatelessWidget {
  final PaJobStatus status;
  const _StatusPill({required this.status});

  @override
  Widget build(BuildContext context) {
    late final String label;
    late final Color bg;
    late final Color fg;
    switch (status) {
      case PaJobStatus.startingSoon:
        label = 'Starting Soon';
        bg = AppColors.warning.withValues(alpha: 0.15);
        fg = AppColors.warning;
        break;
      case PaJobStatus.inProgress:
        label = 'In Progress';
        bg = AppColors.success.withValues(alpha: 0.15);
        fg = AppColors.success;
        break;
      case PaJobStatus.completed:
        label = 'Completed';
        bg = AppColors.primaryLight;
        fg = AppColors.primaryDark;
        break;
    }

    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: SizeConfig.r(12),
        vertical: SizeConfig.r(6),
      ),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(SizeConfig.r(20)),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: SizeConfig.sp(11),
          fontWeight: FontWeight.w600,
          color: fg,
        ),
      ),
    );
  }
}

class _DetailRow extends StatelessWidget {
  final String label;
  final String value;
  const _DetailRow({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: SizeConfig.sp(13),
            color: AppColors.textMedium,
            fontWeight: FontWeight.w400,
          ),
        ),
        Text(
          value,
          style: TextStyle(
            fontSize: SizeConfig.sp(13),
            color: AppColors.textDark,
            fontWeight: FontWeight.w600,
          ),
        ),
      ],
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Passengers Section
// ─────────────────────────────────────────────────────────────────────────────

class _PassengersSection extends StatelessWidget {
  final List<PassengerModel> passengers;
  const _PassengersSection({required this.passengers});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Passengers (${passengers.length})',
          style: TextStyle(
            fontSize: SizeConfig.sp(17),
            fontWeight: FontWeight.w700,
            color: AppColors.textDark,
          ),
        ),
        SizedBox(height: SizeConfig.r(10)),
        ...passengers.map(
          (p) => Padding(
            padding: EdgeInsets.only(bottom: SizeConfig.r(10)),
            child: _PassengerCard(passenger: p),
          ),
        ),
      ],
    );
  }
}

class _PassengerCard extends StatelessWidget {
  final PassengerModel passenger;
  const _PassengerCard({required this.passenger});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: SizeConfig.r(16),
        vertical: SizeConfig.r(14),
      ),
      decoration: BoxDecoration(
        color: AppColors.background,
        borderRadius: BorderRadius.circular(SizeConfig.radiusLG),
        border: Border.all(color: AppColors.inputBorder),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  passenger.name,
                  style: TextStyle(
                    fontSize: SizeConfig.sp(14),
                    fontWeight: FontWeight.w700,
                    color: AppColors.textDark,
                  ),
                ),
                SizedBox(height: SizeConfig.r(3)),
                Text(
                  passenger.grade,
                  style: TextStyle(
                    fontSize: SizeConfig.sp(12),
                    color: AppColors.textLight,
                  ),
                ),
              ],
            ),
          ),
          _ReadinessBadge(readiness: passenger.readiness),
        ],
      ),
    );
  }
}

class _ReadinessBadge extends StatelessWidget {
  final PassengerReadiness readiness;
  const _ReadinessBadge({required this.readiness});

  @override
  Widget build(BuildContext context) {
    final bool isReady = readiness == PassengerReadiness.ready;
    final Color bg = isReady
        ? AppColors.success.withValues(alpha: 0.15)
        : AppColors.inputBorder;
    final Color fg = isReady ? AppColors.success : AppColors.textMedium;
    final String label = isReady ? 'Ready' : 'Not Ready';

    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: SizeConfig.r(12),
        vertical: SizeConfig.r(6),
      ),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(SizeConfig.r(20)),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: SizeConfig.sp(11),
          fontWeight: FontWeight.w600,
          color: fg,
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Quick Actions Section
// ─────────────────────────────────────────────────────────────────────────────

class _QuickActionsSection extends StatelessWidget {
  const _QuickActionsSection();

  @override
  Widget build(BuildContext context) {
    final actions = <_QuickActionData>[
      _QuickActionData(
        icon: Icons.check_circle,
        label: 'Mark Ready',
        color: AppColors.success,
      ),
      _QuickActionData(
        icon: Icons.sticky_note_2_outlined,
        label: 'Add Note',
        color: AppColors.primary,
      ),
      _QuickActionData(
        icon: Icons.alt_route,
        label: 'View Route',
        color: const Color(0xFF7C3AED),
      ),
      _QuickActionData(
        icon: Icons.phone,
        label: 'Contact Driver',
        color: AppColors.success,
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
        Row(
          children: [
            Expanded(child: _QuickActionCard(data: actions[0])),
            SizedBox(width: SizeConfig.r(10)),
            Expanded(child: _QuickActionCard(data: actions[1])),
          ],
        ),
        SizedBox(height: SizeConfig.r(10)),
        Row(
          children: [
            Expanded(child: _QuickActionCard(data: actions[2])),
            SizedBox(width: SizeConfig.r(10)),
            Expanded(child: _QuickActionCard(data: actions[3])),
          ],
        ),
      ],
    );
  }
}

class _QuickActionData {
  final IconData icon;
  final String label;
  final Color color;
  const _QuickActionData({
    required this.icon,
    required this.label,
    required this.color,
  });
}

class _QuickActionCard extends StatelessWidget {
  final _QuickActionData data;
  const _QuickActionCard({required this.data});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {},
      child: Container(
        padding: EdgeInsets.symmetric(
          vertical: SizeConfig.r(20),
          horizontal: SizeConfig.r(10),
        ),
        decoration: BoxDecoration(
          color: AppColors.background,
          borderRadius: BorderRadius.circular(SizeConfig.radiusLG),
          border: Border.all(color: AppColors.inputBorder),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(data.icon, color: data.color, size: SizeConfig.r(28)),
            SizedBox(height: SizeConfig.r(10)),
            Text(
              data.label,
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: SizeConfig.sp(13),
                fontWeight: FontWeight.w600,
                color: AppColors.textDark,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SOS Button
// ─────────────────────────────────────────────────────────────────────────────

class _SosButton extends StatelessWidget {
  const _SosButton();

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      height: SizeConfig.r(54),
      child: ElevatedButton(
        onPressed: () {},
        style: ElevatedButton.styleFrom(
          backgroundColor: const Color(0xFFEF6B6B),
          foregroundColor: Colors.white,
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(SizeConfig.radius),
          ),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.warning_amber_rounded, size: SizeConfig.r(20)),
            SizedBox(width: SizeConfig.r(8)),
            Text(
              'SOS Emergency',
              style: TextStyle(
                fontSize: SizeConfig.sp(15),
                fontWeight: FontWeight.w700,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Bottom Navigation
// ─────────────────────────────────────────────────────────────────────────────

class _PaBottomNav extends StatelessWidget {
  final int currentIndex;
  final ValueChanged<int> onTap;
  const _PaBottomNav({required this.currentIndex, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.background,
        border: Border(top: BorderSide(color: AppColors.inputBorder)),
      ),
      child: SafeArea(
        top: false,
        child: Padding(
          padding: EdgeInsets.symmetric(vertical: SizeConfig.r(8)),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _NavItem(
                icon: Icons.home_outlined,
                activeIcon: Icons.home,
                label: 'Dashboard',
                isActive: currentIndex == 0,
                onTap: () => onTap(0),
              ),
              _NavItem(
                icon: Icons.groups_outlined,
                activeIcon: Icons.groups,
                label: 'Passengers',
                isActive: currentIndex == 1,
                onTap: () => onTap(1),
              ),
              _NavItem(
                icon: Icons.work_outline,
                activeIcon: Icons.work,
                label: 'Job',
                isActive: currentIndex == 2,
                onTap: () => onTap(2),
              ),
              _NavItem(
                icon: Icons.person_outline,
                activeIcon: Icons.person,
                label: 'Profile',
                isActive: currentIndex == 3,
                onTap: () => onTap(3),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _NavItem extends StatelessWidget {
  final IconData icon;
  final IconData activeIcon;
  final String label;
  final bool isActive;
  final VoidCallback onTap;

  const _NavItem({
    required this.icon,
    required this.activeIcon,
    required this.label,
    required this.isActive,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final Color color = isActive ? AppColors.success : AppColors.textLight;
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: onTap,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            isActive ? activeIcon : icon,
            color: color,
            size: SizeConfig.r(22),
          ),
          SizedBox(height: SizeConfig.r(4)),
          Text(
            label,
            style: TextStyle(
              fontSize: SizeConfig.sp(11),
              fontWeight: isActive ? FontWeight.w700 : FontWeight.w500,
              color: color,
            ),
          ),
        ],
      ),
    );
  }
}
