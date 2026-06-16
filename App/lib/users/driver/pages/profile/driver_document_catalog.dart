import 'package:flutter/material.dart';

import '../../../../model/driver_profile_model.dart';
import 'edit_profile.dart';

enum DriverDocCardStatus { missing, expired, valid }

class DriverDocumentCardViewModel {
  final String title;
  final String? subtitle;
  final IconData icon;
  final DriverProfileEditSection section;
  final DriverDocCardStatus status;
  final String statusLabel;
  final bool optional;

  const DriverDocumentCardViewModel({
    required this.title,
    this.subtitle,
    required this.icon,
    required this.section,
    required this.status,
    required this.statusLabel,
    this.optional = false,
  });

  Color get accentColor {
    switch (status) {
      case DriverDocCardStatus.missing:
        return const Color(0xFFF1C40F);
      case DriverDocCardStatus.expired:
        return const Color(0xFFE74C3C);
      case DriverDocCardStatus.valid:
        return const Color(0xFF2ECC71);
    }
  }

  Color get backgroundColor {
    switch (status) {
      case DriverDocCardStatus.missing:
        return const Color(0xFFFFF9E6);
      case DriverDocCardStatus.expired:
        return const Color(0xFFFDECEC);
      case DriverDocCardStatus.valid:
        return const Color(0xFFE8F8EF);
    }
  }
}

class DriverDocumentCatalog {
  static bool _hasText(String? value) => (value ?? '').trim().isNotEmpty;

  static bool _hasDoc(DriverProfileModel profile, String type) =>
      profile.driverDocumentByType(type) != null;

  static bool _hasVehicleDoc(DriverProfileModel profile, String type) =>
      profile.vehicleDocumentByType(type) != null;

  static bool _isExpired(DateTime? date) {
    if (date == null) return false;
    final now = DateTime.now();
    final expiry = DateTime(date.year, date.month, date.day);
    final today = DateTime(now.year, now.month, now.day);
    return expiry.isBefore(today);
  }

  static DateTime? _expiryFromDocs(
    DriverProfileModel profile, {
    required List<String> types,
  }) {
    for (final type in types) {
      final doc = profile.driverDocumentByType(type);
      if (doc?.expiryDate != null) return doc!.expiryDate;
    }
    return null;
  }

  static DateTime? _vehicleExpiry(DriverProfileModel profile, String type) =>
      profile.vehicleDocumentByType(type)?.expiryDate;

  static DriverDocCardStatus _statusFromChecks({
    required bool complete,
    required bool hasExpiry,
    DateTime? expiry,
    bool optionalEmpty = false,
  }) {
    if (optionalEmpty) return DriverDocCardStatus.missing;
    if (!complete) return DriverDocCardStatus.missing;
    if (hasExpiry && _isExpired(expiry)) return DriverDocCardStatus.expired;
    return DriverDocCardStatus.valid;
  }

  static String _labelFor(DriverDocCardStatus status, {bool optional = false}) {
    switch (status) {
      case DriverDocCardStatus.missing:
        return optional ? 'Not provided' : 'Missing';
      case DriverDocCardStatus.expired:
        return 'Expired';
      case DriverDocCardStatus.valid:
        return 'Valid';
    }
  }

  static List<DriverDocumentCardViewModel> buildCards(DriverProfileModel profile) {
    return [
      _passport(profile),
      _drivingLicense(profile),
      _taxiBadge(profile),
      _dbs(profile),
      _safeguarding(profile),
      _v5(profile),
      _mot(profile),
      _taxiLicensePlate(profile),
      _insurance(profile),
      _vehiclePhoto(profile),
    ];
  }

  static DriverDocumentCardViewModel _passport(DriverProfileModel profile) {
    final hasNumber = _hasText(profile.passportNumber);
    final hasDoc = _hasDoc(profile, 'passport');
    final expiry = profile.driverDocumentByType('passport')?.expiryDate;
    final empty = !hasNumber && !hasDoc;

    final status = empty
        ? DriverDocCardStatus.missing
        : _statusFromChecks(
            complete: hasDoc && hasNumber && expiry != null,
            hasExpiry: true,
            expiry: expiry,
            optionalEmpty: empty,
          );

    String? subtitle;
    if (hasNumber) subtitle = 'ID: ${profile.passportNumber}';
    if (expiry != null) {
      final expiryLine = 'Expires: ${_fmt(expiry)}';
      subtitle = subtitle == null ? expiryLine : '$subtitle · $expiryLine';
    }

    return DriverDocumentCardViewModel(
      title: 'Passport',
      subtitle: subtitle,
      icon: Icons.badge_outlined,
      section: DriverProfileEditSection.documentPassport,
      status: status == DriverDocCardStatus.missing && !empty
          ? DriverDocCardStatus.missing
          : status,
      statusLabel: empty
          ? 'Not provided'
          : (status == DriverDocCardStatus.missing ? 'Incomplete' : _labelFor(status)),
      optional: true,
    );
  }

