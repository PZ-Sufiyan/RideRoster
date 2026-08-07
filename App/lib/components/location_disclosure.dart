import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../utils/app_colors.dart';
import '../utils/size_confg.dart';

/// Prominent location disclosure shown once before the system permission prompt
/// (Google Play background-location policy). On iOS, Continue must always lead
/// into the system dialog — no deferral (App Store 5.1.1(iv)).
class LocationDisclosure {
  LocationDisclosure._();

  static const _acceptedKey = 'location_disclosure_accepted_v1';

  static Future<bool> hasAccepted() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool(_acceptedKey) ?? false;
  }

  static Future<void> markAccepted() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_acceptedKey, true);
  }

  /// Returns `true` when the user may proceed to the system permission prompt.
  static Future<bool> showIfNeeded(BuildContext context) async {
    if (await hasAccepted()) return true;
    if (!context.mounted) return false;
    return showDialog<bool>(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => const _LocationDisclosureDialog(),
    ).then((value) => value == true);
  }
}

class _LocationDisclosureDialog extends StatelessWidget {
  const _LocationDisclosureDialog();

  @override
  Widget build(BuildContext context) {
    SizeConfig.init(context);

    return Dialog(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(SizeConfig.r(16)),
      ),
      insetPadding: EdgeInsets.symmetric(horizontal: SizeConfig.r(24)),
      child: Padding(
        padding: EdgeInsets.fromLTRB(
          SizeConfig.r(20),
          SizeConfig.r(22),
          SizeConfig.r(20),
          SizeConfig.r(16),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  width: SizeConfig.r(40),
                  height: SizeConfig.r(40),
                  decoration: BoxDecoration(
                    color: AppColors.primaryLight,
                    borderRadius: BorderRadius.circular(SizeConfig.r(10)),
                  ),
                  child: Icon(
                    Icons.location_on_outlined,
                    color: AppColors.primary,
                    size: SizeConfig.r(22),
                  ),
                ),
                SizedBox(width: SizeConfig.r(12)),
                Expanded(
                  child: Text(
                    'Location access',
                    style: TextStyle(
                      fontSize: SizeConfig.sp(18),
                      fontWeight: FontWeight.w700,
                      color: AppColors.textDark,
                    ),
                  ),
                ),
              ],
            ),
            SizedBox(height: SizeConfig.r(14)),
            Text(
              'NST SCH collects your device location during active school and '
              'specialist transport jobs, including when the app is in the '
              'background or your screen is off.',
              style: TextStyle(
                fontSize: SizeConfig.sp(14),
                height: 1.45,
                color: AppColors.textMedium,
              ),
            ),
            SizedBox(height: SizeConfig.r(10)),
            Text(
              'We use this data to:',
              style: TextStyle(
                fontSize: SizeConfig.sp(14),
                fontWeight: FontWeight.w600,
                color: AppColors.textDark,
              ),
            ),
            SizedBox(height: SizeConfig.r(8)),
            _bullet('Detect arrival at pickup and drop-off stops'),
            _bullet('Track active ride progress for your company'),
            _bullet('Share live location during SOS safety alerts'),
            SizedBox(height: SizeConfig.r(18)),
            // App Store 5.1.1(iv): after a custom pre-permission message, the
            // user must always proceed to the system permission request — no
            // "Not now" / dismiss that delays the prompt.
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () async {
                  await LocationDisclosure.markAccepted();
                  if (context.mounted) {
                    Navigator.of(context).pop(true);
                  }
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                  elevation: 0,
                  padding: EdgeInsets.symmetric(vertical: SizeConfig.r(12)),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(SizeConfig.r(10)),
                  ),
                ),
                child: Text(
                  'Continue',
                  style: TextStyle(
                    fontSize: SizeConfig.sp(14),
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _bullet(String text) {
    return Padding(
      padding: EdgeInsets.only(bottom: SizeConfig.r(6)),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: EdgeInsets.only(top: SizeConfig.r(6)),
            child: Container(
              width: SizeConfig.r(5),
              height: SizeConfig.r(5),
              decoration: const BoxDecoration(
                color: AppColors.primary,
                shape: BoxShape.circle,
              ),
            ),
          ),
          SizedBox(width: SizeConfig.r(8)),
          Expanded(
            child: Text(
              text,
              style: TextStyle(
                fontSize: SizeConfig.sp(13),
                height: 1.4,
                color: AppColors.textMedium,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
