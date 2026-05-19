import 'package:supabase_flutter/supabase_flutter.dart';
import '../model/driver_leave_model.dart';

/// All Supabase queries for the driver leave request feature.
///
/// Public API surface:
///   fetchLeaveData()          → (summary, history list) for the leave home page
///   checkJobsOnDates()        → conflict check before the review step
///   submitLeaveRequest()      → insert a new pending request
///
/// Admin-side mutations (updateLeaveStatus) are intentionally kept here
/// so the admin panel can import this service without a separate file.
class DriverLeaveService {
  SupabaseClient get _db => Supabase.instance.client;

  // ── Fetch leave history + summary ─────────────────────────────────────────

  /// Returns all leave requests for the current driver, newest first,
  /// plus a [LeaveSummary] with counts of pending, rejected, and approved
  /// requests (from the same list).
  Future<({LeaveSummary summary, List<DriverLeaveRequest> history})>
  fetchLeaveData() async {
    final driverId = _currentDriverId;
    if (driverId == null) {
      return (
        summary: const LeaveSummary(
          pendingCount: 0,
          rejectedCount: 0,
          approvedCount: 0,
        ),
        history: <DriverLeaveRequest>[],
      );
    }

    final rows = await _db
        .from('driver_leave_requests')
        .select(
          'id, driver_id, leave_type, start_date, end_date, reason, '
          'attachment_url, status, admin_notes, created_at',
        )
        .eq('driver_id', driverId)
        .order('created_at', ascending: false);

    final history = rows
        .map(
          (r) =>
              DriverLeaveRequest.fromJson(Map<String, dynamic>.from(r as Map)),
        )
        .toList();

    var pendingCount = 0;
    var rejectedCount = 0;
    var approvedCount = 0;

    for (final req in history) {
      switch (req.status) {
        case 'approved':
          approvedCount++;
          break;
        case 'rejected':
          rejectedCount++;
          break;
        default:
          pendingCount++;
          break;
      }
    }

    return (
      summary: LeaveSummary(
        pendingCount: pendingCount,
        rejectedCount: rejectedCount,
        approvedCount: approvedCount,
      ),
      history: history,
    );
  }

  // ── Conflict check ────────────────────────────────────────────────────────

  /// Checks whether the driver has any active job routes that overlap with
  /// [startDate]..[endDate].
  ///
  /// Strategy:
  ///   1. Find all jobs assigned to this driver that are active and not cancelled,
  ///      whose semester overlaps the leave range.
  ///   2. For each such job, check if any passenger_schedules weekday falls on
  ///      a calendar date within the leave range.
  ///
  /// We do the weekday expansion in Dart (not SQL) to keep the query simple
  /// and avoid a heavy generate_series call. The leave range is at most
  /// a few weeks, so the loop is cheap.
  Future<LeaveJobConflict> checkJobsOnDates({
    required DateTime startDate,
    required DateTime endDate,
  }) async {
    final driverId = _currentDriverId;
    if (driverId == null) {
      return const LeaveJobConflict(hasConflict: false, affectedJobNames: []);
    }

    final startStr = _dateStr(startDate);
    final endStr = _dateStr(endDate);

    // Step 1: jobs whose semester overlaps the leave range
    final jobRows = await _db
        .from('jobs')
        .select('id, job_name, has_outbound, has_inbound')
        .eq('assigned_driver_id', driverId)
        .eq('driver_approval_status', 'accepted')
        .neq('status', 'cancelled')
        .lte('semester_start', endStr) // semester starts before leave ends
        .gte('semester_end', startStr); // semester ends after leave starts

    if (jobRows.isEmpty) {
      return const LeaveJobConflict(hasConflict: false, affectedJobNames: []);
    }

    // Step 2: collect weekday keys that fall within the leave range
    final leaveDayKeys = _weekdayKeysBetween(startDate, endDate);
    if (leaveDayKeys.isEmpty) {
      return const LeaveJobConflict(hasConflict: false, affectedJobNames: []);
    }

    final affectedNames = <String>[];

    for (final jobRow in jobRows) {
      final jobId = (jobRow['id'] ?? '').toString();
      final jobName = (jobRow['job_name'] ?? '').toString();

      // Check if any schedule row exists for this job on the leave weekdays.
      // A single match is enough — we don't need the full count.
      final scheduleHit = await _db
          .from('passenger_schedules')
          .select('id')
          .eq('job_id', jobId)
          .inFilter('weekday', leaveDayKeys)
          .isFilter('exception_date', null) // base schedules only
          .limit(1);

      if (scheduleHit.isNotEmpty) {
        affectedNames.add(jobName.isNotEmpty ? jobName : 'Unnamed route');
      }
    }

    return LeaveJobConflict(
      hasConflict: affectedNames.isNotEmpty,
      affectedJobNames: affectedNames,
    );
  }

