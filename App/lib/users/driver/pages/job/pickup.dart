import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../../components/app_button.dart';
import '../../../../providers/job_provider.dart';
import '../../../../routes/app_routes.dart';
import '../../../../users/driver/models/job_model.dart';
import '../../../../utils/app_colors.dart';
import '../../../../utils/size_confg.dart';

class PickupPage extends StatelessWidget {
  const PickupPage({super.key});

  @override
  Widget build(BuildContext context) {
    SizeConfig.init(context);
    return Scaffold(
      backgroundColor: AppColors.surfaceGray,
      body: SafeArea(
        child: Consumer<JobProvider>(
          builder: (context, provider, _) {
            final job = provider.job;
            final active = provider.activePickup;
            final upcoming = provider.upcomingPickups;
            final completed = job?.completedCount ?? 0;
            final total = job?.totalPickups ?? 0;

            return Column(
              children: [
                _buildAppBar(context, job?.routeNumber ?? ''),
                _StatusBar(completed: completed, total: total),
                Expanded(
                  child: job == null || active == null
                      ? const Center(child: CircularProgressIndicator())
                      : SingleChildScrollView(
                          padding: EdgeInsets.all(SizeConfig.r(16)),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              // Current Stop label + ETA
                              Row(
                                mainAxisAlignment:
                                    MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(
                                    'CURRENT STOP',
                                    style: TextStyle(
                                      fontSize: SizeConfig.sp(11),
                                      fontWeight: FontWeight.w700,
                                      color: AppColors.textLight,
                                      letterSpacing: 1.0,
                                    ),
                                  ),
                                  Text(
                                    'ETA: ${active.scheduledTime}',
                                    style: TextStyle(
                                      fontSize: SizeConfig.sp(12),
                                      color: AppColors.textLight,
                                    ),
                                  ),
                                ],
                              ),
                              SizedBox(height: SizeConfig.r(10)),
                              // Active stop card
                              _ActiveStopCard(stop: active),
                              SizedBox(height: SizeConfig.r(20)),
                              // Upcoming stops section
                              if (upcoming.isNotEmpty) ...[
                                Text(
                                  'Upcoming Stops',
                                  style: TextStyle(
                                    fontSize: SizeConfig.sp(16),
                                    fontWeight: FontWeight.w700,
                                    color: AppColors.textDark,
                                  ),
                                ),
                                SizedBox(height: SizeConfig.r(10)),
                                ...upcoming.take(3).map(
                                      (s) => Padding(
                                        padding: EdgeInsets.only(
                                            bottom: SizeConfig.r(10)),
                                        child: _UpcomingStopCard(
                                          number: s.stopNumber,
                                          locationName: s.locationName,
                                          time: s.scheduledTime,
                                          address: s.address,
                                          passengerName: s.passengerName,
                                        ),
                                      ),
                                    ),
                                if (upcoming.length > 3) ...[
                                  SizedBox(height: SizeConfig.r(4)),
                                  Center(
                                    child: Text(
                                      '... ${upcoming.length - 3} more stop${upcoming.length - 3 == 1 ? '' : 's'} remaining',
                                      style: TextStyle(
                                        fontSize: SizeConfig.sp(13),
                                        color: AppColors.textLight,
                                      ),
                                    ),
                                  ),
                                ],
                              ],
                              SizedBox(height: SizeConfig.r(16)),
                            ],
                          ),
                        ),
                ),
                _BottomBar(stop: active),
              ],
            );
          },
        ),
      ),
    );
  }

  Widget _buildAppBar(BuildContext context, String routeNumber) {
    return Container(
      color: AppColors.background,
      padding: EdgeInsets.symmetric(
        horizontal: SizeConfig.r(4),
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
            child: Text(
              'Job Route #$routeNumber',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: SizeConfig.sp(16),
                fontWeight: FontWeight.w700,
                color: AppColors.textDark,
              ),
            ),
          ),
          // SOS button
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
}

// ─────────────────────────────────────────────────────────────────────────────
// Status Bar
// ─────────────────────────────────────────────────────────────────────────────

class _StatusBar extends StatelessWidget {
  final int completed;
  final int total;

  const _StatusBar({required this.completed, required this.total});

