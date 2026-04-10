import 'package:flutter/material.dart';
import '../../../../components/app_button.dart';
import '../../../../routes/app_routes.dart';
import '../../../../utils/app_colors.dart';
import '../../../../utils/size_confg.dart';

// ─────────────────────────────────────────────────────────────────────────────
// Models
// ─────────────────────────────────────────────────────────────────────────────

enum _CheckStatus { none, pass, fail }

class _CheckItem {
  final String id;
  final String label;
  final IconData icon;
  _CheckStatus status = _CheckStatus.none;

  _CheckItem({required this.id, required this.label, required this.icon});
}

class _CheckSection {
  final String title;
  final IconData sectionIcon;
  final Color sectionColor;
  final List<_CheckItem> items;

  _CheckSection({
    required this.title,
    required this.sectionIcon,
    required this.sectionColor,
    required this.items,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

class VehicleCheckListPage extends StatefulWidget {
  const VehicleCheckListPage({super.key});

  @override
  State<VehicleCheckListPage> createState() => _VehicleCheckListPageState();
}

class _VehicleCheckListPageState extends State<VehicleCheckListPage> {
  late final List<_CheckSection> _sections;

  @override
  void initState() {
    super.initState();
    _sections = [
      _CheckSection(
        title: 'Engine & Fluids',
        sectionIcon: Icons.local_fire_department,
        sectionColor: const Color(0xFFF59E0B),
        items: [
          _CheckItem(id: 'fuel', label: 'Fuel', icon: Icons.local_gas_station),
          _CheckItem(id: 'oil', label: 'Oil Level', icon: Icons.opacity),
          _CheckItem(
            id: 'coolant',
            label: 'Coolant Level',
            icon: Icons.water_drop,
          ),
          _CheckItem(id: 'battery', label: 'Battery', icon: Icons.battery_full),
          _CheckItem(
            id: 'brake_fluid',
            label: 'Brake Fluid',
            icon: Icons.water,
          ),
        ],
      ),
      _CheckSection(
        title: 'Lighting & Signals',
        sectionIcon: Icons.lightbulb_outline,
        sectionColor: const Color(0xFFEAB308),
        items: [
          _CheckItem(
            id: 'lights',
            label: 'Lights',
            icon: Icons.lightbulb_outline,
          ),
          _CheckItem(
            id: 'indicators',
            label: 'Indicators',
            icon: Icons.campaign_outlined,
          ),
          _CheckItem(id: 'reflectors', label: 'Reflectors', icon: Icons.flare),
        ],
      ),
      _CheckSection(
        title: 'Visibility & Safety',
        sectionIcon: Icons.visibility,
        sectionColor: const Color(0xFF7C3AED),
        items: [
          _CheckItem(id: 'washer', label: 'Washer', icon: Icons.local_car_wash),
          _CheckItem(
            id: 'wipers',
            label: 'Wipers',
            icon: Icons.cleaning_services,
          ),
          _CheckItem(
            id: 'windscreen',
            label: 'Windscreen',
            icon: Icons.panorama_wide_angle,
          ),
          _CheckItem(id: 'mirrors', label: 'Mirrors', icon: Icons.flip),
          _CheckItem(
            id: 'plates',
            label: 'Number Plates',
            icon: Icons.credit_card,
          ),
          _CheckItem(id: 'horn', label: 'Horn', icon: Icons.volume_up),
        ],
      ),
      _CheckSection(
        title: 'Braking System',
        sectionIcon: Icons.album,
        sectionColor: const Color(0xFFEF4444),
        items: [
          _CheckItem(
            id: 'footbrake',
            label: 'Footbrake',
            icon: Icons.pan_tool_alt,
          ),
          _CheckItem(
            id: 'handbrake',
            label: 'Handbrake',
            icon: Icons.back_hand_outlined,
          ),
        ],
      ),
      _CheckSection(
        title: 'Wheels & Tyres',
        sectionIcon: Icons.settings,
        sectionColor: const Color(0xFF6B7280),
        items: [
          _CheckItem(
            id: 'tyre_cond',
            label: 'Tyre Condition',
            icon: Icons.tire_repair,
          ),
          _CheckItem(
            id: 'tyre_pres',
            label: 'Tyre Pressure',
            icon: Icons.compress,
          ),
          _CheckItem(
            id: 'wheel_nuts',
            label: 'Wheel Nuts',
            icon: Icons.build_outlined,
          ),
          _CheckItem(
            id: 'safe_load',
            label: 'Safe Load',
            icon: Icons.inventory_2_outlined,
          ),
        ],
      ),
      _CheckSection(
        title: 'Driver Equipment',
        sectionIcon: Icons.health_and_safety,
        sectionColor: const Color(0xFF0284C7),
        items: [
          _CheckItem(
            id: 'sign_panels',
            label: 'Sign Panels',
            icon: Icons.signpost_outlined,
          ),
          _CheckItem(
            id: 'first_aid',
            label: 'First Aid Kits',
            icon: Icons.medical_services_outlined,
          ),
          _CheckItem(
            id: 'fire_ext',
            label: 'Fire Extinguisher',
            icon: Icons.local_fire_department_outlined,
          ),
        ],
      ),
    ];
  }

  int get _totalItems => _sections.fold(0, (sum, s) => sum + s.items.length);

  int get _checkedItems => _sections.fold(
    0,
    (sum, s) =>
        sum + s.items.where((i) => i.status != _CheckStatus.none).length,
  );

  bool get _allChecked => _checkedItems == _totalItems;

  void _updateStatus(String id, _CheckStatus status) {
    setState(() {
      for (final section in _sections) {
        for (final item in section.items) {
          if (item.id == id) {
            item.status = item.status == status ? _CheckStatus.none : status;
            return;
          }
        }
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    SizeConfig.init(context);
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Column(
          children: [
            _buildAppBar(context),
            Expanded(
              child: SingleChildScrollView(
                padding: EdgeInsets.symmetric(horizontal: SizeConfig.hPad),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    SizedBox(height: SizeConfig.r(12)),
                    _VehicleInfoCard(),
                    SizedBox(height: SizeConfig.r(16)),
                    _buildProgress(),
                    SizedBox(height: SizeConfig.r(20)),
                    Text(
                      'Safety Checklist',
                      style: TextStyle(
                        fontSize: SizeConfig.sp(16),
                        fontWeight: FontWeight.w700,
                        color: AppColors.textDark,
                      ),
                    ),
                    SizedBox(height: SizeConfig.r(12)),
                    ..._sections.map(
                      (s) => _SectionCard(section: s, onUpdate: _updateStatus),
                    ),
                    SizedBox(height: SizeConfig.r(16)),
                  ],
                ),
              ),
            ),
            _buildBottomButton(),
          ],
        ),
      ),
    );
  }

  Widget _buildAppBar(BuildContext context) {
    return Container(
      color: AppColors.background,
      padding: EdgeInsets.symmetric(
        horizontal: SizeConfig.r(8),
        vertical: SizeConfig.r(10),
      ),
      child: Row(
        children: [
          IconButton(
            onPressed: () => Navigator.maybePop(context),
            icon: Icon(
              Icons.arrow_back,
              color: AppColors.textDark,
              size: SizeConfig.r(22),
            ),
          ),
          Expanded(
            child: Text(
              'Safety Check',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: SizeConfig.sp(17),
                fontWeight: FontWeight.w700,
                color: AppColors.textDark,
              ),
            ),
          ),
          IconButton(
            onPressed: () {},
            icon: Icon(
              Icons.more_vert,
              color: AppColors.textDark,
              size: SizeConfig.r(22),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildProgress() {
    final total = _totalItems;
    final checked = _checkedItems;
    final progress = total > 0 ? checked / total : 0.0;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'Progress',
              style: TextStyle(
                fontSize: SizeConfig.sp(13),
                fontWeight: FontWeight.w500,
                color: AppColors.textMedium,
              ),
            ),
            Text(
              '$checked/$total',
              style: TextStyle(
                fontSize: SizeConfig.sp(13),
                fontWeight: FontWeight.w600,
                color: const Color(0xFF0284C7),
              ),
            ),
          ],
        ),
        SizedBox(height: SizeConfig.r(6)),
        ClipRRect(
          borderRadius: BorderRadius.circular(SizeConfig.r(4)),
          child: LinearProgressIndicator(
            value: progress,
            minHeight: SizeConfig.r(6),
            backgroundColor: AppColors.inputBorder,
            valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFF0284C7)),
          ),
        ),
      ],
    );
  }

