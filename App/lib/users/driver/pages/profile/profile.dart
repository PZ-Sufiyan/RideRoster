import 'package:flutter/material.dart';
import '../../../../components/app_button.dart';
import '../../../../routes/app_routes.dart';
import '../../../../utils/app_colors.dart';
import '../../../../utils/size_confg.dart';

class DriverProfilePage extends StatelessWidget {
  const DriverProfilePage({super.key});

  @override
  Widget build(BuildContext context) {
    SizeConfig.init(context);
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Column(
          children: [
            _buildAppBar(context),
            Expanded(
              child: SingleChildScrollView(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildProfileHeader(),
                    _buildDivider(),
                    _buildPersonalInfo(),
                    _buildDivider(),
                    _buildProfessionalDetails(),
                    _buildDivider(),
                    _buildRequiredDocuments(),
                    _buildDivider(),
                    _buildCurrentRoute(context),
                    _buildDivider(),
                    _buildQuickActions(context),
                    _buildDivider(),
                    _buildSettingsList(context),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAppBar(BuildContext context) {
    return Padding(
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
              'Driver Profile',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: SizeConfig.sp(17),
                fontWeight: FontWeight.w700,
                color: AppColors.textDark,
              ),
            ),
          ),
          SizedBox(width: SizeConfig.r(48)),
        ],
      ),
    );
  }

