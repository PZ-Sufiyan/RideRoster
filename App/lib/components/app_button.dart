import 'package:flutter/material.dart';
import '../utils/app_colors.dart';
import '../utils/size_confg.dart';

/// A reusable primary button used throughout the app.
///
/// Supports full-width and fixed-width modes, optional leading/trailing
/// icons, loading state, and colour overrides.
class AppButton extends StatelessWidget {
  final String label;
  final VoidCallback? onPressed;
  final bool isLoading;
  final Color? backgroundColor;
  final Color? disabledBackgroundColor;
  final Color? textColor;
  final Color? borderColor;
  final Widget? leadingIcon;
  final Widget? trailingIcon;
  final double? width;
  final double? height;
  final double? fontSize;
  final FontWeight? fontWeight;
  final double? borderRadius;

  const AppButton({
    super.key,
    required this.label,
    this.onPressed,
    this.isLoading = false,
    this.backgroundColor,
    this.disabledBackgroundColor,
    this.textColor,
    this.borderColor,
    this.leadingIcon,
    this.trailingIcon,
    this.width,
    this.height,
    this.fontSize,
    this.fontWeight,
    this.borderRadius,
  });

  @override
  Widget build(BuildContext context) {
    final bg = backgroundColor ?? const Color(0xFF0284C7);
    final fg = textColor ?? Colors.white;
    final radius = borderRadius ?? SizeConfig.radius;

    return SizedBox(
      width: width ?? double.infinity,
      height: height ?? SizeConfig.buttonHeight,
      child: ElevatedButton(
        onPressed: isLoading ? null : onPressed,
        style: ElevatedButton.styleFrom(
          backgroundColor: bg,
          disabledBackgroundColor:
              disabledBackgroundColor ?? AppColors.buttonDisabled,
          elevation: 0,
          shadowColor: Colors.transparent,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(radius),
            side: borderColor != null
                ? BorderSide(color: borderColor!, width: 1.5)
                : BorderSide.none,
          ),
        ),
        child: isLoading
            ? SizedBox(
                width: SizeConfig.r(20),
                height: SizeConfig.r(20),
                child: CircularProgressIndicator(color: fg, strokeWidth: 2),
              )
            : FittedBox(
                fit: BoxFit.scaleDown,
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    if (leadingIcon != null) ...[
                      leadingIcon!,
                      SizedBox(width: SizeConfig.r(8)),
                    ],
                    Text(
                      label,
                      maxLines: 1,
                      softWrap: false,
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: fg,
                        fontSize: fontSize ?? SizeConfig.sp(15),
                        fontWeight: fontWeight ?? FontWeight.w600,
                        letterSpacing: 0.1,
                      ),
                    ),
                    if (trailingIcon != null) ...[
                      SizedBox(width: SizeConfig.r(8)),
                      trailingIcon!,
                    ],
                  ],
                ),
              ),
      ),
    );
  }
}
