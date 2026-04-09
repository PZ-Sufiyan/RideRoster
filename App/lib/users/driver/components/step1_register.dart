import 'package:flutter/material.dart';
import '../models/driver_register_data.dart';
import '../../../../utils/app_colors.dart';
import '../../../../utils/size_confg.dart';
import 'register_widgets.dart';

class Step1Register extends StatefulWidget {
  const Step1Register({
    super.key,
    required this.data,
    required this.onNext,
  });

  final DriverRegisterData data;
  final VoidCallback onNext;

  @override
  State<Step1Register> createState() => _Step1RegisterState();
}

class _Step1RegisterState extends State<Step1Register> {
  late final TextEditingController _fullNameCtrl;
  late final TextEditingController _passwordCtrl;
  late final TextEditingController _emailCtrl;
  late final TextEditingController _companyCtrl;
  late final TextEditingController _mobileCtrl;

  bool _obscurePassword = true;
  String _countryCode = '+1';

  static const List<String> _countryCodes = [
    '+1', '+44', '+92', '+91', '+61', '+49', '+33', '+971', '+966', '+20',
  ];

  @override
  void initState() {
    super.initState();
    _fullNameCtrl = TextEditingController(text: widget.data.fullName);
    _passwordCtrl = TextEditingController(text: widget.data.password);
    _emailCtrl = TextEditingController(text: widget.data.email);
    _companyCtrl = TextEditingController(text: widget.data.companyName);
    _mobileCtrl = TextEditingController(text: widget.data.mobileNumber);
    _countryCode = widget.data.countryCode;
  }

  @override
  void dispose() {
    _fullNameCtrl.dispose();
    _passwordCtrl.dispose();
    _emailCtrl.dispose();
    _companyCtrl.dispose();
    _mobileCtrl.dispose();
    super.dispose();
  }

  void _saveAndNext() {
    widget.data.fullName = _fullNameCtrl.text.trim();
    widget.data.password = _passwordCtrl.text;
    widget.data.email = _emailCtrl.text.trim();
    widget.data.companyName = _companyCtrl.text.trim();
    widget.data.countryCode = _countryCode;
    widget.data.mobileNumber = _mobileCtrl.text.trim();
    widget.onNext();
  }

  void _showCountryCodePicker() {
    showModalBottomSheet<void>(
      context: context,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(
            top: Radius.circular(SizeConfig.r(16))),
      ),
      builder: (_) => ListView(
        shrinkWrap: true,
        children: _countryCodes
            .map((code) => ListTile(
                  title: Text(code),
                  trailing: code == _countryCode
                      ? const Icon(Icons.check, color: AppColors.primary)
                      : null,
                  onTap: () {
                    setState(() => _countryCode = code);
                    Navigator.pop(context);
                  },
                ))
            .toList(),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    SizeConfig.init(context);

    return SingleChildScrollView(
      padding: EdgeInsets.fromLTRB(
          SizeConfig.hPad, SizeConfig.r(28),
          SizeConfig.hPad, SizeConfig.r(32)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Heading
          Text(
            'Personal Details',
            style: TextStyle(
              fontSize: SizeConfig.sp(26),
              fontWeight: FontWeight.bold,
              color: AppColors.textDark,
            ),
          ),
          SizedBox(height: SizeConfig.r(6)),
          Text(
            "Let's start with your basic information.",
            style: TextStyle(
                fontSize: SizeConfig.sp(14), color: AppColors.primary),
          ),
          SizedBox(height: SizeConfig.r(28)),

          // Full Name
          const RegFieldLabel('Full Name'),
          SizedBox(height: SizeConfig.r(6)),
          RegField(
            controller: _fullNameCtrl,
            hintText: 'e.g. John Doe',
            keyboardType: TextInputType.name,
          ),
          SizedBox(height: SizeConfig.r(18)),

          // Password
          const RegFieldLabel('Password'),
          SizedBox(height: SizeConfig.r(6)),
          RegField(
            controller: _passwordCtrl,
            hintText: '••••••••',
            obscureText: _obscurePassword,
            prefixIcon: Icon(
              Icons.lock_outline,
              color: AppColors.inputIcon,
              size: SizeConfig.r(20),
            ),
            suffixIcon: GestureDetector(
              onTap: () =>
                  setState(() => _obscurePassword = !_obscurePassword),
              child: Icon(
                _obscurePassword
                    ? Icons.remove_red_eye_outlined
                    : Icons.visibility_off_outlined,
                color: AppColors.inputIcon,
                size: SizeConfig.r(20),
              ),
            ),
          ),
          SizedBox(height: SizeConfig.r(18)),

          // Email Address
          const RegFieldLabel('Email Address'),
          SizedBox(height: SizeConfig.r(6)),
          RegField(
            controller: _emailCtrl,
            hintText: 'john@example.com',
            keyboardType: TextInputType.emailAddress,
          ),
          SizedBox(height: SizeConfig.r(18)),

          // Company Name
          const RegFieldLabel('Company Name'),
          SizedBox(height: SizeConfig.r(6)),
          RegField(
            controller: _companyCtrl,
            hintText: 'john@example.com',
          ),
          SizedBox(height: SizeConfig.r(18)),

          // Mobile Number
          const RegFieldLabel('Mobile Number'),
          SizedBox(height: SizeConfig.r(6)),
          Row(
            children: [
              GestureDetector(
                onTap: _showCountryCodePicker,
                child: Container(
                  height: SizeConfig.inputHeight,
                  padding: EdgeInsets.symmetric(
                      horizontal: SizeConfig.r(14)),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF3F7FC),
                    borderRadius:
                        BorderRadius.circular(SizeConfig.radius),
                    border: Border.all(
                        color: const Color(0xFFE0E8F3), width: 1),
                  ),
                  child: Center(
                    child: Text(
                      _countryCode,
                      style: TextStyle(
                        fontSize: SizeConfig.sp(15),
                        color: AppColors.textMedium,
                      ),
                    ),
                  ),
                ),
              ),
              SizedBox(width: SizeConfig.r(10)),
              Expanded(
                child: RegField(
                  controller: _mobileCtrl,
                  hintText: '555-0123',
                  keyboardType: TextInputType.phone,
                ),
              ),
            ],
          ),

          SizedBox(height: SizeConfig.spaceLG),

          NextStepButton(onTap: _saveAndNext),
        ],
      ),
    );
  }
}
