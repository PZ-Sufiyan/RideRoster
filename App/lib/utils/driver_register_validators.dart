import 'package:flutter/services.dart';

import '../model/driver_register_data.dart';
import '../model/passenger_assistant_register_data.dart';

/// Shared validation helpers for driver / PA self-registration.
class DriverRegisterValidators {
  DriverRegisterValidators._();

  static final RegExp _lettersOnly = RegExp(r'^[A-Za-z]+$');
  static final RegExp _email = RegExp(
    r'^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$',
  );
  static final RegExp _emergencyName = RegExp(r'^[A-Za-z]+(?: [A-Za-z]+)*$');
  static final RegExp _hasLower = RegExp(r'[a-z]');
  static final RegExp _hasUpper = RegExp(r'[A-Z]');
  static final RegExp _hasDigit = RegExp(r'[0-9]');
  static final RegExp _hasSpecial = RegExp(r'[^A-Za-z0-9]');

  static final TextInputFormatter lettersOnlyFormatter =
      FilteringTextInputFormatter.allow(RegExp(r'[A-Za-z]'));

  static final TextInputFormatter lettersAndSpacesFormatter =
      FilteringTextInputFormatter.allow(RegExp(r'[A-Za-z ]'));

  static String? personName(String? value, {required String label}) {
    final v = (value ?? '').trim();
    if (v.isEmpty) return '$label is required.';
    if (!_lettersOnly.hasMatch(v)) {
      return '$label may only contain letters (A–Z). No spaces or numbers.';
    }
    return null;
  }

  static String? emailAddress(String? value) {
    final v = (value ?? '').trim();
    if (v.isEmpty) return 'Email address is required.';
    if (!_email.hasMatch(v)) return 'Please enter a valid email address.';
    return null;
  }

  static const String passwordRulesHint =
      'Password must be 8–12 characters and include at least one uppercase letter, one lowercase letter, one number, and one symbol.';

  static String? passwordValue(String? value) {
    final v = value ?? '';
    if (v.isEmpty) return 'Password is required.';
    if (v.length < 8 || v.length > 12) {
      return 'Password must be between 8 and 12 characters.';
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
    final v = raw.trim().replaceAll(RegExp(r' +'), ' ');
    if (v.isEmpty) return 'Emergency contact name is required.';
    if (raw.contains(RegExp(r' {2,}'))) {
      return 'Use only a single space between words.';
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
    put('mobile', requiredText(mobileNumber, label: 'Mobile number'));
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
    put(
      'emergencyContactPhone',
      requiredText(emergencyContactPhone, label: 'Emergency contact phone'),
    );
    put('nationality', requiredText(nationality, label: 'Nationality'));
    return Step1ValidationResult(errors: errors);
  }

  /// PA step 1 — personal details (residential optional; emergency is step 4).
  static Step1ValidationResult validatePaStep1({
    required String firstName,
    required String lastName,
    required String email,
    required String mobileNumber,
    required String password,
    required String confirmPassword,
    required String companyName,
    required String companyId,
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
    put('mobile', requiredText(mobileNumber, label: 'Phone number'));
    put('password', passwordValue(password));
    put('confirmPassword', confirmPasswordValue(password, confirmPassword));
    put('company', requiredText(companyName, label: 'Company'));
    if (companyName.trim().isNotEmpty && companyId.trim().isEmpty) {
      errors['company'] = 'Please select a company from the list.';
    }
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

  /// PA documents — expiry required when related file is uploaded.
  static String? validatePaStep3Documents(PassengerAssistantRegisterData d) {
    if (d.passportCopy != null && d.passportExpiry == null) {
      return 'Passport expiry is required when a passport file is uploaded.';
    }
    if (d.safeguardingCertificate != null && d.safeguardingExpiry == null) {
      return 'Safeguarding expiry is required when a safeguarding file is uploaded.';
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
    final phoneErr = requiredText(
      emergencyContactPhone,
      label: 'Emergency contact phone',
    );
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
