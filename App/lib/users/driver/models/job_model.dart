/// Represents the status of a single pickup stop.
enum PickupStatus { pending, completed, notPicked }

/// Represents the status of a dropoff stop.
enum DropoffStatus { pending, completed }

// ─────────────────────────────────────────────────────────────────────────────
// PickupStop
// ─────────────────────────────────────────────────────────────────────────────

/// A single passenger pickup stop in a job.
class PickupStop {
  final String id;
  final int stopNumber;
  final String passengerName;
  final String passengerPhone;
  final String locationName;
  final String address;
  final String eta; // e.g. "ETA: 8 min"
  final String scheduledTime; // e.g. "8:15 AM"

  /// GPS coordinates — populated from job_pickups.latitude / longitude.
  /// Null when the DB row has no coordinates yet.
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

  /// Whether this stop has usable GPS coordinates.
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

/// A single dropoff stop in a job.
class DropoffStop {
  final String id;
  final int dropoffOrder;
  final String address;
  final String scheduledTime;

  /// GPS coordinates — populated from job_dropoffs.latitude / longitude.
  final double? lat;
  final double? lng;

  DropoffStatus status;

  DropoffStop({
    required this.id,
    required this.dropoffOrder,
    required this.address,
    required this.scheduledTime,
    this.lat,
    this.lng,
    this.status = DropoffStatus.pending,
  });

  bool get hasCoordinates => lat != null && lng != null;
}

// ─────────────────────────────────────────────────────────────────────────────
// JobModel
// ─────────────────────────────────────────────────────────────────────────────

/// A job assigned to the driver.
class JobModel {
  final String backendJobId;
  final String jobId;
  final String routeNumber;
  final String paName;
  final String nextPickupTime;
  final String totalEta;
  final String totalDistance;

  // Legacy flat strings kept for backward-compat with existing UI widgets.
  final String dropoffLocation;
  final String dropoffEta;

  final List<PickupStop> pickups;

  /// Structured dropoff stops — used for navigation & tracking.
  final List<DropoffStop> dropoffs;

  const JobModel({
    this.backendJobId = '',
    required this.jobId,
    required this.routeNumber,
    required this.paName,
    required this.nextPickupTime,
    required this.totalEta,
    required this.totalDistance,
    required this.dropoffLocation,
    required this.dropoffEta,
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

  /// First pending dropoff stop, or null if all are done.
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
}
