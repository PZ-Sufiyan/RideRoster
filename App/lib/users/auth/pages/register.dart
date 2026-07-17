import 'package:flutter/material.dart';
import '../../../model/driver_register_data.dart';
import '../componenet/step1_register.dart';
import '../componenet/step2_register.dart';
import '../componenet/step3_register.dart';
import '../../../utils/app_colors.dart';
import '../../../utils/size_confg.dart';
import '../../../routes/app_routes.dart';

class DriverRegisterPage extends StatefulWidget {
  const DriverRegisterPage({super.key});

  @override
  State<DriverRegisterPage> createState() => _DriverRegisterPageState();
}

class _DriverRegisterPageState extends State<DriverRegisterPage> {
  int _step = 0; // 0 = Personal, 1 = Vehicle, 2 = Documents
  final _data = DriverRegisterData();

  static const int _totalSteps = 3;

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
          'Create Account',
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
        return Step1Register(data: _data, onNext: _goNext);
      case 1:
        return Step2Register(data: _data, onNext: _goNext);
      case 2:
        return Step3Register(data: _data, onRegister: _onRegistered);
      default:
        return Step1Register(data: _data, onNext: _goNext);
    }
  }
}
