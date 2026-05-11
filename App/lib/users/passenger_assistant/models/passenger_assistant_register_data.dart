import 'package:file_picker/file_picker.dart';

/// Optional extra certificate (label + file), same pattern as driver registration.
class PaOtherCertificate {
  PaOtherCertificate({required this.label, required this.file});

  String label;
  PlatformFile file;
}

/// Shared state across passenger assistant registration steps.
class PassengerAssistantRegisterData {
  String companyName = '';
  String companyId = '';

  String firstName = '';
  String lastName = '';
  String email = '';
  String password = '';
  String confirmPassword = '';
  String countryCode = '+44';
  String mobileNumber = '';
  String residentialAddress = '';

  String nationality = '';
  bool britishPassportHolder = false;
  String rightToWorkCode = '';

  PlatformFile? profilePhoto;

  String passportNumber = '';
  PlatformFile? passportCopy;
  DateTime? passportExpiry;
  bool passportExpiryEnteredManually = false;

  PlatformFile? safeguardingCertificate;
  DateTime? safeguardingExpiry;
  bool safeguardingExpiryEnteredManually = false;

  PlatformFile? backgroundCheckCertificate;
  PlatformFile? firstAidCertificate;

  List<PaOtherCertificate> otherCertificates = [];

  String emergencyContactName = '';
  String emergencyContactPhone = '';
}
