import '../users/driver/models/dummy_job_data.dart';
import '../users/driver/models/job_model.dart';

/// Simulates an async job service layer (normally would call an API).
class JobService {
  /// Returns the current active job for the driver.
  Future<JobModel> fetchCurrentJob() async {
    // Simulate a short network delay.
    await Future.delayed(const Duration(milliseconds: 300));
    return DummyJobData.currentJob;
  }

  /// Updates the status of a pickup stop (no-op for dummy; provider owns state).
  Future<void> updatePickupStatus(String pickupId, PickupStatus status) async {
    await Future.delayed(const Duration(milliseconds: 100));
    // In a real app this would PATCH the backend.
  }
}
