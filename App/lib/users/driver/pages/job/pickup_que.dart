import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../../components/app_button.dart';
import '../../../../providers/job_provider.dart';
import '../../../../routes/app_routes.dart';
import '../../../../users/driver/models/job_model.dart';
import '../../../../utils/app_colors.dart';
import '../../../../utils/size_confg.dart';

class PickupQuePage extends StatelessWidget {
  const PickupQuePage({super.key});

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
            final pendingCount = job?.pendingCount ?? 0;

            return Column(
              children: [
                _buildAppBar(context),
                _StatusBar(pendingCount: pendingCount),
                Expanded(
                  child: job == null
                      ? const Center(child: CircularProgressIndicator())
                      : active == null
                          ? Center(
                              child: Text(
                                'No more pickups.',
                                style: TextStyle(
                                  fontSize: SizeConfig.sp(14),
                                  color: AppColors.textMedium,
                                ),
                              ),
                            )
                          : SingleChildScrollView(
                              padding: EdgeInsets.all(SizeConfig.r(16)),
                              child: Column(
                                children: [
                                  // Current (active) pickup card
                                  _PassengerCard(
                                    stop: active,
                                    jobId: job.jobId,
                                    dropoffLocation: job.dropoffLocation,
                                    isActive: true,
                                    showPriority: true,
                                  ),
                                  // All remaining pending stops shown greyed out
                                  ...upcoming.map(
                                        (stop) => Padding(
                                          padding: EdgeInsets.only(
                                              top: SizeConfig.r(12)),
                                          child: _PassengerCard(
                                            stop: stop,
                                            jobId: job.jobId,
                                            dropoffLocation: job.dropoffLocation,
                                            isActive: false,
                                            showPriority: false,
                                          ),
                                        ),
                                      ),
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

  Widget _buildAppBar(BuildContext context) {
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
              'Pickup Queue',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: SizeConfig.sp(17),
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
          SizedBox(width: SizeConfig.r(8)),
          Icon(
            Icons.notifications_outlined,
            color: AppColors.textDark,
            size: SizeConfig.r(24),
          ),
          SizedBox(width: SizeConfig.r(8)),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Status Bar
// ─────────────────────────────────────────────────────────────────────────────

class _StatusBar extends StatelessWidget {
  final int pendingCount;

  const _StatusBar({required this.pendingCount});

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
                'Online',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: SizeConfig.sp(13),
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
          Text(
            '$pendingCount pickup${pendingCount == 1 ? '' : 's'} pending',
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
// Location data model (local UI helper)
// ─────────────────────────────────────────────────────────────────────────────

class _Location {
  final String label;
  final String address;
  final Color dotColor;

  const _Location({
    required this.label,
    required this.address,
    required this.dotColor,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Passenger Card
// ─────────────────────────────────────────────────────────────────────────────

class _PassengerCard extends StatelessWidget {
  final PickupStop stop;
  final String jobId;
  final String dropoffLocation;
  final bool isActive;
  final bool showPriority;

  const _PassengerCard({
    required this.stop,
    required this.jobId,
    required this.dropoffLocation,
    required this.isActive,
    required this.showPriority,
  });

  @override
  Widget build(BuildContext context) {
    final pickup = _Location(
      label: stop.locationName,
      address: stop.address,
      dotColor: isActive ? AppColors.success : AppColors.textLight,
    );
    final dropoff = _Location(
      label: 'Drop-off Destination',
      address: dropoffLocation,
      dotColor: isActive ? AppColors.error : AppColors.textLight,
    );

    return Container(
      padding: EdgeInsets.all(SizeConfig.r(16)),
      decoration: BoxDecoration(
        color: AppColors.background,
        borderRadius: BorderRadius.circular(SizeConfig.radiusLG),
        border: Border.all(color: AppColors.inputBorder, width: 1),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header row: avatar + name/time + priority badge
          Row(
            children: [
              CircleAvatar(
                radius: SizeConfig.r(22),
                backgroundColor: AppColors.surfaceGray,
                child: Icon(
                  Icons.person,
                  color: isActive ? AppColors.primary : AppColors.textLight,
                  size: SizeConfig.r(24),
                ),
              ),
              SizedBox(width: SizeConfig.r(10)),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      stop.passengerName,
                      style: TextStyle(
                        fontSize: SizeConfig.sp(15),
                        fontWeight: FontWeight.w700,
                        color: isActive
                            ? AppColors.textDark
                            : AppColors.textLight,
                      ),
                    ),
                    SizedBox(height: SizeConfig.r(2)),
                    Text(
                      stop.eta,
                      style: TextStyle(
                        fontSize: SizeConfig.sp(12),
                        color: AppColors.textLight,
                      ),
                    ),
                  ],
                ),
              ),
              if (showPriority) _PriorityBadge(),
            ],
          ),
          SizedBox(height: SizeConfig.r(14)),
          // Pickup location
          _LocationRow(location: pickup, isActive: isActive),
          SizedBox(height: SizeConfig.r(10)),
          // Dropoff location
          _LocationRow(location: dropoff, isActive: isActive),
          SizedBox(height: SizeConfig.r(16)),
          // Action buttons
          _ActionButtons(isActive: isActive, stop: stop, jobId: jobId),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Priority Badge
// ─────────────────────────────────────────────────────────────────────────────

class _PriorityBadge extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    SizeConfig.init(context);
    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: SizeConfig.r(10),
        vertical: SizeConfig.r(4),
      ),
      decoration: BoxDecoration(
        color: AppColors.warning.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(SizeConfig.r(6)),
        border: Border.all(
          color: AppColors.warning.withValues(alpha: 0.4),
          width: 1,
        ),
      ),
      child: Text(
        'Priority',
        style: TextStyle(
          fontSize: SizeConfig.sp(12),
          fontWeight: FontWeight.w600,
          color: AppColors.warning,
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Location Row
// ─────────────────────────────────────────────────────────────────────────────

class _LocationRow extends StatelessWidget {
  final _Location location;
  final bool isActive;

  const _LocationRow({required this.location, required this.isActive});

  @override
  Widget build(BuildContext context) {
    SizeConfig.init(context);
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: EdgeInsets.only(top: SizeConfig.r(3)),
          child: Container(
            width: SizeConfig.r(10),
            height: SizeConfig.r(10),
            decoration: BoxDecoration(
              color: location.dotColor,
              shape: BoxShape.circle,
            ),
          ),
        ),
        SizedBox(width: SizeConfig.r(10)),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              location.label,
              style: TextStyle(
                fontSize: SizeConfig.sp(13),
                fontWeight: FontWeight.w600,
                color: isActive ? AppColors.textDark : AppColors.textLight,
              ),
            ),
            Text(
              location.address,
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
// Action Buttons Row
// ─────────────────────────────────────────────────────────────────────────────

class _ActionButtons extends StatelessWidget {
  final bool isActive;
  final PickupStop stop;
  final String jobId;

  const _ActionButtons({
    required this.isActive,
    required this.stop,
    required this.jobId,
  });

  @override
  Widget build(BuildContext context) {
    SizeConfig.init(context);
    final activeColor = const Color(0xFF0284C7);
    final inactiveColor = AppColors.textLight;

    return Row(
      children: [
        // Pickup
        _ActionBtn(
          label: 'Pickup',
          backgroundColor: isActive ? activeColor : inactiveColor,
          textColor: Colors.white,
          isFilled: true,
          onTap: isActive
              ? () => Navigator.pushNamed(context, AppRoutes.pickupPage)
              : null,
        ),
        SizedBox(width: SizeConfig.r(8)),
        // No pickup
        _ActionBtn(
          label: 'No pickup',
          backgroundColor: isActive ? AppColors.error : inactiveColor,
          textColor: Colors.white,
          isFilled: true,
          onTap: isActive
              ? () async {
                  final provider = context.read<JobProvider>();
                  await provider.markCurrentAsNotPicked();
                  if (!context.mounted) return;
                  provider.advanceToNextPickup();
                }
              : null,
        ),
        SizedBox(width: SizeConfig.r(8)),
        // Extended wait
        Expanded(
          child: _ActionBtn(
            label: 'Extended wait',
            backgroundColor: Colors.transparent,
            textColor: isActive ? activeColor : inactiveColor,
            isFilled: false,
            borderColor: isActive ? activeColor : inactiveColor,
            onTap: isActive
                ? () => showDialog(
                      context: context,
                      barrierColor: Colors.black.withValues(alpha: 0.65),
                      builder: (_) => _ExtendedWaitDialog(
                        jobId: jobId,
                        passengerName: stop.passengerName,
                        pickupAddress: stop.address,
                      ),
                    )
                : null,
          ),
        ),
      ],
    );
  }
}

class _ActionBtn extends StatelessWidget {
  final String label;
  final Color backgroundColor;
  final Color textColor;
  final bool isFilled;
  final Color? borderColor;
  final VoidCallback? onTap;

  const _ActionBtn({
    required this.label,
    required this.backgroundColor,
    required this.textColor,
    required this.isFilled,
    this.borderColor,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        height: SizeConfig.r(38),
        padding: EdgeInsets.symmetric(horizontal: SizeConfig.r(12)),
        decoration: BoxDecoration(
          color: isFilled ? backgroundColor : Colors.transparent,
          borderRadius: BorderRadius.circular(SizeConfig.radius),
          border: !isFilled
              ? Border.all(color: borderColor ?? textColor, width: 1.5)
              : null,
        ),
        alignment: Alignment.center,
        child: Text(
          label,
          style: TextStyle(
            fontSize: SizeConfig.sp(12),
            fontWeight: FontWeight.w600,
            color: isFilled ? textColor : textColor,
          ),
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Extended Wait Dialog
// ─────────────────────────────────────────────────────────────────────────────

class _ExtendedWaitDialog extends StatefulWidget {
  final String jobId;
  final String passengerName;
  final String pickupAddress;

  const _ExtendedWaitDialog({
    required this.jobId,
    required this.passengerName,
    required this.pickupAddress,
  });

  @override
  State<_ExtendedWaitDialog> createState() => _ExtendedWaitDialogState();
}

class _ExtendedWaitDialogState extends State<_ExtendedWaitDialog> {
  final _timeController = TextEditingController(text: '0');

  @override
  void dispose() {
    _timeController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    SizeConfig.init(context);
    return Dialog(
      backgroundColor: Colors.transparent,
      insetPadding: EdgeInsets.symmetric(horizontal: SizeConfig.r(20)),
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.background,
          borderRadius: BorderRadius.circular(SizeConfig.r(16)),
        ),
        padding: EdgeInsets.all(SizeConfig.r(20)),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header row
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(
                      'Current Delivery',
                      style: TextStyle(
                        fontSize: SizeConfig.sp(18),
                        fontWeight: FontWeight.w800,
                        color: AppColors.textDark,
                      ),
                    ),
                    SizedBox(width: SizeConfig.r(8)),
                    Text(
                      'Active',
                      style: TextStyle(
                        fontSize: SizeConfig.sp(14),
                        fontWeight: FontWeight.w600,
                        color: AppColors.success,
                      ),
                    ),
                  ],
                ),
                GestureDetector(
                  onTap: () => Navigator.pop(context),
                  child: Icon(
                    Icons.close,
                    size: SizeConfig.r(22),
                    color: AppColors.textDark,
                  ),
                ),
              ],
            ),
            SizedBox(height: SizeConfig.r(18)),
            // Job ID
            Text(
              'Job ID',
              style: TextStyle(
                fontSize: SizeConfig.sp(13),
                color: AppColors.textLight,
              ),
            ),
            SizedBox(height: SizeConfig.r(4)),
            Text(
              widget.jobId,
              style: TextStyle(
                fontSize: SizeConfig.sp(18),
                fontWeight: FontWeight.w800,
                color: AppColors.textDark,
              ),
            ),
            SizedBox(height: SizeConfig.r(16)),
            // Customer
            Text(
              'Customer',
              style: TextStyle(
                fontSize: SizeConfig.sp(13),
                color: AppColors.textLight,
              ),
            ),
            SizedBox(height: SizeConfig.r(4)),
            Text(
              widget.passengerName,
              style: TextStyle(
                fontSize: SizeConfig.sp(16),
                fontWeight: FontWeight.w700,
                color: AppColors.textDark,
              ),
            ),
            SizedBox(height: SizeConfig.r(16)),
            // Pickup address card
            Container(
              width: double.infinity,
              padding: EdgeInsets.all(SizeConfig.r(14)),
              decoration: BoxDecoration(
                color: AppColors.surfaceGray,
                borderRadius: BorderRadius.circular(SizeConfig.radius),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(
                    Icons.location_on,
                    color: AppColors.error,
                    size: SizeConfig.r(20),
                  ),
                  SizedBox(width: SizeConfig.r(10)),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Pickup Address',
                          style: TextStyle(
                            fontSize: SizeConfig.sp(14),
                            fontWeight: FontWeight.w700,
                            color: AppColors.textDark,
                          ),
                        ),
                        SizedBox(height: SizeConfig.r(2)),
                        Text(
                          widget.pickupAddress,
                          style: TextStyle(
                            fontSize: SizeConfig.sp(12),
                            color: AppColors.textMedium,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            SizedBox(height: SizeConfig.r(16)),
            Divider(height: 1, color: AppColors.inputBorder),
            SizedBox(height: SizeConfig.r(16)),
            // Enter time manually row
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Enter Time Manually',
                  style: TextStyle(
                    fontSize: SizeConfig.sp(14),
                    fontWeight: FontWeight.w600,
                    color: AppColors.textDark,
                  ),
                ),
                SizedBox(
                  width: SizeConfig.r(90),
                  height: SizeConfig.r(40),
                  child: TextField(
                    controller: _timeController,
                    keyboardType: TextInputType.number,
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: SizeConfig.sp(16),
                      fontWeight: FontWeight.w700,
                      color: const Color(0xFF0284C7),
                    ),
                    decoration: InputDecoration(
                      suffixText: 'min',
                      suffixStyle: TextStyle(
                        fontSize: SizeConfig.sp(14),
                        fontWeight: FontWeight.w700,
                        color: const Color(0xFF0284C7),
                      ),
                      contentPadding: EdgeInsets.symmetric(
                        horizontal: SizeConfig.r(10),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(SizeConfig.r(8)),
                        borderSide: const BorderSide(
                          color: AppColors.inputBorder,
                          width: 1.5,
                        ),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(SizeConfig.r(8)),
                        borderSide: const BorderSide(
                          color: Color(0xFF0284C7),
                          width: 1.5,
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
            SizedBox(height: SizeConfig.r(16)),
            // Submit button
            AppButton(
              label: 'Submit',
              borderRadius: SizeConfig.radiusLG,
              onPressed: () => Navigator.pop(context),
            ),
          ],
        ),
      ),
    );
  }
}
