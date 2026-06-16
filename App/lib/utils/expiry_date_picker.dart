import 'package:flutter/material.dart';

import 'app_colors.dart';

DateTime _dateOnly(DateTime value) =>
    DateTime(value.year, value.month, value.day);

/// Resolves [firstDate], [initialDate], and [lastDate] for [showDatePicker].
///
/// Flutter requires `initialDate >= firstDate`. When [initial] is in the past,
/// [firstDate] is lowered to that date and [initialDate] opens at today so the
/// user can pick a new future expiry without a crash.
({DateTime firstDate, DateTime initialDate, DateTime lastDate})
    resolveExpiryPickerBounds({
  DateTime? initial,
  int yearsAhead = 20,
}) {
  final today = _dateOnly(DateTime.now());
  final lastDate = DateTime(today.year + yearsAhead, today.month, today.day);
  final normalizedInitial =
      initial != null ? _dateOnly(initial) : null;

  if (normalizedInitial == null) {
    return (firstDate: today, initialDate: today, lastDate: lastDate);
  }

  if (normalizedInitial.isBefore(today)) {
    return (
      firstDate: normalizedInitial,
      initialDate: today,
      lastDate: lastDate,
    );
  }

  if (normalizedInitial.isAfter(lastDate)) {
    return (firstDate: today, initialDate: lastDate, lastDate: lastDate);
  }

  return (
    firstDate: today,
    initialDate: normalizedInitial,
    lastDate: lastDate,
  );
}

/// Opens an expiry date picker safe for editing existing (possibly expired) dates.
Future<DateTime?> pickExpiryDate(
  BuildContext context, {
  DateTime? initial,
  int yearsAhead = 20,
}) async {
  final bounds = resolveExpiryPickerBounds(
    initial: initial,
    yearsAhead: yearsAhead,
  );

  return showDatePicker(
    context: context,
    initialDate: bounds.initialDate,
    firstDate: bounds.firstDate,
    lastDate: bounds.lastDate,
    helpText: 'Select Expiry Date',
    builder: (context, child) => Theme(
      data: Theme.of(context).copyWith(
        colorScheme: const ColorScheme.light(primary: AppColors.primary),
      ),
      child: child!,
    ),
  );
}
