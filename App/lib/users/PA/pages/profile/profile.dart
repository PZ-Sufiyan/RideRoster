import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../../providers/auth_provider.dart';
import '../../../../routes/app_routes.dart';
import '../../../../utils/app_colors.dart';
import '../../../../utils/size_confg.dart';
import '../../models/passenger_model.dart';

/// PA profile palette — matches the design screenshot (green header / accents).
class _PaProfileColors {
  static const Color header = Color(0xFF1B5E20);
  static const Color action = Color(0xFF2ECC71);
  static const Color onDutyDot = Color(0xFF7CFC00);
  static const Color docGreen = Color(0xFF2ECC71);
  static const Color docGreenBg = Color(0xFFE8F8EF);
  static const Color docYellow = Color(0xFFF1C40F);
  static const Color docYellowBg = Color(0xFFFFF9E6);
  static const Color docRed = Color(0xFFE74C3C);
  static const Color docRedBg = Color(0xFFFDECEA);
}

/// Static dummy data for the PA profile screen (screenshot values).
class PaProfileDummyData {
  static const String fullName = PaDashboardDummyData.paName;
  static const String phone = '+1 (555) 123-4567';
  static const String email = 'sarah.j@email.com';
  static const String passportNumber = '12345-6789012-3';
  static const String gender = 'Female';
  static const String emergencyContact = '+1 (555) 987-6543';
  static const bool onDuty = true;

  static const String assignedDriver = 'Mike Thompson';
  static const String routeName = 'Route A - Morning';
  static const String pickupStartTime = '7:30 AM';
  static const String numberOfStudents = '12 Students';
}

class PaProfilePage extends StatelessWidget {
  const PaProfilePage({super.key});

