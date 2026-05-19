import 'package:flutter/widgets.dart';
import '../model/driver_leave_model.dart';
import '../services/driver_leave_service.dart';

/// State management for the driver leave feature.
///
/// Lifecycle:
///   1. On first attach (DriverLeavePage), call [loadLeaveData] to populate
///      [summary] and [history].
///   2. Before navigating to the review step, call [checkConflict] with the
///      selected date range. The UI reads [conflictResult] to decide whether
///      to show the warning dialog.
///   3. On final submit, call [submitRequest]. On success [submitSuccess] is
///      true — the UI switches to the success screen.
///   4. Call [resetSubmit] when navigating away from the success screen so
///      the form is clean for a new request.
///
/// Error handling:
///   Every public method sets [error] on failure. The UI should show a
///   SnackBar / banner when [error] is non-null, then call [clearError].
class DriverLeaveProvider extends ChangeNotifier {
  final DriverLeaveService _service = DriverLeaveService();

  // ── State ─────────────────────────────────────────────────────────────────

  bool _isLoading = false;
  bool _isCheckingConflict = false;
  bool _isSubmitting = false;
  String? _error;

  LeaveSummary? _summary;
  List<DriverLeaveRequest> _history = [];

  /// Result of the most recent [checkConflict] call.
  /// Null until [checkConflict] has been called.
  LeaveJobConflict? _conflictResult;

  /// True after [submitRequest] succeeds. Reset via [resetSubmit].
  bool _submitSuccess = false;
  bool _submitErrorIsDateOverlap = false;

  // ── Getters ───────────────────────────────────────────────────────────────

  bool get isLoading => _isLoading;
  bool get isCheckingConflict => _isCheckingConflict;
  bool get isSubmitting => _isSubmitting;
  String? get error => _error;

  LeaveSummary? get summary => _summary;
  List<DriverLeaveRequest> get history => _history;
  LeaveJobConflict? get conflictResult => _conflictResult;
  bool get submitSuccess => _submitSuccess;

  /// True when the last failed [submitRequest] was a date overlap with an
  /// existing request (so the UI can show a fuller explanation).
  bool get submitErrorIsDateOverlap => _submitErrorIsDateOverlap;

  // Convenience getters for the summary card — safe when summary is null
  int get pendingCount => _summary?.pendingCount ?? 0;
  int get rejectedCount => _summary?.rejectedCount ?? 0;
  int get approvedCount => _summary?.approvedCount ?? 0;

  // ── Load ──────────────────────────────────────────────────────────────────

  /// Loads leave history and summary counts.
  /// Call once when [DriverLeavePage] mounts (use [silent] = true for
  /// background refreshes that should not show a full-screen loader).
  Future<void> loadLeaveData({bool silent = false}) async {
    if (!silent) {
      _isLoading = true;
      _error = null;
      notifyListeners();
    }

    try {
      final result = await _service.fetchLeaveData();
      _summary = result.summary;
      _history = result.history;
      if (!silent) _error = null;
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // ── Conflict check ────────────────────────────────────────────────────────

  /// Checks whether the driver has active routes on the given date range.
  ///
  /// Call this when the driver taps "Continue" on the form step — before
  /// showing the review screen. The UI reads [conflictResult]:
  ///   - [conflictResult.hasConflict] == true  → show warning dialog
  ///   - [conflictResult.hasConflict] == false → skip dialog, go to review
  Future<void> checkConflict({
    required DateTime startDate,
    required DateTime endDate,
  }) async {
    _isCheckingConflict = true;
    _conflictResult = null;
    _error = null;
    notifyListeners();

    try {
      _conflictResult = await _service.checkJobsOnDates(
        startDate: startDate,
        endDate: endDate,
      );
    } catch (e) {
      _error = e.toString();
      // Fail open: if the check fails, treat as no conflict so the driver
      // can still submit. Admin will see the request either way.
      _conflictResult = const LeaveJobConflict(
        hasConflict: false,
        affectedJobNames: [],
      );
    } finally {
      _isCheckingConflict = false;
      notifyListeners();
    }
  }

  // ── Submit ────────────────────────────────────────────────────────────────

  /// Submits the leave request to Supabase.
  ///
  /// On success: [submitSuccess] becomes true → UI shows success screen.
  /// On failure: [error] is set → UI shows error message, form stays open.
  Future<void> submitRequest({
    required String leaveType,
    required DateTime startDate,
    required DateTime endDate,
    required String reason,
    String? attachmentUrl,
  }) async {
    _isSubmitting = true;
    _error = null;
    _submitErrorIsDateOverlap = false;
    notifyListeners();

    try {
      final newRequest = await _service.submitLeaveRequest(
        leaveType: leaveType,
        startDate: startDate,
        endDate: endDate,
        reason: reason,
        attachmentUrl: attachmentUrl,
      );

      // Prepend to history so it appears at the top without a full reload
      _history = [newRequest, ..._history];

      // Recompute summary counts locally (avoids a round-trip)
      _incrementPendingCount();

      _submitSuccess = true;
    } catch (e) {
      _submitErrorIsDateOverlap = e is LeaveDateOverlapException;
      _error = e.toString();
      _submitSuccess = false;
    } finally {
      _isSubmitting = false;
      notifyListeners();
    }
  }

  // ── Reset ─────────────────────────────────────────────────────────────────

  /// Call after the success screen is dismissed so the form is ready for
  /// a fresh request.
  void resetSubmit() {
    _submitSuccess = false;
    _conflictResult = null;
    _error = null;
    _submitErrorIsDateOverlap = false;
    // May be called from [State.dispose] (e.g. leave form closing). Calling
    // [notifyListeners] synchronously there marks Provider scope dirty while
    // the element tree is locked — defer until the frame completes.
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (hasListeners) notifyListeners();
    });
  }

  void clearError() {
    _error = null;
    _submitErrorIsDateOverlap = false;
    notifyListeners();
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  void _incrementPendingCount() {
    if (_summary == null) return;
    _summary = LeaveSummary(
      pendingCount: _summary!.pendingCount + 1,
      rejectedCount: _summary!.rejectedCount,
      approvedCount: _summary!.approvedCount,
    );
  }
}
