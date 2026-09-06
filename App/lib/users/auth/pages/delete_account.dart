import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../components/app_button.dart';
import '../../../providers/auth_provider.dart';
import '../../../providers/connectivity_provider.dart';
import '../../../routes/app_routes.dart';
import '../../../utils/app_colors.dart';
import '../../../utils/size_confg.dart';

class DeleteAccountPage extends StatefulWidget {
  const DeleteAccountPage({super.key});

  static const confirmationPhrase = 'Delete my account';

  @override
  State<DeleteAccountPage> createState() => _DeleteAccountPageState();
}

class _DeleteAccountPageState extends State<DeleteAccountPage> {
  final _controller = TextEditingController();
  bool _isDeleting = false;
  String? _error;

  bool get _matchesPhrase =>
      _controller.text == DeleteAccountPage.confirmationPhrase;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _deleteAccount() async {
    if (!_matchesPhrase || _isDeleting) return;

    if (!context.read<ConnectivityProvider>().isOnline) {
      setState(() {
        _error = 'Internet connection required to delete your account.';
      });
      return;
    }

    setState(() {
      _isDeleting = true;
      _error = null;
    });

    final error = await context.read<AuthProvider>().deleteAccount();
    if (!mounted) return;

    if (error != null) {
      setState(() {
        _isDeleting = false;
        _error = error;
      });
      return;
    }

    Navigator.pushNamedAndRemoveUntil(
      context,
      AppRoutes.login,
      (route) => false,
    );
  }

  @override
  Widget build(BuildContext context) {
    SizeConfig.init(context);
    final canDelete = _matchesPhrase && !_isDeleting;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: const Color(0xFF1B5E20),
        foregroundColor: Colors.white,
        elevation: 0,
        title: Text(
          'Delete Account',
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
                SizeConfig.r(28),
                SizeConfig.hPad,
                SizeConfig.r(24),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Center(
                    child: Container(
                      width: SizeConfig.r(72),
                      height: SizeConfig.r(72),
                      decoration: BoxDecoration(
                        color: AppColors.error.withValues(alpha: 0.12),
                        shape: BoxShape.circle,
                      ),
                      child: Icon(
                        Icons.delete_outline,
                        color: AppColors.error,
                        size: SizeConfig.r(34),
                      ),
                    ),
                  ),
                  SizedBox(height: SizeConfig.r(20)),
                  SizedBox(
                    width: double.infinity,
                    child: Text(
                      'This action cannot be undone.',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: SizeConfig.sp(16),
                        fontWeight: FontWeight.w700,
                        color: AppColors.textDark,
                      ),
                    ),
                  ),
                  SizedBox(height: SizeConfig.r(8)),
                  SizedBox(
                    width: double.infinity,
                    child: Text(
                      'To confirm, type the phrase below exactly as shown.',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: SizeConfig.sp(14),
                        color: AppColors.textMedium,
                        height: 1.4,
                      ),
                    ),
                  ),
                  SizedBox(height: SizeConfig.r(24)),
                  Container(
                    width: double.infinity,
                    padding: EdgeInsets.symmetric(
                      horizontal: SizeConfig.r(16),
                      vertical: SizeConfig.r(14),
                    ),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF3F7FC),
                      borderRadius: BorderRadius.circular(SizeConfig.radius),
                      border: Border.all(color: const Color(0xFFE0E8F3)),
                    ),
                    child: Text(
                      DeleteAccountPage.confirmationPhrase,
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: SizeConfig.sp(15),
                        fontWeight: FontWeight.w700,
                        color: AppColors.textDark,
                      ),
                    ),
                  ),
                  SizedBox(height: SizeConfig.r(16)),
                  TextField(
                    controller: _controller,
                    enabled: !_isDeleting,
                    autocorrect: false,
                    enableSuggestions: false,
                    textCapitalization: TextCapitalization.none,
                    onChanged: (_) => setState(() {}),
                    style: TextStyle(
                      fontSize: SizeConfig.sp(15),
                      color: AppColors.textDark,
                    ),
                    decoration: InputDecoration(
                      hintText: DeleteAccountPage.confirmationPhrase,
                      hintStyle: TextStyle(
                        fontSize: SizeConfig.sp(15),
                        color: const Color(0xFFB0BEC5),
                      ),
                      filled: true,
                      fillColor: const Color(0xFFF3F7FC),
                      contentPadding: EdgeInsets.symmetric(
                        horizontal: SizeConfig.r(16),
                        vertical: SizeConfig.r(16),
                      ),
                      border: OutlineInputBorder(
                        borderRadius:
                            BorderRadius.circular(SizeConfig.radius),
                        borderSide: const BorderSide(
                          color: Color(0xFFE0E8F3),
                          width: 1,
                        ),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius:
                            BorderRadius.circular(SizeConfig.radius),
                        borderSide: BorderSide(
                          color: _matchesPhrase
                              ? AppColors.error
                              : const Color(0xFFE0E8F3),
                          width: 1,
                        ),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius:
                            BorderRadius.circular(SizeConfig.radius),
                        borderSide: BorderSide(
                          color: _matchesPhrase
                              ? AppColors.error
                              : AppColors.primary,
                          width: 1.5,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
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
                    label: 'Delete Account',
                    isLoading: _isDeleting,
                    onPressed: canDelete ? _deleteAccount : null,
                    backgroundColor: AppColors.error,
                    disabledBackgroundColor: const Color(0xFFF3C4C4),
                    textColor: Colors.white,
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
