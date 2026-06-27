import 'dart:io';
import 'package:drift/drift.dart';
import 'package:drift/native.dart';
import 'package:path_provider/path_provider.dart';
import 'package:path/path.dart' as p;

part 'app_database.g.dart';

// ─────────────────────────────────────────────────────────────────────────────
// READ-ONLY CACHE TABLES
// Populated on app launch (online). Refreshed if > 4 hours old.
// Never written to by driver actions — only by CacheRepository.
// ─────────────────────────────────────────────────────────────────────────────

/// Mirrors the relevant columns from [jobs] that JobService needs.
class JobsCache extends Table {
  TextColumn get id => text()();
  TextColumn get jobName => text()();
  TextColumn get internalJobId => text().nullable()();
  TextColumn get assignedDriverId => text()();
  TextColumn get assignedPaId => text().nullable()();
  TextColumn get driverName => text().nullable()(); // cached from drivers table
  BoolColumn get hasOutbound => boolean().withDefault(const Constant(true))();
  BoolColumn get hasInbound => boolean().withDefault(const Constant(true))();
  TextColumn get morningStartTime => text().nullable()();
  TextColumn get morningEndTime => text().nullable()();
  TextColumn get eveningStartTime => text().nullable()();
  TextColumn get semesterStart => text()(); // stored as 'YYYY-MM-DD'
  TextColumn get semesterEnd => text()();
  TextColumn get status => text()();
  TextColumn get driverApprovalStatus => text().nullable()();
  // Metadata
  DateTimeColumn get cachedAt => dateTime().withDefault(currentDateAndTime)();

  @override
  Set<Column> get primaryKey => {id};
}

/// Mirrors passenger_schedules. One row per schedule entry.
class SchedulesCache extends Table {
  TextColumn get id => text()();
  TextColumn get jobId => text()();
  TextColumn get passengerId => text()();
  TextColumn get weekday => text()();
  TextColumn get direction => text()();
  TextColumn get pickupAddress => text()();
  TextColumn get pickupPostcode => text().nullable()();
  RealColumn get pickupLatitude => real().nullable()();
  RealColumn get pickupLongitude => real().nullable()();
  TextColumn get pickupTime => text()();
  TextColumn get dropoffAddress => text()();
  TextColumn get dropoffPostcode => text().nullable()();
  RealColumn get dropoffLatitude => real().nullable()();
  RealColumn get dropoffLongitude => real().nullable()();
  TextColumn get dropoffTime => text().nullable()();
  TextColumn get exceptionDate => text().nullable()();
  TextColumn get exceptionType => text().nullable()();
  TextColumn get notes => text().nullable()();
  IntColumn get stopOrder => integer().nullable()();
  DateTimeColumn get cachedAt => dateTime().withDefault(currentDateAndTime)();

  @override
  Set<Column> get primaryKey => {id};
}

/// Mirrors passenger profile columns used by JobService.
class PassengersCache extends Table {
  TextColumn get id => text()();
  TextColumn get firstName => text()();
  TextColumn get surname => text()();
  TextColumn get contactNumber1 => text().nullable()();
  TextColumn get educationalSiteAddress => text().nullable()();
  TextColumn get educationalSitePostcode => text().nullable()();
  RealColumn get educationalSiteLatitude => real().nullable()();
  RealColumn get educationalSiteLongitude => real().nullable()();
  TextColumn get educationalSiteDropoffTime => text().nullable()();
  BoolColumn get wheelchairRequired =>
      boolean().withDefault(const Constant(false))();
  BoolColumn get harnessRequired =>
      boolean().withDefault(const Constant(false))();
  DateTimeColumn get cachedAt => dateTime().withDefault(currentDateAndTime)();

  @override
  Set<Column> get primaryKey => {id};
}

/// Mirrors the vehicle row assigned to this driver.
class VehiclesCache extends Table {
  TextColumn get id => text()();
  TextColumn get companyId => text()();
  TextColumn get name => text().nullable()();
  TextColumn get make => text().nullable()();
  TextColumn get model => text().nullable()();
  TextColumn get taxiLicensePlateNumber => text()();
  TextColumn get yearOfFirstRegistration => text().nullable()();
  DateTimeColumn get cachedAt => dateTime().withDefault(currentDateAndTime)();

  @override
  Set<Column> get primaryKey => {id};
}

// ─────────────────────────────────────────────────────────────────────────────
// WRITE TABLES
// Source of truth for driver actions, both online and offline.
// JobProvider reads from these, never directly from Supabase responses.
// ─────────────────────────────────────────────────────────────────────────────

/// Local representation of a job_sessions row.
///
/// [localId]  — uuid generated locally (used as FK in passengers_local).
/// [serverId] — null until SyncEngine creates the real row on Supabase and
///              patches this column. All sync_queue ops carry localId;
///              SyncEngine rewrites them to serverId before executing.
/// [isSynced] — true once the Supabase row exists and serverId is populated.
class SessionsLocal extends Table {
  TextColumn get localId => text()();
  TextColumn get serverId => text().nullable()(); // null = not yet on server
  TextColumn get jobId => text()(); // FK → jobs_cache.id
  TextColumn get sessionDate => text()(); // 'YYYY-MM-DD'
  TextColumn get direction => text()();
  TextColumn get status => text().withDefault(const Constant('active'))();
  TextColumn get driverId => text()();
  DateTimeColumn get startedAt => dateTime().withDefault(currentDateAndTime)();
  DateTimeColumn get completedAt => dateTime().nullable()();
  TextColumn get note => text().nullable()();
  BoolColumn get isSynced => boolean().withDefault(const Constant(false))();
  DateTimeColumn get createdAt => dateTime().withDefault(currentDateAndTime)();
  DateTimeColumn get updatedAt => dateTime().withDefault(currentDateAndTime)();

