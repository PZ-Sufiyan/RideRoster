import 'package:flutter/foundation.dart';

import '../model/pa_profile_model.dart';
import '../services/pa_profile_service.dart';

/// Holds the logged-in Passenger Assistant's profile and documents.
class PaProfileProvider extends ChangeNotifier {
  final PaProfileService _service = PaProfileService();

  PaProfileModel? _profile;
  bool _isLoading = false;
  String? _error;
  bool _hasLoadedOnce = false;

  PaProfileModel? get profile => _profile;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get hasProfile => _profile != null;
  bool get hasLoadedOnce => _hasLoadedOnce;

  Future<void> loadProfile({bool forceRefresh = false}) async {
    if (_isLoading) return;
    if (!forceRefresh && _hasLoadedOnce && _profile != null) return;

    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _profile = await _service.fetchProfile();
      _hasLoadedOnce = true;
    } catch (e) {
      _error = e.toString();
      _hasLoadedOnce = true;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  void reset() {
    _profile = null;
    _hasLoadedOnce = false;
    _isLoading = false;
    _error = null;
    notifyListeners();
  }
}