  Widget _buildBottomButton() {
    return Container(
      padding: EdgeInsets.fromLTRB(
        SizeConfig.hPad,
        SizeConfig.r(12),
        SizeConfig.hPad,
        SizeConfig.r(16),
      ),
      decoration: BoxDecoration(
        color: AppColors.background,
        border: Border(top: BorderSide(color: AppColors.inputBorder, width: 1)),
      ),
      child: AppButton(
        label: 'Complete Safety Check',
        backgroundColor: _allChecked
            ? const Color(0xFF0284C7)
            : AppColors.textLight,
        onPressed: _allChecked
            ? () => Navigator.pushReplacementNamed(
                context,
                AppRoutes.driverDashboard,
              )
            : null,
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Vehicle Info Card
// ─────────────────────────────────────────────────────────────────────────────

class _VehicleInfoCard extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: SizeConfig.r(14),
        vertical: SizeConfig.r(12),
      ),
      decoration: BoxDecoration(
        color: AppColors.surfaceGray,
        borderRadius: BorderRadius.circular(SizeConfig.radiusLG),
        border: Border.all(color: AppColors.inputBorder, width: 1),
      ),
      child: Row(
        children: [
          Container(
            width: SizeConfig.r(44),
            height: SizeConfig.r(44),
            decoration: BoxDecoration(
              color: AppColors.primaryLight,
              borderRadius: BorderRadius.circular(SizeConfig.r(10)),
            ),
            child: Icon(
              Icons.directions_car,
              color: const Color(0xFF0284C7),
              size: SizeConfig.r(24),
            ),
          ),
          SizedBox(width: SizeConfig.r(12)),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Vehicle ABC123',
                style: TextStyle(
                  fontSize: SizeConfig.sp(14),
                  fontWeight: FontWeight.w700,
                  color: AppColors.textDark,
                ),
              ),
              SizedBox(height: SizeConfig.r(2)),
              Text(
                'Ford Transit 2020',
                style: TextStyle(
                  fontSize: SizeConfig.sp(12),
                  color: AppColors.textLight,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Section Card
// ─────────────────────────────────────────────────────────────────────────────

class _SectionCard extends StatelessWidget {
  final _CheckSection section;
  final void Function(String id, _CheckStatus status) onUpdate;

  const _SectionCard({required this.section, required this.onUpdate});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: EdgeInsets.only(bottom: SizeConfig.r(12)),
      decoration: BoxDecoration(
        color: AppColors.background,
        borderRadius: BorderRadius.circular(SizeConfig.radiusLG),
        border: Border.all(color: AppColors.inputBorder, width: 1),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Section header
          Padding(
            padding: EdgeInsets.fromLTRB(
              SizeConfig.r(14),
              SizeConfig.r(12),
              SizeConfig.r(14),
              SizeConfig.r(10),
            ),
            child: Row(
              children: [
                Icon(
                  section.sectionIcon,
                  color: section.sectionColor,
                  size: SizeConfig.r(18),
                ),
                SizedBox(width: SizeConfig.r(8)),
                Text(
                  section.title,
                  style: TextStyle(
                    fontSize: SizeConfig.sp(14),
                    fontWeight: FontWeight.w700,
                    color: AppColors.textDark,
                  ),
                ),
              ],
            ),
          ),
          const Divider(height: 1, color: Color(0xFFE5E7EB)),
          // Items
          ...section.items.asMap().entries.map((entry) {
            final i = entry.key;
            final item = entry.value;
            return Column(
              children: [
                _CheckItemRow(item: item, onUpdate: onUpdate),
                if (i < section.items.length - 1)
                  const Divider(
                    height: 1,
                    color: Color(0xFFF3F4F6),
                    indent: 14,
                    endIndent: 14,
                  ),
              ],
            );
          }),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Check Item Row
// ─────────────────────────────────────────────────────────────────────────────

class _CheckItemRow extends StatelessWidget {
  final _CheckItem item;
  final void Function(String id, _CheckStatus status) onUpdate;

  const _CheckItemRow({required this.item, required this.onUpdate});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.symmetric(
        horizontal: SizeConfig.r(14),
        vertical: SizeConfig.r(11),
      ),
      child: Row(
        children: [
          Icon(item.icon, size: SizeConfig.r(18), color: AppColors.textLight),
          SizedBox(width: SizeConfig.r(10)),
          Expanded(
            child: Text(
              item.label,
              style: TextStyle(
                fontSize: SizeConfig.sp(13),
                color: AppColors.textDark,
                fontWeight: FontWeight.w400,
              ),
            ),
          ),
          // Pass button
          _CheckCircle(
            isSelected: item.status == _CheckStatus.pass,
            selectedColor: AppColors.success,
            icon: Icons.check,
            onTap: () => onUpdate(item.id, _CheckStatus.pass),
          ),
          SizedBox(width: SizeConfig.r(8)),
          // Fail button
          _CheckCircle(
            isSelected: item.status == _CheckStatus.fail,
            selectedColor: AppColors.error,
            icon: Icons.close,
            onTap: () => onUpdate(item.id, _CheckStatus.fail),
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Check Circle Button
// ─────────────────────────────────────────────────────────────────────────────

class _CheckCircle extends StatelessWidget {
  final bool isSelected;
  final Color selectedColor;
  final IconData icon;
  final VoidCallback onTap;

  const _CheckCircle({
    required this.isSelected,
    required this.selectedColor,
    required this.icon,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: SizeConfig.r(28),
        height: SizeConfig.r(28),
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: isSelected ? selectedColor : Colors.transparent,
          border: Border.all(color: selectedColor, width: 1.5),
        ),
        child: Icon(
          icon,
          size: SizeConfig.r(14),
          color: isSelected ? Colors.white : selectedColor,
        ),
      ),
    );
  }
}
