import 'package:flutter/material.dart';
import '../../../routes/app_routes.dart';
import '../../../utils/app_colors.dart';
import '../../../utils/size_confg.dart';

class ChooseAccountTypePage extends StatelessWidget {
  const ChooseAccountTypePage({super.key});

  static const Color _pageBg = Color(0xFFF4F6F8);
  static const Color _cardIconBlue = Color(0xFF007BFF);
  static const Color _iconBgBlue = Color(0xFFEBF4FF);
  static const Color _logoGreen = Color(0xFF1F8A5C);
  static const Color _logoTextTeal = Color(0xFF1A4D5C);
  static const Color _liveGreen = Color(0xFF22C55E);

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
              SizedBox(height: SizeConfig.sh(5)),
              _LogoBlock(logoGreen: _logoGreen, logoTextTeal: _logoTextTeal),
              SizedBox(height: SizeConfig.r(36)),
              Text(
                'GET STARTED',
                style: TextStyle(
                  fontSize: SizeConfig.sp(11),
                  fontWeight: FontWeight.w600,
                  color: AppColors.textLight,
                  letterSpacing: 1.5,
                ),
              ),
              SizedBox(height: SizeConfig.r(8)),
              Text(
                'Choose Account Type',
                style: TextStyle(
                  fontSize: SizeConfig.sp(22),
                  fontWeight: FontWeight.bold,
                  color: AppColors.textDark,
                ),
              ),
              SizedBox(height: SizeConfig.r(28)),
              // Scroll views give unbounded vertical space; stretch + height:
              // infinity here caused layout thrash / ANR. Bound the row height.
              SizedBox(
                height: SizeConfig.sh(34).clamp(240.0, 360.0),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Expanded(
                      child: _TypeCard(
                        icon: Icons.drive_eta_outlined,
                        title: 'Driver',
                        iconColor: _cardIconBlue,
                        iconBg: _iconBgBlue,
                        liveColor: _liveGreen,
                        onTap: () => Navigator.pushNamed(
                          context,
                          AppRoutes.driverRegister,
                        ),
                      ),
                    ),
                    SizedBox(width: SizeConfig.r(14)),
                    Expanded(
                      child: _TypeCard(
                        icon: Icons.person_pin_outlined,
                        title: 'Passenger Assistant',
                        iconColor: _cardIconBlue,
                        iconBg: _iconBgBlue,
                        liveColor: _liveGreen,
                        onTap: () => Navigator.pushNamed(
                          context,
                          AppRoutes.passengerAssistantRegister,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              SizedBox(height: SizeConfig.r(32)),
              RichText(
                textAlign: TextAlign.center,
                text: TextSpan(
                  style: TextStyle(
                    fontSize: SizeConfig.sp(13),
                    color: AppColors.textMedium,
                  ),
                  children: [
                    const TextSpan(text: 'Already have an account? '),
                    WidgetSpan(
                      alignment: PlaceholderAlignment.middle,
                      child: GestureDetector(
                        onTap: () =>
                            Navigator.pushNamed(context, AppRoutes.login),
                        child: Text(
                          'Login',
                          style: TextStyle(
                            fontSize: SizeConfig.sp(13),
                            color: const Color(0xFF007BFF),
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              SizedBox(height: SizeConfig.r(6)),
              RichText(
                textAlign: TextAlign.center,
                text: TextSpan(
                  style: TextStyle(
                    fontSize: SizeConfig.sp(11),
                    color: AppColors.textLight,
                  ),
                  children: const [
                    TextSpan(text: 'By continuing you agree to our '),
                    TextSpan(
                      text: 'Terms of Service',
                      style: TextStyle(
                        color: Color(0xFF007BFF),
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
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
  const _LogoBlock({required this.logoGreen, required this.logoTextTeal});

  final Color logoGreen;
  final Color logoTextTeal;

  @override
  Widget build(BuildContext context) {
    SizeConfig.init(context);
    final circle = SizeConfig.r(52);

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
                color: logoGreen.withValues(alpha: 0.30),
                blurRadius: SizeConfig.r(14),
                offset: Offset(0, SizeConfig.r(5)),
              ),
            ],
          ),
          child: Center(
            child: Text(
              'NST',
              style: TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w800,
                fontSize: SizeConfig.sp(16),
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
                  fontSize: SizeConfig.sp(9.5),
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
    required this.iconColor,
    required this.iconBg,
    required this.liveColor,
    required this.onTap,
  });

  final IconData icon;
  final String title;
  final Color iconColor;
  final Color iconBg;
  final Color liveColor;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    SizeConfig.init(context);
    final radius = SizeConfig.r(20);

    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(radius),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(radius),
        child: Container(
          height: double.infinity,
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(radius),
            border: Border.all(color: const Color(0xFFE8EBF0), width: 1.5),
          ),
          padding: EdgeInsets.fromLTRB(
            SizeConfig.r(16),
            SizeConfig.r(16),
            SizeConfig.r(16),
            SizeConfig.r(16),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.max,
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Container(
                width: SizeConfig.r(56),
                height: SizeConfig.r(56),
                decoration: BoxDecoration(
                  color: iconBg,
                  borderRadius: BorderRadius.circular(SizeConfig.r(16)),
                ),
                child: Icon(icon, size: SizeConfig.r(28), color: iconColor),
              ),
              SizedBox(height: SizeConfig.r(12)),
              Text(
                title,
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: SizeConfig.sp(16),
                  fontWeight: FontWeight.bold,
                  color: AppColors.textDark,
                ),
              ),
              SizedBox(height: SizeConfig.r(12)),
            ],
          ),
        ),
      ),
    );
  }
}
