import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../model/driver_register_data.dart';
import '../../../../utils/app_colors.dart';
import '../../../../utils/driver_register_validators.dart';
import '../../../../utils/size_confg.dart';
import 'register_widgets.dart';

class Step2Register extends StatefulWidget {
  const Step2Register({super.key, required this.data, required this.onNext});

  final DriverRegisterData data;
  final VoidCallback onNext;

  @override
  State<Step2Register> createState() => _Step2RegisterState();
}

class _Step2RegisterState extends State<Step2Register> {
  late final TextEditingController _regNumberCtrl;
  late final TextEditingController _taxiPlateCtrl;
  late final TextEditingController _modelCtrl;
  late final TextEditingController _vehicleColourCtrl;

  String? _selectedMake;
  String? _selectedLicensing;
  DateTime? _yearOfRegistration;

  // Two-level selection
  String? _selectedCategory;
  String? _selectedVariant;
  String? _formError;
  Map<String, String> _fieldErrors = {};

  bool _isLoadingLicenseTypes = false;
  String? _licenseTypesLoadError;
  final List<String> _licensingTypes = [];

  bool _isLoadingCategories = true;
  String? _categoriesLoadError;
  final List<_VehicleCategory> _categories = [];

  static const List<String> _makes = [
    'Toyota',
    'Honda',
    'Ford',
    'Volkswagen',
    'BMW',
    'Mercedes-Benz',
    'Audi',
    'Hyundai',
    'Nissan',
    'Kia',
    'Vauxhall',
    'Peugeot',
    'Renault',
    'Fiat',
    'Skoda',
    'Seat',
    'Volvo',
    'Land Rover',
    'Jaguar',
    'Citroën',
  ];

  /// Preferred display order matching the original UI layout.
  static const List<String> _categoryOrder = [
    'Car',
    'People Carrier',
    'Minibus',
    'Hackney',
  ];

  // ── Helpers ────────────────────────────────────────────────────────────────

  static IconData _iconForCategory(String key) {
    switch (key) {
      case 'Car':
        return Icons.directions_car_outlined;
      case 'People Carrier':
        return Icons.airport_shuttle_outlined;
      case 'Minibus':
        return Icons.directions_bus_outlined;
      case 'Hackney':
        return Icons.local_taxi_outlined;
      default:
        return Icons.directions_car_outlined;
    }
  }

  _VehicleCategory? get _currentCategory {
    if (_selectedCategory == null) return null;
    for (final c in _categories) {
      if (c.key == _selectedCategory) return c;
    }
    return null;
  }

  _VehicleVariant? get _currentVariant {
    final category = _currentCategory;
    if (category == null || _selectedVariant == null) return null;
    for (final v in category.variants) {
      if (v.label == _selectedVariant) return v;
    }
    return null;
  }

  /// Full body style string saved to data model e.g. "Hackney - 5 passenger"
  String get _fullBodyStyle =>
      (_selectedCategory != null && _selectedVariant != null)
      ? '$_selectedCategory - $_selectedVariant'
      : '';

  // ── Init / dispose ─────────────────────────────────────────────────────────

