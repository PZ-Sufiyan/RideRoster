import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import '../../../components/app_button.dart';
import '../../../providers/auth_provider.dart';
import '../../../routes/app_routes.dart';
import '../../../utils/app_colors.dart';
import '../../../utils/driver_register_validators.dart';
import '../../../utils/size_confg.dart';

enum _ForgotStep { request, reset, done }

class ForgotPasswordPage extends StatefulWidget {
  const ForgotPasswordPage({super.key});

  @override
  State<ForgotPasswordPage> createState() => _ForgotPasswordPageState();
}

class _ForgotPasswordPageState extends State<ForgotPasswordPage> {
  final _emailController = TextEditingController();
  final _codeController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmController = TextEditingController();

  _ForgotStep _step = _ForgotStep.request;
  bool _obscurePassword = true;
  bool _obscureConfirm = true;
  String? _localError;
  String? _infoMessage;
  String _email = '';

  @override
  void dispose() {
    _emailController.dispose();
    _codeController.dispose();
    _passwordController.dispose();
    _confirmController.dispose();
    super.dispose();
  }

  void _setLocalError(String? message) {
    setState(() => _localError = message);
  }

  Future<void> _sendCode({bool resend = false}) async {
    final auth = context.read<AuthProvider>();
    auth.clearError();
    _setLocalError(null);

    final email = (_step == _ForgotStep.request
            ? _emailController.text
            : _email)
        .trim()
        .toLowerCase();

    final emailError = DriverRegisterValidators.emailAddress(email);
    if (emailError != null) {
      _setLocalError(emailError);
      return;
    }

    final error = await auth.driverForgotPassword(email: email);
    if (!mounted) return;

    if (error != null) {
      _setLocalError(error);
      return;
    }

    setState(() {
      _email = email;
      _step = _ForgotStep.reset;
      _infoMessage = resend
          ? 'A new verification code has been sent to your email.'
          : 'A verification code has been sent to your email.';
      _localError = null;
    });
  }

  Future<void> _resetPassword() async {
    final auth = context.read<AuthProvider>();
    auth.clearError();
    _setLocalError(null);

    final error = await auth.resetPasswordWithCode(
      email: _email,
      code: _codeController.text,
      password: _passwordController.text,
      confirmPassword: _confirmController.text,
    );

    if (!mounted) return;
    if (error != null) {
      _setLocalError(error);
      return;
    }

    setState(() {
      _step = _ForgotStep.done;
      _localError = null;
      _infoMessage = null;
    });
  }

  void _backToLogin() {
    context.read<AuthProvider>().clearError();
    Navigator.pushReplacementNamed(context, AppRoutes.login);
  }

  String get _title {
    switch (_step) {
      case _ForgotStep.request:
        return 'Forgot Password';
      case _ForgotStep.reset:
        return 'Enter Code & New Password';
      case _ForgotStep.done:
        return 'Password Updated';
    }
  }

