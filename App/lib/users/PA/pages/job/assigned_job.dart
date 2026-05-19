import 'package:flutter/material.dart';
import '../../../../routes/app_routes.dart';
import '../../../../utils/app_colors.dart';
import '../../../../utils/size_confg.dart';

class _PaAssignedJobsColors {
  static const Color primaryBlue = Color(0xFF2563EB);
  static const Color activeGreen = Color(0xFF22C55E);
  static const Color scheduledOrange = Color(0xFFF97316);
  static const Color dateCardBg = Color(0xFFF3F4F6);
}

enum _AssignedJobStatus { active, scheduled }

class _AssignedJobData {
  final _AssignedJobStatus status;
  final String headerTime;
  final String jobId;
  final String vehicleId;
  final String driverId;
  final String startTime;
  final String dropOffLocation;

  const _AssignedJobData({
    required this.status,
    required this.headerTime,
    required this.jobId,
    required this.vehicleId,
    required this.driverId,
    required this.startTime,
    required this.dropOffLocation,
  });
}

class _DateChipData {
  final String dayNumber;
  final String dayLabel;
  final bool isSelected;

  const _DateChipData({
    required this.dayNumber,
    required this.dayLabel,
    this.isSelected = false,
  });
}

class PaAssignedJobsPage extends StatefulWidget {
  const PaAssignedJobsPage({super.key});

  @override
  State<PaAssignedJobsPage> createState() => _PaAssignedJobsPageState();
}

class _PaAssignedJobsPageState extends State<PaAssignedJobsPage> {
  int _selectedDateIndex = 0;

  static const _dateChips = [
    _DateChipData(dayNumber: '22', dayLabel: 'Today', isSelected: true),
    _DateChipData(dayNumber: '23', dayLabel: 'Thu'),
    _DateChipData(dayNumber: '24', dayLabel: 'Fri'),
    _DateChipData(dayNumber: '25', dayLabel: 'Sat'),
    _DateChipData(dayNumber: '26', dayLabel: 'Sun'),
  ];

  static const _jobs = [
    _AssignedJobData(
      status: _AssignedJobStatus.active,
      headerTime: '08:30 AM',
      jobId: 'JB-2024-001',
      vehicleId: 'VH-456-XY',
      driverId: 'DR-789-AB',
      startTime: '08:30 AM',
      dropOffLocation: 'SW1A 1AA',
    ),
    _AssignedJobData(
      status: _AssignedJobStatus.scheduled,
      headerTime: '02:15 PM',
      jobId: 'JB-2024-002',
      vehicleId: 'VH-123-CD',
      driverId: 'DR-456-EF',
      startTime: '02:15 PM',
      dropOffLocation: 'M1 4HN',
    ),
  ];

  @override
  Widget build(BuildContext context) {
    SizeConfig.init(context);
    return Scaffold(
      backgroundColor: AppColors.surfaceGray,
      body: SafeArea(
        bottom: false,
        child: Column(
          children: [
            _AssignedJobsAppBar(
              onNotificationsTap: () =>
                  Navigator.pushNamed(context, AppRoutes.paNotifications),
              onProfileTap: () =>
                  Navigator.pushNamed(context, AppRoutes.paProfile),
            ),
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
                    _DateSelectorSection(
                      selectedIndex: _selectedDateIndex,
                      onDateSelected: (i) =>
                          setState(() => _selectedDateIndex = i),
                    ),
                    SizedBox(height: SizeConfig.r(16)),
                    ..._jobs.map(
                      (job) => Padding(
                        padding: EdgeInsets.only(bottom: SizeConfig.r(12)),
                        child: _AssignedJobCard(job: job),
                      ),
                    ),
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

class _AssignedJobsAppBar extends StatelessWidget {
  final VoidCallback onNotificationsTap;
  final VoidCallback onProfileTap;

  const _AssignedJobsAppBar({
    required this.onNotificationsTap,
    required this.onProfileTap,
  });

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
            onPressed: () {},
            icon: Icon(
              Icons.menu,
              color: AppColors.textDark,
              size: SizeConfig.r(24),
            ),
          ),
          Expanded(
            child: Text(
              'Assigned Jobs',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: SizeConfig.sp(17),
                fontWeight: FontWeight.w700,
                color: AppColors.textDark,
              ),
            ),
          ),
          IconButton(
            onPressed: onNotificationsTap,
            icon: Icon(
              Icons.notifications_outlined,
              color: AppColors.textDark,
              size: SizeConfig.r(24),
            ),
          ),
          GestureDetector(
            onTap: onProfileTap,
            child: ClipOval(
              child: Image.network(
                'https://i.pravatar.cc/300?img=5',
                width: SizeConfig.r(36),
                height: SizeConfig.r(36),
                fit: BoxFit.cover,
                errorBuilder: (_, __, ___) => CircleAvatar(
                  radius: SizeConfig.r(18),
                  backgroundColor: AppColors.primaryLight,
                  child: Icon(
                    Icons.person,
                    color: AppColors.primary,
                    size: SizeConfig.r(20),
                  ),
                ),
              ),
            ),
          ),
          SizedBox(width: SizeConfig.r(4)),
        ],
      ),
    );
  }
}

class _DateSelectorSection extends StatelessWidget {
  final int selectedIndex;
  final ValueChanged<int> onDateSelected;

