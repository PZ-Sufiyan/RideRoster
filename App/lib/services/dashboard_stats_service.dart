import 'package:supabase_flutter/supabase_flutter.dart';

import 'job_service.dart';

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
  SupabaseClient get _supabase => Supabase.instance.client;
  final JobService _jobService = JobService();

  Future<DashboardStats> fetchStats() async {
    final userId = _supabase.auth.currentUser?.id;
    if (userId == null || userId.isEmpty) return DashboardStats.empty;

    final results = await Future.wait<dynamic>([
      // Jobs today — scheduled directions from passenger_schedules (not job_sessions)
      _jobService.countScheduledDirectionsToday(),

      // Pending approval requests
      _supabase
          .from('jobs')
          .select('id')
          .eq('assigned_driver_id', userId)
          .eq('driver_approval_status', 'pending'),

      // All completed sessions ever
      _supabase
          .from('job_sessions')
          .select('id')
          .eq('driver_id', userId)
          .eq('status', 'completed'),
    ]);

    return DashboardStats(
      jobsToday: results[0] as int,
      pendingRequests: (results[1] as List).length,
      completedJobs: (results[2] as List).length,
    );
  }
}
