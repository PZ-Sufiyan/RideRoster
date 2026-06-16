import 'dart:io';

import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../../components/app_button.dart';
import '../../../../model/pa_profile_model.dart';
import '../../../../providers/connectivity_provider.dart';
import '../../../../providers/pa_profile_provider.dart';
import '../../../../services/pa_profile_edit_service.dart';
import '../../../../utils/app_colors.dart';
import '../../../../utils/size_confg.dart';
import '../../../auth/componenet/register_widgets.dart';
import '../../../driver/pages/profile/edit_profile.dart' show EditProfileOfflineGate;
import '../../../driver/pages/profile/edit_upload_box.dart';

enum PaProfileEditSection {
  profilePhoto,
  personalInfo,
  documentPassport,
  documentSafeguarding,
  documentBackgroundCheck,
  documentFirstAid,
}

class PaEditProfileArgs {
  const PaEditProfileArgs({required this.section});

  final PaProfileEditSection section;
}

void showPaEditProfileRequiresInternetMessage(BuildContext context) {
  ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(
      content: const Text('Connect to the internet to edit your profile.'),
      behavior: SnackBarBehavior.floating,
      backgroundColor: AppColors.textDark,
    ),
  );
}

class PaEditProfilePage extends StatefulWidget {
  const PaEditProfilePage({super.key, required this.args});

  final PaEditProfileArgs args;

  @override
  State<PaEditProfilePage> createState() => _PaEditProfilePageState();
}

class _PaEditProfilePageState extends State<PaEditProfilePage> {
  final _editService = PaProfileEditService();
  bool _isSaving = false;
  String? _error;

  PaProfileModel? get _profile => context.read<PaProfileProvider>().profile;

  String get _title {
    switch (widget.args.section) {
      case PaProfileEditSection.profilePhoto:
        return 'Profile Picture';
      case PaProfileEditSection.personalInfo:
        return 'Personal Information';
      case PaProfileEditSection.documentPassport:
        return 'Passport / ID';
      case PaProfileEditSection.documentSafeguarding:
        return 'Safeguarding Certificate';
      case PaProfileEditSection.documentBackgroundCheck:
        return 'Background Check Certificate';
      case PaProfileEditSection.documentFirstAid:
        return 'First Aid Certification';
    }
  }

