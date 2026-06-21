import 'connectivity_service.dart';

/// Bridges [LocalJobRepository] enqueue events to [SyncEngine] without a
/// circular import. Registered once in [main].
class SyncScheduler {
  SyncScheduler._();

  static Future<void> Function()? _processor;

  static void register(Future<void> Function() processor) {
    _processor = processor;
  }

  /// Call after a sync_queue row is inserted. Flushes immediately when online.
  static Future<void> flushIfOnline() async {
    final processor = _processor;
    if (processor == null) return;
    if (!ConnectivityService().canReachServer) return;
    await processor();
  }
}
