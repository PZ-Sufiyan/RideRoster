import 'package:file_picker/file_picker.dart';

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
  String countryCode = '+1';
  String mobileNumber = '';
  String residentialAddress = '';
  String emergencyContactName = '';
  String emergencyContactPhone = '';
  String passportNumber = '';
  String rightToWorkCode = '';

  // ── Step 2 – Vehicle Details ─────────────────────────────────────────────
  String registrationNumber = '';
  String taxiPlateNumber = '';
  String make = '';
  String model = '';
  String vehicleColour = '';
  DateTime? yearOfFirstRegistration;
  String licensingType = '';
  String bodyStyle = 'Car'; // 'Car' | 'MPV' | 'Minibus'
  String passengerSeats = '4';
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
