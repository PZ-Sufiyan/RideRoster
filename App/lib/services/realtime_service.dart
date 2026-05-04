import 'dart:async';
import 'package:supabase_flutter/supabase_flutter.dart';

/// Manages Supabase Realtime subscriptions for the driver app.
///
/// Key fixes vs previous version:
///   1. channel.subscribe() returns RealtimeChannel not Future — no await.
///   2. _companyId removed — not needed for filtering, was causing unused warning.
///   3. subscribe() guards against null userId and re-tries if called too early.
///   4. Jobs channel uses no column filter (broadcast on all job changes for
///      the company) — column-level filters on non-indexed columns are
///      unreliable in Supabase Realtime. The JobProvider ignores irrelevant
///      events cheaply via a silent reload that returns null if no job matches.
class RealtimeService {
  RealtimeService._internal();
  static final RealtimeService _instance = RealtimeService._internal();
  factory RealtimeService() => _instance;

  final SupabaseClient _supabase = Supabase.instance.client;

  RealtimeChannel? _jobsChannel;
  RealtimeChannel? _sessionsChannel;
  RealtimeChannel? _passengersChannel;

  String? _driverId;

  // ── Stream controllers ────────────────────────────────────────────────────

  final _jobChanges = StreamController<Map<String, dynamic>>.broadcast();
  final _sessionChanges = StreamController<Map<String, dynamic>>.broadcast();
  final _passengerChanges = StreamController<Map<String, dynamic>>.broadcast();

  Stream<Map<String, dynamic>> get onJobChange => _jobChanges.stream;
  Stream<Map<String, dynamic>> get onSessionChange => _sessionChanges.stream;
  Stream<Map<String, dynamic>> get onPassengerChange =>
      _passengerChanges.stream;

  bool _subscribed = false;

  // ── Subscribe ─────────────────────────────────────────────────────────────

  Future<void> subscribe() async {
    // Guard: get the current user — may be null if called too early on restore
    final user = _supabase.auth.currentUser;
    if (user == null) {
      // Wait for Supabase auth to emit a session, then retry once
      await _waitForSession();
      if (_supabase.auth.currentUser == null) return; // still null, give up
    }

    if (_subscribed) return;

    _driverId = _supabase.auth.currentUser!.id;
    _subscribed = true;

    _subscribeToJobs();
    _subscribeToSessions();
    _subscribeToSessionPassengers();
  }

  /// Waits up to 3 seconds for Supabase to restore an auth session.
  /// This handles the case where subscribe() is called during app restore
  /// before the session token has been validated.
  Future<void> _waitForSession() async {
    final completer = Completer<void>();
    StreamSubscription? sub;

    sub = _supabase.auth.onAuthStateChange.listen((event) {
      if (event.session != null && !completer.isCompleted) {
        completer.complete();
        sub?.cancel();
      }
    });

    // Timeout after 3 seconds so we don't hang indefinitely
    await completer.future.timeout(
      const Duration(seconds: 3),
      onTimeout: () {},
    );
    await sub.cancel();
  }

  // ── Jobs channel ──────────────────────────────────────────────────────────
  //
  // We listen to ALL updates on the jobs table (no column filter).
  // Column-level filters like `assigned_driver_id=eq.{id}` require the
  // column to be in the Realtime publication and are fragile.
  // The JobProvider does a cheap silent reload on every event — if no
  // matching job exists for this driver, fetchCurrentJob() returns null
  // quickly and nothing changes in the UI.

  void _subscribeToJobs() {
    _jobsChannel?.unsubscribe();

    final driverId = _driverId!;
    _jobsChannel = _supabase
        .channel('driver-jobs-$driverId')
        .onPostgresChanges(
          event: PostgresChangeEvent.update,
          schema: 'public',
          table: 'jobs',
          callback: (payload) {
            if (!_jobChanges.isClosed) {
              _jobChanges.add(Map<String, dynamic>.from(payload.newRecord));
            }
          },
        )
        .onPostgresChanges(
          event: PostgresChangeEvent.insert,
          schema: 'public',
          table: 'jobs',
          callback: (payload) {
            if (!_jobChanges.isClosed) {
              _jobChanges.add(Map<String, dynamic>.from(payload.newRecord));
            }
          },
        );

    // subscribe() returns RealtimeChannel — do NOT await
    _jobsChannel!.subscribe();
  }

  // ── Sessions channel ──────────────────────────────────────────────────────

  void _subscribeToSessions() {
    _sessionsChannel?.unsubscribe();

    final driverId = _driverId!;
    _sessionsChannel = _supabase
        .channel('driver-sessions-$driverId')
        .onPostgresChanges(
          event: PostgresChangeEvent.insert,
          schema: 'public',
          table: 'job_sessions',
          filter: PostgresChangeFilter(
            type: PostgresChangeFilterType.eq,
            column: 'driver_id',
            value: driverId,
          ),
          callback: (payload) {
            if (!_sessionChanges.isClosed) {
              _sessionChanges.add(Map<String, dynamic>.from(payload.newRecord));
            }
          },
        )
        .onPostgresChanges(
          event: PostgresChangeEvent.update,
          schema: 'public',
          table: 'job_sessions',
          filter: PostgresChangeFilter(
            type: PostgresChangeFilterType.eq,
            column: 'driver_id',
            value: driverId,
          ),
          callback: (payload) {
            if (!_sessionChanges.isClosed) {
              _sessionChanges.add(Map<String, dynamic>.from(payload.newRecord));
            }
          },
        );

    _sessionsChannel!.subscribe();
  }

  // ── Session passengers channel ────────────────────────────────────────────

  void _subscribeToSessionPassengers() {
    _passengersChannel?.unsubscribe();

    final driverId = _driverId!;
    _passengersChannel = _supabase
        .channel('driver-session-passengers-$driverId')
        .onPostgresChanges(
          event: PostgresChangeEvent.insert,
          schema: 'public',
          table: 'job_session_passengers',
          callback: (payload) {
            if (!_passengerChanges.isClosed) {
              _passengerChanges.add(
                Map<String, dynamic>.from(payload.newRecord),
              );
            }
          },
        )
        .onPostgresChanges(
          event: PostgresChangeEvent.update,
          schema: 'public',
          table: 'job_session_passengers',
          callback: (payload) {
            if (!_passengerChanges.isClosed) {
              _passengerChanges.add(
                Map<String, dynamic>.from(payload.newRecord),
              );
            }
          },
        );

    _passengersChannel!.subscribe();
  }

  // ── Unsubscribe ───────────────────────────────────────────────────────────

  Future<void> unsubscribe() async {
    _subscribed = false;
    _driverId = null;
    _jobsChannel?.unsubscribe();
    _sessionsChannel?.unsubscribe();
    _passengersChannel?.unsubscribe();
    _jobsChannel = null;
    _sessionsChannel = null;
    _passengersChannel = null;
  }

  Future<void> dispose() async {
    await unsubscribe();
    await _jobChanges.close();
    await _sessionChanges.close();
    await _passengerChanges.close();
  }
}
