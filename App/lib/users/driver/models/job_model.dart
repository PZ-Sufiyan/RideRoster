/// Represents the status of a single pickup stop.
enum PickupStatus { pending, completed, notPicked }

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
    this.status = PickupStatus.pending,
  });

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
      status: status ?? this.status,
    );
  }
}

/// A job assigned to the driver.
class JobModel {
  final String backendJobId;
  final String jobId;
  final String routeNumber;
  final String paName;
  final String nextPickupTime;
  final String totalEta;
  final String totalDistance;
  final String dropoffLocation;
  final String dropoffEta;
  final List<PickupStop> pickups;

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
  });

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
}
