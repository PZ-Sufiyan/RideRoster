import 'package:flutter/foundation.dart';
import '../services/driver_profile_service.dart';
import '../users/driver/models/driver_profile_model.dart';

class DriverProfileProvider extends ChangeNotifier {
  final DriverProfileService _service = DriverProfileService();

  DriverProfileModel? _profile;
  bool _isLoading = false;
  String? _error;
  bool _hasLoadedOnce = false;

  DriverProfileModel? get profile => _profile;
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
}
