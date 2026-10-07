import 'package:supabase_flutter/supabase_flutter.dart';

import 'api_service.dart';

class RequiredTermsPayload {
  final String termsId;
  final int version;
  final String title;
  final String content;
  final String? audience;

  const RequiredTermsPayload({
    required this.termsId,
    required this.version,
    required this.title,
    required this.content,
    this.audience,
  });
}

class TermsCheckResult {
  final bool required;
  final RequiredTermsPayload? terms;
  final String? error;

  const TermsCheckResult._({
    required this.required,
    this.terms,
    this.error,
  });

  factory TermsCheckResult.notRequired() =>
      const TermsCheckResult._(required: false);

  factory TermsCheckResult.needsAcceptance(RequiredTermsPayload terms) =>
      TermsCheckResult._(required: true, terms: terms);

  factory TermsCheckResult.failure(String message) =>
      TermsCheckResult._(required: false, error: message);
}

class TermsAcceptResult {
  final bool success;
  final String? error;

  const TermsAcceptResult._({required this.success, this.error});

  factory TermsAcceptResult.ok() => const TermsAcceptResult._(success: true);

  factory TermsAcceptResult.fail(String message) =>
      TermsAcceptResult._(success: false, error: message);
}

class TermsService extends ApiService {
  SupabaseClient get _supabase => Supabase.instance.client;

  Future<TermsCheckResult> fetchRequiredTerms() async {
    try {
      final raw = await _supabase.rpc('get_required_terms_for_user');
      if (raw == null) {
        return TermsCheckResult.failure(
          'Unable to verify Terms & Conditions. Please try again.',
        );
      }

      final map = Map<String, dynamic>.from(raw as Map);
      if (map['error'] != null) {
        return TermsCheckResult.failure(
          'Session expired. Please sign in again.',
        );
      }

      final required = map['required'] == true;
      if (!required) {
        return TermsCheckResult.notRequired();
      }

      final termsId = map['terms_id']?.toString();
      final version = map['version'];
      final title = map['title']?.toString();
      final content = map['content']?.toString();

      if (termsId == null ||
          termsId.isEmpty ||
          content == null ||
          content.isEmpty) {
        return TermsCheckResult.failure(
          'Terms & Conditions could not be loaded. Please try again.',
        );
      }

      return TermsCheckResult.needsAcceptance(
        RequiredTermsPayload(
          termsId: termsId,
          version: version is int ? version : int.tryParse('$version') ?? 0,
          title: (title == null || title.isEmpty)
              ? 'Terms & Conditions'
              : title,
          content: content,
          audience: map['audience']?.toString(),
        ),
      );
    } catch (_) {
      return TermsCheckResult.failure(
        'Unable to verify Terms & Conditions. Check your connection and try again.',
      );
    }
  }

  Future<TermsAcceptResult> acceptTerms(String termsId) async {
    try {
      final raw = await _supabase.rpc(
        'accept_required_terms',
        params: {'p_terms_id': termsId},
      );
      final map = Map<String, dynamic>.from(raw as Map);
      if (map['success'] == true) {
        return TermsAcceptResult.ok();
      }
      final err = map['error']?.toString() ?? 'unknown';
      if (err == 'stale_terms_version') {
        return TermsAcceptResult.fail(
          'These terms were updated. Please review the latest version and try again.',
        );
      }
      return TermsAcceptResult.fail(
        'Could not save your acceptance. Please try again.',
      );
    } catch (_) {
      return TermsAcceptResult.fail(
        'Could not save your acceptance. Check your connection and try again.',
      );
    }
  }
}
