import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:geolocator/geolocator.dart';
import 'package:latlong2/latlong.dart';
import '../../../../components/app_button.dart';
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
          permission != LocationPermission.whileInUse) {
        return;
      }

      final pos = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
        ),
      );
      if (!mounted) return;
      setState(() {
        _currentLocation = LatLng(pos.latitude, pos.longitude);
      });
    } catch (_) {
      // Keep map visible with stop markers even if current location fails.
    }
  }

  Future<void> _updateStatus({
    required String status,
    required DriverJobRequest request,
  }) async {
    if (_isSubmitting) return;
    setState(() => _isSubmitting = true);
    try {
      await _service.updateApprovalStatus(jobId: request.id, status: status);
      if (!mounted) return;
      final statusLabel = switch (status) {
        'accepted' => 'accepted',
        'rejected' => 'rejected',
        'counter request' => 'counter requested',
        _ => status,
      };
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Job $statusLabel')),
      );
      Navigator.pop(context, true);
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Unable to update request right now.')),
      );
    } finally {
      if (mounted) {
        setState(() => _isSubmitting = false);
      }
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
            // ── Map area ───────────────────────────────────────────────
            _RequestedJobMap(
              stops: request.stops,
              currentLocation: _currentLocation,
            ),
            // ── Job detail sheet ───────────────────────────────────────
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
                    // Drag handle
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
                    // Scrollable content
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
                    // Fixed bottom buttons
                    _BottomActions(
                      isSubmitting: _isSubmitting,
                      onReject: () =>
                          _updateStatus(status: 'rejected', request: request),
                      onCounterOffer: () => _updateStatus(
                        status: 'counter request',
                        request: request,
                      ),
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
// Map
// ─────────────────────────────────────────────────────────────────────────────

class _RequestedJobMap extends StatelessWidget {
  final List<DriverJobRequestStop> stops;
  final LatLng? currentLocation;

  const _RequestedJobMap({required this.stops, required this.currentLocation});

  @override
  Widget build(BuildContext context) {
    final pickupPoints = stops
        .where((s) => !s.isDropoff && s.hasCoordinates)
        .map((s) => LatLng(s.latitude!, s.longitude!))
        .toList();
    final dropoffPoints = stops
        .where((s) => s.isDropoff && s.hasCoordinates)
        .map((s) => LatLng(s.latitude!, s.longitude!))
        .toList();

    final allPoints = <LatLng>[
      if (currentLocation != null) currentLocation!,
      ...pickupPoints,
      ...dropoffPoints,
    ];

    if (allPoints.isEmpty) {
      return _MapFallback();
    }

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
                flags: InteractiveFlag.pinchZoom |
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
                  ...pickupPoints.map(
                    (point) => Marker(
                      point: point,
                      width: 28,
                      height: 28,
                      child: _MapPin(
                        color: AppColors.success,
                        icon: Icons.circle,
                      ),
                    ),
                  ),
                  ...dropoffPoints.map(
                    (point) => Marker(
                      point: point,
                      width: 28,
                      height: 28,
                      child: _MapPin(
                        color: AppColors.textDark,
                        icon: Icons.circle,
                      ),
                    ),
                  ),
                  if (currentLocation != null)
                    Marker(
                      point: currentLocation!,
                      width: 34,
                      height: 34,
                      child: _MapPin(color: AppColors.primary, icon: Icons.my_location),
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
            builder: (context) => GestureDetector(
              onTap: () => Navigator.maybePop(context),
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
    for (final point in points) {
      latSum += point.latitude;
      lngSum += point.longitude;
    }
    return LatLng(latSum / points.length, lngSum / points.length);
  }

  double _calculateZoom(List<LatLng> points) {
    if (points.length <= 1) return 14;

    var minLat = points.first.latitude;
    var maxLat = points.first.latitude;
    var minLng = points.first.longitude;
    var maxLng = points.first.longitude;

    for (final point in points) {
      if (point.latitude < minLat) minLat = point.latitude;
      if (point.latitude > maxLat) maxLat = point.latitude;
      if (point.longitude < minLng) minLng = point.longitude;
      if (point.longitude > maxLng) maxLng = point.longitude;
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
        // Back button
        Positioned(
          top: SizeConfig.r(8),
          left: SizeConfig.r(8),
          child: Builder(
            builder: (context) => GestureDetector(
              onTap: () => Navigator.maybePop(context),
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
// Job Header (ASAP badge + price)
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
        Row(
          children: [
            Container(
              padding: EdgeInsets.symmetric(
                horizontal: SizeConfig.r(8),
                vertical: SizeConfig.r(3),
              ),
              decoration: BoxDecoration(
                color: AppColors.warning,
                borderRadius: BorderRadius.circular(SizeConfig.r(4)),
              ),
              child: Text(
                'ASAP',
                style: TextStyle(
                  fontSize: SizeConfig.sp(11),
                  fontWeight: FontWeight.w700,
                  color: Colors.white,
                ),
              ),
            ),
            SizedBox(width: SizeConfig.r(8)),
            Text(
              '• #${request.internalJobId ?? request.id.substring(0, 8)}',
              style: TextStyle(
                fontSize: SizeConfig.sp(12),
                color: AppColors.textLight,
              ),
            ),
          ],
        ),
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
// Job Title + accessibility note
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
// Stops Timeline
// ─────────────────────────────────────────────────────────────────────────────

class _StopItem {
  final String type;
  final String address;
  final String time;
  final bool isDropoff;

  const _StopItem({
    required this.type,
    required this.address,
    required this.time,
    this.isDropoff = false,
  });
}

class _StopsList extends StatelessWidget {
  final List<DriverJobRequestStop> stops;

  const _StopsList({required this.stops});

  @override
  Widget build(BuildContext context) {
    final items = stops
        .map(
          (stop) => _StopItem(
            type: stop.type,
            address: stop.address,
            time: stop.time,
            isDropoff: stop.isDropoff,
          ),
        )
        .toList();

    if (items.isEmpty) {
      return Text(
        'No stop details available.',
        style: TextStyle(
          fontSize: SizeConfig.sp(13),
          color: AppColors.textMedium,
        ),
      );
    }

    return Column(
      children: items.asMap().entries.map((entry) {
        final i = entry.key;
        final stop = entry.value;
        final isLast = i == items.length - 1;
        return _StopRow(stop: stop, isLast: isLast);
      }).toList(),
    );
  }
}

class _StopRow extends StatelessWidget {
  final _StopItem stop;
  final bool isLast;

  const _StopRow({required this.stop, required this.isLast});

  @override
  Widget build(BuildContext context) {
    final dotColor = stop.isDropoff ? AppColors.textDark : AppColors.success;

    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Timeline column
          SizedBox(
            width: SizeConfig.r(20),
            child: Column(
              children: [
                SizedBox(height: SizeConfig.r(3)),
                Container(
                  width: SizeConfig.r(10),
                  height: SizeConfig.r(10),
                  decoration: BoxDecoration(
                    color: dotColor,
                    shape: BoxShape.circle,
                  ),
                ),
                if (!isLast)
                  Expanded(
                    child: Container(
                      width: 1.5,
                      color: AppColors.inputBorder,
                      margin: EdgeInsets.symmetric(vertical: SizeConfig.r(2)),
                    ),
                  ),
              ],
            ),
          ),
          SizedBox(width: SizeConfig.r(10)),
          // Stop details
          Expanded(
            child: Padding(
              padding: EdgeInsets.only(bottom: isLast ? 0 : SizeConfig.r(16)),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '${stop.type} •',
                          style: TextStyle(
                            fontSize: SizeConfig.sp(12),
                            fontWeight: FontWeight.w600,
                            color: stop.isDropoff
                                ? AppColors.textMedium
                                : AppColors.success,
                          ),
                        ),
                        SizedBox(height: SizeConfig.r(2)),
                        Text(
                          stop.address,
                          style: TextStyle(
                            fontSize: SizeConfig.sp(13),
                            color: AppColors.textDark,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Text(
                    stop.time,
                    style: TextStyle(
                      fontSize: SizeConfig.sp(12),
                      color: AppColors.textMedium,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
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
// Bottom Action Buttons
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
        border: Border(
          top: BorderSide(color: AppColors.inputBorder, width: 1),
        ),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Reject + Counter Offer row
          Row(
            children: [
              Expanded(
                child: _OutlinedActionButton(
                  label: 'Reject',
                  onTap: isSubmitting ? null : onReject,
                ),
              ),
              SizedBox(width: SizeConfig.r(12)),
              Expanded(
                child: _OutlinedActionButton(
                  label: 'Counter Offer',
                  onTap: isSubmitting ? null : onCounterOffer,
                ),
              ),
            ],
          ),
          SizedBox(height: SizeConfig.r(10)),
          // Accept Job button
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

class _OutlinedActionButton extends StatelessWidget {
  final String label;
  final VoidCallback? onTap;

  const _OutlinedActionButton({required this.label, required this.onTap});

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
