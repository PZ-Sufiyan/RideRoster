import 'package:flutter/material.dart';
import '../../../model/driver_register_data.dart';
import '../../../../utils/app_colors.dart';
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

  static const List<String> _licensingTypes = [
    'Nottingham City Council',
    'Gedling Borough Council',
    'Derby City Council',
    'Leicester City Council',
    'Nottinghamshire County Council',
    'Birmingham City Council',
    'Manchester City Council',
    'Leeds City Council',
  ];

  // ── Vehicle taxonomy ───────────────────────────────────────────────────────

  static const _categories = [
    _VehicleCategory(
      key: 'Car',
      icon: Icons.directions_car_outlined,
      variants: [_VehicleVariant(label: '4 seater', seats: 4)],
    ),
    _VehicleCategory(
      key: 'People Carrier',
      icon: Icons.airport_shuttle_outlined,
      variants: [
        _VehicleVariant(label: '6 passenger', seats: 6),
        _VehicleVariant(label: '7 passenger', seats: 7),
      ],
    ),
    _VehicleCategory(
      key: 'Minibus',
      icon: Icons.directions_bus_outlined,
      variants: [
        _VehicleVariant(label: '8 passenger', seats: 8),
        _VehicleVariant(
          label: 'Wheelchair ramp',
          seats: 8,
          wheelchairAccessible: true,
        ),
        _VehicleVariant(
          label: 'Wheelchair tail lift',
          seats: 8,
          wheelchairAccessible: true,
        ),
      ],
    ),
    _VehicleCategory(
      key: 'Hackney',
      icon: Icons.local_taxi_outlined,
      variants: [
        _VehicleVariant(label: '5 passenger', seats: 5),
        _VehicleVariant(label: '6 passenger', seats: 6),
        _VehicleVariant(
          label: 'Wheelchair',
          seats: 5,
          wheelchairAccessible: true,
        ),
      ],
    ),
  ];

  // ── Helpers ────────────────────────────────────────────────────────────────

  _VehicleCategory? get _currentCategory => _selectedCategory == null
      ? null
      : _categories.firstWhere((c) => c.key == _selectedCategory);

  _VehicleVariant? get _currentVariant {
    if (_currentCategory == null || _selectedVariant == null) return null;
    return _currentCategory!.variants.cast<_VehicleVariant?>().firstWhere(
      (v) => v!.label == _selectedVariant,
      orElse: () => null,
    );
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

  void _saveAndNext() {
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
          RegField(controller: _regNumberCtrl, hintText: 'e.g. ABC 1234'),
          SizedBox(height: SizeConfig.r(18)),

          // ── Taxi Plate ────────────────────────────────────────────────────
          const RegFieldLabel('Vehicle Taxi Plate Number'),
          SizedBox(height: SizeConfig.r(6)),
          RegField(controller: _taxiPlateCtrl, hintText: 'e.g. ABC 1234'),
          SizedBox(height: SizeConfig.r(18)),

          // ── Make ──────────────────────────────────────────────────────────
          const RegFieldLabel('Make *'),
          SizedBox(height: SizeConfig.r(6)),
          _DropdownTile(
            value: _selectedMake,
            placeholder: 'Select make',
            onTap: () => _showPicker(
              _makes,
              _selectedMake,
              (v) => setState(() => _selectedMake = v),
            ),
          ),
          SizedBox(height: SizeConfig.r(18)),

          // ── Model ─────────────────────────────────────────────────────────
          const RegFieldLabel('Model *'),
          SizedBox(height: SizeConfig.r(6)),
          RegField(controller: _modelCtrl, hintText: 'e.g. Prius, Vito Taxi'),
          SizedBox(height: SizeConfig.r(18)),

          // ── Colour ────────────────────────────────────────────────────────
          const RegFieldLabel('Vehicle Colour *'),
          SizedBox(height: SizeConfig.r(6)),
          RegField(controller: _vehicleColourCtrl, hintText: 'e.g. Black'),
          SizedBox(height: SizeConfig.r(18)),

          // ── Year ──────────────────────────────────────────────────────────
          const RegFieldLabel('Year of First Registration *'),
          SizedBox(height: SizeConfig.r(6)),
          _DropdownTile(
            value: _yearOfRegistration != null
                ? _formatDate(_yearOfRegistration!)
                : null,
            placeholder: _formatDate(now),
            onTap: _pickYear,
            trailingIcon: Icons.calendar_today_outlined,
          ),
          SizedBox(height: SizeConfig.r(18)),

          // ── Licensing Type ────────────────────────────────────────────────
          const RegFieldLabel('Licensing Type *'),
          SizedBox(height: SizeConfig.r(6)),
          _DropdownTile(
            value: _selectedLicensing,
            placeholder: 'Nottingham city council, Gedling Bo...',
            onTap: () => _showPicker(
              _licensingTypes,
              _selectedLicensing,
              (v) => setState(() => _selectedLicensing = v),
            ),
          ),
          SizedBox(height: SizeConfig.r(18)),

          // ── Vehicle Type (two-level) ───────────────────────────────────────
          const RegFieldLabel('Vehicle Type *'),
          SizedBox(height: SizeConfig.r(10)),

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
                    }),
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 150),
                      padding: EdgeInsets.symmetric(vertical: SizeConfig.r(14)),
                      decoration: BoxDecoration(
                        color: isSelected
                            ? AppColors.primary.withValues(alpha: 0.08)
                            : const Color(0xFFF3F7FC),
                        borderRadius: BorderRadius.circular(SizeConfig.radius),
                        border: Border.all(
                          color: isSelected
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

          // Level 2 — variant list (animated)
          AnimatedSize(
            duration: const Duration(milliseconds: 250),
            curve: Curves.easeInOut,
            child: _selectedCategory == null
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
                              onTap: () => setState(
                                () => _selectedVariant = variant.label,
                              ),
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
  });

  final String? value;
  final String placeholder;
  final VoidCallback onTap;
  final IconData trailingIcon;

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
          border: Border.all(color: const Color(0xFFE0E8F3), width: 1),
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
