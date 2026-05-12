/// Model for a single driver leave request row.
///
/// Mirrors the driver_leave_requests table 1-to-1.
class DriverLeaveRequest {
  final String id;
  final String driverId;
  final String leaveType;
  final DateTime startDate;
  final DateTime endDate;
  final String reason;
  final String? attachmentUrl;
  final String status; // 'pending' | 'approved' | 'rejected'
  final String? adminNotes;
  final DateTime createdAt;

  const DriverLeaveRequest({
    required this.id,
    required this.driverId,
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
  /// Same-month: "Dec 20 - Dec 22, 2024"
  /// Cross-month: "Nov 30 - Dec 02, 2024"
  String get dateRangeLabel {
    if (startDate.year == endDate.year && startDate.month == endDate.month) {
      return '${_monthName(startDate.month)} ${startDate.day.toString().padLeft(2, '0')} '
          '- ${_monthName(endDate.month)} ${endDate.day.toString().padLeft(2, '0')}, '
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

  factory DriverLeaveRequest.fromJson(Map<String, dynamic> json) {
    return DriverLeaveRequest(
      id: (json['id'] ?? '').toString(),
      driverId: (json['driver_id'] ?? '').toString(),
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

/// Summary counts derived from the full request list.
/// Passed to the UI summary card (Pending / Rejected / Approved).
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

/// Thrown when a new request overlaps dates of an existing pending or
/// approved leave (see [DriverLeaveService.submitLeaveRequest]).
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

/// Returned by [DriverLeaveService.checkJobsOnDates].
/// Tells the UI whether the driver has active routes on the requested dates.
class LeaveJobConflict {
  /// True if at least one passenger schedule falls within the requested range.
  final bool hasConflict;

  /// Human-readable list of affected job names, e.g. ["Route 12A", "Route 7"].
  /// Empty when [hasConflict] is false.
  final List<String> affectedJobNames;

  const LeaveJobConflict({
    required this.hasConflict,
    required this.affectedJobNames,
  });
}
