import 'dart:io';

import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../../components/app_button.dart';
import '../../../../components/offline_banner.dart';
import '../../../../model/driver_profile_model.dart';
import '../../../../providers/connectivity_provider.dart';
import '../../../../providers/driver_profile_provider.dart';
import '../../../../services/driver_profile_edit_service.dart';
import '../../../../utils/app_colors.dart';
import '../../../../utils/size_confg.dart';
import '../../../auth/componenet/register_widgets.dart';
import 'edit_upload_box.dart';

enum DriverProfileEditSection {
  profilePhoto,
  personalInfo,
  professionalDetails,
  documentPassport,
  documentDrivingLicense,
  documentTaxiBadge,
  documentDbs,
  documentSafeguarding,
  documentV5,
  documentMot,
  documentTaxiLicensePlate,
  documentInsurance,
  documentVehiclePhoto,
}

class DriverEditProfileArgs {
  const DriverEditProfileArgs({required this.section});

  final DriverProfileEditSection section;
}

void showEditProfileRequiresInternetMessage(BuildContext context) {
  ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(
      content: const Text('Connect to the internet to edit your profile.'),
      behavior: SnackBarBehavior.floating,
      backgroundColor: AppColors.textDark,
    ),
  );
}

/// Blocks edit profile when there is no internet (same pattern as leave form).
class EditProfileOfflineGate extends StatelessWidget {
  const EditProfileOfflineGate({super.key, required this.title});

  final String title;

