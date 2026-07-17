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
  Future<void> _pickFile(void Function(PlatformFile f) onPicked) async {
    final result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['jpg', 'jpeg', 'png', 'pdf', 'webp'],
      withData: false,
      withReadStream: false,
    );
    if (result != null && result.files.isNotEmpty) {
      setState(() => onPicked(result.files.first));
    }
  }

  String _fmt(DateTime d) {
    final day = d.day.toString().padLeft(2, '0');
    final month = d.month.toString().padLeft(2, '0');
    return '$day/$month/${d.year}';
  }

  String? _formError;

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
            'Documents & Certifications',
            style: TextStyle(
              fontSize: SizeConfig.sp(26),
              fontWeight: FontWeight.bold,
              color: AppColors.textDark,
            ),
          ),
          SizedBox(height: SizeConfig.r(6)),
          Text(
            'Upload documents as needed. Accepted: PDF, JPG, PNG, WEBP. '
            'Passport and safeguarding require an expiry date when a file is uploaded.',
            style: TextStyle(
              fontSize: SizeConfig.sp(14),
              color: AppColors.textMedium,
            ),
          ),
          SizedBox(height: SizeConfig.r(24)),
          const RegFieldLabel('Passport copy (PDF or image)'),
          SizedBox(height: SizeConfig.r(6)),
          UploadBox(
            file: d.passportCopy,
            onTap: () => _pickFile((f) => d.passportCopy = f),
            subLabel: 'Passport copy (PDF or image)',
          ),
          SizedBox(height: SizeConfig.r(10)),
          ExpiryButton(
            date: d.passportExpiry,
            onDatePicked: (dt) => setState(() => d.passportExpiry = dt),
            formatDate: _fmt,
          ),
          SizedBox(height: SizeConfig.r(6)),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Checkbox(
                value: d.passportExpiryEnteredManually,
                onChanged: (v) {
                  setState(() {
                    d.passportExpiryEnteredManually = v ?? false;
                  });
                },
                materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                visualDensity: VisualDensity.compact,
              ),
              Expanded(
                child: Padding(
                  padding: EdgeInsets.only(top: SizeConfig.r(10)),
                  child: Text(
                    'Enter expiry manually; it is not read from the file.',
                    style: TextStyle(
                      fontSize: SizeConfig.sp(13),
                      color: AppColors.textMedium,
                    ),
                  ),
                ),
              ),
            ],
          ),
          SizedBox(height: SizeConfig.r(22)),
          const RegFieldLabel('Safeguarding certificate (PDF or image)'),
          SizedBox(height: SizeConfig.r(6)),
          UploadBox(
            file: d.safeguardingCertificate,
            onTap: () => _pickFile((f) => d.safeguardingCertificate = f),
            subLabel: 'Safeguarding certificate (PDF or image)',
          ),
          SizedBox(height: SizeConfig.r(10)),
          ExpiryButton(
            date: d.safeguardingExpiry,
            onDatePicked: (dt) => setState(() => d.safeguardingExpiry = dt),
            formatDate: _fmt,
          ),
          SizedBox(height: SizeConfig.r(6)),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Checkbox(
                value: d.safeguardingExpiryEnteredManually,
                onChanged: (v) {
                  setState(() {
                    d.safeguardingExpiryEnteredManually = v ?? false;
                  });
                },
                materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                visualDensity: VisualDensity.compact,
              ),
              Expanded(
                child: Padding(
                  padding: EdgeInsets.only(top: SizeConfig.r(10)),
                  child: Text(
                    'Enter expiry manually; it is not read from the file.',
                    style: TextStyle(
                      fontSize: SizeConfig.sp(13),
                      color: AppColors.textMedium,
                    ),
                  ),
                ),
              ),
            ],
          ),
          SizedBox(height: SizeConfig.r(22)),
          const RegFieldLabel('Background check certificate'),
          SizedBox(height: SizeConfig.r(6)),
          UploadBox(
            file: d.backgroundCheckCertificate,
            onTap: () => _pickFile((f) => d.backgroundCheckCertificate = f),
            subLabel: 'Upload certificate (PDF or image)',
          ),
          SizedBox(height: SizeConfig.r(22)),
          const RegFieldLabel('First aid certification'),
          SizedBox(height: SizeConfig.r(6)),
          UploadBox(
            file: d.firstAidCertificate,
            onTap: () => _pickFile((f) => d.firstAidCertificate = f),
            subLabel: 'Upload certificate (PDF or image)',
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
