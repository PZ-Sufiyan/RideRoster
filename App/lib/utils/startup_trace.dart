import 'dart:developer' as developer;

import 'package:flutter/foundation.dart';

/// TEMPORARY startup diagnostics.
///
/// Every line is tagged `RRTRACE` so a single filter finds the whole cold-start
/// timeline:
///
///     adb logcat | Select-String RRTRACE
///
/// Enable explicitly with `--dart-define=RR_TRACE=true` (release/profile), or
/// automatically in debug builds. It is a no-op otherwise, so it costs nothing
/// in a normal release build.
class StartupTrace {
  StartupTrace._();

  static const bool _forced = bool.fromEnvironment('RR_TRACE');

  static final bool enabled = _forced || kDebugMode;

  static final Stopwatch _clock = Stopwatch()..start();

  /// Milliseconds since process start of the first traced call.
  static int get elapsedMs => _clock.elapsedMilliseconds;

  /// A marker with the elapsed time and the number of times this label has
  /// fired. Repeat counts are the interesting part: they reveal duplicate
  /// initialisation that a single timestamp cannot.
  static final Map<String, int> _counts = <String, int>{};

  static int countOf(String label) => _counts[label] ?? 0;

  static void mark(String label, [Object? detail]) {
    if (!enabled) return;
    final n = (_counts[label] ?? 0) + 1;
    _counts[label] = n;
    final buffer = StringBuffer()
      ..write('RRTRACE ')
      ..write(elapsedMs.toString().padLeft(6))
      ..write('ms ')
      ..write(label);
    if (n > 1) buffer.write(' #$n');
    if (detail != null) buffer.write(' | $detail');
    developer.log(buffer.toString(), name: 'RRTRACE');
    if (kDebugMode) debugPrint(buffer.toString());
  }

  /// Times [body] and marks `<label> done` with the duration in ms.
  static Future<T> time<T>(String label, Future<T> Function() body) async {
    if (!enabled) return body();
    final sw = Stopwatch()..start();
    mark('$label.start');
    try {
      final value = await body();
      mark('$label.done', '${sw.elapsedMilliseconds}ms');
      return value;
    } catch (error) {
      mark('$label.error', '${sw.elapsedMilliseconds}ms $error');
      rethrow;
    }
  }

  /// Where the caller is in `file.dart:line`. Used to prove *who* triggered a
  /// repeated call rather than only that it repeated.
  static String where([int depth = 2]) {
    if (!enabled) return '';
    final frames = StackTrace.current.toString().split('\n');
    if (frames.length <= depth) return '';
    return frames[depth].trim();
  }

  static void dumpCounts() {
    if (!enabled) return;
    final entries = _counts.entries.toList()
      ..sort((a, b) => b.value.compareTo(a.value));
    mark('=== RRTRACE repeat counts ===');
    for (final e in entries) {
      if (e.value > 1) mark('   ${e.key} x${e.value}');
    }
  }
}
