import 'package:flutter/services.dart';
import 'package:phone_numbers_parser/phone_numbers_parser.dart';

import '../model/driver_register_data.dart';
import '../model/passenger_assistant_register_data.dart';

/// Shared validation helpers for driver / PA self-registration.
class DriverRegisterValidators {
  DriverRegisterValidators._();

  static const int personNameMaxLength = 20;
  static const int emailMaxLength = 254;
  static const int passwordMinLength = 8;
  static const int passwordMaxLength = 15;

  static final RegExp _lettersOnly = RegExp(r'^[A-Za-z]+$');
  static final RegExp _email = RegExp(
    r'^[A-Za-z0-9]+(?:[._%+\-][A-Za-z0-9]+)*@[A-Za-z0-9]+(?:[.\-][A-Za-z0-9]+)*\.[A-Za-z]{2,}$',
  );
  static final RegExp _emergencyName = RegExp(r'^[A-Za-z]+(?: [A-Za-z]+)*$');
  static final RegExp _hasLower = RegExp(r'[a-z]');
  static final RegExp _hasUpper = RegExp(r'[A-Z]');
  static final RegExp _hasDigit = RegExp(r'[0-9]');
  static final RegExp _hasSpecial = RegExp(r'[^A-Za-z0-9]');

  static final TextInputFormatter lettersOnlyFormatter =
      FilteringTextInputFormatter.allow(RegExp(r'[A-Za-z]'));

  static final List<TextInputFormatter> personNameFormatters = [
    PersonNameTextFormatter(maxLength: personNameMaxLength),
  ];

  static final TextInputFormatter lettersAndSpacesFormatter =
      FilteringTextInputFormatter.allow(RegExp(r'[A-Za-z ]'));

  static final List<TextInputFormatter> emergencyNameFormatters = [
    EmergencyNameTextFormatter(maxLength: personNameMaxLength),
  ];

  static final List<TextInputFormatter> emailFormatters = [
    FilteringTextInputFormatter.deny(RegExp(r'\s')),
    LengthLimitingTextInputFormatter(emailMaxLength),
    LowerCaseTextFormatter(),
  ];

  static String? personName(String? value, {required String label}) {
    final v = (value ?? '').trim();
    if (v.isEmpty) return '$label is required.';
    if (v.length > personNameMaxLength) {
      return '$label must be at most $personNameMaxLength characters.';
    }
    if (!_lettersOnly.hasMatch(v)) {
      return '$label may only contain letters (A–Z). No spaces or special characters.';
    }
    return null;
  }

  static String? emailAddress(String? value) {
    final raw = value ?? '';
    if (raw.contains(RegExp(r'\s'))) {
      return 'Email address cannot contain spaces.';
    }
    final v = raw.trim().toLowerCase();
    if (v.isEmpty) return 'Email address is required.';
    if (v.length > emailMaxLength) {
      return 'Email address is too long.';
    }
    if (v.split('@').length != 2) {
      return 'Please enter a valid email address.';
    }
    final local = v.split('@').first;
    if (local.isEmpty || local.length > 64) {
      return 'Please enter a valid email address.';
    }
    if (local.startsWith('.') || local.endsWith('.') || local.contains('..')) {
      return 'Please enter a valid email address.';
    }
    if (v.contains('..')) {
      return 'Please enter a valid email address.';
    }
    if (!_email.hasMatch(v)) return 'Please enter a valid email address.';
    return null;
  }

  static String? mobileNumberValue(String? international) {
    final v = (international ?? '').trim();
    if (v.isEmpty) return 'Mobile number is required.';
    try {
      final parsed = PhoneNumber.parse(v);
      if (parsed.nsn.isEmpty) return 'Mobile number is required.';
      if (!parsed.isValid(type: PhoneNumberType.mobile)) {
        return 'Enter a valid mobile number for the selected country.';
      }
    } catch (_) {
      return 'Enter a valid mobile number for the selected country.';
    }
    return null;
  }

