import '../repositories/local_job_repository.dart';

/// Clears local session data and in-memory provider state on logout.
/// Usually invoked in the background after the UI has already navigated away.
class SessionCleanup {
  SessionCleanup._();

  static LocalJobRepository? _localRepo;
  static void Function()? _memoryReset;

  static void init(LocalJobRepository localRepo) {
    _localRepo = localRepo;
  }

  /// Register provider / UI cache resets (called once from [_SessionBindings]).
  static void registerMemoryReset(void Function() reset) {
    _memoryReset = reset;
  }

  /// Wipe drift tables and reset registered in-memory state.
  static Future<void> clearOnLogout() async {
    final repo = _localRepo;
    if (repo != null) {
      await repo.clearAllLocalData();
    }
    _memoryReset?.call();
  }
}
