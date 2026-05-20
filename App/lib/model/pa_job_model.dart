import '../model/job_model.dart' show PickupStatus, DropoffStatus;

// ─────────────────────────────────────────────────────────────────────────────
// PA Passenger Stop
// ─────────────────────────────────────────────────────────────────────────────

/// A single pickup stop as seen by the passenger assistant.
/// Read-only — PA does not mutate status.
class PaPassengerStop {
  final String passengerId;
  final String passengerName;
  final String address;
  final String scheduledTime;
  final int stopNumber;
  final bool wheelchairRequired;
  final bool harnessRequired;
  final PickupStatus status;

  const PaPassengerStop({
    required this.passengerId,
    required this.passengerName,
    required this.address,
    required this.scheduledTime,
    required this.stopNumber,
    required this.wheelchairRequired,
    required this.harnessRequired,
    required this.status,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// PA Dropoff Stop
// ─────────────────────────────────────────────────────────────────────────────

/// Outbound: one stop per unique school address, lists all passengers.
/// Inbound:  one stop per passenger (their home address).
class PaDropoffStop {
  final String address;
  final String scheduledTime;

  /// Outbound: multiple passenger names sharing one school.
  /// Inbound: single passenger name.
  final List<String> passengerNames;
  final DropoffStatus status;

  const PaDropoffStop({
    required this.address,
    required this.scheduledTime,
    required this.passengerNames,
    required this.status,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// PA Job Model
// ─────────────────────────────────────────────────────────────────────────────

class PaJobModel {
  final String jobDbId;
  final String jobName;
  final String direction; // 'outbound' | 'inbound'
  final String sessionId; // '' if driver hasn't started yet
  /// Raw value from job_sessions.status: 'pending'|'active'|'completed'|'cancelled'
  /// Empty string when no session exists yet.
  final String sessionStatus;
  final String driverName;
  final String startTime;

  final List<PaPassengerStop> stops;
  final List<PaDropoffStop> dropoffs;

  const PaJobModel({
    required this.jobDbId,
    required this.jobName,
    required this.direction,
    required this.sessionId,
    required this.sessionStatus,
    required this.driverName,
    required this.startTime,
    required this.stops,
    required this.dropoffs,
  });

  PaJobModel copyWith({String? sessionStatus}) {
    return PaJobModel(
      jobDbId: jobDbId,
      jobName: jobName,
      direction: direction,
      sessionId: sessionId,
      sessionStatus: sessionStatus ?? this.sessionStatus,
      driverName: driverName,
      startTime: startTime,
      stops: stops,
      dropoffs: dropoffs,
    );
  }

  // ── Derived helpers ───────────────────────────────────────────────────────

  bool get isInbound => direction == 'inbound';
  bool get sessionStarted => sessionId.isNotEmpty;

  /// True when the driver has explicitly completed the session in the DB.
  bool get isSessionCompleted => sessionStatus == 'completed';

  int get totalStudents => stops.length;

  /// Total route stops = pickup stops + dropoff stops.
  int get totalStops => stops.length + dropoffs.length;

  int get pickedUpCount =>
      stops.where((s) => s.status == PickupStatus.completed).length;

  int get missedCount =>
      stops.where((s) => s.status == PickupStatus.notPicked).length;

  int get pendingPickupCount =>
      stops.where((s) => s.status == PickupStatus.pending).length;

  int get droppedOffCount =>
      dropoffs.where((d) => d.status == DropoffStatus.completed).length;

  bool get allPickupsResolved => pendingPickupCount == 0;
  bool get allDropoffsCompleted =>
      dropoffs.isNotEmpty &&
      dropoffs.every((d) => d.status == DropoffStatus.completed);

  double get pickupProgressFraction =>
      totalStudents == 0 ? 0.0 : pickedUpCount / totalStudents;

  PaPassengerStop? get nextPendingStop {
    try {
      return stops.firstWhere((s) => s.status == PickupStatus.pending);
    } catch (_) {
      return null;
    }
  }

  /// Job status label for the dashboard pill.
  PaJobDisplayStatus get displayStatus {
    if (!sessionStarted) return PaJobDisplayStatus.startingSoon;
    if (isSessionCompleted) return PaJobDisplayStatus.completed;
    if (allPickupsResolved) return PaJobDisplayStatus.droppingOff;
    return PaJobDisplayStatus.inProgress;
  }
}

/// Display-level status for the PA job card pill.
enum PaJobDisplayStatus { startingSoon, inProgress, droppingOff, completed }
