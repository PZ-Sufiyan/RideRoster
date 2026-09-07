import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import '../../../model/passenger_assistant_register_data.dart';
import 'register_widgets.dart';
import '../../../../utils/app_colors.dart';
import '../../../../utils/driver_register_validators.dart';
import '../../../../utils/size_confg.dart';

class PaStep3Documents extends StatefulWidget {
  const PaStep3Documents({super.key, required this.data, required this.onNext});

  final PassengerAssistantRegisterData data;
  final VoidCallback onNext;

  @override
  State<PaStep3Documents> createState() => _PaStep3DocumentsState();
}

class _PaStep3DocumentsState extends State<PaStep3Documents> {
  String? _formError;

  Future<void> _pickFile(void Function(PlatformFile f) onPicked) async {
    final result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['jpg', 'jpeg', 'png', 'pdf', 'webp'],
      withData: false,
      withReadStream: false,
    );
    if (result != null && result.files.isNotEmpty) {
      setState(() {
        onPicked(result.files.first);
        _formError = null;
      });
    }
  }

  String _fmt(DateTime d) {
    final day = d.day.toString().padLeft(2, '0');
    final month = d.month.toString().padLeft(2, '0');
    return '$day/$month/${d.year}';
  }

  void _saveAndNext() {
    final docsError =
        DriverRegisterValidators.validatePaStep3Documents(widget.data);
    if (docsError != null) {
      setState(() => _formError = docsError);
      return;
    }
    setState(() => _formError = null);
    widget.onNext();
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
            'Documents',
            style: TextStyle(
              fontSize: SizeConfig.sp(26),
              fontWeight: FontWeight.bold,
              color: AppColors.textDark,
            ),
          ),
          SizedBox(height: SizeConfig.r(6)),
          Text(
            'Upload each file and enter the expiry date yourself.',
            style: TextStyle(
              fontSize: SizeConfig.sp(14),
              color: AppColors.textMedium,
            ),
          ),
          SizedBox(height: SizeConfig.r(22)),
          RegDocumentCard(
            title: 'Passport',
            optional: true,
            file: d.passportCopy,
            onUpload: () => _pickFile((f) => d.passportCopy = f),
            expiry: d.passportExpiry,
            onExpiryPicked: (dt) => setState(() {
              d.passportExpiry = dt;
              _formError = null;
            }),
            formatDate: _fmt,
            errorText: d.passportCopy != null && d.passportExpiry == null
                ? 'Enter the expiry date'
                : null,
          ),
          SizedBox(height: SizeConfig.r(14)),
          RegDocumentCard(
            title: 'Safeguarding certificate',
            file: d.safeguardingCertificate,
            onUpload: () => _pickFile((f) => d.safeguardingCertificate = f),
            expiry: d.safeguardingExpiry,
            onExpiryPicked: (dt) => setState(() {
              d.safeguardingExpiry = dt;
              _formError = null;
            }),
            formatDate: _fmt,
          ),
          SizedBox(height: SizeConfig.r(14)),
          RegDocumentCard(
            title: 'Background check',
            file: d.backgroundCheckCertificate,
            onUpload: () =>
                _pickFile((f) => d.backgroundCheckCertificate = f),
          ),
          SizedBox(height: SizeConfig.r(14)),
          RegDocumentCard(
            title: 'First aid certificate',
            file: d.firstAidCertificate,
            onUpload: () => _pickFile((f) => d.firstAidCertificate = f),
          ),
          if (_formError != null) ...[
            SizedBox(height: SizeConfig.r(14)),
            Text(
              _formError!,
              style: TextStyle(
                fontSize: SizeConfig.sp(13),
                color: AppColors.error,
              ),
            ),
          ],
          SizedBox(height: SizeConfig.spaceLG),
          NextStepButton(onTap: _saveAndNext),
        ],
      ),
    );
  }
}
