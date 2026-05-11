import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import '../models/passenger_assistant_register_data.dart';
import '../../driver/components/register_widgets.dart';
import '../../driver/components/step3_register.dart';
import '../../../../utils/app_colors.dart';
import '../../../../utils/size_confg.dart';

class PaStep3Documents extends StatefulWidget {
  const PaStep3Documents({
    super.key,
    required this.data,
    required this.onNext,
  });

  final PassengerAssistantRegisterData data;
  final VoidCallback onNext;

  @override
  State<PaStep3Documents> createState() => _PaStep3DocumentsState();
}

class _PaStep3DocumentsState extends State<PaStep3Documents> {
  late final TextEditingController _passportNumberCtrl;

  @override
  void initState() {
    super.initState();
    _passportNumberCtrl = TextEditingController(
      text: widget.data.passportNumber,
    );
  }

  @override
  void dispose() {
    _passportNumberCtrl.dispose();
    super.dispose();
  }

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

  Future<void> _pickDate(
    DateTime? current,
    void Function(DateTime d) onPicked,
  ) async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: current ?? now,
      firstDate: now,
      lastDate: DateTime(now.year + 30),
      helpText: 'Expiry date',
      builder: (context, child) => Theme(
        data: Theme.of(context).copyWith(
          colorScheme: const ColorScheme.light(primary: AppColors.primary),
        ),
        child: child!,
      ),
    );
    if (picked != null) setState(() => onPicked(picked));
  }

  String _fmt(DateTime d) {
    final day = d.day.toString().padLeft(2, '0');
    final month = d.month.toString().padLeft(2, '0');
    return '$day/$month/${d.year}';
  }

  String? _formError;

  void _saveAndNext() {
    final d = widget.data;
    d.passportNumber = _passportNumberCtrl.text.trim();

    if (d.passportCopy != null && d.passportExpiry == null) {
      setState(() => _formError = 'Passport expiry is required when a passport file is uploaded.');
      return;
    }
    if (d.safeguardingCertificate != null && d.safeguardingExpiry == null) {
      setState(
        () => _formError =
            'Safeguarding expiry is required when a safeguarding file is uploaded.',
      );
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
          const RegFieldLabel('Passport number'),
          SizedBox(height: SizeConfig.r(6)),
          RegField(
            controller: _passportNumberCtrl,
            hintText: 'Enter passport number',
          ),
          SizedBox(height: SizeConfig.r(18)),
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
            onTap: () => _pickDate(
              d.passportExpiry,
              (dt) => d.passportExpiry = dt,
            ),
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
            onTap: () => _pickDate(
              d.safeguardingExpiry,
              (dt) => d.safeguardingExpiry = dt,
            ),
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
