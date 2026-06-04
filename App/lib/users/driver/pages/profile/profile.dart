import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../../components/app_button.dart';
import '../../../../components/offline_banner.dart';
import '../../../../providers/auth_provider.dart';
import '../../../../providers/driver_profile_provider.dart';
import '../../../../routes/app_routes.dart';
import '../../../../model/driver_profile_model.dart';
import '../../../../utils/app_colors.dart';
import '../../../../utils/shimmer.dart';
import '../../../../utils/size_confg.dart';

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
      body: SafeArea(
        child: Consumer<DriverProfileProvider>(
          builder: (context, provider, _) {
            if (provider.isLoading && !provider.hasProfile) {
              return const _ProfilePageShimmer();
            }

            if (provider.error != null && !provider.hasProfile) {
              return _ProfileErrorState(
                onRetry: () => context
                    .read<DriverProfileProvider>()
                    .loadProfile(forceRefresh: true),
              );
            }

            final profile = provider.profile;
            if (profile == null) {
              return _ProfileErrorState(
                onRetry: () => context
                    .read<DriverProfileProvider>()
                    .loadProfile(forceRefresh: true),
              );
            }

            return RefreshIndicator(
              onRefresh: () => context
                  .read<DriverProfileProvider>()
                  .loadProfile(forceRefresh: true),
              child: Column(
                children: [
                  const OfflineBanner(),
                  _buildAppBar(context),
                  Expanded(
                    child: SingleChildScrollView(
                      physics: const AlwaysScrollableScrollPhysics(),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _buildProfileHeader(profile),
                          _buildDivider(),
                          _buildPersonalInfo(profile),
                          _buildDivider(),
                          _buildProfessionalDetails(profile),
                          _buildDivider(),
                          _buildRequiredDocuments(profile),
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
            );
          },
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

  Widget _buildProfileHeader(DriverProfileModel profile) {
    return Padding(
      padding: EdgeInsets.symmetric(vertical: SizeConfig.r(20)),
      child: Center(
        child: Column(
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
            SizedBox(height: SizeConfig.r(12)),
            Text(
              profile.fullName,
              style: TextStyle(
                fontSize: SizeConfig.sp(18),
                fontWeight: FontWeight.w700,
                color: AppColors.textDark,
              ),
            ),
            SizedBox(height: SizeConfig.r(8)),
            _StatusBadge(
              label: profile.statusLabel,
              color: profile.isActive ? AppColors.success : AppColors.warning,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPersonalInfo(DriverProfileModel profile) {
    final rows = [
      _InfoRow('Full Name', profile.fullName),
      _InfoRow('Phone Number', profile.phone),
      _InfoRow('Email', profile.email),
      _InfoRow('Address', profile.residentialAddress),
      _InfoRow(
        'Passport Number',
        profile.passportNumber == null || profile.passportNumber!.isEmpty
            ? 'Not provided'
            : profile.passportNumber!,
      ),
      _InfoRow(
        'Emergency Contact',
        '${profile.emergencyContactName} (${profile.emergencyContactPhone})',
      ),
      _InfoRow(
        'Right To Work Code',
        profile.rightToWorkCode == null || profile.rightToWorkCode!.isEmpty
            ? 'Not provided'
            : profile.rightToWorkCode!,
      ),
    ];
    return _Section(
      title: 'Personal Information',
      child: _InfoTable(rows: rows),
    );
  }

  Widget _buildProfessionalDetails(DriverProfileModel profile) {
    final vehicle = profile.vehicle;
    return _Section(
      title: 'Professional Details',
      child: Column(
        children: [
          _InfoRowWidget(
            label: 'License Number',
            valueWidget: Text(
              profile.licenseNo.isEmpty ? '-' : profile.licenseNo,
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
              vehicle?.displayName ?? 'Not assigned',
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
              vehicle?.taxiLicensePlateNumber.isNotEmpty == true
                  ? vehicle!.taxiLicensePlateNumber
                  : 'Not assigned',
              style: TextStyle(
                fontSize: SizeConfig.sp(13),
                color: AppColors.textDark,
              ),
            ),
          ),
          _dividerLine(),
          _InfoRowWidget(
            label: 'Registration #',
            valueWidget: Text(
              vehicle?.registrationNumber ?? 'Not provided',
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

  Widget _buildRequiredDocuments(DriverProfileModel profile) {
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
      _DocData(
        icon: Icons.credit_card,
        label: 'Passport / ID',
        status: hasAny(const ['passport', 'passport_number'], driverTypes)
            ? 'Uploaded'
            : 'Missing',
      ),
      _DocData(
        icon: Icons.description_outlined,
        label: 'Driver License',
        status:
            hasAny(const [
              'driving_license_front',
              'driving_license_back',
            ], driverTypes)
            ? 'Uploaded'
            : 'Missing',
      ),
      _DocData(
        icon: Icons.shield_outlined,
        label: 'DBS Certificate',
        status:
            hasAny(const [
              'dbs_certificate_front',
              'dbs_certificate_back',
            ], driverTypes)
            ? 'Uploaded'
            : 'Missing',
      ),
      _DocData(
        icon: Icons.directions_car_outlined,
        label: 'Vehicle Documents',
        status: vehicleTypes.isNotEmpty ? 'Uploaded' : 'Missing',
      ),
    ];

    return _Section(
      title: 'Required Documents',
      child: Column(children: docs.map((d) => _DocRow(data: d)).toList()),
    );
  }

  Widget _buildQuickActions(BuildContext context) {
    final actions = [
      _QuickAction(
        icon: Icons.description_outlined,
        label: 'Doc',
        color: AppColors.success,
      ),
      _QuickAction(
        icon: Icons.checklist,
        label: 'Checklist',
        color: const Color(0xFF7C3AED),
      ),
      _QuickAction(
        icon: Icons.warning_amber_rounded,
        label: 'SOS',
        color: AppColors.error,
      ),
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
                    return;
                  }
                  if (a.label == 'SOS') {
                    Navigator.pushNamed(context, AppRoutes.sos);
                    return;
                  }
                  if (a.label == 'Refresh') {
                    context.read<DriverProfileProvider>().loadProfile(
                      forceRefresh: true,
                    );
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
                      child: Icon(
                        a.icon,
                        color: a.color,
                        size: SizeConfig.r(22),
                      ),
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
            onTap: () async {
              await context.read<AuthProvider>().logout();
              if (!context.mounted) return;
              Navigator.pushNamedAndRemoveUntil(
                context,
                AppRoutes.login,
                (route) => false,
              );
            },
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

class _ProfileErrorState extends StatelessWidget {
  final VoidCallback onRetry;

  const _ProfileErrorState({required this.onRetry});

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

class _ProfilePageShimmer extends StatelessWidget {
  const _ProfilePageShimmer();

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Padding(
          padding: EdgeInsets.symmetric(
            horizontal: SizeConfig.r(4),
            vertical: SizeConfig.r(8),
          ),
          child: Row(
            children: [
              IconButton(
                onPressed: null,
                icon: Icon(
                  Icons.arrow_back,
                  color: AppColors.textLight,
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
        ),
        Expanded(
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            child: Shimmer(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Padding(
                    padding: EdgeInsets.symmetric(vertical: SizeConfig.r(20)),
                    child: Center(
                      child: Column(
                        children: [
                          ShimmerBox(
                            width: SizeConfig.r(88),
                            height: SizeConfig.r(88),
                            borderRadius: BorderRadius.circular(
                              SizeConfig.r(44),
                            ),
                          ),
                          SizedBox(height: SizeConfig.r(12)),
                          ShimmerBox(
                            width: SizeConfig.r(180),
                            height: SizeConfig.r(18),
                            borderRadius: BorderRadius.circular(
                              SizeConfig.r(6),
                            ),
                          ),
                          SizedBox(height: SizeConfig.r(8)),
                          ShimmerBox(
                            width: SizeConfig.r(86),
                            height: SizeConfig.r(22),
                            borderRadius: BorderRadius.circular(
                              SizeConfig.r(4),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  _shimmerDivider(),
                  _buildShimmerSection(rowCount: 6),
                  _shimmerDivider(),
                  _buildShimmerSection(rowCount: 4),
                  _shimmerDivider(),
                  _buildShimmerSection(rowCount: 4),
                  _shimmerDivider(),
                  _buildShimmerQuickActions(),
                  _shimmerDivider(),
                  _buildShimmerSettings(),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildShimmerSection({
    required int rowCount,
    bool includeButton = false,
  }) {
    return Padding(
      padding: EdgeInsets.symmetric(
        horizontal: SizeConfig.hPad,
        vertical: SizeConfig.r(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          ShimmerBox(
            width: SizeConfig.r(160),
            height: SizeConfig.r(16),
            borderRadius: BorderRadius.circular(SizeConfig.r(4)),
          ),
          SizedBox(height: SizeConfig.r(12)),
          ...List.generate(
            rowCount,
            (index) => Padding(
              padding: EdgeInsets.only(bottom: SizeConfig.r(10)),
              child: Row(
                children: [
                  Expanded(
                    child: ShimmerBox(
                      height: SizeConfig.r(13),
                      borderRadius: BorderRadius.circular(SizeConfig.r(4)),
                    ),
                  ),
                  SizedBox(width: SizeConfig.r(16)),
                  Expanded(
                    child: ShimmerBox(
                      height: SizeConfig.r(13),
                      borderRadius: BorderRadius.circular(SizeConfig.r(4)),
                    ),
                  ),
                ],
              ),
            ),
          ),
          if (includeButton) ...[
            SizedBox(height: SizeConfig.r(8)),
            ShimmerBox(
              height: SizeConfig.r(46),
              borderRadius: BorderRadius.circular(SizeConfig.radius),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildShimmerQuickActions() {
    return Padding(
      padding: EdgeInsets.symmetric(
        horizontal: SizeConfig.hPad,
        vertical: SizeConfig.r(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          ShimmerBox(
            width: SizeConfig.r(140),
            height: SizeConfig.r(16),
            borderRadius: BorderRadius.circular(SizeConfig.r(4)),
          ),
          SizedBox(height: SizeConfig.r(12)),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: List.generate(
              3,
              (_) => Column(
                children: [
                  ShimmerBox(
                    width: SizeConfig.r(44),
                    height: SizeConfig.r(44),
                    borderRadius: BorderRadius.circular(SizeConfig.r(22)),
                  ),
                  SizedBox(height: SizeConfig.r(6)),
                  ShimmerBox(
                    width: SizeConfig.r(52),
                    height: SizeConfig.r(11),
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

  Widget _buildShimmerSettings() {
    return Padding(
      padding: EdgeInsets.symmetric(
        horizontal: SizeConfig.hPad,
        vertical: SizeConfig.r(4),
      ),
      child: Column(
        children: [
          ...List.generate(
            4,
            (index) => Padding(
              padding: EdgeInsets.symmetric(vertical: SizeConfig.r(14)),
              child: Row(
                children: [
                  ShimmerBox(
                    width: SizeConfig.r(20),
                    height: SizeConfig.r(20),
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
                    width: SizeConfig.r(18),
                    height: SizeConfig.r(18),
                    borderRadius: BorderRadius.circular(SizeConfig.r(4)),
                  ),
                ],
              ),
            ),
          ),
          SizedBox(height: SizeConfig.r(24)),
        ],
      ),
    );
  }

  Widget _shimmerDivider() {
    return Divider(height: 1, thickness: 1, color: AppColors.surfaceGray);
  }
}

class _Section extends StatelessWidget {
  final String title;
  final Widget child;

  const _Section({required this.title, required this.child});

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
          Text(
            title,
            style: TextStyle(
              fontSize: SizeConfig.sp(15),
              fontWeight: FontWeight.w700,
              color: AppColors.textDark,
            ),
          ),
          SizedBox(height: SizeConfig.r(12)),
          child,
        ],
      ),
    );
  }
}

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
      children: rows.asMap().entries.map((entry) {
        final i = entry.key;
        final row = entry.value;
        return Column(
          children: [
            Padding(
              padding: EdgeInsets.symmetric(vertical: SizeConfig.r(10)),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Text(
                      row.label,
                      style: TextStyle(
                        fontSize: SizeConfig.sp(13),
                        color: AppColors.textLight,
                      ),
                    ),
                  ),
                  SizedBox(width: SizeConfig.r(8)),
                  Expanded(
                    child: Text(
                      row.value,
                      textAlign: TextAlign.right,
                      style: TextStyle(
                        fontSize: SizeConfig.sp(13),
                        color: AppColors.textDark,
                        fontWeight: FontWeight.w500,
                      ),
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
          Flexible(child: valueWidget),
        ],
      ),
    );
  }
}

class _DocData {
  final IconData icon;
  final String label;
  final String status;
  const _DocData({
    required this.icon,
    required this.label,
    required this.status,
  });
}

class _DocRow extends StatelessWidget {
  final _DocData data;
  const _DocRow({required this.data});

  @override
  Widget build(BuildContext context) {
    SizeConfig.init(context);
    final isMissing = data.status == 'Missing';
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
            color: isMissing ? AppColors.warning : AppColors.success,
          ),
        ],
      ),
    );
  }
}

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
  const _QuickAction({
    required this.icon,
    required this.label,
    required this.color,
  });
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
