// ─────────────────────────────────────────────────────────────────────────────
// Passenger Assistant — Dashboard Models (dummy data)
// ─────────────────────────────────────────────────────────────────────────────

/// Readiness state for a student passenger on a PA's roster.
enum PassengerReadiness { ready, notReady }

/// A student passenger as displayed in the PA dashboard.
class PassengerModel {
  final String id;
  final String name;
  final String grade;
  final PassengerReadiness readiness;

  const PassengerModel({
    required this.id,
    required this.name,
    required this.grade,
    required this.readiness,
  });

  PassengerModel copyWith({PassengerReadiness? readiness}) {
    return PassengerModel(
      id: id,
      name: name,
      grade: grade,
      readiness: readiness ?? this.readiness,
    );
  }
}

/// Status of the PA's current job assignment.
enum PaJobStatus { startingSoon, inProgress, completed }

/// Summary of the PA's current job as shown on the dashboard.
class PaCurrentJob {
  final String routeName;
  final String driverName;
  final String pickupTime;
  final int totalStudents;
  final PaJobStatus status;

  const PaCurrentJob({
    required this.routeName,
    required this.driverName,
    required this.pickupTime,
    required this.totalStudents,
    required this.status,
  });
}

/// Static dummy data used to render the PA dashboard while the backend
/// integration is in progress.
class PaDashboardDummyData {
  static const String paName = 'Sarah Johnson';
  static const bool onShift = true;
  static const int notificationCount = 1;

  static const PaCurrentJob currentJob = PaCurrentJob(
    routeName: 'Route A - Morning',
    driverName: 'Mike Thompson',
    pickupTime: '7:30 AM',
    totalStudents: 24,
    status: PaJobStatus.startingSoon,
  );

  static const List<PassengerModel> passengers = [
    PassengerModel(
      id: 'p1',
      name: 'Emma Wilson',
      grade: 'Grade 3A',
      readiness: PassengerReadiness.ready,
    ),
    PassengerModel(
      id: 'p2',
      name: 'James Rodriguez',
      grade: 'Grade 2B',
      readiness: PassengerReadiness.notReady,
    ),
    PassengerModel(
      id: 'p3',
      name: 'Sophia Chen',
      grade: 'Grade 4C',
      readiness: PassengerReadiness.ready,
    ),
    PassengerModel(
      id: 'p4',
      name: 'Lucas Anderson',
      grade: 'Grade 1A',
      readiness: PassengerReadiness.notReady,
    ),
  ];
}
