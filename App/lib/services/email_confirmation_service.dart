import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:supabase_flutter/supabase_flutter.dart';

import '../config/supabase_config.dart';

/// Mobile Auth registration aligned with web Admin policy:
/// create unconfirmed Auth user via push-api, send confirmation email, then
/// open a registration session so profile / document writes can proceed.
class EmailConfirmationService {
  EmailConfirmationService._();

  static final EmailConfirmationService instance = EmailConfirmationService._();

  SupabaseClient get _supabase => Supabase.instance.client;

  /// Creates an unconfirmed Auth user (server), receives registration tokens,
  /// and restores a local session for table/storage writes.
  /// Caller must [signOut] when done.
  Future<User> createUnconfirmedUserAndSignIn({
    required String email,
    required String password,
    required String role,
    Map<String, dynamic> userMetadata = const {},
  }) async {
    final emailNorm = email.trim().toLowerCase();
    final roleNorm = role.trim().toLowerCase();
    final redirectTo = SupabaseConfig.emailConfirmRedirectUrl(roleNorm);

    final created = await _createUnconfirmedViaPushApi(
      email: emailNorm,
      password: password,
      role: roleNorm,
      userMetadata: userMetadata,
      emailRedirectTo: redirectTo,
    );

    // Do not use signInWithPassword here — GoTrue returns email_not_confirmed
    // for unconfirmed users. The server mints registration tokens instead.
    final sessionResponse = await _supabase.auth.setSession(created.refreshToken);
    final user = sessionResponse.user ?? _supabase.auth.currentUser;
    final session = sessionResponse.session ?? _supabase.auth.currentSession;

    if (user == null || session == null) {
      throw Exception('Could not start registration session. Please try again.');
    }

    if (user.id != created.userId) {
      await _supabase.auth.signOut();
      throw Exception('Registration session mismatch. Please try again.');
    }

    return user;
  }

  Future<({String userId, String email, String refreshToken})>
      _createUnconfirmedViaPushApi({
    required String email,
    required String password,
    required String role,
    required Map<String, dynamic> userMetadata,
    required String emailRedirectTo,
  }) async {
    final uri = Uri.parse(
      '${SupabaseConfig.pushApiUrl}/auth/create-unconfirmed-mobile-user',
    );
    final client = HttpClient();
    try {
      final request =
          await client.postUrl(uri).timeout(const Duration(seconds: 60));
      request.headers.set(HttpHeaders.contentTypeHeader, 'application/json');
      request.add(
        utf8.encode(
          jsonEncode({
            'email': email,
            'password': password,
            'role': role,
            'userMetadata': userMetadata,
            'emailRedirectTo': emailRedirectTo,
          }),
        ),
      );

      final response =
          await request.close().timeout(const Duration(seconds: 60));
      final body = await response.transform(utf8.decoder).join();

      if (response.statusCode < 200 || response.statusCode >= 300) {
        String message = 'Could not create account. Please try again.';
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

      final decoded = jsonDecode(body);
      if (decoded is! Map ||
          decoded['userId'] == null ||
          decoded['refresh_token'] == null) {
        throw Exception('Could not create account. Please try again.');
      }

      return (
        userId: decoded['userId'].toString(),
        email: (decoded['email'] ?? email).toString(),
        refreshToken: decoded['refresh_token'].toString(),
      );
    } on SocketException {
      throw Exception(
        'Connection problem while creating account. Check your internet and try again.',
      );
    } on TimeoutException {
      throw Exception(
        'Connection problem while creating account. Check your internet and try again.',
      );
    } finally {
      client.close(force: true);
    }
  }
}