  static DriverDocumentCardViewModel _drivingLicense(DriverProfileModel profile) {
    final hasFront = _hasDoc(profile, 'driving_license_front');
    final hasBack = _hasDoc(profile, 'driving_license_back');
    final hasNumber = _hasText(profile.licenseNo);
    final expiry = _expiryFromDocs(profile, types: const [
      'driving_license_front',
      'driving_license_back',
    ]);
    final complete = hasFront && hasBack && hasNumber && expiry != null;
    final status = _statusFromChecks(
      complete: complete,
      hasExpiry: true,
      expiry: expiry,
    );

    return DriverDocumentCardViewModel(
      title: 'Driving License',
      subtitle: hasNumber ? 'No. ${profile.licenseNo}' : null,
      icon: Icons.credit_card_outlined,
      section: DriverProfileEditSection.documentDrivingLicense,
      status: status,
      statusLabel: _labelFor(status),
    );
  }

  static DriverDocumentCardViewModel _taxiBadge(DriverProfileModel profile) {
    final hasFront = _hasDoc(profile, 'taxi_badge_front');
    final hasBack = _hasDoc(profile, 'taxi_badge_back');
    final expiry = _expiryFromDocs(profile, types: const [
      'taxi_badge_front',
      'taxi_badge_back',
    ]);
    final complete = hasFront && hasBack && expiry != null;
    final status = _statusFromChecks(
      complete: complete,
      hasExpiry: true,
      expiry: expiry,
    );

    return DriverDocumentCardViewModel(
      title: 'Taxi Badge',
      subtitle: expiry != null ? 'Expires: ${_fmt(expiry)}' : null,
      icon: Icons.local_taxi_outlined,
      section: DriverProfileEditSection.documentTaxiBadge,
      status: status,
      statusLabel: _labelFor(status),
    );
  }

  static DriverDocumentCardViewModel _dbs(DriverProfileModel profile) {
    final hasFront = _hasDoc(profile, 'dbs_certificate_front');
    final hasBack = _hasDoc(profile, 'dbs_certificate_back');
    final hasId = _hasText(profile.dbsServiceUpdateId);
    final expiry = _expiryFromDocs(profile, types: const [
      'dbs_certificate_front',
      'dbs_certificate_back',
    ]);
    final complete = hasFront && hasBack && hasId && expiry != null;
    final status = _statusFromChecks(
      complete: complete,
      hasExpiry: true,
      expiry: expiry,
    );

    return DriverDocumentCardViewModel(
      title: 'DBS Certificate',
      subtitle: hasId ? 'ID: ${profile.dbsServiceUpdateId}' : null,
      icon: Icons.verified_user_outlined,
      section: DriverProfileEditSection.documentDbs,
      status: status,
      statusLabel: _labelFor(status),
    );
  }

  static DriverDocumentCardViewModel _safeguarding(DriverProfileModel profile) {
    final hasDoc = _hasDoc(profile, 'safeguarding_certificate');
    final expiry =
        profile.driverDocumentByType('safeguarding_certificate')?.expiryDate;
    final complete = hasDoc && expiry != null;
    final status = _statusFromChecks(
      complete: complete,
      hasExpiry: true,
      expiry: expiry,
    );

    return DriverDocumentCardViewModel(
      title: 'Derby City Safeguarding Certificate',
      subtitle: expiry != null ? 'Expires: ${_fmt(expiry)}' : null,
      icon: Icons.school_outlined,
      section: DriverProfileEditSection.documentSafeguarding,
      status: status,
      statusLabel: _labelFor(status),
    );
  }

  static DriverDocumentCardViewModel _v5(DriverProfileModel profile) {
    if (profile.vehicle == null) {
      return const DriverDocumentCardViewModel(
        title: 'V5',
        subtitle: 'No vehicle assigned',
        icon: Icons.description_outlined,
        section: DriverProfileEditSection.documentV5,
        status: DriverDocCardStatus.missing,
        statusLabel: 'Missing',
      );
    }

    final hasFront = _hasVehicleDoc(profile, 'v5_front');
    final hasBack = _hasVehicleDoc(profile, 'v5_inside');
    final complete = hasFront && hasBack;
    final status =
        complete ? DriverDocCardStatus.valid : DriverDocCardStatus.missing;

    return DriverDocumentCardViewModel(
      title: 'V5',
      subtitle: 'Front & inside pages',
      icon: Icons.description_outlined,
      section: DriverProfileEditSection.documentV5,
      status: status,
      statusLabel: _labelFor(status),
    );
  }