  @override
  Set<Column> get primaryKey => {localId};
}

/// Local representation of job_session_passengers rows.
///
/// [localSessionId] — always the SessionsLocal.localId (never the server ID).
///                   SyncEngine resolves this to the real server session ID.
/// [serverId]       — the real job_session_passengers.id once synced.
class PassengersLocal extends Table {
  TextColumn get localId => text()();
  TextColumn get serverId => text().nullable()();
  TextColumn get localSessionId => text()(); // FK → sessions_local.localId
  TextColumn get passengerId => text()();
  IntColumn get stopOrder => integer()();
  TextColumn get status => text().withDefault(const Constant('pending'))();
  TextColumn get pickupAddress => text()();
  TextColumn get pickupPostcode => text().nullable()();
  RealColumn get pickupLatitude => real().nullable()();
  RealColumn get pickupLongitude => real().nullable()();
  TextColumn get dropoffAddress => text()();
  TextColumn get dropoffPostcode => text().nullable()();
  DateTimeColumn get pickedUpAt => dateTime().nullable()();
  DateTimeColumn get droppedOffAt => dateTime().nullable()();
  TextColumn get notes => text().nullable()();
  BoolColumn get isSynced => boolean().withDefault(const Constant(false))();
  DateTimeColumn get createdAt => dateTime().withDefault(currentDateAndTime)();
  DateTimeColumn get updatedAt => dateTime().withDefault(currentDateAndTime)();

  @override
  Set<Column> get primaryKey => {localId};
}

/// Local checklist state. One row per driver per calendar day.
///
/// [checksJson] — JSON-encoded Map<String, String> of column → 'pass'/'fail'.
/// [isLocked]   — mirrors VehicleSafetyCheckToday.isReadOnlyLocked.
///               True when all items pass. Survives app kill before sync.
/// [serverId]   — null until save_checklist op completes.
class ChecklistLocal extends Table {
  TextColumn get id => text()();
  TextColumn get driverId => text()();
  TextColumn get vehicleId => text()();
  TextColumn get vehicleCompanyId => text()();
  TextColumn get sessionDate => text()(); // 'YYYY-MM-DD'
  TextColumn get checksJson => text()(); // JSON Map<String,String>
  TextColumn get status => text()(); // 'completed' | 'incomplete'
  BoolColumn get isLocked => boolean().withDefault(const Constant(false))();
  TextColumn get serverId => text().nullable()();
  BoolColumn get isSynced => boolean().withDefault(const Constant(false))();
  DateTimeColumn get createdAt => dateTime().withDefault(currentDateAndTime)();
  DateTimeColumn get updatedAt => dateTime().withDefault(currentDateAndTime)();

  @override
  Set<Column> get primaryKey => {id};
}

/// Ordered log of pending Supabase mutations.
///
/// SyncEngine reads these in [createdAt] ASC order and replays them.
/// [opType] values: start_session | pickup_status | extended_wait |
///                  dropoff_status | dropoff_status_bulk | complete_job |
///                  save_checklist
/// [payloadJson] is a JSON blob whose shape depends on opType — see
/// SyncEngine for each payload contract.
/// [retryCount] is incremented on transient failure; op is abandoned at 5.
class SyncQueue extends Table {
  TextColumn get id => text()();
  TextColumn get opType => text()();
  TextColumn get payloadJson => text()();
  TextColumn get status => text().withDefault(const Constant('pending'))();
  IntColumn get retryCount => integer().withDefault(const Constant(0))();
  TextColumn get lastError => text().nullable()();
  DateTimeColumn get createdAt => dateTime().withDefault(currentDateAndTime)();
  DateTimeColumn get updatedAt => dateTime().withDefault(currentDateAndTime)();

  @override
  Set<Column> get primaryKey => {id};
}

// ─────────────────────────────────────────────────────────────────────────────
// Database
// ─────────────────────────────────────────────────────────────────────────────

@DriftDatabase(
  tables: [
    JobsCache,
    SchedulesCache,
    PassengersCache,
    VehiclesCache,
    SessionsLocal,
    PassengersLocal,
    ChecklistLocal,
    SyncQueue,
  ],
)
class AppDatabase extends _$AppDatabase {
  AppDatabase() : super(_openConnection());

  /// Bump this whenever you add/change a table.
  @override
  int get schemaVersion => 3;

  @override
  MigrationStrategy get migration => MigrationStrategy(
    onCreate: (m) => m.createAll(),
    onUpgrade: (m, from, to) async {
      if (from < 3) {
        await m.addColumn(sessionsLocal, sessionsLocal.note);
      }
    },
  );
}

LazyDatabase _openConnection() {
  return LazyDatabase(() async {
    final dir = await getApplicationDocumentsDirectory();
    final file = File(p.join(dir.path, 'ride_roaster.db'));
    return NativeDatabase(file, logStatements: false);
  });
}
