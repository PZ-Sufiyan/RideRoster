import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../../components/app_button.dart';
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

            final pendingDropoffs =
                job?.dropoffs
                    .where((d) => d.status == DropoffStatus.pending)
                    .toList() ??
                [];
            final allDropoffsDone =
                job != null &&
                job.dropoffs.isNotEmpty &&
                pendingDropoffs.isEmpty;
            final currentDropoff = pendingDropoffs.isNotEmpty
                ? pendingDropoffs.first
                : null;

            return Column(
              children: [
                _buildAppBar(context, job),
                _StatusBar(job: job),
                if (provider.isTracking)
                  _TrackingBanner(
                    distanceMeters: provider.currentDistanceMeters,
                    isInbound: job?.isInbound ?? true,
                    currentDropoff: currentDropoff,
                  ),
                Expanded(
                  child: SingleChildScrollView(
                    padding: EdgeInsets.all(SizeConfig.r(16)),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _buildTimeline(job),
                        SizedBox(height: SizeConfig.r(16)),
                        _buildDropoffSection(job, provider, currentDropoff),
                        SizedBox(height: SizeConfig.r(16)),
                        _JobCommentsCard(controller: _commentsController),
                        SizedBox(height: SizeConfig.r(16)),
                      ],
                    ),
                  ),
                ),
                _BottomBar(
                  commentsController: _commentsController,
                  isInbound: job?.isInbound ?? false,
                  allDropoffsDone: allDropoffsDone,
                  currentDropoff: currentDropoff,
                  job: job,
                ),
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

  // ── Timeline ──────────────────────────────────────────────────────────────
  //
  // Outbound: passenger pickup rows → then one _TimelineItem per school stop
  // Inbound:  passenger pickup rows → then one _TimelineItem per home dropoff

  Widget _buildTimeline(JobModel? job) {
    if (job == null) return const SizedBox.shrink();
    final isInbound = job.isInbound;

    return Column(
      children: [
        // Pickup items (same for both directions)
        ...job.pickups.map((stop) {
          final isCompleted = stop.status == PickupStatus.completed;
          return _TimelineItem(
            name: stop.passengerName,
            time: stop.scheduledTime,
            detail: isCompleted ? stop.address : 'Not Picked',
            lineColor: isCompleted ? AppColors.success : AppColors.error,
            isCompleted: isCompleted,
            icon: Icons.person,
          );
        }),

        // Dropoff items
        if (job.dropoffs.isEmpty) ...[
          // Fallback: no dropoff data at all
          _DrivingToDropoffItem(
            dropoffEta: job.dropoffEta,
            dropoffLocation: job.dropoffLocation,
          ),
        ] else if (isInbound) ...[
          // Inbound: one entry per passenger home
          ...job.dropoffs.map((dropoff) {
            final isDropped = dropoff.status == DropoffStatus.completed;
            final label = dropoff.passengerName.isNotEmpty
                ? dropoff.passengerName
                : 'Drop-off ${dropoff.dropoffOrder}';
            return _TimelineItem(
              name: label,
              time: dropoff.scheduledTime,
              detail: dropoff.address,
              lineColor: isDropped
                  ? AppColors.success
                  : const Color(0xFF0284C7),
              isCompleted: isDropped,
              icon: Icons.home_outlined,
            );
          }),
        ] else ...[
          // Outbound: one entry per school (may be multiple)
          ...job.dropoffs.map((dropoff) {
            final isDropped = dropoff.status == DropoffStatus.completed;
            final label = job.dropoffs.length == 1
                ? 'School Drop-off'
                : 'School ${dropoff.dropoffOrder}';
            return _TimelineItem(
              name: label,
              time: dropoff.scheduledTime,
              detail: dropoff.address,
              lineColor: isDropped
                  ? AppColors.success
                  : const Color(0xFF0284C7),
              isCompleted: isDropped,
              icon: Icons.school_outlined,
            );
          }),
        ],
      ],
    );
  }

  // ── Dropoff section ───────────────────────────────────────────────────────
  //
  // Unified for both outbound (schools) and inbound (homes).
  // Shows one _DropoffDestinationCard per stop. Navigate button is enabled
  // only for the current pending stop.

  Widget _buildDropoffSection(
    JobModel? job,
    JobProvider provider,
    DropoffStop? currentDropoff,
  ) {
    if (job == null) return const SizedBox.shrink();
    if (job.dropoffs.isEmpty) return const SizedBox.shrink();

    final isInbound = job.isInbound;
    final sectionLabel = isInbound ? 'Drop-off Stops' : 'School Drop-off Stops';

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          sectionLabel,
          style: TextStyle(
            fontSize: SizeConfig.sp(16),
            fontWeight: FontWeight.w700,
            color: AppColors.textDark,
          ),
        ),
        SizedBox(height: SizeConfig.r(10)),
        ...job.dropoffs.map((dropoff) {
          final isCurrent = currentDropoff?.id == dropoff.id;

          final String cardTitle;
          if (isInbound) {
            cardTitle = dropoff.passengerName.isNotEmpty
                ? '${dropoff.passengerName}\'s Home'
                : 'Drop-off ${dropoff.dropoffOrder}';
          } else {
            cardTitle = job.dropoffs.length == 1
                ? 'School Drop-off'
                : 'School ${dropoff.dropoffOrder}';
          }

          return Padding(
            padding: EdgeInsets.only(bottom: SizeConfig.r(10)),
            child: _DropoffDestinationCard(
              title: cardTitle,
              address: dropoff.address,
              eta: dropoff.scheduledTime,
              isCompleted: dropoff.status == DropoffStatus.completed,
              // Navigate only for the current pending stop
              onNavigate: (isCurrent && dropoff.hasCoordinates)
                  ? () => provider.navigateToDropoff()
                  : null,
            ),
          );
        }),
      ],
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Tracking Banner
// ─────────────────────────────────────────────────────────────────────────────

