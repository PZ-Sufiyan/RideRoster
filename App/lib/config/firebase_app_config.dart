import '../firebase_options.dart';

/// Kept separate from [DefaultFirebaseOptions] so `flutterfire configure`
/// does not remove this helper when it regenerates firebase_options.dart.
bool get isFirebaseConfigured {
  const opts = DefaultFirebaseOptions.android;
  return !opts.apiKey.contains('YOUR_') &&
      !opts.appId.contains('YOUR_') &&
      opts.projectId.isNotEmpty;
}
