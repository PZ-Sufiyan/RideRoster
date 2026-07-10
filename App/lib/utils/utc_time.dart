/// Helpers for Supabase `timestamptz` columns — always store UTC (+00).
class UtcTime {
  UtcTime._();

  /// Current instant as a UTC ISO-8601 string (e.g. `2026-07-10T10:38:28.948791Z`).
  static String nowIso() => DateTime.now().toUtc().toIso8601String();

  /// Converts any [DateTime] (local or UTC) to a UTC ISO-8601 string for Supabase.
  static String toIso(DateTime value) => value.toUtc().toIso8601String();
}
