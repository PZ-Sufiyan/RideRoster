import 'package:file_picker/file_picker.dart';

/// A single "other certificate" entry — a user-defined label + file.
class OtherCertificate {
  OtherCertificate({required this.label, required this.file});

  String label;
  PlatformFile file;
}

/// Shared data model passed across all 3 registration steps.
/// Holds every field so data is preserved when navigating back.
class DriverRegisterData {
  // ── Step 1 – Personal Details ────────────────────────────────────────────
  String fullName = '';
  String firstName = '';
  String lastName = '';
  String password = '';
  String confirmPassword = '';
  String email = '';
  String companyName = '';
  String companyId = '';
  String countryCode = '+44';
  String mobileNumber = '';
  String residentialAddress = '';
  String emergencyContactName = '';
  String emergencyContactPhone = '';
  String passportNumber = '';
  String rightToWorkCode = '';

  /// 'British' or any custom nationality text the driver types.
  String nationality = '';

  // ── Step 2 – Vehicle Details ─────────────────────────────────────────────
  String registrationNumber = '';
  String taxiPlateNumber = '';
  String make = '';
  String model = '';
  String vehicleColour = '';
  DateTime? yearOfFirstRegistration;
  String licensingType = '';
  String bodyStyle = '';
  String passengerSeats = '';
  bool wheelchairAccessible = false;

  // ── Step 3 – Documents ───────────────────────────────────────────────────
  PlatformFile? drivingLicenseFront;
  PlatformFile? drivingLicenseBack;
  DateTime? drivingLicenseExpiry;
  String licenseNumber = '';

  PlatformFile? taxiBadgeFront;
  PlatformFile? taxiBadgeBack;
  DateTime? taxiBadgeExpiry;

  PlatformFile? dbsCertFront;
  PlatformFile? dbsCertBack;
  DateTime? dbsCertExpiry;

  String dbsServiceUpdateId = '';

  PlatformFile? safeguardingCert;

  /// Additional certificates (English proficiency, epilepsy cert, etc.).
  /// Each entry carries a user-defined label + the picked file.
  List<OtherCertificate> otherCertificates = [];

  // ── Step 3 – Vehicle Documents ────────────────────────────────────────────
  PlatformFile? v5DocumentFront;
  PlatformFile? v5DocumentInside;

  PlatformFile? motCertificate;
  DateTime? motCertificateExpiry;

  PlatformFile? taxiLicensePlate;
  DateTime? taxiLicensePlateExpiry;

  PlatformFile? insuranceCertificate;
  DateTime? insuranceCertificateExpiry;

  PlatformFile? vehiclePhoto;
}
