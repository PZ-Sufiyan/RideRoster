import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:phone_form_field/phone_form_field.dart';
import '../../../../components/app_button.dart';
import '../../../../utils/app_colors.dart';
import '../../../../utils/expiry_date_picker.dart';
import '../../../../utils/register_phone.dart';
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
    this.errorText,
    this.inputFormatters,
    this.onChanged,
    this.textCapitalization = TextCapitalization.none,
    this.maxLength,
  });

  final TextEditingController controller;
  final String hintText;
  final bool obscureText;
  final TextInputType? keyboardType;
  final Widget? prefixIcon;
  final Widget? suffixIcon;
  final String? errorText;
  final List<TextInputFormatter>? inputFormatters;
  final ValueChanged<String>? onChanged;
  final TextCapitalization textCapitalization;
  final int? maxLength;

  @override
  Widget build(BuildContext context) {
    SizeConfig.init(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        TextField(
          controller: controller,
          obscureText: obscureText,
          keyboardType: keyboardType,
          inputFormatters: inputFormatters,
          onChanged: onChanged,
          textCapitalization: textCapitalization,
          maxLength: maxLength,
          style: TextStyle(fontSize: SizeConfig.sp(15), color: AppColors.textDark),
          decoration: InputDecoration(
            hintText: hintText,
            counterText: maxLength == null ? null : '',
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
              borderSide: BorderSide(
                color: errorText != null
                    ? AppColors.error
                    : const Color(0xFFE0E8F3),
                width: 1,
              ),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(SizeConfig.radius),
              borderSide: BorderSide(
                color: errorText != null
                    ? AppColors.error
                    : const Color(0xFFE0E8F3),
                width: 1,
              ),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(SizeConfig.radius),
              borderSide: BorderSide(
                color: errorText != null ? AppColors.error : AppColors.primary,
                width: 1.5,
              ),
            ),
          ),
        ),
        if (errorText != null) ...[
          SizedBox(height: SizeConfig.r(6)),
          Text(
            errorText!,
            style: TextStyle(
              fontSize: SizeConfig.sp(12),
              color: AppColors.error,
            ),
          ),
        ],
      ],
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Mobile number (country picker + national number, E.164 on submit)
// ─────────────────────────────────────────────────────────────────────────────

class RegMobileField extends StatelessWidget {
  const RegMobileField({
    super.key,
    required this.controller,
    this.errorText,
    this.onChanged,
    this.hintText = '7123 456789',
  });

  final PhoneController controller;
  final String? errorText;
  final ValueChanged<PhoneNumber>? onChanged;
  final String hintText;