  static DriverDocumentCardViewModel _mot(DriverProfileModel profile) {
    if (profile.vehicle == null) {
      return const DriverDocumentCardViewModel(
        title: 'MOT',
        subtitle: 'No vehicle assigned',
        icon: Icons.fact_check_outlined,
        section: DriverProfileEditSection.documentMot,
        status: DriverDocCardStatus.missing,
        statusLabel: 'Missing',
      );
    }

    final hasDoc = _hasVehicleDoc(profile, 'mot_certificate');
    final expiry = _vehicleExpiry(profile, 'mot_certificate');
    final complete = hasDoc && expiry != null;
    final status = _statusFromChecks(
      complete: complete,
      hasExpiry: true,
      expiry: expiry,
    );

    return DriverDocumentCardViewModel(
      title: 'MOT',
      subtitle: expiry != null ? 'Expires: ${_fmt(expiry)}' : null,
      icon: Icons.fact_check_outlined,
      section: DriverProfileEditSection.documentMot,
      status: status,
      statusLabel: _labelFor(status),
    );
  }

  static DriverDocumentCardViewModel _taxiLicensePlate(
    DriverProfileModel profile,
  ) {
    if (profile.vehicle == null) {
      return const DriverDocumentCardViewModel(
        title: 'Taxi License Plate',
        subtitle: 'No vehicle assigned',
        icon: Icons.pin_outlined,
        section: DriverProfileEditSection.documentTaxiLicensePlate,
        status: DriverDocCardStatus.missing,
        statusLabel: 'Missing',
      );
    }

    final hasDoc = _hasVehicleDoc(profile, 'taxi_license_plate');
    final hasPlate = _hasText(profile.vehicle?.taxiLicensePlateNumber);
    final expiry = _vehicleExpiry(profile, 'taxi_license_plate');
    final complete = hasDoc && hasPlate && expiry != null;
    final status = _statusFromChecks(
      complete: complete,
      hasExpiry: true,
      expiry: expiry,
    );

    return DriverDocumentCardViewModel(
      title: 'Taxi License Plate',
      subtitle: hasPlate ? 'Plate: ${profile.vehicle!.taxiLicensePlateNumber}' : null,
      icon: Icons.pin_outlined,
      section: DriverProfileEditSection.documentTaxiLicensePlate,
      status: status,
      statusLabel: _labelFor(status),
    );
  }

  static DriverDocumentCardViewModel _insurance(DriverProfileModel profile) {
    if (profile.vehicle == null) {
      return const DriverDocumentCardViewModel(
        title: 'Insurance',
        subtitle: 'No vehicle assigned',
        icon: Icons.shield_outlined,
        section: DriverProfileEditSection.documentInsurance,
        status: DriverDocCardStatus.missing,
        statusLabel: 'Missing',
      );
    }

    final hasDoc = _hasVehicleDoc(profile, 'insurance_certificate');
    final expiry = _vehicleExpiry(profile, 'insurance_certificate');
    final complete = hasDoc && expiry != null;
    final status = _statusFromChecks(
      complete: complete,
      hasExpiry: true,
      expiry: expiry,
    );

    return DriverDocumentCardViewModel(
      title: 'Insurance',
      subtitle: expiry != null ? 'Expires: ${_fmt(expiry)}' : null,
      icon: Icons.shield_outlined,
      section: DriverProfileEditSection.documentInsurance,
      status: status,
      statusLabel: _labelFor(status),
    );
  }

  static DriverDocumentCardViewModel _vehiclePhoto(DriverProfileModel profile) {
    if (profile.vehicle == null) {
      return const DriverDocumentCardViewModel(
        title: 'Vehicle Photo',
        subtitle: 'No vehicle assigned',
        icon: Icons.directions_car_outlined,
        section: DriverProfileEditSection.documentVehiclePhoto,
        status: DriverDocCardStatus.missing,
        statusLabel: 'Missing',
      );
    }

    final hasPhoto = _hasText(profile.vehicle?.vehiclePhotoUrl) ||
        _hasVehicleDoc(profile, 'vehicle_photo');
    final status =
        hasPhoto ? DriverDocCardStatus.valid : DriverDocCardStatus.missing;

    return DriverDocumentCardViewModel(
      title: 'Vehicle Photo',
      icon: Icons.directions_car_outlined,
      section: DriverProfileEditSection.documentVehiclePhoto,
      status: status,
      statusLabel: _labelFor(status),
    );
  }

  static String _fmt(DateTime date) {
    const months = [
      '',
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    return '${date.day} ${months[date.month]} ${date.year}';
  }
}