  @override
  void initState() {
    super.initState();
    _regNumberCtrl = TextEditingController(
      text: widget.data.registrationNumber,
    );
    _taxiPlateCtrl = TextEditingController(text: widget.data.taxiPlateNumber);
    _modelCtrl = TextEditingController(text: widget.data.model);
    _vehicleColourCtrl = TextEditingController(text: widget.data.vehicleColour);
    _selectedMake = widget.data.make.isEmpty ? null : widget.data.make;
    _selectedLicensing = widget.data.licensingType.isEmpty
        ? null
        : widget.data.licensingType;
    _yearOfRegistration = widget.data.yearOfFirstRegistration;

    // Restore two-level selection from saved bodyStyle e.g. "Hackney - 5 passenger"
    final saved = widget.data.bodyStyle;
    if (saved.isNotEmpty) {
      final separatorIndex = saved.indexOf(' - ');
      if (separatorIndex != -1) {
        _selectedCategory = saved.substring(0, separatorIndex);
        _selectedVariant = saved.substring(separatorIndex + 3);
      }
    }

    _isLoadingLicenseTypes = true;
    _isLoadingCategories = true;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      _loadLicenseTypes();
      _loadVehicleCategories();
    });
  }

  Future<void> _loadLicenseTypes() async {
    final country = widget.data.companyCountry.trim();
    if (country.isEmpty) {
      if (!mounted) return;
      setState(() {
        _licensingTypes.clear();
        _licenseTypesLoadError =
            'No company country found. Go back and select a company.';
        _isLoadingLicenseTypes = false;
      });
      return;
    }

    setState(() {
      _isLoadingLicenseTypes = true;
      _licenseTypesLoadError = null;
    });

    try {
      final row = await Supabase.instance.client
          .from('country_license_types')
          .select('license_types')
          .eq('country', country)
          .maybeSingle();

      if (!mounted) return;

      final raw = row?['license_types'];
      final types = <String>[];
      if (raw is List) {
        for (final item in raw) {
          final value = item?.toString().trim() ?? '';
          if (value.isNotEmpty) types.add(value);
        }
      }

      setState(() {
        _licensingTypes
          ..clear()
          ..addAll(types);
        // Drop a previously saved selection that is no longer valid for this country
        if (_selectedLicensing != null &&
            !_licensingTypes.contains(_selectedLicensing)) {
          _selectedLicensing = null;
          widget.data.licensingType = '';
        }
        _licenseTypesLoadError = types.isEmpty
            ? 'No license types configured for $country.'
            : null;
        _isLoadingLicenseTypes = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _isLoadingLicenseTypes = false;
        _licenseTypesLoadError =
            'Could not load license types right now.';
      });
    }
  }

  Future<void> _loadVehicleCategories() async {
    setState(() {
      _isLoadingCategories = true;
      _categoriesLoadError = null;
    });

    try {
      final rows = await Supabase.instance.client
          .from('vehicle_categories')
          .select(
            'category_key,variant_label,seats,wheelchair_accessible',
          )
          .order('category_key')
          .order('variant_label');

      if (!mounted) return;

      final grouped = <String, List<_VehicleVariant>>{};
      for (final row in (rows as List)) {
        final key = row['category_key']?.toString().trim() ?? '';
        final label = row['variant_label']?.toString().trim() ?? '';
        if (key.isEmpty || label.isEmpty) continue;

        final seatsRaw = row['seats'];
        final seats = seatsRaw is int
            ? seatsRaw
            : int.tryParse(seatsRaw?.toString() ?? '') ?? 0;
        if (seats <= 0) continue;

        final wheelchair = row['wheelchair_accessible'] == true;
        grouped.putIfAbsent(key, () => []).add(
              _VehicleVariant(
                label: label,
                seats: seats,
                wheelchairAccessible: wheelchair,
              ),
            );
      }

      final orderedKeys = <String>[
        ..._categoryOrder.where(grouped.containsKey),
        ...grouped.keys.where((k) => !_categoryOrder.contains(k)),
      ];

      final categories = orderedKeys
          .map(
            (key) => _VehicleCategory(
              key: key,
              icon: _iconForCategory(key),
              variants: grouped[key]!,
            ),
          )
          .toList();

      setState(() {
        _categories
          ..clear()
          ..addAll(categories);

        // Clear restored selection if it no longer exists in DB data
        if (_selectedCategory != null &&
            !_categories.any((c) => c.key == _selectedCategory)) {
          _selectedCategory = null;
          _selectedVariant = null;
        } else if (_selectedVariant != null && _currentVariant == null) {
          _selectedVariant = null;
        }

        _categoriesLoadError = categories.isEmpty
            ? 'No vehicle types configured.'
            : null;
        _isLoadingCategories = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _isLoadingCategories = false;
        _categoriesLoadError =
            'Could not load vehicle types right now.';
      });
    }
  }

  @override
  void dispose() {
    _regNumberCtrl.dispose();
    _taxiPlateCtrl.dispose();
    _modelCtrl.dispose();
    _vehicleColourCtrl.dispose();
    super.dispose();
  }

  // ── Save & next ────────────────────────────────────────────────────────────

  void _clearFieldError(String key) {
    if (_fieldErrors.containsKey(key)) {
      setState(() => _fieldErrors.remove(key));
    }
  }

  void _saveAndNext() {
    final result = DriverRegisterValidators.validateStep2(
      registrationNumber: _regNumberCtrl.text.trim(),
      taxiPlateNumber: _taxiPlateCtrl.text.trim(),
      make: _selectedMake,
      model: _modelCtrl.text.trim(),
      vehicleColour: _vehicleColourCtrl.text.trim(),
      yearOfFirstRegistration: _yearOfRegistration,
      licensingType: _selectedLicensing,
      category: _selectedCategory,
      variant: _selectedVariant,
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
    widget.data.registrationNumber = _regNumberCtrl.text.trim();
    widget.data.taxiPlateNumber = _taxiPlateCtrl.text.trim();
    widget.data.make = _selectedMake ?? '';
    widget.data.model = _modelCtrl.text.trim();
    widget.data.vehicleColour = _vehicleColourCtrl.text.trim();
    widget.data.yearOfFirstRegistration = _yearOfRegistration;
    widget.data.licensingType = _selectedLicensing ?? '';
    widget.data.bodyStyle = _fullBodyStyle;
    widget.data.passengerSeats = _currentVariant?.seats.toString() ?? '';
    widget.data.wheelchairAccessible =
        _currentVariant?.wheelchairAccessible ?? false;
    widget.onNext();
  }

  // ── Pickers ────────────────────────────────────────────────────────────────

  Future<void> _pickYear() async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: _yearOfRegistration ?? now,
      firstDate: DateTime(1990),
      lastDate: now,
      helpText: 'Year of First Registration',
      builder: (context, child) => Theme(
        data: Theme.of(context).copyWith(
          colorScheme: const ColorScheme.light(primary: AppColors.primary),
        ),
        child: child!,
      ),
    );
    if (picked != null) setState(() => _yearOfRegistration = picked);
  }

  String _formatDate(DateTime d) {
    const months = [
      '',
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    return '${d.day} ${months[d.month]}, ${d.year}';
  }

  void _showPicker(
    List<String> items,
    String? selected,
    ValueChanged<String> onSelect,
  ) {
    showModalBottomSheet<void>(
      context: context,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(
          top: Radius.circular(SizeConfig.r(16)),
        ),
      ),
      builder: (_) => ListView(
        shrinkWrap: true,
        children: items
            .map(
              (item) => ListTile(
                title: Text(item),
                trailing: item == selected
                    ? const Icon(Icons.check, color: AppColors.primary)
                    : null,
                onTap: () {
                  onSelect(item);
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
    final now = DateTime.now();

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
          // ── Heading ──────────────────────────────────────────────────────
          Text(
            'Vehicle Details',
            style: TextStyle(
              fontSize: SizeConfig.sp(26),
              fontWeight: FontWeight.bold,
              color: AppColors.textDark,
            ),
          ),
          SizedBox(height: SizeConfig.r(6)),
          Text(
            'Complete your vehicle registration information.',
            style: TextStyle(
              fontSize: SizeConfig.sp(14),
              color: AppColors.textMedium,
            ),
          ),
          SizedBox(height: SizeConfig.r(28)),

          // ── Registration Number ───────────────────────────────────────────
          const RegFieldLabel('Registration Number (Plate) *'),
          SizedBox(height: SizeConfig.r(6)),
          RegField(
            controller: _regNumberCtrl,
            hintText: 'e.g. ABC 1234',
            errorText: _fieldErrors['registrationNumber'],
            onChanged: (_) => _clearFieldError('registrationNumber'),
          ),
          SizedBox(height: SizeConfig.r(18)),

          // ── Taxi Plate ────────────────────────────────────────────────────
          const RegFieldLabel('Vehicle Taxi Plate Number *'),
          SizedBox(height: SizeConfig.r(6)),
          RegField(
            controller: _taxiPlateCtrl,
            hintText: 'e.g. ABC 1234',
            errorText: _fieldErrors['taxiPlateNumber'],
            onChanged: (_) => _clearFieldError('taxiPlateNumber'),
          ),
          SizedBox(height: SizeConfig.r(18)),

          // ── Make ──────────────────────────────────────────────────────────
          const RegFieldLabel('Make *'),
          SizedBox(height: SizeConfig.r(6)),
          _DropdownTile(
            value: _selectedMake,
            placeholder: 'Select make',
            hasError: _fieldErrors['make'] != null,
            onTap: () => _showPicker(
              _makes,
              _selectedMake,
              (v) => setState(() {
                _selectedMake = v;
                _fieldErrors.remove('make');
              }),
            ),
          ),
          if (_fieldErrors['make'] != null) ...[
            SizedBox(height: SizeConfig.r(6)),
            Text(
              _fieldErrors['make']!,
              style: TextStyle(
                fontSize: SizeConfig.sp(12),
                color: AppColors.error,
              ),
            ),
          ],
          SizedBox(height: SizeConfig.r(18)),

          // ── Model ─────────────────────────────────────────────────────────
          const RegFieldLabel('Model *'),
          SizedBox(height: SizeConfig.r(6)),
          RegField(
            controller: _modelCtrl,
            hintText: 'e.g. Prius, Vito Taxi',
            errorText: _fieldErrors['model'],
            onChanged: (_) => _clearFieldError('model'),
          ),
          SizedBox(height: SizeConfig.r(18)),

          // ── Colour ────────────────────────────────────────────────────────
          const RegFieldLabel('Vehicle Colour *'),
          SizedBox(height: SizeConfig.r(6)),
          RegField(
            controller: _vehicleColourCtrl,
            hintText: 'e.g. Black',
            errorText: _fieldErrors['vehicleColour'],
            onChanged: (_) => _clearFieldError('vehicleColour'),
          ),
          SizedBox(height: SizeConfig.r(18)),

          // ── Year ──────────────────────────────────────────────────────────
          const RegFieldLabel('Year of First Registration *'),
          SizedBox(height: SizeConfig.r(6)),
          _DropdownTile(
            value: _yearOfRegistration != null
                ? _formatDate(_yearOfRegistration!)
                : null,
            placeholder: _formatDate(now),
            hasError: _fieldErrors['year'] != null,
            onTap: () async {
              await _pickYear();
              if (_yearOfRegistration != null) {
                _clearFieldError('year');
              }
            },
            trailingIcon: Icons.calendar_today_outlined,
          ),
          if (_fieldErrors['year'] != null) ...[
            SizedBox(height: SizeConfig.r(6)),
            Text(
              _fieldErrors['year']!,
              style: TextStyle(
                fontSize: SizeConfig.sp(12),
                color: AppColors.error,
              ),
            ),
          ],
          SizedBox(height: SizeConfig.r(18)),

          // ── License Type (from company country) ───────────────────────────
          const RegFieldLabel('License Type *'),
          SizedBox(height: SizeConfig.r(6)),
          _DropdownTile(
            value: _selectedLicensing,
            placeholder: _isLoadingLicenseTypes
                ? 'Loading license types...'
                : 'Select license type',
            hasError: _fieldErrors['licensing'] != null,
            trailingIcon: _isLoadingLicenseTypes
                ? null
                : Icons.keyboard_arrow_down_rounded,
            showLoading: _isLoadingLicenseTypes,
            onTap: () {
              if (_isLoadingLicenseTypes || _licensingTypes.isEmpty) return;
              _showPicker(
                _licensingTypes,
                _selectedLicensing,
                (v) => setState(() {
                  _selectedLicensing = v;
                  _fieldErrors.remove('licensing');
                }),
              );
            },
          ),
          if (_fieldErrors['licensing'] != null) ...[
            SizedBox(height: SizeConfig.r(6)),
            Text(
              _fieldErrors['licensing']!,
              style: TextStyle(
                fontSize: SizeConfig.sp(12),
                color: AppColors.error,
              ),
            ),
          ],
          if (_licenseTypesLoadError != null) ...[
            SizedBox(height: SizeConfig.r(6)),
            Text(
              _licenseTypesLoadError!,
              style: TextStyle(
                fontSize: SizeConfig.sp(12),
                color: AppColors.error,
              ),
            ),
          ],
          SizedBox(height: SizeConfig.r(18)),

          // ── Vehicle Type (two-level) ───────────────────────────────────────
          const RegFieldLabel('Vehicle Type *'),
          SizedBox(height: SizeConfig.r(10)),

          if (_isLoadingCategories)
            Padding(
              padding: EdgeInsets.symmetric(vertical: SizeConfig.r(20)),
              child: const Center(
                child: CircularProgressIndicator(strokeWidth: 2),
              ),
            )
          else if (_categories.isEmpty)
            const SizedBox.shrink()
          else
            // Level 1 — category grid
            Row(
              children: _categories.map((cat) {
                final isSelected = _selectedCategory == cat.key;
                return Expanded(
                  child: Padding(
                    padding: EdgeInsets.only(
                      right: cat == _categories.last ? 0 : SizeConfig.r(10),
                    ),
                    child: GestureDetector(
                      onTap: () => setState(() {
                        _selectedCategory = cat.key;
                        _selectedVariant =
                            null; // reset variant on category change
                        _fieldErrors.remove('vehicleType');
                      }),
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 150),
                        padding:
                            EdgeInsets.symmetric(vertical: SizeConfig.r(14)),
                        decoration: BoxDecoration(
                          color: isSelected
                              ? AppColors.primary.withValues(alpha: 0.08)
                              : const Color(0xFFF3F7FC),
                          borderRadius:
                              BorderRadius.circular(SizeConfig.radius),
                          border: Border.all(
                            color: _fieldErrors['vehicleType'] != null &&
                                    !isSelected
                                ? AppColors.error
                                : isSelected
                                    ? AppColors.primary
                                    : const Color(0xFFE0E8F3),
                            width: isSelected ? 1.5 : 1,
                          ),
                        ),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              cat.icon,
                              color: isSelected
                                  ? AppColors.primary
                                  : AppColors.inputIcon,
                              size: SizeConfig.r(26),
                            ),
                            SizedBox(height: SizeConfig.r(6)),
                            Text(
                              cat.key,
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                fontSize: SizeConfig.sp(12),
                                fontWeight: FontWeight.w600,
                                color: isSelected
                                    ? AppColors.primary
                                    : AppColors.textMedium,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),
          if (_fieldErrors['vehicleType'] != null) ...[
            SizedBox(height: SizeConfig.r(6)),
            Text(
              _fieldErrors['vehicleType']!,
              style: TextStyle(
                fontSize: SizeConfig.sp(12),
                color: AppColors.error,
              ),
            ),
          ],
          if (_categoriesLoadError != null) ...[
            SizedBox(height: SizeConfig.r(6)),
            Text(
              _categoriesLoadError!,
              style: TextStyle(
                fontSize: SizeConfig.sp(12),
                color: AppColors.error,
              ),
            ),
          ],

          // Level 2 — variant list (animated)
          AnimatedSize(
            duration: const Duration(milliseconds: 250),
            curve: Curves.easeInOut,
            child: _currentCategory == null
                ? const SizedBox.shrink()
                : Padding(
                    padding: EdgeInsets.only(top: SizeConfig.r(14)),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Select $_selectedCategory type',
                          style: TextStyle(
                            fontSize: SizeConfig.sp(13),
                            fontWeight: FontWeight.w500,
                            color: AppColors.textMedium,
                          ),
                        ),
                        SizedBox(height: SizeConfig.r(10)),
                        ...(_currentCategory!.variants.map((variant) {
                          final isSelected = _selectedVariant == variant.label;
                          return Padding(
                            padding: EdgeInsets.only(bottom: SizeConfig.r(8)),
                            child: GestureDetector(
                              onTap: () => setState(() {
                                _selectedVariant = variant.label;
                                _fieldErrors.remove('vehicleType');
                              }),
                              child: AnimatedContainer(
                                duration: const Duration(milliseconds: 150),
                                width: double.infinity,
                                padding: EdgeInsets.symmetric(
                                  horizontal: SizeConfig.r(16),
                                  vertical: SizeConfig.r(13),
                                ),
                                decoration: BoxDecoration(
                                  color: isSelected
                                      ? AppColors.primary.withValues(
                                          alpha: 0.08,
                                        )
                                      : const Color(0xFFF3F7FC),
                                  borderRadius: BorderRadius.circular(
                                    SizeConfig.radius,
                                  ),
                                  border: Border.all(
                                    color: isSelected
                                        ? AppColors.primary
                                        : const Color(0xFFE0E8F3),
                                    width: isSelected ? 1.5 : 1,
                                  ),
                                ),
                                child: Row(
                                  children: [
                                    Icon(
                                      isSelected
                                          ? Icons.check_circle
                                          : Icons.radio_button_unchecked,
                                      color: isSelected
                                          ? AppColors.primary
                                          : const Color(0xFFB0BEC5),
                                      size: SizeConfig.r(20),
                                    ),
                                    SizedBox(width: SizeConfig.r(12)),
                                    Expanded(
                                      child: Text(
                                        variant.label,
                                        style: TextStyle(
                                          fontSize: SizeConfig.sp(14),
                                          fontWeight: FontWeight.w500,
                                          color: isSelected
                                              ? AppColors.primary
                                              : AppColors.textDark,
                                        ),
                                      ),
                                    ),
                                    if (variant.wheelchairAccessible) ...[
                                      Icon(
                                        Icons.accessible_outlined,
                                        size: SizeConfig.r(18),
                                        color: isSelected
                                            ? AppColors.primary
                                            : AppColors.inputIcon,
                                      ),
                                      SizedBox(width: SizeConfig.r(6)),
                                    ],
                                    Text(
                                      '${variant.seats} seats',
                                      style: TextStyle(
                                        fontSize: SizeConfig.sp(12),
                                        color: isSelected
                                            ? AppColors.primary.withValues(
                                                alpha: 0.75,
                                              )
                                            : AppColors.textLight,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          );
                        })),
                      ],
                    ),
                  ),
          ),

          if (_formError != null) ...[
            SizedBox(height: SizeConfig.r(12)),
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

class _DropdownTile extends StatelessWidget {
  const _DropdownTile({
    required this.value,
    required this.placeholder,
    required this.onTap,
    this.trailingIcon = Icons.keyboard_arrow_down_rounded,
    this.hasError = false,
    this.showLoading = false,
  });

  final String? value;
  final String placeholder;
  final VoidCallback onTap;
  final IconData? trailingIcon;
  final bool hasError;
  final bool showLoading;

  @override
  Widget build(BuildContext context) {
    SizeConfig.init(context);
    final hasValue = value != null && value!.trim().isNotEmpty;

    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: double.infinity,
        padding: EdgeInsets.symmetric(
          horizontal: SizeConfig.r(16),
          vertical: SizeConfig.r(16),
        ),
        decoration: BoxDecoration(
          color: const Color(0xFFF3F7FC),
          borderRadius: BorderRadius.circular(SizeConfig.radius),
          border: Border.all(
            color: hasError ? AppColors.error : const Color(0xFFE0E8F3),
            width: 1,
          ),
        ),
        child: Row(
          children: [
            Expanded(
              child: Text(
                hasValue ? value! : placeholder,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  fontSize: SizeConfig.sp(15),
                  color: hasValue
                      ? AppColors.textDark
                      : const Color(0xFFB0BEC5),
                ),
              ),
            ),
            SizedBox(width: SizeConfig.r(10)),
            if (showLoading)
              SizedBox(
                width: SizeConfig.r(18),
                height: SizeConfig.r(18),
                child: const CircularProgressIndicator(strokeWidth: 2),
              )
            else if (trailingIcon != null)
              Icon(
                trailingIcon,
                color: AppColors.inputIcon,
                size: SizeConfig.r(20),
              ),
          ],
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Data models
// ─────────────────────────────────────────────────────────────────────────────

class _VehicleCategory {
  const _VehicleCategory({
    required this.key,
    required this.icon,
    required this.variants,
  });

  final String key;
  final IconData icon;
  final List<_VehicleVariant> variants;
}

class _VehicleVariant {
  const _VehicleVariant({
    required this.label,
    required this.seats,
    this.wheelchairAccessible = false,
  });

  final String label;
  final int seats;
  final bool wheelchairAccessible;
}
