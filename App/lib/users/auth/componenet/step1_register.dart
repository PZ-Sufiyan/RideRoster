import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../model/driver_register_data.dart';
import '../../../../utils/app_colors.dart';
import '../../../../utils/driver_register_validators.dart';
import '../../../../utils/size_confg.dart';
import 'register_widgets.dart';

class Step1Register extends StatefulWidget {
  const Step1Register({super.key, required this.data, required this.onNext});

  final DriverRegisterData data;
  final VoidCallback onNext;

  @override
  State<Step1Register> createState() => _Step1RegisterState();
}

class _Step1RegisterState extends State<Step1Register> {
  late final TextEditingController _firstNameCtrl;
  late final TextEditingController _lastNameCtrl;
  late final TextEditingController _passwordCtrl;
  late final TextEditingController _confirmPasswordCtrl;
  late final TextEditingController _emailCtrl;
  late final TextEditingController _companyCtrl;
  late final FocusNode _companyFocusNode;
  late final TextEditingController _mobileCtrl;
  late final TextEditingController _residentialAddressCtrl;
  late final TextEditingController _emergencyContactNameCtrl;
  late final TextEditingController _emergencyContactPhoneCtrl;
  late final TextEditingController _passportNumberCtrl;
  late final TextEditingController _rightToWorkCodeCtrl;
  late final TextEditingController _nationalityCtrl;
  final _scrollCtrl = ScrollController();
  final _companyFieldKey = GlobalKey();

  bool _obscurePassword = true;
  bool _obscureConfirmPassword = true;
  String _countryCode = '+44';
  bool _isLoadingCompanies = false;
  String? _companyLoadError;
  String? _formError;
  Map<String, String> _fieldErrors = {};
  final List<String> _companyOptions = [];
  final Map<String, String> _companyNameToId = {};
  final Map<String, String> _companyNameToCountry = {};

  /// true  → driver is British (nationality locked, right-to-work hidden)
  /// false → driver must type nationality and may enter right-to-work code
  bool _isBritish = false;

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

  // ── Init / dispose ─────────────────────────────────────────────────────────

  @override
  void initState() {
    super.initState();
    _firstNameCtrl = TextEditingController(text: widget.data.firstName);
    _lastNameCtrl = TextEditingController(text: widget.data.lastName);
    _passwordCtrl = TextEditingController(text: widget.data.password);
    _confirmPasswordCtrl = TextEditingController(
      text: widget.data.confirmPassword,
    );
    _emailCtrl = TextEditingController(text: widget.data.email);
    _companyCtrl = TextEditingController(text: widget.data.companyName);
    _companyFocusNode = FocusNode();
    _mobileCtrl = TextEditingController(text: widget.data.mobileNumber);
    _residentialAddressCtrl = TextEditingController(
      text: widget.data.residentialAddress,
    );
    _emergencyContactNameCtrl = TextEditingController(
      text: widget.data.emergencyContactName,
    );
    _emergencyContactPhoneCtrl = TextEditingController(
      text: widget.data.emergencyContactPhone,
    );
    _passportNumberCtrl = TextEditingController(
      text: widget.data.passportNumber,
    );
    _rightToWorkCodeCtrl = TextEditingController(
      text: widget.data.rightToWorkCode,
    );
    _countryCode = widget.data.countryCode;
    _companyFocusNode.addListener(_onCompanyFocusChange);

    // Restore nationality state
    final savedNationality = widget.data.nationality;
    if (savedNationality == 'British') {
      _isBritish = true;
      _nationalityCtrl = TextEditingController(text: 'British');
    } else {
      _isBritish = false;
      _nationalityCtrl = TextEditingController(text: savedNationality);
    }

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
    _emergencyContactNameCtrl.dispose();
    _emergencyContactPhoneCtrl.dispose();
    _passportNumberCtrl.dispose();
    _rightToWorkCodeCtrl.dispose();
    _nationalityCtrl.dispose();
    _scrollCtrl.dispose();
    super.dispose();
  }

