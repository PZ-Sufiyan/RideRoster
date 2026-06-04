import 'dart:math';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../../components/app_button.dart';
import '../../../../components/offline_banner.dart';
import '../../../../providers/job_provider.dart';
import '../../../../routes/app_routes.dart';
import '../../../../model/job_model.dart';
import '../../../../utils/app_colors.dart';
import '../../../../utils/size_confg.dart';

class RouteDetailPage extends StatefulWidget {
  const RouteDetailPage({super.key});

  @override
  State<RouteDetailPage> createState() => _RouteDetailPageState();
}

class _RouteDetailPageState extends State<RouteDetailPage> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final provider = context.read<JobProvider>();
      if (provider.job == null) {
        provider.loadJob();
      }
    });
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
                const OfflineBanner(),
                _buildAppBar(context, job),
                Expanded(
                  child: provider.isLoading
                      ? const Center(child: CircularProgressIndicator())
                      : job == null
                      ? Center(
                          child: Text(
                            provider.error ?? 'No active job.',
                            style: TextStyle(
                              fontSize: SizeConfig.sp(14),
                              color: AppColors.textMedium,
                            ),
                          ),
                        )
                      : SingleChildScrollView(
                          padding: EdgeInsets.symmetric(
                            horizontal: SizeConfig.hPad,
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              SizedBox(height: SizeConfig.r(12)),
                              _MapCard(
                                totalEta: job.totalEta,
                                totalDistance: job.totalDistance,
                                onNavigate: () => context
                                    .read<JobProvider>()
                                    .navigateFullRoute(),
                              ),
                              SizedBox(height: SizeConfig.r(20)),
                              Text(
                                'Pickup Stops',
                                style: TextStyle(
                                  fontSize: SizeConfig.sp(17),
                                  fontWeight: FontWeight.w700,
                                  color: AppColors.textDark,
                                ),
                              ),
                              SizedBox(height: SizeConfig.r(12)),
                              ...job.pickups.map(
                                (stop) => Padding(
                                  padding: EdgeInsets.only(
                                    bottom: SizeConfig.r(10),
                                  ),
                                  child: _StopCard(
                                    number: stop.stopNumber,
                                    address: stop.locationName,
                                    eta: stop.eta,
                                    status: stop.status,
                                    hasCoordinates: stop.hasCoordinates,
                                  ),
                                ),
                              ),
                              SizedBox(height: SizeConfig.r(6)),
                            ],
                          ),
                        ),
                ),
                if (job != null) _BottomBar(job: job),
              ],
            );
          },
        ),
      ),
    );
  }

  Widget _buildAppBar(BuildContext context, dynamic job) {
    final totalStudents = job?.totalPickups ?? 0;
    final locationCount = job != null
        ? (job.pickups.map((p) => p.locationName).toSet().length)
        : 0;

    return Padding(
      padding: EdgeInsets.symmetric(
        horizontal: SizeConfig.r(8),
        vertical: SizeConfig.r(8),
      ),
      child: Row(
        children: [
          IconButton(
            onPressed: () => Navigator.maybePop(context),
            icon: Icon(
              Icons.arrow_back,
              color: AppColors.textDark,
              size: SizeConfig.r(22),
            ),
          ),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Job Route',
                  style: TextStyle(
                    fontSize: SizeConfig.sp(17),
                    fontWeight: FontWeight.w700,
                    color: AppColors.textDark,
                  ),
                ),
                Text(
                  '$totalStudents Students • $locationCount Locations',
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
              width: SizeConfig.r(38),
              height: SizeConfig.r(38),
              decoration: const BoxDecoration(
                color: AppColors.error,
                shape: BoxShape.circle,
              ),
              alignment: Alignment.center,
              child: Text(
                'SOS',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: SizeConfig.sp(11),
                  fontWeight: FontWeight.w800,
                ),
              ),
            ),
          ),
          SizedBox(width: SizeConfig.r(8)),
          Container(
            width: SizeConfig.r(38),
            height: SizeConfig.r(38),
            decoration: BoxDecoration(
              color: AppColors.surfaceGray,
              shape: BoxShape.circle,
            ),
            child: Icon(
              Icons.person_outline,
              color: AppColors.textMedium,
              size: SizeConfig.r(20),
            ),
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Map Card
// ─────────────────────────────────────────────────────────────────────────────

class _MapCard extends StatelessWidget {
  final String totalEta;
  final String totalDistance;
  final VoidCallback onNavigate;

  const _MapCard({
    required this.totalEta,
    required this.totalDistance,
    required this.onNavigate,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFFDCEEFD),
        borderRadius: BorderRadius.circular(SizeConfig.radiusLG),
      ),
      child: Column(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.vertical(
              top: Radius.circular(SizeConfig.radiusLG),
            ),
            child: SizedBox(
              height: SizeConfig.r(160),
              width: double.infinity,
              child: CustomPaint(
                painter: _RoutePainter(),
                child: Align(
                  alignment: const Alignment(0.2, 0.0),
                  child: Container(
                    width: SizeConfig.r(32),
                    height: SizeConfig.r(32),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(SizeConfig.r(6)),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.1),
                          blurRadius: 4,
                        ),
                      ],
                    ),
                    child: Icon(
                      Icons.crop_free,
                      size: SizeConfig.r(18),
                      color: AppColors.textMedium,
                    ),
                  ),
                ),
              ),
            ),
          ),
          Padding(
            padding: EdgeInsets.all(SizeConfig.r(14)),
            child: Column(
              children: [
                Row(
                  children: [
                    _EtaItem(label: 'Total ETA', value: totalEta),
                    SizedBox(width: SizeConfig.r(24)),
                    _EtaItem(label: 'Distance', value: totalDistance),
                  ],
                ),
                SizedBox(height: SizeConfig.r(12)),
                SizedBox(
                  width: double.infinity,
                  height: SizeConfig.r(46),
                  child: ElevatedButton.icon(
                    onPressed: onNavigate,
                    icon: Icon(
                      Icons.navigation_outlined,
                      color: Colors.white,
                      size: SizeConfig.r(18),
                    ),
                    label: Text(
                      'Start Navigation',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: SizeConfig.sp(15),
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF0284C7),
                      elevation: 0,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(SizeConfig.radius),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _EtaItem extends StatelessWidget {
  final String label;
  final String value;
  const _EtaItem({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: SizeConfig.sp(11),
            color: AppColors.textLight,
          ),
        ),
        Text(
          value.isEmpty ? '—' : value,
          style: TextStyle(
            fontSize: SizeConfig.sp(16),
            fontWeight: FontWeight.w700,
            color: AppColors.textDark,
          ),
        ),
      ],
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Route Painter
// ─────────────────────────────────────────────────────────────────────────────

class _RoutePainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final dotPaint = Paint()
      ..color = const Color(0xFF0284C7)
      ..style = PaintingStyle.fill;

    final linePaint = Paint()
      ..color = const Color(0xFF0284C7).withValues(alpha: 0.7)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.5
      ..strokeCap = StrokeCap.round;

    final p1 = Offset(size.width * 0.12, size.height * 0.72);
    final p2 = Offset(size.width * 0.50, size.height * 0.28);
    final p3 = Offset(size.width * 0.88, size.height * 0.22);

    _drawDashedCurve(canvas, linePaint, p1, p2, p3, size);

    for (final p in [p1, p2, p3]) {
      canvas.drawCircle(p, 6, Paint()..color = Colors.white);
      canvas.drawCircle(p, 5, dotPaint);
    }
  }

  void _drawDashedCurve(
    Canvas canvas,
    Paint paint,
    Offset p1,
    Offset p2,
    Offset p3,
    Size size,
  ) {
    final path = Path();
    final ctrl1 = Offset(p1.dx + (p2.dx - p1.dx) * 0.5, p1.dy);
    final ctrl2 = Offset(p2.dx - (p2.dx - p1.dx) * 0.2, p2.dy);
    final ctrl3 = Offset(p2.dx + (p3.dx - p2.dx) * 0.3, p2.dy);
    final ctrl4 = Offset(p3.dx - (p3.dx - p2.dx) * 0.3, p3.dy);

    path.moveTo(p1.dx, p1.dy);
    path.cubicTo(ctrl1.dx, ctrl1.dy, ctrl2.dx, ctrl2.dy, p2.dx, p2.dy);
    path.cubicTo(ctrl3.dx, ctrl3.dy, ctrl4.dx, ctrl4.dy, p3.dx, p3.dy);

    const dashLen = 8.0;
    const gapLen = 5.0;
    final metrics = path.computeMetrics();
    for (final metric in metrics) {
      double dist = 0;
      bool draw = true;
      while (dist < metric.length) {
        final end = min(dist + (draw ? dashLen : gapLen), metric.length);
        if (draw) canvas.drawPath(metric.extractPath(dist, end), paint);
        dist = end;
        draw = !draw;
      }
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter old) => false;
}

// ─────────────────────────────────────────────────────────────────────────────
// Stop Card
// ─────────────────────────────────────────────────────────────────────────────

class _StopCard extends StatelessWidget {
  final int number;
  final String address;
  final String eta;
  final PickupStatus status;
  final bool hasCoordinates;

  const _StopCard({
    required this.number,
    required this.address,
    required this.eta,
    required this.status,
    required this.hasCoordinates,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: SizeConfig.r(14),
        vertical: SizeConfig.r(14),
      ),
      decoration: BoxDecoration(
        color: AppColors.background,
        borderRadius: BorderRadius.circular(SizeConfig.radiusLG),
        border: Border.all(color: AppColors.inputBorder, width: 1),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: SizeConfig.r(32),
            height: SizeConfig.r(32),
            decoration: const BoxDecoration(
              color: Color(0xFF0284C7),
              shape: BoxShape.circle,
            ),
            alignment: Alignment.center,
            child: Text(
              '$number',
              style: TextStyle(
                color: Colors.white,
                fontSize: SizeConfig.sp(14),
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
          SizedBox(width: SizeConfig.r(12)),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  address,
                  style: TextStyle(
                    fontSize: SizeConfig.sp(14),
                    fontWeight: FontWeight.w600,
                    color: AppColors.textDark,
                  ),
                ),
                if (eta.isNotEmpty) ...[
                  SizedBox(height: SizeConfig.r(4)),
                  Text(
                    eta,
                    style: TextStyle(
                      fontSize: SizeConfig.sp(12),
                      color: AppColors.textLight,
                    ),
                  ),
                ],
                SizedBox(height: SizeConfig.r(4)),
                Row(
                  children: [
                    Icon(
                      hasCoordinates ? Icons.location_on : Icons.location_off,
                      size: SizeConfig.r(12),
                      color: hasCoordinates
                          ? AppColors.success
                          : AppColors.textLight,
                    ),
                    SizedBox(width: SizeConfig.r(3)),
                    Text(
                      hasCoordinates ? 'GPS ready' : 'No GPS data',
                      style: TextStyle(
                        fontSize: SizeConfig.sp(11),
                        color: hasCoordinates
                            ? AppColors.success
                            : AppColors.textLight,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          _StatusBadge(status: status),
        ],
      ),
    );
  }
}

class _StatusBadge extends StatelessWidget {
  final PickupStatus status;
  const _StatusBadge({required this.status});

  @override
  Widget build(BuildContext context) {
    Color bg;
    Color fg;
    String label;
    switch (status) {
      case PickupStatus.completed:
        bg = AppColors.success.withValues(alpha: 0.15);
        fg = AppColors.success;
        label = 'Picked Up';
        break;
      case PickupStatus.notPicked:
        bg = AppColors.error.withValues(alpha: 0.13);
        fg = AppColors.error;
        label = 'Missed';
        break;
      case PickupStatus.pending:
        bg = AppColors.warning.withValues(alpha: 0.15);
        fg = AppColors.warning;
        label = 'Pending';
        break;
    }
    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: SizeConfig.r(8),
        vertical: SizeConfig.r(3),
      ),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(SizeConfig.r(4)),
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
// Bottom Bar
// ── KEY CHANGE: "Continue Journey" now calls ensureSessionStarted() first
//   so that job_session + job_session_passengers rows exist before the
//   driver reaches PickupQuePage and tries to mark pickups.
// ─────────────────────────────────────────────────────────────────────────────

class _BottomBar extends StatelessWidget {
  final JobModel job;
  const _BottomBar({required this.job});

  @override
  Widget build(BuildContext context) {
    final completed = job.completedCount;
    final total = job.totalPickups;
    final progress = job.progressFraction;
    final percent = (progress * 100).round();

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
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Picked Up $completed of $total Students',
                style: TextStyle(
                  fontSize: SizeConfig.sp(13),
                  color: AppColors.textMedium,
                  fontWeight: FontWeight.w500,
                ),
              ),
              Text(
                '$percent%',
                style: TextStyle(
                  fontSize: SizeConfig.sp(13),
                  fontWeight: FontWeight.w600,
                  color: AppColors.textMedium,
                ),
              ),
            ],
          ),
          SizedBox(height: SizeConfig.r(6)),
          ClipRRect(
            borderRadius: BorderRadius.circular(SizeConfig.r(4)),
            child: LinearProgressIndicator(
              value: progress,
              minHeight: SizeConfig.r(5),
              backgroundColor: AppColors.inputBorder,
              valueColor: const AlwaysStoppedAnimation<Color>(
                Color(0xFF0284C7),
              ),
            ),
          ),
          SizedBox(height: SizeConfig.r(12)),
          AppButton(
            label: 'Continue Journey',
            borderRadius: SizeConfig.radiusLG,
            onPressed: () async {
              final provider = context.read<JobProvider>();

              // Create session + snapshot passengers if not yet started.
              // This is the earliest point the driver has confirmed intent
              // to start the run.
              await provider.ensureSessionStarted();

              if (!context.mounted) return;

              if (provider.allResolved) {
                Navigator.pushNamed(context, AppRoutes.completeJob);
              } else {
                Navigator.pushNamed(context, AppRoutes.pickupQueue);
              }
            },
          ),
        ],
      ),
    );
  }
}
