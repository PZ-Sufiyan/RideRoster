import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../../utils/app_colors.dart';
import '../../../../utils/size_confg.dart';
import '../../../../providers/driver_assigned_jobs_provider.dart';
import '../../../../model/pa_job_model.dart';

class _C {
  static const Color blue = Color(0xFF2563EB);
  static const Color blueLight = Color(0xFFEFF6FF);
  static const Color purple = Color(0xFF8B5CF6);
  static const Color purpleLight = Color(0xFFF5F3FF);
  static const Color dotLine = Color(0xFFD1D5DB);
  static const Color chipBg = Color(0xFFF3F4F6);
}

class DriverJobDetailPage extends StatefulWidget {
  const DriverJobDetailPage({super.key});

  @override
  State<DriverJobDetailPage> createState() => _DriverJobDetailPageState();
}

class _DriverJobDetailPageState extends State<DriverJobDetailPage> {
  String _selectedDay = '';

  static const _dayLabels = {
    'mon': 'Mon',
    'tue': 'Tue',
    'wed': 'Wed',
    'thu': 'Thu',
    'fri': 'Fri',
    'sat': 'Sat',
    'sun': 'Sun',
  };

  static String _todayKey() {
    const keys = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    return keys[DateTime.now().weekday - 1];
  }

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<DriverAssignedJobsProvider>().loadIfNeeded();
    });
  }

  void _syncDefaultDay(PaAssignedJobModel model) {
    if (_selectedDay.isNotEmpty) return;
    final days = model.orderedActiveDays;
    if (days.isEmpty) return;
    final today = _todayKey();
    final target = days.contains(today) ? today : days.first;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      if (_selectedDay.isNotEmpty) return;
      setState(() => _selectedDay = target);
    });
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
            _AppBar(),
            Divider(height: 1, thickness: 1, color: AppColors.inputBorder),
            Expanded(
              child: Consumer<DriverAssignedJobsProvider>(
                builder: (_, provider, __) {
                  if (provider.isLoading) {
                    return const Center(child: CircularProgressIndicator());
                  }

                  if (provider.error != null && provider.job == null) {
                    return Center(
                      child: Padding(
                        padding: EdgeInsets.all(SizeConfig.hPad),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              provider.error!,
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                color: AppColors.textMedium,
                                fontSize: SizeConfig.sp(13),
                              ),
                            ),
                            SizedBox(height: SizeConfig.r(16)),
                            TextButton(
                              onPressed: () => context
                                  .read<DriverAssignedJobsProvider>()
                                  .refresh(),
                              child: const Text('Retry'),
                            ),
                          ],
                        ),
                      ),
                    );
                  }

                  if (provider.job == null) {
                    return Center(
                      child: Text(
                        'No job assigned.',
                        style: TextStyle(
                          fontSize: SizeConfig.sp(14),
                          color: AppColors.textMedium,
                        ),
                      ),
                    );
                  }

                  final model = provider.job!;
                  _syncDefaultDay(model);

                  final runs = _selectedDay.isNotEmpty
                      ? model.runsForDay(_selectedDay)
                      : <PaDayRun>[];

                  return RefreshIndicator(
                    onRefresh: () =>
                        context.read<DriverAssignedJobsProvider>().refresh(),
                    child: SingleChildScrollView(
                      physics: const AlwaysScrollableScrollPhysics(),
                      padding: EdgeInsets.symmetric(
                        horizontal: SizeConfig.hPad,
                        vertical: SizeConfig.spaceSM,
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          if (provider.isRefreshing)
                            Padding(
                              padding: EdgeInsets.only(bottom: SizeConfig.r(8)),
                              child: LinearProgressIndicator(
                                minHeight: SizeConfig.r(2),
                                backgroundColor: AppColors.inputBorder,
                                color: _C.blue,
                              ),
                            ),
                          _SemesterBanner(model: model),
                          SizedBox(height: SizeConfig.r(16)),
                          _DaySelector(
                            activeDays: model.orderedActiveDays,
                            selectedDay: _selectedDay,
                            dayLabels: _dayLabels,
                            onDaySelected: (d) =>
                                setState(() => _selectedDay = d),
                          ),
                          SizedBox(height: SizeConfig.r(20)),
                          if (runs.isEmpty)
                            _EmptyDayCard(
                              day: _dayLabels[_selectedDay] ?? _selectedDay,
                            )
                          else
                            ...runs.map(
                              (run) => Padding(
                                padding: EdgeInsets.only(
                                  bottom: SizeConfig.r(16),
                                ),
                                child: _RunSection(run: run),
                              ),
                            ),
                          SizedBox(height: SizeConfig.spaceMD),
                        ],
                      ),
                    ),
                  );
                },
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

