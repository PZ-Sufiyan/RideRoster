/// A single stop shown in the job request timeline.
///
/// [direction] drives which section it appears in:
///   'outbound' → Morning Run section
///   'inbound'  → Evening Return section (pickup only — no home dropoffs)
class DriverJobRequestStop {
  final String
  type; // 'Morning Pickup' | 'Morning Dropoff' | 'Return from School'
  final String address;
  final String time;
  final double? latitude;
  final double? longitude;
  final List<String> weekdays; // ['mon','tue','wed','thu','fri']
  final String direction; // 'outbound' | 'inbound'

  const DriverJobRequestStop({
    required this.type,
    required this.address,
    required this.time,
    required this.latitude,
    required this.longitude,
    this.weekdays = const [],
    this.direction = 'outbound',
  });

  bool get hasCoordinates => latitude != null && longitude != null;
  bool get isInbound => direction == 'inbound';

  /// True only for the school dropoff stop (end of morning run).
  /// Used for map pin color — everything else is a pickup.
  bool get isMorningDropoff => type == 'Morning Dropoff';
}

class DriverJobRequest {
  final String id;
  final String title;
  final String? internalJobId;
  final String earnings;
  final String pickup;
  final String dropoff;
  final String timeAndStudents;
  final String accessibilityNote;
  final List<DriverJobRequestStop> stops;
  final String semesterLabel;

  const DriverJobRequest({
    required this.id,
    required this.title,
    required this.internalJobId,
    required this.earnings,
    required this.pickup,
    required this.dropoff,
    required this.timeAndStudents,
    required this.accessibilityNote,
    required this.stops,
    this.semesterLabel = '',
  });
}