  // ── Submit ────────────────────────────────────────────────────────────────

  /// Inserts a new leave request with status = 'pending'.
  ///
  /// [attachmentUrl] is optional — pass null if the driver did not attach a file.
  /// The caller is responsible for uploading the file to Supabase Storage
  /// and providing the resulting URL (or signed URL).
  ///
  /// Throws if:
  ///   - Driver is not authenticated.
  ///   - A pending or approved request already overlaps the same date range
  ///     (prevents accidental duplicates).
  Future<DriverLeaveRequest> submitLeaveRequest({
    required String leaveType,
    required DateTime startDate,
    required DateTime endDate,
    required String reason,
    String? attachmentUrl,
  }) async {
    final driverId = _currentDriverId;
    if (driverId == null) throw Exception('Not authenticated.');

    // Duplicate / overlap guard — check for existing non-rejected requests
    // that overlap the requested range.
    final startStr = _dateStr(startDate);
    final endStr = _dateStr(endDate);

    final overlapping = await _db
        .from('driver_leave_requests')
        .select('id')
        .eq('driver_id', driverId)
        .neq('status', 'rejected')
        .lte('start_date', endStr) // existing starts before new ends
        .gte('end_date', startStr) // existing ends after new starts
        .limit(1);

    if (overlapping.isNotEmpty) {
      throw const LeaveDateOverlapException();
    }

    final payload = {
      'driver_id': driverId,
      'leave_type': leaveType,
      'start_date': startStr,
      'end_date': endStr,
      'reason': reason.trim(),
      if (attachmentUrl != null && attachmentUrl.isNotEmpty)
        'attachment_url': attachmentUrl,
      'status': 'pending',
      'created_at': DateTime.now().toIso8601String(),
      'updated_at': DateTime.now().toIso8601String(),
    };

    final result = await _db
        .from('driver_leave_requests')
        .insert(payload)
        .select()
        .single();

    return DriverLeaveRequest.fromJson(
      Map<String, dynamic>.from(result as Map),
    );
  }

  // ── Admin mutation ────────────────────────────────────────────────────────

  /// Admin approves or rejects a leave request.
  /// [adminNotes] is shown to the driver in the history card.
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
        .from('driver_leave_requests')
        .update({
          'status': status,
          'admin_notes': adminNotes?.trim(),
          'updated_at': DateTime.now().toIso8601String(),
        })
        .eq('id', requestId);
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  String? get _currentDriverId => Supabase.instance.client.auth.currentUser?.id;

  String _dateStr(DateTime dt) =>
      '${dt.year.toString().padLeft(4, '0')}-'
      '${dt.month.toString().padLeft(2, '0')}-'
      '${dt.day.toString().padLeft(2, '0')}';

  /// Returns the set of weekday keys (mon/tue/…) that appear at least once
  /// in the date range [start]..[end] inclusive.
  /// Max range we'd ever check is ~30 days, so this loop is trivial.
  List<String> _weekdayKeysBetween(DateTime start, DateTime end) {
    const keys = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    final found = <String>{};
    var cursor = DateTime(start.year, start.month, start.day);
    final last = DateTime(end.year, end.month, end.day);

    while (!cursor.isAfter(last)) {
      found.add(keys[cursor.weekday - 1]);
      if (found.length == 7) break; // all days covered — no need to continue
      cursor = cursor.add(const Duration(days: 1));
    }
    return found.toList();
  }
}
