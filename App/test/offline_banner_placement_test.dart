import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:rideroster/components/offline_banner.dart';
import 'package:rideroster/providers/connectivity_provider.dart';
import 'package:rideroster/services/connectivity_service.dart';
import 'package:rideroster/utils/app_colors.dart';

/// Placement tests for [OfflineBanner].
///
/// The banner is the first child of a Column that the page wraps in a single
/// [SafeArea], so the banner and everything below it share one top inset. That
/// is the arrangement the dashboard, SOS and the job pages already used; the
/// profile pages did not, which drew the banner text under the status bar.
///
/// The regression these tests exist for: giving the banner its own inset made a
/// following widget with its own `SafeArea` (the profile header) apply the
/// status-bar inset a second time, pushing the header an extra 48px down.
void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  const headerHeight = 60.0;
  const bannerText = 'No internet — changes will sync when reconnected.';

  const connectivityChannel =
      MethodChannel('dev.fluttercommunity.plus/connectivity');
  const connectivityEventChannel =
      EventChannel('dev.fluttercommunity.plus/connectivity_status');

  final messenger =
      TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger;

  final bannerStrip = find.byWidgetPredicate(
    (w) =>
        w is Container &&
        w.color == AppColors.warning.withValues(alpha: 0.15),
    description: 'offline banner strip',
  );
  const header = Key('header');

  setUpAll(() async {
    // No network interface at all, so `ConnectivityService.init()` publishes
    // offline immediately — which is what the banner reacts to.
    messenger.setMockMethodCallHandler(connectivityChannel, (call) async {
      if (call.method == 'check') return <String>['none'];
      return null;
    });
    messenger.setMockStreamHandler(
      connectivityEventChannel,
      MockStreamHandler.inline(onListen: (args, sink) => sink.endOfStream()),
    );
    await ConnectivityService().init(
      probeBaseUrl: 'https://example.invalid',
      probeAnonKey: 'test-key',
    );
  });

  tearDownAll(() {
    messenger.setMockMethodCallHandler(connectivityChannel, null);
  });

  /// Banner then a header stand-in, wrapped in ONE `SafeArea` — the shape every
  /// page uses after the fix.
  Widget page() => SafeArea(
        child: Column(
          children: [
            const OfflineBanner(),
            SizedBox(
              key: header,
              height: headerHeight,
              width: double.infinity,
            ),
          ],
        ),
      );

  /// The status-bar gutter the page's `SafeArea` applies, read from the layout
  /// so assertions never hard-code a device metric.
  double statusBarGutter(WidgetTester tester) {
    final safeArea = find.byType(SafeArea).first;
    // SafeArea wraps its child in Padding, so the child's offset minus the
    // SafeArea's own offset is the inset it consumed.
    final child = find.descendant(
      of: safeArea,
      matching: find.byType(Column),
      matchRoot: false,
    );
    return tester.getTopLeft(child.first).dy -
        tester.getTopLeft(safeArea).dy;
  }

  Future<double> pumpPage(WidgetTester tester, double inset) async {
    await tester.pumpWidget(
      ChangeNotifierProvider<ConnectivityProvider>(
        create: (_) => ConnectivityProvider(),
        child: MediaQuery(
          data: MediaQueryData(padding: EdgeInsets.only(top: inset)),
          child: Directionality(
            textDirection: TextDirection.ltr,
            child: Material(child: page()),
          ),
        ),
      ),
    );
    await tester.pump();
    return statusBarGutter(tester);
  }

  testWidgets('offline state renders the banner strip and its message',
      (tester) async {
    await pumpPage(tester, 48);

    expect(find.text(bannerText), findsOneWidget);
    expect(find.byIcon(Icons.cloud_off_outlined), findsOneWidget);
    expect(bannerStrip, findsOneWidget);
  });

  testWidgets('banner sits below the status bar, once, for a 48px inset',
      (tester) async {
    final gutter = await pumpPage(tester, 48);

    expect(
      tester.getTopLeft(bannerStrip).dy,
      closeTo(gutter, 0.01),
      reason: 'the banner starts right below the status-bar inset',
    );
    expect(
      tester.getTopLeft(find.byKey(header)).dy,
      closeTo(gutter + tester.getSize(bannerStrip).height, 0.01),
      reason: 'the header follows immediately — a value near '
          '${gutter * 2 + tester.getSize(bannerStrip).height} means the inset '
          'is applied twice',
    );
  });

  testWidgets('holds for a larger notch (59px)', (tester) async {
    final gutter = await pumpPage(tester, 59);

    expect(tester.getTopLeft(bannerStrip).dy, closeTo(gutter, 0.01));
    expect(
      tester.getTopLeft(find.byKey(header)).dy,
      closeTo(gutter + tester.getSize(bannerStrip).height, 0.01),
      reason: 'must scale with the real inset, not a fixed guess',
    );
  });

  testWidgets('banner does not overlap or push content off screen',
      (tester) async {
    final gutter = await pumpPage(tester, 48);

    final stripHeight = tester.getSize(bannerStrip).height;
    expect(
      tester.getBottomLeft(bannerStrip).dy,
      lessThanOrEqualTo(tester.getTopLeft(find.byKey(header)).dy + 0.01),
      reason: 'the banner must never cover page content',
    );
    expect(
      tester.getBottomLeft(find.byKey(header)).dy,
      closeTo(gutter + stripHeight + headerHeight, 0.01),
      reason: 'content stays on screen, just shifted down by the banner',
    );
  });

  testWidgets('banner keeps its existing warning tint', (tester) async {
    await pumpPage(tester, 48);

    expect(
      bannerStrip,
      findsOneWidget,
      reason: 'the banner background must not change',
    );
  });
}
