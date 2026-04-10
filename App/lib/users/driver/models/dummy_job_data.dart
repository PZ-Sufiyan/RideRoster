import 'job_model.dart';

/// Static dummy data that acts as "the database" for job functionality.
/// Each getter call returns FRESH objects so a new job session starts clean.
class DummyJobData {
  static JobModel get currentJob => JobModel(
        jobId: '#Job-2024-1456',
        routeNumber: 'JR-2024-001',
        paName: 'Sarah Miller',
        nextPickupTime: '8:15 AM',
        totalEta: '24 min',
        totalDistance: '3.2 km',
        dropoffLocation: 'Washington High School',
        dropoffEta: '10:46 AM',
        // Always fresh copies — never share the same PickupStop instances.
        pickups: _freshPickups,
      );

  /// Returns a new list of new PickupStop objects every call.
  /// This prevents previous session mutations from leaking into new sessions.
  static List<PickupStop> get _freshPickups => [
        PickupStop(
          id: 'p1',
          stopNumber: 1,
          passengerName: 'Sarah Johnson',
          passengerPhone: '(555) 123-4567',
          locationName: 'Maple Street & Oak Ave',
          address: '12 Maple Street, Apt 3A',
          eta: 'ETA: 8 min',
          scheduledTime: '8:15 AM',
          status: PickupStatus.pending,
        ),
        PickupStop(
          id: 'p2',
          stopNumber: 2,
          passengerName: 'Mike Chen',
          passengerPhone: '(555) 234-5678',
          locationName: 'Pine Road & Elm Street',
          address: '456 Pine Road, Suite 2',
          eta: 'ETA: 16 min',
          scheduledTime: '8:30 AM',
          status: PickupStatus.pending,
        ),
        PickupStop(
          id: 'p3',
          stopNumber: 3,
          passengerName: 'Emily Davis',
          passengerPhone: '(555) 345-6789',
          locationName: 'Cedar Avenue & Main St',
          address: '789 Cedar Avenue, Floor 1',
          eta: 'ETA: 24 min',
          scheduledTime: '8:45 AM',
          status: PickupStatus.pending,
        ),
      ];
}
