import 'package:flutter/widgets.dart';
import '../model/leave_model.dart';
import '../services/leave_service.dart';

/// State management for the leave request feature.
///
/// Shared by both drivers and passenger assistants.
/// Pass [userRole] at construction — the provider instantiates [LeaveService]
/// with the correct role so all queries are automatically scoped.
///
/// Usage in main.dart:
///   ChangeNotifierProvider(
///     create: (_) => LeaveProvider(userRole: LeaveUserRole.driver),
///   ),
///   ChangeNotifierProvider(
///     create: (_) => LeaveProvider(userRole: LeaveUserRole.passengerAssistant),
///   ),
///
/// Or use a single provider and read the role from AuthProvider at runtime —
/// both patterns work. The two-provider approach is simpler and avoids
/// shared state between the two roles.
class LeaveProvider extends ChangeNotifier {
  LeaveProvider({required String userRole})
    : _service = LeaveService(userRole: userRole);

  final LeaveService _service;

  // ── State ──────────────────────────────────────────────────────────────────

  bool _isLoading = false;
  bool _isCheckingConflict = false;
  bool _isSubmitting = false;
  String? _error;
  bool _loadSucceededOnce = false;

  LeaveSummary? _summary;
  List<LeaveRequest> _history = [];
  LeaveJobConflict? _conflictResult;
  bool _submitSuccess = false;
  bool _submitErrorIsDateOverlap = false;

  // ── Getters ────────────────────────────────────────────────────────────────

  bool get isLoading => _isLoading;
  bool get isCheckingConflict => _isCheckingConflict;
  bool get isSubmitting => _isSubmitting;
  String? get error => _error;
  bool get hasLoadedOnce => _loadSucceededOnce;
  LeaveSummary? get summary => _summary;
  List<LeaveRequest> get history => _history;
  LeaveJobConflict? get conflictResult => _conflictResult;
  bool get submitSuccess => _submitSuccess;
  bool get submitErrorIsDateOverlap => _submitErrorIsDateOverlap;

  int get pendingCount => _summary?.pendingCount ?? 0;
  int get rejectedCount => _summary?.rejectedCount ?? 0;
  int get approvedCount => _summary?.approvedCount ?? 0;

  // ── Load ───────────────────────────────────────────────────────────────────

  Future<void> loadLeaveData({bool silent = false}) async {
    if (!silent && _loadSucceededOnce) {
      silent = true;
    }

    if (!silent) {
      _isLoading = true;
      if (!_loadSucceededOnce) _error = null;
      notifyListeners();
    }

    try {
      final result = await _service.fetchLeaveData();
      _summary = result.summary;
      _history = result.history;
      _loadSucceededOnce = true;
      _error = null;
    } catch (e) {
      if (!_loadSucceededOnce) {
        _error = 'No internet. Please try again.';
      }
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // ── Conflict check ─────────────────────────────────────────────────────────

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
      // Fail open — let the user continue even if the check fails.
      _conflictResult = const LeaveJobConflict(
        hasConflict: false,
        affectedJobNames: [],
      );
    } finally {
      _isCheckingConflict = false;
      notifyListeners();
    }
  }

  // ── Submit ─────────────────────────────────────────────────────────────────

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

      _history = [newRequest, ..._history];
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

  // ── Reset ──────────────────────────────────────────────────────────────────

  void resetSubmit() {
    _submitSuccess = false;
    _conflictResult = null;
    _error = null;
    _submitErrorIsDateOverlap = false;
    // Defer notifyListeners — this may be called from State.dispose() while
    // the element tree is locked.
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (hasListeners) notifyListeners();
    });
  }

  void clearError() {
    _error = null;
    _submitErrorIsDateOverlap = false;
    notifyListeners();
  }

  // ── Private ────────────────────────────────────────────────────────────────

  void _incrementPendingCount() {
    if (_summary == null) return;
    _summary = LeaveSummary(
      pendingCount: _summary!.pendingCount + 1,
      rejectedCount: _summary!.rejectedCount,
      approvedCount: _summary!.approvedCount,
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Typed subclasses — register these in MultiProvider so driver and PA pages
// can each read their own scoped provider without ambiguity.
// ─────────────────────────────────────────────────────────────────────────────

/// Driver-scoped leave provider.
/// Register in MultiProvider and read as [DriverLeaveProvider] in driver UI.
class DriverLeaveProvider extends LeaveProvider {
  DriverLeaveProvider() : super(userRole: LeaveUserRole.driver);
}

/// Passenger-assistant-scoped leave provider.
/// Register in MultiProvider and read as [PaLeaveProvider] in PA UI.
class PaLeaveProvider extends LeaveProvider {
  PaLeaveProvider() : super(userRole: LeaveUserRole.passengerAssistant);
}
