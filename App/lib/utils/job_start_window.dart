import 'session_schedule.dart';

/// Validates whether a driver is within the allowed route start window.
///
/// Morning (outbound): ±30 minutes around [morningStartTime].
/// Evening (inbound): ±30 minutes around [eveningStartTime].
class JobStartWindow {
  JobStartWindow._();

  static const int toleranceMinutes = SessionSchedule.startToleranceMinutes;

  static String? validate({
    required String direction,
    required String? morningStartTime,
    required String? eveningStartTime,
    DateTime? now,
  }) =>
      SessionSchedule.validateStartWindow(
        direction: direction,
        morningStartTime: morningStartTime,
        eveningStartTime: eveningStartTime,
        now: now,
      );

  static String? allowedWindowLabel({
    required String direction,
    required String? morningStartTime,
    required String? eveningStartTime,
  }) =>
      SessionSchedule.startWindowLabel(
        direction: direction,
        morningStartTime: morningStartTime,
        eveningStartTime: eveningStartTime,
      );
}
