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

/// A single passenger stop during a run.
///
/// [id]          → job_session_passengers.id  (used for status mutations)
/// [stopNumber]  → job_session_passengers.stop_order
/// [lat]/[lng]   → job_session_passengers.pickup_latitude/longitude
class PickupStop {
  final String id; // job_session_passengers.id
  final int stopNumber; // stop_order
  final String passengerName;
  final String passengerPhone;
  final String locationName; // human-readable label (same as address)
  final String address; // job_session_passengers.pickup_address
  final String eta; // computed / 'ETA pending'
  final String scheduledTime; // formatted pickup_time from passenger_schedules

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

/// Represents the school / educational site dropoff.
///
/// In the new schema every passenger goes to the same educational site,
/// so there is typically one DropoffStop per session (the school address).
/// [id] → job_session_passengers.id of the last/dropoff passenger record,
/// used when marking dropped_off status.
class DropoffStop {
  final String id; // job_session_passengers.id
  final int dropoffOrder;
  final String address; // passenger.educational_site_address
  final String scheduledTime; // formatted dropoff_time

  final double? lat; // passenger.educational_site_latitude
  final double? lng; // passenger.educational_site_longitude

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

/// Represents the active job + session state for the signed-in driver.
///
/// Key IDs:
///   [jobDbId]   → jobs.id            (UUID, used for session creation)
///   [sessionId] → job_sessions.id    (UUID, used for passenger status updates)
///   [jobId]     → jobs.internal_job_id or jobs.id substring (display only)
class JobModel {
  // ── Identity ──────────────────────────────────────────────────────────────
  final String jobDbId; // jobs.id (UUID) — used to create/find sessions
  final String sessionId; // job_sessions.id — used for DB mutations
  final String jobId; // display ID (internal_job_id or UUID prefix)

  // ── Display fields (unchanged from old model — UI needs these) ────────────
  final String routeNumber; // jobs.job_name
  final String paName; // passenger_assistant.first_name + surname
  final String nextPickupTime; // first pending stop's scheduledTime
  final String totalEta; // not in schema — pass '' (map card shows it)
  final String totalDistance; // not in schema — pass ''
  final String dropoffLocation; // educational_site_address (first passenger)
  final String dropoffEta; // dropoff_time from schedule

  // ── Direction ─────────────────────────────────────────────────────────────
  /// 'outbound' (morning) or 'inbound' (evening)
  final String direction;

  // ── Stop lists ────────────────────────────────────────────────────────────
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

  // ── Pickup helpers (used by UI — keep identical signatures) ───────────────

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

  /// First pending dropoff, or null if all done.
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

  // ── Deprecated alias kept so existing provider code compiles ─────────────
  /// Use [sessionId] directly. This getter exists only for backward compat.
  String get backendJobId => sessionId;
}
