import 'dart:io';

import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../../utils/app_colors.dart';
import '../../../../utils/size_confg.dart';

/// Edit-aware upload box — shows existing saved file with View / Replace,
/// matching the web admin [UploadBox] behaviour.
class EditUploadBox extends StatelessWidget {
  const EditUploadBox({
    super.key,
    required this.newFile,
    required this.existingUrl,
    required this.onPick,
    this.onClearNew,
    this.hint,
  });

  final PlatformFile? newFile;
  final String? existingUrl;
  final VoidCallback onPick;
  final VoidCallback? onClearNew;
  final String? hint;

  bool get _hasNew => newFile != null;
  bool get _hasExisting =>
      (existingUrl ?? '').trim().isNotEmpty && !_hasNew;

  @override
  Widget build(BuildContext context) {
    SizeConfig.init(context);

    return GestureDetector(
      onTap: _hasNew ? null : onPick,
      child: Container(
        width: double.infinity,
        padding: EdgeInsets.symmetric(
          vertical: SizeConfig.r(20),
          horizontal: SizeConfig.r(16),
        ),
        decoration: BoxDecoration(
          color: _hasExisting
              ? const Color(0xFFF0FBF4)
              : const Color(0xFFF8FAFD),
          borderRadius: BorderRadius.circular(SizeConfig.radius),
          border: Border.all(
            color: _hasExisting
                ? const Color(0xFF2ECC71).withValues(alpha: 0.45)
                : const Color(0xFFD4DEF0),
            width: _hasExisting ? 1.5 : 1,
          ),
        ),
        child: _hasNew
            ? _buildNewFile(context)
            : _hasExisting
                ? _buildExisting(context)
                : _buildEmpty(),
      ),
    );
  }

  Widget _buildEmpty() {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Icon(
          Icons.cloud_upload_outlined,
          color: const Color(0xFFB0BEC5),
          size: SizeConfig.r(30),
        ),
        SizedBox(height: SizeConfig.r(8)),
        Text(
          hint ?? 'Tap to upload (PDF or image)',
          textAlign: TextAlign.center,
          style: TextStyle(
            fontSize: SizeConfig.sp(13),
            color: const Color(0xFFB0BEC5),
          ),
        ),
      ],
    );
  }

  Widget _buildExisting(BuildContext context) {
    return Column(
      children: [
        Icon(
          Icons.check_circle_outline,
          color: AppColors.success,
          size: SizeConfig.r(28),
        ),
        SizedBox(height: SizeConfig.r(8)),
        Text(
          'Document uploaded',
          style: TextStyle(
            fontSize: SizeConfig.sp(13),
            fontWeight: FontWeight.w600,
            color: AppColors.success,
          ),
        ),
        SizedBox(height: SizeConfig.r(4)),
        Text(
          'Tap Replace to upload a new file',
          style: TextStyle(
            fontSize: SizeConfig.sp(11),
            color: AppColors.textLight,
          ),
        ),
        SizedBox(height: SizeConfig.r(12)),
        Wrap(
          alignment: WrapAlignment.center,
          spacing: SizeConfig.r(8),
          runSpacing: SizeConfig.r(8),
          children: [
            _ActionChip(
              label: 'View Current',
              icon: Icons.open_in_new,
              onTap: () => _openUrl(context, existingUrl!),
            ),
            _ActionChip(
              label: 'Replace',
              icon: Icons.file_upload_outlined,
              onTap: onPick,
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildNewFile(BuildContext context) {
    return Column(
      children: [
        Icon(
          Icons.check_circle_outline,
          color: AppColors.success,
          size: SizeConfig.r(28),
        ),
        SizedBox(height: SizeConfig.r(8)),
        Text(
          newFile!.name,
          textAlign: TextAlign.center,
          style: TextStyle(
            fontSize: SizeConfig.sp(13),
            fontWeight: FontWeight.w600,
            color: AppColors.textMedium,
          ),
        ),
        SizedBox(height: SizeConfig.r(4)),
        Text(
          'New file — will replace existing on save',
          style: TextStyle(
            fontSize: SizeConfig.sp(11),
            color: AppColors.success,
          ),
        ),
        SizedBox(height: SizeConfig.r(12)),
        Wrap(
          alignment: WrapAlignment.center,
          spacing: SizeConfig.r(8),
          runSpacing: SizeConfig.r(8),
          children: [
            _ActionChip(
              label: 'View',
              icon: Icons.visibility_outlined,
              onTap: () => _openLocal(context, newFile!.path),
            ),
            _ActionChip(
              label: 'Change',
              icon: Icons.file_upload_outlined,
              onTap: onPick,
            ),
            if (onClearNew != null)
              _ActionChip(
                label: 'Remove',
                icon: Icons.close,
                color: AppColors.error,
                onTap: onClearNew!,
              ),
          ],
        ),
      ],
    );
  }

  static Future<void> _openUrl(BuildContext context, String url) async {
    final uri = Uri.tryParse(url);
    if (uri == null) {
      _showSnack(context, 'Invalid document URL.');
      return;
    }
    try {
      final ok = await launchUrl(uri, mode: LaunchMode.externalApplication);
      if (!ok && context.mounted) {
        _showSnack(context, 'Could not open the document.');
      }
    } catch (_) {
      if (context.mounted) {
        _showSnack(context, 'Could not open the document.');
      }
    }
  }

  static Future<void> _openLocal(BuildContext context, String? path) async {
    if (path == null || path.isEmpty) return;
    final lower = path.toLowerCase();
    final isImage = lower.endsWith('.jpg') ||
        lower.endsWith('.jpeg') ||
        lower.endsWith('.png') ||
        lower.endsWith('.gif') ||
        lower.endsWith('.webp');

    if (isImage && context.mounted) {
      await showDialog<void>(
        context: context,
        builder: (ctx) => Dialog(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Padding(
                padding: EdgeInsets.all(SizeConfig.r(8)),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    IconButton(
                      onPressed: () => Navigator.pop(ctx),
                      icon: const Icon(Icons.close),
                    ),
                  ],
                ),
              ),
              Flexible(
                child: InteractiveViewer(
                  child: Image.file(File(path), fit: BoxFit.contain),
                ),
              ),
              SizedBox(height: SizeConfig.r(8)),
            ],
          ),
        ),
      );
      return;
    }

    final uri = Uri.file(path);
    try {
      final ok = await launchUrl(uri, mode: LaunchMode.externalApplication);
      if (!ok && context.mounted) {
        _showSnack(context, 'Could not open the file.');
      }
    } catch (_) {
      if (context.mounted) {
        _showSnack(context, 'Could not open the file.');
      }
    }
  }

  static void _showSnack(BuildContext context, String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message)),
    );
  }
}

class _ActionChip extends StatelessWidget {
  const _ActionChip({
    required this.label,
    required this.icon,
    required this.onTap,
    this.color,
  });

  final String label;
  final IconData icon;
  final VoidCallback onTap;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    final accent = color ?? AppColors.primary;
    return Material(
      color: accent.withValues(alpha: 0.1),
      borderRadius: BorderRadius.circular(SizeConfig.r(20)),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(SizeConfig.r(20)),
        child: Padding(
          padding: EdgeInsets.symmetric(
            horizontal: SizeConfig.r(12),
            vertical: SizeConfig.r(8),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(icon, size: SizeConfig.r(14), color: accent),
              SizedBox(width: SizeConfig.r(4)),
              Text(
                label,
                style: TextStyle(
                  fontSize: SizeConfig.sp(12),
                  fontWeight: FontWeight.w600,
                  color: accent,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