  // ── Company autocomplete helpers ───────────────────────────────────────────

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
          .select('id,company_name,company_country')
          .order('company_name');
      if (!mounted) return;
      _companyOptions.clear();
      _companyNameToId.clear();
      _companyNameToCountry.clear();
      for (final row in (rows as List)) {
        final name = row['company_name']?.toString().trim() ?? '';
        final id = row['id']?.toString().trim() ?? '';
        final country = row['company_country']?.toString().trim() ?? '';
        if (name.isEmpty || id.isEmpty) continue;
        _companyOptions.add(name);
        final key = name.toLowerCase();
        _companyNameToId[key] = id;
        _companyNameToCountry[key] = country;
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

  // ── Nationality helpers ────────────────────────────────────────────────────

  void _onBritishToggle(bool value) {
    setState(() {
      _isBritish = value;
      if (value) {
        _nationalityCtrl.text = 'British';
        // British nationals have no right-to-work requirement
        _rightToWorkCodeCtrl.clear();
      } else {
        _nationalityCtrl.clear();
      }
      _fieldErrors.remove('nationality');
    });
  }

  void _clearFieldError(String key) {
    if (_fieldErrors.containsKey(key)) {
      setState(() => _fieldErrors.remove(key));
    }
  }

  // ── Save & next ────────────────────────────────────────────────────────────

  void _saveAndNext() {
    final firstName = _firstNameCtrl.text.trim();
    final lastName = _lastNameCtrl.text.trim();
    final password = _passwordCtrl.text;
    final confirmPassword = _confirmPasswordCtrl.text;
    final nationality = _nationalityCtrl.text.trim();
    final companyName = _companyCtrl.text.trim();
    final companyKey = companyName.toLowerCase();
    final companyId = _companyNameToId[companyKey] ?? '';
    final companyCountry = _companyNameToCountry[companyKey] ?? '';

    final result = DriverRegisterValidators.validateStep1(
      firstName: firstName,
      lastName: lastName,
      email: _emailCtrl.text.trim(),
      mobileNumber: _mobileCtrl.text.trim(),
      password: password,
      confirmPassword: confirmPassword,
      companyName: companyName,
      companyId: companyId,
      residentialAddress: _residentialAddressCtrl.text.trim(),
      emergencyContactName: _emergencyContactNameCtrl.text,
      emergencyContactPhone: _emergencyContactPhoneCtrl.text.trim(),
      nationality: nationality,
    );

    if (!result.isValid) {
      setState(() {
        _fieldErrors = Map<String, String>.from(result.errors);
        _formError = result.firstError;
      });
      return;
    }

    setState(() {
      _fieldErrors = {};
      _formError = null;
    });
    widget.data.firstName = firstName;
    widget.data.lastName = lastName;
    widget.data.fullName = '$firstName $lastName'.trim();
    widget.data.password = password;
    widget.data.confirmPassword = confirmPassword;
    widget.data.email = _emailCtrl.text.trim();
    widget.data.companyName = companyName;
    widget.data.companyId = companyId;
    if (widget.data.companyCountry != companyCountry) {
      widget.data.licensingType = '';
    }
    widget.data.companyCountry = companyCountry;
    widget.data.countryCode = _countryCode;
    widget.data.mobileNumber = _mobileCtrl.text.trim();
    widget.data.residentialAddress = _residentialAddressCtrl.text.trim();
    widget.data.emergencyContactName =
        _emergencyContactNameCtrl.text.trim().replaceAll(RegExp(r' +'), ' ');
    widget.data.emergencyContactPhone = _emergencyContactPhoneCtrl.text.trim();
    widget.data.passportNumber = _passportNumberCtrl.text.trim();
    widget.data.nationality = nationality;
    // British nationals skip right-to-work; others may provide it
    widget.data.rightToWorkCode = _isBritish
        ? ''
        : _rightToWorkCodeCtrl.text.trim();
    widget.onNext();
  }

  // ── Country code picker ────────────────────────────────────────────────────

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

  // ── Build ──────────────────────────────────────────────────────────────────

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
          // ── Heading ───────────────────────────────────────────────────────
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
              fontSize: SizeConfig.sp(14),
              color: AppColors.primary,
            ),
          ),
          SizedBox(height: SizeConfig.r(28)),

          // ── First Name ────────────────────────────────────────────────────
          const RegFieldLabel('First Name *'),
          SizedBox(height: SizeConfig.r(6)),
          RegField(
            controller: _firstNameCtrl,
            hintText: 'e.g. John',
            keyboardType: TextInputType.name,
            textCapitalization: TextCapitalization.words,
            inputFormatters: [DriverRegisterValidators.lettersOnlyFormatter],
            errorText: _fieldErrors['firstName'],
            onChanged: (_) => _clearFieldError('firstName'),
          ),
          SizedBox(height: SizeConfig.r(18)),

          // ── Last Name ─────────────────────────────────────────────────────
          const RegFieldLabel('Last Name *'),
          SizedBox(height: SizeConfig.r(6)),
          RegField(
            controller: _lastNameCtrl,
            hintText: 'e.g. Smith',
            keyboardType: TextInputType.name,
            textCapitalization: TextCapitalization.words,
            inputFormatters: [DriverRegisterValidators.lettersOnlyFormatter],
            errorText: _fieldErrors['lastName'],
            onChanged: (_) => _clearFieldError('lastName'),
          ),
          SizedBox(height: SizeConfig.r(18)),

          // ── Email ─────────────────────────────────────────────────────────
          const RegFieldLabel('Email Address *'),
          SizedBox(height: SizeConfig.r(6)),
          RegField(
            controller: _emailCtrl,
            hintText: 'john@example.com',
            keyboardType: TextInputType.emailAddress,
            errorText: _fieldErrors['email'],
            onChanged: (_) => _clearFieldError('email'),
          ),
          SizedBox(height: SizeConfig.r(18)),

          // ── Mobile Number ─────────────────────────────────────────────────
          const RegFieldLabel('Mobile Number *'),
          SizedBox(height: SizeConfig.r(6)),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
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
                  hintText: '555-0123',
                  keyboardType: TextInputType.phone,
                  errorText: _fieldErrors['mobile'],
                  onChanged: (_) => _clearFieldError('mobile'),
                ),
              ),
            ],
          ),
          SizedBox(height: SizeConfig.r(18)),

          // ── Password ──────────────────────────────────────────────────────
          const RegFieldLabel('Password *'),
          SizedBox(height: SizeConfig.r(6)),
          RegField(
            controller: _passwordCtrl,
            hintText: '••••••••',
            obscureText: _obscurePassword,
            errorText: _fieldErrors['password'],
            onChanged: (_) => _clearFieldError('password'),
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
          SizedBox(height: SizeConfig.r(6)),
          Text(
            'Min 8 characters, with upper, lower, number and special character.',
            style: TextStyle(
              fontSize: SizeConfig.sp(11),
              color: AppColors.textLight,
            ),
          ),
          SizedBox(height: SizeConfig.r(18)),

          // ── Confirm Password ──────────────────────────────────────────────
          const RegFieldLabel('Confirm Password *'),
          SizedBox(height: SizeConfig.r(6)),
          RegField(
            controller: _confirmPasswordCtrl,
            hintText: '••••••••',
            obscureText: _obscureConfirmPassword,
            errorText: _fieldErrors['confirmPassword'],
            onChanged: (_) => _clearFieldError('confirmPassword'),
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

          // ── Company Name ──────────────────────────────────────────────────
          const RegFieldLabel('Company Name *'),
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
                widget.data.companyName = selection;
                widget.data.companyId =
                    _companyNameToId[selection.toLowerCase()] ?? '';
                widget.data.companyCountry =
                    _companyNameToCountry[selection.toLowerCase()] ?? '';
                // Clear previous license type if company (and country) changed
                widget.data.licensingType = '';
                _clearFieldError('company');
              },
              fieldViewBuilder:
                  (context, controller, focusNode, onFieldSubmitted) {
                    return TextField(
                      controller: controller,
                      focusNode: focusNode,
                      onChanged: (_) => _clearFieldError('company'),
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
                          borderSide: BorderSide(
                            color: _fieldErrors['company'] != null
                                ? AppColors.error
                                : const Color(0xFFE0E8F3),
                            width: 1,
                          ),
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(
                            SizeConfig.radius,
                          ),
                          borderSide: BorderSide(
                            color: _fieldErrors['company'] != null
                                ? AppColors.error
                                : const Color(0xFFE0E8F3),
                            width: 1,
                          ),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(
                            SizeConfig.radius,
                          ),
                          borderSide: BorderSide(
                            color: _fieldErrors['company'] != null
                                ? AppColors.error
                                : AppColors.primary,
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
          if (_fieldErrors['company'] != null) ...[
            SizedBox(height: SizeConfig.r(6)),
            Text(
              _fieldErrors['company']!,
              style: TextStyle(
                fontSize: SizeConfig.sp(12),
                color: AppColors.error,
              ),
            ),
          ],
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

          // ── Residential Address ───────────────────────────────────────────
          const RegFieldLabel('Residential Address *'),
          SizedBox(height: SizeConfig.r(6)),
          RegField(
            controller: _residentialAddressCtrl,
            hintText: 'Enter residential address',
            keyboardType: TextInputType.streetAddress,
            errorText: _fieldErrors['residentialAddress'],
            onChanged: (_) => _clearFieldError('residentialAddress'),
          ),
          SizedBox(height: SizeConfig.r(18)),

          // ── Emergency Contact ─────────────────────────────────────────────
          const RegFieldLabel('Emergency Contact Name *'),
          SizedBox(height: SizeConfig.r(6)),
          RegField(
            controller: _emergencyContactNameCtrl,
            hintText: 'Enter emergency contact name',
            keyboardType: TextInputType.name,
            textCapitalization: TextCapitalization.words,
            inputFormatters: [
              DriverRegisterValidators.lettersAndSpacesFormatter,
            ],
            errorText: _fieldErrors['emergencyContactName'],
            onChanged: (_) => _clearFieldError('emergencyContactName'),
          ),
          SizedBox(height: SizeConfig.r(18)),

          const RegFieldLabel('Emergency Contact Phone *'),
          SizedBox(height: SizeConfig.r(6)),
          RegField(
            controller: _emergencyContactPhoneCtrl,
            hintText: 'Enter emergency contact phone',
            keyboardType: TextInputType.phone,
            errorText: _fieldErrors['emergencyContactPhone'],
            onChanged: (_) => _clearFieldError('emergencyContactPhone'),
          ),
          SizedBox(height: SizeConfig.r(18)),

          // ── Nationality ───────────────────────────────────────────────────
          const RegFieldLabel('Nationality *'),
          SizedBox(height: SizeConfig.r(8)),

          // British quick-select toggle
          GestureDetector(
            onTap: () => _onBritishToggle(!_isBritish),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 150),
              padding: EdgeInsets.symmetric(
                horizontal: SizeConfig.r(16),
                vertical: SizeConfig.r(12),
              ),
              decoration: BoxDecoration(
                color: _isBritish
                    ? AppColors.primary.withValues(alpha: 0.08)
                    : const Color(0xFFF3F7FC),
                borderRadius: BorderRadius.circular(SizeConfig.radius),
                border: Border.all(
                  color: _isBritish
                      ? AppColors.primary
                      : const Color(0xFFE0E8F3),
                  width: _isBritish ? 1.5 : 1,
                ),
              ),
              child: Row(
                children: [
                  Icon(
                    _isBritish
                        ? Icons.check_circle
                        : Icons.radio_button_unchecked,
                    color: _isBritish
                        ? AppColors.primary
                        : const Color(0xFFB0BEC5),
                    size: SizeConfig.r(20),
                  ),
                  SizedBox(width: SizeConfig.r(12)),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'British',
                          style: TextStyle(
                            fontSize: SizeConfig.sp(14),
                            fontWeight: FontWeight.w600,
                            color: _isBritish
                                ? AppColors.primary
                                : AppColors.textDark,
                          ),
                        ),
                        Text(
                          'No right to work code required',
                          style: TextStyle(
                            fontSize: SizeConfig.sp(12),
                            color: _isBritish
                                ? AppColors.primary.withValues(alpha: 0.75)
                                : AppColors.textLight,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Non-British: show nationality text field
          AnimatedSize(
            duration: const Duration(milliseconds: 200),
            curve: Curves.easeInOut,
            child: _isBritish
                ? const SizedBox.shrink()
                : Padding(
                    padding: EdgeInsets.only(top: SizeConfig.r(10)),
                    child: RegField(
                      controller: _nationalityCtrl,
                      hintText: 'e.g. Pakistani, Indian, Nigerian...',
                      keyboardType: TextInputType.text,
                      errorText: _fieldErrors['nationality'],
                      onChanged: (_) => _clearFieldError('nationality'),
                    ),
                  ),
          ),
          if (_isBritish && _fieldErrors['nationality'] != null) ...[
            SizedBox(height: SizeConfig.r(6)),
            Text(
              _fieldErrors['nationality']!,
              style: TextStyle(
                fontSize: SizeConfig.sp(12),
                color: AppColors.error,
              ),
            ),
          ],
          SizedBox(height: SizeConfig.r(18)),

          // ── Right to Work — only shown for non-British ─────────────────────
          AnimatedSize(
            duration: const Duration(milliseconds: 200),
            curve: Curves.easeInOut,
            child: _isBritish
                ? const SizedBox.shrink()
                : Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const RegFieldLabel('Right to Work Code'),
                      SizedBox(height: SizeConfig.r(6)),
                      RegField(
                        controller: _rightToWorkCodeCtrl,
                        hintText: 'Enter right to work code',
                      ),
                      SizedBox(height: SizeConfig.r(18)),
                    ],
                  ),
          ),

          // ── Passport Number ───────────────────────────────────────────────
          const RegFieldLabel('Passport number'),
          SizedBox(height: SizeConfig.r(6)),
          RegField(
            controller: _passportNumberCtrl,
            hintText: 'Enter passport number',
          ),
          SizedBox(height: SizeConfig.r(18)),

          // ── Form error ────────────────────────────────────────────────────
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