  static const String passwordRulesHint =
      'Password must be 8–15 characters and include at least one uppercase letter, one lowercase letter, one number, and one symbol.';

  static String? passwordValue(String? value) {
    final v = value ?? '';
    if (v.isEmpty) return 'Password is required.';
    if (v.length < passwordMinLength || v.length > passwordMaxLength) {
      return 'Password must be between $passwordMinLength and $passwordMaxLength characters.';
    }
    if (!_hasLower.hasMatch(v)) {
      return 'Password must include at least one lowercase letter.';
    }
    if (!_hasUpper.hasMatch(v)) {
      return 'Password must include at least one uppercase letter.';
    }
    if (!_hasDigit.hasMatch(v)) {
      return 'Password must include at least one number.';
    }
    if (!_hasSpecial.hasMatch(v)) {
      return 'Password must include at least one symbol.';
    }
    return null;
  }

  static String? confirmPasswordValue(String? password, String? confirm) {
    if ((confirm ?? '').isEmpty) return 'Please confirm your password.';
    if (password != confirm) return 'Password and confirm password must match.';
    return null;
  }

  static String? emergencyNameValue(String? value) {
    final raw = value ?? '';
    if (raw.contains(RegExp(r' {2,}'))) {
      return 'Use only a single space between words.';
    }
    final v = raw.trim().replaceAll(RegExp(r' +'), ' ');
    if (v.isEmpty) return 'Emergency contact name is required.';
    if (v.length > personNameMaxLength) {
      return 'Emergency contact name must be at most $personNameMaxLength characters.';
    }
    if (!_emergencyName.hasMatch(v)) {
      return 'Emergency contact name may only contain letters and single spaces.';
    }
    return null;
  }

  static String? requiredText(String? value, {required String label}) {
    if ((value ?? '').trim().isEmpty) return '$label is required.';
    return null;
  }

  static Step1ValidationResult validateStep1({
    required String firstName,
    required String lastName,
    required String email,
    required String mobileNumber,
    required String password,
    required String confirmPassword,
    required String companyName,
    required String companyId,
    required String residentialAddress,
    required String emergencyContactName,
    required String emergencyContactPhone,
    required String nationality,
  }) {
    final errors = <String, String>{};
    void put(String key, String? err) {
      if (err != null) errors[key] = err;
    }

    put('firstName', personName(firstName, label: 'First name'));
    put('lastName', personName(lastName, label: 'Last name'));
    put('email', emailAddress(email));
    put('mobile', mobileNumberValue(mobileNumber));
    put('password', passwordValue(password));
    put('confirmPassword', confirmPasswordValue(password, confirmPassword));
    put('company', requiredText(companyName, label: 'Company name'));
    if (companyName.trim().isNotEmpty && companyId.trim().isEmpty) {
      errors['company'] = 'Please select a company from the list.';
    }
    put(
      'residentialAddress',
      requiredText(residentialAddress, label: 'Residential address'),
    );
    put('emergencyContactName', emergencyNameValue(emergencyContactName));
    put('emergencyContactPhone', mobileNumberValue(emergencyContactPhone));
    put('nationality', requiredText(nationality, label: 'Nationality'));
    return Step1ValidationResult(errors: errors);
  }

  /// PA step 1 — personal details (emergency is the last step).
  static Step1ValidationResult validatePaStep1({
    required String firstName,
    required String lastName,
    required String email,
    required String mobileNumber,
    required String password,
    required String confirmPassword,
    required String companyName,
    required String companyId,
    required String residentialAddress,
    required String nationality,
    required bool isBritishPassportHolder,
    required String rightToWorkCode,
  }) {
    final errors = <String, String>{};
    void put(String key, String? err) {
      if (err != null) errors[key] = err;
    }

    put('firstName', personName(firstName, label: 'First name'));
    put('lastName', personName(lastName, label: 'Last name'));
    put('email', emailAddress(email));
    put('mobile', mobileNumberValue(mobileNumber));
    put('password', passwordValue(password));
    put('confirmPassword', confirmPasswordValue(password, confirmPassword));
    put('company', requiredText(companyName, label: 'Company'));
    if (companyName.trim().isNotEmpty && companyId.trim().isEmpty) {
      errors['company'] = 'Please select a company from the list.';
    }
    put(
      'residentialAddress',
      requiredText(residentialAddress, label: 'Residential address'),
    );
    put('nationality', requiredText(nationality, label: 'Nationality'));
    if (!isBritishPassportHolder && rightToWorkCode.trim().isEmpty) {
      errors['rightToWork'] =
          'Right to work is required unless you are a British passport holder.';
    }
    return Step1ValidationResult(errors: errors);
  }

