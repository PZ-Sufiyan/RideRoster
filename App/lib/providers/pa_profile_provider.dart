import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../model/pa_profile_model.dart';
import '../services/pa_profile_service.dart';

/// Holds the logged-in Passenger Assistant's profile and documents.
class PaProfileProvider extends ChangeNotifier {
  final PaProfileService _service = PaProfileService();

  PaProfileModel? _profile;
  bool _isLoading = false;
  String? _error;
  bool _hasLoadedOnce = false;
  bool _showingCachedCopy = false;

  PaProfileModel? get profile => _profile;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get hasProfile => _profile != null;
  bool get hasLoadedOnce => _hasLoadedOnce;
  bool get showingCachedCopy => _showingCachedCopy;

  Future<void> loadProfile({bool forceRefresh = false}) async {
    if (_isLoading) return;
    if (!forceRefresh && _hasLoadedOnce && _profile != null) return;

    final userId = Supabase.instance.client.auth.currentUser?.id;

    _isLoading = true;
    _error = null;
    _showingCachedCopy = false;
    notifyListeners();

    try {
      _profile = await _service.fetchProfile();
      _showingCachedCopy = false;
      _hasLoadedOnce = true;
    } catch (e) {
      if (userId != null && userId.isNotEmpty) {
        final cached = await _service.loadCachedProfile(userId);
        if (cached != null) {
          _profile = cached;
          _showingCachedCopy = true;
          _error = null;
          _hasLoadedOnce = true;
        } else {
          _error = _friendlyError(e);
          _hasLoadedOnce = true;
        }
      } else {
        _error = _friendlyError(e);
        _hasLoadedOnce = true;
      }
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  String _friendlyError(Object _) => 'No internet. Please try again.';

  void reset() {
    _profile = null;
    _hasLoadedOnce = false;
    _isLoading = false;
    _error = null;
    _showingCachedCopy = false;
    notifyListeners();
  }
}
