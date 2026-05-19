import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../../routes/app_routes.dart';
import '../../../../utils/app_colors.dart';
import '../../../../utils/size_confg.dart';
import '../../../../providers/pa_job_provider.dart';
import '../../../../model/pa_job_model.dart';
import '../../../../model/job_model.dart' show PickupStatus, DropoffStatus;

class _Colors {
  static const Color routeBlue = Color(0xFF2563EB);
  static const Color progressGreen = Color(0xFF22C55E);
  static const Color pickupBlue = Color(0xFF3B82F6);
  static const Color dropoffPurple = Color(0xFF8B5CF6);
  static const Color doneGreen = Color(0xFF22C55E);
  static const Color missedRed = Color(0xFFEF4444);
}

class PaCurrentJobPage extends StatefulWidget {
  const PaCurrentJobPage({super.key});

  @override
  State<PaCurrentJobPage> createState() => _PaCurrentJobPageState();
}

class _PaCurrentJobPageState extends State<PaCurrentJobPage> {
  Timer? _navTimer;
  bool _completionHandled = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<PaJobProvider>().loadJob(silent: true);
    });
  }

  @override
  void dispose() {
    _navTimer?.cancel();
    super.dispose();
  }

  void _handleCompletion() {
    if (_completionHandled) return;
    _completionHandled = true;
    _navTimer = Timer(const Duration(seconds: 3), () {
      if (!mounted) return;
      Navigator.pushNamedAndRemoveUntil(
        context,
        AppRoutes.paDashboard,
        (route) => false,
      );
    });
  }

  @override
  Widget build(BuildContext context) {
    SizeConfig.init(context);
    return Scaffold(
      backgroundColor: AppColors.surfaceGray,
      body: SafeArea(
        bottom: false,
        child: Consumer<PaJobProvider>(
          builder: (_, provider, __) {
            if (provider.isLoading) {
              return const Center(child: CircularProgressIndicator());
            }

            final job = provider.job;

            // ── No job today ───────────────────────────────────────────────
            if (job == null) {
              return Column(
                children: [
                  _Header(job: null),
                  Expanded(
                    child: Center(
                      child: Text(
                        'No active job for today.',
                        style: TextStyle(
                          fontSize: SizeConfig.sp(14),
                          color: AppColors.textMedium,
                        ),
                      ),
                    ),
                  ),
                ],
              );
            }

            // ── Session completed ──────────────────────────────────────────
            if (job.isSessionCompleted) {
              _handleCompletion();
              return _JobCompletedScreen(job: job);
            }

            // ── Normal job detail ──────────────────────────────────────────
            return Column(
              children: [
                _Header(job: job),
                Divider(height: 1, thickness: 1, color: AppColors.inputBorder),
                Expanded(
                  child: SingleChildScrollView(
                    padding: EdgeInsets.symmetric(
                      horizontal: SizeConfig.hPad,
                      vertical: SizeConfig.spaceSM,
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _RouteSummaryCard(job: job),
                        SizedBox(height: SizeConfig.r(16)),
                        _PickupProgressCard(job: job),
                        SizedBox(height: SizeConfig.r(20)),
                        Text(
                          'Pickup Stops (${job.stops.length})',
                          style: TextStyle(
                            fontSize: SizeConfig.sp(17),
                            fontWeight: FontWeight.w700,
                            color: AppColors.textDark,
                          ),
                        ),
                        SizedBox(height: SizeConfig.r(12)),
                        ...job.stops.asMap().entries.map(
                          (e) => Padding(
                            padding: EdgeInsets.only(bottom: SizeConfig.r(10)),
                            child: _PickupStopCard(stop: e.value),
                          ),
                        ),
                        SizedBox(height: SizeConfig.r(8)),
                        Text(
                          'Drop-off Stops (${job.dropoffs.length})',
                          style: TextStyle(
                            fontSize: SizeConfig.sp(17),
                            fontWeight: FontWeight.w700,
                            color: AppColors.textDark,
                          ),
                        ),
                        SizedBox(height: SizeConfig.r(12)),
                        ...job.dropoffs.asMap().entries.map(
                          (e) => Padding(
                            padding: EdgeInsets.only(bottom: SizeConfig.r(10)),
                            child: _DropoffStopCard(
                              dropoff: e.value,
                              order: e.key + 1,
                            ),
                          ),
                        ),
                        SizedBox(height: SizeConfig.spaceMD),
                      ],
                    ),
                  ),
                ),
              ],
            );
          },
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Job Completed Screen
// ─────────────────────────────────────────────────────────────────────────────

class _JobCompletedScreen extends StatelessWidget {
  final PaJobModel job;
  const _JobCompletedScreen({required this.job});

  @override
  Widget build(BuildContext context) {
    final runLabel = job.isInbound ? 'Evening Run' : 'Morning Run';
    return Column(
      children: [
        _Header(job: job),
        Expanded(
          child: Center(
            child: Padding(
              padding: EdgeInsets.symmetric(horizontal: SizeConfig.hPad),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: SizeConfig.r(88),
                    height: SizeConfig.r(88),
                    decoration: BoxDecoration(
                      color: _Colors.doneGreen.withValues(alpha: 0.12),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      Icons.check_circle_outline,
                      size: SizeConfig.r(52),
                      color: _Colors.doneGreen,
                    ),
                  ),
                  SizedBox(height: SizeConfig.r(24)),
                  Text(
                    'Job Completed!',
                    style: TextStyle(
                      fontSize: SizeConfig.sp(24),
                      fontWeight: FontWeight.w800,
                      color: AppColors.textDark,
                    ),
                  ),
                  SizedBox(height: SizeConfig.r(10)),
                  Text(
                    '$runLabel — ${job.jobName}',
                    style: TextStyle(
                      fontSize: SizeConfig.sp(14),
                      color: AppColors.textMedium,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  SizedBox(height: SizeConfig.r(8)),
                  Text(
                    'Returning to dashboard in a moment...',
                    style: TextStyle(
                      fontSize: SizeConfig.sp(13),
                      color: AppColors.textLight,
                    ),
                  ),
                  SizedBox(height: SizeConfig.r(32)),
                  // Stats summary
                  Container(
                    padding: EdgeInsets.all(SizeConfig.r(16)),
                    decoration: BoxDecoration(
                      color: AppColors.background,
                      borderRadius: BorderRadius.circular(SizeConfig.radiusLG),
                      border: Border.all(color: AppColors.inputBorder),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceAround,
                      children: [
                        _CompletionStat(
                          value: '${job.totalStudents}',
                          label: 'Students',
                          color: _Colors.routeBlue,
                        ),
                        _CompletionStat(
                          value: '${job.pickedUpCount}',
                          label: 'Picked Up',
                          color: _Colors.doneGreen,
                        ),
                        if (job.missedCount > 0)
                          _CompletionStat(
                            value: '${job.missedCount}',
                            label: 'Missed',
                            color: _Colors.missedRed,
                          ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class _CompletionStat extends StatelessWidget {
  final String value;
  final String label;
  final Color color;
  const _CompletionStat({
    required this.value,
    required this.label,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(
          value,
          style: TextStyle(
            fontSize: SizeConfig.sp(24),
            fontWeight: FontWeight.w800,
            color: color,
          ),
        ),
        SizedBox(height: SizeConfig.r(4)),
        Text(
          label,
          style: TextStyle(
            fontSize: SizeConfig.sp(11),
            color: AppColors.textMedium,
          ),
        ),
      ],
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Header
// ─────────────────────────────────────────────────────────────────────────────

class _Header extends StatelessWidget {
  final PaJobModel? job;
  const _Header({required this.job});

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
          GestureDetector(
            onTap: () => Navigator.pop(context),
            behavior: HitTestBehavior.opaque,
            child: Icon(
              Icons.arrow_back_ios_new,
              size: SizeConfig.r(20),
              color: AppColors.textDark,
            ),
          ),
          SizedBox(width: SizeConfig.r(12)),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  job?.jobName ?? 'Job Detail',
                  style: TextStyle(
                    fontSize: SizeConfig.sp(16),
                    fontWeight: FontWeight.w700,
                    color: AppColors.textDark,
                  ),
                ),
                if (job != null)
                  Text(
                    job!.isInbound
                        ? 'Evening Run (Inbound)'
                        : 'Morning Run (Outbound)',
                    style: TextStyle(
                      fontSize: SizeConfig.sp(12),
                      color: AppColors.textMedium,
                    ),
                  ),
              ],
            ),
          ),
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
// Route Summary Card
// ─────────────────────────────────────────────────────────────────────────────

class _RouteSummaryCard extends StatelessWidget {
  final PaJobModel job;
  const _RouteSummaryCard({required this.job});

  @override
  Widget build(BuildContext context) {
    final runLabel = job.isInbound ? 'Evening Run' : 'Morning Run';
    return Container(
      width: double.infinity,
      padding: EdgeInsets.all(SizeConfig.r(20)),
      decoration: BoxDecoration(
        color: _Colors.routeBlue,
        borderRadius: BorderRadius.circular(SizeConfig.radiusLG),
      ),
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          Positioned(
            right: SizeConfig.r(-20),
            top: SizeConfig.r(-20),
            child: Container(
              width: SizeConfig.r(100),
              height: SizeConfig.r(100),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.12),
                shape: BoxShape.circle,
              ),
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                runLabel,
                style: TextStyle(
                  fontSize: SizeConfig.sp(20),
                  fontWeight: FontWeight.w700,
                  color: Colors.white,
                ),
              ),
              SizedBox(height: SizeConfig.r(4)),
              Text(
                'Driver: ${job.driverName}',
                style: TextStyle(
                  fontSize: SizeConfig.sp(13),
                  color: Colors.white.withValues(alpha: 0.85),
                ),
              ),
              SizedBox(height: SizeConfig.r(20)),
              Row(
                children: [
                  Expanded(
                    child: _RouteStat(
                      value: '${job.totalStudents}',
                      label: 'Students',
                    ),
                  ),
                  Expanded(
                    child: _RouteStat(
                      value: '${job.totalStops}',
                      label: 'Total Stops',
                    ),
                  ),
                  Expanded(
                    child: _RouteStat(
                      value: job.startTime,
                      label: 'Start Time',
                    ),
                  ),
                ],
              ),
              SizedBox(height: SizeConfig.r(18)),
              Row(
                children: [
                  Text(
                    'View Route Map',
                    style: TextStyle(
                      fontSize: SizeConfig.sp(14),
                      fontWeight: FontWeight.w600,
                      color: Colors.white,
                    ),
                  ),
                  SizedBox(width: SizeConfig.r(4)),
                  Icon(
                    Icons.arrow_forward,
                    color: Colors.white,
                    size: SizeConfig.r(16),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _RouteStat extends StatelessWidget {
  final String value;
  final String label;
  const _RouteStat({required this.value, required this.label});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          value,
          style: TextStyle(
            fontSize: SizeConfig.sp(20),
            fontWeight: FontWeight.w700,
            color: Colors.white,
          ),
        ),
        SizedBox(height: SizeConfig.r(2)),
        Text(
          label,
          style: TextStyle(
            fontSize: SizeConfig.sp(11),
            color: Colors.white.withValues(alpha: 0.85),
          ),
        ),
      ],
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Pickup Progress Card
// ─────────────────────────────────────────────────────────────────────────────

class _PickupProgressCard extends StatelessWidget {
  final PaJobModel job;
  const _PickupProgressCard({required this.job});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
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
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // ── Pickup ────────────────────────────────────────────────────
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Pickup Progress',
                style: TextStyle(
                  fontSize: SizeConfig.sp(15),
                  fontWeight: FontWeight.w700,
                  color: AppColors.textDark,
                ),
              ),
              Text(
                '${job.pickedUpCount} / ${job.totalStudents}',
                style: TextStyle(
                  fontSize: SizeConfig.sp(12),
                  fontWeight: FontWeight.w500,
                  color: AppColors.textLight,
                ),
              ),
            ],
          ),
          SizedBox(height: SizeConfig.r(10)),
          ClipRRect(
            borderRadius: BorderRadius.circular(SizeConfig.r(4)),
            child: LinearProgressIndicator(
              value: job.pickupProgressFraction,
              minHeight: SizeConfig.r(8),
              backgroundColor: AppColors.inputBorder,
              color: _Colors.progressGreen,
            ),
          ),
          SizedBox(height: SizeConfig.r(8)),
          Row(
            children: [
              _ProgressPill(
                label: '${job.pendingPickupCount} pending',
                color: AppColors.textLight,
              ),
              if (job.missedCount > 0) ...[
                SizedBox(width: SizeConfig.r(8)),
                _ProgressPill(
                  label: '${job.missedCount} missed',
                  color: AppColors.error,
                ),
              ],
            ],
          ),

          // ── Not started notice ────────────────────────────────────────
          if (!job.sessionStarted) ...[
            SizedBox(height: SizeConfig.r(12)),
            Divider(color: AppColors.inputBorder),
            SizedBox(height: SizeConfig.r(8)),
            Row(
              children: [
                Icon(
                  Icons.info_outline,
                  size: SizeConfig.r(14),
                  color: AppColors.textLight,
                ),
                SizedBox(width: SizeConfig.r(6)),
                Text(
                  'Driver has not started this run yet.',
                  style: TextStyle(
                    fontSize: SizeConfig.sp(12),
                    color: AppColors.textLight,
                  ),
                ),
              ],
            ),
          ],

          // ── Dropoff progress (shown once all pickups resolved) ────────
          if (job.sessionStarted && job.allPickupsResolved) ...[
            SizedBox(height: SizeConfig.r(12)),
            Divider(color: AppColors.inputBorder),
            SizedBox(height: SizeConfig.r(12)),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Drop-off Progress',
                  style: TextStyle(
                    fontSize: SizeConfig.sp(15),
                    fontWeight: FontWeight.w700,
                    color: AppColors.textDark,
                  ),
                ),
                Text(
                  '${job.droppedOffCount} / ${job.dropoffs.length}',
                  style: TextStyle(
                    fontSize: SizeConfig.sp(12),
                    fontWeight: FontWeight.w500,
                    color: AppColors.textLight,
                  ),
                ),
              ],
            ),
            SizedBox(height: SizeConfig.r(10)),
            ClipRRect(
              borderRadius: BorderRadius.circular(SizeConfig.r(4)),
              child: LinearProgressIndicator(
                value: job.dropoffs.isEmpty
                    ? 0.0
                    : job.droppedOffCount / job.dropoffs.length,
                minHeight: SizeConfig.r(8),
                backgroundColor: AppColors.inputBorder,
                color: _Colors.routeBlue,
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _ProgressPill extends StatelessWidget {
  final String label;
  final Color color;
  const _ProgressPill({required this.label, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: SizeConfig.r(8),
        vertical: SizeConfig.r(3),
      ),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(SizeConfig.r(12)),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: SizeConfig.sp(11),
          fontWeight: FontWeight.w600,
          color: color,
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Pickup Stop Card  (blue → green when done, red when missed)
// ─────────────────────────────────────────────────────────────────────────────

class _PickupStopCard extends StatelessWidget {
  final PaPassengerStop stop;
  const _PickupStopCard({required this.stop});

  @override
  Widget build(BuildContext context) {
    final Color accent;
    final Widget centerWidget;

    switch (stop.status) {
      case PickupStatus.completed:
        accent = _Colors.doneGreen;
        centerWidget = Icon(
          Icons.check,
          size: SizeConfig.r(16),
          color: Colors.white,
        );
        break;
      case PickupStatus.notPicked:
        accent = _Colors.missedRed;
        centerWidget = Icon(
          Icons.close,
          size: SizeConfig.r(16),
          color: Colors.white,
        );
        break;
      case PickupStatus.pending:
      default:
        accent = _Colors.pickupBlue;
        centerWidget = Text(
          '${stop.stopNumber}',
          style: TextStyle(
            fontSize: SizeConfig.sp(13),
            fontWeight: FontWeight.w700,
            color: Colors.white,
          ),
        );
    }

    return _StopCard(
      accent: accent,
      circleContent: centerWidget,
      title: stop.passengerName,
      subtitle: stop.address,
      time: stop.scheduledTime,
      trailing: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          if (stop.wheelchairRequired)
            Padding(
              padding: EdgeInsets.only(bottom: SizeConfig.r(4)),
              child: Icon(
                Icons.accessible,
                size: SizeConfig.r(18),
                color: AppColors.primary,
              ),
            ),
          if (stop.harnessRequired)
            Icon(
              Icons.safety_check_outlined,
              size: SizeConfig.r(18),
              color: const Color(0xFF7C3AED),
            ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Dropoff Stop Card  (purple → green when done)
// ─────────────────────────────────────────────────────────────────────────────

class _DropoffStopCard extends StatelessWidget {
  final PaDropoffStop dropoff;
  final int order;
  const _DropoffStopCard({required this.dropoff, required this.order});

  @override
  Widget build(BuildContext context) {
    final isDone = dropoff.status == DropoffStatus.completed;
    final accent = isDone ? _Colors.doneGreen : _Colors.dropoffPurple;

    final circleContent = isDone
        ? Icon(Icons.check, size: SizeConfig.r(16), color: Colors.white)
        : Text(
            '$order',
            style: TextStyle(
              fontSize: SizeConfig.sp(13),
              fontWeight: FontWeight.w700,
              color: Colors.white,
            ),
          );

    final trailing = isDone
        ? Container(
            padding: EdgeInsets.symmetric(
              horizontal: SizeConfig.r(8),
              vertical: SizeConfig.r(4),
            ),
            decoration: BoxDecoration(
              color: _Colors.doneGreen.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(SizeConfig.r(12)),
            ),
            child: Text(
              'Done',
              style: TextStyle(
                fontSize: SizeConfig.sp(10),
                fontWeight: FontWeight.w700,
                color: _Colors.doneGreen,
              ),
            ),
          )
        : const SizedBox.shrink();

    return _StopCard(
      accent: accent,
      circleContent: circleContent,
      title: dropoff.address,
      subtitle: dropoff.passengerNames.join(', '),
      time: dropoff.scheduledTime,
      trailing: trailing,
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared stop card shell
// ─────────────────────────────────────────────────────────────────────────────

class _StopCard extends StatelessWidget {
  final Color accent;
  final Widget circleContent;
  final String title;
  final String subtitle;
  final String time;
  final Widget trailing;

  const _StopCard({
    required this.accent,
    required this.circleContent,
    required this.title,
    required this.subtitle,
    required this.time,
    required this.trailing,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.background,
        borderRadius: BorderRadius.circular(SizeConfig.radiusLG),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: SizeConfig.r(6),
            offset: Offset(0, SizeConfig.r(2)),
          ),
        ],
      ),
      child: IntrinsicHeight(
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Accent left bar
            Container(
              width: SizeConfig.r(4),
              decoration: BoxDecoration(
                color: accent,
                borderRadius: BorderRadius.only(
                  topLeft: Radius.circular(SizeConfig.radiusLG),
                  bottomLeft: Radius.circular(SizeConfig.radiusLG),
                ),
              ),
            ),
            Expanded(
              child: Padding(
                padding: EdgeInsets.symmetric(
                  horizontal: SizeConfig.r(14),
                  vertical: SizeConfig.r(14),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    // Circle badge
                    Container(
                      width: SizeConfig.r(32),
                      height: SizeConfig.r(32),
                      decoration: BoxDecoration(
                        color: accent,
                        shape: BoxShape.circle,
                      ),
                      alignment: Alignment.center,
                      child: circleContent,
                    ),
                    SizedBox(width: SizeConfig.r(12)),
                    // Text block
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            title,
                            style: TextStyle(
                              fontSize: SizeConfig.sp(14),
                              fontWeight: FontWeight.w700,
                              color: AppColors.textDark,
                            ),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                          SizedBox(height: SizeConfig.r(2)),
                          Text(
                            subtitle,
                            style: TextStyle(
                              fontSize: SizeConfig.sp(12),
                              color: AppColors.textLight,
                            ),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                          SizedBox(height: SizeConfig.r(4)),
                          Text(
                            time,
                            style: TextStyle(
                              fontSize: SizeConfig.sp(11),
                              color: AppColors.textLight,
                            ),
                          ),
                        ],
                      ),
                    ),
                    SizedBox(width: SizeConfig.r(8)),
                    trailing,
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
