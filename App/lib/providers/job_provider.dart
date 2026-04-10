import 'package:flutter/foundation.dart';
import '../users/driver/models/job_model.dart';
import '../services/job_service.dart';

/// Manages the active job state for the driver flow.
/// All pages read from and write to this single provider.
class JobProvider extends ChangeNotifier {
  final JobService _service = JobService();

  JobModel? _job;
  bool _isLoading = false;
  String? _error;

  // Index into _job.pickups for the pickup currently being processed.
  int _activePickupIndex = 0;

  JobModel? get job => _job;
  bool get isLoading => _isLoading;
  String? get error => _error;
  int get activePickupIndex => _activePickupIndex;

  /// The pickup stop currently shown in PickupQuePage / PickupPage.
  PickupStop? get activePickup =>
      _job == null || _job!.pickups.isEmpty ? null : _job!.pickups[_activePickupIndex];

  /// Pending pickups after the current active one (shown greyed out in queue).
  List<PickupStop> get upcomingPickups {
    if (_job == null) return [];
    return _job!.pickups
        .skip(_activePickupIndex + 1)
        .where((p) => p.status == PickupStatus.pending)
        .toList();
  }

  // ─── Load ────────────────────────────────────────────────────────────────

  Future<void> loadJob() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _job = await _service.fetchCurrentJob();
      // Start at the first pending pickup (defensive — always 0 for a fresh
      // job, but correct even if data arrives partially resolved).
      _activePickupIndex = _job!.pickups.indexWhere(
        (p) => p.status == PickupStatus.pending,
      );
      if (_activePickupIndex == -1) _activePickupIndex = 0;
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // ─── Status mutations ────────────────────────────────────────────────────

  /// Marks the current pickup as [PickupStatus.completed].
  void markCurrentAsCompleted() {
    if (_job == null) return;
    _job!.pickups[_activePickupIndex].status = PickupStatus.completed;
    notifyListeners();
  }

  /// Marks the current pickup as [PickupStatus.notPicked].
  void markCurrentAsNotPicked() {
    if (_job == null) return;
    _job!.pickups[_activePickupIndex].status = PickupStatus.notPicked;
    notifyListeners();
  }

  /// Advances to the next pending pickup. Returns true if one exists.
  bool advanceToNextPickup() {
    if (_job == null) return false;
    for (int i = _activePickupIndex + 1; i < _job!.pickups.length; i++) {
      if (_job!.pickups[i].status == PickupStatus.pending) {
        _activePickupIndex = i;
        notifyListeners();
        return true;
      }
    }
    // No more pending pickups; check if all are resolved.
    return false;
  }

  /// True when all pickups are either completed or not picked.
  bool get allResolved => _job?.allPickupsResolved ?? false;

  /// Reset the job (e.g. after job completion).
  void reset() {
    _job = null;
    _activePickupIndex = 0;
    notifyListeners();
  }
}
