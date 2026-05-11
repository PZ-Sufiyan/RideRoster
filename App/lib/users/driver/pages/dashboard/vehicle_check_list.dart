import 'dart:async';

import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../../components/app_button.dart';
import '../../../../routes/app_routes.dart';
import '../../../../services/vehicle_safety_check_service.dart';
import '../../../../utils/app_colors.dart';
import '../../../../utils/size_confg.dart';

// ─────────────────────────────────────────────────────────────────────────────
// Models
// ─────────────────────────────────────────────────────────────────────────────

enum _CheckStatus { none, pass, fail }

class _CheckItem {
  final String dbColumn;
  final String label;
  final IconData icon;
  _CheckStatus status = _CheckStatus.none;

  _CheckItem({
    required this.dbColumn,
    required this.label,
    required this.icon,
  });
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

class _VehicleCheckListPageState extends State<VehicleCheckListPage>
    with WidgetsBindingObserver {
  final VehicleSafetyCheckService _service = VehicleSafetyCheckService();

  late final List<_CheckSection> _sections;

  DriverVehicleSafetyInfo? _vehicle;
  String? _todayCheckRowId;
  bool _todayCheckLocked = false;
  bool _loading = true;
  bool _saving = false;
  String? _loadError;
  bool _hasJobToday = false;
  DateTime? _anchorLocalDay;
  Timer? _midnightTimer;

  DateTime _localDayKey(DateTime d) => DateTime(d.year, d.month, d.day);

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _sections = _buildSectionTemplate();
    WidgetsBinding.instance.addPostFrameCallback((_) => _loadData());
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _midnightTimer?.cancel();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      _reloadIfCalendarDayChanged();
    }
  }

  void _reloadIfCalendarDayChanged() {
    final key = _localDayKey(DateTime.now());
    if (_anchorLocalDay != null && _anchorLocalDay != key) {
      _anchorLocalDay = key;
      _loadData();
    }
  }

  void _armMidnightTimer() {
    _midnightTimer?.cancel();
    final now = DateTime.now();
    final nextMidnight =
        DateTime(now.year, now.month, now.day).add(const Duration(days: 1));
    var ms = nextMidnight.difference(now).inMilliseconds + 1500;
    if (ms < 1000) ms = 1000;
    _midnightTimer = Timer(Duration(milliseconds: ms), () {
      if (!mounted) return;
      _reloadIfCalendarDayChanged();
      _armMidnightTimer();
    });
  }

  List<_CheckSection> _buildSectionTemplate() {
    return [
      _CheckSection(
        title: 'Engine & Fluids',
        sectionIcon: Icons.local_fire_department,
        sectionColor: const Color(0xFFF59E0B),
        items: [
          _CheckItem(
            dbColumn: 'fuel',
            label: 'Fuel',
            icon: Icons.local_gas_station,
          ),
          _CheckItem(
            dbColumn: 'oil_level',
            label: 'Oil Level',
            icon: Icons.opacity,
          ),
          _CheckItem(
            dbColumn: 'coolant_level',
            label: 'Coolant Level',
            icon: Icons.water_drop,
          ),
          _CheckItem(
            dbColumn: 'battery',
            label: 'Battery',
            icon: Icons.battery_full,
          ),
          _CheckItem(
            dbColumn: 'brake_fluid',
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
            dbColumn: 'lights',
            label: 'Lights',
            icon: Icons.lightbulb_outline,
          ),
          _CheckItem(
            dbColumn: 'indicators',
            label: 'Indicators',
            icon: Icons.campaign_outlined,
          ),
          _CheckItem(
            dbColumn: 'reflectors',
            label: 'Reflectors',
            icon: Icons.flare,
          ),
        ],
      ),
      _CheckSection(
        title: 'Visibility & Safety',
        sectionIcon: Icons.visibility,
        sectionColor: const Color(0xFF7C3AED),
        items: [
          _CheckItem(
            dbColumn: 'washer',
            label: 'Washer',
            icon: Icons.local_car_wash,
          ),
          _CheckItem(
            dbColumn: 'wipers',
            label: 'Wipers',
            icon: Icons.cleaning_services,
          ),
          _CheckItem(
            dbColumn: 'windscreen',
            label: 'Windscreen',
            icon: Icons.panorama_wide_angle,
          ),
          _CheckItem(
            dbColumn: 'mirrors',
            label: 'Mirrors',
            icon: Icons.flip,
          ),
          _CheckItem(
            dbColumn: 'number_plates',
            label: 'Number Plates',
            icon: Icons.credit_card,
          ),
          _CheckItem(
            dbColumn: 'horn',
            label: 'Horn',
            icon: Icons.volume_up,
          ),
        ],
      ),
      _CheckSection(
        title: 'Braking System',
        sectionIcon: Icons.album,
        sectionColor: const Color(0xFFEF4444),
        items: [
          _CheckItem(
            dbColumn: 'footbrake',
            label: 'Footbrake',
            icon: Icons.pan_tool_alt,
          ),
          _CheckItem(
            dbColumn: 'handbrake',
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
            dbColumn: 'tyre_condition',
            label: 'Tyre Condition',
            icon: Icons.tire_repair,
          ),
          _CheckItem(
            dbColumn: 'tyre_pressure',
            label: 'Tyre Pressure',
            icon: Icons.compress,
          ),
          _CheckItem(
            dbColumn: 'wheel_nuts',
            label: 'Wheel Nuts',
            icon: Icons.build_outlined,
          ),
          _CheckItem(
            dbColumn: 'safe_load',
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
            dbColumn: 'sign_panels',
            label: 'Sign Panels',
            icon: Icons.signpost_outlined,
          ),
          _CheckItem(
            dbColumn: 'first_aid_kits',
            label: 'First Aid Kits',
            icon: Icons.medical_services_outlined,
          ),
          _CheckItem(
            dbColumn: 'fire_extinguisher',
            label: 'Fire Extinguisher',
            icon: Icons.local_fire_department_outlined,
          ),
        ],
      ),
    ];
  }

  void _clearAllItemStatuses() {
    for (final section in _sections) {
      for (final item in section.items) {
        item.status = _CheckStatus.none;
      }
    }
  }

  void _applySafetyRow(VehicleSafetyCheckToday? row) {
    _clearAllItemStatuses();
    if (row == null) return;
    for (final section in _sections) {
      for (final item in section.items) {
        final raw = row.checksByColumn[item.dbColumn]
            ?.toString()
            .trim()
            .toLowerCase();
        if (raw == 'pass') {
          item.status = _CheckStatus.pass;
        } else if (raw == 'fail') {
          item.status = _CheckStatus.fail;
        }
      }
    }
  }

  Future<void> _loadData() async {
    setState(() {
      _loading = true;
      _loadError = null;
    });

    try {
      final user = Supabase.instance.client.auth.currentUser;
      final driverId = user?.id;
      if (driverId == null || driverId.isEmpty) {
        _applySafetyRow(null);
        if (!mounted) return;
        setState(() {
          _vehicle = null;
          _todayCheckRowId = null;
          _todayCheckLocked = false;
          _loadError = 'You need to be signed in to use the safety check.';
        });
        return;
      }

      final vehicle = await _service.fetchDriverVehicle();
      final today = DateTime.now();
      final dayKey = _localDayKey(today);

      if (vehicle == null) {
        _applySafetyRow(null);
        if (!mounted) return;
        setState(() {
          _vehicle = null;
          _todayCheckRowId = null;
          _todayCheckLocked = false;
          _hasJobToday = false;
          _anchorLocalDay = dayKey;
          _loadError = 'No vehicle is assigned to your profile yet.';
        });
        return;
      }

      final row = await _service.fetchCheckForLocalDay(
        driverId: driverId,
        vehicleId: vehicle.id,
        localDay: today,
      );

      final hasJob =
          await _service.driverHasJobSessionOnLocalDay(today);

      final locked = row?.isReadOnlyLocked ?? false;

      _applySafetyRow(row);
      if (!mounted) return;
      setState(() {
        _vehicle = vehicle;
        _todayCheckRowId = row?.id;
        _todayCheckLocked = locked;
        _hasJobToday = hasJob;
        _anchorLocalDay = dayKey;
        _loadError = null;
      });
    } catch (e) {
      setState(() {
        _loadError = e.toString();
      });
    } finally {
      if (mounted) {
        setState(() => _loading = false);
        _armMidnightTimer();
      }
    }
  }

  int get _totalItems => _sections.fold(0, (sum, s) => sum + s.items.length);

  int get _checkedItems => _sections.fold(
        0,
        (sum, s) =>
            sum + s.items.where((i) => i.status != _CheckStatus.none).length,
      );

  bool get _allChecked => _checkedItems == _totalItems;

  void _updateStatus(String dbColumn, _CheckStatus status) {
    if (_todayCheckLocked || _loading || _vehicle == null) return;
    setState(() {
      for (final section in _sections) {
        for (final item in section.items) {
          if (item.dbColumn == dbColumn) {
            item.status =
                item.status == status ? _CheckStatus.none : status;
            return;
          }
        }
      }
    });
  }

  Future<void> _onCompletePressed() async {
    if (!_allChecked || _vehicle == null || _todayCheckLocked) return;

    final userId = Supabase.instance.client.auth.currentUser?.id;
    if (userId == null) return;

    final checks = <String, String>{};
    for (final section in _sections) {
      for (final item in section.items) {
        if (item.status == _CheckStatus.none) return;
        checks[item.dbColumn] =
            item.status == _CheckStatus.pass ? 'pass' : 'fail';
      }
    }

    setState(() => _saving = true);
    try {
      final newId = await _service.saveChecklist(
        driverId: userId,
        vehicle: _vehicle!,
        checksPassFail: checks,
        existingRowId: _todayCheckRowId,
      );
      if (!mounted) return;

      final allPass = checks.values.every((v) => v == 'pass');
      setState(() {
        _todayCheckRowId = newId;
        _todayCheckLocked = allPass;
        _saving = false;
      });

      if (allPass) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Safety check completed for today.'),
          ),
        );
        await Navigator.pushReplacementNamed(
          context,
          AppRoutes.driverDashboard,
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text(
              'Checklist saved as incomplete. Fix failed items and submit again '
              'to mark the day complete.',
            ),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() => _saving = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Could not save: $e')),
        );
      }
    }
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
            if (_loadError != null && _vehicle == null && !_loading)
              Padding(
                padding: EdgeInsets.symmetric(horizontal: SizeConfig.hPad),
                child: Text(
                  _loadError!,
                  style: TextStyle(
                    fontSize: SizeConfig.sp(13),
                    color: AppColors.error,
                  ),
                ),
              ),
            if (_hasJobToday) _buildJobBanner(),
            Expanded(
              child: _loading
                  ? const Center(child: CircularProgressIndicator())
                  : SingleChildScrollView(
                      padding:
                          EdgeInsets.symmetric(horizontal: SizeConfig.hPad),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          SizedBox(height: SizeConfig.r(12)),
                          _VehicleInfoCard(vehicle: _vehicle),
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
                            (s) => _SectionCard(
                              section: s,
                              readOnly: _todayCheckLocked,
                              onUpdate: _updateStatus,
                            ),
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

  Widget _buildJobBanner() {
    if (!_hasJobToday) return const SizedBox.shrink();
    final done = _todayCheckLocked;
    return Container(
      width: double.infinity,
      margin: EdgeInsets.fromLTRB(
        SizeConfig.hPad,
        SizeConfig.r(8),
        SizeConfig.hPad,
        0,
      ),
      padding: EdgeInsets.all(SizeConfig.r(12)),
      decoration: BoxDecoration(
        color: done
            ? AppColors.success.withValues(alpha: 0.12)
            : AppColors.warning.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(SizeConfig.radiusLG),
        border: Border.all(
          color: done
              ? AppColors.success.withValues(alpha: 0.4)
              : AppColors.warning.withValues(alpha: 0.5),
        ),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(
            done ? Icons.check_circle_outline : Icons.info_outline,
            color: done ? AppColors.success : AppColors.warning,
            size: SizeConfig.r(20),
          ),
          SizedBox(width: SizeConfig.r(10)),
          Expanded(
            child: Text(
              done
                  ? 'Today\'s safety check is complete. You can review the '
                      'items below; editing is locked until tomorrow.'
                  : 'You have a job scheduled today. Complete this checklist '
                      'once before driving — if any item fails it is saved as '
                      'incomplete until everything passes.',
              style: TextStyle(
                fontSize: SizeConfig.sp(12),
                height: 1.35,
                color: AppColors.textDark,
              ),
            ),
          ),
        ],
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
            valueColor:
                const AlwaysStoppedAnimation<Color>(Color(0xFF0284C7)),
          ),
        ),
      ],
    );
  }

  Widget _buildBottomButton() {
    final locked = _todayCheckLocked;
    final canSubmit =
        _allChecked && _vehicle != null && !locked && !_loading;

    String label;
    if (locked) {
      label = 'Completed for today';
    } else {
      label = 'Complete Safety Check';
    }

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
        label: label,
        isLoading: _saving,
        backgroundColor: locked
            ? AppColors.success
            : (canSubmit
                ? const Color(0xFF0284C7)
                : AppColors.textLight),
        onPressed: canSubmit && !_saving ? _onCompletePressed : null,
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Vehicle Info Card
// ─────────────────────────────────────────────────────────────────────────────

class _VehicleInfoCard extends StatelessWidget {
  final DriverVehicleSafetyInfo? vehicle;

  const _VehicleInfoCard({required this.vehicle});

  @override
  Widget build(BuildContext context) {
    if (vehicle == null) {
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
            Icon(Icons.directions_car_outlined,
                color: AppColors.textLight, size: SizeConfig.r(28)),
            SizedBox(width: SizeConfig.r(12)),
            Expanded(
              child: Text(
                'No vehicle assigned',
                style: TextStyle(
                  fontSize: SizeConfig.sp(14),
                  fontWeight: FontWeight.w600,
                  color: AppColors.textMedium,
                ),
              ),
            ),
          ],
        ),
      );
    }

    final v = vehicle!;
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
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  v.titleLine,
                  style: TextStyle(
                    fontSize: SizeConfig.sp(14),
                    fontWeight: FontWeight.w700,
                    color: AppColors.textDark,
                  ),
                ),
                SizedBox(height: SizeConfig.r(2)),
                Text(
                  v.subtitleLine,
                  style: TextStyle(
                    fontSize: SizeConfig.sp(12),
                    color: AppColors.textLight,
                  ),
                ),
              ],
            ),
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
  final bool readOnly;
  final void Function(String dbColumn, _CheckStatus status) onUpdate;

  const _SectionCard({
    required this.section,
    required this.readOnly,
    required this.onUpdate,
  });

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
          ...section.items.asMap().entries.map((entry) {
            final i = entry.key;
            final item = entry.value;
            return Column(
              children: [
                _CheckItemRow(
                  item: item,
                  readOnly: readOnly,
                  onUpdate: onUpdate,
                ),
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
  final bool readOnly;
  final void Function(String dbColumn, _CheckStatus status) onUpdate;

  const _CheckItemRow({
    required this.item,
    required this.readOnly,
    required this.onUpdate,
  });

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
          _CheckCircle(
            isSelected: item.status == _CheckStatus.pass,
            selectedColor: AppColors.success,
            icon: Icons.check,
            readOnly: readOnly,
            onTap: () => onUpdate(item.dbColumn, _CheckStatus.pass),
          ),
          SizedBox(width: SizeConfig.r(8)),
          _CheckCircle(
            isSelected: item.status == _CheckStatus.fail,
            selectedColor: AppColors.error,
            icon: Icons.close,
            readOnly: readOnly,
            onTap: () => onUpdate(item.dbColumn, _CheckStatus.fail),
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
  final bool readOnly;
  final VoidCallback onTap;

  const _CheckCircle({
    required this.isSelected,
    required this.selectedColor,
    required this.icon,
    required this.readOnly,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final control = GestureDetector(
      onTap: readOnly ? null : onTap,
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
    if (readOnly) {
      return IgnorePointer(child: control);
    }
    return control;
  }
}
