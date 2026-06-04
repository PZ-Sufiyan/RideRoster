import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/connectivity_provider.dart';
import '../utils/app_colors.dart';
import '../utils/size_confg.dart';

/// Drop this into any page's Column — it shows/hides reactively.
/// No page needs to check connectivity itself.
///
/// Usage:
///   Column(children: [
///     const OfflineBanner(),
///     _buildAppBar(context),
///     ...
///   ])
class OfflineBanner extends StatelessWidget {
  const OfflineBanner({super.key});

  @override
  Widget build(BuildContext context) {
    final isOnline = context.watch<ConnectivityProvider>().isOnline;
    if (isOnline) return const SizedBox.shrink();

    return Container(
      width: double.infinity,
      color: AppColors.warning.withValues(alpha: 0.15),
      padding: EdgeInsets.symmetric(
        horizontal: SizeConfig.hPad,
        vertical: SizeConfig.r(7),
      ),
      child: Row(
        children: [
          Icon(
            Icons.cloud_off_outlined,
            size: SizeConfig.r(15),
            color: AppColors.warning,
          ),
          SizedBox(width: SizeConfig.r(8)),
          Expanded(
            child: Text(
              'No internet — changes will sync when reconnected.',
              style: TextStyle(
                fontSize: SizeConfig.sp(12),
                color: AppColors.textDark,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