  Widget _buildProfileHeader() {
    return Padding(
      padding: EdgeInsets.symmetric(vertical: SizeConfig.r(20)),
      child: Center(
        child: Column(
          children: [
            Stack(
              children: [
                CircleAvatar(
                  radius: SizeConfig.r(44),
                  backgroundColor: AppColors.primaryLight,
                  child: Icon(
                    Icons.person,
                    size: SizeConfig.r(48),
                    color: AppColors.primary,
                  ),
                ),
                Positioned(
                  bottom: 0,
                  right: 0,
                  child: Container(
                    width: SizeConfig.r(26),
                    height: SizeConfig.r(26),
                    decoration: BoxDecoration(
                      color: const Color(0xFF0284C7),
                      shape: BoxShape.circle,
                      border: Border.all(color: Colors.white, width: 2),
                    ),
                    child: Icon(
                      Icons.edit,
                      size: SizeConfig.r(13),
                      color: Colors.white,
                    ),
                  ),
                ),
              ],
            ),
            SizedBox(height: SizeConfig.r(12)),
            Text(
              'Marcus Johnson',
              style: TextStyle(
                fontSize: SizeConfig.sp(18),
                fontWeight: FontWeight.w700,
                color: AppColors.textDark,
              ),
            ),
            SizedBox(height: SizeConfig.r(8)),
            Container(
              padding: EdgeInsets.symmetric(
                horizontal: SizeConfig.r(14),
                vertical: SizeConfig.r(4),
              ),
              decoration: BoxDecoration(
                color: AppColors.success,
                borderRadius: BorderRadius.circular(SizeConfig.r(20)),
              ),
              child: Text(
                '● Active',
                style: TextStyle(
                  fontSize: SizeConfig.sp(12),
                  fontWeight: FontWeight.w600,
                  color: Colors.white,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPersonalInfo() {
    final rows = [
      _InfoRow('Full Name', 'Marcus Johnson'),
      _InfoRow('Phone Number', '+92 300 1234567'),
      _InfoRow('Email', 'm_johnson@email.com'),
      _InfoRow('Passport Number', '42101-1234567-8'),
      _InfoRow('Date of Birth', '15 Aug 1985'),
      _InfoRow('Emergency Contact', '+92 301 9876543'),
    ];
    return _Section(
      title: 'Personal Information',
      trailingIcon: Icon(
        Icons.edit,
        size: SizeConfig.r(16),
        color: const Color(0xFF0284C7),
      ),
      child: _InfoTable(rows: rows),
    );
  }

  Widget _buildProfessionalDetails() {
    return _Section(
      title: 'Professional Details',
      child: Column(
        children: [
          _InfoRowWidget(
            label: 'License Number',
            valueWidget: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  'DL-123456789',
                  style: TextStyle(
                    fontSize: SizeConfig.sp(13),
                    color: AppColors.textDark,
                  ),
                ),
                SizedBox(width: SizeConfig.r(6)),
                _StatusBadge(label: 'Verified', color: AppColors.success),
              ],
            ),
          ),
          _dividerLine(),
          _InfoRowWidget(
            label: 'License Expiry',
            valueWidget: Text(
              '15 Dec 2025',
              style: TextStyle(
                fontSize: SizeConfig.sp(13),
                color: AppColors.textDark,
              ),
            ),
          ),
          _dividerLine(),
          _InfoRowWidget(
            label: 'Vehicle Assigned',
            valueWidget: Text(
              'Toyota Hiace',
              style: TextStyle(
                fontSize: SizeConfig.sp(13),
                color: AppColors.textDark,
              ),
            ),
          ),
          _dividerLine(),
          _InfoRowWidget(
            label: 'Plate Number',
            valueWidget: Text(
              'ABC-123',
              style: TextStyle(
                fontSize: SizeConfig.sp(13),
                color: AppColors.textDark,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRequiredDocuments() {
    final docs = [
      _DocData(icon: Icons.credit_card, label: 'CNIC / ID', status: 'Verified'),
      _DocData(icon: Icons.description_outlined, label: 'Driver License', status: 'Verified'),
      _DocData(icon: Icons.directions_car_outlined, label: 'Vehicle Ownership', status: 'Pending'),
      _DocData(icon: Icons.person_outline, label: 'Profile Photo', status: 'Verified'),
    ];
    return _Section(
      title: 'Required Documents',
      child: Column(
        children: docs.map((d) => _DocRow(data: d)).toList(),
      ),
    );
  }

  Widget _buildCurrentRoute(BuildContext context) {
    return _Section(
      title: 'Current Route',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(
                Icons.location_on,
                color: const Color(0xFF0284C7),
                size: SizeConfig.r(20),
              ),
              SizedBox(width: SizeConfig.r(10)),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Green Valley School',
                    style: TextStyle(
                      fontSize: SizeConfig.sp(14),
                      fontWeight: FontWeight.w700,
                      color: AppColors.textDark,
                    ),
                  ),
                  Text(
                    'Zone A - North Campus',
                    style: TextStyle(
                      fontSize: SizeConfig.sp(12),
                      color: AppColors.textLight,
                    ),
                  ),
                ],
              ),
            ],
          ),
          SizedBox(height: SizeConfig.r(10)),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(
                Icons.access_time,
                color: const Color(0xFF0284C7),
                size: SizeConfig.r(20),
              ),
              SizedBox(width: SizeConfig.r(10)),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '7:00 AM - 8:30 AM',
                    style: TextStyle(
                      fontSize: SizeConfig.sp(14),
                      fontWeight: FontWeight.w700,
                      color: AppColors.textDark,
                    ),
                  ),
                  Text(
                    'Next pickup in 45 minutes',
                    style: TextStyle(
                      fontSize: SizeConfig.sp(12),
                      color: AppColors.textLight,
                    ),
                  ),
                ],
              ),
            ],
          ),
          SizedBox(height: SizeConfig.r(14)),
          AppButton(
            label: 'View Full Job Details',
            height: SizeConfig.r(46),
            borderRadius: SizeConfig.radius,
            onPressed: () {},
          ),
        ],
      ),
    );
  }