class _TrackingBanner extends StatelessWidget {
  final double? distanceMeters;
  final bool isInbound;
  final DropoffStop? currentDropoff;

  const _TrackingBanner({
    this.distanceMeters,
    required this.isInbound,
    required this.currentDropoff,
  });

  @override
  Widget build(BuildContext context) {
    final destination = isInbound
        ? (currentDropoff?.passengerName.isNotEmpty == true
              ? '${currentDropoff!.passengerName}\'s home'
              : 'drop-off')
        : 'school drop-off';

    final label = distanceMeters != null
        ? '${distanceMeters!.toStringAsFixed(0)} m to $destination — tracking active'
        : 'Tracking location to $destination…';

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
          Expanded(
            child: Text(
              label,
              style: TextStyle(
                fontSize: SizeConfig.sp(12),
                color: AppColors.success,
                fontWeight: FontWeight.w500,
              ),
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
          LinearProgressIndicator(
            value: progress,
            minHeight: SizeConfig.r(5),
            backgroundColor: Colors.white.withValues(alpha: 0.25),
            valueColor: const AlwaysStoppedAnimation<Color>(AppColors.success),
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Timeline Item
// ─────────────────────────────────────────────────────────────────────────────

class _TimelineItem extends StatelessWidget {
  final String name;
  final String time;
  final String detail;
  final Color lineColor;
  final bool isCompleted;
  final IconData icon;

  const _TimelineItem({
    required this.name,
    required this.time,
    required this.detail,
    required this.lineColor,
    required this.isCompleted,
    required this.icon,
  });

  @override
  Widget build(BuildContext context) {
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
                    isCompleted ? Icons.check : icon,
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
// Dropoff Destination Card
// ─────────────────────────────────────────────────────────────────────────────

class _DropoffDestinationCard extends StatelessWidget {
  final String title;
  final String address;
  final String eta;
  final bool isCompleted;
  final VoidCallback? onNavigate;

  const _DropoffDestinationCard({
    required this.title,
    required this.address,
    required this.eta,
    required this.isCompleted,
    this.onNavigate,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: EdgeInsets.all(SizeConfig.r(16)),
      decoration: BoxDecoration(
        color: AppColors.background,
        borderRadius: BorderRadius.circular(SizeConfig.radiusLG),
        border: Border.all(
          color: isCompleted
              ? AppColors.success.withValues(alpha: 0.4)
              : AppColors.inputBorder,
          width: 1,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(
                isCompleted
                    ? Icons.check_circle_outline
                    : Icons.location_on_outlined,
                color: isCompleted ? AppColors.success : AppColors.error,
                size: SizeConfig.r(20),
              ),
              SizedBox(width: SizeConfig.r(10)),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: TextStyle(
                        fontSize: SizeConfig.sp(13),
                        fontWeight: FontWeight.w700,
                        color: AppColors.textDark,
                      ),
                    ),
                    SizedBox(height: SizeConfig.r(2)),
                    Text(
                      address,
                      style: TextStyle(
                        fontSize: SizeConfig.sp(13),
                        color: AppColors.textMedium,
                      ),
                    ),
                    if (eta.isNotEmpty && eta != '--:--') ...[
                      SizedBox(height: SizeConfig.r(4)),
                      Text(
                        'ETA $eta',
                        style: TextStyle(
                          fontSize: SizeConfig.sp(12),
                          color: const Color(0xFF0284C7),
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              if (isCompleted)
                Container(
                  padding: EdgeInsets.symmetric(
                    horizontal: SizeConfig.r(8),
                    vertical: SizeConfig.r(3),
                  ),
                  decoration: BoxDecoration(
                    color: AppColors.success.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(SizeConfig.r(4)),
                  ),
                  child: Text(
                    'Done',
                    style: TextStyle(
                      fontSize: SizeConfig.sp(11),
                      fontWeight: FontWeight.w600,
                      color: AppColors.success,
                    ),
                  ),
                ),
            ],
          ),
          // Navigate button — shown only for the current pending stop
          if (!isCompleted && onNavigate != null) ...[
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
                  'Navigate to Drop-off',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: SizeConfig.sp(14),
                    fontWeight: FontWeight.w600,
                  ),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.success,
                  elevation: 0,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(SizeConfig.radius),
                  ),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Job Comments Card
// ─────────────────────────────────────────────────────────────────────────────

class _JobCommentsCard extends StatelessWidget {
  final TextEditingController controller;
  const _JobCommentsCard({required this.controller});

  @override
  Widget build(BuildContext context) {
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
// Bottom Bar
//
// Unified for both outbound and inbound. Logic:
//
//   allDropoffsDone == true (both directions):
//     → "Complete Job" button → completeCurrentJob() → dashboard
//
//   allDropoffsDone == false, inbound:
//     → "Arrived at [Name]'s Home" → markDropoffAsCompleted() → stay on page
//
//   allDropoffsDone == false, outbound, single school:
//     → "Arrived at Drop-off" → markDropoffAsCompleted() → stay on page
//
//   allDropoffsDone == false, outbound, multiple schools:
//     → "Arrived at School N" → markDropoffAsCompleted() → stay on page
// ─────────────────────────────────────────────────────────────────────────────

class _BottomBar extends StatelessWidget {
  final TextEditingController commentsController;
  final bool isInbound;
  final bool allDropoffsDone;
  final DropoffStop? currentDropoff;
  final JobModel? job;

  const _BottomBar({
    required this.commentsController,
    required this.isInbound,
    required this.allDropoffsDone,
    required this.currentDropoff,
    required this.job,
  });

  String _resolveLabel() {
    if (allDropoffsDone) return 'Complete Job';

    if (isInbound) {
      final name = currentDropoff?.passengerName;
      return (name != null && name.isNotEmpty)
          ? 'Arrived at ${name}\'s Home'
          : 'Arrived at Drop-off';
    }

    // Outbound
    final total = job?.dropoffs.length ?? 1;
    final order = currentDropoff?.dropoffOrder ?? 1;
    return total > 1 ? 'Arrived at School $order' : 'Arrived at Drop-off';
  }

  @override
  Widget build(BuildContext context) {
    final label = _resolveLabel();
    final isFinish = allDropoffsDone;

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
          onPressed: () => _handleTap(context),
          style: ElevatedButton.styleFrom(
            backgroundColor: isFinish ? AppColors.success : AppColors.textDark,
            elevation: 0,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(SizeConfig.radiusLG),
            ),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                label,
                style: TextStyle(
                  fontSize: SizeConfig.sp(15),
                  fontWeight: FontWeight.w600,
                  color: Colors.white,
                ),
              ),
              SizedBox(width: SizeConfig.r(8)),
              Icon(
                isFinish ? Icons.check : Icons.arrow_forward,
                color: Colors.white,
                size: SizeConfig.r(18),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _handleTap(BuildContext context) async {
    final provider = context.read<JobProvider>();

    if (!allDropoffsDone) {
      // Mark the current dropoff as completed and stay on this page.
      // For outbound: bulk-marks all passengers at the same school.
      // For inbound: marks a single passenger's home dropoff.
      // The provider will reload via realtime, updating dropoff statuses.
      await provider.markDropoffAsCompleted();
      return;
    }

    // All dropoffs done — complete the job and return to dashboard.
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
  }
}
