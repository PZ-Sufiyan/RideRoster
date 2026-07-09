import 'package:flutter/foundation.dart'
    show TargetPlatform, defaultTargetPlatform, kIsWeb;

import '../firebase_options.dart';

/// Kept separate from [DefaultFirebaseOptions] so `flutterfire configure`
/// does not remove this helper when it regenerates firebase_options.dart.
bool get isFirebaseConfigured {
  if (kIsWeb) {
    return _optionsLookValid(DefaultFirebaseOptions.web);
  }

  switch (defaultTargetPlatform) {
    case TargetPlatform.iOS:
    case TargetPlatform.macOS:
      final opts = DefaultFirebaseOptions.ios;
      final bundleId = opts.iosBundleId ?? '';
      return _optionsLookValid(opts) &&
          bundleId.isNotEmpty &&
          !bundleId.contains('RunnerTests') &&
          !bundleId.contains('YOUR_');
    default:
      return _optionsLookValid(DefaultFirebaseOptions.android);
  }
}

bool _optionsLookValid(dynamic opts) {
  final apiKey = opts.apiKey as String? ?? '';
  final appId = opts.appId as String? ?? '';
  final projectId = opts.projectId as String? ?? '';
  return !apiKey.contains('YOUR_') &&
      !appId.contains('YOUR_') &&
      projectId.isNotEmpty;
}
