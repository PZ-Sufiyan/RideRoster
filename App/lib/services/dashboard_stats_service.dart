import 'package:supabase_flutter/supabase_flutter.dart';

import '../repositories/local_job_repository.dart';

class DashboardStats {
  final int jobsToday;
  final int notCompleted;
  final int completedJobs;

  const DashboardStats({
    required this.jobsToday,
    required this.notCompleted,
    required this.completedJobs,
  });

  static const empty = DashboardStats(
    jobsToday: 0,
    notCompleted: 0,
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
            .from('job_sessions')
            .select('id')
            .eq('driver_id', userId)
            .inFilter('status', ['skipped', 'incomplete']),
        _supabase
            .from('job_sessions')
            .select('id')
            .eq('driver_id', userId)
            .eq('status', 'completed'),
      ]).timeout(const Duration(seconds: 3));

      return DashboardStats(
        jobsToday: jobsToday,
        notCompleted: (results[0] as List).length,
        completedJobs: (results[1] as List).length,
      );
    } catch (_) {
      // Offline / network failure — use local session write table.
      final local = await _localRepo.countDriverSessionStats(userId);
      return DashboardStats(
        jobsToday: jobsToday,
        notCompleted: local.notCompleted,
        completedJobs: local.completed,
      );
    }
  }
}