  static Step2ValidationResult validateStep2({
    required String registrationNumber,
    required String taxiPlateNumber,
    required String? make,
    required String model,
    required String vehicleColour,
    required DateTime? yearOfFirstRegistration,
    required String? licensingType,
    required String? category,
    required String? variant,
  }) {
    final errors = <String, String>{};
    void put(String key, String? err) {
      if (err != null) errors[key] = err;
    }

    put(
      'registrationNumber',
      requiredText(registrationNumber, label: 'Registration number'),
    );
    put(
      'taxiPlateNumber',
      requiredText(taxiPlateNumber, label: 'Taxi plate number'),
    );
    if (make == null || make.trim().isEmpty) {
      errors['make'] = 'Make is required.';
    }
    put('model', requiredText(model, label: 'Model'));
    put('vehicleColour', requiredText(vehicleColour, label: 'Vehicle colour'));
    if (yearOfFirstRegistration == null) {
      errors['year'] = 'Year of first registration is required.';
    }
    if (licensingType == null || licensingType.trim().isEmpty) {
      errors['licensing'] = 'License type is required.';
    }
    if (category == null || category.isEmpty) {
      errors['vehicleType'] = 'Please select a vehicle type.';
    } else if (variant == null || variant.isEmpty) {
      errors['vehicleType'] = 'Please select a vehicle type option.';
    }
    return Step2ValidationResult(errors: errors);
  }

  static String? validateStep3Documents(DriverRegisterData d) {
    if (d.licenseNumber.trim().isEmpty) {
      return 'License number is required.';
    }
    if (d.drivingLicenseFront == null) {
      return 'Driving license (front) is required.';
    }
    if (d.drivingLicenseBack == null) {
      return 'Driving license (back) is required.';
    }
    if (d.drivingLicenseExpiry == null) {
      return 'Driving license expiry date is required.';
    }
    if (d.taxiBadgeFront == null) return 'Taxi badge (front) is required.';
    if (d.taxiBadgeBack == null) return 'Taxi badge (back) is required.';
    if (d.taxiBadgeExpiry == null) {
      return 'Taxi badge expiry date is required.';
    }
    if (d.dbsCertFront == null) return 'DBS certificate (front) is required.';
    if (d.dbsCertBack == null) return 'DBS certificate (back) is required.';
    if (d.dbsCertExpiry == null) {
      return 'DBS certificate expiry date is required.';
    }
    if (d.dbsServiceUpdateId.trim().isEmpty) {
      return 'DBS Service Update ID is required.';
    }
    if (d.passportFile != null && d.passportExpiry == null) {
      return 'Passport expiry date is required when a passport file is uploaded.';
    }
    if (d.v5DocumentFront == null) return 'V5 document (front) is required.';
    if (d.v5DocumentInside == null) return 'V5 document (inside) is required.';
    if (d.motCertificate == null) return 'MOT certificate is required.';
    if (d.motCertificateExpiry == null) {
      return 'MOT certificate expiry date is required.';
    }
    if (d.taxiLicensePlate == null) {
      return 'Taxi license plate document is required.';
    }
    if (d.taxiLicensePlateExpiry == null) {
      return 'Taxi license plate expiry date is required.';
    }
    if (d.insuranceCertificate == null) {
      return 'Insurance certificate is required.';
    }
    if (d.insuranceCertificateExpiry == null) {
      return 'Insurance certificate expiry date is required.';
    }
    if (d.vehiclePhoto == null) return 'Vehicle photo is required.';
    return null;
  }

