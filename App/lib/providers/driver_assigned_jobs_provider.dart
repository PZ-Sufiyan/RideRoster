import 'package:flutter/foundation.dart';
import '../model/pa_job_model.dart';
import '../repositories/local_job_repository.dart';
import '../services/driver_assigned_job_service.dart';

/// Weekly schedule state for the driver Job Detail screen.
class DriverAssignedJobsProvider extends ChangeNotifier {
  late final DriverAssignedJobService _service;

  PaAssignedJobModel? _job;
  bool _isLoading = false;
  String? _error;
  bool _hasLoadedOnce = false;
  bool _isRefreshing = false;

  DriverAssignedJobsProvider({required LocalJobRepository localRepo}) {
    _service = DriverAssignedJobService(localRepo);
  }

  PaAssignedJobModel? get job => _job;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get hasLoadedOnce => _hasLoadedOnce;
  bool get isRefreshing => _isRefreshing;

  Future<void> loadIfNeeded() async {
    if (!_hasLoadedOnce) {
      await _fetch(blockUi: true);
    } else {
      _fetch(blockUi: false);
    }
  }

  Future<void> refresh() async {
    await _fetch(blockUi: false);
  }

  Future<void> _fetch({required bool blockUi}) async {
    if (blockUi) {
      _isLoading = true;
      _error = null;
      notifyListeners();
    } else {
      _isRefreshing = true;
    }

    try {
      final updated = await _service.fetchAssignedJob();
      _job = updated;
      _error = null;
    } catch (e) {
      if (blockUi) _error = e.toString();
    } finally {
      _isLoading = false;
      _isRefreshing = false;
      _hasLoadedOnce = true;
      notifyListeners();
    }
  }

  void reset() {
    _job = null;
    _hasLoadedOnce = false;
    _isLoading = false;
    _isRefreshing = false;
    _error = null;
    notifyListeners();
  }
}
