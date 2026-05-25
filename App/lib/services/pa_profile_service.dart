import 'package:supabase_flutter/supabase_flutter.dart';

import '../model/pa_profile_model.dart';

/// Read-only Supabase queries for the Passenger Assistant profile screen.
class PaProfileService {
  SupabaseClient get _supabase => Supabase.instance.client;

  Future<PaProfileModel> fetchProfile() async {
    final userId = _supabase.auth.currentUser?.id;
    if (userId == null || userId.isEmpty) {
      throw Exception('No authenticated passenger assistant session found.');
    }

    final assistantRow = await _supabase
        .from('passenger_assistant')
        .select(
          'id, company_id, first_name, surname, email, phone, '
          'residential_address, profile_picture_url, '
          'emergency_contact_name, emergency_contact_phone, '
          'nationality, right_to_work_code, passport_number, status',
        )
        .eq('id', userId)
        .maybeSingle();

    if (assistantRow == null) {
      throw Exception('Passenger assistant profile record was not found.');
    }

    final docsResponse = await _supabase
        .from('passenger_assistant_documents')
        .select(
          'id, document_type, file_name, file_url, expiry_date, verified, uploaded_at',
        )
        .eq('passenger_assistant_id', userId)
        .order('uploaded_at', ascending: false);

    final documents = (docsResponse as List)
        .map((item) {
          if (item is! Map) return null;
          return PaDocumentModel.fromMap(Map<String, dynamic>.from(item));
        })
        .whereType<PaDocumentModel>()
        .where((doc) => doc.id.isNotEmpty)
        .toList();

    return PaProfileModel.fromMap(
      Map<String, dynamic>.from(assistantRow),
      documents: documents,
    );
  }
}
