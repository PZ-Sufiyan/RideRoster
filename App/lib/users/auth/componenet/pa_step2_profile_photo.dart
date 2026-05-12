import 'dart:io';

import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import '../model/passenger_assistant_register_data.dart';
import 'register_widgets.dart';
import '../../../../utils/app_colors.dart';
import '../../../../utils/size_confg.dart';

class PaStep2ProfilePhoto extends StatefulWidget {
  const PaStep2ProfilePhoto({
    super.key,
    required this.data,
    required this.onNext,
  });

  final PassengerAssistantRegisterData data;
  final VoidCallback onNext;

  @override
  State<PaStep2ProfilePhoto> createState() => _PaStep2ProfilePhotoState();
}

class _PaStep2ProfilePhotoState extends State<PaStep2ProfilePhoto> {
  Future<void> _pick() async {
    final result = await FilePicker.platform.pickFiles(
      type: FileType.image,
      allowMultiple: false,
      withData: false,
      withReadStream: false,
    );
    if (result != null && result.files.isNotEmpty) {
      setState(() => widget.data.profilePhoto = result.files.first);
    }
  }

  @override
  Widget build(BuildContext context) {
    SizeConfig.init(context);
    final photo = widget.data.profilePhoto;
    final path = photo?.path;

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
            'Profile Picture',
            style: TextStyle(
              fontSize: SizeConfig.sp(26),
              fontWeight: FontWeight.bold,
              color: AppColors.textDark,
            ),
          ),
          SizedBox(height: SizeConfig.r(6)),
          Text(
            'Upload a clear, professional headshot (JPEG, PNG, GIF or WebP).',
            style: TextStyle(
              fontSize: SizeConfig.sp(14),
              color: AppColors.textMedium,
            ),
          ),
          SizedBox(height: SizeConfig.r(28)),
          Center(
            child: ClipOval(
              child: SizedBox(
                width: SizeConfig.r(112),
                height: SizeConfig.r(112),
                child: path != null
                    ? Image.file(
                        File(path),
                        fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) => ColoredBox(
                          color: const Color(0xFFE8EEF5),
                          child: Icon(
                            Icons.person_outline,
                            size: SizeConfig.r(52),
                            color: const Color(0xFFB0BEC5),
                          ),
                        ),
                      )
                    : ColoredBox(
                        color: const Color(0xFFE8EEF5),
                        child: Icon(
                          Icons.person_outline,
                          size: SizeConfig.r(52),
                          color: const Color(0xFFB0BEC5),
                        ),
                      ),
              ),
            ),
          ),
          if (photo != null) ...[
            SizedBox(height: SizeConfig.r(8)),
            Center(
              child: Text(
                photo.name,
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: SizeConfig.sp(13),
                  color: AppColors.textMedium,
                ),
              ),
            ),
          ],
          SizedBox(height: SizeConfig.r(20)),
          GestureDetector(
            onTap: _pick,
            child: Container(
              width: double.infinity,
              padding: EdgeInsets.symmetric(
                vertical: SizeConfig.r(22),
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
                    Icons.cloud_upload_outlined,
                    color: const Color(0xFFB0BEC5),
                    size: SizeConfig.r(30),
                  ),
                  SizedBox(height: SizeConfig.r(8)),
                  Text(
                    photo == null
                        ? 'Tap to upload (PNG, JPG or GIF)'
                        : 'Tap to change photo',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: SizeConfig.sp(13),
                      color: const Color(0xFFB0BEC5),
                    ),
                  ),
                ],
              ),
            ),
          ),
          SizedBox(height: SizeConfig.spaceLG),
          NextStepButton(onTap: widget.onNext),
        ],
      ),
    );
  }
}
