import 'dart:math';
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../../components/offline_banner.dart';
import '../../../../services/connectivity_service.dart';
import '../../../../services/pa_sos_location_service.dart';
import '../../../../utils/app_colors.dart';
import '../../../../utils/size_confg.dart';

class PaSOSPage extends StatefulWidget {
  const PaSOSPage({super.key});

  @override
  State<PaSOSPage> createState() => _PaSOSPageState();
}

class _PaSOSPageState extends State<PaSOSPage> with SingleTickerProviderStateMixin {
  static const String _safetyLineDisplay = '+92 321 5352420';
  static final Uri _safetyLineTel = Uri.parse('tel:+923215352420');

  late final AnimationController _controller;
  final PaSosLocationService _sosLocationService = PaSosLocationService();
  bool _isSubmittingSos = false;

  @override
  void initState() {
    super.initState();
    _sosLocationService.init();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 3),
    );
    _controller.addStatusListener((status) {
      if (status == AnimationStatus.completed) {
        _onSOSTriggered();
      }
    });
  }

  Future<void> _onSOSTriggered() async {
    if (_isSubmittingSos) return;

    if (!ConnectivityService().canReachServer) {
      _controller.reset();
      _showOfflineSosToast();
      return;
    }

    setState(() => _isSubmittingSos = true);
    try {
      await _sosLocationService.createSosAlert();
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('SOS alert sent successfully.'),
          backgroundColor: Color(0xFF16A34A),
          behavior: SnackBarBehavior.floating,
        ),
      );
    } catch (error) {
      if (!mounted) return;
      if (_isConnectivityError(error)) {
        _showOfflineSosToast();
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(_friendlySosError(error)),
            backgroundColor: const Color(0xFFDC2626),
            duration: const Duration(seconds: 5),
          ),
        );
      }
    } finally {
      _controller.reset();
      if (mounted) {
        setState(() => _isSubmittingSos = false);
      }
    }
  }

  bool _isConnectivityError(Object error) {
    if (!ConnectivityService().canReachServer) return true;
    final text = error is StateError ? error.message : error.toString();
    final lower = text.toLowerCase();
    return lower.contains('offline') ||
        lower.contains('connection') ||
        lower.contains('internet') ||
        lower.contains('socket') ||
        lower.contains('network') ||
        lower.contains('host');
  }

  String _friendlySosError(Object error) {
    if (error is StateError) {
      final msg = error.message;
      if (msg.contains('Location permission')) {
        return 'Location permission is required to send an SOS alert.';
      }
      if (msg.contains('vehicle') || msg.contains('job')) {
        return 'No assigned vehicle found. Call the safety line if you need help.';
      }
      return msg.replaceFirst('Bad state: ', '');
    }
    return 'Unable to send SOS right now. Call the safety line if you need immediate help.';
  }

  void _showOfflineSosToast() {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('No internet. Please call $_safetyLineDisplay instead.'),
        backgroundColor: AppColors.textDark,
        behavior: SnackBarBehavior.floating,
        duration: const Duration(seconds: 5),
        action: SnackBarAction(
          label: 'Call',
          textColor: Colors.white,
          onPressed: _callSafetyLine,
        ),
      ),
    );
  }

  void _onLongPressStart(LongPressStartDetails _) {
    if (_isSubmittingSos) return;
    _controller.forward();
  }

  void _onLongPressEnd(LongPressEndDetails _) {
    if (_isSubmittingSos) return;
    if (_controller.status != AnimationStatus.completed) {
      _controller.reverse();
    }
  }

  Future<void> _callSafetyLine() async {
    try {
      final ok = await launchUrl(
        _safetyLineTel,
        mode: LaunchMode.externalApplication,
      );
      if (!ok && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Could not open the phone app.'),
            backgroundColor: Color(0xFFDC2626),
          ),
        );
      }
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Could not start the call.'),
          backgroundColor: Color(0xFFDC2626),
        ),
      );
    }
  }

  @override
  void dispose() {
    _sosLocationService.dispose();
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    SizeConfig.init(context);
    return Scaffold(
      backgroundColor: AppColors.surfaceGray,
      body: SafeArea(
        child: Column(
          children: [
            const OfflineBanner(),
            _buildAppBar(context),
            Expanded(
              child: SingleChildScrollView(
                padding: EdgeInsets.symmetric(horizontal: SizeConfig.hPad),
                child: Column(
                  children: [
                    SizedBox(height: SizeConfig.r(28)),
                    _buildShieldIcon(),
                    SizedBox(height: SizeConfig.r(20)),
                    Text(
                      'Emergency Assistance',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: SizeConfig.sp(24),
                        fontWeight: FontWeight.w800,
                        color: AppColors.textDark,
                      ),
                    ),
                    SizedBox(height: SizeConfig.r(10)),
                    Text(
                      'Press and hold the button below for 3 seconds to\ntrigger an emergency alert.',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: SizeConfig.sp(13),
                        color: AppColors.textLight,
                        height: 1.6,
                      ),
                    ),
                    SizedBox(height: SizeConfig.r(36)),
                    _buildSOSButton(),
                    SizedBox(height: SizeConfig.r(36)),
                    _buildSilentAlertCard(),
                    SizedBox(height: SizeConfig.r(28)),
                    Text(
                      'Other Safety Options',
                      style: TextStyle(
                        fontSize: SizeConfig.sp(13),
                        fontWeight: FontWeight.w600,
                        color: AppColors.textLight,
                      ),
                    ),
                    SizedBox(height: SizeConfig.r(12)),
                    _buildCallSafetyLine(),
                    SizedBox(height: SizeConfig.r(28)),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAppBar(BuildContext context) {
    return Padding(
      padding: EdgeInsets.symmetric(
        horizontal: SizeConfig.r(4),
        vertical: SizeConfig.r(8),
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
              'Safety Center',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: SizeConfig.sp(17),
                fontWeight: FontWeight.w600,
                color: AppColors.textDark,
              ),
            ),
          ),
          SizedBox(width: SizeConfig.r(48)),
        ],
      ),
    );
  }

  Widget _buildShieldIcon() {
    return Container(
      width: SizeConfig.r(80),
      height: SizeConfig.r(80),
      decoration: const BoxDecoration(
        color: Color(0xFFDCEEFD),
        shape: BoxShape.circle,
      ),
      child: Icon(
        Icons.shield,
        color: const Color(0xFF0284C7),
        size: SizeConfig.r(40),
      ),
    );
  }

  Widget _buildSOSButton() {
    final buttonSize = SizeConfig.r(180);
    return GestureDetector(
      onLongPressStart: _onLongPressStart,
      onLongPressEnd: _onLongPressEnd,
      child: AnimatedBuilder(
        animation: _controller,
        builder: (_, __) {
          return SizedBox(
            width: buttonSize,
            height: buttonSize,
            child: CustomPaint(
              painter: _SOSRingPainter(progress: _controller.value),
              child: Center(
                child: Container(
                  width: buttonSize * 0.68,
                  height: buttonSize * 0.68,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: const Color(0xFFEF4444),
                      width: SizeConfig.r(2.5),
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFFEF4444).withValues(alpha: 0.15),
                        blurRadius: 20,
                        spreadRadius: 4,
                      ),
                    ],
                  ),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      if (_isSubmittingSos)
                        SizedBox(
                          width: SizeConfig.r(28),
                          height: SizeConfig.r(28),
                          child: const CircularProgressIndicator(
                            strokeWidth: 2.5,
                            valueColor: AlwaysStoppedAnimation<Color>(
                              Color(0xFFEF4444),
                            ),
                          ),
                        )
                      else
                        Icon(
                          Icons.notifications,
                          color: const Color(0xFFEF4444),
                          size: SizeConfig.r(36),
                        ),
                      SizedBox(height: SizeConfig.r(4)),
                      Text(
                        _isSubmittingSos ? 'Sending' : 'SOS',
                        style: TextStyle(
                          fontSize: SizeConfig.sp(14),
                          fontWeight: FontWeight.w700,
                          color: const Color(0xFFEF4444),
                          letterSpacing: 2,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildSilentAlertCard() {
    return Container(
      padding: EdgeInsets.all(SizeConfig.r(14)),
      decoration: BoxDecoration(
        color: AppColors.background,
        borderRadius: BorderRadius.circular(SizeConfig.radiusLG),
        border: Border.all(color: AppColors.inputBorder, width: 1),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: SizeConfig.r(30),
            height: SizeConfig.r(30),
            decoration: const BoxDecoration(
              color: Color(0xFFE5E7EB),
              shape: BoxShape.circle,
            ),
            child: Icon(
              Icons.info_outline,
              size: SizeConfig.r(16),
              color: AppColors.textMedium,
            ),
          ),
          SizedBox(width: SizeConfig.r(12)),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Silent Alert Mode',
                  style: TextStyle(
                    fontSize: SizeConfig.sp(14),
                    fontWeight: FontWeight.w700,
                    color: AppColors.textDark,
                  ),
                ),
                SizedBox(height: SizeConfig.r(4)),
                Text(
                  'Activating SOS will silently notify our safety team and share your live location and trip details immediately.',
                  style: TextStyle(
                    fontSize: SizeConfig.sp(12),
                    color: AppColors.textMedium,
                    height: 1.5,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCallSafetyLine() {
    return Material(
      color: AppColors.background,
      borderRadius: BorderRadius.circular(SizeConfig.radiusLG),
      child: InkWell(
        onTap: _callSafetyLine,
        borderRadius: BorderRadius.circular(SizeConfig.radiusLG),
        child: Container(
          width: double.infinity,
          padding: EdgeInsets.all(SizeConfig.r(16)),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(SizeConfig.radiusLG),
            border: Border.all(color: AppColors.inputBorder, width: 1),
          ),
          child: Row(
            children: [
              Container(
                width: SizeConfig.r(44),
                height: SizeConfig.r(44),
                decoration: const BoxDecoration(
                  color: Color(0xFFDCEEFD),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  Icons.phone,
                  color: const Color(0xFF0284C7),
                  size: SizeConfig.r(22),
                ),
              ),
              SizedBox(width: SizeConfig.r(12)),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Call Safety Line',
                      style: TextStyle(
                        fontSize: SizeConfig.sp(15),
                        fontWeight: FontWeight.w700,
                        color: AppColors.textDark,
                      ),
                    ),
                    SizedBox(height: SizeConfig.r(2)),
                    Text(
                      _safetyLineDisplay,
                      style: TextStyle(
                        fontSize: SizeConfig.sp(13),
                        fontWeight: FontWeight.w600,
                        color: const Color(0xFF0284C7),
                      ),
                    ),
                    SizedBox(height: SizeConfig.r(2)),
                    Text(
                      '24/7 Support Team',
                      style: TextStyle(
                        fontSize: SizeConfig.sp(12),
                        color: AppColors.textLight,
                      ),
                    ),
                  ],
                ),
              ),
              Icon(
                Icons.chevron_right,
                color: AppColors.textLight,
                size: SizeConfig.r(22),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _SOSRingPainter extends CustomPainter {
  final double progress;

  const _SOSRingPainter({required this.progress});

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = size.width / 2 - 6;

    const segmentCount = 12;
    const totalAngle = 2 * pi;
    const gapFraction = 0.25;
    final segmentAngle = totalAngle / segmentCount;
    final arcAngle = segmentAngle * (1 - gapFraction);

    final inactivePaint = Paint()
      ..color = const Color(0xFFEF4444).withValues(alpha: 0.25)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 5
      ..strokeCap = StrokeCap.round;

    final activePaint = Paint()
      ..color = const Color(0xFFEF4444)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 5
      ..strokeCap = StrokeCap.round;

    for (int i = 0; i < segmentCount; i++) {
      final startAngle = -pi / 2 + i * segmentAngle;
      final segmentProgress = i / segmentCount;
      final paint = segmentProgress < progress ? activePaint : inactivePaint;
      canvas.drawArc(
        Rect.fromCircle(center: center, radius: radius),
        startAngle,
        arcAngle,
        false,
        paint,
      );
    }
  }

  @override
  bool shouldRepaint(_SOSRingPainter old) => old.progress != progress;
}
