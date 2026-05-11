import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import '../models/passenger_assistant_register_data.dart';
import '../../driver/components/register_widgets.dart';
import '../../../../utils/app_colors.dart';
import '../../../../utils/size_confg.dart';
import '../../../../services/auth_service.dart';

class PaStep4OtherEmergency extends StatefulWidget {
  const PaStep4OtherEmergency({
    super.key,
    required this.data,
    required this.onRegistered,
  });

  final PassengerAssistantRegisterData data;
  final VoidCallback onRegistered;

  @override
  State<PaStep4OtherEmergency> createState() => _PaStep4OtherEmergencyState();
}

class _PaStep4OtherEmergencyState extends State<PaStep4OtherEmergency> {
  late final TextEditingController _emergencyNameCtrl;
  late final TextEditingController _emergencyPhoneCtrl;
  final _auth = AuthService();
  bool _loading = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    final d = widget.data;
    _emergencyNameCtrl = TextEditingController(text: d.emergencyContactName);
    _emergencyPhoneCtrl = TextEditingController(text: d.emergencyContactPhone);
  }

  @override
  void dispose() {
    _emergencyNameCtrl.dispose();
    _emergencyPhoneCtrl.dispose();
    super.dispose();
  }

  Future<void> _addOtherCertificate() async {
    final labelCtrl = TextEditingController();
    final label = await showModalBottomSheet<String>(
      context: context,
      isScrollControlled: true,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(
          top: Radius.circular(SizeConfig.r(16)),
        ),
      ),
      builder: (ctx) {
        return Padding(
          padding: EdgeInsets.fromLTRB(
            SizeConfig.hPad,
            SizeConfig.r(24),
            SizeConfig.hPad,
            MediaQuery.of(ctx).viewInsets.bottom + SizeConfig.r(24),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Certificate name',
                style: TextStyle(
                  fontSize: SizeConfig.sp(16),
                  fontWeight: FontWeight.w700,
                  color: AppColors.textDark,
                ),
              ),
              SizedBox(height: SizeConfig.r(6)),
              Text(
                'e.g. English proficiency, epilepsy certificate',
                style: TextStyle(
                  fontSize: SizeConfig.sp(13),
                  color: AppColors.textLight,
                ),
              ),
              SizedBox(height: SizeConfig.r(14)),
              TextField(
                controller: labelCtrl,
                autofocus: true,
                textCapitalization: TextCapitalization.words,
                style: TextStyle(
                  fontSize: SizeConfig.sp(15),
                  color: AppColors.textDark,
                ),
                decoration: InputDecoration(
                  hintText: 'Enter certificate name',
                  hintStyle: TextStyle(
                    fontSize: SizeConfig.sp(15),
                    color: const Color(0xFFB0BEC5),
                  ),
                  filled: true,
                  fillColor: const Color(0xFFF3F7FC),
                  contentPadding: EdgeInsets.symmetric(
                    horizontal: SizeConfig.r(16),
                    vertical: SizeConfig.r(14),
                  ),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(SizeConfig.radius),
                    borderSide: const BorderSide(
                      color: Color(0xFFE0E8F3),
                      width: 1,
                    ),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(SizeConfig.radius),
                    borderSide: const BorderSide(
                      color: Color(0xFFE0E8F3),
                      width: 1,
                    ),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(SizeConfig.radius),
                    borderSide: const BorderSide(
                      color: AppColors.primary,
                      width: 1.5,
                    ),
                  ),
                ),
              ),
              SizedBox(height: SizeConfig.r(16)),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: Colors.white,
                    padding: EdgeInsets.symmetric(vertical: SizeConfig.r(14)),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(SizeConfig.radius),
                    ),
                  ),
                  onPressed: () {
                    final text = labelCtrl.text.trim();
                    if (text.isNotEmpty) Navigator.pop(ctx, text);
                  },
                  child: Text(
                    'Continue to upload',
                    style: TextStyle(
                      fontSize: SizeConfig.sp(15),
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );

    if (label == null || label.isEmpty) return;

    final result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['jpg', 'jpeg', 'png', 'pdf', 'webp'],
      withData: false,
      withReadStream: false,
    );

    if (result != null && result.files.isNotEmpty) {
      setState(() {
        widget.data.otherCertificates.add(
          PaOtherCertificate(label: label, file: result.files.first),
        );
      });
    }
  }

  void _removeOther(int index) {
    setState(() => widget.data.otherCertificates.removeAt(index));
  }

  Future<void> _submit() async {
    final d = widget.data;
    final name = _emergencyNameCtrl.text.trim();
    final phone = _emergencyPhoneCtrl.text.trim();

    if (name.isEmpty || phone.isEmpty) {
      setState(() => _error = 'Emergency contact name and phone are required.');
      return;
    }
    if (d.companyId.trim().isEmpty) {
      setState(() => _error = 'Please complete step 1 and select a company.');
      return;
    }

    d.emergencyContactName = name;
    d.emergencyContactPhone = phone;

    setState(() {
      _loading = true;
      _error = null;
    });

    final result = await _auth.passengerAssistantRegister(
      firstName: d.firstName,
      lastName: d.lastName,
      email: d.email,
      password: d.password,
      companyId: d.companyId,
      companyName: d.companyName,
      countryCode: d.countryCode,
      mobileNumber: d.mobileNumber,
      residentialAddress: d.residentialAddress,
      nationality: d.nationality,
      isBritishPassportHolder: d.britishPassportHolder,
      rightToWorkCode: d.rightToWorkCode,
      emergencyContactName: d.emergencyContactName,
      emergencyContactPhone: d.emergencyContactPhone,
      profilePhotoPath: d.profilePhoto?.path,
      passportNumber: d.passportNumber,
      passportFilePath: d.passportCopy?.path,
      passportExpiry: d.passportExpiry,
      safeguardingFilePath: d.safeguardingCertificate?.path,
      safeguardingExpiry: d.safeguardingExpiry,
      backgroundCheckFilePath: d.backgroundCheckCertificate?.path,
      firstAidFilePath: d.firstAidCertificate?.path,
      otherCertificateLabels:
          d.otherCertificates.map((c) => c.label).toList(),
      otherCertificatePaths: d.otherCertificates
          .map((c) => c.file.path ?? '')
          .toList(),
    );

    if (!mounted) return;

    if (result.success) {
      setState(() => _loading = false);
      widget.onRegistered();
    } else {
      setState(() {
        _loading = false;
        _error = result.error;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    SizeConfig.init(context);
    final d = widget.data;

    return SingleChildScrollView(
      padding: EdgeInsets.fromLTRB(
        SizeConfig.hPad,
        SizeConfig.r(28),
        SizeConfig.hPad,
        SizeConfig.r(32),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Other certificates',
            style: TextStyle(
              fontSize: SizeConfig.sp(22),
              fontWeight: FontWeight.bold,
              color: AppColors.textDark,
            ),
          ),
          SizedBox(height: SizeConfig.r(6)),
          Text(
            'Add optional certificates like English proficiency, epilepsy certificate, etc.',
            style: TextStyle(
              fontSize: SizeConfig.sp(14),
              color: AppColors.textMedium,
            ),
          ),
          SizedBox(height: SizeConfig.r(16)),
          Row(
            children: [
              Expanded(
                child: Text(
                  'Certificates',
                  style: TextStyle(
                    fontSize: SizeConfig.sp(15),
                    fontWeight: FontWeight.w600,
                    color: AppColors.textDark,
                  ),
                ),
              ),
              GestureDetector(
                onTap: _addOtherCertificate,
                child: Container(
                  padding: EdgeInsets.symmetric(
                    horizontal: SizeConfig.r(12),
                    vertical: SizeConfig.r(8),
                  ),
                  decoration: BoxDecoration(
                    color: AppColors.primary.withValues(alpha: 0.08),
                    borderRadius: BorderRadius.circular(SizeConfig.r(8)),
                    border: Border.all(
                      color: AppColors.primary.withValues(alpha: 0.3),
                      width: 1,
                    ),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        Icons.add,
                        color: AppColors.primary,
                        size: SizeConfig.r(16),
                      ),
                      SizedBox(width: SizeConfig.r(4)),
                      Text(
                        'Add',
                        style: TextStyle(
                          fontSize: SizeConfig.sp(13),
                          fontWeight: FontWeight.w600,
                          color: AppColors.primary,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
          SizedBox(height: SizeConfig.r(12)),
          if (d.otherCertificates.isEmpty)
            Container(
              width: double.infinity,
              padding: EdgeInsets.symmetric(
                vertical: SizeConfig.r(18),
                horizontal: SizeConfig.r(16),
              ),
              decoration: BoxDecoration(
                color: const Color(0xFFF8FAFD),
                borderRadius: BorderRadius.circular(SizeConfig.radius),
                border: Border.all(color: const Color(0xFFD4DEF0), width: 1),
              ),
              child: Column(
                children: [
                  Icon(
                    Icons.folder_open_outlined,
                    color: const Color(0xFFB0BEC5),
                    size: SizeConfig.r(28),
                  ),
                  SizedBox(height: SizeConfig.r(6)),
                  Text(
                    'No additional certificates added',
                    style: TextStyle(
                      fontSize: SizeConfig.sp(13),
                      color: const Color(0xFFB0BEC5),
                    ),
                  ),
                ],
              ),
            )
          else
            ...d.otherCertificates.asMap().entries.map((e) {
              final i = e.key;
              final c = e.value;
              return Padding(
                padding: EdgeInsets.only(bottom: SizeConfig.r(8)),
                child: Container(
                  padding: EdgeInsets.symmetric(
                    horizontal: SizeConfig.r(14),
                    vertical: SizeConfig.r(12),
                  ),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF8FAFD),
                    borderRadius: BorderRadius.circular(SizeConfig.radius),
                    border: Border.all(
                      color: const Color(0xFFD4DEF0),
                      width: 1,
                    ),
                  ),
                  child: Row(
                    children: [
                      Icon(
                        Icons.check_circle_outline,
                        color: AppColors.success,
                        size: SizeConfig.r(22),
                      ),
                      SizedBox(width: SizeConfig.r(12)),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              c.label,
                              style: TextStyle(
                                fontSize: SizeConfig.sp(14),
                                fontWeight: FontWeight.w600,
                                color: AppColors.textDark,
                              ),
                            ),
                            Text(
                              c.file.name,
                              style: TextStyle(
                                fontSize: SizeConfig.sp(12),
                                color: AppColors.textLight,
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ),
                      ),
                      GestureDetector(
                        onTap: () => _removeOther(i),
                        child: Icon(
                          Icons.close,
                          color: AppColors.textLight,
                          size: SizeConfig.r(20),
                        ),
                      ),
                    ],
                  ),
                ),
              );
            }),
          SizedBox(height: SizeConfig.r(32)),
          Text(
            'Emergency contact',
            style: TextStyle(
              fontSize: SizeConfig.sp(22),
              fontWeight: FontWeight.bold,
              color: AppColors.textDark,
            ),
          ),
          SizedBox(height: SizeConfig.r(6)),
          Text(
            'Provide an emergency contact for the assistant.',
            style: TextStyle(
              fontSize: SizeConfig.sp(14),
              color: AppColors.textMedium,
            ),
          ),
          SizedBox(height: SizeConfig.r(18)),
          const RegFieldLabel('Contact full name *'),
          SizedBox(height: SizeConfig.r(6)),
          RegField(
            controller: _emergencyNameCtrl,
            hintText: 'e.g. John Smith',
            keyboardType: TextInputType.name,
          ),
          SizedBox(height: SizeConfig.r(18)),
          const RegFieldLabel('Contact phone number *'),
          SizedBox(height: SizeConfig.r(6)),
          RegField(
            controller: _emergencyPhoneCtrl,
            hintText: 'e.g. 7700 900456',
            keyboardType: TextInputType.phone,
          ),
          if (_error != null) ...[
            SizedBox(height: SizeConfig.r(16)),
            Text(
              _error!,
              style: TextStyle(
                fontSize: SizeConfig.sp(13),
                color: AppColors.error,
              ),
            ),
          ],
          SizedBox(height: SizeConfig.r(36)),
          NextStepButton(
            label: 'Register',
            isLoading: _loading,
            onTap: _loading ? null : _submit,
          ),
        ],
      ),
    );
  }
}
