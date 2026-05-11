import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:geolocator/geolocator.dart';
import 'package:latlong2/latlong.dart';
import 'package:provider/provider.dart';
import '../../../../components/app_button.dart';
import '../../../../providers/job_provider.dart';
import '../../../../services/driver_job_request_service.dart';
import '../../../../utils/app_colors.dart';
import '../../../../utils/size_confg.dart';
import '../../models/job_request_model.dart';

class RequestedJobsPage extends StatefulWidget {
  const RequestedJobsPage({super.key});

  @override
  State<RequestedJobsPage> createState() => _RequestedJobsPageState();
}

class _RequestedJobsPageState extends State<RequestedJobsPage> {
  final DriverJobRequestService _service = DriverJobRequestService();
  bool _isSubmitting = false;
  LatLng? _currentLocation;

  @override
  void initState() {
    super.initState();
    _loadCurrentLocation();
  }

  Future<void> _loadCurrentLocation() async {
    try {
      final serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) return;
      var permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }
      if (permission != LocationPermission.always &&
          permission != LocationPermission.whileInUse)
        return;
      final pos = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
        ),
      );
      if (!mounted) return;
      setState(() => _currentLocation = LatLng(pos.latitude, pos.longitude));
    } catch (_) {}
  }

  // Replace the existing _updateStatus method
  Future<void> _updateStatus({
    required String status,
    required DriverJobRequest request,
    double? counterOfferPay,
  }) async {
    if (_isSubmitting) return;
    setState(() => _isSubmitting = true);
    try {
      await _service.updateApprovalStatus(
        jobId: request.id,
        status: status,
        counterOfferPay: counterOfferPay,
      );
      if (!mounted) return;
      await context.read<JobProvider>().refreshJobDataSilently();
      if (!mounted) return;
      final label = switch (status) {
        'accepted' => 'accepted',
        'rejected' => 'rejected',
        DriverJobRequestService.statusCounterRequest => 'counter offer sent',
        _ => status,
      };
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Job $label')));
      Navigator.pop(context, true);
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Unable to update request right now.')),
      );
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  // Add this new method
  Future<void> _showCounterOfferSheet(DriverJobRequest request) async {
    final controller = TextEditingController();
    final formKey = GlobalKey<FormState>();

    final result = await showModalBottomSheet<double>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return Padding(
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(ctx).viewInsets.bottom,
          ),
          child: Container(
            decoration: BoxDecoration(
              color: AppColors.background,
              borderRadius: BorderRadius.vertical(
                top: Radius.circular(SizeConfig.r(20)),
              ),
            ),
            padding: EdgeInsets.fromLTRB(
              SizeConfig.hPad,
              SizeConfig.r(20),
              SizeConfig.hPad,
              SizeConfig.r(32),
            ),
            child: Form(
              key: formKey,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Handle
                  Center(
                    child: Container(
                      width: SizeConfig.r(40),
                      height: SizeConfig.r(4),
                      decoration: BoxDecoration(
                        color: AppColors.inputBorder,
                        borderRadius: BorderRadius.circular(SizeConfig.r(2)),
                      ),
                    ),
                  ),
                  SizedBox(height: SizeConfig.r(20)),
                  Text(
                    'Counter Offer',
                    style: TextStyle(
                      fontSize: SizeConfig.sp(20),
                      fontWeight: FontWeight.w800,
                      color: AppColors.textDark,
                    ),
                  ),
                  SizedBox(height: SizeConfig.r(4)),
                  Text(
                    'Proposed pay for this job (current: ${request.earnings})',
                    style: TextStyle(
                      fontSize: SizeConfig.sp(13),
                      color: AppColors.textLight,
                    ),
                  ),
                  SizedBox(height: SizeConfig.r(20)),
                  TextFormField(
                    controller: controller,
                    autofocus: true,
                    keyboardType: const TextInputType.numberWithOptions(
                      decimal: true,
                    ),
                    inputFormatters: [
                      FilteringTextInputFormatter.allow(RegExp(r'[0-9.,]')),
                    ],
                    decoration: InputDecoration(
                      prefixText: '\$ ',
                      hintText: '0.00',
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(SizeConfig.r(12)),
                        borderSide: BorderSide(color: AppColors.inputBorder),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(SizeConfig.r(12)),
                        borderSide: BorderSide(color: AppColors.inputBorder),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(SizeConfig.r(12)),
                        borderSide: BorderSide(
                          color: AppColors.primary,
                          width: 1.5,
                        ),
                      ),
                    ),
                    validator: (v) {
                      final normalized = (v ?? '').trim().replaceAll(',', '');
                      final parsed = double.tryParse(normalized);
                      if (parsed == null || parsed <= 0) {
                        return 'Enter a valid amount greater than 0';
                      }
                      return null;
                    },
                  ),
                  SizedBox(height: SizeConfig.r(20)),
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton(
                          onPressed: () => Navigator.pop(ctx),
                          style: OutlinedButton.styleFrom(
                            padding: EdgeInsets.symmetric(
                              vertical: SizeConfig.r(14),
                            ),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(
                                SizeConfig.radiusLG,
                              ),
                            ),
                            side: BorderSide(color: AppColors.inputBorder),
                          ),
                          child: Text(
                            'Cancel',
                            style: TextStyle(
                              fontSize: SizeConfig.sp(14),
                              color: AppColors.textDark,
                            ),
                          ),
                        ),
                      ),
                      SizedBox(width: SizeConfig.r(12)),
                      Expanded(
                        child: ElevatedButton(
                          onPressed: () {
                            if (formKey.currentState!.validate()) {
                              final normalized = controller.text
                                  .trim()
                                  .replaceAll(',', '');
                              Navigator.pop(
                                ctx,
                                double.parse(normalized),
                              );
                            }
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.primary,
                            padding: EdgeInsets.symmetric(
                              vertical: SizeConfig.r(14),
                            ),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(
                                SizeConfig.radiusLG,
                              ),
                            ),
                          ),
                          child: Text(
                            'Send Offer',
                            style: TextStyle(
                              fontSize: SizeConfig.sp(14),
                              fontWeight: FontWeight.w700,
                              color: Colors.white,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );

    if (result != null && mounted) {
      await _updateStatus(
        status: DriverJobRequestService.statusCounterRequest,
        request: request,
        counterOfferPay: result,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    SizeConfig.init(context);
    final request =
        ModalRoute.of(context)?.settings.arguments as DriverJobRequest?;

    if (request == null) {
      return Scaffold(
        appBar: AppBar(
          title: const Text('Requested Job'),
          backgroundColor: const Color(0xFF1B2B4B),
          foregroundColor: Colors.white,
        ),
        body: const Center(child: Text('No job request selected.')),
      );
    }

    return Scaffold(
      backgroundColor: const Color(0xFF1B2B4B),
      body: SafeArea(
        child: Column(
          children: [
            _RequestedJobMap(
              stops: request.stops,
              currentLocation: _currentLocation,
            ),
            Expanded(
              child: Container(
                decoration: BoxDecoration(
                  color: AppColors.background,
                  borderRadius: BorderRadius.only(
                    topLeft: Radius.circular(SizeConfig.r(20)),
                    topRight: Radius.circular(SizeConfig.r(20)),
                  ),
                ),
                child: Column(
                  children: [
                    SizedBox(height: SizeConfig.r(10)),
                    Container(
                      width: SizeConfig.r(40),
                      height: SizeConfig.r(4),
                      decoration: BoxDecoration(
                        color: AppColors.inputBorder,
                        borderRadius: BorderRadius.circular(SizeConfig.r(2)),
                      ),
                    ),
                    SizedBox(height: SizeConfig.r(4)),
                    Expanded(
                      child: SingleChildScrollView(
                        padding: EdgeInsets.symmetric(
                          horizontal: SizeConfig.hPad,
                          vertical: SizeConfig.r(12),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            _JobHeader(request: request),
                            SizedBox(height: SizeConfig.r(4)),
                            _JobTitle(request: request),
                            SizedBox(height: SizeConfig.r(16)),
                            _StopsList(stops: request.stops),
                            SizedBox(height: SizeConfig.r(8)),
                          ],
                        ),
                      ),
                    ),
                    _BottomActions(
                      isSubmitting: _isSubmitting,
                      onReject: () =>
                          _updateStatus(status: 'rejected', request: request),
                      onCounterOffer: () => _showCounterOfferSheet(
                        request,
                      ), // ← was inline _updateStatus
                      onAccept: () =>
                          _updateStatus(status: 'accepted', request: request),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Map — school shown as blue pin, pickups as green
// ─────────────────────────────────────────────────────────────────────────────

class _RequestedJobMap extends StatelessWidget {
  final List<DriverJobRequestStop> stops;
  final LatLng? currentLocation;

  const _RequestedJobMap({required this.stops, required this.currentLocation});

  @override
  Widget build(BuildContext context) {
    // Pickup stops = all non-morning-dropoff stops with coordinates
    final pickupPoints = stops
        .where((s) => !s.isMorningDropoff && s.hasCoordinates)
        .map((s) => LatLng(s.latitude!, s.longitude!))
        .toList();

    // School = morning dropoff stop
    final schoolPoints = stops
        .where((s) => s.isMorningDropoff && s.hasCoordinates)
        .map((s) => LatLng(s.latitude!, s.longitude!))
        .toList();

    final allPoints = <LatLng>[
      if (currentLocation != null) currentLocation!,
      ...pickupPoints,
      ...schoolPoints,
    ];

    if (allPoints.isEmpty) return _MapFallback();

    final center = _calculateCenter(allPoints);
    final zoom = _calculateZoom(allPoints);

    return Stack(
      children: [
        SizedBox(
          height: SizeConfig.sh(32),
          width: double.infinity,
          child: FlutterMap(
            options: MapOptions(
              initialCenter: center,
              initialZoom: zoom,
              minZoom: 3,
              maxZoom: 19,
              interactionOptions: const InteractionOptions(
                flags:
                    InteractiveFlag.pinchZoom |
                    InteractiveFlag.drag |
                    InteractiveFlag.doubleTapZoom |
                    InteractiveFlag.scrollWheelZoom,
              ),
            ),
            children: [
              TileLayer(
                urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                userAgentPackageName: 'com.rideroster.app',
              ),
              MarkerLayer(
                markers: [
                  // Pickup stops — green
                  ...pickupPoints.map(
                    (p) => Marker(
                      point: p,
                      width: 28,
                      height: 28,
                      child: _MapPin(
                        color: AppColors.success,
                        icon: Icons.circle,
                      ),
                    ),
                  ),
                  // School — blue
                  ...schoolPoints.map(
                    (p) => Marker(
                      point: p,
                      width: 32,
                      height: 32,
                      child: _MapPin(
                        color: const Color(0xFF0284C7),
                        icon: Icons.school,
                      ),
                    ),
                  ),
                  // Driver location
                  if (currentLocation != null)
                    Marker(
                      point: currentLocation!,
                      width: 34,
                      height: 34,
                      child: _MapPin(
                        color: AppColors.primary,
                        icon: Icons.my_location,
                      ),
                    ),
                ],
              ),
            ],
          ),
        ),
        Positioned(
          top: SizeConfig.r(8),
          left: SizeConfig.r(8),
          child: Builder(
            builder: (ctx) => GestureDetector(
              onTap: () => Navigator.maybePop(ctx),
              child: Container(
                width: SizeConfig.r(36),
                height: SizeConfig.r(36),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.85),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  Icons.arrow_back,
                  color: AppColors.textDark,
                  size: SizeConfig.r(18),
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }

  LatLng _calculateCenter(List<LatLng> points) {
    var latSum = 0.0;
    var lngSum = 0.0;
    for (final p in points) {
      latSum += p.latitude;
      lngSum += p.longitude;
    }
    return LatLng(latSum / points.length, lngSum / points.length);
  }

  double _calculateZoom(List<LatLng> points) {
    if (points.length <= 1) return 14;
    var minLat = points.first.latitude;
    var maxLat = points.first.latitude;
    var minLng = points.first.longitude;
    var maxLng = points.first.longitude;
    for (final p in points) {
      if (p.latitude < minLat) minLat = p.latitude;
      if (p.latitude > maxLat) maxLat = p.latitude;
      if (p.longitude < minLng) minLng = p.longitude;
      if (p.longitude > maxLng) maxLng = p.longitude;
    }
    final span = (maxLat - minLat).abs() > (maxLng - minLng).abs()
        ? (maxLat - minLat).abs()
        : (maxLng - minLng).abs();
    if (span < 0.01) return 14;
    if (span < 0.03) return 13;
    if (span < 0.08) return 12;
    if (span < 0.2) return 11;
    if (span < 0.5) return 10;
    return 9;
  }
}

class _MapPin extends StatelessWidget {
  final Color color;
  final IconData icon;
  const _MapPin({required this.color, required this.icon});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        shape: BoxShape.circle,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.2),
            blurRadius: 3,
            offset: const Offset(0, 1),
          ),
        ],
      ),
      alignment: Alignment.center,
      child: Icon(icon, color: color, size: SizeConfig.r(14)),
    );
  }
}

class _MapFallback extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        Container(
          height: SizeConfig.sh(32),
          width: double.infinity,
          color: const Color(0xFF1B2B4B),
          child: Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  Icons.map_outlined,
                  color: Colors.white.withValues(alpha: 0.3),
                  size: SizeConfig.r(48),
                ),
                SizedBox(height: SizeConfig.r(8)),
                Text(
                  'Map (location unavailable)',
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.3),
                    fontSize: SizeConfig.sp(16),
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
        ),
        Positioned(
          top: SizeConfig.r(8),
          left: SizeConfig.r(8),
          child: Builder(
            builder: (ctx) => GestureDetector(
              onTap: () => Navigator.maybePop(ctx),
              child: Container(
                width: SizeConfig.r(36),
                height: SizeConfig.r(36),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.15),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  Icons.arrow_back,
                  color: Colors.white,
                  size: SizeConfig.r(18),
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Job Header
// ─────────────────────────────────────────────────────────────────────────────

class _JobHeader extends StatelessWidget {
  final DriverJobRequest request;
  const _JobHeader({required this.request});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (request.semesterLabel.isNotEmpty)
                Container(
                  padding: EdgeInsets.symmetric(
                    horizontal: SizeConfig.r(8),
                    vertical: SizeConfig.r(3),
                  ),
                  decoration: BoxDecoration(
                    color: AppColors.primary,
                    borderRadius: BorderRadius.circular(SizeConfig.r(4)),
                  ),
                  child: Text(
                    request.semesterLabel,
                    style: TextStyle(
                      fontSize: SizeConfig.sp(11),
                      fontWeight: FontWeight.w600,
                      color: Colors.white,
                    ),
                  ),
                ),
              SizedBox(height: SizeConfig.r(6)),
              Text(
                '# ${request.internalJobId ?? request.id.substring(0, 8)}',
                style: TextStyle(
                  fontSize: SizeConfig.sp(12),
                  color: AppColors.textLight,
                ),
              ),
            ],
          ),
        ),
        SizedBox(width: SizeConfig.r(12)),
        Column(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Text(
              request.earnings,
              style: TextStyle(
                fontSize: SizeConfig.sp(20),
                fontWeight: FontWeight.w800,
                color: AppColors.warning,
              ),
            ),
            Text(
              'Est. Earnings',
              style: TextStyle(
                fontSize: SizeConfig.sp(11),
                color: AppColors.textLight,
              ),
            ),
          ],
        ),
      ],
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Job Title
// ─────────────────────────────────────────────────────────────────────────────

class _JobTitle extends StatelessWidget {
  final DriverJobRequest request;
  const _JobTitle({required this.request});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          request.title.isEmpty ? 'School Route' : request.title,
          style: TextStyle(
            fontSize: SizeConfig.sp(20),
            fontWeight: FontWeight.w800,
            color: AppColors.textDark,
          ),
        ),
        SizedBox(height: SizeConfig.r(4)),
        if (request.accessibilityNote.isNotEmpty)
          Text(
            request.accessibilityNote,
            style: TextStyle(
              fontSize: SizeConfig.sp(13),
              color: AppColors.textLight,
            ),
          ),
      ],
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Stops List — morning section then evening section
// ─────────────────────────────────────────────────────────────────────────────

class _StopsList extends StatelessWidget {
  final List<DriverJobRequestStop> stops;
  const _StopsList({required this.stops});

  @override
  Widget build(BuildContext context) {
    if (stops.isEmpty) {
      return Text(
        'No stop details available.',
        style: TextStyle(
          fontSize: SizeConfig.sp(13),
          color: AppColors.textMedium,
        ),
      );
    }

    final outboundStops = stops
        .where((s) => s.direction == 'outbound')
        .toList();
    final inboundStops = stops.where((s) => s.direction == 'inbound').toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Morning section
        if (outboundStops.isNotEmpty) ...[
          _SectionHeader(
            label: 'Morning Run',
            icon: Icons.wb_sunny_outlined,
            color: const Color(0xFFF59E0B),
          ),
          SizedBox(height: SizeConfig.r(12)),
          _StopsTimeline(stops: outboundStops),
        ],

        // Divider
        if (outboundStops.isNotEmpty && inboundStops.isNotEmpty) ...[
          SizedBox(height: SizeConfig.r(20)),
          Row(
            children: [
              Expanded(child: Divider(color: AppColors.inputBorder, height: 1)),
              Padding(
                padding: EdgeInsets.symmetric(horizontal: SizeConfig.r(10)),
                child: Text(
                  'Evening',
                  style: TextStyle(
                    fontSize: SizeConfig.sp(11),
                    color: AppColors.textLight,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
              Expanded(child: Divider(color: AppColors.inputBorder, height: 1)),
            ],
          ),
          SizedBox(height: SizeConfig.r(20)),
        ],

        // Evening section
        if (inboundStops.isNotEmpty) ...[
          _SectionHeader(
            label: 'Evening Return',
            icon: Icons.nights_stay_outlined,
            color: const Color(0xFF7C3AED),
          ),
          SizedBox(height: SizeConfig.r(12)),
          _StopsTimeline(stops: inboundStops),
        ],
      ],
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Section header chip
// ─────────────────────────────────────────────────────────────────────────────

class _SectionHeader extends StatelessWidget {
  final String label;
  final IconData icon;
  final Color color;

  const _SectionHeader({
    required this.label,
    required this.icon,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: SizeConfig.r(10),
        vertical: SizeConfig.r(5),
      ),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.10),
        borderRadius: BorderRadius.circular(SizeConfig.r(6)),
        border: Border.all(color: color.withValues(alpha: 0.25), width: 1),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: SizeConfig.r(13), color: color),
          SizedBox(width: SizeConfig.r(5)),
          Text(
            label,
            style: TextStyle(
              fontSize: SizeConfig.sp(12),
              fontWeight: FontWeight.w700,
              color: color,
            ),
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Timeline for one section
// ─────────────────────────────────────────────────────────────────────────────

class _StopsTimeline extends StatelessWidget {
  final List<DriverJobRequestStop> stops;
  const _StopsTimeline({required this.stops});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: stops.asMap().entries.map((entry) {
        final isLast = entry.key == stops.length - 1;
        return _StopRow(stop: entry.value, isLast: isLast);
      }).toList(),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Single stop row
// ─────────────────────────────────────────────────────────────────────────────

class _StopRow extends StatelessWidget {
  final DriverJobRequestStop stop;
  final bool isLast;

  const _StopRow({required this.stop, required this.isLast});

  // Dot color:
  //   Morning Pickup       → green
  //   Morning Dropoff      → blue (school arrival)
  //   Return from School   → purple (evening pickup)
  Color get _dotColor {
    if (stop.isMorningDropoff) return const Color(0xFF0284C7);
    if (stop.isInbound) return const Color(0xFF7C3AED);
    return AppColors.success;
  }

  @override
  Widget build(BuildContext context) {
    final dotColor = _dotColor;

    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Timeline dot + connector line
          SizedBox(
            width: SizeConfig.r(24),
            child: Column(
              children: [
                SizedBox(height: SizeConfig.r(3)),
                Container(
                  width: SizeConfig.r(12),
                  height: SizeConfig.r(12),
                  decoration: BoxDecoration(
                    color: dotColor,
                    shape: BoxShape.circle,
                  ),
                ),
                if (!isLast)
                  Expanded(
                    child: Container(
                      width: 2,
                      color: AppColors.inputBorder,
                      margin: EdgeInsets.symmetric(vertical: SizeConfig.r(3)),
                    ),
                  ),
              ],
            ),
          ),
          SizedBox(width: SizeConfig.r(10)),
          // Content
          Expanded(
            child: Padding(
              padding: EdgeInsets.only(bottom: isLast ? 0 : SizeConfig.r(20)),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Type label + time
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        stop.type,
                        style: TextStyle(
                          fontSize: SizeConfig.sp(11),
                          fontWeight: FontWeight.w700,
                          color: dotColor,
                          letterSpacing: 0.2,
                        ),
                      ),
                      Text(
                        stop.time,
                        style: TextStyle(
                          fontSize: SizeConfig.sp(12),
                          fontWeight: FontWeight.w600,
                          color: AppColors.textMedium,
                        ),
                      ),
                    ],
                  ),
                  SizedBox(height: SizeConfig.r(3)),
                  // Address
                  Text(
                    stop.address,
                    style: TextStyle(
                      fontSize: SizeConfig.sp(13),
                      fontWeight: FontWeight.w500,
                      color: AppColors.textDark,
                    ),
                  ),
                  // Weekday chips
                  if (stop.weekdays.isNotEmpty) ...[
                    SizedBox(height: SizeConfig.r(8)),
                    Wrap(
                      spacing: SizeConfig.r(5),
                      runSpacing: SizeConfig.r(4),
                      children: stop.weekdays
                          .map((d) => _WeekdayChip(day: d, color: dotColor))
                          .toList(),
                    ),
                  ],
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Weekday chip
// ─────────────────────────────────────────────────────────────────────────────

class _WeekdayChip extends StatelessWidget {
  final String day;
  final Color color;
  const _WeekdayChip({required this.day, required this.color});

  static const _labels = {
    'mon': 'Mon',
    'tue': 'Tue',
    'wed': 'Wed',
    'thu': 'Thu',
    'fri': 'Fri',
    'sat': 'Sat',
    'sun': 'Sun',
  };

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: SizeConfig.r(7),
        vertical: SizeConfig.r(3),
      ),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.10),
        borderRadius: BorderRadius.circular(SizeConfig.r(4)),
        border: Border.all(color: color.withValues(alpha: 0.30), width: 1),
      ),
      child: Text(
        _labels[day] ?? day,
        style: TextStyle(
          fontSize: SizeConfig.sp(10),
          fontWeight: FontWeight.w600,
          color: color,
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Bottom Actions
// ─────────────────────────────────────────────────────────────────────────────

class _BottomActions extends StatelessWidget {
  final VoidCallback onReject;
  final VoidCallback onCounterOffer;
  final VoidCallback onAccept;
  final bool isSubmitting;

  const _BottomActions({
    required this.onReject,
    required this.onCounterOffer,
    required this.onAccept,
    required this.isSubmitting,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.fromLTRB(
        SizeConfig.hPad,
        SizeConfig.r(10),
        SizeConfig.hPad,
        SizeConfig.r(16),
      ),
      decoration: BoxDecoration(
        color: AppColors.background,
        border: Border(top: BorderSide(color: AppColors.inputBorder, width: 1)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            children: [
              Expanded(
                child: _OutlinedBtn(
                  label: 'Reject',
                  onTap: isSubmitting ? null : onReject,
                ),
              ),
              SizedBox(width: SizeConfig.r(12)),
              Expanded(
                child: _OutlinedBtn(
                  label: 'Counter Offer',
                  onTap: isSubmitting ? null : onCounterOffer,
                ),
              ),
            ],
          ),
          SizedBox(height: SizeConfig.r(10)),
          AppButton(
            label: 'Accept Job',
            height: SizeConfig.r(50),
            borderRadius: SizeConfig.radiusLG,
            trailingIcon: Icon(
              Icons.arrow_forward,
              color: Colors.white,
              size: SizeConfig.r(18),
            ),
            onPressed: isSubmitting ? null : onAccept,
          ),
        ],
      ),
    );
  }
}

class _OutlinedBtn extends StatelessWidget {
  final String label;
  final VoidCallback? onTap;
  const _OutlinedBtn({required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        height: SizeConfig.r(46),
        decoration: BoxDecoration(
          color: onTap == null ? AppColors.surfaceGray : AppColors.background,
          borderRadius: BorderRadius.circular(SizeConfig.radiusLG),
          border: Border.all(color: AppColors.inputBorder, width: 1.5),
        ),
        alignment: Alignment.center,
        child: Text(
          label,
          style: TextStyle(
            fontSize: SizeConfig.sp(14),
            fontWeight: FontWeight.w600,
            color: AppColors.textDark,
          ),
        ),
      ),
    );
  }
}