  const _DateSelectorSection({
    required this.selectedIndex,
    required this.onDateSelected,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Row(
          children: [
            IconButton(
              onPressed: () {},
              icon: Icon(
                Icons.chevron_left,
                color: AppColors.textDark,
                size: SizeConfig.r(24),
              ),
            ),
            Expanded(
              child: Text(
                'Today, Jan 22',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: SizeConfig.sp(15),
                  fontWeight: FontWeight.w700,
                  color: AppColors.textDark,
                ),
              ),
            ),
            IconButton(
              onPressed: () {},
              icon: Icon(
                Icons.chevron_right,
                color: AppColors.textDark,
                size: SizeConfig.r(24),
              ),
            ),
          ],
        ),
        SizedBox(height: SizeConfig.r(8)),
        Row(
          children: List.generate(_PaAssignedJobsPageState._dateChips.length, (i) {
            final chip = _PaAssignedJobsPageState._dateChips[i];
            final isSelected = i == selectedIndex;
            return Expanded(
              child: Padding(
                padding: EdgeInsets.only(right: i < 4 ? SizeConfig.r(8) : 0),
                child: GestureDetector(
                  onTap: () => onDateSelected(i),
                  child: Column(
                    children: [
                      Container(
                        width: double.infinity,
                        padding: EdgeInsets.symmetric(
                          vertical: SizeConfig.r(10),
                        ),
                        decoration: BoxDecoration(
                          color: isSelected
                              ? _PaAssignedJobsColors.primaryBlue
                              : _PaAssignedJobsColors.dateCardBg,
                          borderRadius:
                              BorderRadius.circular(SizeConfig.radius),
                        ),
                        alignment: Alignment.center,
                        child: Text(
                          chip.dayNumber,
                          style: TextStyle(
                            fontSize: SizeConfig.sp(15),
                            fontWeight: FontWeight.w700,
                            color: isSelected
                                ? Colors.white
                                : AppColors.textDark,
                          ),
                        ),
                      ),
                      SizedBox(height: SizeConfig.r(4)),
                      Text(
                        chip.dayLabel,
                        style: TextStyle(
                          fontSize: SizeConfig.sp(11),
                          fontWeight: FontWeight.w500,
                          color: AppColors.textLight,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            );
          }),
        ),
      ],
    );
  }
}

class _AssignedJobCard extends StatelessWidget {
  final _AssignedJobData job;
  const _AssignedJobCard({required this.job});

  @override
  Widget build(BuildContext context) {
    final bool isActive = job.status == _AssignedJobStatus.active;
    final Color statusColor = isActive
        ? _PaAssignedJobsColors.activeGreen
        : _PaAssignedJobsColors.scheduledOrange;
    final String statusLabel = isActive ? 'Active' : 'Scheduled';

    return Container(
      width: double.infinity,
      padding: EdgeInsets.all(SizeConfig.r(16)),
      decoration: BoxDecoration(
        color: AppColors.background,
        borderRadius: BorderRadius.circular(SizeConfig.radiusLG),
        border: Border.all(color: AppColors.inputBorder),
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
                    width: SizeConfig.r(8),
                    height: SizeConfig.r(8),
                    decoration: BoxDecoration(
                      color: statusColor,
                      shape: BoxShape.circle,
                    ),
                  ),
                  SizedBox(width: SizeConfig.r(6)),
                  Text(
                    statusLabel,
                    style: TextStyle(
                      fontSize: SizeConfig.sp(13),
                      fontWeight: FontWeight.w600,
                      color: statusColor,
                    ),
                  ),
                ],
              ),
              Text(
                job.headerTime,
                style: TextStyle(
                  fontSize: SizeConfig.sp(12),
                  color: AppColors.textLight,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
          SizedBox(height: SizeConfig.r(14)),
          _JobDetailRow(label: 'Job ID', value: job.jobId),
          SizedBox(height: SizeConfig.r(10)),
          _JobDetailRow(label: 'Vehicle ID', value: job.vehicleId),
          SizedBox(height: SizeConfig.r(10)),
          _JobDetailRow(label: 'Driver ID', value: job.driverId),
          SizedBox(height: SizeConfig.r(10)),
          _JobDetailRow(label: 'Start Time', value: job.startTime),
          SizedBox(height: SizeConfig.r(10)),
          _JobDetailRow(
            label: 'Drop-off Location',
            value: job.dropOffLocation,
          ),
          SizedBox(height: SizeConfig.r(16)),
          SizedBox(
            width: double.infinity,
            height: SizeConfig.r(44),
            child: ElevatedButton(
              onPressed: () {},
              style: ElevatedButton.styleFrom(
                backgroundColor: isActive
                    ? _PaAssignedJobsColors.primaryBlue
                    : _PaAssignedJobsColors.dateCardBg,
                foregroundColor:
                    isActive ? Colors.white : AppColors.textMedium,
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(SizeConfig.radius),
                ),
              ),
              child: Text(
                'View Details',
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
}

class _JobDetailRow extends StatelessWidget {
  final String label;
  final String value;
  const _JobDetailRow({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: SizeConfig.sp(13),
            color: AppColors.textLight,
            fontWeight: FontWeight.w400,
          ),
        ),
        Text(
          value,
          style: TextStyle(
            fontSize: SizeConfig.sp(13),
            color: AppColors.textDark,
            fontWeight: FontWeight.w700,
          ),
        ),
      ],
    );
  }
}