  @override
  Widget build(BuildContext context) {
    SizeConfig.init(context);
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Column(
          children: [
            const OfflineBanner(),
            Padding(
              padding: EdgeInsets.symmetric(
                horizontal: SizeConfig.r(4),
                vertical: SizeConfig.r(4),
              ),
              child: Row(
                children: [
                  IconButton(
                    onPressed: () => Navigator.maybePop(context),
                    icon: Icon(
                      Icons.arrow_back,
                      color: AppColors.textDark,
                      size: SizeConfig.r(22),
                    ),
                  ),
                  Expanded(
                    child: Text(
                      title,
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: SizeConfig.sp(17),
                        fontWeight: FontWeight.w700,
                        color: AppColors.textDark,
                      ),
                    ),
                  ),
                  SizedBox(width: SizeConfig.r(48)),
                ],
              ),
            ),
            Expanded(
              child: Center(
                child: Padding(
                  padding: EdgeInsets.all(SizeConfig.r(24)),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        Icons.cloud_off_outlined,
                        size: SizeConfig.r(42),
                        color: AppColors.warning,
                      ),
                      SizedBox(height: SizeConfig.r(12)),
                      Text(
                        'Connect to the internet to edit your profile.',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          fontSize: SizeConfig.sp(14),
                          color: AppColors.textDark,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class DriverEditProfilePage extends StatefulWidget {
  const DriverEditProfilePage({super.key, required this.args});

  final DriverEditProfileArgs args;

  @override
  State<DriverEditProfilePage> createState() => _DriverEditProfilePageState();
}

class _DriverEditProfilePageState extends State<DriverEditProfilePage> {
  final _editService = DriverProfileEditService();
  bool _isSaving = false;
  String? _error;

  DriverProfileModel? get _profile =>
      context.read<DriverProfileProvider>().profile;

  String get _title {
    switch (widget.args.section) {
      case DriverProfileEditSection.profilePhoto:
        return 'Profile Picture';
      case DriverProfileEditSection.personalInfo:
        return 'Personal Information';
      case DriverProfileEditSection.professionalDetails:
        return 'Professional Details';
      case DriverProfileEditSection.documentPassport:
        return 'Passport / ID';
      case DriverProfileEditSection.documentDrivingLicense:
        return 'Driving License';
      case DriverProfileEditSection.documentTaxiBadge:
        return 'Taxi Badge';
      case DriverProfileEditSection.documentDbs:
        return 'DBS Certificate';
      case DriverProfileEditSection.documentSafeguarding:
        return 'Safeguarding Certificate';
      case DriverProfileEditSection.documentV5:
        return 'V5';
      case DriverProfileEditSection.documentMot:
        return 'MOT';
      case DriverProfileEditSection.documentTaxiLicensePlate:
        return 'Taxi License Plate';
      case DriverProfileEditSection.documentInsurance:
        return 'Insurance';
      case DriverProfileEditSection.documentVehiclePhoto:
        return 'Vehicle Photo';
    }
  }

  bool get _requiresOnline => true;

  Future<void> _runSave(Future<void> Function() action) async {
    if (_requiresOnline && !context.read<ConnectivityProvider>().isOnline) {
      setState(() => _error = 'No internet. Please try again.');
      return;
    }

    setState(() {
      _isSaving = true;
      _error = null;
    });

    try {
      await action();
      if (!mounted) return;
      await context.read<DriverProfileProvider>().loadProfile(forceRefresh: true);
      if (!mounted) return;
      Navigator.pop(context, true);
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _isSaving = false;
        _error = e.toString().replaceFirst('Exception: ', '');
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    SizeConfig.init(context);

    if (!context.watch<ConnectivityProvider>().isOnline) {
      return EditProfileOfflineGate(title: _title);
    }

    final profile = _profile;

    if (profile == null) {
      return Scaffold(
        appBar: AppBar(title: Text(_title)),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: const Color(0xFF1B5E20),
        foregroundColor: Colors.white,
        elevation: 0,
        title: Text(
          _title,
          style: TextStyle(
            fontSize: SizeConfig.sp(17),
            fontWeight: FontWeight.w700,
          ),
        ),
      ),
      body: Column(
        children: [
          Expanded(
            child: SingleChildScrollView(
              padding: EdgeInsets.fromLTRB(
                SizeConfig.hPad,
                SizeConfig.r(20),
                SizeConfig.hPad,
                SizeConfig.r(24),
              ),
              child: _buildSectionBody(profile),
            ),
          ),
          SafeArea(
            top: false,
            child: Padding(
                padding: EdgeInsets.fromLTRB(
                  SizeConfig.hPad,
                  0,
                  SizeConfig.hPad,
                  SizeConfig.r(16),
                ),
                child: Column(
                  children: [
                    if (_error != null) ...[
                      Text(
                        _error!,
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          fontSize: SizeConfig.sp(13),
                          color: AppColors.error,
                        ),
                      ),
                      SizedBox(height: SizeConfig.r(10)),
                    ],
                    AppButton(
                      label: 'Save',
                      isLoading: _isSaving,
                      onPressed: _isSaving ? null : _onSave,
                      backgroundColor: const Color(0xFF1B5E20),
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildSectionBody(DriverProfileModel profile) {
    switch (widget.args.section) {
      case DriverProfileEditSection.profilePhoto:
        return _ProfilePhotoSection(
          key: const ValueKey('profile_photo'),
          profile: profile,
          onStateReady: (state) => _profilePhotoState = state,
        );
      case DriverProfileEditSection.personalInfo:
        return _PersonalInfoSection(
          key: const ValueKey('personal_info'),
          profile: profile,
          onStateReady: (state) => _personalInfoState = state,
        );
      case DriverProfileEditSection.professionalDetails:
        return _ProfessionalDetailsSection(
          key: const ValueKey('professional'),
          profile: profile,
          onStateReady: (state) => _professionalState = state,
        );
      case DriverProfileEditSection.documentPassport:
        return _PassportDocumentSection(
          key: const ValueKey('passport'),
          profile: profile,
          onStateReady: (state) => _passportState = state,
        );
      case DriverProfileEditSection.documentDrivingLicense:
        return _DrivingLicenseSection(
          key: const ValueKey('license'),
          profile: profile,
          onStateReady: (state) => _drivingLicenseState = state,
        );
      case DriverProfileEditSection.documentTaxiBadge:
        return _PairedDocumentSection(
          key: const ValueKey('taxi_badge'),
          profile: profile,
          frontLabel: 'Taxi Badge (Front)',
          backLabel: 'Taxi Badge (Back)',
          frontType: 'taxi_badge_front',
          backType: 'taxi_badge_back',
          showExpiry: true,
          onStateReady: (state) => _pairedDocState = state,
        );
      case DriverProfileEditSection.documentDbs:
        return _DbsDocumentSection(
          key: const ValueKey('dbs'),
          profile: profile,
          onStateReady: (state) => _dbsState = state,
        );
      case DriverProfileEditSection.documentSafeguarding:
        return _SingleDriverDocumentSection(
          key: const ValueKey('safeguarding'),
          profile: profile,
          documentType: 'safeguarding_certificate',
          label: 'Safeguarding Certificate',
          showExpiry: true,
          onStateReady: (state) => _singleDriverDocState = state,
        );
      case DriverProfileEditSection.documentV5:
        return _PairedVehicleDocumentSection(
          key: const ValueKey('v5'),
          profile: profile,
          frontLabel: 'V5 (Front)',
          backLabel: 'V5 (Inside)',
          frontType: 'v5_front',
          backType: 'v5_inside',
          onStateReady: (state) => _pairedVehicleDocState = state,
        );
      case DriverProfileEditSection.documentMot:
        return _SingleVehicleDocumentSection(
          key: const ValueKey('mot'),
          profile: profile,
          documentType: 'mot_certificate',
          label: 'MOT Certificate',
          showExpiry: true,
          onStateReady: (state) => _singleVehicleDocState = state,
        );
      case DriverProfileEditSection.documentTaxiLicensePlate:
        return _TaxiLicensePlateSection(
          key: const ValueKey('taxi_plate'),
          profile: profile,
          onStateReady: (state) => _taxiPlateState = state,
        );
      case DriverProfileEditSection.documentInsurance:
        return _SingleVehicleDocumentSection(
          key: const ValueKey('insurance'),
          profile: profile,
          documentType: 'insurance_certificate',
          label: 'Insurance Certificate',
          showExpiry: true,
          onStateReady: (state) => _singleVehicleDocState = state,
        );
      case DriverProfileEditSection.documentVehiclePhoto:
        return _VehiclePhotoSection(
          key: const ValueKey('vehicle_photo'),
          profile: profile,
          onStateReady: (state) => _vehiclePhotoState = state,
        );
    }
  }

  _ProfilePhotoSectionState? _profilePhotoState;
  _PersonalInfoSectionState? _personalInfoState;
  _ProfessionalDetailsSectionState? _professionalState;
  _PassportDocumentSectionState? _passportState;
  _DrivingLicenseSectionState? _drivingLicenseState;
  _PairedDocumentSectionState? _pairedDocState;
  _DbsDocumentSectionState? _dbsState;
  _SingleDriverDocumentSectionState? _singleDriverDocState;
  _PairedVehicleDocumentSectionState? _pairedVehicleDocState;
  _SingleVehicleDocumentSectionState? _singleVehicleDocState;
  _TaxiLicensePlateSectionState? _taxiPlateState;
  _VehiclePhotoSectionState? _vehiclePhotoState;

  Future<void> _onSave() async {
    switch (widget.args.section) {
      case DriverProfileEditSection.profilePhoto:
        final path = _profilePhotoState?.pickedPath;
        if (path == null || path.isEmpty) {
          setState(() => _error = 'Please select a profile picture.');
          return;
        }
        await _runSave(
          () => _editService.updateProfilePicture(localPath: path),
        );
      case DriverProfileEditSection.personalInfo:
        final data = _personalInfoState?.collect();
        if (data == null) return;
        await _runSave(() => _editService.updatePersonalInfo(
              firstName: data.firstName,
              lastName: data.lastName,
              phone: data.phone,
              residentialAddress: data.residentialAddress,
              emergencyContactName: data.emergencyContactName,
              emergencyContactPhone: data.emergencyContactPhone,
              passportNumber: data.passportNumber,
              nationality: data.nationality,
              rightToWorkCode: data.rightToWorkCode,
            ));
      case DriverProfileEditSection.professionalDetails:
        final data = _professionalState?.collect();
        if (data == null) return;
        await _runSave(() => _editService.updateProfessionalDetails(
              licenseNo: _profile!.licenseNo,
              registrationNumber: data.registrationNumber,
            ));
      case DriverProfileEditSection.documentPassport:
        final data = _passportState?.collect();
        if (data == null) return;
        await _runSave(() => _editService.updatePassportSection(
              passportNumber: data.passportNumber,
              localPath: data.localPath,
              expiryDate: data.expiryDate,
              existingDocId: data.existingDocId,
            ));
      case DriverProfileEditSection.documentDrivingLicense:
        final data = _drivingLicenseState?.collect();
        if (data == null) return;
        await _runSave(() => _editService.updateDrivingLicenseSection(
              licenseNo: data.licenseNo,
              frontPath: data.frontPath,
              backPath: data.backPath,
              expiryDate: data.expiryDate,
              existingFrontId: data.existingFrontId,
              existingBackId: data.existingBackId,
            ));
      case DriverProfileEditSection.documentTaxiBadge:
        final data = _pairedDocState?.collect();
        if (data == null) return;
        await _runSave(() => _editService.updateDriverDocumentPair(
              frontType: data.frontType,
              backType: data.backType,
              frontPath: data.frontPath,
              backPath: data.backPath,
              expiryDate: data.expiryDate,
              existingFrontId: data.existingFrontId,
              existingBackId: data.existingBackId,
            ));
      case DriverProfileEditSection.documentDbs:
        final data = _dbsState?.collect();
        if (data == null) return;
        await _runSave(() => _editService.updateDbsSection(
              dbsServiceUpdateId: data.dbsServiceUpdateId,
              frontPath: data.frontPath,
              backPath: data.backPath,
              expiryDate: data.expiryDate,
              existingFrontId: data.existingFrontId,
              existingBackId: data.existingBackId,
            ));
      case DriverProfileEditSection.documentSafeguarding:
        final data = _singleDriverDocState?.collect();
        if (data == null) return;
        if (data.localPath == null && data.existingDocId == null) {
          setState(() => _error = 'Please upload a document file.');
          return;
        }
        if (data.localPath != null &&
            data.expiryDate == null &&
            data.existingDocId == null) {
          setState(() => _error = 'Expiry date is required.');
          return;
        }
        await _runSave(() => _editService.upsertDriverDocument(
              documentType: data.documentType,
              localPath: data.localPath,
              expiryDate: data.expiryDate,
              existingDocId: data.existingDocId,
            ));
      case DriverProfileEditSection.documentV5:
        final data = _pairedVehicleDocState?.collect();
        if (data == null) return;
        await _runSave(() => _editService.updateVehicleDocumentPair(
              frontType: data.frontType,
              backType: data.backType,
              frontPath: data.frontPath,
              backPath: data.backPath,
              existingFrontId: data.existingFrontId,
              existingBackId: data.existingBackId,
            ));
      case DriverProfileEditSection.documentMot:
      case DriverProfileEditSection.documentInsurance:
        final data = _singleVehicleDocState?.collect();
        if (data == null) return;
        if (data.localPath == null && data.existingDocId == null) {
          setState(() => _error = 'Please upload a document file.');
          return;
        }
        if (data.localPath != null &&
            data.expiryDate == null &&
            data.existingDocId == null) {
          setState(() => _error = 'Expiry date is required.');
          return;
        }
        await _runSave(() async {
          if (data.localPath != null || data.expiryDate != null) {
            await _editService.upsertVehicleDocument(
              documentType: data.documentType,
              localPath: data.localPath,
              expiryDate: data.expiryDate,
              existingDocId: data.existingDocId,
            );
          }
        });
      case DriverProfileEditSection.documentTaxiLicensePlate:
        final data = _taxiPlateState?.collect();
        if (data == null) return;
        await _runSave(() => _editService.updateTaxiLicensePlateSection(
              plateNumber: data.plateNumber,
              localPath: data.localPath,
              expiryDate: data.expiryDate,
              existingDocId: data.existingDocId,
            ));
      case DriverProfileEditSection.documentVehiclePhoto:
        final path = _vehiclePhotoState?.pickedPath;
        if (path == null || path.isEmpty) {
          final hasExisting =
              (_profile?.vehicle?.vehiclePhotoUrl ?? '').isNotEmpty ||
                  _profile?.vehicleDocumentByType('vehicle_photo') != null;
          if (hasExisting) {
            if (mounted) Navigator.pop(context);
            return;
          }
          setState(() => _error = 'Please select a vehicle photo.');
          return;
        }
        await _runSave(() => _editService.updateVehiclePhoto(localPath: path));
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared helpers
// ─────────────────────────────────────────────────────────────────────────────

Future<PlatformFile?> pickImageFile() async {
  final result = await FilePicker.platform.pickFiles(
    type: FileType.image,
    allowMultiple: false,
    withData: false,
    withReadStream: false,
  );
  if (result == null || result.files.isEmpty) return null;
  return result.files.first;
}

Future<PlatformFile?> pickDocumentFile() async {
  final result = await FilePicker.platform.pickFiles(
    type: FileType.custom,
    allowedExtensions: ['jpg', 'jpeg', 'png', 'pdf'],
    withData: false,
    withReadStream: false,
  );
  if (result == null || result.files.isEmpty) return null;
  return result.files.first;
}

Future<DateTime?> pickExpiryDate(
  BuildContext context, {
  DateTime? initial,
}) async {
  final now = DateTime.now();
  return showDatePicker(
    context: context,
    initialDate: initial ?? now,
    firstDate: now,
    lastDate: DateTime(now.year + 20),
    helpText: 'Select Expiry Date',
    builder: (context, child) => Theme(
      data: Theme.of(context).copyWith(
        colorScheme: const ColorScheme.light(primary: AppColors.primary),
      ),
      child: child!,
    ),
  );
}

String formatEditDate(DateTime d) {
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
  return '${d.day} ${months[d.month]} ${d.year}';
}

// ─────────────────────────────────────────────────────────────────────────────
// Profile photo
// ─────────────────────────────────────────────────────────────────────────────

class _ProfilePhotoSection extends StatefulWidget {
  const _ProfilePhotoSection({
    super.key,
    required this.profile,
    required this.onStateReady,
  });

  final DriverProfileModel profile;
  final void Function(_ProfilePhotoSectionState state) onStateReady;

  @override
  State<_ProfilePhotoSection> createState() => _ProfilePhotoSectionState();
}

class _ProfilePhotoSectionState extends State<_ProfilePhotoSection> {
  PlatformFile? _picked;
  String? get pickedPath => _picked?.path;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      widget.onStateReady(this);
    });
  }

  Future<void> _pick() async {
    final file = await pickImageFile();
    if (file != null) setState(() => _picked = file);
  }

  @override
  Widget build(BuildContext context) {
    final existingUrl = widget.profile.profilePictureUrl;
    final pickedPath = _picked?.path;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Choose a clear photo from your device. Only your profile picture will be updated.',
          style: TextStyle(
            fontSize: SizeConfig.sp(14),
            color: AppColors.textMedium,
          ),
        ),
        SizedBox(height: SizeConfig.r(24)),
        Center(
          child: ClipOval(
            child: SizedBox(
              width: SizeConfig.r(112),
              height: SizeConfig.r(112),
              child: pickedPath != null
                  ? Image.file(File(pickedPath), fit: BoxFit.cover)
                  : existingUrl != null && existingUrl.isNotEmpty
                      ? Image.network(
                          existingUrl,
                          fit: BoxFit.cover,
                          errorBuilder: (_, __, ___) => _avatarPlaceholder(),
                        )
                      : _avatarPlaceholder(),
            ),
          ),
        ),
        if (_picked != null) ...[
          SizedBox(height: SizeConfig.r(8)),
          Center(
            child: Text(
              _picked!.name,
              style: TextStyle(
                fontSize: SizeConfig.sp(13),
                color: AppColors.textMedium,
              ),
            ),
          ),
        ],
        SizedBox(height: SizeConfig.r(20)),
        EditUploadBox(
          newFile: _picked,
          existingUrl: existingUrl,
          onPick: _pick,
          onClearNew: () => setState(() => _picked = null),
          hint: 'Tap to choose photo (JPG or PNG)',
        ),
      ],
    );
  }

  Widget _avatarPlaceholder() {
    return ColoredBox(
      color: const Color(0xFFE8EEF5),
      child: Icon(
        Icons.person_outline,
        size: SizeConfig.r(52),
        color: const Color(0xFFB0BEC5),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Personal info
// ─────────────────────────────────────────────────────────────────────────────

class _PersonalInfoData {
  final String firstName;
  final String lastName;
  final String phone;
  final String residentialAddress;
  final String emergencyContactName;
  final String emergencyContactPhone;
  final String? passportNumber;
  final String nationality;
  final String? rightToWorkCode;

  const _PersonalInfoData({
    required this.firstName,
    required this.lastName,
    required this.phone,
    required this.residentialAddress,
    required this.emergencyContactName,
    required this.emergencyContactPhone,
    required this.passportNumber,
    required this.nationality,
    required this.rightToWorkCode,
  });
}

class _PersonalInfoSection extends StatefulWidget {
  const _PersonalInfoSection({
    super.key,
    required this.profile,
    required this.onStateReady,
  });

  final DriverProfileModel profile;
  final void Function(_PersonalInfoSectionState state) onStateReady;

  @override
  State<_PersonalInfoSection> createState() => _PersonalInfoSectionState();
}

class _PersonalInfoSectionState extends State<_PersonalInfoSection> {
  late final TextEditingController _firstNameCtrl;
  late final TextEditingController _lastNameCtrl;
  late final TextEditingController _phoneCtrl;
  late final TextEditingController _addressCtrl;
  late final TextEditingController _emergencyNameCtrl;
  late final TextEditingController _emergencyPhoneCtrl;
  late final TextEditingController _nationalityCtrl;
  late final TextEditingController _rightToWorkCtrl;
  bool _isBritish = false;

  @override
  void initState() {
    super.initState();
    final p = widget.profile;
    _firstNameCtrl = TextEditingController(text: p.firstName);
    _lastNameCtrl = TextEditingController(text: p.lastName);
    _phoneCtrl = TextEditingController(text: p.phone);
    _addressCtrl = TextEditingController(text: p.residentialAddress);
    _emergencyNameCtrl = TextEditingController(text: p.emergencyContactName);
    _emergencyPhoneCtrl = TextEditingController(text: p.emergencyContactPhone);
    _rightToWorkCtrl = TextEditingController(text: p.rightToWorkCode ?? '');
    final nationality = p.nationality ?? '';
    _isBritish = nationality.toLowerCase() == 'british';
    _nationalityCtrl = TextEditingController(
      text: _isBritish ? 'British' : nationality,
    );
    WidgetsBinding.instance.addPostFrameCallback((_) {
      widget.onStateReady(this);
    });
  }

  @override
  void dispose() {
    _firstNameCtrl.dispose();
    _lastNameCtrl.dispose();
    _phoneCtrl.dispose();
    _addressCtrl.dispose();
    _emergencyNameCtrl.dispose();
    _emergencyPhoneCtrl.dispose();
    _nationalityCtrl.dispose();
    _rightToWorkCtrl.dispose();
    super.dispose();
  }

  void _onBritishToggle(bool value) {
    setState(() {
      _isBritish = value;
      if (value) {
        _nationalityCtrl.text = 'British';
        _rightToWorkCtrl.clear();
      } else {
        _nationalityCtrl.clear();
      }
    });
  }

  _PersonalInfoData? collect() {
    final nationality = _nationalityCtrl.text.trim();
    if (nationality.isEmpty) return null;
    return _PersonalInfoData(
      firstName: _firstNameCtrl.text.trim(),
      lastName: _lastNameCtrl.text.trim(),
      phone: _phoneCtrl.text.trim(),
      residentialAddress: _addressCtrl.text.trim(),
      emergencyContactName: _emergencyNameCtrl.text.trim(),
      emergencyContactPhone: _emergencyPhoneCtrl.text.trim(),
      passportNumber: widget.profile.passportNumber,
      nationality: nationality,
      rightToWorkCode: _isBritish ? null : _rightToWorkCtrl.text.trim(),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const RegFieldLabel('First Name *'),
        SizedBox(height: SizeConfig.r(6)),
        RegField(controller: _firstNameCtrl, hintText: 'First name'),
        SizedBox(height: SizeConfig.r(14)),
        const RegFieldLabel('Last Name *'),
        SizedBox(height: SizeConfig.r(6)),
        RegField(controller: _lastNameCtrl, hintText: 'Last name'),
        SizedBox(height: SizeConfig.r(14)),
        const RegFieldLabel('Phone Number *'),
        SizedBox(height: SizeConfig.r(6)),
        RegField(
          controller: _phoneCtrl,
          hintText: 'Phone number',
          keyboardType: TextInputType.phone,
        ),
        SizedBox(height: SizeConfig.r(14)),
        const RegFieldLabel('Email'),
        SizedBox(height: SizeConfig.r(6)),
        Container(
          width: double.infinity,
          padding: EdgeInsets.symmetric(
            horizontal: SizeConfig.r(16),
            vertical: SizeConfig.r(16),
          ),
          decoration: BoxDecoration(
            color: const Color(0xFFF0F3F8),
            borderRadius: BorderRadius.circular(SizeConfig.radius),
            border: Border.all(color: const Color(0xFFE0E8F3)),
          ),
          child: Text(
            widget.profile.email.isEmpty ? '-' : widget.profile.email,
            style: TextStyle(
              fontSize: SizeConfig.sp(15),
              color: AppColors.textMedium,
            ),
          ),
        ),
        SizedBox(height: SizeConfig.r(14)),
        const RegFieldLabel('Residential Address'),
        SizedBox(height: SizeConfig.r(6)),
        RegField(controller: _addressCtrl, hintText: 'Address'),
        SizedBox(height: SizeConfig.r(14)),
        const RegFieldLabel('Emergency Contact Name'),
        SizedBox(height: SizeConfig.r(6)),
        RegField(controller: _emergencyNameCtrl, hintText: 'Contact name'),
        SizedBox(height: SizeConfig.r(14)),
        const RegFieldLabel('Emergency Contact Phone'),
        SizedBox(height: SizeConfig.r(6)),
        RegField(
          controller: _emergencyPhoneCtrl,
          hintText: 'Contact phone',
          keyboardType: TextInputType.phone,
        ),
        SizedBox(height: SizeConfig.r(14)),
        GestureDetector(
          onTap: () => _onBritishToggle(!_isBritish),
          child: Container(
            padding: EdgeInsets.symmetric(
              horizontal: SizeConfig.r(14),
              vertical: SizeConfig.r(12),
            ),
            decoration: BoxDecoration(
              color: _isBritish
                  ? const Color(0xFFE8F8EF)
                  : const Color(0xFFF3F7FC),
              borderRadius: BorderRadius.circular(SizeConfig.radius),
              border: Border.all(
                color: _isBritish
                    ? const Color(0xFF2ECC71)
                    : const Color(0xFFE0E8F3),
              ),
            ),
            child: Row(
              children: [
                Icon(
                  _isBritish
                      ? Icons.check_circle
                      : Icons.radio_button_unchecked,
                  color: _isBritish
                      ? const Color(0xFF2ECC71)
                      : AppColors.textLight,
                  size: SizeConfig.r(20),
                ),
                SizedBox(width: SizeConfig.r(10)),
                Text(
                  'British',
                  style: TextStyle(
                    fontSize: SizeConfig.sp(14),
                    fontWeight: FontWeight.w600,
                    color: AppColors.textDark,
                  ),
                ),
              ],
            ),
          ),
        ),
        SizedBox(height: SizeConfig.r(14)),
        if (!_isBritish) ...[
          const RegFieldLabel('Nationality *'),
          SizedBox(height: SizeConfig.r(6)),
          RegField(controller: _nationalityCtrl, hintText: 'Nationality'),
          SizedBox(height: SizeConfig.r(14)),
          const RegFieldLabel('Right to Work Code'),
          SizedBox(height: SizeConfig.r(6)),
          RegField(
            controller: _rightToWorkCtrl,
            hintText: 'Right to work code',
          ),
        ],
      ],
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Professional details
// ─────────────────────────────────────────────────────────────────────────────

class _ProfessionalDetailsData {
  final String? registrationNumber;

  const _ProfessionalDetailsData({required this.registrationNumber});
}

class _ProfessionalDetailsSection extends StatefulWidget {
  const _ProfessionalDetailsSection({
    super.key,
    required this.profile,
    required this.onStateReady,
  });

  final DriverProfileModel profile;
  final void Function(_ProfessionalDetailsSectionState state) onStateReady;

  @override
  State<_ProfessionalDetailsSection> createState() =>
      _ProfessionalDetailsSectionState();
}

class _ProfessionalDetailsSectionState extends State<_ProfessionalDetailsSection> {
  late final TextEditingController _registrationCtrl;

  @override
  void initState() {
    super.initState();
    final vehicle = widget.profile.vehicle;
    _registrationCtrl = TextEditingController(
      text: vehicle?.registrationNumber ?? '',
    );
    WidgetsBinding.instance.addPostFrameCallback((_) {
      widget.onStateReady(this);
    });
  }

  @override
  void dispose() {
    _registrationCtrl.dispose();
    super.dispose();
  }

  _ProfessionalDetailsData? collect() {
    return _ProfessionalDetailsData(
      registrationNumber: widget.profile.vehicle != null
          ? _registrationCtrl.text.trim()
          : null,
    );
  }

  @override
  Widget build(BuildContext context) {
    final vehicle = widget.profile.vehicle;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (vehicle != null) ...[
          RegFieldLabel('Vehicle (${vehicle.displayName})'),
          SizedBox(height: SizeConfig.r(6)),
          Text(
            'License, DBS, taxi plate and other certificates are updated from the Certificates & Documents section.',
            style: TextStyle(
              fontSize: SizeConfig.sp(13),
              color: AppColors.textMedium,
            ),
          ),
          SizedBox(height: SizeConfig.r(14)),
          const RegFieldLabel('Registration #'),
          SizedBox(height: SizeConfig.r(6)),
          RegField(controller: _registrationCtrl, hintText: 'Registration number'),
        ] else
          Text(
            'No vehicle assigned yet. Vehicle-related details will appear here once assigned.',
            style: TextStyle(
              fontSize: SizeConfig.sp(14),
              color: AppColors.textMedium,
            ),
          ),
      ],
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Passport document
// ─────────────────────────────────────────────────────────────────────────────

class _PassportDocumentData {
  final String? passportNumber;
  final String? localPath;
  final DateTime? expiryDate;
  final String? existingDocId;

  const _PassportDocumentData({
    required this.passportNumber,
    required this.localPath,
    required this.expiryDate,
    required this.existingDocId,
  });
}

class _PassportDocumentSection extends StatefulWidget {
  const _PassportDocumentSection({
    super.key,
    required this.profile,
    required this.onStateReady,
  });

  final DriverProfileModel profile;
  final void Function(_PassportDocumentSectionState state) onStateReady;

  @override
  State<_PassportDocumentSection> createState() =>
      _PassportDocumentSectionState();
}

class _PassportDocumentSectionState extends State<_PassportDocumentSection> {
  late final TextEditingController _passportCtrl;
  PlatformFile? _picked;
  DateTime? _expiry;
  String? _existingDocId;
  String? _existingFileUrl;

  @override
  void initState() {
    super.initState();
    final p = widget.profile;
    _passportCtrl = TextEditingController(text: p.passportNumber ?? '');
    final existing = p.driverDocumentByType('passport');
    _expiry = existing?.expiryDate;
    _existingDocId = existing?.id;
    _existingFileUrl = existing?.fileUrl;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      widget.onStateReady(this);
    });
  }

  @override
  void dispose() {
    _passportCtrl.dispose();
    super.dispose();
  }

  _PassportDocumentData collect() {
    return _PassportDocumentData(
      passportNumber: _passportCtrl.text.trim(),
      localPath: _picked?.path,
      expiryDate: _expiry,
      existingDocId: _existingDocId,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Optional — provide passport ID and document if available.',
          style: TextStyle(
            fontSize: SizeConfig.sp(13),
            color: AppColors.textMedium,
          ),
        ),
        SizedBox(height: SizeConfig.r(14)),
        const RegFieldLabel('Passport Number'),
        SizedBox(height: SizeConfig.r(6)),
        RegField(controller: _passportCtrl, hintText: 'Passport number'),
        SizedBox(height: SizeConfig.r(16)),
        const RegFieldLabel('Passport Copy'),
        SizedBox(height: SizeConfig.r(6)),
        EditUploadBox(
          newFile: _picked,
          existingUrl: _existingFileUrl,
          onPick: () async {
            final file = await pickDocumentFile();
            if (file != null) setState(() => _picked = file);
          },
          onClearNew: () => setState(() => _picked = null),
          hint: 'Upload passport copy (PDF or image)',
        ),
        SizedBox(height: SizeConfig.r(10)),
        ExpiryButton(
          date: _expiry,
          onTap: () async {
            final picked = await pickExpiryDate(context, initial: _expiry);
            if (picked != null) setState(() => _expiry = picked);
          },
          formatDate: formatEditDate,
        ),
        SizedBox(height: SizeConfig.r(6)),
        const ManualEntryHint(),
      ],
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Paired driver documents (license, DBS)
// ─────────────────────────────────────────────────────────────────────────────

class _PairedDocumentData {
  final String frontType;
  final String backType;
  final String? frontPath;
  final String? backPath;
  final DateTime? expiryDate;
  final String? existingFrontId;
  final String? existingBackId;

  const _PairedDocumentData({
    required this.frontType,
    required this.backType,
    required this.frontPath,
    required this.backPath,
    required this.expiryDate,
    required this.existingFrontId,
    required this.existingBackId,
  });
}

class _PairedDocumentSection extends StatefulWidget {
  const _PairedDocumentSection({
    super.key,
    required this.profile,
    required this.frontLabel,
    required this.backLabel,
    required this.frontType,
    required this.backType,
    this.showExpiry = true,
    required this.onStateReady,
  });

  final DriverProfileModel profile;
  final String frontLabel;
  final String backLabel;
  final String frontType;
  final String backType;
  final bool showExpiry;
  final void Function(_PairedDocumentSectionState state) onStateReady;

  @override
  State<_PairedDocumentSection> createState() => _PairedDocumentSectionState();
}

class _PairedDocumentSectionState extends State<_PairedDocumentSection> {
  PlatformFile? _front;
  PlatformFile? _back;
  DateTime? _expiry;
  String? _existingFrontId;
  String? _existingBackId;
  String? _existingFrontUrl;
  String? _existingBackUrl;

  @override
  void initState() {
    super.initState();
    final front = widget.profile.driverDocumentByType(widget.frontType);
    final back = widget.profile.driverDocumentByType(widget.backType);
    _expiry = front?.expiryDate ?? back?.expiryDate;
    _existingFrontId = front?.id;
    _existingBackId = back?.id;
    _existingFrontUrl = front?.fileUrl;
    _existingBackUrl = back?.fileUrl;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      widget.onStateReady(this);
    });
  }

  _PairedDocumentData collect() {
    return _PairedDocumentData(
      frontType: widget.frontType,
      backType: widget.backType,
      frontPath: _front?.path,
      backPath: _back?.path,
      expiryDate: _expiry,
      existingFrontId: _existingFrontId,
      existingBackId: _existingBackId,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        RegFieldLabel(widget.frontLabel),
        SizedBox(height: SizeConfig.r(6)),
        EditUploadBox(
          newFile: _front,
          existingUrl: _existingFrontUrl,
          onPick: () async {
            final file = await pickDocumentFile();
            if (file != null) setState(() => _front = file);
          },
          onClearNew: () => setState(() => _front = null),
        ),
        SizedBox(height: SizeConfig.r(14)),
        RegFieldLabel(widget.backLabel),
        SizedBox(height: SizeConfig.r(6)),
        EditUploadBox(
          newFile: _back,
          existingUrl: _existingBackUrl,
          onPick: () async {
            final file = await pickDocumentFile();
            if (file != null) setState(() => _back = file);
          },
          onClearNew: () => setState(() => _back = null),
        ),
        if (widget.showExpiry) ...[
          SizedBox(height: SizeConfig.r(10)),
          ExpiryButton(
            date: _expiry,
            onTap: () async {
              final picked = await pickExpiryDate(context, initial: _expiry);
              if (picked != null) setState(() => _expiry = picked);
            },
            formatDate: formatEditDate,
          ),
          SizedBox(height: SizeConfig.r(6)),
          const ManualEntryHint(),
        ],
      ],
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Driving license (number + paired docs)
// ─────────────────────────────────────────────────────────────────────────────

class _DrivingLicenseData {
  final String licenseNo;
  final String? frontPath;
  final String? backPath;
  final DateTime? expiryDate;
  final String? existingFrontId;
  final String? existingBackId;

  const _DrivingLicenseData({
    required this.licenseNo,
    required this.frontPath,
    required this.backPath,
    required this.expiryDate,
    required this.existingFrontId,
    required this.existingBackId,
  });
}

class _DrivingLicenseSection extends StatefulWidget {
  const _DrivingLicenseSection({
    super.key,
    required this.profile,
    required this.onStateReady,
  });

  final DriverProfileModel profile;
  final void Function(_DrivingLicenseSectionState state) onStateReady;

  @override
  State<_DrivingLicenseSection> createState() => _DrivingLicenseSectionState();
}

class _DrivingLicenseSectionState extends State<_DrivingLicenseSection> {
  late final TextEditingController _licenseCtrl;
  PlatformFile? _front;
  PlatformFile? _back;
  DateTime? _expiry;
  String? _existingFrontId;
  String? _existingBackId;
  String? _existingFrontUrl;
  String? _existingBackUrl;

  @override
  void initState() {
    super.initState();
    _licenseCtrl = TextEditingController(text: widget.profile.licenseNo);
    final front = widget.profile.driverDocumentByType('driving_license_front');
    final back = widget.profile.driverDocumentByType('driving_license_back');
    _expiry = front?.expiryDate ?? back?.expiryDate;
    _existingFrontId = front?.id;
    _existingBackId = back?.id;
    _existingFrontUrl = front?.fileUrl;
    _existingBackUrl = back?.fileUrl;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      widget.onStateReady(this);
    });
  }

  @override
  void dispose() {
    _licenseCtrl.dispose();
    super.dispose();
  }

  _DrivingLicenseData collect() {
    return _DrivingLicenseData(
      licenseNo: _licenseCtrl.text.trim(),
      frontPath: _front?.path,
      backPath: _back?.path,
      expiryDate: _expiry,
      existingFrontId: _existingFrontId,
      existingBackId: _existingBackId,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const RegFieldLabel('License Number *'),
        SizedBox(height: SizeConfig.r(6)),
        RegField(controller: _licenseCtrl, hintText: 'License number'),
        SizedBox(height: SizeConfig.r(16)),
        const RegFieldLabel('Driving License (Front)'),
        SizedBox(height: SizeConfig.r(6)),
        EditUploadBox(
          newFile: _front,
          existingUrl: _existingFrontUrl,
          onPick: () async {
            final file = await pickDocumentFile();
            if (file != null) setState(() => _front = file);
          },
          onClearNew: () => setState(() => _front = null),
        ),
        SizedBox(height: SizeConfig.r(14)),
        const RegFieldLabel('Driving License (Back)'),
        SizedBox(height: SizeConfig.r(6)),
        EditUploadBox(
          newFile: _back,
          existingUrl: _existingBackUrl,
          onPick: () async {
            final file = await pickDocumentFile();
            if (file != null) setState(() => _back = file);
          },
          onClearNew: () => setState(() => _back = null),
        ),
        SizedBox(height: SizeConfig.r(10)),
        ExpiryButton(
          date: _expiry,
          onTap: () async {
            final picked = await pickExpiryDate(context, initial: _expiry);
            if (picked != null) setState(() => _expiry = picked);
          },
          formatDate: formatEditDate,
        ),
        SizedBox(height: SizeConfig.r(6)),
        const ManualEntryHint(),
      ],
    );
  }
}

class _DbsDocumentData {
  final String? dbsServiceUpdateId;
  final String? frontPath;
  final String? backPath;
  final DateTime? expiryDate;
  final String? existingFrontId;
  final String? existingBackId;

  const _DbsDocumentData({
    required this.dbsServiceUpdateId,
    required this.frontPath,
    required this.backPath,
    required this.expiryDate,
    required this.existingFrontId,
    required this.existingBackId,
  });
}

class _DbsDocumentSection extends StatefulWidget {
  const _DbsDocumentSection({
    super.key,
    required this.profile,
    required this.onStateReady,
  });

  final DriverProfileModel profile;
  final void Function(_DbsDocumentSectionState state) onStateReady;

  @override
  State<_DbsDocumentSection> createState() => _DbsDocumentSectionState();
}

class _DbsDocumentSectionState extends State<_DbsDocumentSection> {
  late final TextEditingController _dbsIdCtrl;
  PlatformFile? _front;
  PlatformFile? _back;
  DateTime? _expiry;
  String? _existingFrontId;
  String? _existingBackId;
  String? _existingFrontUrl;
  String? _existingBackUrl;

  @override
  void initState() {
    super.initState();
    _dbsIdCtrl =
        TextEditingController(text: widget.profile.dbsServiceUpdateId ?? '');
    final front = widget.profile.driverDocumentByType('dbs_certificate_front');
    final back = widget.profile.driverDocumentByType('dbs_certificate_back');
    _expiry = front?.expiryDate ?? back?.expiryDate;
    _existingFrontId = front?.id;
    _existingBackId = back?.id;
    _existingFrontUrl = front?.fileUrl;
    _existingBackUrl = back?.fileUrl;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      widget.onStateReady(this);
    });
  }

  @override
  void dispose() {
    _dbsIdCtrl.dispose();
    super.dispose();
  }

  _DbsDocumentData collect() {
    return _DbsDocumentData(
      dbsServiceUpdateId: _dbsIdCtrl.text.trim(),
      frontPath: _front?.path,
      backPath: _back?.path,
      expiryDate: _expiry,
      existingFrontId: _existingFrontId,
      existingBackId: _existingBackId,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const RegFieldLabel('DBS Service Update ID *'),
        SizedBox(height: SizeConfig.r(6)),
        RegField(controller: _dbsIdCtrl, hintText: 'DBS service update ID'),
        SizedBox(height: SizeConfig.r(16)),
        const RegFieldLabel('DBS Certificate (Front)'),
        SizedBox(height: SizeConfig.r(6)),
        EditUploadBox(
          newFile: _front,
          existingUrl: _existingFrontUrl,
          onPick: () async {
            final file = await pickDocumentFile();
            if (file != null) setState(() => _front = file);
          },
          onClearNew: () => setState(() => _front = null),
        ),
        SizedBox(height: SizeConfig.r(14)),
        const RegFieldLabel('DBS Certificate (Back)'),
        SizedBox(height: SizeConfig.r(6)),
        EditUploadBox(
          newFile: _back,
          existingUrl: _existingBackUrl,
          onPick: () async {
            final file = await pickDocumentFile();
            if (file != null) setState(() => _back = file);
          },
          onClearNew: () => setState(() => _back = null),
        ),
        SizedBox(height: SizeConfig.r(10)),
        ExpiryButton(
          date: _expiry,
          onTap: () async {
            final picked = await pickExpiryDate(context, initial: _expiry);
            if (picked != null) setState(() => _expiry = picked);
          },
          formatDate: formatEditDate,
        ),
        SizedBox(height: SizeConfig.r(6)),
        const ManualEntryHint(),
      ],
    );
  }
}

class _SingleDriverDocumentData {
  final String documentType;
  final String? localPath;
  final DateTime? expiryDate;
  final String? existingDocId;

  const _SingleDriverDocumentData({
    required this.documentType,
    required this.localPath,
    required this.expiryDate,
    required this.existingDocId,
  });
}

class _SingleDriverDocumentSection extends StatefulWidget {
  const _SingleDriverDocumentSection({
    super.key,
    required this.profile,
    required this.documentType,
    required this.label,
    required this.showExpiry,
    required this.onStateReady,
  });

  final DriverProfileModel profile;
  final String documentType;
  final String label;
  final bool showExpiry;
  final void Function(_SingleDriverDocumentSectionState state) onStateReady;

  @override
  State<_SingleDriverDocumentSection> createState() =>
      _SingleDriverDocumentSectionState();
}

class _SingleDriverDocumentSectionState
    extends State<_SingleDriverDocumentSection> {
  PlatformFile? _picked;
  DateTime? _expiry;
  String? _existingDocId;
  String? _existingFileUrl;

  @override
  void initState() {
    super.initState();
    final existing = widget.profile.driverDocumentByType(widget.documentType);
    _expiry = existing?.expiryDate;
    _existingDocId = existing?.id;
    _existingFileUrl = existing?.fileUrl;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      widget.onStateReady(this);
    });
  }

  _SingleDriverDocumentData collect() {
    return _SingleDriverDocumentData(
      documentType: widget.documentType,
      localPath: _picked?.path,
      expiryDate: _expiry,
      existingDocId: _existingDocId,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        RegFieldLabel(widget.label),
        SizedBox(height: SizeConfig.r(6)),
        EditUploadBox(
          newFile: _picked,
          existingUrl: _existingFileUrl,
          onPick: () async {
            final file = await pickDocumentFile();
            if (file != null) setState(() => _picked = file);
          },
          onClearNew: () => setState(() => _picked = null),
        ),
        if (widget.showExpiry) ...[
          SizedBox(height: SizeConfig.r(10)),
          ExpiryButton(
            date: _expiry,
            onTap: () async {
              final picked = await pickExpiryDate(context, initial: _expiry);
              if (picked != null) setState(() => _expiry = picked);
            },
            formatDate: formatEditDate,
          ),
          SizedBox(height: SizeConfig.r(6)),
          const ManualEntryHint(),
        ],
      ],
    );
  }
}

class _PairedVehicleDocumentData {
  final String frontType;
  final String backType;
  final String? frontPath;
  final String? backPath;
  final String? existingFrontId;
  final String? existingBackId;

  const _PairedVehicleDocumentData({
    required this.frontType,
    required this.backType,
    required this.frontPath,
    required this.backPath,
    required this.existingFrontId,
    required this.existingBackId,
  });
}

class _PairedVehicleDocumentSection extends StatefulWidget {
  const _PairedVehicleDocumentSection({
    super.key,
    required this.profile,
    required this.frontLabel,
    required this.backLabel,
    required this.frontType,
    required this.backType,
    required this.onStateReady,
  });

  final DriverProfileModel profile;
  final String frontLabel;
  final String backLabel;
  final String frontType;
  final String backType;
  final void Function(_PairedVehicleDocumentSectionState state) onStateReady;

  @override
  State<_PairedVehicleDocumentSection> createState() =>
      _PairedVehicleDocumentSectionState();
}

class _PairedVehicleDocumentSectionState
    extends State<_PairedVehicleDocumentSection> {
  PlatformFile? _front;
  PlatformFile? _back;
  String? _existingFrontId;
  String? _existingBackId;
  String? _existingFrontUrl;
  String? _existingBackUrl;

  @override
  void initState() {
    super.initState();
    final front = widget.profile.vehicleDocumentByType(widget.frontType);
    final back = widget.profile.vehicleDocumentByType(widget.backType);
    _existingFrontId = front?.id;
    _existingBackId = back?.id;
    _existingFrontUrl = front?.fileUrl;
    _existingBackUrl = back?.fileUrl;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      widget.onStateReady(this);
    });
  }

  _PairedVehicleDocumentData collect() {
    return _PairedVehicleDocumentData(
      frontType: widget.frontType,
      backType: widget.backType,
      frontPath: _front?.path,
      backPath: _back?.path,
      existingFrontId: _existingFrontId,
      existingBackId: _existingBackId,
    );
  }

  @override
  Widget build(BuildContext context) {
    if (widget.profile.vehicle == null) {
      return Text(
        'No vehicle is assigned. V5 documents cannot be updated yet.',
        style: TextStyle(fontSize: SizeConfig.sp(14), color: AppColors.textMedium),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        RegFieldLabel(widget.frontLabel),
        SizedBox(height: SizeConfig.r(6)),
        EditUploadBox(
          newFile: _front,
          existingUrl: _existingFrontUrl,
          onPick: () async {
            final file = await pickDocumentFile();
            if (file != null) setState(() => _front = file);
          },
          onClearNew: () => setState(() => _front = null),
        ),
        SizedBox(height: SizeConfig.r(14)),
        RegFieldLabel(widget.backLabel),
        SizedBox(height: SizeConfig.r(6)),
        EditUploadBox(
          newFile: _back,
          existingUrl: _existingBackUrl,
          onPick: () async {
            final file = await pickDocumentFile();
            if (file != null) setState(() => _back = file);
          },
          onClearNew: () => setState(() => _back = null),
        ),
      ],
    );
  }
}

class _SingleVehicleDocumentData {
  final String documentType;
  final String? localPath;
  final DateTime? expiryDate;
  final String? existingDocId;

  const _SingleVehicleDocumentData({
    required this.documentType,
    required this.localPath,
    required this.expiryDate,
    required this.existingDocId,
  });
}

class _SingleVehicleDocumentSection extends StatefulWidget {
  const _SingleVehicleDocumentSection({
    super.key,
    required this.profile,
    required this.documentType,
    required this.label,
    required this.showExpiry,
    required this.onStateReady,
  });

  final DriverProfileModel profile;
  final String documentType;
  final String label;
  final bool showExpiry;
  final void Function(_SingleVehicleDocumentSectionState state) onStateReady;

  @override
  State<_SingleVehicleDocumentSection> createState() =>
      _SingleVehicleDocumentSectionState();
}

class _SingleVehicleDocumentSectionState
    extends State<_SingleVehicleDocumentSection> {
  PlatformFile? _picked;
  DateTime? _expiry;
  String? _existingDocId;
  String? _existingFileUrl;

  @override
  void initState() {
    super.initState();
    final existing = widget.profile.vehicleDocumentByType(widget.documentType);
    _expiry = existing?.expiryDate;
    _existingDocId = existing?.id;
    _existingFileUrl = existing?.fileUrl;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      widget.onStateReady(this);
    });
  }

  _SingleVehicleDocumentData collect() {
    return _SingleVehicleDocumentData(
      documentType: widget.documentType,
      localPath: _picked?.path,
      expiryDate: _expiry,
      existingDocId: _existingDocId,
    );
  }

  @override
  Widget build(BuildContext context) {
    if (widget.profile.vehicle == null) {
      return Text(
        'No vehicle is assigned. This document cannot be updated yet.',
        style: TextStyle(fontSize: SizeConfig.sp(14), color: AppColors.textMedium),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        RegFieldLabel(widget.label),
        SizedBox(height: SizeConfig.r(6)),
        EditUploadBox(
          newFile: _picked,
          existingUrl: _existingFileUrl,
          onPick: () async {
            final file = await pickDocumentFile();
            if (file != null) setState(() => _picked = file);
          },
          onClearNew: () => setState(() => _picked = null),
          hint: 'Upload document (PDF or image)',
        ),
        if (widget.showExpiry) ...[
          SizedBox(height: SizeConfig.r(10)),
          ExpiryButton(
            date: _expiry,
            onTap: () async {
              final picked = await pickExpiryDate(context, initial: _expiry);
              if (picked != null) setState(() => _expiry = picked);
            },
            formatDate: formatEditDate,
          ),
          SizedBox(height: SizeConfig.r(6)),
          const ManualEntryHint(),
        ],
      ],
    );
  }
}

class _TaxiLicensePlateData {
  final String plateNumber;
  final String? localPath;
  final DateTime? expiryDate;
  final String? existingDocId;

  const _TaxiLicensePlateData({
    required this.plateNumber,
    required this.localPath,
    required this.expiryDate,
    required this.existingDocId,
  });
}

class _TaxiLicensePlateSection extends StatefulWidget {
  const _TaxiLicensePlateSection({
    super.key,
    required this.profile,
    required this.onStateReady,
  });

  final DriverProfileModel profile;
  final void Function(_TaxiLicensePlateSectionState state) onStateReady;

  @override
  State<_TaxiLicensePlateSection> createState() =>
      _TaxiLicensePlateSectionState();
}

class _TaxiLicensePlateSectionState extends State<_TaxiLicensePlateSection> {
  late final TextEditingController _plateCtrl;
  PlatformFile? _picked;
  DateTime? _expiry;
  String? _existingDocId;
  String? _existingFileUrl;

  @override
  void initState() {
    super.initState();
    _plateCtrl = TextEditingController(
      text: widget.profile.vehicle?.taxiLicensePlateNumber ?? '',
    );
    final existing = widget.profile.vehicleDocumentByType('taxi_license_plate');
    _expiry = existing?.expiryDate;
    _existingDocId = existing?.id;
    _existingFileUrl = existing?.fileUrl;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      widget.onStateReady(this);
    });
  }

  @override
  void dispose() {
    _plateCtrl.dispose();
    super.dispose();
  }

  _TaxiLicensePlateData collect() {
    return _TaxiLicensePlateData(
      plateNumber: _plateCtrl.text.trim(),
      localPath: _picked?.path,
      expiryDate: _expiry,
      existingDocId: _existingDocId,
    );
  }

  @override
  Widget build(BuildContext context) {
    if (widget.profile.vehicle == null) {
      return Text(
        'No vehicle is assigned. Taxi license plate cannot be updated yet.',
        style: TextStyle(fontSize: SizeConfig.sp(14), color: AppColors.textMedium),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const RegFieldLabel('Taxi License Plate Number *'),
        SizedBox(height: SizeConfig.r(6)),
        RegField(controller: _plateCtrl, hintText: 'Plate number'),
        SizedBox(height: SizeConfig.r(16)),
        const RegFieldLabel('Taxi License Plate Document'),
        SizedBox(height: SizeConfig.r(6)),
        EditUploadBox(
          newFile: _picked,
          existingUrl: _existingFileUrl,
          onPick: () async {
            final file = await pickDocumentFile();
            if (file != null) setState(() => _picked = file);
          },
          onClearNew: () => setState(() => _picked = null),
        ),
        SizedBox(height: SizeConfig.r(10)),
        ExpiryButton(
          date: _expiry,
          onTap: () async {
            final picked = await pickExpiryDate(context, initial: _expiry);
            if (picked != null) setState(() => _expiry = picked);
          },
          formatDate: formatEditDate,
        ),
        SizedBox(height: SizeConfig.r(6)),
        const ManualEntryHint(),
      ],
    );
  }
}

class _VehiclePhotoSection extends StatefulWidget {
  const _VehiclePhotoSection({
    super.key,
    required this.profile,
    required this.onStateReady,
  });

  final DriverProfileModel profile;
  final void Function(_VehiclePhotoSectionState state) onStateReady;

  @override
  State<_VehiclePhotoSection> createState() => _VehiclePhotoSectionState();
}

class _VehiclePhotoSectionState extends State<_VehiclePhotoSection> {
  PlatformFile? _picked;
  String? get pickedPath => _picked?.path;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      widget.onStateReady(this);
    });
  }

