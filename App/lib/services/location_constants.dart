/// Shared location thresholds and user-facing messages for job stop validation.
class LocationConstants {
  LocationConstants._();

  /// Radius within which pickup / drop-off completion actions are allowed.
  static const double completionRadiusMeters = 20;

  static String get pickupTooFarMessage =>
      'You must be within ${completionRadiusMeters.round()} meters of the pickup location to complete this action.';

  static String get dropoffTooFarMessage =>
      'You must be within ${completionRadiusMeters.round()} meters of the drop-off location to complete this action.';

  static const String noPickupCoordinatesMessage =
      'Cannot complete pickup — no GPS coordinates for this stop.';

  static const String noDropoffCoordinatesMessage =
      'Cannot complete drop-off — no GPS coordinates for this stop.';

  static const String locationUnavailableMessage =
      'Unable to determine your location. Please enable GPS and try again.';
}
