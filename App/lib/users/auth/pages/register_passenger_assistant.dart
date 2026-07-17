import 'package:flutter/material.dart';
import '../../../model/passenger_assistant_register_data.dart';
import '../componenet/pa_step1_personal.dart';
import '../componenet/pa_step2_profile_photo.dart';
import '../componenet/pa_step3_documents.dart';
import '../componenet/pa_step4_other_emergency.dart';
import '../../../utils/app_colors.dart';
import '../../../utils/size_confg.dart';
import '../../../routes/app_routes.dart';

class RegisterPassengerAssistantPage extends StatefulWidget {
  const RegisterPassengerAssistantPage({super.key});

  @override
  State<RegisterPassengerAssistantPage> createState() =>
      _RegisterPassengerAssistantPageState();
}

class _RegisterPassengerAssistantPageState
    extends State<RegisterPassengerAssistantPage> {
  int _step = 0;
  final _data = PassengerAssistantRegisterData();

  static const int _totalSteps = 4;

  void _goNext() => setState(() => _step++);

  void _goBack() {
    if (_step > 0) {
      setState(() => _step--);
    } else {
      Navigator.pop(context);
    }
  }

  void _onRegistered() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text(
          'Account created. Check your email to confirm before logging in.',
        ),
        duration: Duration(seconds: 5),
      ),
    );
    Navigator.pushReplacementNamed(context, AppRoutes.login);
  }

  @override
  Widget build(BuildContext context) {
    SizeConfig.init(context);
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
        leading: IconButton(
          icon: Icon(
            Icons.arrow_back,
            color: AppColors.textDark,
            size: SizeConfig.r(22),
          ),
          onPressed: _goBack,
        ),
        title: Text(
          'Passenger assistant',
          style: TextStyle(
            fontSize: SizeConfig.sp(17),
            fontWeight: FontWeight.w600,
            color: AppColors.textDark,
          ),
        ),
        centerTitle: true,
        bottom: PreferredSize(
          preferredSize: Size.fromHeight(SizeConfig.r(3)),
          child: LinearProgressIndicator(
            value: (_step + 1) / _totalSteps,
            backgroundColor: const Color(0xFFE5EBF5),
            valueColor: const AlwaysStoppedAnimation<Color>(AppColors.primary),
            minHeight: SizeConfig.r(3),
          ),
        ),
      ),
      body: _buildStep(),
    );
  }

  Widget _buildStep() {
    switch (_step) {
      case 0:
        return PaStep1Personal(data: _data, onNext: _goNext);
      case 1:
        return PaStep2ProfilePhoto(data: _data, onNext: _goNext);
      case 2:
        return PaStep3Documents(data: _data, onNext: _goNext);
      case 3:
        return PaStep4OtherEmergency(data: _data, onRegistered: _onRegistered);
      default:
        return PaStep1Personal(data: _data, onNext: _goNext);
    }
  }
}