  Future<void> _pick() async {
    final file = await pickImageFile();
    if (file != null) setState(() => _picked = file);
  }

  @override
  Widget build(BuildContext context) {
    if (widget.profile.vehicle == null) {
      return Text(
        'No vehicle is assigned. Vehicle photo cannot be updated yet.',
        style: TextStyle(fontSize: SizeConfig.sp(14), color: AppColors.textMedium),
      );
    }

    final existingUrl = widget.profile.vehicle?.vehiclePhotoUrl ??
        widget.profile.vehicleDocumentByType('vehicle_photo')?.fileUrl;
    final pickedPath = _picked?.path;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Upload a clear photo of your vehicle.',
          style: TextStyle(fontSize: SizeConfig.sp(14), color: AppColors.textMedium),
        ),
        SizedBox(height: SizeConfig.r(20)),
        if (pickedPath != null || (existingUrl ?? '').isNotEmpty)
          Center(
            child: ClipRRect(
              borderRadius: BorderRadius.circular(SizeConfig.radius),
              child: SizedBox(
                width: double.infinity,
                height: SizeConfig.r(160),
                child: pickedPath != null
                    ? Image.file(File(pickedPath), fit: BoxFit.cover)
                    : Image.network(
                        existingUrl!,
                        fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) => _placeholder(),
                      ),
              ),
            ),
          ),
        if (pickedPath != null || (existingUrl ?? '').isNotEmpty)
          SizedBox(height: SizeConfig.r(16)),
        EditUploadBox(
          newFile: _picked,
          existingUrl: existingUrl,
          onPick: _pick,
          onClearNew: () => setState(() => _picked = null),
          hint: 'Tap to choose photo (JPG or PNG)',
        ),
      ],
    );
  }

  Widget _placeholder() {
    return ColoredBox(
      color: const Color(0xFFE8EEF5),
      child: Icon(
        Icons.directions_car_outlined,
        size: SizeConfig.r(52),
        color: const Color(0xFFB0BEC5),
      ),
    );
  }
}
