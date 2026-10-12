import 'dart:async';
import 'dart:io';

import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:rideroster/services/connectivity_service.dart';

/// Regression tests for the offline banner.
///
/// These drive [ConnectivityService] itself — the same singleton the banner,
/// the sync engine and every `canReachServer` guard read — instead of a
/// re-implementation of its state machine.
///
/// **The bug.** `init()` used to seed `_serverReachable = _hasLink` and then set
/// `_lastEmittedOnline` from that optimistic value. A cold start with a network
/// interface but no actual internet (Wi-Fi with an exclamation mark, a captive
/// portal, a dead route) therefore announced "online" — and had no edge left to
/// publish when the probe failed, because a first probe failure only reaches
/// `_consecutiveFailures == 1`, which is deliberately below the offline
/// threshold. The banner stayed hidden until a *second* probe failed a whole
/// `_onlineProbeInterval` later, i.e. 35-65 s after launch, so in practice a
/// user who opened the app already offline never saw it. The banner only ever
/// appeared when a `true → false` edge existed, which is why connecting first
/// and then disconnecting worked.
///
/// `flutter_test` replaces the global `HttpClient` with a stub that always
/// returns 400, which would silently turn this probe into a *success*, so each
/// test installs an explicit [HttpOverrides].
///
/// There is a single test because [ConnectivityService] is a process-wide
/// singleton whose streams are closed by `dispose()`: one test drives the whole
/// lifecycle, which is also exactly the online→offline behaviour being
/// protected.
void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  const connectivityChannel =
      MethodChannel('dev.fluttercommunity.plus/connectivity');
  const connectivityEventChannel =
      EventChannel('dev.fluttercommunity.plus/connectivity_status');

  final messenger =
      TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger;

  setUp(() {
    // The device reports a Wi-Fi link — the "Wi-Fi icon with an exclamation
    // mark" case: an interface is up, but nothing is actually reachable.
    messenger.setMockMethodCallHandler(connectivityChannel, (call) async {
      if (call.method == 'check') return <String>['wifi'];
      return null;
    });
    // No link-change events are needed; this stream is only held open so the
    // platform channel is not contacted.
    messenger.setMockStreamHandler(
      connectivityEventChannel,
      MockStreamHandler.inline(onListen: (args, sink) => sink.endOfStream()),
    );
  });

  tearDown(() {
    messenger.setMockMethodCallHandler(connectivityChannel, null);
    HttpOverrides.global = null;
  });

  test(
    'offline on cold start shows the banner, and a later drop does too',
    () async {
      // ── 1. Cold start, already offline ────────────────────────────────────
      HttpOverrides.global = _UnreachableHttpOverrides();

      final service = ConnectivityService();
      final emitted = <bool>[];
      final sub = service.onlineStream.listen(emitted.add);

      await service.init(
        probeBaseUrl: 'https://example.invalid',
        probeAnonKey: 'test-key',
      );

      // `init` must not claim reachability just because a link exists: an
      // interface being up is not evidence that Supabase answers.
      expect(
        service.canReachServer,
        isFalse,
        reason: 'init() must not announce online before the server has '
            'actually been reached',
      );

      await _waitFor(
        () => emitted.contains(false),
        timeout: const Duration(seconds: 10),
      );
      expect(
        emitted,
        contains(false),
        reason: 'THE BUG: opening the app while already offline must publish an '
            'offline event, otherwise the banner never appears',
      );

      // ── 2. Server becomes reachable — banner must go away ─────────────────
      HttpOverrides.global = _AnsweringHttpOverrides();
      await service.triggerProbe();

      await _waitFor(
        () => emitted.contains(true),
        timeout: const Duration(seconds: 10),
      );
      expect(
        service.canReachServer,
        isTrue,
        reason: 'a healthy connection must not leave the offline banner up',
      );

      // ── 3. Connection drops again — the pre-existing behaviour ────────────
      HttpOverrides.global = _UnreachableHttpOverrides();
      await service.triggerProbe(); // failure 1 (below threshold)
      await service.triggerProbe(); // failure 2 (confirms offline)
      await _waitFor(
        () => !service.canReachServer,
        timeout: const Duration(seconds: 10),
      );
      expect(
        service.canReachServer,
        isFalse,
        reason: 'online -> offline must keep working exactly as before',
      );

      await sub.cancel();
      await service.dispose();
    },
    timeout: const Timeout(Duration(seconds: 60)),
  );
}

