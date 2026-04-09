/// Base API service.
///
/// All methods currently return dummy data.
/// When backend is ready, replace the dummy implementations inside each method
/// with real HTTP calls (e.g. using the `http` or `dio` package).
///
/// Pattern:
///   - Keep the method signatures the same.
///   - Replace the `await Future.delayed(...)` + return value with a real call.
///   - Add error handling as needed.
class ApiService {
  // ---------------------------------------------------------------------------
  // Base URL — swap this when the backend is ready
  // ---------------------------------------------------------------------------
  static const String baseUrl = 'https://your-api-base-url.com/api/v1';

  // ---------------------------------------------------------------------------
  // Helpers (keep these; they'll wrap real http calls later)
  // ---------------------------------------------------------------------------

  /// Simulates network latency for dummy responses.
  /// Used by subclasses — replace calls with real HTTP when backend is ready.
  Future<void> simulateDelay([int ms = 800]) async {
    await Future.delayed(Duration(milliseconds: ms));
  }
}
