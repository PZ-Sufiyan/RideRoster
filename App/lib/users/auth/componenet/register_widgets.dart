import 'package:flutter/material.dart';
import '../../../../components/app_button.dart';
import '../../../../utils/app_colors.dart';
import '../../../../utils/size_confg.dart';

/// Shared widgets used across all 3 registration step components.

// ─────────────────────────────────────────────────────────────────────────────
// Field label
// ─────────────────────────────────────────────────────────────────────────────

class RegFieldLabel extends StatelessWidget {
  const RegFieldLabel(this.label, {super.key});
  final String label;

  @override
  Widget build(BuildContext context) {
    SizeConfig.init(context);
    return Text(
      label,
      style: TextStyle(
        fontSize: SizeConfig.sp(14),
        fontWeight: FontWeight.w500,
        color: AppColors.textMedium,
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Text input field
// ─────────────────────────────────────────────────────────────────────────────

class RegField extends StatelessWidget {
  const RegField({
    super.key,
    required this.controller,
    required this.hintText,
    this.obscureText = false,
    this.keyboardType,
    this.prefixIcon,
    this.suffixIcon,
  });

  final TextEditingController controller;
  final String hintText;
  final bool obscureText;
  final TextInputType? keyboardType;
  final Widget? prefixIcon;
  final Widget? suffixIcon;

  @override
  Widget build(BuildContext context) {
    SizeConfig.init(context);
    return TextField(
      controller: controller,
      obscureText: obscureText,
      keyboardType: keyboardType,
      style: TextStyle(fontSize: SizeConfig.sp(15), color: AppColors.textDark),
      decoration: InputDecoration(
        hintText: hintText,
        hintStyle: TextStyle(
          fontSize: SizeConfig.sp(15),
          color: const Color(0xFFB0BEC5),
        ),
        prefixIcon: prefixIcon,
        suffixIcon: suffixIcon != null
            ? Padding(
                padding: EdgeInsets.only(right: SizeConfig.r(12)),
                child: suffixIcon,
              )
            : null,
        suffixIconConstraints: const BoxConstraints(),
        filled: true,
        fillColor: const Color(0xFFF3F7FC),
        contentPadding: EdgeInsets.symmetric(
          horizontal: SizeConfig.r(16),
          vertical: SizeConfig.r(16),
        ),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(SizeConfig.radius),
          borderSide: const BorderSide(color: Color(0xFFE0E8F3), width: 1),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(SizeConfig.radius),
          borderSide: const BorderSide(color: Color(0xFFE0E8F3), width: 1),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(SizeConfig.radius),
          borderSide: const BorderSide(color: AppColors.primary, width: 1.5),
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Next Step / Register button
// ─────────────────────────────────────────────────────────────────────────────

class NextStepButton extends StatelessWidget {
  const NextStepButton({
    super.key,
    required this.onTap,
    this.label = 'Next Step',
    this.isLoading = false,
  });

  final VoidCallback? onTap;
  final String label;
  final bool isLoading;

  @override
  Widget build(BuildContext context) {
    SizeConfig.init(context);
    return AppButton(
      label: label,
      isLoading: isLoading,
      onPressed: onTap,
      borderRadius: SizeConfig.radiusLG,
      trailingIcon: Icon(
        Icons.arrow_forward,
        color: Colors.white,
        size: SizeConfig.r(20),
      ),
    );
  }
}
