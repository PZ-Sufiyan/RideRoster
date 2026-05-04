import 'package:supabase_flutter/supabase_flutter.dart';

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

  Future<DashboardStats> fetchStats() async {
    final userId = _supabase.auth.currentUser?.id;
    if (userId == null || userId.isEmpty) return DashboardStats.empty;

    final today = DateTime.now();
    final todayDate =
        '${today.year.toString().padLeft(4, '0')}-'
        '${today.month.toString().padLeft(2, '0')}-'
        '${today.day.toString().padLeft(2, '0')}';

    final results = await Future.wait([
      // Jobs today — any session (outbound or inbound) for today
      _supabase
          .from('job_sessions')
          .select('id')
          .eq('driver_id', userId)
          .eq('session_date', todayDate),

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
      jobsToday: (results[0] as List).length,
      pendingRequests: (results[1] as List).length,
      completedJobs: (results[2] as List).length,
    );
  }
}
