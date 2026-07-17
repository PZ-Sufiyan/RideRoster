import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:supabase_flutter/supabase_flutter.dart';

import '../config/supabase_config.dart';

/// Ensures mobile self-registration matches the web Admin email policy:
/// Auth user stays unconfirmed until the confirmation link is used, and a
/// signup confirmation email is sent with the correct redirect URL.
class EmailConfirmationService {
  EmailConfirmationService._();

  static final EmailConfirmationService instance = EmailConfirmationService._();

  SupabaseClient get _supabase => Supabase.instance.client;

  /// Call immediately after [signUp], before writing profile / document rows.
  ///
  /// - When a session exists (common when Auth autoconfirms), calls the push-api
  ///   to force `email_confirm: false` and send the confirmation email.
  /// - When no session exists (Confirm email already on), resends the signup
  ///   email with the app redirect URL.
  Future<void> enforceAfterSignUp({
    required String email,
    required String role,
    required Session? session,
  }) async {
    final emailNorm = email.trim().toLowerCase();
    final roleNorm = role.trim().toLowerCase();
    final redirectTo = SupabaseConfig.emailConfirmRedirectUrl(roleNorm);

    if (session != null && session.accessToken.isNotEmpty) {
      await _requireViaPushApi(
        accessToken: session.accessToken,
        role: roleNorm,
        emailRedirectTo: redirectTo,
      );

      // Fresh Auth user must be unconfirmed before profile / document writes.
      final latest = await _supabase.auth.getUser();
      if (latest.user?.emailConfirmedAt != null) {
        throw Exception(
          'Could not require email confirmation for this account. '
          'Please try again or contact support.',
        );
      }
      return;
    }

    // Confirm-email-already-on path: no session, account is unconfirmed.
    await _supabase.auth.resend(
      type: OtpType.signup,
      email: emailNorm,
      emailRedirectTo: redirectTo,
    );
  }

  Future<void> _requireViaPushApi({
    required String accessToken,
    required String role,
    required String emailRedirectTo,
  }) async {
    final uri = Uri.parse(
      '${SupabaseConfig.pushApiUrl}/auth/require-email-confirmation',
    );
    final client = HttpClient();
    try {
      final request = await client.postUrl(uri).timeout(const Duration(seconds: 30));
      request.headers.set(HttpHeaders.contentTypeHeader, 'application/json');
      request.headers.set(HttpHeaders.authorizationHeader, 'Bearer $accessToken');
      request.add(
        utf8.encode(
          jsonEncode({
            'role': role,
            'emailRedirectTo': emailRedirectTo,
          }),
        ),
      );

      final response = await request.close().timeout(const Duration(seconds: 30));
      final body = await response.transform(utf8.decoder).join();

      if (response.statusCode < 200 || response.statusCode >= 300) {
        String message = 'Could not send confirmation email. Please try again.';
        try {
          final decoded = jsonDecode(body);
          if (decoded is Map && decoded['error'] != null) {
            message = decoded['error'].toString();
          }
        } catch (_) {
          /* keep default */
        }
        throw Exception(message);
      }
    } on SocketException {
      throw Exception(
        'Connection problem while sending confirmation email. Check your internet and try again.',
      );
    } on TimeoutException {
      throw Exception(
        'Connection problem while sending confirmation email. Check your internet and try again.',
      );
    } finally {
      client.close(force: true);
    }
  }
}
