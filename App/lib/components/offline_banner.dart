import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/connectivity_provider.dart';
import '../utils/app_colors.dart';
import '../utils/size_confg.dart';

/// Drop this into any page's Column — it shows/hides reactively.
/// No page needs to check connectivity itself.
///
/// Usage:
///   Scaffold(
///     body: SafeArea(          // <- the page provides the inset, once
///       child: Column(children: [
///         const OfflineBanner(),
///         _buildAppBar(context),
///         ...
///       ]),
///     ),
///   )
///
/// The banner is a full-width strip and carries no insets of its own: it must be
/// the first child of a Column that sits inside the page's [SafeArea], so it is
/// offset below the status bar exactly once together with the content beneath
/// it. Applying padding inside this widget instead would double the inset for
/// any following widget that has its own [SafeArea] (the profile header does).
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
