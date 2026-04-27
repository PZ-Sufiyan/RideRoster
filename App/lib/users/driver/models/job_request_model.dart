class DriverJobRequestStop {
  final String type;
  final String address;
  final String time;
  final bool isDropoff;
  final double? latitude;
  final double? longitude;

  const DriverJobRequestStop({
    required this.type,
    required this.address,
    required this.time,
    required this.isDropoff,
    required this.latitude,
    required this.longitude,
  });

  bool get hasCoordinates => latitude != null && longitude != null;
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
  });
}
