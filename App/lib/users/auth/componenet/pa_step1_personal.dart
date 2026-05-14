import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../model/passenger_assistant_register_data.dart';
import 'register_widgets.dart';
import '../../../../utils/app_colors.dart';
import '../../../../utils/size_confg.dart';

class PaStep1Personal extends StatefulWidget {
  const PaStep1Personal({super.key, required this.data, required this.onNext});

  final PassengerAssistantRegisterData data;
  final VoidCallback onNext;

  @override
  State<PaStep1Personal> createState() => _PaStep1PersonalState();
}

class _PaStep1PersonalState extends State<PaStep1Personal> {
  late final TextEditingController _firstNameCtrl;
  late final TextEditingController _lastNameCtrl;
  late final TextEditingController _passwordCtrl;
  late final TextEditingController _confirmPasswordCtrl;
  late final TextEditingController _emailCtrl;
  late final TextEditingController _companyCtrl;
  late final FocusNode _companyFocusNode;
  late final TextEditingController _mobileCtrl;
  late final TextEditingController _residentialAddressCtrl;
  late final TextEditingController _rightToWorkCodeCtrl;
  late final TextEditingController _nationalityCtrl;
  late final TextEditingController _passportNumberCtrl;
  final _scrollCtrl = ScrollController();
  final _companyFieldKey = GlobalKey();

  bool _obscurePassword = true;
  bool _obscureConfirmPassword = true;
  String _countryCode = '+44';
  bool _isLoadingCompanies = false;
  String? _companyLoadError;
  String? _formError;
  final List<String> _companyOptions = [];
  final Map<String, String> _companyNameToId = {};

  bool _britishPassport = false;

  static const List<String> _countryCodes = [
    '+1',
    '+44',
    '+92',
    '+91',
    '+61',
    '+49',
    '+33',
    '+971',
    '+966',
    '+20',
  ];

  @override
  void initState() {
    super.initState();
    final d = widget.data;
    _firstNameCtrl = TextEditingController(text: d.firstName);
    _lastNameCtrl = TextEditingController(text: d.lastName);
    _passwordCtrl = TextEditingController(text: d.password);
    _confirmPasswordCtrl = TextEditingController(text: d.confirmPassword);
    _emailCtrl = TextEditingController(text: d.email);
    _companyCtrl = TextEditingController(text: d.companyName);
    _companyFocusNode = FocusNode();
    _mobileCtrl = TextEditingController(text: d.mobileNumber);
    _residentialAddressCtrl = TextEditingController(text: d.residentialAddress);
    _rightToWorkCodeCtrl = TextEditingController(text: d.rightToWorkCode);
    _countryCode = d.countryCode;
    _britishPassport = d.britishPassportHolder;
    _nationalityCtrl = TextEditingController(text: d.nationality);
    if (_britishPassport && _nationalityCtrl.text.trim().isEmpty) {
      _nationalityCtrl.text = 'British';
    }
    _passportNumberCtrl = TextEditingController(text: d.passportNumber);
    _companyFocusNode.addListener(_onCompanyFocusChange);
    _loadCompanies();
  }

  @override
  void dispose() {
    _firstNameCtrl.dispose();
    _lastNameCtrl.dispose();
    _passwordCtrl.dispose();
    _confirmPasswordCtrl.dispose();
    _emailCtrl.dispose();
    _companyCtrl.dispose();
    _companyFocusNode.removeListener(_onCompanyFocusChange);
    _companyFocusNode.dispose();
    _mobileCtrl.dispose();
    _residentialAddressCtrl.dispose();
    _rightToWorkCodeCtrl.dispose();
    _nationalityCtrl.dispose();
    _passportNumberCtrl.dispose();
    _scrollCtrl.dispose();
    super.dispose();
  }

  void _onCompanyFocusChange() {
    if (_companyFocusNode.hasFocus) {
      Future.delayed(
        const Duration(milliseconds: 220),
        _bringCompanyFieldIntoView,
      );
    }
  }