  /// PA documents — passport optional; other files required. Dates are entered manually.
  static String? validatePaStep3Documents(PassengerAssistantRegisterData d) {
    if (d.passportCopy != null && d.passportExpiry == null) {
      return 'Please enter the passport expiry date.';
    }
    if (d.safeguardingCertificate == null) {
      return 'Safeguarding certificate is required.';
    }
    if (d.safeguardingExpiry == null) {
      return 'Please enter the safeguarding certificate expiry date.';
    }
    if (d.backgroundCheckCertificate == null) {
      return 'Background check certificate is required.';
    }
    if (d.firstAidCertificate == null) {
      return 'First aid certificate is required.';
    }
    return null;
  }

  /// PA final step — emergency contact.
  static Step1ValidationResult validatePaStep4Emergency({
    required String emergencyContactName,
    required String emergencyContactPhone,
  }) {
    final errors = <String, String>{};
    final nameErr = emergencyNameValue(emergencyContactName);
    if (nameErr != null) errors['emergencyContactName'] = nameErr;
    final phoneErr = mobileNumberValue(emergencyContactPhone);
    if (phoneErr != null) errors['emergencyContactPhone'] = phoneErr;
    return Step1ValidationResult(errors: errors);
  }
}

class Step1ValidationResult {
  Step1ValidationResult({required this.errors});
  final Map<String, String> errors;
  bool get isValid => errors.isEmpty;
  String? get firstError => errors.isEmpty ? null : errors.values.first;
}

class Step2ValidationResult {
  Step2ValidationResult({required this.errors});
  final Map<String, String> errors;
  bool get isValid => errors.isEmpty;
  String? get firstError => errors.isEmpty ? null : errors.values.first;
}

/// First letter uppercase, remaining letters lowercase. Letters only.
class PersonNameTextFormatter extends TextInputFormatter {
  PersonNameTextFormatter({this.maxLength = 20});

  final int maxLength;

  @override
  TextEditingValue formatEditUpdate(
    TextEditingValue oldValue,
    TextEditingValue newValue,
  ) {
    var letters = newValue.text.replaceAll(RegExp(r'[^A-Za-z]'), '');
    if (letters.length > maxLength) {
      letters = letters.substring(0, maxLength);
    }
    if (letters.isEmpty) {
      return const TextEditingValue(
        text: '',
        selection: TextSelection.collapsed(offset: 0),
      );
    }
    final formatted =
        '${letters[0].toUpperCase()}${letters.substring(1).toLowerCase()}';
    return TextEditingValue(
      text: formatted,
      selection: TextSelection.collapsed(offset: formatted.length),
    );
  }
}

/// Letters and single spaces. Capitalizes the first letter of each word.
class EmergencyNameTextFormatter extends TextInputFormatter {
  EmergencyNameTextFormatter({this.maxLength = 20});

  final int maxLength;

  @override
  TextEditingValue formatEditUpdate(
    TextEditingValue oldValue,
    TextEditingValue newValue,
  ) {
    var text = newValue.text.replaceAll(RegExp(r'[^A-Za-z ]'), '');
    text = text.replaceFirst(RegExp(r'^ +'), '');
    text = text.replaceAll(RegExp(r' {2,}'), ' ');
    if (text.length > maxLength) {
      text = text.substring(0, maxLength);
    }
    final formatted = text
        .split(' ')
        .map((word) {
          if (word.isEmpty) return word;
          return '${word[0].toUpperCase()}${word.substring(1).toLowerCase()}';
        })
        .join(' ');
    return TextEditingValue(
      text: formatted,
      selection: TextSelection.collapsed(offset: formatted.length),
    );
  }
}

class LowerCaseTextFormatter extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(
    TextEditingValue oldValue,
    TextEditingValue newValue,
  ) {
    return newValue.copyWith(text: newValue.text.toLowerCase());
  }
}
