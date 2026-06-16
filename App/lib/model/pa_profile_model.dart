/// Profile and document models for the Passenger Assistant.
class PaProfileModel {
  final String id;
  final String companyId;
  final String firstName;
  final String surname;
  final String email;
  final String phone;
  final String? residentialAddress;
  final String? profilePictureUrl;
  final String? emergencyContactName;
  final String? emergencyContactPhone;
  final String? nationality;
  final String? rightToWorkCode;
  final String? passportNumber;
  final String? status;
  final List<PaDocumentModel> documents;

  const PaProfileModel({
    required this.id,
    required this.companyId,
    required this.firstName,
    required this.surname,
    required this.email,
    required this.phone,
    required this.residentialAddress,
    required this.profilePictureUrl,
    required this.emergencyContactName,
    required this.emergencyContactPhone,
    required this.nationality,
    required this.rightToWorkCode,
    required this.passportNumber,
    required this.status,
    required this.documents,
  });

  String get fullName {
    final full = '$firstName $surname'.trim();
    return full.isEmpty ? 'Passenger Assistant' : full;
  }

  String get emergencyContactDisplay {
    final name = (emergencyContactName ?? '').trim();
    final phone = (emergencyContactPhone ?? '').trim();
    if (name.isEmpty && phone.isEmpty) return '-';
    if (name.isEmpty) return phone;
    if (phone.isEmpty) return name;
    return '$name · $phone';
  }

  bool get isOnDuty => (status ?? '').trim().toLowerCase() == 'active';

  PaDocumentModel? documentByType(String type) {
    final key = type.toLowerCase();
    for (final doc in documents) {
      if (doc.documentType.toLowerCase() == key) return doc;
    }
    return null;
  }

  String get statusLabel {
    final normalized = (status ?? '').trim().toLowerCase();
    if (normalized.isEmpty) return 'Unknown';
    return normalized[0].toUpperCase() + normalized.substring(1);
  }

  factory PaProfileModel.fromMap(
    Map<String, dynamic> row, {
    required List<PaDocumentModel> documents,
  }) {
    return PaProfileModel(
      id: (row['id'] ?? '').toString(),
      companyId: (row['company_id'] ?? '').toString(),
      firstName: (row['first_name'] ?? '').toString().trim(),
      surname: (row['surname'] ?? '').toString().trim(),
      email: (row['email'] ?? '').toString().trim(),
      phone: (row['phone'] ?? '').toString().trim(),
      residentialAddress: _toNullableText(row['residential_address']),
      profilePictureUrl: _toNullableText(row['profile_picture_url']),
      emergencyContactName: _toNullableText(row['emergency_contact_name']),
      emergencyContactPhone: _toNullableText(row['emergency_contact_phone']),
      nationality: _toNullableText(row['nationality']),
      rightToWorkCode: _toNullableText(row['right_to_work_code']),
      passportNumber: _toNullableText(row['passport_number']),
      status: _toNullableText(row['status']),
      documents: documents,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'company_id': companyId,
    'first_name': firstName,
    'surname': surname,
    'email': email,
    'phone': phone,
    'residential_address': residentialAddress,
    'profile_picture_url': profilePictureUrl,
    'emergency_contact_name': emergencyContactName,
    'emergency_contact_phone': emergencyContactPhone,
    'nationality': nationality,
    'right_to_work_code': rightToWorkCode,
    'passport_number': passportNumber,
    'status': status,
    'documents': documents.map((d) => d.toJson()).toList(),
  };

  factory PaProfileModel.fromJson(Map<String, dynamic> json) {
    return PaProfileModel(
      id: (json['id'] ?? '').toString(),
      companyId: (json['company_id'] ?? '').toString(),
      firstName: (json['first_name'] ?? '').toString(),
      surname: (json['surname'] ?? '').toString(),
      email: (json['email'] ?? '').toString(),
      phone: (json['phone'] ?? '').toString(),
      residentialAddress: json['residential_address']?.toString(),
      profilePictureUrl: json['profile_picture_url']?.toString(),
      emergencyContactName: json['emergency_contact_name']?.toString(),
      emergencyContactPhone: json['emergency_contact_phone']?.toString(),
      nationality: json['nationality']?.toString(),
      rightToWorkCode: json['right_to_work_code']?.toString(),
      passportNumber: json['passport_number']?.toString(),
      status: json['status']?.toString(),
      documents: (json['documents'] as List<dynamic>? ?? [])
          .map(
            (e) => PaDocumentModel.fromJson(Map<String, dynamic>.from(e as Map)),
          )
          .toList(),
    );
  }

  static String? _toNullableText(dynamic raw) {
    final value = (raw ?? '').toString().trim();
    return value.isEmpty ? null : value;
  }
}

/// Expiry urgency for certificate rows.
enum PaDocumentExpiryState { missing, ok, expiringSoon, expired }

class PaDocumentModel {
  final String id;
  final String documentType;
  final String? fileName;
  final String fileUrl;
  final DateTime? expiryDate;
  final bool verified;
  final DateTime? uploadedAt;

