import 'package:flutter/material.dart';

import 'app_colors.dart';
import 'size_confg.dart';

/// Drives shimmer phase for descendant [ShimmerBox] widgets.
class Shimmer extends StatefulWidget {
  const Shimmer({super.key, required this.child});

  final Widget child;

  @override
  State<Shimmer> createState() => _ShimmerState();
}

class _ShimmerState extends State<Shimmer> with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1600),
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, _) {
        return _ShimmerPhase(
          value: _controller.value,
          child: widget.child,
        );
      },
    );
  }
}

class _ShimmerPhase extends InheritedWidget {
  const _ShimmerPhase({required this.value, required super.child});

  final double value;

  static double of(BuildContext context) {
    final scope = context.dependOnInheritedWidgetOfExactType<_ShimmerPhase>();
    return scope?.value ?? 0;
  }

  @override
  bool updateShouldNotify(covariant _ShimmerPhase oldWidget) {
    return oldWidget.value != value;
  }
}

/// Rounded rectangle placeholder; must be a descendant of [Shimmer].
class ShimmerBox extends StatelessWidget {
  const ShimmerBox({
    super.key,
    this.width,
    this.height,
    this.borderRadius,
  });

  final double? width;
  final double? height;
  final BorderRadius? borderRadius;

  @override
  Widget build(BuildContext context) {
    final phase = _ShimmerPhase.of(context);
    final r = borderRadius ?? BorderRadius.circular(SizeConfig.r(8));

    return ShaderMask(
      blendMode: BlendMode.srcATop,
      shaderCallback: (bounds) {
        final dx = -1.2 + phase * 2.4;
        return LinearGradient(
          begin: Alignment(dx, 0),
          end: Alignment(dx + 0.8, 0),
          colors: const [
            Color(0xFFE8ECF0),
            Color(0xFFF8FAFC),
            Color(0xFFE8ECF0),
          ],
          stops: const [0.0, 0.45, 1.0],
        ).createShader(bounds);
      },
      child: Container(
        width: width,
        height: height,
        decoration: BoxDecoration(
          color: const Color(0xFFE8ECF0),
          borderRadius: r,
        ),
      ),
    );
  }
}

/// Skeleton inside the “Current Job” card shell (title stays real).
class DashboardCurrentJobCardShimmer extends StatelessWidget {
  const DashboardCurrentJobCardShimmer({super.key});

