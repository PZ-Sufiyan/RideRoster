import 'package:file_picker/file_picker.dart';

/// Shared data model passed across all 3 registration steps.
/// Holds every field so data is preserved when navigating back.
class DriverRegisterData {
  // ── Step 1 – Personal Details ────────────────────────────────────────────
  String fullName = '';
  String password = '';
  String email = '';
  String companyName = '';
  String countryCode = '+1';
  String mobileNumber = '';

  // ── Step 2 – Vehicle Details ─────────────────────────────────────────────
  String registrationNumber = '';
  String taxiPlateNumber = '';
  String make = '';
  String model = '';
  DateTime? yearOfFirstRegistration;
  String licensingType = '';
  String bodyStyle = 'Car'; // 'Car' | 'MPV' | 'Minibus'
  String passengerSeats = '4';
  bool wheelchairAccessible = false;

  // ── Step 3 – Documents ───────────────────────────────────────────────────
  PlatformFile? drivingLicenseFront;
  PlatformFile? drivingLicenseBack;
  DateTime? drivingLicenseExpiry;

  PlatformFile? taxiBadgeFront;
  PlatformFile? taxiBadgeBack;
  DateTime? taxiBadgeExpiry;

  PlatformFile? dbsCertFront;
  PlatformFile? dbsCertBack;
  DateTime? dbsCertExpiry;

  String dbsServiceUpdateId = '';

  PlatformFile? safeguardingCert;
}
