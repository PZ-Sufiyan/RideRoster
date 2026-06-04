import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../../components/app_button.dart';
import '../../../../components/offline_banner.dart';
import '../../../../providers/auth_provider.dart';
import '../../../../providers/job_provider.dart';
import '../../../../repositories/local_job_repository.dart';
import '../../../../routes/app_routes.dart';
import '../../../../services/dashboard_stats_service.dart';
import '../../../../services/driver_job_request_service.dart';
import '../../../../utils/app_colors.dart';
import '../../../../utils/shimmer.dart';
import '../../../../utils/size_confg.dart';
import '../../../../model/job_request_model.dart';
import 'vehicle_check_list.dart';

Future<void> _pushVehicleChecklist(BuildContext context) {
  final localRepo = context.read<LocalJobRepository>();
  return Navigator.push(
    context,
    MaterialPageRoute(
      builder: (_) => VehicleCheckListPage(localRepo: localRepo),
    ),
  );
}

class DriverDashboardPage extends StatefulWidget {
  const DriverDashboardPage({super.key});

  @override
  State<DriverDashboardPage> createState() => _DriverDashboardPageState();
}

class _DriverDashboardPageState extends State<DriverDashboardPage>
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
    context.read<JobProvider>().loadJob(silent: true);
  }

  /// Reload job card after actions that don't yet bump [JobProvider.jobDataEpoch]
  /// the same frame (e.g. returning from job review). Stats & requests sync via epoch.
  void _reload() {
    if (!mounted) return;
    context.read<JobProvider>().loadJob();
  }

  @override
  Widget build(BuildContext context) {
    SizeConfig.init(context);
    return Scaffold(
      backgroundColor: AppColors.surfaceGray,
      body: SafeArea(
        child: Column(
          children: [
            const OfflineBanner(),
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
                    _JobRequestsSection(onJobAccepted: _reload),
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
    final driverName = context.watch<AuthProvider>().userName?.trim();
    final displayName = (driverName == null || driverName.isEmpty)
        ? 'Driver'
        : driverName;

    return Container(
      color: AppColors.background,
      padding: EdgeInsets.symmetric(
        horizontal: SizeConfig.hPad,
        vertical: SizeConfig.r(12),
      ),
      child: Row(
        children: [
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
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  displayName,
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
              size: SizeConfig.r(18),
            ),
          ),
          SizedBox(width: SizeConfig.r(14)),
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
    return Consumer<JobProvider>(
      builder: (context, provider, _) {
        if (provider.isLoading) {
          return _CurrentJobCardShell(
            child: const DashboardCurrentJobCardShimmer(),
          );
        }

        if (provider.error != null) {
          return _CurrentJobCardShell(
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
                AppButton(
                  label: 'Retry',
                  height: SizeConfig.r(42),
                  borderRadius: SizeConfig.radius,
                  onPressed: provider.loadJob,
                ),
              ],
            ),
          );
        }

        final job = provider.job;

        if (job == null) {
          return _CurrentJobCardShell(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'No active job assigned for today.',
                  style: TextStyle(
                    fontSize: SizeConfig.sp(13),
                    color: AppColors.textMedium,
                  ),
                ),
                SizedBox(height: SizeConfig.r(10)),
                Text(
                  'Check Job Requests below to accept upcoming jobs.',
                  style: TextStyle(
                    fontSize: SizeConfig.sp(12),
                    color: AppColors.textLight,
                  ),
                ),
              ],
            ),
          );
        }

        final isDropoffPhase = job.isDropoffPhase;
        final directionLabel = job.direction == 'outbound'
            ? 'Morning Run'
            : 'Evening Run';
        final primaryTimeLabel = isDropoffPhase
            ? 'Drop-off ETA: ${job.dropoffEta}'
            : 'Next pickup: ${job.nextPickupTime}';
        final actionLabel = isDropoffPhase ? 'Go to Drop-off' : 'Start Run';
        final actionRoute = isDropoffPhase
            ? AppRoutes.completeJob
            : AppRoutes.routeDetail;
        final sessionActive = provider.sessionStarted;
        final checklistDone = provider.checklistCompletedToday;
        final isStartAction = !isDropoffPhase;
        final buttonBlocked = isStartAction && !checklistDone && !sessionActive;

        return _CurrentJobCardShell(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    padding: EdgeInsets.symmetric(
                      horizontal: SizeConfig.r(8),
                      vertical: SizeConfig.r(3),
                    ),
                    decoration: BoxDecoration(
                      color: job.direction == 'outbound'
                          ? const Color(0xFF0284C7).withValues(alpha: 0.12)
                          : AppColors.warning.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(SizeConfig.r(4)),
                    ),
                    child: Text(
                      directionLabel,
                      style: TextStyle(
                        fontSize: SizeConfig.sp(11),
                        fontWeight: FontWeight.w600,
                        color: job.direction == 'outbound'
                            ? const Color(0xFF0284C7)
                            : AppColors.warning,
                      ),
                    ),
                  ),
                  if (sessionActive) ...[
                    SizedBox(width: SizeConfig.r(8)),
                    Container(
                      padding: EdgeInsets.symmetric(
                        horizontal: SizeConfig.r(8),
                        vertical: SizeConfig.r(3),
                      ),
                      decoration: BoxDecoration(
                        color: AppColors.success.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(SizeConfig.r(4)),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Container(
                            width: SizeConfig.r(6),
                            height: SizeConfig.r(6),
                            decoration: const BoxDecoration(
                              color: AppColors.success,
                              shape: BoxShape.circle,
                            ),
                          ),
                          SizedBox(width: SizeConfig.r(4)),
                          Text(
                            'In Progress',
                            style: TextStyle(
                              fontSize: SizeConfig.sp(11),
                              fontWeight: FontWeight.w600,
                              color: AppColors.success,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ],
              ),
              SizedBox(height: SizeConfig.r(12)),
              _JobInfoRow(icon: Icons.access_time, label: primaryTimeLabel),
              SizedBox(height: SizeConfig.r(9)),
              _JobInfoRow(
                icon: Icons.badge_outlined,
                label: 'Job ID: ${job.jobId}',
              ),
              SizedBox(height: SizeConfig.r(9)),
              _JobInfoRow(
                icon: Icons.group_outlined,
                label:
                    '${job.totalPickups} student${job.totalPickups == 1 ? '' : 's'}',
              ),
              SizedBox(height: SizeConfig.r(9)),
              _JobInfoRow(
                icon: isDropoffPhase
                    ? Icons.location_on_outlined
                    : Icons.person_outline,
                label: isDropoffPhase
                    ? 'Drop-off: ${job.dropoffLocation}'
                    : 'PA: ${job.paName}',
              ),
              if (sessionActive && job.totalPickups > 0) ...[
                SizedBox(height: SizeConfig.r(12)),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Picked up ${job.completedCount} of ${job.totalPickups}',
                      style: TextStyle(
                        fontSize: SizeConfig.sp(12),
                        color: AppColors.textMedium,
                      ),
                    ),
                    Text(
                      '${(job.progressFraction * 100).round()}%',
                      style: TextStyle(
                        fontSize: SizeConfig.sp(12),
                        fontWeight: FontWeight.w600,
                        color: const Color(0xFF0284C7),
                      ),
                    ),
                  ],
                ),
                SizedBox(height: SizeConfig.r(6)),
                ClipRRect(
                  borderRadius: BorderRadius.circular(SizeConfig.r(4)),
                  child: LinearProgressIndicator(
                    value: job.progressFraction,
                    minHeight: SizeConfig.r(5),
                    backgroundColor: AppColors.inputBorder,
                    valueColor: const AlwaysStoppedAnimation<Color>(
                      Color(0xFF0284C7),
                    ),
                  ),
                ),
              ],
              if (buttonBlocked) ...[
                SizedBox(height: SizeConfig.r(10)),
                Container(
                  padding: EdgeInsets.all(SizeConfig.r(10)),
                  margin: EdgeInsets.only(bottom: SizeConfig.r(10)),
                  decoration: BoxDecoration(
                    color: AppColors.warning.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(SizeConfig.r(8)),
                    border: Border.all(
                      color: AppColors.warning.withValues(alpha: 0.4),
                    ),
                  ),
                  child: Row(
                    children: [
                      Icon(
                        Icons.warning_amber_rounded,
                        color: AppColors.warning,
                        size: SizeConfig.r(16),
                      ),
                      SizedBox(width: SizeConfig.r(8)),
                      Expanded(
                        child: Text(
                          'Complete today\'s safety checklist before starting your run.',
                          style: TextStyle(
                            fontSize: SizeConfig.sp(12),
                            color: AppColors.textDark,
                            height: 1.3,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
              SizedBox(height: SizeConfig.r(18)),
              AppButton(
                label: buttonBlocked ? 'Checklist Required' : actionLabel,
                height: SizeConfig.r(46),
                borderRadius: SizeConfig.radius,
                backgroundColor: buttonBlocked ? AppColors.textLight : null,
                trailingIcon: buttonBlocked
                    ? null
                    : Icon(
                        Icons.arrow_forward,
                        color: Colors.white,
                        size: SizeConfig.r(18),
                      ),
                onPressed: () {
                  if (buttonBlocked) {
                    _pushVehicleChecklist(context).then((_) {
                      if (!context.mounted) return;
                      context.read<JobProvider>().loadJob(silent: true);
                    });
                  } else {
                    Navigator.pushNamed(context, actionRoute);
                  }
                },
              ),
            ],
          ),
        );
      },
    );
  }
}

class _CurrentJobCardShell extends StatelessWidget {
  final Widget child;
  const _CurrentJobCardShell({required this.child});

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
          child,
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
        Expanded(
          child: Text(
            label,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(
              fontSize: SizeConfig.sp(13),
              color: AppColors.textDark,
              fontWeight: FontWeight.w400,
            ),
          ),
        ),
      ],
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Stats Grid
// ─────────────────────────────────────────────────────────────────────────────

class _StatsGrid extends StatefulWidget {
  @override
  State<_StatsGrid> createState() => _StatsGridState();
}

class _StatsGridState extends State<_StatsGrid> {
  static DashboardStats? _cachedStats;
  static bool _cachedStatsLoaded = false;

  late final DashboardStatsService _statsService;
  DashboardStats? _stats = _cachedStats;
  bool _statsFirstLoadDone = _cachedStatsLoaded;
  late final JobProvider _jobProvider;
  late final VoidCallback _onJobDataEpochChanged;
  int _lastSyncedJobDataEpoch = -1;

  @override
  void initState() {
    super.initState();
    _statsService = DashboardStatsService(context.read<LocalJobRepository>());
    _jobProvider = context.read<JobProvider>();
    _lastSyncedJobDataEpoch = _jobProvider.jobDataEpoch;
    _fetchStats();
    _onJobDataEpochChanged = () {
      final epoch = _jobProvider.jobDataEpoch;
      if (epoch == _lastSyncedJobDataEpoch) return;
      _lastSyncedJobDataEpoch = epoch;
      if (!mounted) return;
      _fetchStats(isBackground: true);
    };
    _jobProvider.addListener(_onJobDataEpochChanged);
  }

  @override
  void dispose() {
    _jobProvider.removeListener(_onJobDataEpochChanged);
    super.dispose();
  }

  Future<void> _fetchStats({bool isBackground = false}) async {
    try {
      final stats = await _statsService.fetchStats();
      if (!mounted) return;
      setState(() {
        _stats = stats;
        _statsFirstLoadDone = true;
        _cachedStats = stats;
        _cachedStatsLoaded = true;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        if (!_statsFirstLoadDone) {
          _stats = DashboardStats.empty;
          _statsFirstLoadDone = true;
          _cachedStats = _stats;
          _cachedStatsLoaded = true;
        }
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (!_statsFirstLoadDone || _stats == null) {
      return const DashboardStatsGridShimmer();
    }

    final stats = _stats!;
    final checklistDone = context.watch<JobProvider>().checklistCompletedToday;

    final cards = [
      _StatData(
        icon: Icons.directions_car,
        iconColor: AppColors.primary,
        count: '${stats.jobsToday}',
        label: 'Jobs Today',
      ),
      _StatData(
        icon: Icons.assignment_outlined,
        iconColor: AppColors.warning,
        count: '${stats.pendingRequests}',
        label: 'Pending Requests',
      ),
      _StatData(
        icon: Icons.format_list_bulleted,
        iconColor: checklistDone ? AppColors.success : AppColors.warning,
        count: checklistDone ? '✓' : '1',
        label: 'Checklist Pending',
        onTap: () => _pushVehicleChecklist(context),
      ),
      _StatData(
        icon: Icons.check_circle,
        iconColor: AppColors.success,
        count: '${stats.completedJobs}',
        label: 'Completed Jobs',
      ),
    ];

    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: cards.length,
      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        mainAxisSpacing: SizeConfig.r(10),
        crossAxisSpacing: SizeConfig.r(10),
        childAspectRatio: 1.35,
      ),
      itemBuilder: (_, i) => _StatCard(data: cards[i]),
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
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Job Requests Section
// ─────────────────────────────────────────────────────────────────────────────

class _JobRequestsSection extends StatefulWidget {
  /// Called when a job request is accepted so the dashboard can reload.
  final VoidCallback onJobAccepted;
  const _JobRequestsSection({required this.onJobAccepted});

  @override
  State<_JobRequestsSection> createState() => _JobRequestsSectionState();
}

class _JobRequestsSectionState extends State<_JobRequestsSection> {
  static List<DriverJobRequest>? _cachedRequests;
  static bool _cachedRequestsLoaded = false;

  final DriverJobRequestService _service = DriverJobRequestService();
  List<DriverJobRequest>? _requests = _cachedRequests;
  bool _requestsFirstLoadDone = _cachedRequestsLoaded;
  bool _requestsLoadFailed = false;
  late final JobProvider _jobProvider;
  late final VoidCallback _onJobDataEpochChanged;
  int _lastSyncedJobDataEpoch = -1;

  @override
  void initState() {
    super.initState();
    _jobProvider = context.read<JobProvider>();
    _lastSyncedJobDataEpoch = _jobProvider.jobDataEpoch;
    _fetchRequests();
    _onJobDataEpochChanged = () {
      final epoch = _jobProvider.jobDataEpoch;
      if (epoch == _lastSyncedJobDataEpoch) return;
      _lastSyncedJobDataEpoch = epoch;
      if (!mounted) return;
      _fetchRequests(isBackground: true);
    };
    _jobProvider.addListener(_onJobDataEpochChanged);
  }

  @override
  void dispose() {
    _jobProvider.removeListener(_onJobDataEpochChanged);
    super.dispose();
  }

  Future<void> _fetchRequests({bool isBackground = false}) async {
    final driverId = context.read<AuthProvider>().userId;
    if (driverId == null || driverId.trim().isEmpty) {
      if (!mounted) return;
      setState(() {
        _requests = [];
        _requestsFirstLoadDone = true;
        _requestsLoadFailed = false;
        _cachedRequests = _requests;
        _cachedRequestsLoaded = true;
      });
      return;
    }

    try {
      final list = await _service.fetchPendingRequests(driverId: driverId);
      if (!mounted) return;
      setState(() {
        _requests = list;
        _requestsFirstLoadDone = true;
        _requestsLoadFailed = false;
        _cachedRequests = list;
        _cachedRequestsLoaded = true;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        if (!isBackground) {
          _requestsLoadFailed = true;
          _requestsFirstLoadDone = true;
        }
      });
    }
  }

  Future<void> _refreshRequests() async {
    await _fetchRequests(isBackground: _requestsFirstLoadDone);
    widget.onJobAccepted();
  }

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
        if (!_requestsFirstLoadDone)
          const DashboardJobRequestsShimmer()
        else if (_requestsLoadFailed && _requests == null)
          _RequestsErrorCard(onRetry: _refreshRequests)
        else ...[
          if ((_requests ?? []).isEmpty)
            Container(
              width: double.infinity,
              padding: EdgeInsets.all(SizeConfig.r(14)),
              decoration: BoxDecoration(
                color: AppColors.background,
                borderRadius: BorderRadius.circular(SizeConfig.radiusLG),
              ),
              child: Text(
                'No pending job requests.',
                style: TextStyle(
                  fontSize: SizeConfig.sp(13),
                  color: AppColors.textMedium,
                ),
              ),
            )
          else
            Column(
              children: _requests!
                  .map(
                    (request) => Padding(
                      padding: EdgeInsets.only(bottom: SizeConfig.r(10)),
                      child: _JobRequestCard(
                        request: request,
                        onReviewed: _refreshRequests,
                      ),
                    ),
                  )
                  .toList(),
            ),
        ],
      ],
    );
  }
}

class _RequestsErrorCard extends StatelessWidget {
  final VoidCallback onRetry;
  const _RequestsErrorCard({required this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: EdgeInsets.all(SizeConfig.r(14)),
      decoration: BoxDecoration(
        color: AppColors.background,
        borderRadius: BorderRadius.circular(SizeConfig.radiusLG),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Unable to load job requests.',
            style: TextStyle(
              fontSize: SizeConfig.sp(13),
              color: AppColors.textMedium,
            ),
          ),
          SizedBox(height: SizeConfig.r(10)),
          AppButton(
            label: 'Retry',
            height: SizeConfig.r(40),
            borderRadius: SizeConfig.radius,
            onPressed: onRetry,
          ),
        ],
      ),
    );
  }
}

class _JobRequestCard extends StatelessWidget {
  final DriverJobRequest request;
  final Future<void> Function() onReviewed;

  const _JobRequestCard({required this.request, required this.onReviewed});

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
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
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
                  if (request.semesterLabel.isNotEmpty) ...[
                    SizedBox(width: SizeConfig.r(8)),
                    Text(
                      request.semesterLabel,
                      style: TextStyle(
                        fontSize: SizeConfig.sp(11),
                        color: AppColors.textLight,
                      ),
                    ),
                  ],
                ],
              ),
              Text(
                request.earnings,
                style: TextStyle(
                  fontSize: SizeConfig.sp(16),
                  fontWeight: FontWeight.w700,
                  color: AppColors.textDark,
                ),
              ),
            ],
          ),
          SizedBox(height: SizeConfig.r(12)),
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
              Expanded(
                child: Text(
                  'Pickup: ${request.pickup}',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    fontSize: SizeConfig.sp(13),
                    color: AppColors.textMedium,
                  ),
                ),
              ),
            ],
          ),
          SizedBox(height: SizeConfig.r(7)),
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
              Expanded(
                child: Text(
                  'Drop-off: ${request.dropoff}',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    fontSize: SizeConfig.sp(13),
                    color: AppColors.textMedium,
                  ),
                ),
              ),
            ],
          ),
          SizedBox(height: SizeConfig.r(7)),
          Row(
            children: [
              Icon(
                Icons.access_time,
                size: SizeConfig.r(14),
                color: AppColors.textLight,
              ),
              SizedBox(width: SizeConfig.r(6)),
              Text(
                request.timeAndStudents,
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
            onPressed: () async {
              final result = await Navigator.pushNamed(
                context,
                AppRoutes.requestedJobs,
                arguments: request,
              );
              if (result == true) await onReviewed();
            },
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
    final jobProvider = context.watch<JobProvider>();
    final checklistDone = jobProvider.checklistCompletedToday;
    final sessionActive = jobProvider.sessionStarted;
    // Mirrors the gate used on the Current Job card's "Start Run" button:
    // pre-ride actions are blocked until today's checklist is complete,
    // unless a session is already in progress.
    final preRideBlocked = !checklistDone && !sessionActive;

    void openChecklist() {
      _pushVehicleChecklist(context).then((_) {
        if (!context.mounted) return;
        context.read<JobProvider>().loadJob(silent: true);
      });
    }

    final actions = [
      _QuickActionData(
        icon: Icons.play_arrow_rounded,
        label: 'Start Ride',
        iconBgColor: AppColors.success,
        blocked: preRideBlocked,
        onTap: preRideBlocked
            ? openChecklist
            : () => Navigator.pushNamed(context, AppRoutes.routeDetail),
      ),
      _QuickActionData(
        icon: Icons.assignment_outlined,
        label: 'Vehicle\nChecklist',
        iconBgColor: AppColors.primary,
        onTap: () => _pushVehicleChecklist(context),
      ),
      _QuickActionData(
        icon: Icons.alt_route,
        label: 'View Routes',
        iconBgColor: const Color(0xFF7C3AED),
        blocked: preRideBlocked,
        onTap: preRideBlocked ? openChecklist : null,
      ),
      _QuickActionData(
        icon: Icons.warning_amber_rounded,
        label: 'Report\nIssue',
        iconBgColor: AppColors.warning,
        onTap: () async {
          await context.read<LocalJobRepository>().clearAllLocalData();
          if (!context.mounted) return;
          ScaffoldMessenger.of(
            context,
          ).showSnackBar(const SnackBar(content: Text('Local DB cleared')));
        },
      ),
      _QuickActionData(
        icon: Icons.phone,
        label: 'SOS',
        iconBgColor: AppColors.error,
        onTap: () => Navigator.pushNamed(context, AppRoutes.sos),
      ),
      _QuickActionData(
        icon: Icons.event_available_outlined,
        label: 'Apply\nLeave',
        iconBgColor: AppColors.primaryDark,
        onTap: () => Navigator.pushNamed(context, AppRoutes.driverLeave),
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
          children: [
            Expanded(child: _QuickActionCard(data: actions[3])),
            SizedBox(width: SizeConfig.r(10)),
            Expanded(child: _QuickActionCard(data: actions[4])),
            SizedBox(width: SizeConfig.r(10)),
            Expanded(child: _QuickActionCard(data: actions[5])),
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
  final bool blocked;

  const _QuickActionData({
    required this.icon,
    required this.label,
    required this.iconBgColor,
    this.onTap,
    this.blocked = false,
  });
}

class _QuickActionCard extends StatelessWidget {
  final _QuickActionData data;
  const _QuickActionCard({required this.data});

  @override
  Widget build(BuildContext context) {
    final blocked = data.blocked;
    final circleColor = blocked
        ? AppColors.textLight.withValues(alpha: 0.18)
        : data.iconBgColor.withValues(alpha: 0.12);
    final iconColor = blocked ? AppColors.textLight : data.iconBgColor;

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
            SizedBox(
              width: SizeConfig.r(44),
              height: SizeConfig.r(44),
              child: Stack(
                clipBehavior: Clip.none,
                children: [
                  Container(
                    width: SizeConfig.r(44),
                    height: SizeConfig.r(44),
                    decoration: BoxDecoration(
                      color: circleColor,
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      data.icon,
                      color: iconColor,
                      size: SizeConfig.r(22),
                    ),
                  ),
                  if (blocked)
                    Positioned(
                      right: -SizeConfig.r(2),
                      top: -SizeConfig.r(2),
                      child: Container(
                        width: SizeConfig.r(18),
                        height: SizeConfig.r(18),
                        decoration: BoxDecoration(
                          color: AppColors.warning,
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: AppColors.background,
                            width: SizeConfig.r(1.5),
                          ),
                        ),
                        child: Icon(
                          Icons.lock,
                          size: SizeConfig.r(10),
                          color: Colors.white,
                        ),
                      ),
                    ),
                ],
              ),
            ),
            SizedBox(height: SizeConfig.r(8)),
            Text(
              data.label,
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: SizeConfig.sp(11),
                fontWeight: FontWeight.w600,
                color: blocked ? AppColors.textMedium : AppColors.textDark,
                height: 1.3,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
