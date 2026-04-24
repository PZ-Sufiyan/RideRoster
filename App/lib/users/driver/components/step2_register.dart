import 'package:flutter/material.dart';
import '../models/driver_register_data.dart';
import '../../../../utils/app_colors.dart';
import '../../../../utils/size_confg.dart';
import 'register_widgets.dart';

class Step2Register extends StatefulWidget {
  const Step2Register({
    super.key,
    required this.data,
    required this.onNext,
  });

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
  late final TextEditingController _seatsCtrl;

  String? _selectedMake;
  String? _selectedLicensing;
  DateTime? _yearOfRegistration;
  String _bodyStyle = 'Car';
  bool _wheelchairAccessible = false;

  static const List<String> _makes = [
    'Toyota', 'Honda', 'Ford', 'Volkswagen', 'BMW', 'Mercedes-Benz',
    'Audi', 'Hyundai', 'Nissan', 'Kia', 'Vauxhall', 'Peugeot',
    'Renault', 'Fiat', 'Skoda', 'Seat', 'Volvo', 'Land Rover',
    'Jaguar', 'Citroën',
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

  @override
  void initState() {
    super.initState();
    _regNumberCtrl =
        TextEditingController(text: widget.data.registrationNumber);
    _taxiPlateCtrl =
        TextEditingController(text: widget.data.taxiPlateNumber);
    _modelCtrl = TextEditingController(text: widget.data.model);
    _vehicleColourCtrl =
        TextEditingController(text: widget.data.vehicleColour);
    _seatsCtrl = TextEditingController(text: widget.data.passengerSeats);
    _selectedMake =
        widget.data.make.isEmpty ? null : widget.data.make;
    _selectedLicensing =
        widget.data.licensingType.isEmpty ? null : widget.data.licensingType;
    _yearOfRegistration = widget.data.yearOfFirstRegistration;
    _bodyStyle = widget.data.bodyStyle;
    _wheelchairAccessible = widget.data.wheelchairAccessible;
  }

  @override
  void dispose() {
    _regNumberCtrl.dispose();
    _taxiPlateCtrl.dispose();
    _modelCtrl.dispose();
    _vehicleColourCtrl.dispose();
    _seatsCtrl.dispose();
    super.dispose();
  }

  void _saveAndNext() {
    widget.data.registrationNumber = _regNumberCtrl.text.trim();
    widget.data.taxiPlateNumber = _taxiPlateCtrl.text.trim();
    widget.data.make = _selectedMake ?? '';
    widget.data.model = _modelCtrl.text.trim();
    widget.data.vehicleColour = _vehicleColourCtrl.text.trim();
    widget.data.yearOfFirstRegistration = _yearOfRegistration;
    widget.data.licensingType = _selectedLicensing ?? '';
    widget.data.bodyStyle = _bodyStyle;
    widget.data.passengerSeats = _seatsCtrl.text.trim();
    widget.data.wheelchairAccessible = _wheelchairAccessible;
    widget.onNext();
  }

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
          colorScheme:
              const ColorScheme.light(primary: AppColors.primary),
        ),
        child: child!,
      ),
    );
    if (picked != null) setState(() => _yearOfRegistration = picked);
  }

  String _formatDate(DateTime d) {
    const months = [
      '', 'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
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
            top: Radius.circular(SizeConfig.r(16))),
      ),
      builder: (_) => ListView(
        shrinkWrap: true,
        children: items
            .map((item) => ListTile(
                  title: Text(item),
                  trailing: item == selected
                      ? const Icon(Icons.check, color: AppColors.primary)
                      : null,
                  onTap: () {
                    onSelect(item);
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
    final now = DateTime.now();

    return SingleChildScrollView(
      padding: EdgeInsets.fromLTRB(
          SizeConfig.hPad, SizeConfig.r(28),
          SizeConfig.hPad, SizeConfig.r(32)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
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
                color: AppColors.textMedium),
          ),
          SizedBox(height: SizeConfig.r(28)),

          const RegFieldLabel('Registration Number (Plate) *'),
          SizedBox(height: SizeConfig.r(6)),
          RegField(controller: _regNumberCtrl, hintText: 'e.g. ABC 1234'),
          SizedBox(height: SizeConfig.r(18)),

          const RegFieldLabel('Vehicle Taxi Plate Number'),
          SizedBox(height: SizeConfig.r(6)),
          RegField(controller: _taxiPlateCtrl, hintText: 'e.g. ABC 1234'),
          SizedBox(height: SizeConfig.r(18)),

          const RegFieldLabel('Make *'),
          SizedBox(height: SizeConfig.r(6)),
          _DropdownTile(
            value: _selectedMake,
            placeholder: 'Select make',
            onTap: () => _showPicker(
              _makes, _selectedMake,
              (v) => setState(() => _selectedMake = v),
            ),
          ),
          SizedBox(height: SizeConfig.r(18)),

          const RegFieldLabel('Model *'),
          SizedBox(height: SizeConfig.r(6)),
          RegField(
            controller: _modelCtrl,
            hintText: 'e.g. Prius, Vito Taxi',
          ),
          SizedBox(height: SizeConfig.r(18)),

          const RegFieldLabel('Vehicle Colour *'),
          SizedBox(height: SizeConfig.r(6)),
          RegField(
            controller: _vehicleColourCtrl,
            hintText: 'e.g. Black',
          ),
          SizedBox(height: SizeConfig.r(18)),

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

          const RegFieldLabel('Licensing Type *'),
          SizedBox(height: SizeConfig.r(6)),
          _DropdownTile(
            value: _selectedLicensing,
            placeholder: 'Nottingham city council, Gedling Bo...',
            onTap: () => _showPicker(
              _licensingTypes, _selectedLicensing,
              (v) => setState(() => _selectedLicensing = v),
            ),
          ),
          SizedBox(height: SizeConfig.r(18)),

          const RegFieldLabel('Body Style *'),
          SizedBox(height: SizeConfig.r(10)),
          _BodyStyleSelector(
            selected: _bodyStyle,
            onChanged: (v) => setState(() => _bodyStyle = v),
          ),
          SizedBox(height: SizeConfig.r(18)),

          const RegFieldLabel('Number of Passenger Seats *'),
          SizedBox(height: SizeConfig.r(6)),
          RegField(
            controller: _seatsCtrl,
            hintText: '4',
            keyboardType: TextInputType.number,
          ),
          SizedBox(height: SizeConfig.r(14)),

          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              SizedBox(
                width: SizeConfig.r(22),
                height: SizeConfig.r(22),
                child: Checkbox(
                  value: _wheelchairAccessible,
                  onChanged: (v) =>
                      setState(() => _wheelchairAccessible = v ?? false),
                  activeColor: AppColors.primary,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(SizeConfig.r(4)),
                  ),
                  side: const BorderSide(
                      color: Color(0xFFB0BEC5), width: 1.5),
                ),
              ),
              SizedBox(width: SizeConfig.r(10)),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Wheelchair Accessible',
                    style: TextStyle(
                      fontSize: SizeConfig.sp(14),
                      fontWeight: FontWeight.w500,
                      color: AppColors.textDark,
                    ),
                  ),
                  Text(
                    'Required for Hackney Carriage vehicles',
                    style: TextStyle(
                        fontSize: SizeConfig.sp(12),
                        color: AppColors.textLight),
                  ),
                ],
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

// ─────────────────────────────────────────────────────────────────────────────

class _DropdownTile extends StatelessWidget {
  const _DropdownTile({
    required this.value,
    required this.placeholder,
    required this.onTap,
    this.trailingIcon = Icons.keyboard_arrow_down,
  });

  final String? value;
  final String placeholder;
  final VoidCallback onTap;
  final IconData trailingIcon;

  @override
  Widget build(BuildContext context) {
    SizeConfig.init(context);
    return GestureDetector(
      onTap: onTap,
      child: Container(
        height: SizeConfig.inputHeight,
        padding: EdgeInsets.symmetric(horizontal: SizeConfig.r(16)),
        decoration: BoxDecoration(
          color: const Color(0xFFF3F7FC),
          borderRadius: BorderRadius.circular(SizeConfig.radius),
          border: Border.all(
              color: const Color(0xFFE0E8F3), width: 1),
        ),
        child: Row(
          children: [
            Expanded(
              child: Text(
                value ?? placeholder,
                style: TextStyle(
                  fontSize: SizeConfig.sp(15),
                  color: value != null
                      ? AppColors.textDark
                      : const Color(0xFFB0BEC5),
                ),
                overflow: TextOverflow.ellipsis,
              ),
            ),
            Icon(trailingIcon,
                color: AppColors.inputIcon, size: SizeConfig.r(20)),
          ],
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────

class _BodyStyleSelector extends StatelessWidget {
  const _BodyStyleSelector({
    required this.selected,
    required this.onChanged,
  });

  final String selected;
  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) {
    SizeConfig.init(context);
    return Column(
      children: [
        Row(
          children: [
            Expanded(
              child: _StyleOption(
                label: 'Car',
                icon: Icons.directions_car_outlined,
                selected: selected == 'Car',
                onTap: () => onChanged('Car'),
              ),
            ),
            SizedBox(width: SizeConfig.r(10)),
            Expanded(
              child: _StyleOption(
                label: 'MPV',
                icon: Icons.airport_shuttle_outlined,
                selected: selected == 'MPV',
                onTap: () => onChanged('MPV'),
              ),
            ),
          ],
        ),
        SizedBox(height: SizeConfig.r(10)),
        _StyleOption(
          label: 'Minibus (up to 8 seats)',
          icon: Icons.directions_bus_outlined,
          selected: selected == 'Minibus',
          onTap: () => onChanged('Minibus'),
        ),
      ],
    );
  }
}

class _StyleOption extends StatelessWidget {
  const _StyleOption({
    required this.label,
    required this.icon,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final IconData icon;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    SizeConfig.init(context);
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        width: double.infinity,
        padding: EdgeInsets.symmetric(vertical: SizeConfig.r(14)),
        decoration: BoxDecoration(
          color: selected
              ? AppColors.primary.withValues(alpha: 0.08)
              : const Color(0xFFF3F7FC),
          borderRadius: BorderRadius.circular(SizeConfig.radius),
          border: Border.all(
            color: selected
                ? AppColors.primary
                : const Color(0xFFE0E8F3),
            width: selected ? 1.5 : 1,
          ),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              icon,
              color:
                  selected ? AppColors.primary : AppColors.inputIcon,
              size: SizeConfig.r(26),
            ),
            SizedBox(height: SizeConfig.r(6)),
            Text(
              label,
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: SizeConfig.sp(13),
                fontWeight: FontWeight.w500,
                color: selected
                    ? AppColors.primary
                    : AppColors.textMedium,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
