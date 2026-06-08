import 'package:flutter/material.dart';

import '../utils/app_colors.dart';
import '../utils/size_confg.dart';
import 'app_button.dart';
import 'offline_banner.dart';

/// Center content when leave data cannot be loaded (no internet, first visit).
/// Parent page should already include [OfflineBanner] above the app bar.
class LeaveOfflineErrorBody extends StatelessWidget {
  final VoidCallback onRetry;

  const LeaveOfflineErrorBody({super.key, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Center(
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
          ],
        ),
      ),
    );
  }
}

/// Blocks the leave request form when opened without connectivity.
class LeaveRequestOfflineGate extends StatelessWidget {
  const LeaveRequestOfflineGate({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      body: SafeArea(
        child: Column(
          children: [
            const OfflineBanner(),
            Align(
              alignment: Alignment.centerLeft,
              child: IconButton(
                onPressed: () => Navigator.maybePop(context),
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
                  padding: EdgeInsets.all(SizeConfig.r(24)),
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
                        'Connect to the internet to apply for leave.',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          fontSize: SizeConfig.sp(14),
                          color: AppColors.textDark,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

void showLeaveRequiresInternetMessage(BuildContext context) {
  ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(
      content: const Text('Connect to the internet to apply for leave.'),
      behavior: SnackBarBehavior.floating,
      backgroundColor: AppColors.textDark,
    ),
  );
}