  @override
  Widget build(BuildContext context) {
    SizeConfig.init(context);
    final hasError = errorText != null;

    return PhoneFormField(
      controller: controller,
      validator: (phone) => RegisterPhone.validateMobile(context, phone),
      autovalidateMode: AutovalidateMode.disabled,
      countrySelectorNavigator: const CountrySelectorNavigator.modalBottomSheet(
        favorites: [IsoCode.GB],
      ),
      isCountrySelectionEnabled: true,
      isCountryButtonPersistent: true,
      countryButtonStyle: CountryButtonStyle(
        showDialCode: true,
        showFlag: true,
        showIsoCode: false,
        flagSize: SizeConfig.r(18),
        textStyle: TextStyle(
          fontSize: SizeConfig.sp(15),
          color: AppColors.textMedium,
        ),
      ),
      style: TextStyle(fontSize: SizeConfig.sp(15), color: AppColors.textDark),
      onChanged: onChanged,
      decoration: InputDecoration(
        hintText: hintText,
        hintStyle: TextStyle(
          fontSize: SizeConfig.sp(15),
          color: const Color(0xFFB0BEC5),
        ),
        errorText: errorText,
        errorStyle: TextStyle(
          fontSize: SizeConfig.sp(12),
          color: AppColors.error,
        ),
        filled: true,
        fillColor: const Color(0xFFF3F7FC),
        contentPadding: EdgeInsets.symmetric(
          horizontal: SizeConfig.r(16),
          vertical: SizeConfig.r(16),
        ),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(SizeConfig.radius),
          borderSide: BorderSide(
            color: hasError ? AppColors.error : const Color(0xFFE0E8F3),
            width: 1,
          ),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(SizeConfig.radius),
          borderSide: BorderSide(
            color: hasError ? AppColors.error : const Color(0xFFE0E8F3),
            width: 1,
          ),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(SizeConfig.radius),
          borderSide: BorderSide(
            color: hasError ? AppColors.error : AppColors.primary,
            width: 1.5,
          ),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(SizeConfig.radius),
          borderSide: const BorderSide(color: AppColors.error, width: 1),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(SizeConfig.radius),
          borderSide: const BorderSide(color: AppColors.error, width: 1.5),
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

// ─────────────────────────────────────────────────────────────────────────────
// Upload box (picks a PDF / image and shows a small status badge)
// ─────────────────────────────────────────────────────────────────────────────

class UploadBox extends StatelessWidget {
  const UploadBox({
    super.key,
    required this.file,
    required this.onTap,
    this.subLabel,
  });

  final PlatformFile? file;
  final VoidCallback onTap;
  final String? subLabel;

  @override
  Widget build(BuildContext context) {
    SizeConfig.init(context);
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: double.infinity,
        padding: EdgeInsets.symmetric(
          vertical: SizeConfig.r(22),
          horizontal: SizeConfig.r(16),
        ),
        decoration: BoxDecoration(
          color: const Color(0xFFF8FAFD),
          borderRadius: BorderRadius.circular(SizeConfig.radius),
          border: Border.all(color: const Color(0xFFD4DEF0), width: 1),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              file != null
                  ? Icons.check_circle_outline
                  : Icons.cloud_upload_outlined,
              color: file != null ? AppColors.success : const Color(0xFFB0BEC5),
              size: SizeConfig.r(30),
            ),
            SizedBox(height: SizeConfig.r(8)),
            Text(
              file != null
                  ? file!.name
                  : (subLabel ?? 'Tap to upload PDF or image'),
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: SizeConfig.sp(13),
                color: file != null
                    ? AppColors.textMedium
                    : const Color(0xFFB0BEC5),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class RegDocumentCard extends StatelessWidget {
  const RegDocumentCard({
    super.key,
    required this.title,
    required this.file,
    required this.onUpload,
    this.optional = false,
    this.expiry,
    this.onExpiryPicked,
    this.formatDate,
    this.errorText,
  });

  final String title;
  final PlatformFile? file;
  final VoidCallback onUpload;
  final bool optional;
  final DateTime? expiry;
  final ValueChanged<DateTime>? onExpiryPicked;
  final String Function(DateTime)? formatDate;
  final String? errorText;

  @override
  Widget build(BuildContext context) {
    SizeConfig.init(context);
    final hasError = errorText != null;

    return Container(
      width: double.infinity,
      padding: EdgeInsets.all(SizeConfig.r(14)),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(SizeConfig.radius),
        border: Border.all(
          color: hasError ? AppColors.error : const Color(0xFFD4DEF0),
          width: 1,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  title,
                  style: TextStyle(
                    fontSize: SizeConfig.sp(15),
                    fontWeight: FontWeight.w600,
                    color: AppColors.textDark,
                  ),
                ),
              ),
              Container(
                padding: EdgeInsets.symmetric(
                  horizontal: SizeConfig.r(8),
                  vertical: SizeConfig.r(4),
                ),
                decoration: BoxDecoration(
                  color: optional
                      ? const Color(0xFFF3F7FC)
                      : AppColors.primary.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(SizeConfig.r(6)),
                ),
                child: Text(
                  optional ? 'Optional' : 'Required',
                  style: TextStyle(
                    fontSize: SizeConfig.sp(11),
                    fontWeight: FontWeight.w600,
                    color: optional ? AppColors.textMedium : AppColors.primary,
                  ),
                ),
              ),
            ],
          ),
          SizedBox(height: SizeConfig.r(10)),
          UploadBox(
            file: file,
            onTap: onUpload,
            subLabel: 'Tap to upload',
          ),
          if (onExpiryPicked != null && formatDate != null) ...[
            SizedBox(height: SizeConfig.r(10)),
            Text(
              'Expiry date',
              style: TextStyle(
                fontSize: SizeConfig.sp(12),
                color: AppColors.textMedium,
              ),
            ),
            SizedBox(height: SizeConfig.r(6)),
            ExpiryButton(
              date: expiry,
              onDatePicked: onExpiryPicked!,
              formatDate: formatDate!,
            ),
          ],
          if (errorText != null) ...[
            SizedBox(height: SizeConfig.r(8)),
            Text(
              errorText!,
              style: TextStyle(
                fontSize: SizeConfig.sp(12),
                color: AppColors.error,
              ),
            ),
          ],
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Expiry date chip
// ─────────────────────────────────────────────────────────────────────────────

class ExpiryButton extends StatelessWidget {
  const ExpiryButton({
    super.key,
    required this.date,
    required this.onDatePicked,
    required this.formatDate,
    this.yearsAhead = 20,
  });

  final DateTime? date;
  final ValueChanged<DateTime> onDatePicked;
  final String Function(DateTime) formatDate;
  final int yearsAhead;

  Future<void> _openPicker(BuildContext context) async {
    final picked = await pickExpiryDate(
      context,
      initial: date,
      yearsAhead: yearsAhead,
    );
    if (picked != null) onDatePicked(picked);
  }

  @override
  Widget build(BuildContext context) {
    SizeConfig.init(context);
    return GestureDetector(
      onTap: () => _openPicker(context),
      child: Container(
        padding: EdgeInsets.symmetric(
          horizontal: SizeConfig.r(14),
          vertical: SizeConfig.r(10),
        ),
        decoration: BoxDecoration(
          color: const Color(0xFFF3F7FC),
          borderRadius: BorderRadius.circular(SizeConfig.r(8)),
          border: Border.all(color: const Color(0xFFD4DEF0), width: 1),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.calendar_today_outlined,
              size: SizeConfig.r(16),
              color: AppColors.textMedium,
            ),
            SizedBox(width: SizeConfig.r(8)),
            Text(
              date != null ? formatDate(date!) : 'Expiry Date',
              style: TextStyle(
                fontSize: SizeConfig.sp(14),
                color: date != null ? AppColors.textDark : AppColors.textMedium,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Manual-entry info hint shown beside expiry pickers
// ─────────────────────────────────────────────────────────────────────────────

class ManualEntryHint extends StatelessWidget {
  const ManualEntryHint({
    super.key,
    this.text = 'Enter expiry manually; it is not read from the file.',
  });

  final String text;

  @override
  Widget build(BuildContext context) {
    SizeConfig.init(context);
    return Row(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Icon(
          Icons.info_outline,
          size: SizeConfig.r(14),
          color: AppColors.textLight,
        ),
        SizedBox(width: SizeConfig.r(6)),
        Expanded(
          child: Text(
            text,
            style: TextStyle(
              fontSize: SizeConfig.sp(11),
              color: AppColors.textLight,
            ),
          ),
        ),
      ],
    );
  }
}