  @override
  Widget build(BuildContext context) {
    SizeConfig.init(context);
    return Scaffold(
      backgroundColor: AppColors.background,
      body: Column(
        children: [
          const _ProfileHeader(),
          Expanded(
            child: SingleChildScrollView(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const _PersonalInformationSection(),
                  SizedBox(height: SizeConfig.r(24)),
                  const _CertificatesSection(),
                  SizedBox(height: SizeConfig.r(24)),
                  const _AssignedJobSection(),
                  SizedBox(height: SizeConfig.r(24)),
                  _SettingsSection(
                    onLogout: () => _logout(context),
                  ),
                  SizedBox(height: SizeConfig.r(28)),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  static Future<void> _logout(BuildContext context) async {
    await context.read<AuthProvider>().logout();
    if (!context.mounted) return;
    Navigator.pushNamedAndRemoveUntil(
      context,
      AppRoutes.login,
      (route) => false,
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Header (green)
// ─────────────────────────────────────────────────────────────────────────────

class _ProfileHeader extends StatelessWidget {
  const _ProfileHeader();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      color: _PaProfileColors.header,
      child: SafeArea(
        bottom: false,
        child: Column(
          children: [
            Padding(
              padding: EdgeInsets.symmetric(
                horizontal: SizeConfig.r(4),
                vertical: SizeConfig.r(4),
              ),
              child: Row(
                children: [
                  IconButton(
                    onPressed: () => Navigator.maybePop(context),
                    icon: Icon(
                      Icons.arrow_back,
                      color: Colors.white,
                      size: SizeConfig.r(22),
                    ),
                  ),
                  Expanded(
                    child: Text(
                      'Profile',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: SizeConfig.sp(17),
                        fontWeight: FontWeight.w700,
                        color: Colors.white,
                      ),
                    ),
                  ),
                  IconButton(
                    onPressed: () {},
                    icon: Icon(
                      Icons.more_vert,
                      color: Colors.white,
                      size: SizeConfig.r(22),
                    ),
                  ),
                ],
              ),
            ),
            SizedBox(height: SizeConfig.r(8)),
            Stack(
              clipBehavior: Clip.none,
              children: [
                Container(
                  padding: EdgeInsets.all(SizeConfig.r(4)),
                  decoration: const BoxDecoration(
                    color: Colors.white,
                    shape: BoxShape.circle,
                  ),
                  child: ClipOval(
                    child: Image.network(
                      'https://i.pravatar.cc/300?img=5',
                      width: SizeConfig.r(96),
                      height: SizeConfig.r(96),
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) => Container(
                        width: SizeConfig.r(96),
                        height: SizeConfig.r(96),
                        color: const Color(0xFFE8E8E8),
                        child: Icon(
                          Icons.person,
                          size: SizeConfig.r(48),
                          color: AppColors.textLight,
                        ),
                      ),
                    ),
                  ),
                ),
                Positioned(
                  right: SizeConfig.r(2),
                  bottom: SizeConfig.r(2),
                  child: Container(
                    width: SizeConfig.r(28),
                    height: SizeConfig.r(28),
                    decoration: const BoxDecoration(
                      color: Colors.white,
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      Icons.edit_outlined,
                      color: _PaProfileColors.header,
                      size: SizeConfig.r(14),
                    ),
                  ),
                ),
              ],
            ),
            SizedBox(height: SizeConfig.r(14)),
            Container(
              padding: EdgeInsets.symmetric(
                horizontal: SizeConfig.r(14),
                vertical: SizeConfig.r(6),
              ),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.2),
                borderRadius: BorderRadius.circular(SizeConfig.r(20)),
              ),
              child: Text(
                'Passenger Assistant',
                style: TextStyle(
                  fontSize: SizeConfig.sp(12),
                  fontWeight: FontWeight.w600,
                  color: Colors.white,
                ),
              ),
            ),
            SizedBox(height: SizeConfig.r(8)),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  width: SizeConfig.r(8),
                  height: SizeConfig.r(8),
                  decoration: const BoxDecoration(
                    color: _PaProfileColors.onDutyDot,
                    shape: BoxShape.circle,
                  ),
                ),
                SizedBox(width: SizeConfig.r(6)),
                Text(
                  PaProfileDummyData.onDuty ? 'On Duty' : 'Off Duty',
                  style: TextStyle(
                    fontSize: SizeConfig.sp(13),
                    fontWeight: FontWeight.w500,
                    color: Colors.white,
                  ),
                ),
              ],
            ),
            SizedBox(height: SizeConfig.r(24)),
          ],
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Personal Information
// ─────────────────────────────────────────────────────────────────────────────

class _PersonalInformationSection extends StatelessWidget {
  const _PersonalInformationSection();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.fromLTRB(
        SizeConfig.hPad,
        SizeConfig.r(22),
        SizeConfig.hPad,
        0,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Personal Information',
                style: TextStyle(
                  fontSize: SizeConfig.sp(16),
                  fontWeight: FontWeight.w700,
                  color: AppColors.textDark,
                ),
              ),
              Icon(
                Icons.edit_outlined,
                color: _PaProfileColors.action,
                size: SizeConfig.r(20),
              ),
            ],
          ),
          SizedBox(height: SizeConfig.r(16)),
          const _InfoRow(label: 'Full Name', value: PaProfileDummyData.fullName),
          SizedBox(height: SizeConfig.r(12)),
          const _InfoRow(label: 'Phone Number', value: PaProfileDummyData.phone),
          SizedBox(height: SizeConfig.r(12)),
          const _InfoRow(label: 'Email', value: PaProfileDummyData.email),
          SizedBox(height: SizeConfig.r(12)),
          const _InfoRow(
            label: 'Passport number',
            value: PaProfileDummyData.passportNumber,
          ),
          SizedBox(height: SizeConfig.r(12)),
          const _InfoRow(label: 'Gender', value: PaProfileDummyData.gender),
          SizedBox(height: SizeConfig.r(12)),
          const _InfoRow(
            label: 'Emergency Contact',
            value: PaProfileDummyData.emergencyContact,
          ),
        ],
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  final String label;
  final String value;
  const _InfoRow({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          flex: 2,
          child: Text(
            label,
            style: TextStyle(
              fontSize: SizeConfig.sp(13),
              color: AppColors.textLight,
              fontWeight: FontWeight.w400,
            ),
          ),
        ),
        Expanded(
          flex: 3,
          child: Text(
            value,
            textAlign: TextAlign.right,
            style: TextStyle(
              fontSize: SizeConfig.sp(13),
              color: AppColors.textDark,
              fontWeight: FontWeight.w700,
            ),
          ),
        ),
      ],
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Certificates & Documents
// ─────────────────────────────────────────────────────────────────────────────

class _CertificatesSection extends StatelessWidget {
  const _CertificatesSection();

  static const _docs = [
    _DocumentCardData(
      title: 'Child Safety Training',
      status: 'Verified',
      statusType: _DocStatusType.verified,
      icon: Icons.workspace_premium_outlined,
    ),
    _DocumentCardData(
      title: 'Medical Fitness Certificate',
      status: 'Pending',
      statusType: _DocStatusType.pending,
      icon: Icons.monitor_heart_outlined,
    ),
    _DocumentCardData(
      title: 'CNIC / ID',
      status: 'Verified',
      statusType: _DocStatusType.verified,
      icon: Icons.badge_outlined,
    ),
    _DocumentCardData(
      title: 'Profile Photo',
      status: 'Reupload Required',
      statusType: _DocStatusType.reupload,
      icon: Icons.photo_camera_outlined,
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.symmetric(horizontal: SizeConfig.hPad),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Certificates & Documents',
            style: TextStyle(
              fontSize: SizeConfig.sp(16),
              fontWeight: FontWeight.w700,
              color: AppColors.textDark,
            ),
          ),
          SizedBox(height: SizeConfig.r(14)),
          ..._docs.map(
            (d) => Padding(
              padding: EdgeInsets.only(bottom: SizeConfig.r(10)),
              child: _DocumentCard(data: d),
            ),
          ),
        ],
      ),
    );
  }
}

