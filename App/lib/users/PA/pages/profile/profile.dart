import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../../components/app_button.dart';
import '../../../../components/offline_banner.dart';
import '../../../../model/pa_profile_model.dart';
import '../../../../providers/auth_provider.dart';
import '../../../../providers/pa_profile_provider.dart';
import '../../../../routes/app_routes.dart';
import '../../../../utils/app_colors.dart';
import '../../../../utils/shimmer.dart';
import '../../../../utils/size_confg.dart';

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

class PaProfilePage extends StatefulWidget {
  const PaProfilePage({super.key});

  @override
  State<PaProfilePage> createState() => _PaProfilePageState();
}

class _PaProfilePageState extends State<PaProfilePage> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<PaProfileProvider>().loadProfile();
    });
  }

  @override
  Widget build(BuildContext context) {
    SizeConfig.init(context);
    return Scaffold(
      backgroundColor: AppColors.background,
      body: Consumer<PaProfileProvider>(
        builder: (context, provider, _) {
          if (provider.isLoading && !provider.hasProfile) {
            return const _ProfileLoadingBody();
          }

          if (provider.error != null && !provider.hasProfile) {
            return _ProfileErrorBody(
              onRetry: () => context.read<PaProfileProvider>().loadProfile(
                forceRefresh: true,
              ),
            );
          }

          final profile = provider.profile;
          if (profile == null) {
            return _ProfileErrorBody(
              onRetry: () => context.read<PaProfileProvider>().loadProfile(
                forceRefresh: true,
              ),
            );
          }

          return RefreshIndicator(
            onRefresh: () => context.read<PaProfileProvider>().loadProfile(
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
                        _CertificatesSection(documents: profile.documents),
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
                  _shimmerDocSection(cardCount: 3),
                  SizedBox(height: SizeConfig.r(24)),
                  _shimmerSettings(rowCount: 2),
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
      color: _PaProfileColors.header,
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
              AppRoutes.paDashboard,
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
                      AppRoutes.paDashboard,
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
// Header (green)
// ─────────────────────────────────────────────────────────────────────────────

class _ProfileHeader extends StatelessWidget {
  final PaProfileModel profile;
  const _ProfileHeader({required this.profile});

  @override
  Widget build(BuildContext context) {
    final pictureUrl = profile.profilePictureUrl;

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
                  child: ClipOval(
                    child: pictureUrl != null && pictureUrl.isNotEmpty
                        ? Image.network(
                            pictureUrl,
                            width: SizeConfig.r(96),
                            height: SizeConfig.r(96),
                            fit: BoxFit.cover,
                            errorBuilder: (_, __, ___) => _avatarPlaceholder(),
                          )
                        : _avatarPlaceholder(),
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
                  decoration: BoxDecoration(
                    color: profile.isOnDuty
                        ? _PaProfileColors.onDutyDot
                        : Colors.white54,
                    shape: BoxShape.circle,
                  ),
                ),
                SizedBox(width: SizeConfig.r(6)),
                Text(
                  profile.isOnDuty ? 'On Duty' : profile.statusLabel,
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

  Widget _avatarPlaceholder() {
    return Container(
      width: SizeConfig.r(96),
      height: SizeConfig.r(96),
      color: const Color(0xFFE8E8E8),
      child: Icon(
        Icons.person,
        size: SizeConfig.r(48),
        color: AppColors.textLight,
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Personal Information
// ─────────────────────────────────────────────────────────────────────────────

class _PersonalInformationSection extends StatelessWidget {
  final PaProfileModel profile;
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
                color: _PaProfileColors.action,
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
            value: profile.passportNumber ?? '-',
          ),
          SizedBox(height: SizeConfig.r(12)),
          _InfoRow(label: 'Nationality', value: profile.nationality ?? '-'),
          if (profile.rightToWorkCode != null) ...[
            SizedBox(height: SizeConfig.r(12)),
            _InfoRow(
              label: 'Right to work code',
              value: profile.rightToWorkCode!,
            ),
          ],
          SizedBox(height: SizeConfig.r(12)),
          _InfoRow(
            label: 'Emergency Contact',
            value: profile.emergencyContactDisplay,
          ),
          if (profile.residentialAddress != null) ...[
            SizedBox(height: SizeConfig.r(12)),
            _InfoRow(label: 'Address', value: profile.residentialAddress!),
          ],
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
  final List<PaDocumentModel> documents;
  const _CertificatesSection({required this.documents});

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
          if (documents.isEmpty)
            Text(
              'No documents uploaded yet.',
              style: TextStyle(
                fontSize: SizeConfig.sp(13),
                color: AppColors.textLight,
              ),
            )
          else
            ...documents.map(
              (doc) => Padding(
                padding: EdgeInsets.only(bottom: SizeConfig.r(10)),
                child: _DocumentCard(document: doc),
              ),
            ),
        ],
      ),
    );
  }
}

enum _DocStatusType { verified, pending, expiring, expired }

class _DocumentCard extends StatelessWidget {
  final PaDocumentModel document;
  const _DocumentCard({required this.document});

  _DocStatusType get _statusType {
    if (document.isExpiryDateMissing) return _DocStatusType.expired;
    switch (document.expiryState) {
      case PaDocumentExpiryState.expired:
        return _DocStatusType.expired;
      case PaDocumentExpiryState.expiringSoon:
        return _DocStatusType.expiring;
      case PaDocumentExpiryState.missing:
        return _DocStatusType.expired;
      case PaDocumentExpiryState.ok:
        if (document.verified) return _DocStatusType.verified;
        return _DocStatusType.pending;
    }
  }

  String get _statusLabel {
    if (document.isExpiryDateMissing) return 'Date required';
    switch (_statusType) {
      case _DocStatusType.expired:
        return 'Expired';
      case _DocStatusType.expiring:
        return 'Expiring soon';
      case _DocStatusType.verified:
        return 'Verified';
      case _DocStatusType.pending:
        return 'Pending';
    }
  }

  IconData get _icon {
    switch (document.documentType) {
      case 'passport':
        return Icons.badge_outlined;
      case 'safeguarding_certificate':
        return Icons.workspace_premium_outlined;
      case 'background_check':
        return Icons.verified_user_outlined;
      case 'first_aid_certificate':
        return Icons.monitor_heart_outlined;
      default:
        return Icons.description_outlined;
    }
  }

  @override
  Widget build(BuildContext context) {
    late final Color accent;
    late final Color bg;
    switch (_statusType) {
      case _DocStatusType.verified:
        accent = _PaProfileColors.docGreen;
        bg = _PaProfileColors.docGreenBg;
        break;
      case _DocStatusType.pending:
      case _DocStatusType.expiring:
        accent = _PaProfileColors.docYellow;
        bg = _PaProfileColors.docYellowBg;
        break;
      case _DocStatusType.expired:
        accent = _PaProfileColors.docRed;
        bg = _PaProfileColors.docRedBg;
        break;
    }

    final showExpiryRow = document.hasExpiryIssue;
    final expiryColor = document.isExpiryDateMissing ||
            document.expiryState == PaDocumentExpiryState.expired
        ? _PaProfileColors.docRed
        : _PaProfileColors.docYellow;
    final showExpiryAlert = document.isExpiryDateMissing ||
        document.expiryState == PaDocumentExpiryState.expiringSoon ||
        document.expiryState == PaDocumentExpiryState.expired;

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
          Icon(_icon, color: accent, size: SizeConfig.r(26)),
          SizedBox(width: SizeConfig.r(12)),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  document.displayTitle,
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
                    _statusLabel,
                    style: TextStyle(
                      fontSize: SizeConfig.sp(10),
                      fontWeight: FontWeight.w600,
                      color: Colors.white,
                    ),
                  ),
                ),
                if (showExpiryRow) ...[
                  SizedBox(height: SizeConfig.r(8)),
                  Row(
                    children: [
                      if (showExpiryAlert)
                        Padding(
                          padding: EdgeInsets.only(right: SizeConfig.r(4)),
                          child: Icon(
                            Icons.warning_amber_rounded,
                            color: expiryColor,
                            size: SizeConfig.r(16),
                          ),
                        ),
                      Text(
                        document.expiryDisplayText,
                        style: TextStyle(
                          fontSize: SizeConfig.sp(12),
                          fontWeight: FontWeight.w600,
                          color: expiryColor,
                        ),
                      ),
                    ],
                  ),
                ],
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
