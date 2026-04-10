import 'package:flutter/material.dart';
import '../../../../components/app_button.dart';
import '../../../../utils/app_colors.dart';
import '../../../../utils/size_confg.dart';

class RequestedJobsPage extends StatelessWidget {
  const RequestedJobsPage({super.key});

  @override
  Widget build(BuildContext context) {
    SizeConfig.init(context);
    return Scaffold(
      backgroundColor: const Color(0xFF1B2B4B),
      body: SafeArea(
        child: Column(
          children: [
            // ── Map area ───────────────────────────────────────────────
            _MapPlaceholder(),
            // ── Job detail sheet ───────────────────────────────────────
            Expanded(
              child: Container(
                decoration: BoxDecoration(
                  color: AppColors.background,
                  borderRadius: BorderRadius.only(
                    topLeft: Radius.circular(SizeConfig.r(20)),
                    topRight: Radius.circular(SizeConfig.r(20)),
                  ),
                ),
                child: Column(
                  children: [
                    // Drag handle
                    SizedBox(height: SizeConfig.r(10)),
                    Container(
                      width: SizeConfig.r(40),
                      height: SizeConfig.r(4),
                      decoration: BoxDecoration(
                        color: AppColors.inputBorder,
                        borderRadius: BorderRadius.circular(SizeConfig.r(2)),
                      ),
                    ),
                    SizedBox(height: SizeConfig.r(4)),
                    // Scrollable content
                    Expanded(
                      child: SingleChildScrollView(
                        padding: EdgeInsets.symmetric(
                          horizontal: SizeConfig.hPad,
                          vertical: SizeConfig.r(12),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            _JobHeader(),
                            SizedBox(height: SizeConfig.r(4)),
                            _JobTitle(),
                            SizedBox(height: SizeConfig.r(16)),
                            _StopsList(),
                            SizedBox(height: SizeConfig.r(8)),
                          ],
                        ),
                      ),
                    ),
                    // Fixed bottom buttons
                    _BottomActions(context: context),
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
// Map Placeholder
// ─────────────────────────────────────────────────────────────────────────────

class _MapPlaceholder extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        Container(
          height: SizeConfig.sh(32),
          width: double.infinity,
          color: const Color(0xFF1B2B4B),
          child: Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  Icons.map_outlined,
                  color: Colors.white.withValues(alpha: 0.3),
                  size: SizeConfig.r(48),
                ),
                SizedBox(height: SizeConfig.r(8)),
                Text(
                  'Map',
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.3),
                    fontSize: SizeConfig.sp(16),
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
        ),
        // Back button
        Positioned(
          top: SizeConfig.r(8),
          left: SizeConfig.r(8),
          child: Builder(
            builder: (context) => GestureDetector(
              onTap: () => Navigator.maybePop(context),
              child: Container(
                width: SizeConfig.r(36),
                height: SizeConfig.r(36),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.15),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  Icons.arrow_back,
                  color: Colors.white,
                  size: SizeConfig.r(18),
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Job Header (ASAP badge + price)
// ─────────────────────────────────────────────────────────────────────────────

class _JobHeader extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
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
                color: AppColors.warning,
                borderRadius: BorderRadius.circular(SizeConfig.r(4)),
              ),
              child: Text(
                'ASAP',
                style: TextStyle(
                  fontSize: SizeConfig.sp(11),
                  fontWeight: FontWeight.w700,
                  color: Colors.white,
                ),
              ),
            ),
            SizedBox(width: SizeConfig.r(8)),
            Text(
              '• #JOB-8821',
              style: TextStyle(
                fontSize: SizeConfig.sp(12),
                color: AppColors.textLight,
              ),
            ),
          ],
        ),
        Column(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Text(
              '\$42.50',
              style: TextStyle(
                fontSize: SizeConfig.sp(20),
                fontWeight: FontWeight.w800,
                color: AppColors.warning,
              ),
            ),
            Text(
              'Est. Earnings',
              style: TextStyle(
                fontSize: SizeConfig.sp(11),
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
// Job Title + accessibility note
// ─────────────────────────────────────────────────────────────────────────────

class _JobTitle extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'John Hopkins School',
          style: TextStyle(
            fontSize: SizeConfig.sp(20),
            fontWeight: FontWeight.w800,
            color: AppColors.textDark,
          ),
        ),
        SizedBox(height: SizeConfig.r(4)),
        Text(
          'Wheelchair Accessible Van Required',
          style: TextStyle(
            fontSize: SizeConfig.sp(13),
            color: AppColors.textLight,
          ),
        ),
      ],
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Stops Timeline
// ─────────────────────────────────────────────────────────────────────────────

class _StopItem {
  final String type;
  final String address;
  final String time;
  final bool isDropoff;

  const _StopItem({
    required this.type,
    required this.address,
    required this.time,
    this.isDropoff = false,
  });
}

class _StopsList extends StatelessWidget {
  final _stops = const [
    _StopItem(type: 'Pickup', address: '124 Maple Ave, Springfield', time: '10:30 AM'),
    _StopItem(type: 'Pickup', address: '124 Maple Ave, Springfield', time: '11:15 AM'),
    _StopItem(type: 'Pickup', address: '124 Maple Ave, Springfield', time: '11:30 AM'),
    _StopItem(type: 'Dropoff', address: 'John Hopkins School', time: '12:15 PM', isDropoff: true),
  ];

  const _StopsList();

  @override
  Widget build(BuildContext context) {
    return Column(
      children: _stops.asMap().entries.map((entry) {
        final i = entry.key;
        final stop = entry.value;
        final isLast = i == _stops.length - 1;
        return _StopRow(stop: stop, isLast: isLast);
      }).toList(),
    );
  }
}

class _StopRow extends StatelessWidget {
  final _StopItem stop;
  final bool isLast;

  const _StopRow({required this.stop, required this.isLast});

  @override
  Widget build(BuildContext context) {
    final dotColor = stop.isDropoff ? AppColors.textDark : AppColors.success;

    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Timeline column
          SizedBox(
            width: SizeConfig.r(20),
            child: Column(
              children: [
                SizedBox(height: SizeConfig.r(3)),
                Container(
                  width: SizeConfig.r(10),
                  height: SizeConfig.r(10),
                  decoration: BoxDecoration(
                    color: dotColor,
                    shape: BoxShape.circle,
                  ),
                ),
                if (!isLast)
                  Expanded(
                    child: Container(
                      width: 1.5,
                      color: AppColors.inputBorder,
                      margin: EdgeInsets.symmetric(vertical: SizeConfig.r(2)),
                    ),
                  ),
              ],
            ),
          ),
          SizedBox(width: SizeConfig.r(10)),
          // Stop details
          Expanded(
            child: Padding(
              padding: EdgeInsets.only(bottom: isLast ? 0 : SizeConfig.r(16)),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '${stop.type} •',
                          style: TextStyle(
                            fontSize: SizeConfig.sp(12),
                            fontWeight: FontWeight.w600,
                            color: stop.isDropoff
                                ? AppColors.textMedium
                                : AppColors.success,
                          ),
                        ),
                        SizedBox(height: SizeConfig.r(2)),
                        Text(
                          stop.address,
                          style: TextStyle(
                            fontSize: SizeConfig.sp(13),
                            color: AppColors.textDark,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Text(
                    stop.time,
                    style: TextStyle(
                      fontSize: SizeConfig.sp(12),
                      color: AppColors.textMedium,
                      fontWeight: FontWeight.w500,
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

// ─────────────────────────────────────────────────────────────────────────────
// Bottom Action Buttons
// ─────────────────────────────────────────────────────────────────────────────

class _BottomActions extends StatelessWidget {
  final BuildContext context;

  const _BottomActions({required this.context});

  @override
  Widget build(BuildContext buildContext) {
    return Container(
      padding: EdgeInsets.fromLTRB(
        SizeConfig.hPad,
        SizeConfig.r(10),
        SizeConfig.hPad,
        SizeConfig.r(16),
      ),
      decoration: BoxDecoration(
        color: AppColors.background,
        border: Border(
          top: BorderSide(color: AppColors.inputBorder, width: 1),
        ),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Reject + Counter Offer row
          Row(
            children: [
              Expanded(
                child: _OutlinedActionButton(
                  label: 'Reject',
                  onTap: () => Navigator.maybePop(buildContext),
                ),
              ),
              SizedBox(width: SizeConfig.r(12)),
              Expanded(
                child: _OutlinedActionButton(
                  label: 'Counter Offer',
                  onTap: () {},
                ),
              ),
            ],
          ),
          SizedBox(height: SizeConfig.r(10)),
          // Accept Job button
          AppButton(
            label: 'Accept Job',
            height: SizeConfig.r(50),
            borderRadius: SizeConfig.radiusLG,
            trailingIcon: Icon(
              Icons.arrow_forward,
              color: Colors.white,
              size: SizeConfig.r(18),
            ),
            onPressed: () {},
          ),
        ],
      ),
    );
  }
}

class _OutlinedActionButton extends StatelessWidget {
  final String label;
  final VoidCallback onTap;

  const _OutlinedActionButton({required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        height: SizeConfig.r(46),
        decoration: BoxDecoration(
          color: AppColors.background,
          borderRadius: BorderRadius.circular(SizeConfig.radiusLG),
          border: Border.all(color: AppColors.inputBorder, width: 1.5),
        ),
        alignment: Alignment.center,
        child: Text(
          label,
          style: TextStyle(
            fontSize: SizeConfig.sp(14),
            fontWeight: FontWeight.w600,
            color: AppColors.textDark,
          ),
        ),
      ),
    );
  }
}