enum _DocStatusType { verified, pending, reupload }

class _DocumentCardData {
  final String title;
  final String status;
  final _DocStatusType statusType;
  final IconData icon;
  const _DocumentCardData({
    required this.title,
    required this.status,
    required this.statusType,
    required this.icon,
  });
}

class _DocumentCard extends StatelessWidget {
  final _DocumentCardData data;
  const _DocumentCard({required this.data});

  @override
  Widget build(BuildContext context) {
    late final Color accent;
    late final Color bg;
    switch (data.statusType) {
      case _DocStatusType.verified:
        accent = _PaProfileColors.docGreen;
        bg = _PaProfileColors.docGreenBg;
        break;
      case _DocStatusType.pending:
        accent = _PaProfileColors.docYellow;
        bg = _PaProfileColors.docYellowBg;
        break;
      case _DocStatusType.reupload:
        accent = _PaProfileColors.docRed;
        bg = _PaProfileColors.docRedBg;
        break;
    }

    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: SizeConfig.r(14),
        vertical: SizeConfig.r(14),
      ),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(SizeConfig.radiusLG),
        border: Border.all(color: accent.withValues(alpha: 0.35)),
      ),
      child: Row(
        children: [
          Icon(data.icon, color: accent, size: SizeConfig.r(26)),
          SizedBox(width: SizeConfig.r(12)),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  data.title,
                  style: TextStyle(
                    fontSize: SizeConfig.sp(14),
                    fontWeight: FontWeight.w600,
                    color: AppColors.textDark,
                  ),
                ),
                SizedBox(height: SizeConfig.r(6)),
                Container(
                  padding: EdgeInsets.symmetric(
                    horizontal: SizeConfig.r(10),
                    vertical: SizeConfig.r(4),
                  ),
                  decoration: BoxDecoration(
                    color: accent,
                    borderRadius: BorderRadius.circular(SizeConfig.r(12)),
                  ),
                  child: Text(
                    data.status,
                    style: TextStyle(
                      fontSize: SizeConfig.sp(10),
                      fontWeight: FontWeight.w600,
                      color: Colors.white,
                    ),
                  ),
                ),
              ],
            ),
          ),
          Icon(
            Icons.chevron_right,
            color: AppColors.textLight,
            size: SizeConfig.r(22),
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Assigned Job Information
// ─────────────────────────────────────────────────────────────────────────────

class _AssignedJobSection extends StatelessWidget {
  const _AssignedJobSection();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.symmetric(horizontal: SizeConfig.hPad),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Assigned Job Information',
            style: TextStyle(
              fontSize: SizeConfig.sp(16),
              fontWeight: FontWeight.w700,
              color: AppColors.textDark,
            ),
          ),
          SizedBox(height: SizeConfig.r(16)),
          const _InfoRow(
            label: 'Assigned Driver',
            value: PaProfileDummyData.assignedDriver,
          ),
          SizedBox(height: SizeConfig.r(12)),
          const _InfoRow(
            label: 'Route Name',
            value: PaProfileDummyData.routeName,
          ),
          SizedBox(height: SizeConfig.r(12)),
          const _InfoRow(
            label: 'Pickup Start Time',
            value: PaProfileDummyData.pickupStartTime,
          ),
          SizedBox(height: SizeConfig.r(12)),
          const _InfoRow(
            label: 'Number of Students',
            value: PaProfileDummyData.numberOfStudents,
          ),
          SizedBox(height: SizeConfig.r(18)),
          SizedBox(
            width: double.infinity,
            height: SizeConfig.r(50),
            child: ElevatedButton(
              onPressed: () {},
              style: ElevatedButton.styleFrom(
                backgroundColor: _PaProfileColors.action,
                foregroundColor: Colors.white,
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(SizeConfig.radius),
                ),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.arrow_forward, size: SizeConfig.r(18)),
                  SizedBox(width: SizeConfig.r(8)),
                  Text(
                    'View Job Details',
                    style: TextStyle(
                      fontSize: SizeConfig.sp(15),
                      fontWeight: FontWeight.w700,
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
// Settings
// ─────────────────────────────────────────────────────────────────────────────

class _SettingsSection extends StatelessWidget {
  final VoidCallback onLogout;
  const _SettingsSection({required this.onLogout});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.symmetric(horizontal: SizeConfig.hPad),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Settings',
            style: TextStyle(
              fontSize: SizeConfig.sp(16),
              fontWeight: FontWeight.w700,
              color: AppColors.textDark,
            ),
          ),
          SizedBox(height: SizeConfig.r(8)),
          _SettingsTile(
            icon: Icons.notifications_outlined,
            label: 'Notification Settings',
            iconColor: AppColors.textMedium,
            labelColor: AppColors.textDark,
            onTap: () {},
          ),
          Divider(height: 1, thickness: 1, color: AppColors.inputBorder),
          _SettingsTile(
            icon: Icons.logout,
            label: 'Logout',
            iconColor: AppColors.error,
            labelColor: AppColors.error,
            onTap: onLogout,
          ),
        ],
      ),
    );
  }
}

class _SettingsTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color iconColor;
  final Color labelColor;
  final VoidCallback onTap;

  const _SettingsTile({
    required this.icon,
    required this.label,
    required this.iconColor,
    required this.labelColor,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: EdgeInsets.symmetric(vertical: SizeConfig.r(14)),
        child: Row(
          children: [
            Icon(icon, color: iconColor, size: SizeConfig.r(22)),
            SizedBox(width: SizeConfig.r(14)),
            Expanded(
              child: Text(
                label,
                style: TextStyle(
                  fontSize: SizeConfig.sp(14),
                  fontWeight: FontWeight.w500,
                  color: labelColor,
                ),
              ),
            ),
            Icon(
              Icons.chevron_right,
              color: AppColors.textLight,
              size: SizeConfig.r(22),
            ),
          ],
        ),
      ),
    );
  }
}
