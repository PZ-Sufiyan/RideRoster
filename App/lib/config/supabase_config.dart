class SupabaseConfig {
  // Add your real Supabase project URL here.
  static const String url = 'https://supabase.nst-sch.com';

  // Add your real Supabase anon public key here.
  static const String anonKey =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzczNTIzMDU1LCJleHAiOjE5MzEyMDMwNTV9.eUEQ9s7p5BlF4og2-xCGHqvpsH7PJnj0rtiYhCQ501o';

  /// Push / auth helper API (nginx → Node on the Supabase host).
  static const String pushApiUrl = 'https://supabase.nst-sch.com/push-api';

  /// Public web origin for email confirmation redirects (must be allow-listed
  /// in Supabase Auth redirect URLs).
  static const String appOrigin = 'https://nst-sch.com';

  static String emailConfirmRedirectUrl(String role) {
    final normalized = role.trim().toLowerCase();
    final qs = normalized.isEmpty ? '' : '?role=$normalized';
    return '$appOrigin/auth/confirmed$qs';
  }

  static bool get isConfigured =>
      !url.contains('YOUR_PROJECT_ID') &&
      !anonKey.contains('YOUR_SUPABASE_ANON_KEY') &&
      url.isNotEmpty &&
      anonKey.isNotEmpty;
}
