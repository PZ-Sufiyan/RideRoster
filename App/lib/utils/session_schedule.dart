/// Morning/evening session timing rules for driver job flows.
class SessionSchedule {
  SessionSchedule._();

  static const int startToleranceMinutes = 30;
  static const int eveningExtraHourMinutes = 60;

  static const String skippedNote =
      'Auto-skipped: morning session not started within allowed window.';
  static const String morningIncompleteNote =
      'Auto-marked incomplete: morning session not completed within allowed window.';
  static const String eveningIncompleteNote =
      'Auto-marked incomplete: evening session not completed within allowed duration.';

  /// Returns a user-facing error when start is not allowed, otherwise null.
  static String? validateStartWindow({
    required String direction,
    required String? morningStartTime,
    required String? eveningStartTime,
    DateTime? now,
  }) {
    final isOutbound = direction == 'outbound';
    final routeLabel = isOutbound ? 'Morning' : 'Evening';
    final startRaw = isOutbound ? morningStartTime : eveningStartTime;
    final startMinutes = parseTimeToMinutes(startRaw);

    if (startMinutes == null) {
      return '$routeLabel route start time is not configured for this job.';
    }

    final current = now ?? DateTime.now();
    final nowMinutes = current.hour * 60 + current.minute;
    final earliest = startMinutes - startToleranceMinutes;
    final latest = startMinutes + startToleranceMinutes;

    if (nowMinutes < earliest) {
      return 'You can start the $routeLabel route from '
          '${formatMinutes(earliest)}. '
          'Scheduled start is ${formatMinutes(startMinutes)}.';
    }

    if (nowMinutes > latest) {
      return 'The $routeLabel route start window has closed. '
          'It was available until ${formatMinutes(latest)}.';
    }

    return null;
  }

  /// Human-readable allowed start window, e.g. "7:00 AM – 8:00 AM".
  static String? startWindowLabel({
    required String direction,
    required String? morningStartTime,
    required String? eveningStartTime,
  }) {
    final startRaw = direction == 'outbound'
        ? morningStartTime
        : eveningStartTime;
    final startMinutes = parseTimeToMinutes(startRaw);
    if (startMinutes == null) return null;

    final earliest = startMinutes - startToleranceMinutes;
    final latest = startMinutes + startToleranceMinutes;
    return '${formatMinutes(earliest)} – ${formatMinutes(latest)}';
  }

  /// Morning sessions auto-skip / auto-incomplete at morning_end + 30 minutes.
  static int? morningDeadlineMinutes(String? morningEndTime) {
    final end = parseTimeToMinutes(morningEndTime);
    if (end == null) return null;
    return end + startToleranceMinutes;
  }

  static bool isPastMorningDeadline(String? morningEndTime, DateTime now) {
    final deadline = morningDeadlineMinutes(morningEndTime);
    if (deadline == null) return false;
    final nowMinutes = now.hour * 60 + now.minute;
    return nowMinutes > deadline;
  }

  /// Evening must finish within (morning_end - morning_start) + 1 hour.
  static int? eveningMaxDurationMinutes({
    required String? morningStartTime,
    required String? morningEndTime,
  }) {
    final start = parseTimeToMinutes(morningStartTime);
    final end = parseTimeToMinutes(morningEndTime);
    if (start == null || end == null) return null;

    final morningDuration = end - start;
    if (morningDuration <= 0) return null;

    return morningDuration + eveningExtraHourMinutes;
  }

  static bool isPastEveningCompletionDeadline({
    required DateTime startedAt,
    required int maxDurationMinutes,
    DateTime? now,
  }) {
    final current = now ?? DateTime.now();
    return current.isAfter(
      startedAt.add(Duration(minutes: maxDurationMinutes)),
    );
  }

  static bool isTerminalStatus(String? status) {
    final value = (status ?? '').trim().toLowerCase();
    return value == 'completed' ||
        value == 'skipped' ||
        value == 'incomplete' ||
        value == 'cancelled';
  }

  static bool isSettledForDirection(String? status) => isTerminalStatus(status);

  /// Dashboard badge text for skipped / incomplete sessions, e.g. "Morning skipped".
  static String? dashboardBadgeLabel({
    required String direction,
    required String? status,
  }) {
    final normalized = (status ?? '').trim().toLowerCase();
    final isMorning = direction == 'outbound';

    if (normalized == 'skipped') {
      return isMorning ? 'Morning skipped' : 'Evening skipped';
    }
    if (normalized == 'incomplete') {
      return isMorning ? 'Morning incomplete' : 'Evening incomplete';
    }
    return null;
  }

  static bool morningWasStarted(String? status) {
    final value = (status ?? '').trim().toLowerCase();
    return value == 'active' || value == 'completed' || value == 'incomplete';
  }

  static int? parseTimeToMinutes(String? rawTime) {
    final raw = (rawTime ?? '').trim();
    if (raw.isEmpty) return null;

    final hhmm = raw.length >= 5 ? raw.substring(0, 5) : raw;
    final parts = hhmm.split(':');
    if (parts.length < 2) return null;

    final hour = int.tryParse(parts[0]);
    final minute = int.tryParse(parts[1]);
    if (hour == null || minute == null) return null;
    if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;

    return hour * 60 + minute;
  }

  static String formatMinutes(int totalMinutes) {
    final normalized = totalMinutes % (24 * 60);
    final hour = normalized ~/ 60;
    final minute = normalized % 60;
    final period = hour >= 12 ? 'PM' : 'AM';
    final h12 = hour % 12 == 0 ? 12 : hour % 12;
    final mm = minute.toString().padLeft(2, '0');
    return '$h12:$mm $period';
  }
}
