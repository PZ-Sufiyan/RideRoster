import '../model/job_model.dart' show PickupStatus, DropoffStatus;

// ─────────────────────────────────────────────────────────────────────────────
// PA Passenger Stop  (live job view)
// ─────────────────────────────────────────────────────────────────────────────

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
// PA Dropoff Stop  (live job view)
// ─────────────────────────────────────────────────────────────────────────────

class PaDropoffStop {
  final String address;
  final String scheduledTime;
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
// PA Job Model  (live job view)
// ─────────────────────────────────────────────────────────────────────────────

class PaJobModel {
  final String jobDbId;
  final String jobName;
  final String direction;
  final String sessionId;
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

  bool get isInbound => direction == 'inbound';
  bool get sessionStarted => sessionId.isNotEmpty;
  bool get isSessionCompleted => sessionStatus == 'completed';
  int get totalStudents => stops.length;
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

  PaJobDisplayStatus get displayStatus {
    if (!sessionStarted) return PaJobDisplayStatus.startingSoon;
    if (isSessionCompleted) return PaJobDisplayStatus.completed;
    if (allPickupsResolved) return PaJobDisplayStatus.droppingOff;
    return PaJobDisplayStatus.inProgress;
  }
}

enum PaJobDisplayStatus { startingSoon, inProgress, droppingOff, completed }

// ─────────────────────────────────────────────────────────────────────────────
// PA Schedule Stop  (assigned jobs / weekly schedule view)
// ─────────────────────────────────────────────────────────────────────────────

class PaScheduleStop {
  final String passengerName;
  final String pickupAddress;
  final String dropoffAddress;
  final String pickupTime;
  final bool wheelchairRequired;
  final bool harnessRequired;
  final int stopOrder;

  const PaScheduleStop({
    required this.passengerName,
    required this.pickupAddress,
    required this.dropoffAddress,
    required this.pickupTime,
    required this.wheelchairRequired,
    required this.harnessRequired,
    required this.stopOrder,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// PA Day Run  (assigned jobs / weekly schedule view)
// ─────────────────────────────────────────────────────────────────────────────

class PaDayRun {
  final String direction;
  final String startTime;
  final String driverName;
  final List<PaScheduleStop> stops;

  const PaDayRun({
    required this.direction,
    required this.startTime,
    required this.driverName,
    required this.stops,
  });

  bool get isOutbound => direction == 'outbound';
  String get label => isOutbound ? 'Morning Run' : 'Evening Run';
  int get totalPassengers => stops.length;
  int get wheelchairCount => stops.where((s) => s.wheelchairRequired).length;
  int get harnessCount => stops.where((s) => s.harnessRequired).length;
}

// ─────────────────────────────────────────────────────────────────────────────
// PA Assigned Job Model  (assigned jobs / weekly schedule view)
// ─────────────────────────────────────────────────────────────────────────────

class PaAssignedJobModel {
  final String jobDbId;
  final String jobName;
  final String semesterStart;
  final String semesterEnd;
  final List<String> activeDays;
  final Map<String, Map<String, PaDayRun>> schedule;

  const PaAssignedJobModel({
    required this.jobDbId,
    required this.jobName,
    required this.semesterStart,
    required this.semesterEnd,
    required this.activeDays,
    required this.schedule,
  });

  List<String> get orderedActiveDays {
    const order = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    return order.where((d) => activeDays.contains(d)).toList();
  }

  List<PaDayRun> runsForDay(String weekday) {
    final dayMap = schedule[weekday];
    if (dayMap == null) return [];
    final result = <PaDayRun>[];
    if (dayMap.containsKey('outbound')) result.add(dayMap['outbound']!);
    if (dayMap.containsKey('inbound')) result.add(dayMap['inbound']!);
    return result;
  }
}
