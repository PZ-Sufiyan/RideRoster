import 'package:flutter/material.dart';

import '../../../../model/pa_profile_model.dart';
import 'edit_profile.dart';

enum PaDocCardStatus { missing, expired, valid }

class PaDocumentCardViewModel {
  final String title;
  final String? subtitle;
  final IconData icon;
  final PaProfileEditSection section;
  final PaDocCardStatus status;
  final String statusLabel;

  const PaDocumentCardViewModel({
    required this.title,
    this.subtitle,
    required this.icon,
    required this.section,
    required this.status,
    required this.statusLabel,
  });

  Color get accentColor {
    switch (status) {
      case PaDocCardStatus.missing:
        return const Color(0xFFF1C40F);
      case PaDocCardStatus.expired:
        return const Color(0xFFE74C3C);
      case PaDocCardStatus.valid:
        return const Color(0xFF2ECC71);
    }
  }

  Color get backgroundColor {
    switch (status) {
      case PaDocCardStatus.missing:
        return const Color(0xFFFFF9E6);
      case PaDocCardStatus.expired:
        return const Color(0xFFFDECEC);
      case PaDocCardStatus.valid:
        return const Color(0xFFE8F8EF);
    }
  }
}

class PaDocumentCatalog {
  static bool _hasText(String? value) => (value ?? '').trim().isNotEmpty;

  static bool _hasDoc(PaProfileModel profile, String type) =>
      profile.documentByType(type) != null;

  static bool _isExpired(DateTime? date) {
    if (date == null) return false;
    final now = DateTime.now();
    final expiry = DateTime(date.year, date.month, date.day);
    final today = DateTime(now.year, now.month, now.day);
    return expiry.isBefore(today);
  }

  static String _labelFor(PaDocCardStatus status) {
    switch (status) {
      case PaDocCardStatus.missing:
        return 'Missing';
      case PaDocCardStatus.expired:
        return 'Expired';
      case PaDocCardStatus.valid:
        return 'Valid';
    }
  }

  static String _fmt(DateTime date) {
    return PaDocumentModel.formatExpiryDate(date);
  }

  static List<PaDocumentCardViewModel> buildCards(PaProfileModel profile) {
    return [
      _passport(profile),
      _safeguarding(profile),
      _backgroundCheck(profile),
      _firstAid(profile),
    ];
  }

  static PaDocumentCardViewModel _passport(PaProfileModel profile) {
    final hasNumber = _hasText(profile.passportNumber);
    final hasDoc = _hasDoc(profile, 'passport');
    final complete = hasNumber && hasDoc;

    PaDocCardStatus status;
    String statusLabel;
    if (!hasNumber && !hasDoc) {
      status = PaDocCardStatus.missing;
      statusLabel = 'Missing';
    } else if (!complete) {
      status = PaDocCardStatus.missing;
      statusLabel = 'Incomplete';
    } else {
      status = PaDocCardStatus.valid;
      statusLabel = 'Valid';
    }

    final subtitle =
        hasNumber ? 'ID: ${profile.passportNumber}' : null;

    return PaDocumentCardViewModel(
      title: 'Passport',
      subtitle: subtitle,
      icon: Icons.badge_outlined,
      section: PaProfileEditSection.documentPassport,
      status: status,
      statusLabel: statusLabel,
    );
  }

  static PaDocumentCardViewModel _safeguarding(PaProfileModel profile) {
    final hasDoc = _hasDoc(profile, 'safeguarding_certificate');
    final expiry =
        profile.documentByType('safeguarding_certificate')?.expiryDate;
    final complete = hasDoc && expiry != null;

    final status = !complete
        ? PaDocCardStatus.missing
        : _isExpired(expiry)
            ? PaDocCardStatus.expired
            : PaDocCardStatus.valid;

    return PaDocumentCardViewModel(
      title: 'Safeguarding Certificate',
      subtitle: expiry != null ? 'Expires: ${_fmt(expiry)}' : null,
      icon: Icons.school_outlined,
      section: PaProfileEditSection.documentSafeguarding,
      status: status,
      statusLabel: _labelFor(status),
    );
  }

  static PaDocumentCardViewModel _docWithoutExpiry({
    required PaProfileModel profile,
    required String type,
    required String title,
    required IconData icon,
    required PaProfileEditSection section,
  }) {
    final hasDoc = _hasDoc(profile, type);
    final status =
        hasDoc ? PaDocCardStatus.valid : PaDocCardStatus.missing;

    return PaDocumentCardViewModel(
      title: title,
      icon: icon,
      section: section,
      status: status,
      statusLabel: _labelFor(status),
    );
  }

  static PaDocumentCardViewModel _backgroundCheck(PaProfileModel profile) {
    return _docWithoutExpiry(
      profile: profile,
      type: 'background_check',
      title: 'Background Check Certificate',
      icon: Icons.verified_user_outlined,
      section: PaProfileEditSection.documentBackgroundCheck,
    );
  }

  static PaDocumentCardViewModel _firstAid(PaProfileModel profile) {
    return _docWithoutExpiry(
      profile: profile,
      type: 'first_aid_certificate',
      title: 'First Aid Certification',
      icon: Icons.monitor_heart_outlined,
      section: PaProfileEditSection.documentFirstAid,
    );
  }
}
