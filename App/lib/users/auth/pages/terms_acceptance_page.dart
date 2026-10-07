import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../components/app_button.dart';
import '../../../providers/auth_provider.dart';
import '../../../services/terms_service.dart';
import '../../../utils/app_colors.dart';
import '../../../utils/size_confg.dart';

class TermsAcceptancePage extends StatefulWidget {
  final RequiredTermsPayload terms;
  final VoidCallback onAccepted;

  const TermsAcceptancePage({
    super.key,
    required this.terms,
    required this.onAccepted,
  });

  @override
  State<TermsAcceptancePage> createState() => _TermsAcceptancePageState();
}

class _TermsAcceptancePageState extends State<TermsAcceptancePage> {
  final TermsService _termsService = TermsService();
  bool _accepting = false;
  String? _error;

  Future<void> _onAccept() async {
    setState(() {
      _accepting = true;
      _error = null;
    });

    final result = await _termsService.acceptTerms(widget.terms.termsId);
    if (!mounted) return;

    if (result.success) {
      widget.onAccepted();
      return;
    }

    setState(() {
      _accepting = false;
      _error = result.error;
    });
  }

  Future<void> _onDecline() async {
    await context.read<AuthProvider>().logout();
  }

  @override
  Widget build(BuildContext context) {
    SizeConfig.init(context);

    return PopScope(
      canPop: false,
      child: Scaffold(
        backgroundColor: AppColors.background,
        appBar: AppBar(
          automaticallyImplyLeading: false,
          backgroundColor: Colors.white,
          foregroundColor: AppColors.textDark,
          elevation: 0,
          title: Text(
            widget.terms.title,
            style: TextStyle(
              fontSize: SizeConfig.sp(16),
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
        body: SafeArea(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Padding(
                padding: EdgeInsets.fromLTRB(
                  SizeConfig.hPad,
                  SizeConfig.sh(1),
                  SizeConfig.hPad,
                  SizeConfig.sh(1.5),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Version ${widget.terms.version}',
                      style: TextStyle(
                        fontSize: SizeConfig.sp(13),
                        color: AppColors.textMedium,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    SizedBox(height: SizeConfig.sh(0.8)),
                    Text(
                      'You must read and accept the Terms & Conditions below to '
                      'continue using RideRoster.',
                      style: TextStyle(
                        fontSize: SizeConfig.sp(14),
                        color: AppColors.textDark,
                        height: 1.4,
                      ),
                    ),
                  ],
                ),
              ),
              Expanded(
                child: Container(
                  margin: EdgeInsets.symmetric(horizontal: SizeConfig.hPad),
                  padding: EdgeInsets.all(SizeConfig.r(14)),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(SizeConfig.r(12)),
                    border: Border.all(color: AppColors.inputBorder),
                  ),
                  child: SingleChildScrollView(
                    child: Text(
                      widget.terms.content,
                      style: TextStyle(
                        fontSize: SizeConfig.sp(14),
                        color: AppColors.textDark,
                        height: 1.5,
                      ),
                    ),
                  ),
                ),
              ),
              if (_error != null)
                Padding(
                  padding: EdgeInsets.fromLTRB(
                    SizeConfig.hPad,
                    SizeConfig.sh(1),
                    SizeConfig.hPad,
                    0,
                  ),
                  child: Text(
                    _error!,
                    style: TextStyle(
                      color: Colors.red.shade700,
                      fontSize: SizeConfig.sp(13),
                    ),
                  ),
                ),
              Padding(
                padding: EdgeInsets.all(SizeConfig.hPad),
                child: Column(
                  children: [
                    AppButton(
                      label: 'I Agree',
                      isLoading: _accepting,
                      onPressed: _accepting ? null : _onAccept,
                    ),
                    SizedBox(height: SizeConfig.sh(1.2)),
                    AppButton(
                      label: 'Decline',
                      backgroundColor: Colors.white,
                      textColor: AppColors.textDark,
                      borderColor: AppColors.inputBorder,
                      onPressed: _accepting ? null : _onDecline,
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
