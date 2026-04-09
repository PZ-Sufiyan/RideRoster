import 'dart:math';
import 'package:flutter/material.dart';

/// Responsive sizing utility.
///
/// Call [SizeConfig.init] once at the top of each page's [build] method,
/// then use the helpers throughout the widget tree.
///
/// Usage:
///   @override
///   Widget build(BuildContext context) {
///     SizeConfig.init(context);
///     return ...;
///   }
class SizeConfig {
  // Design reference (iPhone 14 / 390×844 logical pixels)
  static const double _dw = 390.0;
  static const double _dh = 844.0;

  static double _sw = _dw;
  static double _sh = _dh;

  /// Initialize with the current [BuildContext].
  /// Call at the top of every page's build method.
  static void init(BuildContext context) {
    final size = MediaQuery.of(context).size;
    _sw = size.width;
    _sh = size.height;
  }

  // ── Screen dimensions ────────────────────────────────────────────────────

  /// Full logical screen width.
  static double get screenWidth => _sw;

  /// Full logical screen height.
  static double get screenHeight => _sh;

  // ── Proportional helpers ─────────────────────────────────────────────────

  /// Percentage of screen width.  [pct] = 0–100
  static double sw(double pct) => _sw * pct / 100;

  /// Percentage of screen height. [pct] = 0–100
  static double sh(double pct) => _sh * pct / 100;

  /// Scale a design-pixel [size] proportionally to the current screen width.
  /// Based on a 390 px design width.
  static double r(double size) => size * (_sw / _dw);

  /// Scale a design-pixel height [size] proportionally to screen height.
  static double h(double size) => size * (_sh / _dh);

  /// Responsive font size — scales with width but capped at 1.35× design size
  /// to avoid oversized text on tablets.
  static double sp(double size) => min(r(size), size * 1.35);

  // ── Convenience getters ───────────────────────────────────────────────────

  /// Standard horizontal page padding (design: 24 px).
  static double get hPad => r(24);

  /// Standard small spacing (design: 8 px).
  static double get spaceXS => r(8);

  /// Standard medium spacing (design: 16 px).
  static double get spaceSM => r(16);

  /// Standard large spacing (design: 24 px).
  static double get spaceMD => r(24);

  /// Extra large spacing (design: 36 px).
  static double get spaceLG => r(36);

  /// Standard input / button height (design: 52 px).
  static double get inputHeight => r(52);

  /// Primary button height (design: 54 px).
  static double get buttonHeight => r(54);

  /// Standard border radius (design: 10 px).
  static double get radius => r(10);

  /// Large border radius (design: 14 px).
  static double get radiusLG => r(14);
}
