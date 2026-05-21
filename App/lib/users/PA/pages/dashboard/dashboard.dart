import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../../providers/auth_provider.dart';
import '../../../../routes/app_routes.dart';
import '../../../../utils/app_colors.dart';
import '../../../../utils/shimmer.dart';
import '../../../../utils/size_confg.dart';
import '../../../../providers/pa_job_provider.dart';
import '../../../../model/pa_job_model.dart';

class PaDashboardPage extends StatefulWidget {
  const PaDashboardPage({super.key});

  @override
  State<PaDashboardPage> createState() => _PaDashboardPageState();
}

class _PaDashboardPageState extends State<PaDashboardPage>
    with WidgetsBindingObserver {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _reload();
    });
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state != AppLifecycleState.resumed || !mounted) return;
    context.read<PaJobProvider>().loadJob(silent: true);
  }

  void _reload() {
    if (!mounted) return;
    context.read<PaJobProvider>().loadJob();
  }

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
                    const _CurrentJobCard(),
                    SizedBox(height: SizeConfig.r(20)),
                    const _PassengersSection(),
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
    final auth = context.watch<AuthProvider>();
    return Container(
      color: AppColors.background,
      padding: EdgeInsets.symmetric(
        horizontal: SizeConfig.hPad,
        vertical: SizeConfig.r(12),
      ),
      child: Row(
        children: [
          GestureDetector(
            onTap: () => Navigator.pushNamed(context, AppRoutes.paProfile),
            behavior: HitTestBehavior.opaque,
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
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      auth.userName ?? 'Passenger Assistant',
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
                          'On Shift',
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
              ],
            ),
          ),
          const Spacer(),
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
          GestureDetector(
            onTap: () =>
                Navigator.pushNamed(context, AppRoutes.paNotifications),
            behavior: HitTestBehavior.opaque,
            child: Icon(
              Icons.notifications_outlined,
              color: AppColors.textDark,
              size: SizeConfig.r(26),
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
  const _CurrentJobCard();

  @override
  Widget build(BuildContext context) {
    return Consumer<PaJobProvider>(
      builder: (context, provider, _) {
        if (provider.isLoading) {
          return const _PaCurrentJobCardShell(
            child: PaDashboardCurrentJobCardShimmer(),
          );
        }

        if (provider.error != null) {
          return _PaCurrentJobCardShell(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  provider.error!,
                  style: TextStyle(
                    fontSize: SizeConfig.sp(13),
                    color: AppColors.textMedium,
                  ),
                ),
                SizedBox(height: SizeConfig.r(14)),
                SizedBox(
                  width: double.infinity,
                  height: SizeConfig.r(44),
                  child: ElevatedButton(
                    onPressed: provider.loadJob,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                      elevation: 0,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(SizeConfig.radius),
                      ),
                    ),
                    child: Text(
                      'Retry',
                      style: TextStyle(
                        fontSize: SizeConfig.sp(14),
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          );
        }

        final job = provider.job;

        if (job == null) {
          return Container(
            width: double.infinity,
            padding: EdgeInsets.all(SizeConfig.r(18)),
            decoration: BoxDecoration(
              color: AppColors.primaryLight,
              borderRadius: BorderRadius.circular(SizeConfig.radiusLG),
            ),
            child: Column(
              children: [
                Icon(
                  Icons.assignment_late_outlined,
                  size: SizeConfig.r(40),
                  color: AppColors.primaryDark,
                ),
                SizedBox(height: SizeConfig.r(10)),
                Text(
                  'No job assigned for today',
                  style: TextStyle(
                    fontSize: SizeConfig.sp(14),
                    color: AppColors.primaryDark,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          );
        }

        return _PaCurrentJobCardShell(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        job.isInbound ? 'Evening Run' : 'Morning Run',
                        style: TextStyle(
                          fontSize: SizeConfig.sp(12),
                          color: const Color(0xFF0284C7),
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                  _StatusPill(status: job.displayStatus),
                ],
              ),
              SizedBox(height: SizeConfig.r(16)),
              _DetailRow(
                label: 'Route',
                value: job.jobName,
                icon: Icons.alt_route_outlined,
              ),
              SizedBox(height: SizeConfig.r(10)),
              _DetailRow(
                label: 'Driver',
                value: job.driverName,
                icon: Icons.badge_outlined,
              ),
              SizedBox(height: SizeConfig.r(10)),
              _DetailRow(
                label: 'Start Time',
                value: job.startTime,
                icon: Icons.access_time,
              ),
              SizedBox(height: SizeConfig.r(10)),
              _DetailRow(
                label: 'Total Students',
                value: '${job.totalStudents}',
                icon: Icons.group_outlined,
              ),
              SizedBox(height: SizeConfig.r(18)),
              SizedBox(
                width: double.infinity,
                height: SizeConfig.r(48),
                child: ElevatedButton(
                  onPressed: () async {
                    await Navigator.pushNamed(
                      context,
                      AppRoutes.paCurrentJob,
                    );
                    if (!context.mounted) return;
                    context.read<PaJobProvider>().loadJob(silent: true);
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: Colors.white,
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(SizeConfig.radius),
                    ),
                  ),
                  child: Text(
                    'View Detail',
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
      },
    );
  }
}

class _PaCurrentJobCardShell extends StatelessWidget {
  final Widget child;
  const _PaCurrentJobCardShell({required this.child});

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
          Row(
            children: [
              Icon(
                Icons.assignment_outlined,
                size: SizeConfig.r(16),
                color: AppColors.primaryDark,
              ),
              SizedBox(width: SizeConfig.r(6)),
              Text(
                'Current Job',
                style: TextStyle(
                  fontSize: SizeConfig.sp(18),
                  fontWeight: FontWeight.w700,
                  color: AppColors.primaryDark,
                ),
              ),
            ],
          ),
          SizedBox(height: SizeConfig.r(14)),
          child,
        ],
      ),
    );
  }
}

class _StatusPill extends StatelessWidget {
  final PaJobDisplayStatus status;
  const _StatusPill({required this.status});

  @override
  Widget build(BuildContext context) {
    late final String label;
    late final Color bg;
    late final Color fg;
    late final IconData icon;

    switch (status) {
      case PaJobDisplayStatus.startingSoon:
        label = 'Starting Soon';
        bg = AppColors.warning.withValues(alpha: 0.15);
        fg = AppColors.warning;
        icon = Icons.schedule;
        break;
      case PaJobDisplayStatus.inProgress:
        label = 'In Progress';
        bg = AppColors.success.withValues(alpha: 0.15);
        fg = AppColors.success;
        icon = Icons.play_circle_outline;
        break;
      case PaJobDisplayStatus.droppingOff:
        label = 'Dropping Off';
        bg = const Color(0xFF0284C7).withValues(alpha: 0.12);
        fg = const Color(0xFF0284C7);
        icon = Icons.location_on_outlined;
        break;
      case PaJobDisplayStatus.completed:
        label = 'Completed';
        bg = AppColors.success.withValues(alpha: 0.12);
        fg = AppColors.success;
        icon = Icons.check_circle_outline;
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
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: SizeConfig.r(12), color: fg),
          SizedBox(width: SizeConfig.r(4)),
          Text(
            label,
            style: TextStyle(
              fontSize: SizeConfig.sp(11),
              fontWeight: FontWeight.w600,
              color: fg,
            ),
          ),
        ],
      ),
    );
  }
}

class _DetailRow extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  const _DetailRow({
    required this.label,
    required this.value,
    required this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Row(
          children: [
            Icon(icon, size: SizeConfig.r(14), color: const Color(0xFF0284C7)),
            SizedBox(width: SizeConfig.r(6)),
            Text(
              label,
              style: TextStyle(
                fontSize: SizeConfig.sp(13),
                color: AppColors.textMedium,
              ),
            ),
          ],
        ),
        Flexible(
          child: Text(
            value,
            textAlign: TextAlign.end,
            style: TextStyle(
              fontSize: SizeConfig.sp(13),
              color: AppColors.textDark,
              fontWeight: FontWeight.w600,
            ),
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
  const _PassengersSection();

  @override
  Widget build(BuildContext context) {
    return Consumer<PaJobProvider>(
      builder: (context, provider, _) {
        final showSkeleton = provider.isLoading;
        final job = provider.job;
        final stops = job?.stops ?? [];

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              showSkeleton
                  ? 'Passengers'
                  : 'Passengers (${stops.length})',
              style: TextStyle(
                fontSize: SizeConfig.sp(17),
                fontWeight: FontWeight.w700,
                color: AppColors.textDark,
              ),
            ),
            SizedBox(height: SizeConfig.r(10)),
            if (showSkeleton)
              const PaDashboardPassengersShimmer()
            else if (stops.isEmpty)
              Container(
                width: double.infinity,
                padding: EdgeInsets.all(SizeConfig.r(16)),
                decoration: BoxDecoration(
                  color: AppColors.background,
                  borderRadius: BorderRadius.circular(SizeConfig.radiusLG),
                  border: Border.all(color: AppColors.inputBorder),
                ),
                child: Text(
                  'No passengers scheduled for today.',
                  style: TextStyle(
                    fontSize: SizeConfig.sp(13),
                    color: AppColors.textMedium,
                  ),
                ),
              )
            else
              ...stops.map(
                (stop) => Padding(
                  padding: EdgeInsets.only(bottom: SizeConfig.r(10)),
                  child: _PassengerCard(stop: stop),
                ),
              ),
          ],
        );
      },
    );
  }
}

class _PassengerCard extends StatelessWidget {
  final PaPassengerStop stop;
  const _PassengerCard({required this.stop});

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
                  stop.passengerName,
                  style: TextStyle(
                    fontSize: SizeConfig.sp(14),
                    fontWeight: FontWeight.w700,
                    color: AppColors.textDark,
                  ),
                ),
                SizedBox(height: SizeConfig.r(3)),
                Text(
                  stop.address,
                  style: TextStyle(
                    fontSize: SizeConfig.sp(12),
                    color: AppColors.textLight,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          SizedBox(width: SizeConfig.r(8)),
          // Wheelchair / harness badges
          Row(
            children: [
              if (stop.wheelchairRequired)
                _NeedsBadge(
                  icon: Icons.accessible,
                  label: 'Wheelchair',
                  color: AppColors.primary,
                ),
              if (stop.wheelchairRequired && stop.harnessRequired)
                SizedBox(width: SizeConfig.r(6)),
              if (stop.harnessRequired)
                _NeedsBadge(
                  icon: Icons.safety_check_outlined,
                  label: 'Harness',
                  color: const Color(0xFF7C3AED),
                ),
            ],
          ),
        ],
      ),
    );
  }
}

