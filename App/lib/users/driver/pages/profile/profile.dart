import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../../components/app_button.dart';
import '../../../../components/offline_banner.dart';
import '../../../../model/driver_profile_model.dart';
import '../../../../providers/auth_provider.dart';
import '../../../../providers/driver_profile_provider.dart';
import '../../../../routes/app_routes.dart';
import '../../../../utils/app_colors.dart';
import '../../../../utils/shimmer.dart';
import '../../../../utils/size_confg.dart';

/// Profile palette — matches PA profile layout (green header / accents).
class _ProfileColors {
  static const Color header = Color(0xFF1B5E20);
  static const Color action = Color(0xFF2ECC71);
  static const Color onDutyDot = Color(0xFF7CFC00);
  static const Color docGreen = Color(0xFF2ECC71);
  static const Color docGreenBg = Color(0xFFE8F8EF);
  static const Color docYellow = Color(0xFFF1C40F);
  static const Color docYellowBg = Color(0xFFFFF9E6);
}

class DriverProfilePage extends StatefulWidget {
  const DriverProfilePage({super.key});

  @override
  State<DriverProfilePage> createState() => _DriverProfilePageState();
}

class _DriverProfilePageState extends State<DriverProfilePage> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<DriverProfileProvider>().loadProfile();
    });
  }

  @override
  Widget build(BuildContext context) {
    SizeConfig.init(context);
    return Scaffold(
      backgroundColor: AppColors.background,
      body: Consumer<DriverProfileProvider>(
        builder: (context, provider, _) {
          if (provider.isLoading && !provider.hasProfile) {
            return const _ProfileLoadingBody();
          }

          if (provider.error != null && !provider.hasProfile) {
            return _ProfileErrorBody(
              onRetry: () => context.read<DriverProfileProvider>().loadProfile(
                forceRefresh: true,
              ),
            );
          }

          final profile = provider.profile;
          if (profile == null) {
            return _ProfileErrorBody(
              onRetry: () => context.read<DriverProfileProvider>().loadProfile(
                forceRefresh: true,
              ),
            );
          }

          return RefreshIndicator(
            onRefresh: () => context.read<DriverProfileProvider>().loadProfile(
              forceRefresh: true,
            ),
            child: Column(
              children: [
                const OfflineBanner(),
                _ProfileHeader(profile: profile),
                Expanded(
                  child: SingleChildScrollView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _PersonalInformationSection(profile: profile),
                        SizedBox(height: SizeConfig.r(24)),
                        _ProfessionalDetailsSection(profile: profile),
                        SizedBox(height: SizeConfig.r(24)),
                        _DocumentsSection(profile: profile),
                        SizedBox(height: SizeConfig.r(24)),
                        _QuickActionsSection(
                          onChecklist: () => Navigator.pushNamed(
                            context,
                            AppRoutes.vehicleChecklist,
                          ),
                          onSos: () => Navigator.pushNamed(
                            context,
                            AppRoutes.sos,
                          ),
                          onRefresh: () => context
                              .read<DriverProfileProvider>()
                              .loadProfile(forceRefresh: true),
                        ),
                        SizedBox(height: SizeConfig.r(24)),
                        _SettingsSection(onLogout: () => _logout(context)),
                        SizedBox(height: SizeConfig.r(28)),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          );
        },
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
// Loading / error
// ─────────────────────────────────────────────────────────────────────────────

class _ProfileLoadingBody extends StatelessWidget {
  const _ProfileLoadingBody();

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        _ProfileHeaderShimmer(onBack: () => Navigator.maybePop(context)),
        Expanded(
          child: Shimmer(
            child: SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _shimmerSection(titleWidth: 180, rowCount: 6),
                  SizedBox(height: SizeConfig.r(24)),
                  _shimmerSection(titleWidth: 160, rowCount: 4),
                  SizedBox(height: SizeConfig.r(24)),
                  _shimmerDocSection(cardCount: 4),
                  SizedBox(height: SizeConfig.r(24)),
                  _shimmerQuickActions(),
                  SizedBox(height: SizeConfig.r(24)),
                  _shimmerSettings(rowCount: 4),
                  SizedBox(height: SizeConfig.r(28)),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }

  static Widget _shimmerSection({
    required double titleWidth,
    required int rowCount,
  }) {
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
          ShimmerBox(
            width: SizeConfig.r(titleWidth),
            height: SizeConfig.r(16),
            borderRadius: BorderRadius.circular(SizeConfig.r(4)),
          ),
          SizedBox(height: SizeConfig.r(16)),
          ...List.generate(rowCount, (i) {
            return Padding(
              padding: EdgeInsets.only(bottom: i < rowCount - 1 ? SizeConfig.r(12) : 0),
              child: Row(
                children: [
                  Expanded(
                    flex: 2,
                    child: ShimmerBox(
                      height: SizeConfig.r(13),
                      borderRadius: BorderRadius.circular(SizeConfig.r(4)),
                    ),
                  ),
                  SizedBox(width: SizeConfig.r(16)),
                  Expanded(
                    flex: 3,
                    child: ShimmerBox(
                      height: SizeConfig.r(13),
                      borderRadius: BorderRadius.circular(SizeConfig.r(4)),
                    ),
                  ),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }

  static Widget _shimmerDocSection({required int cardCount}) {
    return Padding(
      padding: EdgeInsets.symmetric(horizontal: SizeConfig.hPad),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          ShimmerBox(
            width: SizeConfig.r(200),
            height: SizeConfig.r(16),
            borderRadius: BorderRadius.circular(SizeConfig.r(4)),
          ),
          SizedBox(height: SizeConfig.r(14)),
          ...List.generate(
            cardCount,
            (i) => Padding(
              padding: EdgeInsets.only(bottom: i < cardCount - 1 ? SizeConfig.r(10) : 0),
              child: ShimmerBox(
                width: double.infinity,
                height: SizeConfig.r(72),
                borderRadius: BorderRadius.circular(SizeConfig.radiusLG),
              ),
            ),
          ),
        ],
      ),
    );
  }

  static Widget _shimmerQuickActions() {
    return Padding(
      padding: EdgeInsets.symmetric(horizontal: SizeConfig.hPad),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          ShimmerBox(
            width: SizeConfig.r(120),
            height: SizeConfig.r(16),
            borderRadius: BorderRadius.circular(SizeConfig.r(4)),
          ),
          SizedBox(height: SizeConfig.r(16)),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: List.generate(
              3,
              (_) => Column(
                children: [
                  ShimmerBox(
                    width: SizeConfig.r(52),
                    height: SizeConfig.r(52),
                    borderRadius: BorderRadius.circular(SizeConfig.r(26)),
                  ),
                  SizedBox(height: SizeConfig.r(8)),
                  ShimmerBox(
                    width: SizeConfig.r(48),
                    height: SizeConfig.r(12),
                    borderRadius: BorderRadius.circular(SizeConfig.r(4)),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  static Widget _shimmerSettings({required int rowCount}) {
    return Padding(
      padding: EdgeInsets.symmetric(horizontal: SizeConfig.hPad),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          ShimmerBox(
            width: SizeConfig.r(80),
            height: SizeConfig.r(16),
            borderRadius: BorderRadius.circular(SizeConfig.r(4)),
          ),
          SizedBox(height: SizeConfig.r(8)),
          ...List.generate(
            rowCount,
            (i) => Padding(
              padding: EdgeInsets.symmetric(vertical: SizeConfig.r(14)),
              child: Row(
                children: [
                  ShimmerBox(
                    width: SizeConfig.r(22),
                    height: SizeConfig.r(22),
                    borderRadius: BorderRadius.circular(SizeConfig.r(4)),
                  ),
                  SizedBox(width: SizeConfig.r(14)),
                  Expanded(
                    child: ShimmerBox(
                      height: SizeConfig.r(14),
                      borderRadius: BorderRadius.circular(SizeConfig.r(4)),
                    ),
                  ),
                  SizedBox(width: SizeConfig.r(12)),
                  ShimmerBox(
                    width: SizeConfig.r(22),
                    height: SizeConfig.r(22),
                    borderRadius: BorderRadius.circular(SizeConfig.r(4)),
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

class _ProfileHeaderShimmer extends StatelessWidget {
  final VoidCallback onBack;
  const _ProfileHeaderShimmer({required this.onBack});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      color: _ProfileColors.header,
      child: SafeArea(
        bottom: false,
        child: Shimmer(
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
                      onPressed: onBack,
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
                    SizedBox(width: SizeConfig.r(48)),
                  ],
                ),
              ),
              SizedBox(height: SizeConfig.r(8)),
              ShimmerBox(
                width: SizeConfig.r(104),
                height: SizeConfig.r(104),
                borderRadius: BorderRadius.circular(SizeConfig.r(52)),
              ),
              SizedBox(height: SizeConfig.r(14)),
              ShimmerBox(
                width: SizeConfig.r(72),
                height: SizeConfig.r(26),
                borderRadius: BorderRadius.circular(SizeConfig.r(20)),
              ),
              SizedBox(height: SizeConfig.r(8)),
              ShimmerBox(
                width: SizeConfig.r(72),
                height: SizeConfig.r(14),
                borderRadius: BorderRadius.circular(SizeConfig.r(4)),
              ),
              SizedBox(height: SizeConfig.r(24)),
            ],
          ),
        ),
      ),
    );
  }
}

class _ProfileErrorBody extends StatelessWidget {
  final VoidCallback onRetry;

  const _ProfileErrorBody({required this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        const OfflineBanner(),
        Align(
          alignment: Alignment.centerLeft,
          child: IconButton(
            onPressed: () => Navigator.pushNamedAndRemoveUntil(
              context,
              AppRoutes.driverDashboard,
              (route) => false,
            ),
            icon: Icon(
              Icons.arrow_back,
              color: AppColors.textDark,
              size: SizeConfig.r(22),
            ),
          ),
        ),
        Expanded(
          child: Center(
            child: Padding(
              padding: EdgeInsets.all(SizeConfig.r(20)),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    Icons.cloud_off_outlined,
                    size: SizeConfig.r(42),
                    color: AppColors.warning,
                  ),
                  SizedBox(height: SizeConfig.r(12)),
                  Text(
                    'No internet. Please try again.',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: SizeConfig.sp(14),
                      color: AppColors.textDark,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  SizedBox(height: SizeConfig.r(20)),
                  AppButton(
                    label: 'Retry',
                    onPressed: onRetry,
                    height: SizeConfig.r(42),
                    borderRadius: SizeConfig.radius,
                  ),
                  SizedBox(height: SizeConfig.r(10)),
                  AppButton(
                    label: 'Back to Dashboard',
                    onPressed: () => Navigator.pushNamedAndRemoveUntil(
                      context,
                      AppRoutes.driverDashboard,
                      (route) => false,
                    ),
                    height: SizeConfig.r(42),
                    borderRadius: SizeConfig.radius,
                    backgroundColor: AppColors.surfaceGray,
                    textColor: AppColors.textDark,
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

// ─────────────────────────────────────────────────────────────────────────────
// Header
// ─────────────────────────────────────────────────────────────────────────────

class _ProfileHeader extends StatelessWidget {
  final DriverProfileModel profile;
  const _ProfileHeader({required this.profile});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      color: _ProfileColors.header,
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
                  SizedBox(width: SizeConfig.r(48)),
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
                  child: CircleAvatar(
                    radius: SizeConfig.r(48),
                    backgroundColor: const Color(0xFFE8E8E8),
                    child: Icon(
                      Icons.person,
                      size: SizeConfig.r(48),
                      color: AppColors.textLight,
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
                      color: _ProfileColors.header,
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
                'Driver',
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
                  decoration: BoxDecoration(
                    color: profile.isActive
                        ? _ProfileColors.onDutyDot
                        : Colors.white54,
                    shape: BoxShape.circle,
                  ),
                ),
                SizedBox(width: SizeConfig.r(6)),
                Text(
                  profile.isActive ? 'On Duty' : profile.statusLabel,
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
  final DriverProfileModel profile;
  const _PersonalInformationSection({required this.profile});

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
                color: _ProfileColors.action,
                size: SizeConfig.r(20),
              ),
            ],
          ),
          SizedBox(height: SizeConfig.r(16)),
          _InfoRow(label: 'Full Name', value: profile.fullName),
          SizedBox(height: SizeConfig.r(12)),
          _InfoRow(
            label: 'Phone Number',
            value: profile.phone.isEmpty ? '-' : profile.phone,
          ),
          SizedBox(height: SizeConfig.r(12)),
          _InfoRow(
            label: 'Email',
            value: profile.email.isEmpty ? '-' : profile.email,
          ),
          SizedBox(height: SizeConfig.r(12)),
          _InfoRow(
            label: 'Passport number',
            value: (profile.passportNumber ?? '').isEmpty
                ? '-'
                : profile.passportNumber!,
          ),
          if (profile.rightToWorkCode != null &&
              profile.rightToWorkCode!.isNotEmpty) ...[
            SizedBox(height: SizeConfig.r(12)),
            _InfoRow(
              label: 'Right to work code',
              value: profile.rightToWorkCode!,
            ),
          ],
          SizedBox(height: SizeConfig.r(12)),
          _InfoRow(
            label: 'Emergency Contact',
            value: _emergencyDisplay(profile),
          ),
          if (profile.residentialAddress.isNotEmpty) ...[
            SizedBox(height: SizeConfig.r(12)),
            _InfoRow(label: 'Address', value: profile.residentialAddress),
          ],
        ],
      ),
    );
  }

  String _emergencyDisplay(DriverProfileModel profile) {
    final name = profile.emergencyContactName.trim();
    final phone = profile.emergencyContactPhone.trim();
    if (name.isEmpty && phone.isEmpty) return '-';
    if (name.isEmpty) return phone;
    if (phone.isEmpty) return name;
    return '$name · $phone';
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
// Professional Details
// ─────────────────────────────────────────────────────────────────────────────

class _ProfessionalDetailsSection extends StatelessWidget {
  final DriverProfileModel profile;
  const _ProfessionalDetailsSection({required this.profile});

  @override
  Widget build(BuildContext context) {
    final vehicle = profile.vehicle;
    return Padding(
      padding: EdgeInsets.symmetric(horizontal: SizeConfig.hPad),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Professional Details',
            style: TextStyle(
              fontSize: SizeConfig.sp(16),
              fontWeight: FontWeight.w700,
              color: AppColors.textDark,
            ),
          ),
          SizedBox(height: SizeConfig.r(16)),
          _InfoRow(
            label: 'License Number',
            value: profile.licenseNo.isEmpty ? '-' : profile.licenseNo,
          ),
          SizedBox(height: SizeConfig.r(12)),
          _InfoRow(
            label: 'Vehicle Assigned',
            value: vehicle?.displayName ?? 'Not assigned',
          ),
          SizedBox(height: SizeConfig.r(12)),
          _InfoRow(
            label: 'Plate Number',
            value: vehicle?.taxiLicensePlateNumber.isNotEmpty == true
                ? vehicle!.taxiLicensePlateNumber
                : 'Not assigned',
          ),
          SizedBox(height: SizeConfig.r(12)),
          _InfoRow(
            label: 'Registration #',
            value: vehicle?.registrationNumber ?? 'Not provided',
          ),
          if (profile.dbsServiceUpdateId != null &&
              profile.dbsServiceUpdateId!.isNotEmpty) ...[
            SizedBox(height: SizeConfig.r(12)),
            _InfoRow(
              label: 'DBS Service ID',
              value: profile.dbsServiceUpdateId!,
            ),
          ],
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Documents
// ─────────────────────────────────────────────────────────────────────────────

class _DocumentsSection extends StatelessWidget {
  final DriverProfileModel profile;
  const _DocumentsSection({required this.profile});

  @override
  Widget build(BuildContext context) {
    final driverTypes = profile.driverDocuments
        .map((d) => d.documentType.toLowerCase())
        .toSet();
    final vehicleTypes = profile.vehicleDocuments
        .map((d) => d.documentType.toLowerCase())
        .toSet();

    bool hasAny(Iterable<String> keys, Set<String> available) {
      for (final key in keys) {
        if (available.contains(key.toLowerCase())) return true;
      }
      return false;
    }

    final docs = [
      _DriverDocItem(
        icon: Icons.badge_outlined,
        title: 'Passport / ID',
        uploaded: hasAny(const ['passport', 'passport_number'], driverTypes),
      ),
      _DriverDocItem(
        icon: Icons.credit_card_outlined,
        title: 'Driver License',
        uploaded: hasAny(const [
          'driving_license_front',
          'driving_license_back',
        ], driverTypes),
      ),
      _DriverDocItem(
        icon: Icons.verified_user_outlined,
        title: 'DBS Certificate',
        uploaded: hasAny(const [
          'dbs_certificate_front',
          'dbs_certificate_back',
        ], driverTypes),
      ),
      _DriverDocItem(
        icon: Icons.directions_car_outlined,
        title: 'Vehicle Documents',
        uploaded: vehicleTypes.isNotEmpty,
      ),
    ];

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
          ...docs.map(
            (doc) => Padding(
              padding: EdgeInsets.only(bottom: SizeConfig.r(10)),
              child: _DocumentCard(item: doc),
            ),
          ),
        ],
      ),
    );
  }
}

class _DriverDocItem {
  final IconData icon;
  final String title;
  final bool uploaded;
  const _DriverDocItem({
    required this.icon,
    required this.title,
    required this.uploaded,
  });
}

class _DocumentCard extends StatelessWidget {
  final _DriverDocItem item;
  const _DocumentCard({required this.item});

  @override
  Widget build(BuildContext context) {
    final accent = item.uploaded
        ? _ProfileColors.docGreen
        : _ProfileColors.docYellow;
    final bg = item.uploaded
        ? _ProfileColors.docGreenBg
        : _ProfileColors.docYellowBg;
    final statusLabel = item.uploaded ? 'Uploaded' : 'Missing';

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
          Icon(item.icon, color: accent, size: SizeConfig.r(26)),
          SizedBox(width: SizeConfig.r(12)),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  item.title,
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
                    statusLabel,
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
// Quick Actions (driver-only)
// ─────────────────────────────────────────────────────────────────────────────

class _QuickActionsSection extends StatelessWidget {
  final VoidCallback onChecklist;
  final VoidCallback onSos;
  final VoidCallback onRefresh;

  const _QuickActionsSection({
    required this.onChecklist,
    required this.onSos,
    required this.onRefresh,
  });

  @override
  Widget build(BuildContext context) {
    final actions = [
      _QuickAction(
        icon: Icons.description_outlined,
        label: 'Doc',
        color: AppColors.success,
        onTap: onRefresh,
      ),
      _QuickAction(
        icon: Icons.checklist,
        label: 'Checklist',
        color: const Color(0xFF7C3AED),
        onTap: onChecklist,
      ),
      _QuickAction(
        icon: Icons.warning_amber_rounded,
        label: 'SOS',
        color: AppColors.error,
        onTap: onSos,
      ),
    ];

    return Padding(
      padding: EdgeInsets.symmetric(horizontal: SizeConfig.hPad),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Quick Actions',
            style: TextStyle(
              fontSize: SizeConfig.sp(16),
              fontWeight: FontWeight.w700,
              color: AppColors.textDark,
            ),
          ),
          SizedBox(height: SizeConfig.r(16)),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: actions
                .map(
                  (a) => GestureDetector(
                    onTap: a.onTap,
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Container(
                          width: SizeConfig.r(52),
                          height: SizeConfig.r(52),
                          decoration: BoxDecoration(
                            color: a.color.withValues(alpha: 0.12),
                            shape: BoxShape.circle,
                          ),
                          child: Icon(
                            a.icon,
                            color: a.color,
                            size: SizeConfig.r(24),
                          ),
                        ),
                        SizedBox(height: SizeConfig.r(8)),
                        Text(
                          a.label,
                          style: TextStyle(
                            fontSize: SizeConfig.sp(12),
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
        ],
      ),
    );
  }
}

class _QuickAction {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;
  const _QuickAction({
    required this.icon,
    required this.label,
    required this.color,
    required this.onTap,
  });
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
            icon: Icons.language,
            label: 'Language',
            iconColor: AppColors.textMedium,
            labelColor: AppColors.textDark,
            onTap: () {},
          ),
          Divider(height: 1, thickness: 1, color: AppColors.inputBorder),
          _SettingsTile(
            icon: Icons.headset_mic_outlined,
            label: 'Support',
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
