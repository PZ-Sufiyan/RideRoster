import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../../components/app_button.dart';
import '../../../../providers/auth_provider.dart';
import '../../../../routes/app_routes.dart';
import '../../../../utils/app_colors.dart';
import '../../../../utils/size_confg.dart';

class DriverLoginPage extends StatefulWidget {
  const DriverLoginPage({super.key});

  @override
  State<DriverLoginPage> createState() => _DriverLoginPageState();
}

class _DriverLoginPageState extends State<DriverLoginPage> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _obscurePassword = true;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _onSignIn() async {
    final auth = context.read<AuthProvider>();
    auth.clearError();

    final success = await auth.driverLogin(
      email: _emailController.text.trim(),
      password: _passwordController.text,
    );

    if (!mounted) return;

    if (success) {
      Navigator.pushReplacementNamed(context, AppRoutes.driverDashboard);
    }
  }

  void _onForgotPassword() {
    // TODO: navigate to forgot password page
  }

  void _onSignUp() {
    Navigator.pushNamed(context, AppRoutes.driverRegister);
  }

  @override
  Widget build(BuildContext context) {
    SizeConfig.init(context);

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: EdgeInsets.symmetric(horizontal: SizeConfig.hPad),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              SizedBox(height: SizeConfig.sh(6)),

              // App icon
              Container(
                width: SizeConfig.r(60),
                height: SizeConfig.r(60),
                decoration: BoxDecoration(
                  color: AppColors.primary,
                  borderRadius: BorderRadius.circular(SizeConfig.r(14)),
                ),
                child: Icon(
                  Icons.directions_car,
                  color: Colors.white,
                  size: SizeConfig.r(32),
                ),
              ),

              SizedBox(height: SizeConfig.r(28)),

              // Title
              Text(
                'Welcome Back',
                style: TextStyle(
                  fontSize: SizeConfig.sp(28),
                  fontWeight: FontWeight.bold,
                  color: AppColors.textDark,
                  height: 1.2,
                ),
              ),

              SizedBox(height: SizeConfig.r(8)),

              // Subtitle
              Text(
                'Log in to your driver account to start\naccepting rides.',
                style: TextStyle(
                  fontSize: SizeConfig.sp(14),
                  color: AppColors.textMedium,
                  height: 1.5,
                ),
              ),

              SizedBox(height: SizeConfig.r(36)),

              // Email label
              Text(
                'Email Address',
                style: TextStyle(
                  fontSize: SizeConfig.sp(13),
                  color: AppColors.textLight,
                ),
              ),
              SizedBox(height: SizeConfig.r(6)),

              // Email field
              _InputField(
                controller: _emailController,
                hintText: 'name@example.com',
                prefixIcon: Icons.mail_outline,
                keyboardType: TextInputType.emailAddress,
              ),

              SizedBox(height: SizeConfig.r(20)),

              // Password label
              Text(
                'Password',
                style: TextStyle(
                  fontSize: SizeConfig.sp(13),
                  color: AppColors.textLight,
                ),
              ),
              SizedBox(height: SizeConfig.r(6)),

              // Password field
              _InputField(
                controller: _passwordController,
                hintText: '••••••••',
                prefixIcon: Icons.lock_outline,
                obscureText: _obscurePassword,
                suffixIcon: GestureDetector(
                  onTap: () =>
                      setState(() => _obscurePassword = !_obscurePassword),
                  child: Icon(
                    _obscurePassword
                        ? Icons.remove_red_eye_outlined
                        : Icons.visibility_off_outlined,
                    color: AppColors.inputIcon,
                    size: SizeConfig.r(20),
                  ),
                ),
              ),

              SizedBox(height: SizeConfig.r(12)),

              // Forgot password
              Align(
                alignment: Alignment.centerRight,
                child: GestureDetector(
                  onTap: _onForgotPassword,
                  child: Text(
                    'Forgot Password?',
                    style: TextStyle(
                      fontSize: SizeConfig.sp(14),
                      color: AppColors.primary,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
              ),

              SizedBox(height: SizeConfig.r(28)),

              // Error message
              Consumer<AuthProvider>(
                builder: (_, auth, __) {
                  if (auth.errorMessage == null) return const SizedBox.shrink();
                  return Padding(
                    padding: EdgeInsets.only(bottom: SizeConfig.r(12)),
                    child: Text(
                      auth.errorMessage!,
                      style: TextStyle(
                        fontSize: SizeConfig.sp(13),
                        color: AppColors.error,
                      ),
                    ),
                  );
                },
              ),

              // Sign In button
              Consumer<AuthProvider>(
                builder: (_, auth, __) {
                  return AppButton(
                    label: 'Sign In',
                    isLoading: auth.isLoading,
                    onPressed: _onSignIn,
                  );
                },
              ),

              SizedBox(height: SizeConfig.r(24)),

              // Sign Up row
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    "Don't have an account?",
                    style: TextStyle(
                      fontSize: SizeConfig.sp(14),
                      color: AppColors.textMedium,
                    ),
                  ),
                  SizedBox(width: SizeConfig.r(4)),
                  GestureDetector(
                    onTap: _onSignUp,
                    child: Text(
                      'Sign Up',
                      style: TextStyle(
                        fontSize: SizeConfig.sp(14),
                        color: AppColors.primary,
                        fontWeight: FontWeight.w600,
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

// ─────────────────────────────────────────────────────────────────────────────
// Input field
// ─────────────────────────────────────────────────────────────────────────────

class _InputField extends StatelessWidget {
  const _InputField({
    required this.controller,
    required this.hintText,
    required this.prefixIcon,
    this.obscureText = false,
    this.keyboardType,
    this.suffixIcon,
  });

  final TextEditingController controller;
  final String hintText;
  final IconData prefixIcon;
  final bool obscureText;
  final TextInputType? keyboardType;
  final Widget? suffixIcon;

  @override
  Widget build(BuildContext context) {
    SizeConfig.init(context);
    return TextField(
      controller: controller,
      obscureText: obscureText,
      keyboardType: keyboardType,
      style: TextStyle(
        fontSize: SizeConfig.sp(15),
        color: AppColors.textDark,
      ),
      decoration: InputDecoration(
        hintText: hintText,
        hintStyle: TextStyle(
          fontSize: SizeConfig.sp(15),
          color: AppColors.inputIcon,
        ),
        prefixIcon: Icon(
          prefixIcon,
          color: AppColors.inputIcon,
          size: SizeConfig.r(20),
        ),
        suffixIcon: suffixIcon,
        filled: false,
        contentPadding: EdgeInsets.symmetric(
          horizontal: SizeConfig.r(16),
          vertical: SizeConfig.r(14),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(SizeConfig.radius),
          borderSide:
              const BorderSide(color: AppColors.inputBorder, width: 1),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(SizeConfig.radius),
          borderSide:
              const BorderSide(color: AppColors.primary, width: 1.5),
        ),
      ),
    );
  }
}