  String get _subtitle {
    switch (_step) {
      case _ForgotStep.request:
        return 'Enter your email and we will send you a verification code.';
      case _ForgotStep.reset:
        return 'Enter the code sent to $_email, then choose a new password.';
      case _ForgotStep.done:
        return 'Your password has been reset. You can sign in with your new password.';
    }
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
              SizedBox(height: SizeConfig.r(12)),
              IconButton(
                onPressed: _backToLogin,
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints(),
                icon: Icon(
                  Icons.arrow_back_ios_new,
                  size: SizeConfig.r(20),
                  color: AppColors.textDark,
                ),
              ),
              SizedBox(height: SizeConfig.r(20)),
              Text(
                _title,
                style: TextStyle(
                  fontSize: SizeConfig.sp(28),
                  fontWeight: FontWeight.bold,
                  color: AppColors.textDark,
                  height: 1.2,
                ),
              ),
              SizedBox(height: SizeConfig.r(8)),
              Text(
                _subtitle,
                style: TextStyle(
                  fontSize: SizeConfig.sp(14),
                  color: AppColors.textMedium,
                  height: 1.5,
                ),
              ),
              SizedBox(height: SizeConfig.r(28)),
              if (_localError != null) ...[
                _MessageBox(message: _localError!, isError: true),
                SizedBox(height: SizeConfig.r(12)),
              ],
              if (_infoMessage != null && _localError == null) ...[
                _MessageBox(message: _infoMessage!, isError: false),
                SizedBox(height: SizeConfig.r(12)),
              ],
              if (_step == _ForgotStep.request) _buildRequestStep(),
              if (_step == _ForgotStep.reset) _buildResetStep(),
              if (_step == _ForgotStep.done) _buildDoneStep(),
              SizedBox(height: SizeConfig.r(32)),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildRequestStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Email Address',
          style: TextStyle(
            fontSize: SizeConfig.sp(13),
            color: AppColors.textLight,
          ),
        ),
        SizedBox(height: SizeConfig.r(6)),
        _InputField(
          controller: _emailController,
          hintText: 'name@example.com',
          prefixIcon: Icons.mail_outline,
          keyboardType: TextInputType.emailAddress,
          onChanged: (_) {
            if (_localError != null) _setLocalError(null);
          },
        ),
        SizedBox(height: SizeConfig.r(28)),
        Consumer<AuthProvider>(
          builder: (_, auth, __) {
            return AppButton(
              label: 'Send Code',
              isLoading: auth.isLoading,
              onPressed: () => _sendCode(),
            );
          },
        ),
        SizedBox(height: SizeConfig.r(16)),
        Center(
          child: GestureDetector(
            onTap: _backToLogin,
            child: Text(
              'Back to Login',
              style: TextStyle(
                fontSize: SizeConfig.sp(14),
                color: AppColors.primary,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildResetStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Verification Code',
          style: TextStyle(
            fontSize: SizeConfig.sp(13),
            color: AppColors.textLight,
          ),
        ),
        SizedBox(height: SizeConfig.r(6)),
        _InputField(
          controller: _codeController,
          hintText: 'Enter 6-digit code',
          prefixIcon: Icons.vpn_key_outlined,
          keyboardType: TextInputType.number,
          inputFormatters: [FilteringTextInputFormatter.digitsOnly],
          onChanged: (_) {
            if (_localError != null) _setLocalError(null);
          },
        ),
        SizedBox(height: SizeConfig.r(20)),
        Text(
          'New Password',
          style: TextStyle(
            fontSize: SizeConfig.sp(13),
            color: AppColors.textLight,
          ),
        ),
        SizedBox(height: SizeConfig.r(6)),
        _InputField(
          controller: _passwordController,
          hintText: '••••••••',
          prefixIcon: Icons.lock_outline,
          obscureText: _obscurePassword,
          maxLength: 12,
          suffixIcon: GestureDetector(
            onTap: () => setState(() => _obscurePassword = !_obscurePassword),
            child: Icon(
              _obscurePassword
                  ? Icons.remove_red_eye_outlined
                  : Icons.visibility_off_outlined,
              color: AppColors.inputIcon,
              size: SizeConfig.r(20),
            ),
          ),
          onChanged: (_) {
            if (_localError != null) _setLocalError(null);
          },
        ),
        SizedBox(height: SizeConfig.r(8)),
        Text(
          DriverRegisterValidators.passwordRulesHint,
          style: TextStyle(
            fontSize: SizeConfig.sp(12),
            color: AppColors.textMedium,
            height: 1.4,
          ),
        ),
        SizedBox(height: SizeConfig.r(20)),
        Text(
          'Confirm Password',
          style: TextStyle(
            fontSize: SizeConfig.sp(13),
            color: AppColors.textLight,
          ),
        ),
        SizedBox(height: SizeConfig.r(6)),
        _InputField(
          controller: _confirmController,
          hintText: '••••••••',
          prefixIcon: Icons.lock_outline,
          obscureText: _obscureConfirm,
          maxLength: 12,
          suffixIcon: GestureDetector(
            onTap: () => setState(() => _obscureConfirm = !_obscureConfirm),
            child: Icon(
              _obscureConfirm
                  ? Icons.remove_red_eye_outlined
                  : Icons.visibility_off_outlined,
              color: AppColors.inputIcon,
              size: SizeConfig.r(20),
            ),
          ),
          onChanged: (_) {
            if (_localError != null) _setLocalError(null);
          },
        ),
        SizedBox(height: SizeConfig.r(28)),
        Consumer<AuthProvider>(
          builder: (_, auth, __) {
            return AppButton(
              label: 'Reset Password',
              isLoading: auth.isLoading,
              onPressed: _resetPassword,
            );
          },
        ),
        SizedBox(height: SizeConfig.r(16)),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Consumer<AuthProvider>(
              builder: (_, auth, __) {
                return GestureDetector(
                  onTap: auth.isLoading ? null : () => _sendCode(resend: true),
                  child: Text(
                    'Resend code',
                    style: TextStyle(
                      fontSize: SizeConfig.sp(14),
                      color: AppColors.primary,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                );
              },
            ),
            GestureDetector(
              onTap: _backToLogin,
              child: Text(
                'Back to Login',
                style: TextStyle(
                  fontSize: SizeConfig.sp(14),
                  color: AppColors.textMedium,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildDoneStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const _MessageBox(
          message: 'Password updated successfully.',
          isError: false,
        ),
        SizedBox(height: SizeConfig.r(28)),
        AppButton(
          label: 'Back to Login',
          onPressed: _backToLogin,
        ),
      ],
    );
  }
}

class _MessageBox extends StatelessWidget {
  const _MessageBox({required this.message, required this.isError});

  final String message;
  final bool isError;

  @override
  Widget build(BuildContext context) {
    final bg = isError ? const Color(0xFFFEF2F2) : const Color(0xFFECFDF5);
    final border = isError ? const Color(0xFFFECACA) : const Color(0xFFA7F3D0);
    final text = isError ? AppColors.error : AppColors.success;

    return Container(
      width: double.infinity,
      padding: EdgeInsets.symmetric(
        horizontal: SizeConfig.r(14),
        vertical: SizeConfig.r(12),
      ),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(SizeConfig.r(10)),
        border: Border.all(color: border),
      ),
      child: Text(
        message,
        style: TextStyle(
          fontSize: SizeConfig.sp(13),
          color: text,
          fontWeight: FontWeight.w500,
          height: 1.4,
        ),
      ),
    );
  }
}

class _InputField extends StatelessWidget {
  const _InputField({
    required this.controller,
    required this.hintText,
    required this.prefixIcon,
    this.obscureText = false,
    this.keyboardType,
    this.suffixIcon,
    this.maxLength,
    this.inputFormatters,
    this.onChanged,
  });

  final TextEditingController controller;
  final String hintText;
  final IconData prefixIcon;
  final bool obscureText;
  final TextInputType? keyboardType;
  final Widget? suffixIcon;
  final int? maxLength;
  final List<TextInputFormatter>? inputFormatters;
  final ValueChanged<String>? onChanged;

  @override
  Widget build(BuildContext context) {
    SizeConfig.init(context);
    return TextField(
      controller: controller,
      obscureText: obscureText,
      keyboardType: keyboardType,
      maxLength: maxLength,
      inputFormatters: inputFormatters,
      onChanged: onChanged,
      style: TextStyle(fontSize: SizeConfig.sp(15), color: AppColors.textDark),
      decoration: InputDecoration(
        hintText: hintText,
        counterText: '',
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
          borderSide: const BorderSide(color: AppColors.inputBorder, width: 1),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(SizeConfig.radius),
          borderSide: const BorderSide(color: AppColors.primary, width: 1.5),
        ),
      ),
    );
  }
}
