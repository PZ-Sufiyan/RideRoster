import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../../providers/job_provider.dart';
import '../../../../routes/app_routes.dart';
import '../../../../users/driver/models/job_model.dart';
import '../../../../utils/app_colors.dart';
import '../../../../utils/size_confg.dart';

class CompleteJobPage extends StatefulWidget {
  const CompleteJobPage({super.key});

  @override
  State<CompleteJobPage> createState() => _CompleteJobPageState();
}

class _CompleteJobPageState extends State<CompleteJobPage> {
  final _commentsController = TextEditingController();

  @override
  void dispose() {
    _commentsController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    SizeConfig.init(context);
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Consumer<JobProvider>(
          builder: (context, provider, _) {
            final job = provider.job;

            return Column(
              children: [
                _buildAppBar(context, job),
                _StatusBar(job: job),
                // ── Tracking indicator for dropoff ────────────────────────
                if (provider.isTracking)
                  _TrackingBanner(
                    distanceMeters: provider.currentDistanceMeters,
                  ),
                Expanded(
                  child: SingleChildScrollView(
                    padding: EdgeInsets.all(SizeConfig.r(16)),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _buildTimeline(job),
                        SizedBox(height: SizeConfig.r(16)),
                        _DropoffDestinationCard(
                          job: job,
                          // ── Navigate to dropoff button ─────────────────
                          onNavigate:
                              job?.currentDropoff?.hasCoordinates == true
                              ? () => context
                                    .read<JobProvider>()
                                    .navigateToDropoff()
                              : null,
                        ),
                        SizedBox(height: SizeConfig.r(16)),
                        _JobCommentsCard(controller: _commentsController),
                        SizedBox(height: SizeConfig.r(16)),
                      ],
                    ),
                  ),
                ),
                _BottomBar(commentsController: _commentsController),
              ],
            );
          },
        ),
      ),
    );
  }

  Widget _buildAppBar(BuildContext context, JobModel? job) {
    final routeNum = job?.routeNumber ?? '';
    final pending = job?.pendingCount ?? 0;

    return Container(
      color: AppColors.background,
      padding: EdgeInsets.symmetric(
        horizontal: SizeConfig.r(4),
        vertical: SizeConfig.r(8),
      ),
      child: Row(
        children: [
          IconButton(
            onPressed: () async {
              final didPop = await Navigator.maybePop(context);
              if (!didPop && context.mounted) {
                Navigator.pushReplacementNamed(context, AppRoutes.routeDetail);
              }
            },
            icon: Icon(
              Icons.arrow_back,
              color: AppColors.textDark,
              size: SizeConfig.r(22),
            ),
          ),
          Expanded(
            child: Column(
              children: [
                Text(
                  'Job Route #$routeNum',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: SizeConfig.sp(16),
                    fontWeight: FontWeight.w700,
                    color: AppColors.textDark,
                  ),
                ),
                Text(
                  pending == 0
                      ? 'All pickups resolved'
                      : '$pending stops remaining',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: SizeConfig.sp(12),
                    color: AppColors.textLight,
                  ),
                ),
              ],
            ),
          ),
          GestureDetector(
            onTap: () => Navigator.pushNamed(context, AppRoutes.sos),
            child: Container(
              width: SizeConfig.r(36),
              height: SizeConfig.r(36),
              decoration: const BoxDecoration(
                color: AppColors.error,
                shape: BoxShape.circle,
              ),
              alignment: Alignment.center,
              child: Text(
                'SOS',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: SizeConfig.sp(10),
                  fontWeight: FontWeight.w800,
                ),
              ),
            ),
          ),
          SizedBox(width: SizeConfig.r(4)),
          IconButton(
            onPressed: () {},
            icon: Icon(
              Icons.more_vert,
              color: AppColors.textDark,
              size: SizeConfig.r(22),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTimeline(JobModel? job) {
    if (job == null) return const SizedBox.shrink();
    return Column(
      children: [
        ...job.pickups.map((stop) {
          final isCompleted = stop.status == PickupStatus.completed;
          return _TimelinePassengerItem(
            name: stop.passengerName,
            time: stop.scheduledTime,
            detail: isCompleted ? stop.address : 'Not Picked',
            lineColor: isCompleted ? AppColors.success : AppColors.error,
            isCompleted: isCompleted,
          );
        }),
        _DrivingToDropoffItem(
          dropoffEta: job.dropoffEta,
          dropoffLocation: job.dropoffLocation,
        ),
      ],
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Tracking Banner
// ─────────────────────────────────────────────────────────────────────────────

class _TrackingBanner extends StatelessWidget {
  final double? distanceMeters;
  const _TrackingBanner({this.distanceMeters});

  @override
  Widget build(BuildContext context) {
    SizeConfig.init(context);
    final label = distanceMeters != null
        ? '${distanceMeters!.toStringAsFixed(0)} m to drop-off — tracking active'
        : 'Tracking location to drop-off…';

    return Container(
      width: double.infinity,
      color: AppColors.success.withValues(alpha: 0.1),
      padding: EdgeInsets.symmetric(
        horizontal: SizeConfig.hPad,
        vertical: SizeConfig.r(6),
      ),
      child: Row(
        children: [
          Icon(
            Icons.location_searching,
            size: SizeConfig.r(14),
            color: AppColors.success,
          ),
          SizedBox(width: SizeConfig.r(6)),
          Text(
            label,
            style: TextStyle(
              fontSize: SizeConfig.sp(12),
              color: AppColors.success,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Status Bar
// ─────────────────────────────────────────────────────────────────────────────

class _StatusBar extends StatelessWidget {
  final JobModel? job;
  const _StatusBar({required this.job});

  @override
  Widget build(BuildContext context) {
    SizeConfig.init(context);
    final completed = job?.completedCount ?? 0;
    final total = job?.totalPickups ?? 0;
    final progress = job?.progressFraction ?? 0.0;

    return Container(
      width: double.infinity,
      color: const Color(0xFF0284C7),
      child: Column(
        children: [
          Padding(
            padding: EdgeInsets.symmetric(
              horizontal: SizeConfig.hPad,
              vertical: SizeConfig.r(10),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
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
                    SizedBox(width: SizeConfig.r(6)),
                    Text(
                      'Rides',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: SizeConfig.sp(13),
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
                Text(
                  '$completed/$total  Completed',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: SizeConfig.sp(13),
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
          ClipRRect(
            child: LinearProgressIndicator(
              value: progress,
              minHeight: SizeConfig.r(5),
              backgroundColor: Colors.white.withValues(alpha: 0.25),
              valueColor: const AlwaysStoppedAnimation<Color>(
                AppColors.success,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Timeline items (unchanged)
// ─────────────────────────────────────────────────────────────────────────────

class _TimelinePassengerItem extends StatelessWidget {
  final String name;
  final String time;
  final String detail;
  final Color lineColor;
  final bool isCompleted;

  const _TimelinePassengerItem({
    required this.name,
    required this.time,
    required this.detail,
    required this.lineColor,
    required this.isCompleted,
  });

  @override
  Widget build(BuildContext context) {
    SizeConfig.init(context);
    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          SizedBox(
            width: SizeConfig.r(40),
            child: Column(
              children: [
                Container(
                  width: SizeConfig.r(32),
                  height: SizeConfig.r(32),
                  decoration: BoxDecoration(
                    color: isCompleted ? AppColors.success : AppColors.error,
                    shape: BoxShape.circle,
                  ),
                  alignment: Alignment.center,
                  child: Icon(
                    isCompleted ? Icons.check : Icons.close,
                    color: Colors.white,
                    size: SizeConfig.r(18),
                  ),
                ),
                Expanded(
                  child: Center(
                    child: Container(width: SizeConfig.r(2), color: lineColor),
                  ),
                ),
              ],
            ),
          ),
          SizedBox(width: SizeConfig.r(12)),
          Expanded(
            child: Padding(
              padding: EdgeInsets.only(
                top: SizeConfig.r(4),
                bottom: SizeConfig.r(16),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    name,
                    style: TextStyle(
                      fontSize: SizeConfig.sp(14),
                      fontWeight: FontWeight.w600,
                      color: AppColors.textDark,
                    ),
                  ),
                  SizedBox(height: SizeConfig.r(2)),
                  Text(
                    '$time  •  $detail',
                    style: TextStyle(
                      fontSize: SizeConfig.sp(12),
                      color: AppColors.textLight,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _DrivingToDropoffItem extends StatelessWidget {
  final String dropoffEta;
  final String dropoffLocation;

  const _DrivingToDropoffItem({
    required this.dropoffEta,
    required this.dropoffLocation,
  });

  @override
  Widget build(BuildContext context) {
    SizeConfig.init(context);
    return Row(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        SizedBox(
          width: SizeConfig.r(40),
          child: Container(
            width: SizeConfig.r(32),
            height: SizeConfig.r(32),
            decoration: const BoxDecoration(
              color: Color(0xFF0284C7),
              shape: BoxShape.circle,
            ),
            alignment: Alignment.center,
            child: Icon(
              Icons.directions_car,
              color: Colors.white,
              size: SizeConfig.r(18),
            ),
          ),
        ),
        SizedBox(width: SizeConfig.r(12)),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Driving to Drop-off',
              style: TextStyle(
                fontSize: SizeConfig.sp(14),
                fontWeight: FontWeight.w600,
                color: AppColors.textDark,
              ),
            ),
            SizedBox(height: SizeConfig.r(2)),
            Text(
              'Est. Arrival $dropoffEta',
              style: TextStyle(
                fontSize: SizeConfig.sp(12),
                fontWeight: FontWeight.w500,
                color: const Color(0xFF0284C7),
              ),
            ),
            SizedBox(height: SizeConfig.r(2)),
            Text(
              dropoffLocation,
              style: TextStyle(
                fontSize: SizeConfig.sp(12),
                color: AppColors.textLight,
              ),
            ),
          ],
        ),
      ],
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Dropoff Destination Card — Navigate button ADDED
// ─────────────────────────────────────────────────────────────────────────────

class _DropoffDestinationCard extends StatelessWidget {
  final JobModel? job;
  // ── NEW ──────────────────────────────────────────────────────────────────
  final VoidCallback? onNavigate;

  const _DropoffDestinationCard({required this.job, this.onNavigate});

  @override
  Widget build(BuildContext context) {
    if (job == null) return const SizedBox.shrink();
    SizeConfig.init(context);

    return Container(
      width: double.infinity,
      padding: EdgeInsets.all(SizeConfig.r(16)),
      decoration: BoxDecoration(
        color: AppColors.background,
        borderRadius: BorderRadius.circular(SizeConfig.radiusLG),
        border: Border.all(color: AppColors.inputBorder, width: 1),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(
                Icons.location_on_outlined,
                color: AppColors.error,
                size: SizeConfig.r(20),
              ),
              SizedBox(width: SizeConfig.r(10)),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Drop-off Destination',
                      style: TextStyle(
                        fontSize: SizeConfig.sp(13),
                        fontWeight: FontWeight.w700,
                        color: AppColors.textDark,
                      ),
                    ),
                    SizedBox(height: SizeConfig.r(2)),
                    Text(
                      job!.dropoffLocation,
                      style: TextStyle(
                        fontSize: SizeConfig.sp(13),
                        color: AppColors.textMedium,
                      ),
                    ),
                    SizedBox(height: SizeConfig.r(4)),
                    Text(
                      'ETA ${job!.dropoffEta}',
                      style: TextStyle(
                        fontSize: SizeConfig.sp(12),
                        color: const Color(0xFF0284C7),
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          // ── Navigate to drop-off button ───────────────────────────────────
          SizedBox(height: SizeConfig.r(12)),
          SizedBox(
            width: double.infinity,
            height: SizeConfig.r(44),
            child: ElevatedButton.icon(
              onPressed: onNavigate,
              icon: Icon(
                Icons.navigation_outlined,
                color: Colors.white,
                size: SizeConfig.r(16),
              ),
              label: Text(
                onNavigate != null
                    ? 'Navigate to Drop-off'
                    : 'No GPS for Drop-off',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: SizeConfig.sp(14),
                  fontWeight: FontWeight.w600,
                ),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: onNavigate != null
                    ? AppColors.success
                    : AppColors.textLight,
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(SizeConfig.radius),
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
// Job Comments Card (unchanged)
// ─────────────────────────────────────────────────────────────────────────────

class _JobCommentsCard extends StatelessWidget {
  final TextEditingController controller;
  const _JobCommentsCard({required this.controller});

  @override
  Widget build(BuildContext context) {
    SizeConfig.init(context);
    return Container(
      width: double.infinity,
      padding: EdgeInsets.all(SizeConfig.r(16)),
      decoration: BoxDecoration(
        color: AppColors.background,
        borderRadius: BorderRadius.circular(SizeConfig.radiusLG),
        border: Border.all(color: AppColors.inputBorder, width: 1),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Job Comments',
            style: TextStyle(
              fontSize: SizeConfig.sp(15),
              fontWeight: FontWeight.w700,
              color: AppColors.textDark,
            ),
          ),
          SizedBox(height: SizeConfig.r(12)),
          TextField(
            controller: controller,
            maxLines: 4,
            style: TextStyle(
              fontSize: SizeConfig.sp(13),
              color: AppColors.textDark,
            ),
            decoration: InputDecoration(
              hintText:
                  'Add any notes or issues encountered during this job...',
              hintStyle: TextStyle(
                fontSize: SizeConfig.sp(13),
                color: AppColors.textLight,
              ),
              filled: true,
              fillColor: AppColors.surfaceGray,
              contentPadding: EdgeInsets.all(SizeConfig.r(12)),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(SizeConfig.radius),
                borderSide: const BorderSide(
                  color: AppColors.inputBorder,
                  width: 1,
                ),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(SizeConfig.radius),
                borderSide: const BorderSide(
                  color: Color(0xFF0284C7),
                  width: 1.5,
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
// Bottom Bar (unchanged)
// ─────────────────────────────────────────────────────────────────────────────

class _BottomBar extends StatelessWidget {
  final TextEditingController commentsController;
  const _BottomBar({required this.commentsController});

  @override
  Widget build(BuildContext context) {
    SizeConfig.init(context);
    return Container(
      padding: EdgeInsets.fromLTRB(
        SizeConfig.hPad,
        SizeConfig.r(10),
        SizeConfig.hPad,
        SizeConfig.r(16),
      ),
      decoration: BoxDecoration(
        color: AppColors.background,
        border: Border(top: BorderSide(color: AppColors.inputBorder, width: 1)),
      ),
      child: SizedBox(
        width: double.infinity,
        height: SizeConfig.buttonHeight,
        child: ElevatedButton(
          onPressed: () async {
            final provider = context.read<JobProvider>();
            try {
              await provider.completeCurrentJob(
                comments: commentsController.text.trim(),
              );
            } catch (_) {
              if (!context.mounted) return;
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Failed to complete job. Please try again.'),
                ),
              );
              return;
            }
            provider.reset();
            if (!context.mounted) return;
            Navigator.pushNamedAndRemoveUntil(
              context,
              AppRoutes.driverDashboard,
              (route) => false,
            );
          },
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.textDark,
            elevation: 0,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(SizeConfig.radiusLG),
            ),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                'Arrived at Drop-off',
                style: TextStyle(
                  fontSize: SizeConfig.sp(15),
                  fontWeight: FontWeight.w600,
                  color: Colors.white,
                ),
              ),
              SizedBox(width: SizeConfig.r(8)),
              Icon(
                Icons.arrow_forward,
                color: Colors.white,
                size: SizeConfig.r(18),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
