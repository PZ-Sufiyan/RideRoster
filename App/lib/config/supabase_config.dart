class SupabaseConfig {
  // Add your real Supabase project URL here.
  static const String url = 'https://supabase.nst-sch.com/';

  // Add your real Supabase anon public key here.
  static const String anonKey = 'YOUR_SUPABASE_ANON_KEY';

  static bool get isConfigured =>
      !url.contains('YOUR_PROJECT_ID') &&
      !anonKey.contains('YOUR_SUPABASE_ANON_KEY') &&
      url.isNotEmpty &&
      anonKey.isNotEmpty;
}
