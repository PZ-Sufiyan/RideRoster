import 'package:flutter/material.dart';
import 'package:phone_form_field/phone_form_field.dart';

/// Signup phone helpers on top of phone_form_field 10.0.17 /
/// phone_numbers_parser 9.0.22.
class RegisterPhone {
  RegisterPhone._();

  static const PhoneNumber defaultGb = PhoneNumber(
    isoCode: IsoCode.GB,
    nsn: '',
  );

  static PhoneNumber fromSaved({
    required String countryCode,
    required String mobileNumber,
  }) {
    final n = mobileNumber.trim();
    if (n.startsWith('+')) {
      try {
        return PhoneNumber.parse(n);
      } catch (_) {}
    }
    final dial = countryCode.trim();
    if (n.isNotEmpty) {
      try {
        final raw = dial.startsWith('+') ? '$dial$n' : '+$dial$n';
        return PhoneNumber.parse(raw);
      } catch (_) {}
    }
    if (dial.isNotEmpty) {
      try {
        final raw = dial.startsWith('+') ? dial : '+$dial';
        final parsed = PhoneNumber.parse(raw);
        return PhoneNumber(isoCode: parsed.isoCode, nsn: '');
      } catch (_) {}
    }
    return defaultGb;
  }

  static String? validateMobile(BuildContext context, PhoneNumber? phone) {
    return PhoneValidator.compose([
      PhoneValidator.required(
        context,
        errorText: 'Mobile number is required.',
      ),
      PhoneValidator.validMobile(
        context,
        errorText: 'Enter a valid mobile number for the selected country.',
      ),
    ])(phone);
  }

  /// Persist E.164 (`PhoneNumber.international`). Falls back to dial+national.
  static String toStorageValue({
    required String countryCode,
    required String mobileNumber,
  }) {
    final n = mobileNumber.trim().replaceAll(RegExp(r'\s+'), '');
    if (n.startsWith('+')) return n;
    if (n.isEmpty) return n;
    final dial = countryCode.trim();
    if (dial.isEmpty) return n;
    final prefix = dial.startsWith('+') ? dial : '+$dial';
    return '$prefix$n';
  }
}
