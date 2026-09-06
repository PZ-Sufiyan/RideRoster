import 'package:flutter/material.dart';
import 'package:package_info_plus/package_info_plus.dart';

import '../utils/app_colors.dart';
import '../utils/size_confg.dart';

/// Shows the version from `pubspec.yaml` (baked in at build time).
class AppVersionLabel extends StatefulWidget {
  const AppVersionLabel({super.key});

  @override
  State<AppVersionLabel> createState() => _AppVersionLabelState();
}

class _AppVersionLabelState extends State<AppVersionLabel> {
  static String? _cachedVersion;

  @override
  void initState() {
    super.initState();
    if (_cachedVersion != null) return;
    PackageInfo.fromPlatform().then((info) {
      if (!mounted) {
        _cachedVersion = info.version;
        return;
      }
      setState(() => _cachedVersion = info.version);
    });
  }

  @override
  Widget build(BuildContext context) {
    final version = _cachedVersion;
    if (version == null || version.isEmpty) {
      return const SizedBox.shrink();
    }

    return Padding(
      padding: EdgeInsets.only(top: SizeConfig.r(8), bottom: SizeConfig.r(8)),
      child: Center(
        child: Text(
          'Version $version',
          style: TextStyle(
            fontSize: SizeConfig.sp(12),
            fontWeight: FontWeight.w500,
            color: AppColors.textLight,
          ),
        ),
      ),
    );
  }
}
