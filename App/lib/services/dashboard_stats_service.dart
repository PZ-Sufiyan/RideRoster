import 'package:supabase_flutter/supabase_flutter.dart';

import '../repositories/local_job_repository.dart';

class DashboardStats {
  final int jobsToday;
  final int pendingRequests;
  final int completedJobs;

  const DashboardStats({
    required this.jobsToday,
    required this.pendingRequests,
    required this.completedJobs,
  });

  static const empty = DashboardStats(
    jobsToday: 0,
    pendingRequests: 0,
    completedJobs: 0,
  );
}

class DashboardStatsService {
  final LocalJobRepository _localRepo;
  SupabaseClient get _supabase => Supabase.instance.client;

  DashboardStatsService(this._localRepo);

  Future<DashboardStats> fetchStats() async {
    final userId = _supabase.auth.currentUser?.id;
    if (userId == null || userId.isEmpty) return DashboardStats.empty;

    // Same local schedule cache as Current Job card — avoids split-brain when
    // passenger_schedules change but jobs_cache is still "fresh".
    final jobsToday = await _localRepo.countScheduledDirectionsToday();

    try {
      final results = await Future.wait<dynamic>([
        _supabase
            .from('jobs')
            .select('id')
            .eq('assigned_driver_id', userId)
            .eq('driver_approval_status', 'pending'),
        _supabase
            .from('job_sessions')
            .select('id')
            .eq('driver_id', userId)
            .eq('status', 'completed'),
      ]).timeout(const Duration(seconds: 3));

      return DashboardStats(
        jobsToday: jobsToday,
        pendingRequests: (results[0] as List).length,
        completedJobs: (results[1] as List).length,
      );
    } catch (_) {
      return DashboardStats(
        jobsToday: jobsToday,
        pendingRequests: 0,
        completedJobs: 0,
      );
    }
  }
}