class _AppBar extends StatelessWidget {
  const _AppBar();

  @override
  Widget build(BuildContext context) {
    return Container(
      color: AppColors.background,
      padding: EdgeInsets.symmetric(
        horizontal: SizeConfig.r(8),
        vertical: SizeConfig.r(8),
      ),
      child: Row(
        children: [
          IconButton(
            onPressed: () => Navigator.maybePop(context),
            icon: Icon(
              Icons.arrow_back_ios_new,
              color: AppColors.textDark,
              size: SizeConfig.r(20),
            ),
          ),
          Expanded(
            child: Text(
              'Job Detail',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: SizeConfig.sp(17),
                fontWeight: FontWeight.w700,
                color: AppColors.textDark,
              ),
            ),
          ),
          // Balances the back button so the title stays centered.
          SizedBox(width: SizeConfig.r(48)),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Semester Banner
// ─────────────────────────────────────────────────────────────────────────────

class _SemesterBanner extends StatelessWidget {
  final PaAssignedJobModel model;
  const _SemesterBanner({required this.model});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: EdgeInsets.symmetric(
        horizontal: SizeConfig.r(16),
        vertical: SizeConfig.r(14),
      ),
      decoration: BoxDecoration(
        color: _C.blueLight,
        borderRadius: BorderRadius.circular(SizeConfig.radiusLG),
        border: Border.all(color: _C.blue.withValues(alpha: 0.2)),
      ),
      child: Row(
        children: [
          Container(
            width: SizeConfig.r(40),
            height: SizeConfig.r(40),
            decoration: BoxDecoration(
              color: _C.blue.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(SizeConfig.r(10)),
            ),
            child: Icon(
              Icons.work_outline,
              color: _C.blue,
              size: SizeConfig.r(22),
            ),
          ),
          SizedBox(width: SizeConfig.r(12)),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  model.jobName,
                  style: TextStyle(
                    fontSize: SizeConfig.sp(14),
                    fontWeight: FontWeight.w700,
                    color: AppColors.textDark,
                  ),
                ),
                SizedBox(height: SizeConfig.r(4)),
                Row(
                  children: [
                    Icon(
                      Icons.calendar_today_outlined,
                      size: SizeConfig.r(12),
                      color: AppColors.textLight,
                    ),
                    SizedBox(width: SizeConfig.r(4)),
                    Text(
                      '${model.semesterStart} – ${model.semesterEnd}',
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
// Day Selector
// ─────────────────────────────────────────────────────────────────────────────

class _DaySelector extends StatelessWidget {
  final List<String> activeDays;
  final String selectedDay;
  final Map<String, String> dayLabels;
  final ValueChanged<String> onDaySelected;

  const _DaySelector({
    required this.activeDays,
    required this.selectedDay,
    required this.dayLabels,
    required this.onDaySelected,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Schedule Days',
          style: TextStyle(
            fontSize: SizeConfig.sp(15),
            fontWeight: FontWeight.w700,
            color: AppColors.textDark,
          ),
        ),
        SizedBox(height: SizeConfig.r(10)),
        Row(
          children: activeDays.asMap().entries.map((entry) {
            final i = entry.key;
            final day = entry.value;
            final isSelected = day == selectedDay;
            return Expanded(
              child: Padding(
                padding: EdgeInsets.only(
                  right: i < activeDays.length - 1 ? SizeConfig.r(8) : 0,
                ),
                child: GestureDetector(
                  onTap: () => onDaySelected(day),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 180),
                    padding: EdgeInsets.symmetric(vertical: SizeConfig.r(12)),
                    decoration: BoxDecoration(
                      color: isSelected ? _C.blue : _C.chipBg,
                      borderRadius: BorderRadius.circular(SizeConfig.radius),
                      boxShadow: isSelected
                          ? [
                              BoxShadow(
                                color: _C.blue.withValues(alpha: 0.25),
                                blurRadius: SizeConfig.r(6),
                                offset: Offset(0, SizeConfig.r(2)),
                              ),
                            ]
                          : [],
                    ),
                    alignment: Alignment.center,
                    child: Text(
                      dayLabels[day] ?? day,
                      style: TextStyle(
                        fontSize: SizeConfig.sp(13),
                        fontWeight: FontWeight.w700,
                        color: isSelected ? Colors.white : AppColors.textMedium,
                      ),
                    ),
                  ),
                ),
              ),
            );
          }).toList(),
        ),
      ],
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Run Section
// ─────────────────────────────────────────────────────────────────────────────

class _RunSection extends StatelessWidget {
  final PaDayRun run;
  const _RunSection({required this.run});

  @override
  Widget build(BuildContext context) {
    final color = run.isOutbound ? _C.blue : _C.purple;
    final bgColor = run.isOutbound ? _C.blueLight : _C.purpleLight;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // ── Run header ────────────────────────────────────────────────────
        Row(
          children: [
            Container(
              padding: EdgeInsets.symmetric(
                horizontal: SizeConfig.r(10),
                vertical: SizeConfig.r(5),
              ),
              decoration: BoxDecoration(
                color: color,
                borderRadius: BorderRadius.circular(SizeConfig.r(20)),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    run.isOutbound
                        ? Icons.wb_sunny_outlined
                        : Icons.nights_stay_outlined,
                    size: SizeConfig.r(12),
                    color: Colors.white,
                  ),
                  SizedBox(width: SizeConfig.r(4)),
                  Text(
                    run.label,
                    style: TextStyle(
                      fontSize: SizeConfig.sp(11),
                      fontWeight: FontWeight.w700,
                      color: Colors.white,
                    ),
                  ),
                ],
              ),
            ),
            SizedBox(width: SizeConfig.r(8)),
            Text(
              run.startTime,
              style: TextStyle(
                fontSize: SizeConfig.sp(12),
                color: AppColors.textMedium,
                fontWeight: FontWeight.w500,
              ),
            ),
            const Spacer(),
            _RunBadge(
              icon: Icons.people_outline,
              label: '${run.totalPassengers}',
              color: color,
            ),
            if (run.wheelchairCount > 0) ...[
              SizedBox(width: SizeConfig.r(6)),
              _RunBadge(
                icon: Icons.accessible,
                label: '${run.wheelchairCount}',
                color: color,
              ),
            ],
          ],
        ),
        SizedBox(height: SizeConfig.r(8)),
        // PA companion line (driverName field holds PA label for this screen)
        if (run.driverName.trim().isNotEmpty)
          Row(
            children: [
              Icon(
                Icons.person_outline,
                size: SizeConfig.r(13),
                color: AppColors.textLight,
              ),
              SizedBox(width: SizeConfig.r(4)),
              Text(
                run.driverName,
                style: TextStyle(
                  fontSize: SizeConfig.sp(12),
                  color: AppColors.textMedium,
                ),
              ),
            ],
          ),
        if (run.driverName.trim().isNotEmpty) SizedBox(height: SizeConfig.r(10)),
        if (run.driverName.trim().isEmpty) SizedBox(height: SizeConfig.r(2)),
        // ── Stop cards ────────────────────────────────────────────────────
        ...run.stops.map(
          (stop) => Padding(
            padding: EdgeInsets.only(bottom: SizeConfig.r(10)),
            child: _StopCard(
              stop: stop,
              accentColor: color,
              bgColor: bgColor,
              // Evening run: pickup = school, dropoff = home
              isInbound: !run.isOutbound,
            ),
          ),
        ),
      ],
    );
  }
}

class _RunBadge extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  const _RunBadge({
    required this.icon,
    required this.label,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: SizeConfig.r(8),
        vertical: SizeConfig.r(4),
      ),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(SizeConfig.r(12)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: SizeConfig.r(12), color: color),
          SizedBox(width: SizeConfig.r(3)),
          Text(
            label,
            style: TextStyle(
              fontSize: SizeConfig.sp(11),
              fontWeight: FontWeight.w700,
              color: color,
            ),
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Stop Card
// ─────────────────────────────────────────────────────────────────────────────

class _StopCard extends StatelessWidget {
  final PaScheduleStop stop;
  final Color accentColor;
  final Color bgColor;

  /// When true, pickup label = "School" and dropoff label = "Home".
  final bool isInbound;

  const _StopCard({
    required this.stop,
    required this.accentColor,
    required this.bgColor,
    required this.isInbound,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.all(SizeConfig.r(14)),
      decoration: BoxDecoration(
        color: AppColors.background,
        borderRadius: BorderRadius.circular(SizeConfig.radiusLG),
        border: Border.all(color: AppColors.inputBorder),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: SizeConfig.r(6),
            offset: Offset(0, SizeConfig.r(2)),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // ── Time + name + badges ──────────────────────────────────────
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              SizedBox(
                width: SizeConfig.r(52),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      stop.pickupTime.split(' ').first,
                      style: TextStyle(
                        fontSize: SizeConfig.sp(16),
                        fontWeight: FontWeight.w800,
                        color: AppColors.textDark,
                      ),
                    ),
                    Text(
                      stop.pickupTime.split(' ').length > 1
                          ? stop.pickupTime.split(' ').last
                          : '',
                      style: TextStyle(
                        fontSize: SizeConfig.sp(10),
                        color: AppColors.textLight,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ),
              SizedBox(width: SizeConfig.r(8)),
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
                    if (stop.wheelchairRequired || stop.harnessRequired)
                      Padding(
                        padding: EdgeInsets.only(top: SizeConfig.r(4)),
                        child: Wrap(
                          spacing: SizeConfig.r(6),
                          children: [
                            if (stop.wheelchairRequired)
                              _NeedsBadge(
                                icon: Icons.accessible,
                                label: 'Wheelchair',
                                color: accentColor,
                              ),
                            if (stop.harnessRequired)
                              _NeedsBadge(
                                icon: Icons.safety_check_outlined,
                                label: 'Harness',
                                color: const Color(0xFF8B5CF6),
                              ),
                          ],
                        ),
                      ),
                  ],
                ),
              ),
            ],
          ),
          SizedBox(height: SizeConfig.r(12)),
          // ── Address connector ─────────────────────────────────────────
          // Outbound: pickup = Home  →  dropoff = School
          // Inbound:  pickup = School → dropoff = Home
          _AddressConnector(
            pickupAddress: stop.pickupAddress,
            dropoffAddress: stop.dropoffAddress,
            accentColor: accentColor,
            pickupLabel: isInbound ? 'School' : 'Home',
            dropoffLabel: isInbound ? 'Home' : 'School',
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Address Connector
// ─────────────────────────────────────────────────────────────────────────────

class _AddressConnector extends StatelessWidget {
  final String pickupAddress;
  final String dropoffAddress;
  final Color accentColor;
  final String pickupLabel;
  final String dropoffLabel;

  const _AddressConnector({
    required this.pickupAddress,
    required this.dropoffAddress,
    required this.accentColor,
    required this.pickupLabel,
    required this.dropoffLabel,
  });

  @override
  Widget build(BuildContext context) {
    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          SizedBox(
            width: SizeConfig.r(16),
            child: Column(
              children: [
                Container(
                  width: SizeConfig.r(10),
                  height: SizeConfig.r(10),
                  decoration: BoxDecoration(
                    color: accentColor,
                    shape: BoxShape.circle,
                  ),
                ),
                Expanded(
                  child: Center(
                    child: Container(
                      width: SizeConfig.r(1.5),
                      color: _C.dotLine,
                    ),
                  ),
                ),
                Container(
                  width: SizeConfig.r(10),
                  height: SizeConfig.r(10),
                  decoration: BoxDecoration(
                    color: Colors.transparent,
                    shape: BoxShape.circle,
                    border: Border.all(color: _C.dotLine, width: 2),
                  ),
                ),
              ],
            ),
          ),
          SizedBox(width: SizeConfig.r(10)),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _AddressLabel(label: pickupLabel, address: pickupAddress),
                SizedBox(height: SizeConfig.r(14)),
                _AddressLabel(label: dropoffLabel, address: dropoffAddress),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _AddressLabel extends StatelessWidget {
  final String label;
  final String address;
  const _AddressLabel({required this.label, required this.address});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: SizeConfig.sp(11),
            fontWeight: FontWeight.w600,
            color: AppColors.textMedium,
          ),
        ),
        SizedBox(height: SizeConfig.r(1)),
        Text(
          address,
          style: TextStyle(
            fontSize: SizeConfig.sp(12),
            color: AppColors.textLight,
          ),
          maxLines: 2,
          overflow: TextOverflow.ellipsis,
        ),
      ],
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
        horizontal: SizeConfig.r(7),
        vertical: SizeConfig.r(3),
      ),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(SizeConfig.r(20)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: SizeConfig.r(11), color: color),
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
// Empty day placeholder
// ─────────────────────────────────────────────────────────────────────────────

class _EmptyDayCard extends StatelessWidget {
  final String day;
  const _EmptyDayCard({required this.day});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: EdgeInsets.all(SizeConfig.r(24)),
      decoration: BoxDecoration(
        color: AppColors.background,
        borderRadius: BorderRadius.circular(SizeConfig.radiusLG),
        border: Border.all(color: AppColors.inputBorder),
      ),
      child: Column(
        children: [
          Icon(
            Icons.event_busy_outlined,
            size: SizeConfig.r(36),
            color: AppColors.textLight,
          ),
          SizedBox(height: SizeConfig.r(10)),
          Text(
            'No runs scheduled for $day',
            style: TextStyle(
              fontSize: SizeConfig.sp(13),
              color: AppColors.textMedium,
            ),
          ),
        ],
      ),
    );
  }
}