  const PaDocumentModel({
    required this.id,
    required this.documentType,
    required this.fileName,
    required this.fileUrl,
    required this.expiryDate,
    required this.verified,
    required this.uploadedAt,
  });

  bool get isExpiryDateMissing => expiryDate == null;

  PaDocumentExpiryState get expiryState {
    final date = expiryDate;
    if (date == null) return PaDocumentExpiryState.missing;
    return PaDocumentModel.resolveExpiryState(date);
  }

  bool get hasExpiryIssue =>
      isExpiryDateMissing ||
      expiryState == PaDocumentExpiryState.expired ||
      expiryState == PaDocumentExpiryState.expiringSoon;

  String get expiryDisplayText {
    if (isExpiryDateMissing) return '(date not entered)';
    final date = expiryDate;
    if (date == null) return '';
    return 'Expires ${PaDocumentModel.formatExpiryDate(date)}';
  }

  String get displayTitle {
    if (documentType == 'other_certificate') {
      final label = (fileName ?? '').trim();
      return label.isEmpty ? 'Other Certificate' : label;
    }
    return _typeLabels[documentType] ?? _humanizeType(documentType);
  }

  static const Map<String, String> _typeLabels = {
    'passport': 'Passport',
    'safeguarding_certificate': 'Safeguarding Certificate',
    'background_check': 'Background Check',
    'first_aid_certificate': 'First Aid Certificate',
    'other_certificate': 'Other Certificate',
  };

  static String _humanizeType(String type) {
    return type
        .replaceAll('_', ' ')
        .split(' ')
        .where((w) => w.isNotEmpty)
        .map((w) => w[0].toUpperCase() + w.substring(1))
        .join(' ');
  }

  static PaDocumentExpiryState resolveExpiryState(DateTime expiry) {
    final today = DateTime.now();
    final expiryOnly = DateTime(expiry.year, expiry.month, expiry.day);
    final todayOnly = DateTime(today.year, today.month, today.day);
    if (expiryOnly.isBefore(todayOnly)) {
      return PaDocumentExpiryState.expired;
    }
    final daysUntil = expiryOnly.difference(todayOnly).inDays;
    if (daysUntil <= 30) return PaDocumentExpiryState.expiringSoon;
    return PaDocumentExpiryState.ok;
  }

  static String formatExpiryDate(DateTime date) {
    const months = [
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
    final m = months[date.month - 1];
    return '$m ${date.day}, ${date.year}';
  }

  factory PaDocumentModel.fromMap(Map<String, dynamic> row) {
    return PaDocumentModel(
      id: (row['id'] ?? '').toString(),
      documentType: (row['document_type'] ?? '').toString().trim(),
      fileName: _toNullableText(row['file_name']),
      fileUrl: (row['file_url'] ?? '').toString().trim(),
      expiryDate: _parseDate(row['expiry_date']),
      verified: row['verified'] == true,
      uploadedAt: _parseDateTime(row['uploaded_at']),
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'document_type': documentType,
    'file_name': fileName,
    'file_url': fileUrl,
    'expiry_date': expiryDate?.toIso8601String(),
    'verified': verified,
    'uploaded_at': uploadedAt?.toIso8601String(),
  };

  factory PaDocumentModel.fromJson(Map<String, dynamic> json) {
    return PaDocumentModel(
      id: (json['id'] ?? '').toString(),
      documentType: (json['document_type'] ?? '').toString(),
      fileName: _toNullableText(json['file_name']),
      fileUrl: (json['file_url'] ?? '').toString(),
      expiryDate: _parseDate(json['expiry_date']),
      verified: json['verified'] == true,
      uploadedAt: _parseDateTime(json['uploaded_at']),
    );
  }

  static String? _toNullableText(dynamic raw) {
    final value = (raw ?? '').toString().trim();
    return value.isEmpty ? null : value;
  }
}

DateTime? _parseDate(dynamic raw) {
  if (raw == null) return null;
  final value = raw.toString().trim();
  if (value.isEmpty) return null;
  return DateTime.tryParse(value);
}

DateTime? _parseDateTime(dynamic raw) {
  if (raw == null) return null;
  return DateTime.tryParse(raw.toString());
}
