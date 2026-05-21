// ─────────────────────────────────────────────────────────────────────────────
// LeaveRequest  —  mirrors public.leave_requests (unified driver + PA table)
// ─────────────────────────────────────────────────────────────────────────────

/// A single leave request row from public.leave_requests.
///
/// [userId]   — references drivers.id OR passenger_assistant.id
/// [userRole] — 'driver' | 'passenger_assistant'
class LeaveRequest {
  final String id;
  final String userId;
  final String userRole;
  final String leaveType;
  final DateTime startDate;
  final DateTime endDate;
  final String reason;
  final String? attachmentUrl;
  final String status; // 'pending' | 'approved' | 'rejected'
  final String? adminNotes;
  final DateTime createdAt;

  const LeaveRequest({
    required this.id,
    required this.userId,
    required this.userRole,
    required this.leaveType,
    required this.startDate,
    required this.endDate,
    required this.reason,
    this.attachmentUrl,
    required this.status,
    this.adminNotes,
    required this.createdAt,
  });

  /// Number of calendar days this request covers (inclusive).
  int get requestedDays => endDate.difference(startDate).inDays + 1;

  /// Human-readable date range.
  /// Same-month:  "Dec 20 - Dec 22, 2024"
  /// Cross-month: "Nov 30 - Dec 02, 2024"
  String get dateRangeLabel {
    if (startDate.year == endDate.year && startDate.month == endDate.month) {
      return '${_monthName(startDate.month)} '
          '${startDate.day.toString().padLeft(2, '0')} '
          '- ${_monthName(endDate.month)} '
          '${endDate.day.toString().padLeft(2, '0')}, '
          '${endDate.year}';
    }
    return '${_formatDate(startDate)} - ${_formatDate(endDate)}';
  }

  String _formatDate(DateTime d) =>
      '${_monthName(d.month)} ${d.day.toString().padLeft(2, '0')}, ${d.year}';

  static String _monthName(int month) {
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    return months[month - 1];
  }

  factory LeaveRequest.fromJson(Map<String, dynamic> json) {
    return LeaveRequest(
      id: (json['id'] ?? '').toString(),
      userId: (json['user_id'] ?? '').toString(),
      userRole: (json['user_role'] ?? '').toString(),
      leaveType: (json['leave_type'] ?? '').toString(),
      startDate: DateTime.parse(json['start_date'].toString()),
      endDate: DateTime.parse(json['end_date'].toString()),
      reason: (json['reason'] ?? '').toString(),
      attachmentUrl: json['attachment_url']?.toString(),
      status: (json['status'] ?? 'pending').toString(),
      adminNotes: json['admin_notes']?.toString(),
      createdAt: DateTime.parse(json['created_at'].toString()),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// LeaveSummary
// ─────────────────────────────────────────────────────────────────────────────

/// Summary counts for the leave home page card.
class LeaveSummary {
  final int pendingCount;
  final int rejectedCount;
  final int approvedCount;

  const LeaveSummary({
    required this.pendingCount,
    required this.rejectedCount,
    required this.approvedCount,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// LeaveJobConflict
// ─────────────────────────────────────────────────────────────────────────────

/// Returned by [LeaveService.checkJobsOnDates].
/// Tells the UI whether the user has active routes on the requested dates.
class LeaveJobConflict {
  final bool hasConflict;
  final List<String> affectedJobNames;

  const LeaveJobConflict({
    required this.hasConflict,
    required this.affectedJobNames,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// LeaveDateOverlapException
// ─────────────────────────────────────────────────────────────────────────────

/// Thrown when a new request overlaps an existing pending/approved request.
class LeaveDateOverlapException implements Exception {
  const LeaveDateOverlapException();

  static const String userMessage =
      'Those dates overlap a leave request that is already waiting for a '
      'decision or has been approved.\n\n'
      'Try different dates, or open Leave History to review your existing '
      'requests.';

  @override
  String toString() => userMessage;
}

// ─────────────────────────────────────────────────────────────────────────────
// UserRole constants
// ─────────────────────────────────────────────────────────────────────────────

/// Role values stored in leave_requests.user_role.
/// Matches the check constraint on the DB table.
class LeaveUserRole {
  static const String driver = 'driver';
  static const String passengerAssistant = 'passenger_assistant';
}