  Widget _buildQuickActions(BuildContext context) {
    final actions = [
      _QuickAction(icon: Icons.person_outline, label: 'Profile', color: const Color(0xFF0284C7)),
      _QuickAction(icon: Icons.description_outlined, label: 'Doc', color: AppColors.success),
      _QuickAction(icon: Icons.check_circle_outline, label: 'Available', color: AppColors.warning),
      _QuickAction(icon: Icons.checklist, label: 'Checklist', color: const Color(0xFF7C3AED)),
      _QuickAction(icon: Icons.warning_amber_rounded, label: 'SOS', color: AppColors.error),
    ];
    return _Section(
      title: 'Quick Actions',
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: actions
            .map(
              (a) => GestureDetector(
                onTap: () {
                  if (a.label == 'Checklist') {
                    Navigator.pushNamed(context, AppRoutes.vehicleChecklist);
                  } else if (a.label == 'SOS') {
                    Navigator.pushNamed(context, AppRoutes.sos);
                  }
                },
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: SizeConfig.r(44),
                      height: SizeConfig.r(44),
                      decoration: BoxDecoration(
                        color: a.color.withValues(alpha: 0.12),
                        shape: BoxShape.circle,
                      ),
                      child: Icon(a.icon, color: a.color, size: SizeConfig.r(22)),
                    ),
                    SizedBox(height: SizeConfig.r(6)),
                    Text(
                      a.label,
                      style: TextStyle(
                        fontSize: SizeConfig.sp(11),
                        fontWeight: FontWeight.w500,
                        color: AppColors.textMedium,
                      ),
                    ),
                  ],
                ),
              ),
            )
            .toList(),
      ),
    );
  }

  Widget _buildSettingsList(BuildContext context) {
    return Padding(
      padding: EdgeInsets.symmetric(
        horizontal: SizeConfig.hPad,
        vertical: SizeConfig.r(4),
      ),
      child: Column(
        children: [
          _SettingsRow(
            icon: Icons.notifications_outlined,
            label: 'Notification Settings',
            iconColor: AppColors.textMedium,
            onTap: () {},
          ),
          _dividerLine(),
          _SettingsRow(
            icon: Icons.language,
            label: 'Language',
            iconColor: AppColors.textMedium,
            onTap: () {},
          ),
          _dividerLine(),
          _SettingsRow(
            icon: Icons.headset_mic_outlined,
            label: 'Support',
            iconColor: AppColors.textMedium,
            onTap: () {},
          ),
          _dividerLine(),
          _SettingsRow(
            icon: Icons.logout,
            label: 'Logout',
            iconColor: AppColors.error,
            labelColor: AppColors.error,
            onTap: () {},
          ),
          SizedBox(height: SizeConfig.r(24)),
        ],
      ),
    );
  }

  Widget _buildDivider() {
    return Divider(height: 1, thickness: 1, color: AppColors.surfaceGray);
  }

  Widget _dividerLine() {
    return Divider(height: 1, thickness: 1, color: AppColors.inputBorder);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Section wrapper
// ─────────────────────────────────────────────────────────────────────────────

class _Section extends StatelessWidget {
  final String title;
  final Widget child;
  final Widget? trailingIcon;

  const _Section({
    required this.title,
    required this.child,
    this.trailingIcon,
  });

  @override
  Widget build(BuildContext context) {
    SizeConfig.init(context);
    return Padding(
      padding: EdgeInsets.symmetric(
        horizontal: SizeConfig.hPad,
        vertical: SizeConfig.r(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                title,
                style: TextStyle(
                  fontSize: SizeConfig.sp(15),
                  fontWeight: FontWeight.w700,
                  color: AppColors.textDark,
                ),
              ),
              if (trailingIcon != null) trailingIcon!,
            ],
          ),
          SizedBox(height: SizeConfig.r(12)),
          child,
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Info table (label + value rows)
// ─────────────────────────────────────────────────────────────────────────────

class _InfoRow {
  final String label;
  final String value;
  const _InfoRow(this.label, this.value);
}

class _InfoTable extends StatelessWidget {
  final List<_InfoRow> rows;
  const _InfoTable({required this.rows});

  @override
  Widget build(BuildContext context) {
    SizeConfig.init(context);
    return Column(
      children: rows.asMap().entries.map((e) {
        final i = e.key;
        final row = e.value;
        return Column(
          children: [
            Padding(
              padding: EdgeInsets.symmetric(vertical: SizeConfig.r(10)),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    row.label,
                    style: TextStyle(
                      fontSize: SizeConfig.sp(13),
                      color: AppColors.textLight,
                    ),
                  ),
                  Text(
                    row.value,
                    style: TextStyle(
                      fontSize: SizeConfig.sp(13),
                      color: AppColors.textDark,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ),
            if (i < rows.length - 1)
              Divider(height: 1, thickness: 1, color: AppColors.inputBorder),
          ],
        );
      }).toList(),
    );
  }
}

// Row with label on left and arbitrary widget on right
class _InfoRowWidget extends StatelessWidget {
  final String label;
  final Widget valueWidget;

  const _InfoRowWidget({required this.label, required this.valueWidget});

  @override
  Widget build(BuildContext context) {
    SizeConfig.init(context);
    return Padding(
      padding: EdgeInsets.symmetric(vertical: SizeConfig.r(10)),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: TextStyle(
              fontSize: SizeConfig.sp(13),
              color: AppColors.textLight,
            ),
          ),
          valueWidget,
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Required Documents
// ─────────────────────────────────────────────────────────────────────────────

class _DocData {
  final IconData icon;
  final String label;
  final String status;
  const _DocData({required this.icon, required this.label, required this.status});
}

class _DocRow extends StatelessWidget {
  final _DocData data;
  const _DocRow({required this.data});

  @override
  Widget build(BuildContext context) {
    SizeConfig.init(context);
    final isPending = data.status == 'Pending';
    return Padding(
      padding: EdgeInsets.symmetric(vertical: SizeConfig.r(8)),
      child: Row(
        children: [
          Container(
            width: SizeConfig.r(36),
            height: SizeConfig.r(36),
            decoration: BoxDecoration(
              color: AppColors.surfaceGray,
              borderRadius: BorderRadius.circular(SizeConfig.r(8)),
            ),
            child: Icon(
              data.icon,
              size: SizeConfig.r(18),
              color: AppColors.textMedium,
            ),
          ),
          SizedBox(width: SizeConfig.r(12)),
          Expanded(
            child: Text(
              data.label,
              style: TextStyle(
                fontSize: SizeConfig.sp(13),
                color: AppColors.textDark,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          _StatusBadge(
            label: data.status,
            color: isPending ? AppColors.warning : AppColors.success,
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Reusable widgets
// ─────────────────────────────────────────────────────────────────────────────

class _StatusBadge extends StatelessWidget {
  final String label;
  final Color color;

  const _StatusBadge({required this.label, required this.color});

  @override
  Widget build(BuildContext context) {
    SizeConfig.init(context);
    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: SizeConfig.r(8),
        vertical: SizeConfig.r(3),
      ),
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(SizeConfig.r(4)),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: SizeConfig.sp(11),
          fontWeight: FontWeight.w600,
          color: Colors.white,
        ),
      ),
    );
  }
}

class _QuickAction {
  final IconData icon;
  final String label;
  final Color color;
  const _QuickAction({required this.icon, required this.label, required this.color});
}

class _SettingsRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color iconColor;
  final Color? labelColor;
  final VoidCallback onTap;

  const _SettingsRow({
    required this.icon,
    required this.label,
    required this.iconColor,
    this.labelColor,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    SizeConfig.init(context);
    return GestureDetector(
      onTap: onTap,
      child: Padding(
        padding: EdgeInsets.symmetric(vertical: SizeConfig.r(14)),
        child: Row(
          children: [
            Icon(icon, color: iconColor, size: SizeConfig.r(20)),
            SizedBox(width: SizeConfig.r(14)),
            Expanded(
              child: Text(
                label,
                style: TextStyle(
                  fontSize: SizeConfig.sp(14),
                  fontWeight: FontWeight.w500,
                  color: labelColor ?? AppColors.textDark,
                ),
              ),
            ),
            Icon(
              Icons.chevron_right,
              color: AppColors.textLight,
              size: SizeConfig.r(20),
            ),
          ],
        ),
      ),
    );
  }
}
