import 'package:supabase_flutter/supabase_flutter.dart';

/// Persists the driver's FCM token in Supabase for server-side push delivery.
class PushTokenService {
  SupabaseClient get _supabase => Supabase.instance.client;

  Future<void> upsertToken({
    required String userId,
    required String token,
    required String platform,
  }) async {
    if (userId.trim().isEmpty || token.trim().isEmpty) return;

    await _supabase.from('device_push_tokens').upsert(
      {
        'user_id': userId,
        'fcm_token': token,
        'platform': platform,
        'updated_at': DateTime.now().toUtc().toIso8601String(),
      },
      onConflict: 'user_id,fcm_token',
    );
  }

  Future<void> removeToken({
    required String userId,
    required String token,
  }) async {
    if (userId.trim().isEmpty || token.trim().isEmpty) return;

    await _supabase
        .from('device_push_tokens')
        .delete()
        .eq('user_id', userId)
        .eq('fcm_token', token);
  }
}