  @override
  Widget build(BuildContext context) {
    SizeConfig.init(context);
    return Container(
      width: double.infinity,
      color: const Color(0xFF0284C7),
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
            '$completed/$total Completed',
            style: TextStyle(
              color: Colors.white,
              fontSize: SizeConfig.sp(13),
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Active Stop Card
// ─────────────────────────────────────────────────────────────────────────────

class _ActiveStopCard extends StatelessWidget {
  final PickupStop stop;

  const _ActiveStopCard({required this.stop});

  @override
  Widget build(BuildContext context) {
    SizeConfig.init(context);
    return Container(
      padding: EdgeInsets.all(SizeConfig.r(16)),
      decoration: BoxDecoration(
        color: AppColors.background,
        borderRadius: BorderRadius.circular(SizeConfig.radiusLG),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Stop number + name
          Row(
            crossAxisAlignment: CrossAxisAlignment.center,
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
                  '${stop.stopNumber}',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: SizeConfig.sp(14),
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
              SizedBox(width: SizeConfig.r(12)),
              Expanded(
                child: Text(
                  stop.locationName,
                  style: TextStyle(
                    fontSize: SizeConfig.sp(15),
                    fontWeight: FontWeight.w700,
                    color: AppColors.textDark,
                  ),
                ),
              ),
            ],
          ),
          SizedBox(height: SizeConfig.r(10)),
          // Full address
          Text(
            stop.address,
            style: TextStyle(
              fontSize: SizeConfig.sp(13),
              color: AppColors.textLight,
            ),
          ),
          SizedBox(height: SizeConfig.r(12)),
          // Passenger info
          Row(
            children: [
              Icon(
                Icons.person_outline,
                size: SizeConfig.r(16),
                color: AppColors.textMedium,
              ),
              SizedBox(width: SizeConfig.r(6)),
              Text(
                stop.passengerName,
                style: TextStyle(
                  fontSize: SizeConfig.sp(13),
                  fontWeight: FontWeight.w600,
                  color: AppColors.textDark,
                ),
              ),
              SizedBox(width: SizeConfig.r(20)),
              Icon(
                Icons.phone_outlined,
                size: SizeConfig.r(16),
                color: AppColors.textMedium,
              ),
              SizedBox(width: SizeConfig.r(6)),
              Text(
                stop.passengerPhone,
                style: TextStyle(
                  fontSize: SizeConfig.sp(13),
                  color: AppColors.textDark,
                ),
              ),
            ],
          ),
          SizedBox(height: SizeConfig.r(16)),
          // Action buttons
          Row(
            children: [
              Expanded(
                child: AppButton(
                  label: 'Navigate',
                  borderRadius: SizeConfig.radiusLG,
                  onPressed: () {},
                ),
              ),
              SizedBox(width: SizeConfig.r(10)),
              Expanded(
                child: ElevatedButton(
                  onPressed: () {
                    final provider = context.read<JobProvider>();
                    provider.markCurrentAsCompleted();
                    provider.advanceToNextPickup();
                    // If that was the last pickup, go straight to complete job.
                    if (provider.allResolved) {
                      Navigator.pushNamedAndRemoveUntil(
                        context,
                        AppRoutes.completeJob,
                        ModalRoute.withName(AppRoutes.routeDetail),
                      );
                    } else {
                      // More pickups remain — pop back to the queue.
                      Navigator.maybePop(context);
                    }
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.success,
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(SizeConfig.radius),
                    ),
                    padding:
                        EdgeInsets.symmetric(vertical: SizeConfig.r(11)),
                  ),
                  child: Text(
                    'Pickup complete',
                    style: TextStyle(
                      fontSize: SizeConfig.sp(13),
                      fontWeight: FontWeight.w600,
                      color: Colors.white,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Upcoming Stop Card
// ─────────────────────────────────────────────────────────────────────────────

class _UpcomingStopCard extends StatelessWidget {
  final int number;
  final String locationName;
  final String time;
  final String address;
  final String passengerName;

  const _UpcomingStopCard({
    required this.number,
    required this.locationName,
    required this.time,
    required this.address,
    required this.passengerName,
  });

  @override
  Widget build(BuildContext context) {
    SizeConfig.init(context);
    return Container(
      padding: EdgeInsets.all(SizeConfig.r(14)),
      decoration: BoxDecoration(
        color: AppColors.background,
        borderRadius: BorderRadius.circular(SizeConfig.radiusLG),
        border: Border.all(color: AppColors.inputBorder, width: 1),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Number circle
          Container(
            width: SizeConfig.r(30),
            height: SizeConfig.r(30),
            decoration: BoxDecoration(
              color: AppColors.surfaceGray,
              shape: BoxShape.circle,
              border: Border.all(color: AppColors.inputBorder, width: 1),
            ),
            alignment: Alignment.center,
            child: Text(
              '$number',
              style: TextStyle(
                fontSize: SizeConfig.sp(13),
                fontWeight: FontWeight.w700,
                color: AppColors.textMedium,
              ),
            ),
          ),
          SizedBox(width: SizeConfig.r(12)),
          // Details
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Text(
                        locationName,
                        style: TextStyle(
                          fontSize: SizeConfig.sp(14),
                          fontWeight: FontWeight.w600,
                          color: AppColors.textDark,
                        ),
                      ),
                    ),
                    Text(
                      time,
                      style: TextStyle(
                        fontSize: SizeConfig.sp(12),
                        color: AppColors.textLight,
                      ),
                    ),
                  ],
                ),
                SizedBox(height: SizeConfig.r(4)),
                Text(
                  address,
                  style: TextStyle(
                    fontSize: SizeConfig.sp(12),
                    color: AppColors.textLight,
                  ),
                ),
                SizedBox(height: SizeConfig.r(6)),
                Row(
                  children: [
                    Icon(
                      Icons.person_outline,
                      size: SizeConfig.r(14),
                      color: AppColors.textLight,
                    ),
                    SizedBox(width: SizeConfig.r(4)),
                    Text(
                      passengerName,
                      style: TextStyle(
                        fontSize: SizeConfig.sp(12),
                        color: AppColors.textMedium,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Bottom Bar
// ─────────────────────────────────────────────────────────────────────────────

class _BottomBar extends StatelessWidget {
  final PickupStop? stop;

  const _BottomBar({required this.stop});

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
      child: AppButton(
        label: 'Continue Journey',
        borderRadius: SizeConfig.radiusLG,
        onPressed: stop == null
            ? null
            : () {
                final provider = context.read<JobProvider>();
                // "Pickup complete" already advanced the index.
                // Just decide where to navigate based on current state.
                if (provider.allResolved) {
                  // All done — go to complete job.
                  Navigator.pushNamedAndRemoveUntil(
                    context,
                    AppRoutes.completeJob,
                    ModalRoute.withName(AppRoutes.routeDetail),
                  );
                } else {
                  // More pickups remain — go to pickup queue.
                  Navigator.pushNamedAndRemoveUntil(
                    context,
                    AppRoutes.pickupQueue,
                    ModalRoute.withName(AppRoutes.routeDetail),
                  );
                }
              },
      ),
    );
  }
}
