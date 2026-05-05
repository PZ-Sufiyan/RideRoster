// ─────────────────────────────────────────────────────────────────────────────
// Enums
// ─────────────────────────────────────────────────────────────────────────────

/// Maps to job_session_passengers.status for pickup actions.
/// DB values: 'pending' | 'picked_up' | 'missed' | 'dropped_off'
enum PickupStatus { pending, completed, notPicked }

/// Maps to job_session_passengers.status for dropoff actions.
enum DropoffStatus { pending, completed }

// ─────────────────────────────────────────────────────────────────────────────
// PickupStop
// ─────────────────────────────────────────────────────────────────────────────

/// A single passenger pickup stop during a run.
/// [id] → job_session_passengers.id (used for status mutations)
class PickupStop {
  final String id;
  final int stopNumber;
  final String passengerName;
  final String passengerPhone;
  final String locationName;
  final String address;
  final String eta;
  final String scheduledTime;
  final double? lat;
  final double? lng;
  PickupStatus status;

  PickupStop({
    required this.id,
    required this.stopNumber,
    required this.passengerName,
    required this.passengerPhone,
    required this.locationName,
    required this.address,
    required this.eta,
    required this.scheduledTime,
    this.lat,
    this.lng,
    this.status = PickupStatus.pending,
  });

  bool get hasCoordinates => lat != null && lng != null;

  PickupStop copyWith({PickupStatus? status}) {
    return PickupStop(
      id: id,
      stopNumber: stopNumber,
      passengerName: passengerName,
      passengerPhone: passengerPhone,
      locationName: locationName,
      address: address,
      eta: eta,
      scheduledTime: scheduledTime,
      lat: lat,
      lng: lng,
      status: status ?? this.status,
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DropoffStop
// ─────────────────────────────────────────────────────────────────────────────

/// A single dropoff stop.
///
/// Outbound (morning): one stop per unique school.
///   passengerName = '' (label shown as school address / "School N")
///   passengerIds  = all passenger IDs going to this school (used for bulk
///                   status update via updateDropoffStatusForSchool)
///
/// Inbound (evening): one stop per passenger — their home address.
///   passengerName = passenger's name (shown in complete_job timeline)
///
/// [id] → job_session_passengers.id of the first passenger for this stop.
///   - Inbound: used directly for single-row status mutation.
///   - Outbound: not used for mutation (schoolAddress is used instead);
///               kept for currentDropoff identity checks.
class DropoffStop {
  final String id;
  final int dropoffOrder;
  final String address;
  final String scheduledTime;
  final double? lat;
  final double? lng;
  final String passengerName; // used in inbound timeline
  /// All passenger IDs sharing this dropoff school (outbound only).
  /// Empty for inbound stops.
  final List<String> passengerIds;
  DropoffStatus status;

  DropoffStop({
    required this.id,
    required this.dropoffOrder,
    required this.address,
    required this.scheduledTime,
    this.lat,
    this.lng,
    this.passengerName = '',
    this.passengerIds = const [],
    this.status = DropoffStatus.pending,
  });

  bool get hasCoordinates => lat != null && lng != null;
}

// ─────────────────────────────────────────────────────────────────────────────
// JobModel
// ─────────────────────────────────────────────────────────────────────────────

class JobModel {
  final String jobDbId;
  final String sessionId;
  final String jobId;
  final String routeNumber;
  final String paName;
  final String nextPickupTime;
  final String totalEta;
  final String totalDistance;
  final String dropoffLocation; // primary dropoff label for dashboard card
  final String dropoffEta;
  final String direction; // 'outbound' | 'inbound'
  final List<PickupStop> pickups;
  final List<DropoffStop> dropoffs;

  const JobModel({
    required this.jobDbId,
    required this.sessionId,
    required this.jobId,
    required this.routeNumber,
    required this.paName,
    required this.nextPickupTime,
    required this.totalEta,
    required this.totalDistance,
    required this.dropoffLocation,
    required this.dropoffEta,
    required this.direction,
    required this.pickups,
    this.dropoffs = const [],
  });

  // ── Pickup helpers ────────────────────────────────────────────────────────

  int get totalPickups => pickups.length;
  int get completedCount =>
      pickups.where((p) => p.status == PickupStatus.completed).length;
  int get notPickedCount =>
      pickups.where((p) => p.status == PickupStatus.notPicked).length;
  int get pendingCount =>
      pickups.where((p) => p.status == PickupStatus.pending).length;
  bool get allPickupsResolved => pendingCount == 0;
  bool get isDropoffPhase => allPickupsResolved;
  double get progressFraction =>
      totalPickups == 0 ? 0 : completedCount / totalPickups;

  // ── Dropoff helpers ───────────────────────────────────────────────────────

  /// First pending dropoff stop — used for navigation in complete_job.
  DropoffStop? get currentDropoff {
    try {
      return dropoffs.firstWhere((d) => d.status == DropoffStatus.pending);
    } catch (_) {
      return null;
    }
  }

  bool get allDropoffsCompleted =>
      dropoffs.isNotEmpty &&
      dropoffs.every((d) => d.status == DropoffStatus.completed);

  bool get isInbound => direction == 'inbound';

  /// Backward-compat alias
  String get backendJobId => sessionId;
}