  @override
  Widget build(BuildContext context) {
    return Shimmer(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          ShimmerBox(
            width: SizeConfig.r(160),
            height: SizeConfig.r(22),
            borderRadius: BorderRadius.circular(SizeConfig.r(6)),
          ),
          SizedBox(height: SizeConfig.r(12)),
          ShimmerBox(
            height: SizeConfig.r(14),
            borderRadius: BorderRadius.circular(SizeConfig.r(4)),
          ),
          SizedBox(height: SizeConfig.r(8)),
          ShimmerBox(
            width: SizeConfig.r(200),
            height: SizeConfig.r(14),
            borderRadius: BorderRadius.circular(SizeConfig.r(4)),
          ),
          SizedBox(height: SizeConfig.r(8)),
          ShimmerBox(
            height: SizeConfig.r(14),
            borderRadius: BorderRadius.circular(SizeConfig.r(4)),
          ),
          SizedBox(height: SizeConfig.r(14)),
          Row(
            children: [
              ShimmerBox(
                width: SizeConfig.r(120),
                height: SizeConfig.r(40),
                borderRadius: BorderRadius.circular(SizeConfig.radius),
              ),
              SizedBox(width: SizeConfig.r(10)),
              ShimmerBox(
                width: SizeConfig.r(100),
                height: SizeConfig.r(40),
                borderRadius: BorderRadius.circular(SizeConfig.radius),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

/// Four stat tiles matching the dashboard grid.
class DashboardStatsGridShimmer extends StatelessWidget {
  const DashboardStatsGridShimmer({super.key});

  @override
  Widget build(BuildContext context) {
    return Shimmer(
      child: GridView.builder(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        itemCount: 4,
        gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          mainAxisSpacing: SizeConfig.r(10),
          crossAxisSpacing: SizeConfig.r(10),
          childAspectRatio: 1.35,
        ),
        itemBuilder: (_, __) {
          return Container(
            padding: EdgeInsets.all(SizeConfig.r(14)),
            decoration: BoxDecoration(
              color: AppColors.background,
              borderRadius: BorderRadius.circular(SizeConfig.radiusLG),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.05),
                  blurRadius: 6,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                ShimmerBox(
                  width: SizeConfig.r(22),
                  height: SizeConfig.r(22),
                  borderRadius: BorderRadius.circular(SizeConfig.r(6)),
                ),
                const Spacer(),
                ShimmerBox(
                  width: SizeConfig.r(48),
                  height: SizeConfig.r(26),
                  borderRadius: BorderRadius.circular(SizeConfig.r(4)),
                ),
                SizedBox(height: SizeConfig.r(6)),
                ShimmerBox(
                  height: SizeConfig.r(12),
                  borderRadius: BorderRadius.circular(SizeConfig.r(4)),
                ),
                SizedBox(height: SizeConfig.r(4)),
                ShimmerBox(
                  width: SizeConfig.r(80),
                  height: SizeConfig.r(10),
                  borderRadius: BorderRadius.circular(SizeConfig.r(4)),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}

/// Skeleton for the PA dashboard current-job card (title stays real in shell).
class PaDashboardCurrentJobCardShimmer extends StatelessWidget {
  const PaDashboardCurrentJobCardShimmer({super.key});

  @override
  Widget build(BuildContext context) {
    return Shimmer(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              ShimmerBox(
                width: SizeConfig.r(140),
                height: SizeConfig.r(22),
                borderRadius: BorderRadius.circular(SizeConfig.r(6)),
              ),
              ShimmerBox(
                width: SizeConfig.r(88),
                height: SizeConfig.r(24),
                borderRadius: BorderRadius.circular(SizeConfig.r(20)),
              ),
            ],
          ),
          SizedBox(height: SizeConfig.r(16)),
          ...List.generate(4, (i) {
            return Padding(
              padding: EdgeInsets.only(bottom: SizeConfig.r(10)),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  ShimmerBox(
                    width: SizeConfig.r(100),
                    height: SizeConfig.r(14),
                    borderRadius: BorderRadius.circular(SizeConfig.r(4)),
                  ),
                  ShimmerBox(
                    width: SizeConfig.r(120),
                    height: SizeConfig.r(14),
                    borderRadius: BorderRadius.circular(SizeConfig.r(4)),
                  ),
                ],
              ),
            );
          }),
          SizedBox(height: SizeConfig.r(8)),
          ShimmerBox(
            height: SizeConfig.r(48),
            borderRadius: BorderRadius.circular(SizeConfig.radius),
          ),
        ],
      ),
    );
  }
}

/// Skeleton passenger rows for the PA dashboard (section title is real).
class PaDashboardPassengersShimmer extends StatelessWidget {
  const PaDashboardPassengersShimmer({super.key});

  @override
  Widget build(BuildContext context) {
    return Shimmer(
      child: Column(
        children: List.generate(
          3,
          (i) => Padding(
            padding: EdgeInsets.only(bottom: SizeConfig.r(10)),
            child: Container(
              width: double.infinity,
              padding: EdgeInsets.symmetric(
                horizontal: SizeConfig.r(16),
                vertical: SizeConfig.r(14),
              ),
              decoration: BoxDecoration(
                color: AppColors.background,
                borderRadius: BorderRadius.circular(SizeConfig.radiusLG),
                border: Border.all(color: AppColors.inputBorder),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  ShimmerBox(
                    width: SizeConfig.r(140),
                    height: SizeConfig.r(14),
                    borderRadius: BorderRadius.circular(SizeConfig.r(4)),
                  ),
                  SizedBox(height: SizeConfig.r(8)),
                  ShimmerBox(
                    height: SizeConfig.r(12),
                    borderRadius: BorderRadius.circular(SizeConfig.r(4)),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// Skeleton rows for the job-requests list (section title is rendered by the parent).
class DashboardJobRequestsShimmer extends StatelessWidget {
  const DashboardJobRequestsShimmer({super.key});

  @override
  Widget build(BuildContext context) {
    return Shimmer(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: List.generate(
          2,
          (i) => Padding(
            padding: EdgeInsets.only(bottom: SizeConfig.r(10)),
            child: Container(
              width: double.infinity,
              padding: EdgeInsets.all(SizeConfig.r(14)),
              decoration: BoxDecoration(
                color: AppColors.background,
                borderRadius: BorderRadius.circular(SizeConfig.radiusLG),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  ShimmerBox(
                    height: SizeConfig.r(16),
                    borderRadius: BorderRadius.circular(SizeConfig.r(4)),
                  ),
                  SizedBox(height: SizeConfig.r(8)),
                  ShimmerBox(
                    width: SizeConfig.r(180),
                    height: SizeConfig.r(12),
                    borderRadius: BorderRadius.circular(SizeConfig.r(4)),
                  ),
                  SizedBox(height: SizeConfig.r(12)),
                  Row(
                    children: [
                      Expanded(
                        child: ShimmerBox(
                          height: SizeConfig.r(36),
                          borderRadius:
                              BorderRadius.circular(SizeConfig.radius),
                        ),
                      ),
                      SizedBox(width: SizeConfig.r(8)),
                      Expanded(
                        child: ShimmerBox(
                          height: SizeConfig.r(36),
                          borderRadius:
                              BorderRadius.circular(SizeConfig.radius),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