class _NeedsBadge extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  const _NeedsBadge({
    required this.icon,
    required this.label,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: SizeConfig.r(8),
        vertical: SizeConfig.r(5),
      ),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(SizeConfig.r(20)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: SizeConfig.r(12), color: color),
          SizedBox(width: SizeConfig.r(3)),
          Text(
            label,
            style: TextStyle(
              fontSize: SizeConfig.sp(10),
              fontWeight: FontWeight.w600,
              color: color,
            ),
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Quick Actions Section  (unchanged from original)
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
        label: 'Contact\nDriver',
        color: AppColors.success,
      ),
      _QuickActionData(
        icon: Icons.work_outline,
        label: 'Assigned\nJob',
        color: AppColors.primaryDark,
        onTap: () => Navigator.pushNamed(context, AppRoutes.paAssignedJobs),
      ),
      _QuickActionData(
        icon: Icons.event_available_outlined,
        label: 'Leave',
        color: const Color(0xFFEA580C),
        onTap: () => Navigator.pushNamed(context, AppRoutes.paLeave),
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
        Row(
          children: List.generate(3, (i) {
            return Expanded(
              child: Padding(
                padding: EdgeInsets.only(right: i < 2 ? SizeConfig.r(10) : 0),
                child: _QuickActionCard(data: actions[i + 3]),
              ),
            );
          }),
        ),
      ],
    );
  }
}

class _QuickActionData {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback? onTap;
  const _QuickActionData({
    required this.icon,
    required this.label,
    required this.color,
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
// SOS Button  (unchanged)
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