  Future<void> _runSave(Future<void> Function() action) async {
    if (!context.read<ConnectivityProvider>().isOnline) {
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
      await context.read<PaProfileProvider>().loadProfile(forceRefresh: true);
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

  Widget _buildSectionBody(PaProfileModel profile) {
    switch (widget.args.section) {
      case PaProfileEditSection.profilePhoto:
        return _ProfilePhotoSection(
          key: const ValueKey('profile_photo'),
          profile: profile,
          onStateReady: (state) => _profilePhotoState = state,
        );
      case PaProfileEditSection.personalInfo:
        return _PersonalInfoSection(
          key: const ValueKey('personal_info'),
          profile: profile,
          onStateReady: (state) => _personalInfoState = state,
        );
      case PaProfileEditSection.documentPassport:
        return _PassportDocumentSection(
          key: const ValueKey('passport'),
          profile: profile,
          onStateReady: (state) => _passportState = state,
        );
      case PaProfileEditSection.documentSafeguarding:
        return _SingleDocumentSection(
          key: const ValueKey('safeguarding'),
          profile: profile,
          documentType: 'safeguarding_certificate',
          label: 'Safeguarding Certificate',
          showExpiry: true,
          onStateReady: (state) => _singleDocState = state,
        );
      case PaProfileEditSection.documentBackgroundCheck:
        return _SingleDocumentSection(
          key: const ValueKey('background_check'),
          profile: profile,
          documentType: 'background_check',
          label: 'Background Check Certificate',
          showExpiry: false,
          onStateReady: (state) => _singleDocState = state,
        );
      case PaProfileEditSection.documentFirstAid:
        return _SingleDocumentSection(
          key: const ValueKey('first_aid'),
          profile: profile,
          documentType: 'first_aid_certificate',
          label: 'First Aid Certification',
          showExpiry: false,
          onStateReady: (state) => _singleDocState = state,
        );
    }
  }

  _ProfilePhotoSectionState? _profilePhotoState;
  _PersonalInfoSectionState? _personalInfoState;
  _PassportDocumentSectionState? _passportState;
  _SingleDocumentSectionState? _singleDocState;

  Future<void> _onSave() async {
    switch (widget.args.section) {
      case PaProfileEditSection.profilePhoto:
        final path = _profilePhotoState?.pickedPath;
        if (path == null || path.isEmpty) {
          setState(() => _error = 'Please select a profile picture.');
          return;
        }
        await _runSave(
          () => _editService.updateProfilePicture(localPath: path),
        );
      case PaProfileEditSection.personalInfo:
        final data = _personalInfoState?.collect();
        if (data == null) return;
        await _runSave(() => _editService.updatePersonalInfo(
              firstName: data.firstName,
              surname: data.surname,
              phone: data.phone,
              residentialAddress: data.residentialAddress,
              emergencyContactName: data.emergencyContactName,
              emergencyContactPhone: data.emergencyContactPhone,
              nationality: data.nationality,
              rightToWorkCode: data.rightToWorkCode,
              passportNumber: data.passportNumber,
            ));
      case PaProfileEditSection.documentPassport:
        final data = _passportState?.collect();
        if (data == null) return;
        await _runSave(() => _editService.updatePassportSection(
              passportNumber: data.passportNumber,
              localPath: data.localPath,
              existingDocId: data.existingDocId,
            ));
      case PaProfileEditSection.documentSafeguarding:
        final data = _singleDocState?.collect();
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
        await _runSave(() => _editService.upsertDocument(
              documentType: data.documentType,
              localPath: data.localPath,
              expiryDate: data.expiryDate,
              existingDocId: data.existingDocId,
            ));
      case PaProfileEditSection.documentBackgroundCheck:
      case PaProfileEditSection.documentFirstAid:
        final data = _singleDocState?.collect();
        if (data == null) return;
        if (data.localPath == null && data.existingDocId == null) {
          setState(() => _error = 'Please upload a document file.');
          return;
        }
        await _runSave(() => _editService.upsertDocument(
              documentType: data.documentType,
              localPath: data.localPath,
              existingDocId: data.existingDocId,
            ));
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared helpers
// ─────────────────────────────────────────────────────────────────────────────

Future<PlatformFile?> _pickImageFile() async {
  final result = await FilePicker.platform.pickFiles(
    type: FileType.image,
    allowMultiple: false,
    withData: false,
    withReadStream: false,
  );
  if (result == null || result.files.isEmpty) return null;
  return result.files.first;
}

Future<PlatformFile?> _pickDocumentFile() async {
  final result = await FilePicker.platform.pickFiles(
    type: FileType.custom,
    allowedExtensions: ['jpg', 'jpeg', 'png', 'pdf'],
    withData: false,
    withReadStream: false,
  );
  if (result == null || result.files.isEmpty) return null;
  return result.files.first;
}

String _formatEditDate(DateTime d) {
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

  final PaProfileModel profile;
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
    final file = await _pickImageFile();
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
  final String surname;
  final String phone;
  final String residentialAddress;
  final String emergencyContactName;
  final String emergencyContactPhone;
  final String? passportNumber;
  final String nationality;
  final String? rightToWorkCode;

  const _PersonalInfoData({
    required this.firstName,
    required this.surname,
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

  final PaProfileModel profile;
  final void Function(_PersonalInfoSectionState state) onStateReady;

  @override
  State<_PersonalInfoSection> createState() => _PersonalInfoSectionState();
}

class _PersonalInfoSectionState extends State<_PersonalInfoSection> {
  late final TextEditingController _firstNameCtrl;
  late final TextEditingController _surnameCtrl;
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
    _surnameCtrl = TextEditingController(text: p.surname);
    _phoneCtrl = TextEditingController(text: p.phone);
    _addressCtrl = TextEditingController(text: p.residentialAddress ?? '');
    _emergencyNameCtrl =
        TextEditingController(text: p.emergencyContactName ?? '');
    _emergencyPhoneCtrl =
        TextEditingController(text: p.emergencyContactPhone ?? '');
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
    _surnameCtrl.dispose();
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
      surname: _surnameCtrl.text.trim(),
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
        const RegFieldLabel('Surname *'),
        SizedBox(height: SizeConfig.r(6)),
        RegField(controller: _surnameCtrl, hintText: 'Surname'),
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
            hintText: 'Right to work share code',
          ),
        ],
      ],
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Passport
// ─────────────────────────────────────────────────────────────────────────────

class _PassportDocumentData {
  final String passportNumber;
  final String? localPath;
  final String? existingDocId;

  const _PassportDocumentData({
    required this.passportNumber,
    required this.localPath,
    required this.existingDocId,
  });
}

class _PassportDocumentSection extends StatefulWidget {
  const _PassportDocumentSection({
    super.key,
    required this.profile,
    required this.onStateReady,
  });

  final PaProfileModel profile;
  final void Function(_PassportDocumentSectionState state) onStateReady;

  @override
  State<_PassportDocumentSection> createState() =>
      _PassportDocumentSectionState();
}

class _PassportDocumentSectionState extends State<_PassportDocumentSection> {
  late final TextEditingController _passportCtrl;
  PlatformFile? _picked;
  String? _existingDocId;
  String? _existingFileUrl;

  @override
  void initState() {
    super.initState();
    final p = widget.profile;
    _passportCtrl = TextEditingController(text: p.passportNumber ?? '');
    final existing = p.documentByType('passport');
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
      existingDocId: _existingDocId,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Provide passport ID and document copy.',
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
            final file = await _pickDocumentFile();
            if (file != null) setState(() => _picked = file);
          },
          onClearNew: () => setState(() => _picked = null),
          hint: 'Upload passport copy (PDF or image)',
        ),
      ],
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Single document (safeguarding, background check, first aid)
// ─────────────────────────────────────────────────────────────────────────────

class _SingleDocumentData {
  final String documentType;
  final String? localPath;
  final DateTime? expiryDate;
  final String? existingDocId;

  const _SingleDocumentData({
    required this.documentType,
    required this.localPath,
    required this.expiryDate,
    required this.existingDocId,
  });
}

class _SingleDocumentSection extends StatefulWidget {
  const _SingleDocumentSection({
    super.key,
    required this.profile,
    required this.documentType,
    required this.label,
    required this.showExpiry,
    required this.onStateReady,
  });

  final PaProfileModel profile;
  final String documentType;
  final String label;
  final bool showExpiry;
  final void Function(_SingleDocumentSectionState state) onStateReady;

  @override
  State<_SingleDocumentSection> createState() => _SingleDocumentSectionState();
}

class _SingleDocumentSectionState extends State<_SingleDocumentSection> {
  PlatformFile? _picked;
  DateTime? _expiry;
  String? _existingDocId;
  String? _existingFileUrl;

  @override
  void initState() {
    super.initState();
    final existing = widget.profile.documentByType(widget.documentType);
    _expiry = existing?.expiryDate;
    _existingDocId = existing?.id;
    _existingFileUrl = existing?.fileUrl;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      widget.onStateReady(this);
    });
  }

  _SingleDocumentData collect() {
    return _SingleDocumentData(
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
            final file = await _pickDocumentFile();
            if (file != null) setState(() => _picked = file);
          },
          onClearNew: () => setState(() => _picked = null),
        ),
        if (widget.showExpiry) ...[
          SizedBox(height: SizeConfig.r(10)),
          ExpiryButton(
            date: _expiry,
            onDatePicked: (picked) => setState(() => _expiry = picked),
            formatDate: _formatEditDate,
          ),
          SizedBox(height: SizeConfig.r(6)),
          const ManualEntryHint(),
        ],
      ],
    );
  }
}
