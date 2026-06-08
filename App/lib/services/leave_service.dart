import 'package:supabase_flutter/supabase_flutter.dart';
import '../model/leave_model.dart';

/// All Supabase queries for the unified leave request feature.
///
/// Works for both drivers and passenger assistants — pass [userRole] at
/// construction time. The service reads [userRole] to:
///   - Filter leave_requests by user_role on fetch.
///   - Use the correct jobs FK column on conflict check
///     (assigned_driver_id vs assigned_pa_id).
///
/// Public API:
///   fetchLeaveData()     → summary + history for the leave home page
///   checkJobsOnDates()   → conflict check before the review step
///   submitLeaveRequest() → insert a new pending request
///   updateLeaveStatus()  → admin: approve / reject a request
class LeaveService {
  LeaveService({required this.userRole});

  /// 'driver' | 'passenger_assistant'
  final String userRole;

  static const Duration _networkTimeout = Duration(seconds: 4);

  SupabaseClient get _db => Supabase.instance.client;

  String? get _currentUserId => _db.auth.currentUser?.id;

  bool get _isDriver => userRole == LeaveUserRole.driver;

  // ══════════════════════════════════════════════════════════════════════════
  // Fetch
  // ══════════════════════════════════════════════════════════════════════════

  Future<({LeaveSummary summary, List<LeaveRequest> history})>
  fetchLeaveData() async {
    final userId = _currentUserId;
    if (userId == null) {
      return (
        summary: const LeaveSummary(
          pendingCount: 0,
          rejectedCount: 0,
          approvedCount: 0,
        ),
        history: <LeaveRequest>[],
      );
    }

    final rows = await _db
        .from('leave_requests')
        .select(
          'id, user_id, user_role, leave_type, '
          'start_date, end_date, reason, '
          'attachment_url, status, admin_notes, created_at',
        )
        .eq('user_id', userId)
        .eq('user_role', userRole)
        .order('created_at', ascending: false)
        .timeout(_networkTimeout);

    final history = rows
        .map((r) => LeaveRequest.fromJson(Map<String, dynamic>.from(r as Map)))
        .toList();

    var pending = 0, rejected = 0, approved = 0;
    for (final req in history) {
      switch (req.status) {
        case 'approved':
          approved++;
          break;
        case 'rejected':
          rejected++;
          break;
        default:
          pending++;
      }
    }

    return (
      summary: LeaveSummary(
        pendingCount: pending,
        rejectedCount: rejected,
        approvedCount: approved,
      ),
      history: history,
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Conflict check
  // ══════════════════════════════════════════════════════════════════════════

  /// Checks whether the user has active scheduled routes on any date within
  /// [startDate]..[endDate].
  ///
  /// Driver:  looks at jobs.assigned_driver_id
  /// PA:      looks at jobs.assigned_pa_id
  Future<LeaveJobConflict> checkJobsOnDates({
    required DateTime startDate,
    required DateTime endDate,
  }) async {
    final userId = _currentUserId;
    if (userId == null) {
      return const LeaveJobConflict(hasConflict: false, affectedJobNames: []);
    }

    final startStr = _dateStr(startDate);
    final endStr = _dateStr(endDate);

    // ── 1. Find jobs whose semester overlaps the leave range ────────────────
    final jobQuery = _db
        .from('jobs')
        .select('id, job_name')
        .neq('status', 'cancelled')
        .lte('semester_start', endStr)
        .gte('semester_end', startStr);

    // Filter by the correct FK column depending on role
    final jobRows = await (_isDriver
        ? jobQuery
              .eq('assigned_driver_id', userId)
              .eq('driver_approval_status', 'accepted')
        : jobQuery.eq('assigned_pa_id', userId));

    if (jobRows.isEmpty) {
      return const LeaveJobConflict(hasConflict: false, affectedJobNames: []);
    }

    // ── 2. Expand leave range to weekday keys ───────────────────────────────
    final leaveDayKeys = _weekdayKeysBetween(startDate, endDate);
    if (leaveDayKeys.isEmpty) {
      return const LeaveJobConflict(hasConflict: false, affectedJobNames: []);
    }

    // ── 3. Check each job for a matching schedule ───────────────────────────
    final affectedNames = <String>[];

    for (final jobRow in jobRows) {
      final jobId = (jobRow['id'] ?? '').toString();
      final jobName = (jobRow['job_name'] ?? '').toString();

      final hit = await _db
          .from('passenger_schedules')
          .select('id')
          .eq('job_id', jobId)
          .inFilter('weekday', leaveDayKeys)
          .isFilter('exception_date', null)
          .limit(1);

      if (hit.isNotEmpty) {
        affectedNames.add(jobName.isNotEmpty ? jobName : 'Unnamed route');
      }
    }

    return LeaveJobConflict(
      hasConflict: affectedNames.isNotEmpty,
      affectedJobNames: affectedNames,
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Submit
  // ══════════════════════════════════════════════════════════════════════════

  Future<LeaveRequest> submitLeaveRequest({
    required String leaveType,
    required DateTime startDate,
    required DateTime endDate,
    required String reason,
    String? attachmentUrl,
  }) async {
    final userId = _currentUserId;
    if (userId == null) throw Exception('Not authenticated.');

    final startStr = _dateStr(startDate);
    final endStr = _dateStr(endDate);

    // Overlap guard — prevent duplicate requests for the same date range
    final overlapping = await _db
        .from('leave_requests')
        .select('id')
        .eq('user_id', userId)
        .eq('user_role', userRole)
        .neq('status', 'rejected')
        .lte('start_date', endStr)
        .gte('end_date', startStr)
        .limit(1);

    if (overlapping.isNotEmpty) throw const LeaveDateOverlapException();

    final result = await _db
        .from('leave_requests')
        .insert({
          'user_id': userId,
          'user_role': userRole,
          'leave_type': leaveType,
          'start_date': startStr,
          'end_date': endStr,
          'reason': reason.trim(),
          if (attachmentUrl != null && attachmentUrl.isNotEmpty)
            'attachment_url': attachmentUrl,
          'status': 'pending',
          'created_at': DateTime.now().toIso8601String(),
          'updated_at': DateTime.now().toIso8601String(),
        })
        .select()
        .single();

    return LeaveRequest.fromJson(Map<String, dynamic>.from(result as Map));
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Admin mutation
  // ══════════════════════════════════════════════════════════════════════════

  /// Admin approves or rejects any leave request regardless of role.
  Future<void> updateLeaveStatus({
    required String requestId,
    required String status, // 'approved' | 'rejected'
    String? adminNotes,
  }) async {
    assert(
      status == 'approved' || status == 'rejected',
      'status must be approved or rejected',
    );

    await _db
        .from('leave_requests')
        .update({
          'status': status,
          'admin_notes': adminNotes?.trim(),
          'updated_at': DateTime.now().toIso8601String(),
        })
        .eq('id', requestId);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Helpers
  // ══════════════════════════════════════════════════════════════════════════

  String _dateStr(DateTime dt) =>
      '${dt.year.toString().padLeft(4, '0')}-'
      '${dt.month.toString().padLeft(2, '0')}-'
      '${dt.day.toString().padLeft(2, '0')}';

  List<String> _weekdayKeysBetween(DateTime start, DateTime end) {
    const keys = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    final found = <String>{};
    var cursor = DateTime(start.year, start.month, start.day);
    final last = DateTime(end.year, end.month, end.day);
    while (!cursor.isAfter(last)) {
      found.add(keys[cursor.weekday - 1]);
      if (found.length == 7) break;
      cursor = cursor.add(const Duration(days: 1));
    }
    return found.toList();
  }
}