/// Makes every HTTP request fail at connect time — a dead route or captive
/// portal, as seen by the probe.
class _UnreachableHttpOverrides extends HttpOverrides {
  @override
  HttpClient createHttpClient(SecurityContext? context) =>
      _UnreachableHttpClient();
}

/// The slice of [HttpClient] that `_httpProbe` actually touches.
abstract class _FakeHttpClient implements HttpClient {
  @override
  Duration? connectionTimeout;

  @override
  Duration idleTimeout = const Duration(seconds: 15);

  @override
  int? maxConnectionsPerHost;

  @override
  String? userAgent;

  @override
  bool autoUncompress = true;

  @override
  void close({bool force = false}) {}

  @override
  noSuchMethod(Invocation invocation) =>
      throw UnsupportedError('unexpected HttpClient use: $invocation');
}

class _UnreachableHttpClient extends _FakeHttpClient {
  @override
  Future<HttpClientRequest> headUrl(Uri url) =>
      Future<HttpClientRequest>.error(
        const SocketException('No route to host (test)'),
      );
}

/// Answers every HEAD with `200 OK`, so the probe reports "reachable".
class _AnsweringHttpOverrides extends HttpOverrides {
  @override
  HttpClient createHttpClient(SecurityContext? context) =>
      _AnsweringHttpClient();
}

class _AnsweringHttpClient extends _FakeHttpClient {
  @override
  Future<HttpClientRequest> headUrl(Uri url) async => _FakeHttpClientRequest();
}

class _FakeHttpClientRequest implements HttpClientRequest {
  @override
  final HttpHeaders headers = _FakeHttpHeaders();

  @override
  Future<HttpClientResponse> close() async => _FakeHttpClientResponse();

  @override
  noSuchMethod(Invocation invocation) =>
      throw UnsupportedError('unexpected request use: $invocation');
}

class _FakeHttpClientResponse extends Stream<List<int>>
    implements HttpClientResponse {
  @override
  int get statusCode => HttpStatus.ok;

  @override
  int get contentLength => 0;

  @override
  HttpClientResponseCompressionState get compressionState =>
      HttpClientResponseCompressionState.notCompressed;

  // A real `Stream` implementation, so `_httpProbe`'s `response.drain()`
  // resolves instead of falling through to [noSuchMethod].
  @override
  StreamSubscription<List<int>> listen(
    void Function(List<int> event)? onData, {
    Function? onError,
    void Function()? onDone,
    bool? cancelOnError,
  }) {
    return const Stream<List<int>>.empty().listen(
      onData,
      onError: onError,
      onDone: onDone,
      cancelOnError: cancelOnError,
    );
  }

  @override
  noSuchMethod(Invocation invocation) =>
      throw UnsupportedError('unexpected response use: $invocation');
}

class _FakeHttpHeaders implements HttpHeaders {
  @override
  void set(String name, Object value, {bool preserveHeaderCase = false}) {}

  @override
  noSuchMethod(Invocation invocation) =>
      throw UnsupportedError('unexpected headers use: $invocation');
}

/// Polls [predicate] until it is true or [timeout] elapses.
Future<void> _waitFor(
  bool Function() predicate, {
  required Duration timeout,
}) async {
  final deadline = DateTime.now().add(timeout);
  while (DateTime.now().isBefore(deadline)) {
    if (predicate()) return;
    await Future<void>.delayed(const Duration(milliseconds: 50));
  }
}
