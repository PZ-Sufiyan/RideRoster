import 'package:flutter/material.dart';
import '../../../../routes/app_routes.dart';
import '../../../../utils/app_colors.dart';
import '../../../../utils/size_confg.dart';

/// Sign-up entry: pick Driver vs Passenger before registration.
class ChooseAccountTypePage extends StatelessWidget {
  const ChooseAccountTypePage({super.key});

  static const Color _pageBg = Color(0xFFF8F9FA);
  static const Color _cardIconBlue = Color(0xFF007BFF);
  static const Color _logoGreen = Color(0xFF1F8A5C);
  static const Color _logoTextTeal = Color(0xFF1A4D5C);

  @override
  Widget build(BuildContext context) {
    SizeConfig.init(context);

    return Scaffold(
      backgroundColor: _pageBg,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: EdgeInsets.symmetric(horizontal: SizeConfig.hPad),
          child: Column(
            children: [
              SizedBox(height: SizeConfig.sh(4)),
              _LogoBlock(
                logoGreen: _logoGreen,
                logoTextTeal: _logoTextTeal,
              ),
              SizedBox(height: SizeConfig.r(28)),
              Text(
                'Chose Type',
                style: TextStyle(
                  fontSize: SizeConfig.sp(22),
                  fontWeight: FontWeight.bold,
                  color: AppColors.textDark,
                ),
              ),
              SizedBox(height: SizeConfig.r(28)),
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: _TypeCard(
                      icon: Icons.drive_eta_outlined,
                      title: 'Driver',
                      subtitle: 'Jobs Today',
                      footer: 'Updated just now',
                      iconColor: _cardIconBlue,
                      onTap: () => Navigator.pushNamed(
                        context,
                        AppRoutes.driverRegister,
                      ),
                    ),
                  ),
                  SizedBox(width: SizeConfig.r(12)),
                  Expanded(
                    child: _TypeCard(
                      icon: Icons.folder_shared_outlined,
                      title: 'Passenger Assistant',
                      subtitle: 'Request ride',
                      footer: 'Updated just now',
                      iconColor: _cardIconBlue,
                      onTap: () => Navigator.pushNamed(
                        context,
                        AppRoutes.passengerAssistantRegister,
                      ),
                    ),
                  ),
                ],
              ),
              SizedBox(height: SizeConfig.r(32)),
            ],
          ),
        ),
      ),
    );
  }
}

class _LogoBlock extends StatelessWidget {
  const _LogoBlock({
    required this.logoGreen,
    required this.logoTextTeal,
  });

  final Color logoGreen;
  final Color logoTextTeal;

  @override
  Widget build(BuildContext context) {
    SizeConfig.init(context);
    final circle = SizeConfig.r(56);
    final nstSize = SizeConfig.sp(18);

    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Container(
          width: circle,
          height: circle,
          decoration: BoxDecoration(
            color: logoGreen,
            shape: BoxShape.circle,
            boxShadow: [
              BoxShadow(
                color: logoGreen.withValues(alpha: 0.35),
                blurRadius: SizeConfig.r(12),
                offset: Offset(0, SizeConfig.r(4)),
              ),
            ],
          ),
          child: Center(
            child: Text(
              'NST',
              style: TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w800,
                fontSize: nstSize,
                letterSpacing: 0.5,
              ),
            ),
          ),
        ),
        SizedBox(width: SizeConfig.r(14)),
        Flexible(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                'NOTTINGHAM',
                style: TextStyle(
                  fontFamily: 'Georgia',
                  fontSize: SizeConfig.sp(15),
                  fontWeight: FontWeight.w700,
                  color: logoTextTeal,
                  height: 1.1,
                  letterSpacing: 0.3,
                ),
              ),
              Text(
                'SPECIALIST TRANSPORT LTD',
                style: TextStyle(
                  fontFamily: 'Georgia',
                  fontSize: SizeConfig.sp(10),
                  fontWeight: FontWeight.w600,
                  color: logoTextTeal,
                  height: 1.2,
                  letterSpacing: 0.2,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _TypeCard extends StatelessWidget {
  const _TypeCard({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.footer,
    required this.iconColor,
    required this.onTap,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final String footer;
  final Color iconColor;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    SizeConfig.init(context);
    final radius = SizeConfig.r(16);

    return Material(
      color: Colors.white,
      elevation: 0,
      shadowColor: Colors.transparent,
      borderRadius: BorderRadius.circular(radius),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(radius),
        child: Ink(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(radius),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.07),
                blurRadius: SizeConfig.r(14),
                offset: Offset(0, SizeConfig.r(4)),
              ),
            ],
          ),
          child: Padding(
            padding: EdgeInsets.fromLTRB(
              SizeConfig.r(12),
              SizeConfig.r(22),
              SizeConfig.r(12),
              SizeConfig.r(16),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                Icon(
                  icon,
                  size: SizeConfig.r(46),
                  color: iconColor,
                ),
                SizedBox(height: SizeConfig.r(14)),
                Text(
                  title,
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: SizeConfig.sp(18),
                    fontWeight: FontWeight.bold,
                    color: AppColors.textDark,
                  ),
                ),
                SizedBox(height: SizeConfig.r(6)),
                Text(
                  subtitle,
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: SizeConfig.sp(13),
                    color: AppColors.textMedium,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                SizedBox(height: SizeConfig.r(20)),
                Text(
                  footer,
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: SizeConfig.sp(10),
                    color: AppColors.textLight,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