  void _bringCompanyFieldIntoView() {
    if (!mounted) return;
    final ctx = _companyFieldKey.currentContext;
    if (ctx == null) return;
    Scrollable.ensureVisible(
      ctx,
      duration: const Duration(milliseconds: 260),
      curve: Curves.easeOut,
      alignment: 0.15,
    );
  }

  Future<void> _loadCompanies() async {
    setState(() {
      _isLoadingCompanies = true;
      _companyLoadError = null;
    });
    try {
      final rows = await Supabase.instance.client
          .from('companies')
          .select('id,company_name')
          .order('company_name');
      if (!mounted) return;
      _companyOptions.clear();
      _companyNameToId.clear();
      for (final row in (rows as List)) {
        final name = row['company_name']?.toString().trim() ?? '';
        final id = row['id']?.toString().trim() ?? '';
        if (name.isEmpty || id.isEmpty) continue;
        _companyOptions.add(name);
        _companyNameToId[name.toLowerCase()] = id;
      }
      setState(() => _isLoadingCompanies = false);
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _isLoadingCompanies = false;
        _companyLoadError = 'Could not load companies right now.';
      });
    }
  }

  void _onBritishPassportToggle(bool value) {
    setState(() {
      _britishPassport = value;
      if (value) {
        _nationalityCtrl.text = 'British';
        _rightToWorkCodeCtrl.clear();
      } else {
        if (_nationalityCtrl.text.trim() == 'British') {
          _nationalityCtrl.clear();
        }
      }
    });
  }

  void _saveAndNext() {
    final firstName = _firstNameCtrl.text.trim();
    final lastName = _lastNameCtrl.text.trim();
    final password = _passwordCtrl.text;
    final confirmPassword = _confirmPasswordCtrl.text;
    final nationality = _nationalityCtrl.text.trim();
    final companyName = _companyCtrl.text.trim();
    final companyId = _companyNameToId[companyName.toLowerCase()] ?? '';

    if (password != confirmPassword) {
      setState(() => _formError = 'Password and confirm password must match.');
      return;
    }
    if (firstName.isEmpty ||
        lastName.isEmpty ||
        _emailCtrl.text.trim().isEmpty ||
        _mobileCtrl.text.trim().isEmpty ||
        password.isEmpty) {
      setState(() => _formError = 'Please fill in all required fields.');
      return;
    }
    if (companyId.isEmpty) {
      setState(
        () => _formError = 'Please select a valid company from the list.',
      );
      return;
    }
    if (nationality.isEmpty) {
      setState(() => _formError = 'Please enter your nationality.');
      return;
    }
    if (!_britishPassport && _rightToWorkCodeCtrl.text.trim().isEmpty) {
      setState(
        () => _formError =
            'Right to work is required unless you are a British passport holder.',
      );
      return;
    }

    setState(() => _formError = null);
    final d = widget.data;
    d.firstName = firstName;
    d.lastName = lastName;
    d.password = password;
    d.confirmPassword = confirmPassword;
    d.email = _emailCtrl.text.trim();
    d.companyName = companyName;
    d.companyId = companyId;
    d.countryCode = _countryCode;
    d.mobileNumber = _mobileCtrl.text.trim();
    d.residentialAddress = _residentialAddressCtrl.text.trim();
    d.nationality = nationality;
    d.britishPassportHolder = _britishPassport;
    d.rightToWorkCode = _britishPassport
        ? ''
        : _rightToWorkCodeCtrl.text.trim();
    d.passportNumber = _passportNumberCtrl.text.trim();
    widget.onNext();
  }

  void _showCountryCodePicker() {
    showModalBottomSheet<void>(
      context: context,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(
          top: Radius.circular(SizeConfig.r(16)),
        ),
      ),
      builder: (_) => ListView(
        shrinkWrap: true,
        children: _countryCodes
            .map(
              (code) => ListTile(
                title: Text(code),
                trailing: code == _countryCode
                    ? const Icon(Icons.check, color: AppColors.primary)
                    : null,
                onTap: () {
                  setState(() => _countryCode = code);
                  Navigator.pop(context);
                },
              ),
            )
            .toList(),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    SizeConfig.init(context);

    return SingleChildScrollView(
      controller: _scrollCtrl,
      keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.manual,
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
            'Personal Information',
            style: TextStyle(
              fontSize: SizeConfig.sp(26),
              fontWeight: FontWeight.bold,
              color: AppColors.textDark,
            ),
          ),
          SizedBox(height: SizeConfig.r(6)),
          Text(
            'Enter the basic details for your passenger assistant account.',
            style: TextStyle(
              fontSize: SizeConfig.sp(14),
              color: AppColors.primary,
            ),
          ),
          SizedBox(height: SizeConfig.r(28)),
          const RegFieldLabel('First Name *'),
          SizedBox(height: SizeConfig.r(6)),
          RegField(
            controller: _firstNameCtrl,
            hintText: 'e.g. Jane',
            keyboardType: TextInputType.name,
          ),
          SizedBox(height: SizeConfig.r(18)),
          const RegFieldLabel('Last Name *'),
          SizedBox(height: SizeConfig.r(6)),
          RegField(
            controller: _lastNameCtrl,
            hintText: 'e.g. Doe',
            keyboardType: TextInputType.name,
          ),
          SizedBox(height: SizeConfig.r(18)),
          const RegFieldLabel('Email Address *'),
          SizedBox(height: SizeConfig.r(6)),
          RegField(
            controller: _emailCtrl,
            hintText: 'e.g. jane.doe@example.com',
            keyboardType: TextInputType.emailAddress,
          ),
          SizedBox(height: SizeConfig.r(18)),
          const RegFieldLabel('Phone Number *'),
          SizedBox(height: SizeConfig.r(6)),
          Row(
            children: [
              GestureDetector(
                onTap: _showCountryCodePicker,
                child: Container(
                  height: SizeConfig.inputHeight,
                  padding: EdgeInsets.symmetric(horizontal: SizeConfig.r(14)),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF3F7FC),
                    borderRadius: BorderRadius.circular(SizeConfig.radius),
                    border: Border.all(
                      color: const Color(0xFFE0E8F3),
                      width: 1,
                    ),
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
                  hintText: 'e.g. 7700 900123',
                  keyboardType: TextInputType.phone,
                ),
              ),
            ],
          ),
          SizedBox(height: SizeConfig.r(18)),
          const RegFieldLabel('Password *'),
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
              onTap: () => setState(() => _obscurePassword = !_obscurePassword),
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
          const RegFieldLabel('Confirm Password *'),
          SizedBox(height: SizeConfig.r(6)),
          RegField(
            controller: _confirmPasswordCtrl,
            hintText: '••••••••',
            obscureText: _obscureConfirmPassword,
            prefixIcon: Icon(
              Icons.lock_outline,
              color: AppColors.inputIcon,
              size: SizeConfig.r(20),
            ),
            suffixIcon: GestureDetector(
              onTap: () => setState(
                () => _obscureConfirmPassword = !_obscureConfirmPassword,
              ),
              child: Icon(
                _obscureConfirmPassword
                    ? Icons.remove_red_eye_outlined
                    : Icons.visibility_off_outlined,
                color: AppColors.inputIcon,
                size: SizeConfig.r(20),
              ),
            ),
          ),
          SizedBox(height: SizeConfig.r(18)),
          const RegFieldLabel('Residential Address'),
          SizedBox(height: SizeConfig.r(6)),
          RegField(
            controller: _residentialAddressCtrl,
            hintText: 'e.g. 123 Main Street, Anytown, UK',
            keyboardType: TextInputType.streetAddress,
          ),
          SizedBox(height: SizeConfig.r(18)),
          const RegFieldLabel('Company *'),
          SizedBox(height: SizeConfig.r(6)),
          Container(
            key: _companyFieldKey,
            child: RawAutocomplete<String>(
              textEditingController: _companyCtrl,
              focusNode: _companyFocusNode,
              optionsBuilder: (textEditingValue) {
                if (_isLoadingCompanies || _companyOptions.isEmpty) {
                  return const Iterable<String>.empty();
                }
                final query = textEditingValue.text.trim().toLowerCase();
                if (query.isEmpty) return _companyOptions;
                return _companyOptions.where(
                  (n) => n.toLowerCase().contains(query),
                );
              },
              onSelected: (selection) {
                _companyCtrl.text = selection;
                _companyCtrl.selection = TextSelection.fromPosition(
                  TextPosition(offset: _companyCtrl.text.length),
                );
              },
              fieldViewBuilder:
                  (context, controller, focusNode, onFieldSubmitted) {
                    return TextField(
                      controller: controller,
                      focusNode: focusNode,
                      style: TextStyle(
                        fontSize: SizeConfig.sp(15),
                        color: AppColors.textDark,
                      ),
                      decoration: InputDecoration(
                        hintText: 'Search company name',
                        hintStyle: TextStyle(
                          fontSize: SizeConfig.sp(15),
                          color: const Color(0xFFB0BEC5),
                        ),
                        suffixIcon: _isLoadingCompanies
                            ? Padding(
                                padding: EdgeInsets.all(SizeConfig.r(12)),
                                child: SizedBox(
                                  width: SizeConfig.r(18),
                                  height: SizeConfig.r(18),
                                  child: const CircularProgressIndicator(
                                    strokeWidth: 2,
                                  ),
                                ),
                              )
                            : Icon(
                                Icons.keyboard_arrow_down,
                                color: AppColors.inputIcon,
                                size: SizeConfig.r(22),
                              ),
                        filled: true,
                        fillColor: const Color(0xFFF3F7FC),
                        contentPadding: EdgeInsets.symmetric(
                          horizontal: SizeConfig.r(16),
                          vertical: SizeConfig.r(16),
                        ),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(
                            SizeConfig.radius,
                          ),
                          borderSide: const BorderSide(
                            color: Color(0xFFE0E8F3),
                            width: 1,
                          ),
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(
                            SizeConfig.radius,
                          ),
                          borderSide: const BorderSide(
                            color: Color(0xFFE0E8F3),
                            width: 1,
                          ),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(
                            SizeConfig.radius,
                          ),
                          borderSide: const BorderSide(
                            color: AppColors.primary,
                            width: 1.5,
                          ),
                        ),
                      ),
                    );
                  },
              optionsViewBuilder: (context, onSelected, options) {
                final optionList = options.toList();
                if (optionList.isEmpty) return const SizedBox.shrink();
                final rowHeight = SizeConfig.r(52);
                return Align(
                  alignment: Alignment.topLeft,
                  child: Material(
                    elevation: 6,
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(SizeConfig.radius),
                    child: ConstrainedBox(
                      constraints: BoxConstraints(
                        maxWidth:
                            MediaQuery.of(context).size.width -
                            (SizeConfig.hPad * 2),
                        maxHeight: rowHeight * 3,
                      ),
                      child: ListView.builder(
                        primary: false,
                        padding: EdgeInsets.zero,
                        physics: const ClampingScrollPhysics(),
                        shrinkWrap: true,
                        itemCount: optionList.length,
                        itemBuilder: (context, index) {
                          final company = optionList[index];
                          return SizedBox(
                            height: rowHeight,
                            child: ListTile(
                              dense: true,
                              title: Text(
                                company,
                                style: TextStyle(
                                  fontSize: SizeConfig.sp(14),
                                  color: AppColors.textDark,
                                ),
                              ),
                              onTap: () => onSelected(company),
                            ),
                          );
                        },
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
          if (_companyLoadError != null) ...[
            SizedBox(height: SizeConfig.r(6)),
            Text(
              _companyLoadError!,
              style: TextStyle(
                fontSize: SizeConfig.sp(12),
                color: AppColors.error,
              ),
            ),
          ],
          SizedBox(height: SizeConfig.r(18)),
          const RegFieldLabel('Nationality *'),
          SizedBox(height: SizeConfig.r(6)),
          if (_britishPassport)
            Container(
              width: double.infinity,
              padding: EdgeInsets.symmetric(
                horizontal: SizeConfig.r(16),
                vertical: SizeConfig.r(16),
              ),
              decoration: BoxDecoration(
                color: const Color(0xFFF3F7FC),
                borderRadius: BorderRadius.circular(SizeConfig.radius),
                border: Border.all(color: const Color(0xFFE0E8F3), width: 1),
              ),
              child: Text(
                'British',
                style: TextStyle(
                  fontSize: SizeConfig.sp(15),
                  color: AppColors.textDark,
                  fontWeight: FontWeight.w500,
                ),
              ),
            )
          else
            RegField(
              controller: _nationalityCtrl,
              hintText: 'e.g. British, Pakistani, Indian',
              keyboardType: TextInputType.text,
            ),
          SizedBox(height: SizeConfig.r(12)),
          GestureDetector(
            onTap: () => _onBritishPassportToggle(!_britishPassport),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 150),
              padding: EdgeInsets.symmetric(
                horizontal: SizeConfig.r(16),
                vertical: SizeConfig.r(12),
              ),
              decoration: BoxDecoration(
                color: _britishPassport
                    ? AppColors.primary.withValues(alpha: 0.08)
                    : const Color(0xFFF3F7FC),
                borderRadius: BorderRadius.circular(SizeConfig.radius),
                border: Border.all(
                  color: _britishPassport
                      ? AppColors.primary
                      : const Color(0xFFE0E8F3),
                  width: _britishPassport ? 1.5 : 1,
                ),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Padding(
                    padding: EdgeInsets.only(top: SizeConfig.r(2)),
                    child: Icon(
                      _britishPassport
                          ? Icons.check_box
                          : Icons.check_box_outline_blank,
                      color: _britishPassport
                          ? AppColors.primary
                          : const Color(0xFFB0BEC5),
                      size: SizeConfig.r(22),
                    ),
                  ),
                  SizedBox(width: SizeConfig.r(12)),
                  Expanded(
                    child: Text(
                      'British passport holder (no right to work needed)',
                      style: TextStyle(
                        fontSize: SizeConfig.sp(14),
                        fontWeight: FontWeight.w500,
                        color: AppColors.textDark,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          SizedBox(height: SizeConfig.r(18)),
          AnimatedSize(
            duration: const Duration(milliseconds: 200),
            curve: Curves.easeInOut,
            child: _britishPassport
                ? const SizedBox.shrink()
                : Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const RegFieldLabel('Right to Work Code *'),
                      SizedBox(height: SizeConfig.r(6)),
                      RegField(
                        controller: _rightToWorkCodeCtrl,
                        hintText: 'Enter right to work code',
                      ),
                      SizedBox(height: SizeConfig.r(18)),
                    ],
                  ),
          ),
          const RegFieldLabel('Passport number'),
          SizedBox(height: SizeConfig.r(6)),
          RegField(
            controller: _passportNumberCtrl,
            hintText: 'Enter passport number',
          ),
          SizedBox(height: SizeConfig.r(18)),
          if (_formError != null) ...[
            SizedBox(height: SizeConfig.r(4)),
            Text(
              _formError!,
              style: TextStyle(
                fontSize: SizeConfig.sp(12),
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
