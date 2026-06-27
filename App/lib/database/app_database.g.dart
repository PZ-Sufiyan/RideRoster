// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'app_database.dart';

// ignore_for_file: type=lint
class $JobsCacheTable extends JobsCache
    with TableInfo<$JobsCacheTable, JobsCacheData> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $JobsCacheTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
    'id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _jobNameMeta = const VerificationMeta(
    'jobName',
  );
  @override
  late final GeneratedColumn<String> jobName = GeneratedColumn<String>(
    'job_name',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _internalJobIdMeta = const VerificationMeta(
    'internalJobId',
  );
  @override
  late final GeneratedColumn<String> internalJobId = GeneratedColumn<String>(
    'internal_job_id',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _assignedDriverIdMeta = const VerificationMeta(
    'assignedDriverId',
  );
  @override
  late final GeneratedColumn<String> assignedDriverId = GeneratedColumn<String>(
    'assigned_driver_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _assignedPaIdMeta = const VerificationMeta(
    'assignedPaId',
  );
  @override
  late final GeneratedColumn<String> assignedPaId = GeneratedColumn<String>(
    'assigned_pa_id',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _driverNameMeta = const VerificationMeta(
    'driverName',
  );
  @override
  late final GeneratedColumn<String> driverName = GeneratedColumn<String>(
    'driver_name',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _hasOutboundMeta = const VerificationMeta(
    'hasOutbound',
  );
  @override
  late final GeneratedColumn<bool> hasOutbound = GeneratedColumn<bool>(
    'has_outbound',
    aliasedName,
    false,
    type: DriftSqlType.bool,
    requiredDuringInsert: false,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'CHECK ("has_outbound" IN (0, 1))',
    ),
    defaultValue: const Constant(true),
  );
  static const VerificationMeta _hasInboundMeta = const VerificationMeta(
    'hasInbound',
  );
  @override
  late final GeneratedColumn<bool> hasInbound = GeneratedColumn<bool>(
    'has_inbound',
    aliasedName,
    false,
    type: DriftSqlType.bool,
    requiredDuringInsert: false,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'CHECK ("has_inbound" IN (0, 1))',
    ),
    defaultValue: const Constant(true),
  );
  static const VerificationMeta _morningStartTimeMeta = const VerificationMeta(
    'morningStartTime',
  );
  @override
  late final GeneratedColumn<String> morningStartTime = GeneratedColumn<String>(
    'morning_start_time',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _morningEndTimeMeta = const VerificationMeta(
    'morningEndTime',
  );
  @override
  late final GeneratedColumn<String> morningEndTime = GeneratedColumn<String>(
    'morning_end_time',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _eveningStartTimeMeta = const VerificationMeta(
    'eveningStartTime',
  );
  @override
  late final GeneratedColumn<String> eveningStartTime = GeneratedColumn<String>(
    'evening_start_time',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _semesterStartMeta = const VerificationMeta(
    'semesterStart',
  );
  @override
  late final GeneratedColumn<String> semesterStart = GeneratedColumn<String>(
    'semester_start',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _semesterEndMeta = const VerificationMeta(
    'semesterEnd',
  );
  @override
  late final GeneratedColumn<String> semesterEnd = GeneratedColumn<String>(
    'semester_end',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _statusMeta = const VerificationMeta('status');
  @override
  late final GeneratedColumn<String> status = GeneratedColumn<String>(
    'status',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _driverApprovalStatusMeta =
      const VerificationMeta('driverApprovalStatus');
  @override
  late final GeneratedColumn<String> driverApprovalStatus =
      GeneratedColumn<String>(
        'driver_approval_status',
        aliasedName,
        true,
        type: DriftSqlType.string,
        requiredDuringInsert: false,
      );
  static const VerificationMeta _cachedAtMeta = const VerificationMeta(
    'cachedAt',
  );
  @override
  late final GeneratedColumn<DateTime> cachedAt = GeneratedColumn<DateTime>(
    'cached_at',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: false,
    defaultValue: currentDateAndTime,
  );
  @override
  List<GeneratedColumn> get $columns => [
    id,
    jobName,
    internalJobId,
    assignedDriverId,
    assignedPaId,
    driverName,
    hasOutbound,
    hasInbound,
    morningStartTime,
    morningEndTime,
    eveningStartTime,
    semesterStart,
    semesterEnd,
    status,
    driverApprovalStatus,
    cachedAt,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'jobs_cache';
  @override
  VerificationContext validateIntegrity(
    Insertable<JobsCacheData> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('job_name')) {
      context.handle(
        _jobNameMeta,
        jobName.isAcceptableOrUnknown(data['job_name']!, _jobNameMeta),
      );
    } else if (isInserting) {
      context.missing(_jobNameMeta);
    }
    if (data.containsKey('internal_job_id')) {
      context.handle(
        _internalJobIdMeta,
        internalJobId.isAcceptableOrUnknown(
          data['internal_job_id']!,
          _internalJobIdMeta,
        ),
      );
    }
    if (data.containsKey('assigned_driver_id')) {
      context.handle(
        _assignedDriverIdMeta,
        assignedDriverId.isAcceptableOrUnknown(
          data['assigned_driver_id']!,
          _assignedDriverIdMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_assignedDriverIdMeta);
    }
    if (data.containsKey('assigned_pa_id')) {
      context.handle(
        _assignedPaIdMeta,
        assignedPaId.isAcceptableOrUnknown(
          data['assigned_pa_id']!,
          _assignedPaIdMeta,
        ),
      );
    }
    if (data.containsKey('driver_name')) {
      context.handle(
        _driverNameMeta,
        driverName.isAcceptableOrUnknown(data['driver_name']!, _driverNameMeta),
      );
    }
    if (data.containsKey('has_outbound')) {
      context.handle(
        _hasOutboundMeta,
        hasOutbound.isAcceptableOrUnknown(
          data['has_outbound']!,
          _hasOutboundMeta,
        ),
      );
    }
    if (data.containsKey('has_inbound')) {
      context.handle(
        _hasInboundMeta,
        hasInbound.isAcceptableOrUnknown(data['has_inbound']!, _hasInboundMeta),
      );
    }
    if (data.containsKey('morning_start_time')) {
      context.handle(
        _morningStartTimeMeta,
        morningStartTime.isAcceptableOrUnknown(
          data['morning_start_time']!,
          _morningStartTimeMeta,
        ),
      );
    }
    if (data.containsKey('morning_end_time')) {
      context.handle(
        _morningEndTimeMeta,
        morningEndTime.isAcceptableOrUnknown(
          data['morning_end_time']!,
          _morningEndTimeMeta,
        ),
      );
    }
    if (data.containsKey('evening_start_time')) {
      context.handle(
        _eveningStartTimeMeta,
        eveningStartTime.isAcceptableOrUnknown(
          data['evening_start_time']!,
          _eveningStartTimeMeta,
        ),
      );
    }
    if (data.containsKey('semester_start')) {
      context.handle(
        _semesterStartMeta,
        semesterStart.isAcceptableOrUnknown(
          data['semester_start']!,
          _semesterStartMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_semesterStartMeta);
    }
    if (data.containsKey('semester_end')) {
      context.handle(
        _semesterEndMeta,
        semesterEnd.isAcceptableOrUnknown(
          data['semester_end']!,
          _semesterEndMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_semesterEndMeta);
    }
    if (data.containsKey('status')) {
      context.handle(
        _statusMeta,
        status.isAcceptableOrUnknown(data['status']!, _statusMeta),
      );
    } else if (isInserting) {
      context.missing(_statusMeta);
    }
    if (data.containsKey('driver_approval_status')) {
      context.handle(
        _driverApprovalStatusMeta,
        driverApprovalStatus.isAcceptableOrUnknown(
          data['driver_approval_status']!,
          _driverApprovalStatusMeta,
        ),
      );
    }
    if (data.containsKey('cached_at')) {
      context.handle(
        _cachedAtMeta,
        cachedAt.isAcceptableOrUnknown(data['cached_at']!, _cachedAtMeta),
      );
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  JobsCacheData map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return JobsCacheData(
      id: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}id'],
      )!,
      jobName: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}job_name'],
      )!,
      internalJobId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}internal_job_id'],
      ),
      assignedDriverId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}assigned_driver_id'],
      )!,
      assignedPaId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}assigned_pa_id'],
      ),
      driverName: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}driver_name'],
      ),
      hasOutbound: attachedDatabase.typeMapping.read(
        DriftSqlType.bool,
        data['${effectivePrefix}has_outbound'],
      )!,
      hasInbound: attachedDatabase.typeMapping.read(
        DriftSqlType.bool,
        data['${effectivePrefix}has_inbound'],
      )!,
      morningStartTime: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}morning_start_time'],
      ),
      morningEndTime: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}morning_end_time'],
      ),
      eveningStartTime: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}evening_start_time'],
      ),
      semesterStart: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}semester_start'],
      )!,
      semesterEnd: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}semester_end'],
      )!,
      status: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}status'],
      )!,
      driverApprovalStatus: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}driver_approval_status'],
      ),
      cachedAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}cached_at'],
      )!,
    );
  }

  @override
  $JobsCacheTable createAlias(String alias) {
    return $JobsCacheTable(attachedDatabase, alias);
  }
}

class JobsCacheData extends DataClass implements Insertable<JobsCacheData> {
  final String id;
  final String jobName;
  final String? internalJobId;
  final String assignedDriverId;
  final String? assignedPaId;
  final String? driverName;
  final bool hasOutbound;
  final bool hasInbound;
  final String? morningStartTime;
  final String? morningEndTime;
  final String? eveningStartTime;
  final String semesterStart;
  final String semesterEnd;
  final String status;
  final String? driverApprovalStatus;
  final DateTime cachedAt;
  const JobsCacheData({
    required this.id,
    required this.jobName,
    this.internalJobId,
    required this.assignedDriverId,
    this.assignedPaId,
    this.driverName,
    required this.hasOutbound,
    required this.hasInbound,
    this.morningStartTime,
    this.morningEndTime,
    this.eveningStartTime,
    required this.semesterStart,
    required this.semesterEnd,
    required this.status,
    this.driverApprovalStatus,
    required this.cachedAt,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['job_name'] = Variable<String>(jobName);
    if (!nullToAbsent || internalJobId != null) {
      map['internal_job_id'] = Variable<String>(internalJobId);
    }
    map['assigned_driver_id'] = Variable<String>(assignedDriverId);
    if (!nullToAbsent || assignedPaId != null) {
      map['assigned_pa_id'] = Variable<String>(assignedPaId);
    }
    if (!nullToAbsent || driverName != null) {
      map['driver_name'] = Variable<String>(driverName);
    }
    map['has_outbound'] = Variable<bool>(hasOutbound);
    map['has_inbound'] = Variable<bool>(hasInbound);
    if (!nullToAbsent || morningStartTime != null) {
      map['morning_start_time'] = Variable<String>(morningStartTime);
    }
    if (!nullToAbsent || morningEndTime != null) {
      map['morning_end_time'] = Variable<String>(morningEndTime);
    }
    if (!nullToAbsent || eveningStartTime != null) {
      map['evening_start_time'] = Variable<String>(eveningStartTime);
    }
    map['semester_start'] = Variable<String>(semesterStart);
    map['semester_end'] = Variable<String>(semesterEnd);
    map['status'] = Variable<String>(status);
    if (!nullToAbsent || driverApprovalStatus != null) {
      map['driver_approval_status'] = Variable<String>(driverApprovalStatus);
    }
    map['cached_at'] = Variable<DateTime>(cachedAt);
    return map;
  }

  JobsCacheCompanion toCompanion(bool nullToAbsent) {
    return JobsCacheCompanion(
      id: Value(id),
      jobName: Value(jobName),
      internalJobId: internalJobId == null && nullToAbsent
          ? const Value.absent()
          : Value(internalJobId),
      assignedDriverId: Value(assignedDriverId),
      assignedPaId: assignedPaId == null && nullToAbsent
          ? const Value.absent()
          : Value(assignedPaId),
      driverName: driverName == null && nullToAbsent
          ? const Value.absent()
          : Value(driverName),
      hasOutbound: Value(hasOutbound),
      hasInbound: Value(hasInbound),
      morningStartTime: morningStartTime == null && nullToAbsent
          ? const Value.absent()
          : Value(morningStartTime),
      morningEndTime: morningEndTime == null && nullToAbsent
          ? const Value.absent()
          : Value(morningEndTime),
      eveningStartTime: eveningStartTime == null && nullToAbsent
          ? const Value.absent()
          : Value(eveningStartTime),
      semesterStart: Value(semesterStart),
      semesterEnd: Value(semesterEnd),
      status: Value(status),
      driverApprovalStatus: driverApprovalStatus == null && nullToAbsent
          ? const Value.absent()
          : Value(driverApprovalStatus),
      cachedAt: Value(cachedAt),
    );
  }

  factory JobsCacheData.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return JobsCacheData(
      id: serializer.fromJson<String>(json['id']),
      jobName: serializer.fromJson<String>(json['jobName']),
      internalJobId: serializer.fromJson<String?>(json['internalJobId']),
      assignedDriverId: serializer.fromJson<String>(json['assignedDriverId']),
      assignedPaId: serializer.fromJson<String?>(json['assignedPaId']),
      driverName: serializer.fromJson<String?>(json['driverName']),
      hasOutbound: serializer.fromJson<bool>(json['hasOutbound']),
      hasInbound: serializer.fromJson<bool>(json['hasInbound']),
      morningStartTime: serializer.fromJson<String?>(json['morningStartTime']),
      morningEndTime: serializer.fromJson<String?>(json['morningEndTime']),
      eveningStartTime: serializer.fromJson<String?>(json['eveningStartTime']),
      semesterStart: serializer.fromJson<String>(json['semesterStart']),
      semesterEnd: serializer.fromJson<String>(json['semesterEnd']),
      status: serializer.fromJson<String>(json['status']),
      driverApprovalStatus: serializer.fromJson<String?>(
        json['driverApprovalStatus'],
      ),
      cachedAt: serializer.fromJson<DateTime>(json['cachedAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'jobName': serializer.toJson<String>(jobName),
      'internalJobId': serializer.toJson<String?>(internalJobId),
      'assignedDriverId': serializer.toJson<String>(assignedDriverId),
      'assignedPaId': serializer.toJson<String?>(assignedPaId),
      'driverName': serializer.toJson<String?>(driverName),
      'hasOutbound': serializer.toJson<bool>(hasOutbound),
      'hasInbound': serializer.toJson<bool>(hasInbound),
      'morningStartTime': serializer.toJson<String?>(morningStartTime),
      'morningEndTime': serializer.toJson<String?>(morningEndTime),
      'eveningStartTime': serializer.toJson<String?>(eveningStartTime),
      'semesterStart': serializer.toJson<String>(semesterStart),
      'semesterEnd': serializer.toJson<String>(semesterEnd),
      'status': serializer.toJson<String>(status),
      'driverApprovalStatus': serializer.toJson<String?>(driverApprovalStatus),
      'cachedAt': serializer.toJson<DateTime>(cachedAt),
    };
  }

  JobsCacheData copyWith({
    String? id,
    String? jobName,
    Value<String?> internalJobId = const Value.absent(),
    String? assignedDriverId,
    Value<String?> assignedPaId = const Value.absent(),
    Value<String?> driverName = const Value.absent(),
    bool? hasOutbound,
    bool? hasInbound,
    Value<String?> morningStartTime = const Value.absent(),
    Value<String?> morningEndTime = const Value.absent(),
    Value<String?> eveningStartTime = const Value.absent(),
    String? semesterStart,
    String? semesterEnd,
    String? status,
    Value<String?> driverApprovalStatus = const Value.absent(),
    DateTime? cachedAt,
  }) => JobsCacheData(
    id: id ?? this.id,
    jobName: jobName ?? this.jobName,
    internalJobId: internalJobId.present
        ? internalJobId.value
        : this.internalJobId,
    assignedDriverId: assignedDriverId ?? this.assignedDriverId,
    assignedPaId: assignedPaId.present ? assignedPaId.value : this.assignedPaId,
    driverName: driverName.present ? driverName.value : this.driverName,
    hasOutbound: hasOutbound ?? this.hasOutbound,
    hasInbound: hasInbound ?? this.hasInbound,
    morningStartTime: morningStartTime.present
        ? morningStartTime.value
        : this.morningStartTime,
    morningEndTime: morningEndTime.present
        ? morningEndTime.value
        : this.morningEndTime,
    eveningStartTime: eveningStartTime.present
        ? eveningStartTime.value
        : this.eveningStartTime,
    semesterStart: semesterStart ?? this.semesterStart,
    semesterEnd: semesterEnd ?? this.semesterEnd,
    status: status ?? this.status,
    driverApprovalStatus: driverApprovalStatus.present
        ? driverApprovalStatus.value
        : this.driverApprovalStatus,
    cachedAt: cachedAt ?? this.cachedAt,
  );
  JobsCacheData copyWithCompanion(JobsCacheCompanion data) {
    return JobsCacheData(
      id: data.id.present ? data.id.value : this.id,
      jobName: data.jobName.present ? data.jobName.value : this.jobName,
      internalJobId: data.internalJobId.present
          ? data.internalJobId.value
          : this.internalJobId,
      assignedDriverId: data.assignedDriverId.present
          ? data.assignedDriverId.value
          : this.assignedDriverId,
      assignedPaId: data.assignedPaId.present
          ? data.assignedPaId.value
          : this.assignedPaId,
      driverName: data.driverName.present
          ? data.driverName.value
          : this.driverName,
      hasOutbound: data.hasOutbound.present
          ? data.hasOutbound.value
          : this.hasOutbound,
      hasInbound: data.hasInbound.present
          ? data.hasInbound.value
          : this.hasInbound,
      morningStartTime: data.morningStartTime.present
          ? data.morningStartTime.value
          : this.morningStartTime,
      morningEndTime: data.morningEndTime.present
          ? data.morningEndTime.value
          : this.morningEndTime,
      eveningStartTime: data.eveningStartTime.present
          ? data.eveningStartTime.value
          : this.eveningStartTime,
      semesterStart: data.semesterStart.present
          ? data.semesterStart.value
          : this.semesterStart,
      semesterEnd: data.semesterEnd.present
          ? data.semesterEnd.value
          : this.semesterEnd,
      status: data.status.present ? data.status.value : this.status,
      driverApprovalStatus: data.driverApprovalStatus.present
          ? data.driverApprovalStatus.value
          : this.driverApprovalStatus,
      cachedAt: data.cachedAt.present ? data.cachedAt.value : this.cachedAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('JobsCacheData(')
          ..write('id: $id, ')
          ..write('jobName: $jobName, ')
          ..write('internalJobId: $internalJobId, ')
          ..write('assignedDriverId: $assignedDriverId, ')
          ..write('assignedPaId: $assignedPaId, ')
          ..write('driverName: $driverName, ')
          ..write('hasOutbound: $hasOutbound, ')
          ..write('hasInbound: $hasInbound, ')
          ..write('morningStartTime: $morningStartTime, ')
          ..write('morningEndTime: $morningEndTime, ')
          ..write('eveningStartTime: $eveningStartTime, ')
          ..write('semesterStart: $semesterStart, ')
          ..write('semesterEnd: $semesterEnd, ')
          ..write('status: $status, ')
          ..write('driverApprovalStatus: $driverApprovalStatus, ')
          ..write('cachedAt: $cachedAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
    id,
    jobName,
    internalJobId,
    assignedDriverId,
    assignedPaId,
    driverName,
    hasOutbound,
    hasInbound,
    morningStartTime,
    morningEndTime,
    eveningStartTime,
    semesterStart,
    semesterEnd,
    status,
    driverApprovalStatus,
    cachedAt,
  );
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is JobsCacheData &&
          other.id == this.id &&
          other.jobName == this.jobName &&
          other.internalJobId == this.internalJobId &&
          other.assignedDriverId == this.assignedDriverId &&
          other.assignedPaId == this.assignedPaId &&
          other.driverName == this.driverName &&
          other.hasOutbound == this.hasOutbound &&
          other.hasInbound == this.hasInbound &&
          other.morningStartTime == this.morningStartTime &&
          other.morningEndTime == this.morningEndTime &&
          other.eveningStartTime == this.eveningStartTime &&
          other.semesterStart == this.semesterStart &&
          other.semesterEnd == this.semesterEnd &&
          other.status == this.status &&
          other.driverApprovalStatus == this.driverApprovalStatus &&
          other.cachedAt == this.cachedAt);
}

class JobsCacheCompanion extends UpdateCompanion<JobsCacheData> {
  final Value<String> id;
  final Value<String> jobName;
  final Value<String?> internalJobId;
  final Value<String> assignedDriverId;
  final Value<String?> assignedPaId;
  final Value<String?> driverName;
  final Value<bool> hasOutbound;
  final Value<bool> hasInbound;
  final Value<String?> morningStartTime;
  final Value<String?> morningEndTime;
  final Value<String?> eveningStartTime;
  final Value<String> semesterStart;
  final Value<String> semesterEnd;
  final Value<String> status;
  final Value<String?> driverApprovalStatus;
  final Value<DateTime> cachedAt;
  final Value<int> rowid;
  const JobsCacheCompanion({
    this.id = const Value.absent(),
    this.jobName = const Value.absent(),
    this.internalJobId = const Value.absent(),
    this.assignedDriverId = const Value.absent(),
    this.assignedPaId = const Value.absent(),
    this.driverName = const Value.absent(),
    this.hasOutbound = const Value.absent(),
    this.hasInbound = const Value.absent(),
    this.morningStartTime = const Value.absent(),
    this.morningEndTime = const Value.absent(),
    this.eveningStartTime = const Value.absent(),
    this.semesterStart = const Value.absent(),
    this.semesterEnd = const Value.absent(),
    this.status = const Value.absent(),
    this.driverApprovalStatus = const Value.absent(),
    this.cachedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  JobsCacheCompanion.insert({
    required String id,
    required String jobName,
    this.internalJobId = const Value.absent(),
    required String assignedDriverId,
    this.assignedPaId = const Value.absent(),
    this.driverName = const Value.absent(),
    this.hasOutbound = const Value.absent(),
    this.hasInbound = const Value.absent(),
    this.morningStartTime = const Value.absent(),
    this.morningEndTime = const Value.absent(),
    this.eveningStartTime = const Value.absent(),
    required String semesterStart,
    required String semesterEnd,
    required String status,
    this.driverApprovalStatus = const Value.absent(),
    this.cachedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  }) : id = Value(id),
       jobName = Value(jobName),
       assignedDriverId = Value(assignedDriverId),
       semesterStart = Value(semesterStart),
       semesterEnd = Value(semesterEnd),
       status = Value(status);
  static Insertable<JobsCacheData> custom({
    Expression<String>? id,
    Expression<String>? jobName,
    Expression<String>? internalJobId,
    Expression<String>? assignedDriverId,
    Expression<String>? assignedPaId,
    Expression<String>? driverName,
    Expression<bool>? hasOutbound,
    Expression<bool>? hasInbound,
    Expression<String>? morningStartTime,
    Expression<String>? morningEndTime,
    Expression<String>? eveningStartTime,
    Expression<String>? semesterStart,
    Expression<String>? semesterEnd,
    Expression<String>? status,
    Expression<String>? driverApprovalStatus,
    Expression<DateTime>? cachedAt,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (jobName != null) 'job_name': jobName,
      if (internalJobId != null) 'internal_job_id': internalJobId,
      if (assignedDriverId != null) 'assigned_driver_id': assignedDriverId,
      if (assignedPaId != null) 'assigned_pa_id': assignedPaId,
      if (driverName != null) 'driver_name': driverName,
      if (hasOutbound != null) 'has_outbound': hasOutbound,
      if (hasInbound != null) 'has_inbound': hasInbound,
      if (morningStartTime != null) 'morning_start_time': morningStartTime,
      if (morningEndTime != null) 'morning_end_time': morningEndTime,
      if (eveningStartTime != null) 'evening_start_time': eveningStartTime,
      if (semesterStart != null) 'semester_start': semesterStart,
      if (semesterEnd != null) 'semester_end': semesterEnd,
      if (status != null) 'status': status,
      if (driverApprovalStatus != null)
        'driver_approval_status': driverApprovalStatus,
      if (cachedAt != null) 'cached_at': cachedAt,
      if (rowid != null) 'rowid': rowid,
    });
  }

  JobsCacheCompanion copyWith({
    Value<String>? id,
    Value<String>? jobName,
    Value<String?>? internalJobId,
    Value<String>? assignedDriverId,
    Value<String?>? assignedPaId,
    Value<String?>? driverName,
    Value<bool>? hasOutbound,
    Value<bool>? hasInbound,
    Value<String?>? morningStartTime,
    Value<String?>? morningEndTime,
    Value<String?>? eveningStartTime,
    Value<String>? semesterStart,
    Value<String>? semesterEnd,
    Value<String>? status,
    Value<String?>? driverApprovalStatus,
    Value<DateTime>? cachedAt,
    Value<int>? rowid,
  }) {
    return JobsCacheCompanion(
      id: id ?? this.id,
      jobName: jobName ?? this.jobName,
      internalJobId: internalJobId ?? this.internalJobId,
      assignedDriverId: assignedDriverId ?? this.assignedDriverId,
      assignedPaId: assignedPaId ?? this.assignedPaId,
      driverName: driverName ?? this.driverName,
      hasOutbound: hasOutbound ?? this.hasOutbound,
      hasInbound: hasInbound ?? this.hasInbound,
      morningStartTime: morningStartTime ?? this.morningStartTime,
      morningEndTime: morningEndTime ?? this.morningEndTime,
      eveningStartTime: eveningStartTime ?? this.eveningStartTime,
      semesterStart: semesterStart ?? this.semesterStart,
      semesterEnd: semesterEnd ?? this.semesterEnd,
      status: status ?? this.status,
      driverApprovalStatus: driverApprovalStatus ?? this.driverApprovalStatus,
      cachedAt: cachedAt ?? this.cachedAt,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (jobName.present) {
      map['job_name'] = Variable<String>(jobName.value);
    }
    if (internalJobId.present) {
      map['internal_job_id'] = Variable<String>(internalJobId.value);
    }
    if (assignedDriverId.present) {
      map['assigned_driver_id'] = Variable<String>(assignedDriverId.value);
    }
    if (assignedPaId.present) {
      map['assigned_pa_id'] = Variable<String>(assignedPaId.value);
    }
    if (driverName.present) {
      map['driver_name'] = Variable<String>(driverName.value);
    }
    if (hasOutbound.present) {
      map['has_outbound'] = Variable<bool>(hasOutbound.value);
    }
    if (hasInbound.present) {
      map['has_inbound'] = Variable<bool>(hasInbound.value);
    }
    if (morningStartTime.present) {
      map['morning_start_time'] = Variable<String>(morningStartTime.value);
    }
    if (morningEndTime.present) {
      map['morning_end_time'] = Variable<String>(morningEndTime.value);
    }
    if (eveningStartTime.present) {
      map['evening_start_time'] = Variable<String>(eveningStartTime.value);
    }
    if (semesterStart.present) {
      map['semester_start'] = Variable<String>(semesterStart.value);
    }
    if (semesterEnd.present) {
      map['semester_end'] = Variable<String>(semesterEnd.value);
    }
    if (status.present) {
      map['status'] = Variable<String>(status.value);
    }
    if (driverApprovalStatus.present) {
      map['driver_approval_status'] = Variable<String>(
        driverApprovalStatus.value,
      );
    }
    if (cachedAt.present) {
      map['cached_at'] = Variable<DateTime>(cachedAt.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('JobsCacheCompanion(')
          ..write('id: $id, ')
          ..write('jobName: $jobName, ')
          ..write('internalJobId: $internalJobId, ')
          ..write('assignedDriverId: $assignedDriverId, ')
          ..write('assignedPaId: $assignedPaId, ')
          ..write('driverName: $driverName, ')
          ..write('hasOutbound: $hasOutbound, ')
          ..write('hasInbound: $hasInbound, ')
          ..write('morningStartTime: $morningStartTime, ')
          ..write('morningEndTime: $morningEndTime, ')
          ..write('eveningStartTime: $eveningStartTime, ')
          ..write('semesterStart: $semesterStart, ')
          ..write('semesterEnd: $semesterEnd, ')
          ..write('status: $status, ')
          ..write('driverApprovalStatus: $driverApprovalStatus, ')
          ..write('cachedAt: $cachedAt, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $SchedulesCacheTable extends SchedulesCache
    with TableInfo<$SchedulesCacheTable, SchedulesCacheData> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $SchedulesCacheTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
    'id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _jobIdMeta = const VerificationMeta('jobId');
  @override
  late final GeneratedColumn<String> jobId = GeneratedColumn<String>(
    'job_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _passengerIdMeta = const VerificationMeta(
    'passengerId',
  );
  @override
  late final GeneratedColumn<String> passengerId = GeneratedColumn<String>(
    'passenger_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _weekdayMeta = const VerificationMeta(
    'weekday',
  );
  @override
  late final GeneratedColumn<String> weekday = GeneratedColumn<String>(
    'weekday',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _directionMeta = const VerificationMeta(
    'direction',
  );
  @override
  late final GeneratedColumn<String> direction = GeneratedColumn<String>(
    'direction',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _pickupAddressMeta = const VerificationMeta(
    'pickupAddress',
  );
  @override
  late final GeneratedColumn<String> pickupAddress = GeneratedColumn<String>(
    'pickup_address',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _pickupPostcodeMeta = const VerificationMeta(
    'pickupPostcode',
  );
  @override
  late final GeneratedColumn<String> pickupPostcode = GeneratedColumn<String>(
    'pickup_postcode',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _pickupLatitudeMeta = const VerificationMeta(
    'pickupLatitude',
  );
  @override
  late final GeneratedColumn<double> pickupLatitude = GeneratedColumn<double>(
    'pickup_latitude',
    aliasedName,
    true,
    type: DriftSqlType.double,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _pickupLongitudeMeta = const VerificationMeta(
    'pickupLongitude',
  );
  @override
  late final GeneratedColumn<double> pickupLongitude = GeneratedColumn<double>(
    'pickup_longitude',
    aliasedName,
    true,
    type: DriftSqlType.double,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _pickupTimeMeta = const VerificationMeta(
    'pickupTime',
  );
  @override
  late final GeneratedColumn<String> pickupTime = GeneratedColumn<String>(
    'pickup_time',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _dropoffAddressMeta = const VerificationMeta(
    'dropoffAddress',
  );
  @override
  late final GeneratedColumn<String> dropoffAddress = GeneratedColumn<String>(
    'dropoff_address',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _dropoffPostcodeMeta = const VerificationMeta(
    'dropoffPostcode',
  );
  @override
  late final GeneratedColumn<String> dropoffPostcode = GeneratedColumn<String>(
    'dropoff_postcode',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _dropoffLatitudeMeta = const VerificationMeta(
    'dropoffLatitude',
  );
  @override
  late final GeneratedColumn<double> dropoffLatitude = GeneratedColumn<double>(
    'dropoff_latitude',
    aliasedName,
    true,
    type: DriftSqlType.double,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _dropoffLongitudeMeta = const VerificationMeta(
    'dropoffLongitude',
  );
  @override
  late final GeneratedColumn<double> dropoffLongitude = GeneratedColumn<double>(
    'dropoff_longitude',
    aliasedName,
    true,
    type: DriftSqlType.double,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _dropoffTimeMeta = const VerificationMeta(
    'dropoffTime',
  );
  @override
  late final GeneratedColumn<String> dropoffTime = GeneratedColumn<String>(
    'dropoff_time',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _exceptionDateMeta = const VerificationMeta(
    'exceptionDate',
  );
  @override
  late final GeneratedColumn<String> exceptionDate = GeneratedColumn<String>(
    'exception_date',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _exceptionTypeMeta = const VerificationMeta(
    'exceptionType',
  );
  @override
  late final GeneratedColumn<String> exceptionType = GeneratedColumn<String>(
    'exception_type',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _notesMeta = const VerificationMeta('notes');
  @override
  late final GeneratedColumn<String> notes = GeneratedColumn<String>(
    'notes',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _stopOrderMeta = const VerificationMeta(
    'stopOrder',
  );
  @override
  late final GeneratedColumn<int> stopOrder = GeneratedColumn<int>(
    'stop_order',
    aliasedName,
    true,
    type: DriftSqlType.int,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _cachedAtMeta = const VerificationMeta(
    'cachedAt',
  );
  @override
  late final GeneratedColumn<DateTime> cachedAt = GeneratedColumn<DateTime>(
    'cached_at',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: false,
    defaultValue: currentDateAndTime,
  );
  @override
  List<GeneratedColumn> get $columns => [
    id,
    jobId,
    passengerId,
    weekday,
    direction,
    pickupAddress,
    pickupPostcode,
    pickupLatitude,
    pickupLongitude,
    pickupTime,
    dropoffAddress,
    dropoffPostcode,
    dropoffLatitude,
    dropoffLongitude,
    dropoffTime,
    exceptionDate,
    exceptionType,
    notes,
    stopOrder,
    cachedAt,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'schedules_cache';
  @override
  VerificationContext validateIntegrity(
    Insertable<SchedulesCacheData> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('job_id')) {
      context.handle(
        _jobIdMeta,
        jobId.isAcceptableOrUnknown(data['job_id']!, _jobIdMeta),
      );
    } else if (isInserting) {
      context.missing(_jobIdMeta);
    }
    if (data.containsKey('passenger_id')) {
      context.handle(
        _passengerIdMeta,
        passengerId.isAcceptableOrUnknown(
          data['passenger_id']!,
          _passengerIdMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_passengerIdMeta);
    }
    if (data.containsKey('weekday')) {
      context.handle(
        _weekdayMeta,
        weekday.isAcceptableOrUnknown(data['weekday']!, _weekdayMeta),
      );
    } else if (isInserting) {
      context.missing(_weekdayMeta);
    }
    if (data.containsKey('direction')) {
      context.handle(
        _directionMeta,
        direction.isAcceptableOrUnknown(data['direction']!, _directionMeta),
      );
    } else if (isInserting) {
      context.missing(_directionMeta);
    }
    if (data.containsKey('pickup_address')) {
      context.handle(
        _pickupAddressMeta,
        pickupAddress.isAcceptableOrUnknown(
          data['pickup_address']!,
          _pickupAddressMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_pickupAddressMeta);
    }
    if (data.containsKey('pickup_postcode')) {
      context.handle(
        _pickupPostcodeMeta,
        pickupPostcode.isAcceptableOrUnknown(
          data['pickup_postcode']!,
          _pickupPostcodeMeta,
        ),
      );
    }
    if (data.containsKey('pickup_latitude')) {
      context.handle(
        _pickupLatitudeMeta,
        pickupLatitude.isAcceptableOrUnknown(
          data['pickup_latitude']!,
          _pickupLatitudeMeta,
        ),
      );
    }
    if (data.containsKey('pickup_longitude')) {
      context.handle(
        _pickupLongitudeMeta,
        pickupLongitude.isAcceptableOrUnknown(
          data['pickup_longitude']!,
          _pickupLongitudeMeta,
        ),
      );
    }
    if (data.containsKey('pickup_time')) {
      context.handle(
        _pickupTimeMeta,
        pickupTime.isAcceptableOrUnknown(data['pickup_time']!, _pickupTimeMeta),
      );
    } else if (isInserting) {
      context.missing(_pickupTimeMeta);
    }
    if (data.containsKey('dropoff_address')) {
      context.handle(
        _dropoffAddressMeta,
        dropoffAddress.isAcceptableOrUnknown(
          data['dropoff_address']!,
          _dropoffAddressMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_dropoffAddressMeta);
    }
    if (data.containsKey('dropoff_postcode')) {
      context.handle(
        _dropoffPostcodeMeta,
        dropoffPostcode.isAcceptableOrUnknown(
          data['dropoff_postcode']!,
          _dropoffPostcodeMeta,
        ),
      );
    }
    if (data.containsKey('dropoff_latitude')) {
      context.handle(
        _dropoffLatitudeMeta,
        dropoffLatitude.isAcceptableOrUnknown(
          data['dropoff_latitude']!,
          _dropoffLatitudeMeta,
        ),
      );
    }
    if (data.containsKey('dropoff_longitude')) {
      context.handle(
        _dropoffLongitudeMeta,
        dropoffLongitude.isAcceptableOrUnknown(
          data['dropoff_longitude']!,
          _dropoffLongitudeMeta,
        ),
      );
    }
    if (data.containsKey('dropoff_time')) {
      context.handle(
        _dropoffTimeMeta,
        dropoffTime.isAcceptableOrUnknown(
          data['dropoff_time']!,
          _dropoffTimeMeta,
        ),
      );
    }
    if (data.containsKey('exception_date')) {
      context.handle(
        _exceptionDateMeta,
        exceptionDate.isAcceptableOrUnknown(
          data['exception_date']!,
          _exceptionDateMeta,
        ),
      );
    }
    if (data.containsKey('exception_type')) {
      context.handle(
        _exceptionTypeMeta,
        exceptionType.isAcceptableOrUnknown(
          data['exception_type']!,
          _exceptionTypeMeta,
        ),
      );
    }
    if (data.containsKey('notes')) {
      context.handle(
        _notesMeta,
        notes.isAcceptableOrUnknown(data['notes']!, _notesMeta),
      );
    }
    if (data.containsKey('stop_order')) {
      context.handle(
        _stopOrderMeta,
        stopOrder.isAcceptableOrUnknown(data['stop_order']!, _stopOrderMeta),
      );
    }
    if (data.containsKey('cached_at')) {
      context.handle(
        _cachedAtMeta,
        cachedAt.isAcceptableOrUnknown(data['cached_at']!, _cachedAtMeta),
      );
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  SchedulesCacheData map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return SchedulesCacheData(
      id: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}id'],
      )!,
      jobId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}job_id'],
      )!,
      passengerId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}passenger_id'],
      )!,
      weekday: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}weekday'],
      )!,
      direction: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}direction'],
      )!,
      pickupAddress: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}pickup_address'],
      )!,
      pickupPostcode: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}pickup_postcode'],
      ),
      pickupLatitude: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}pickup_latitude'],
      ),
      pickupLongitude: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}pickup_longitude'],
      ),
      pickupTime: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}pickup_time'],
      )!,
      dropoffAddress: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}dropoff_address'],
      )!,
      dropoffPostcode: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}dropoff_postcode'],
      ),
      dropoffLatitude: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}dropoff_latitude'],
      ),
      dropoffLongitude: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}dropoff_longitude'],
      ),
      dropoffTime: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}dropoff_time'],
      ),
      exceptionDate: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}exception_date'],
      ),
      exceptionType: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}exception_type'],
      ),
      notes: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}notes'],
      ),
      stopOrder: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}stop_order'],
      ),
      cachedAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}cached_at'],
      )!,
    );
  }

  @override
  $SchedulesCacheTable createAlias(String alias) {
    return $SchedulesCacheTable(attachedDatabase, alias);
  }
}

class SchedulesCacheData extends DataClass
    implements Insertable<SchedulesCacheData> {
  final String id;
  final String jobId;
  final String passengerId;
  final String weekday;
  final String direction;
  final String pickupAddress;
  final String? pickupPostcode;
  final double? pickupLatitude;
  final double? pickupLongitude;
  final String pickupTime;
  final String dropoffAddress;
  final String? dropoffPostcode;
  final double? dropoffLatitude;
  final double? dropoffLongitude;
  final String? dropoffTime;
  final String? exceptionDate;
  final String? exceptionType;
  final String? notes;
  final int? stopOrder;
  final DateTime cachedAt;
  const SchedulesCacheData({
    required this.id,
    required this.jobId,
    required this.passengerId,
    required this.weekday,
    required this.direction,
    required this.pickupAddress,
    this.pickupPostcode,
    this.pickupLatitude,
    this.pickupLongitude,
    required this.pickupTime,
    required this.dropoffAddress,
    this.dropoffPostcode,
    this.dropoffLatitude,
    this.dropoffLongitude,
    this.dropoffTime,
    this.exceptionDate,
    this.exceptionType,
    this.notes,
    this.stopOrder,
    required this.cachedAt,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['job_id'] = Variable<String>(jobId);
    map['passenger_id'] = Variable<String>(passengerId);
    map['weekday'] = Variable<String>(weekday);
    map['direction'] = Variable<String>(direction);
    map['pickup_address'] = Variable<String>(pickupAddress);
    if (!nullToAbsent || pickupPostcode != null) {
      map['pickup_postcode'] = Variable<String>(pickupPostcode);
    }
    if (!nullToAbsent || pickupLatitude != null) {
      map['pickup_latitude'] = Variable<double>(pickupLatitude);
    }
    if (!nullToAbsent || pickupLongitude != null) {
      map['pickup_longitude'] = Variable<double>(pickupLongitude);
    }
    map['pickup_time'] = Variable<String>(pickupTime);
    map['dropoff_address'] = Variable<String>(dropoffAddress);
    if (!nullToAbsent || dropoffPostcode != null) {
      map['dropoff_postcode'] = Variable<String>(dropoffPostcode);
    }
    if (!nullToAbsent || dropoffLatitude != null) {
      map['dropoff_latitude'] = Variable<double>(dropoffLatitude);
    }
    if (!nullToAbsent || dropoffLongitude != null) {
      map['dropoff_longitude'] = Variable<double>(dropoffLongitude);
    }
    if (!nullToAbsent || dropoffTime != null) {
      map['dropoff_time'] = Variable<String>(dropoffTime);
    }
    if (!nullToAbsent || exceptionDate != null) {
      map['exception_date'] = Variable<String>(exceptionDate);
    }
    if (!nullToAbsent || exceptionType != null) {
      map['exception_type'] = Variable<String>(exceptionType);
    }
    if (!nullToAbsent || notes != null) {
      map['notes'] = Variable<String>(notes);
    }
    if (!nullToAbsent || stopOrder != null) {
      map['stop_order'] = Variable<int>(stopOrder);
    }
    map['cached_at'] = Variable<DateTime>(cachedAt);
    return map;
  }

  SchedulesCacheCompanion toCompanion(bool nullToAbsent) {
    return SchedulesCacheCompanion(
      id: Value(id),
      jobId: Value(jobId),
      passengerId: Value(passengerId),
      weekday: Value(weekday),
      direction: Value(direction),
      pickupAddress: Value(pickupAddress),
      pickupPostcode: pickupPostcode == null && nullToAbsent
          ? const Value.absent()
          : Value(pickupPostcode),
      pickupLatitude: pickupLatitude == null && nullToAbsent
          ? const Value.absent()
          : Value(pickupLatitude),
      pickupLongitude: pickupLongitude == null && nullToAbsent
          ? const Value.absent()
          : Value(pickupLongitude),
      pickupTime: Value(pickupTime),
      dropoffAddress: Value(dropoffAddress),
      dropoffPostcode: dropoffPostcode == null && nullToAbsent
          ? const Value.absent()
          : Value(dropoffPostcode),
      dropoffLatitude: dropoffLatitude == null && nullToAbsent
          ? const Value.absent()
          : Value(dropoffLatitude),
      dropoffLongitude: dropoffLongitude == null && nullToAbsent
          ? const Value.absent()
          : Value(dropoffLongitude),
      dropoffTime: dropoffTime == null && nullToAbsent
          ? const Value.absent()
          : Value(dropoffTime),
      exceptionDate: exceptionDate == null && nullToAbsent
          ? const Value.absent()
          : Value(exceptionDate),
      exceptionType: exceptionType == null && nullToAbsent
          ? const Value.absent()
          : Value(exceptionType),
      notes: notes == null && nullToAbsent
          ? const Value.absent()
          : Value(notes),
      stopOrder: stopOrder == null && nullToAbsent
          ? const Value.absent()
          : Value(stopOrder),
      cachedAt: Value(cachedAt),
    );
  }

  factory SchedulesCacheData.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return SchedulesCacheData(
      id: serializer.fromJson<String>(json['id']),
      jobId: serializer.fromJson<String>(json['jobId']),
      passengerId: serializer.fromJson<String>(json['passengerId']),
      weekday: serializer.fromJson<String>(json['weekday']),
      direction: serializer.fromJson<String>(json['direction']),
      pickupAddress: serializer.fromJson<String>(json['pickupAddress']),
      pickupPostcode: serializer.fromJson<String?>(json['pickupPostcode']),
      pickupLatitude: serializer.fromJson<double?>(json['pickupLatitude']),
      pickupLongitude: serializer.fromJson<double?>(json['pickupLongitude']),
      pickupTime: serializer.fromJson<String>(json['pickupTime']),
      dropoffAddress: serializer.fromJson<String>(json['dropoffAddress']),
      dropoffPostcode: serializer.fromJson<String?>(json['dropoffPostcode']),
      dropoffLatitude: serializer.fromJson<double?>(json['dropoffLatitude']),
      dropoffLongitude: serializer.fromJson<double?>(json['dropoffLongitude']),
      dropoffTime: serializer.fromJson<String?>(json['dropoffTime']),
      exceptionDate: serializer.fromJson<String?>(json['exceptionDate']),
      exceptionType: serializer.fromJson<String?>(json['exceptionType']),
      notes: serializer.fromJson<String?>(json['notes']),
      stopOrder: serializer.fromJson<int?>(json['stopOrder']),
      cachedAt: serializer.fromJson<DateTime>(json['cachedAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'jobId': serializer.toJson<String>(jobId),
      'passengerId': serializer.toJson<String>(passengerId),
      'weekday': serializer.toJson<String>(weekday),
      'direction': serializer.toJson<String>(direction),
      'pickupAddress': serializer.toJson<String>(pickupAddress),
      'pickupPostcode': serializer.toJson<String?>(pickupPostcode),
      'pickupLatitude': serializer.toJson<double?>(pickupLatitude),
      'pickupLongitude': serializer.toJson<double?>(pickupLongitude),
      'pickupTime': serializer.toJson<String>(pickupTime),
      'dropoffAddress': serializer.toJson<String>(dropoffAddress),
      'dropoffPostcode': serializer.toJson<String?>(dropoffPostcode),
      'dropoffLatitude': serializer.toJson<double?>(dropoffLatitude),
      'dropoffLongitude': serializer.toJson<double?>(dropoffLongitude),
      'dropoffTime': serializer.toJson<String?>(dropoffTime),
      'exceptionDate': serializer.toJson<String?>(exceptionDate),
      'exceptionType': serializer.toJson<String?>(exceptionType),
      'notes': serializer.toJson<String?>(notes),
      'stopOrder': serializer.toJson<int?>(stopOrder),
      'cachedAt': serializer.toJson<DateTime>(cachedAt),
    };
  }

  SchedulesCacheData copyWith({
    String? id,
    String? jobId,
    String? passengerId,
    String? weekday,
    String? direction,
    String? pickupAddress,
    Value<String?> pickupPostcode = const Value.absent(),
    Value<double?> pickupLatitude = const Value.absent(),
    Value<double?> pickupLongitude = const Value.absent(),
    String? pickupTime,
    String? dropoffAddress,
    Value<String?> dropoffPostcode = const Value.absent(),
    Value<double?> dropoffLatitude = const Value.absent(),
    Value<double?> dropoffLongitude = const Value.absent(),
    Value<String?> dropoffTime = const Value.absent(),
    Value<String?> exceptionDate = const Value.absent(),
    Value<String?> exceptionType = const Value.absent(),
    Value<String?> notes = const Value.absent(),
    Value<int?> stopOrder = const Value.absent(),
    DateTime? cachedAt,
  }) => SchedulesCacheData(
    id: id ?? this.id,
    jobId: jobId ?? this.jobId,
    passengerId: passengerId ?? this.passengerId,
    weekday: weekday ?? this.weekday,
    direction: direction ?? this.direction,
    pickupAddress: pickupAddress ?? this.pickupAddress,
    pickupPostcode: pickupPostcode.present
        ? pickupPostcode.value
        : this.pickupPostcode,
    pickupLatitude: pickupLatitude.present
        ? pickupLatitude.value
        : this.pickupLatitude,
    pickupLongitude: pickupLongitude.present
        ? pickupLongitude.value
        : this.pickupLongitude,
    pickupTime: pickupTime ?? this.pickupTime,
    dropoffAddress: dropoffAddress ?? this.dropoffAddress,
    dropoffPostcode: dropoffPostcode.present
        ? dropoffPostcode.value
        : this.dropoffPostcode,
    dropoffLatitude: dropoffLatitude.present
        ? dropoffLatitude.value
        : this.dropoffLatitude,
    dropoffLongitude: dropoffLongitude.present
        ? dropoffLongitude.value
        : this.dropoffLongitude,
    dropoffTime: dropoffTime.present ? dropoffTime.value : this.dropoffTime,
    exceptionDate: exceptionDate.present
        ? exceptionDate.value
        : this.exceptionDate,
    exceptionType: exceptionType.present
        ? exceptionType.value
        : this.exceptionType,
    notes: notes.present ? notes.value : this.notes,
    stopOrder: stopOrder.present ? stopOrder.value : this.stopOrder,
    cachedAt: cachedAt ?? this.cachedAt,
  );
  SchedulesCacheData copyWithCompanion(SchedulesCacheCompanion data) {
    return SchedulesCacheData(
      id: data.id.present ? data.id.value : this.id,
      jobId: data.jobId.present ? data.jobId.value : this.jobId,
      passengerId: data.passengerId.present
          ? data.passengerId.value
          : this.passengerId,
      weekday: data.weekday.present ? data.weekday.value : this.weekday,
      direction: data.direction.present ? data.direction.value : this.direction,
      pickupAddress: data.pickupAddress.present
          ? data.pickupAddress.value
          : this.pickupAddress,
      pickupPostcode: data.pickupPostcode.present
          ? data.pickupPostcode.value
          : this.pickupPostcode,
      pickupLatitude: data.pickupLatitude.present
          ? data.pickupLatitude.value
          : this.pickupLatitude,
      pickupLongitude: data.pickupLongitude.present
          ? data.pickupLongitude.value
          : this.pickupLongitude,
      pickupTime: data.pickupTime.present
          ? data.pickupTime.value
          : this.pickupTime,
      dropoffAddress: data.dropoffAddress.present
          ? data.dropoffAddress.value
          : this.dropoffAddress,
      dropoffPostcode: data.dropoffPostcode.present
          ? data.dropoffPostcode.value
          : this.dropoffPostcode,
      dropoffLatitude: data.dropoffLatitude.present
          ? data.dropoffLatitude.value
          : this.dropoffLatitude,
      dropoffLongitude: data.dropoffLongitude.present
          ? data.dropoffLongitude.value
          : this.dropoffLongitude,
      dropoffTime: data.dropoffTime.present
          ? data.dropoffTime.value
          : this.dropoffTime,
      exceptionDate: data.exceptionDate.present
          ? data.exceptionDate.value
          : this.exceptionDate,
      exceptionType: data.exceptionType.present
          ? data.exceptionType.value
          : this.exceptionType,
      notes: data.notes.present ? data.notes.value : this.notes,
      stopOrder: data.stopOrder.present ? data.stopOrder.value : this.stopOrder,
      cachedAt: data.cachedAt.present ? data.cachedAt.value : this.cachedAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('SchedulesCacheData(')
          ..write('id: $id, ')
          ..write('jobId: $jobId, ')
          ..write('passengerId: $passengerId, ')
          ..write('weekday: $weekday, ')
          ..write('direction: $direction, ')
          ..write('pickupAddress: $pickupAddress, ')
          ..write('pickupPostcode: $pickupPostcode, ')
          ..write('pickupLatitude: $pickupLatitude, ')
          ..write('pickupLongitude: $pickupLongitude, ')
          ..write('pickupTime: $pickupTime, ')
          ..write('dropoffAddress: $dropoffAddress, ')
          ..write('dropoffPostcode: $dropoffPostcode, ')
          ..write('dropoffLatitude: $dropoffLatitude, ')
          ..write('dropoffLongitude: $dropoffLongitude, ')
          ..write('dropoffTime: $dropoffTime, ')
          ..write('exceptionDate: $exceptionDate, ')
          ..write('exceptionType: $exceptionType, ')
          ..write('notes: $notes, ')
          ..write('stopOrder: $stopOrder, ')
          ..write('cachedAt: $cachedAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
    id,
    jobId,
    passengerId,
    weekday,
    direction,
    pickupAddress,
    pickupPostcode,
    pickupLatitude,
    pickupLongitude,
    pickupTime,
    dropoffAddress,
    dropoffPostcode,
    dropoffLatitude,
    dropoffLongitude,
    dropoffTime,
    exceptionDate,
    exceptionType,
    notes,
    stopOrder,
    cachedAt,
  );
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is SchedulesCacheData &&
          other.id == this.id &&
          other.jobId == this.jobId &&
          other.passengerId == this.passengerId &&
          other.weekday == this.weekday &&
          other.direction == this.direction &&
          other.pickupAddress == this.pickupAddress &&
          other.pickupPostcode == this.pickupPostcode &&
          other.pickupLatitude == this.pickupLatitude &&
          other.pickupLongitude == this.pickupLongitude &&
          other.pickupTime == this.pickupTime &&
          other.dropoffAddress == this.dropoffAddress &&
          other.dropoffPostcode == this.dropoffPostcode &&
          other.dropoffLatitude == this.dropoffLatitude &&
          other.dropoffLongitude == this.dropoffLongitude &&
          other.dropoffTime == this.dropoffTime &&
          other.exceptionDate == this.exceptionDate &&
          other.exceptionType == this.exceptionType &&
          other.notes == this.notes &&
          other.stopOrder == this.stopOrder &&
          other.cachedAt == this.cachedAt);
}

class SchedulesCacheCompanion extends UpdateCompanion<SchedulesCacheData> {
  final Value<String> id;
  final Value<String> jobId;
  final Value<String> passengerId;
  final Value<String> weekday;
  final Value<String> direction;
  final Value<String> pickupAddress;
  final Value<String?> pickupPostcode;
  final Value<double?> pickupLatitude;
  final Value<double?> pickupLongitude;
  final Value<String> pickupTime;
  final Value<String> dropoffAddress;
  final Value<String?> dropoffPostcode;
  final Value<double?> dropoffLatitude;
  final Value<double?> dropoffLongitude;
  final Value<String?> dropoffTime;
  final Value<String?> exceptionDate;
  final Value<String?> exceptionType;
  final Value<String?> notes;
  final Value<int?> stopOrder;
  final Value<DateTime> cachedAt;
  final Value<int> rowid;
  const SchedulesCacheCompanion({
    this.id = const Value.absent(),
    this.jobId = const Value.absent(),
    this.passengerId = const Value.absent(),
    this.weekday = const Value.absent(),
    this.direction = const Value.absent(),
    this.pickupAddress = const Value.absent(),
    this.pickupPostcode = const Value.absent(),
    this.pickupLatitude = const Value.absent(),
    this.pickupLongitude = const Value.absent(),
    this.pickupTime = const Value.absent(),
    this.dropoffAddress = const Value.absent(),
    this.dropoffPostcode = const Value.absent(),
    this.dropoffLatitude = const Value.absent(),
    this.dropoffLongitude = const Value.absent(),
    this.dropoffTime = const Value.absent(),
    this.exceptionDate = const Value.absent(),
    this.exceptionType = const Value.absent(),
    this.notes = const Value.absent(),
    this.stopOrder = const Value.absent(),
    this.cachedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  SchedulesCacheCompanion.insert({
    required String id,
    required String jobId,
    required String passengerId,
    required String weekday,
    required String direction,
    required String pickupAddress,
    this.pickupPostcode = const Value.absent(),
    this.pickupLatitude = const Value.absent(),
    this.pickupLongitude = const Value.absent(),
    required String pickupTime,
    required String dropoffAddress,
    this.dropoffPostcode = const Value.absent(),
    this.dropoffLatitude = const Value.absent(),
    this.dropoffLongitude = const Value.absent(),
    this.dropoffTime = const Value.absent(),
    this.exceptionDate = const Value.absent(),
    this.exceptionType = const Value.absent(),
    this.notes = const Value.absent(),
    this.stopOrder = const Value.absent(),
    this.cachedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  }) : id = Value(id),
       jobId = Value(jobId),
       passengerId = Value(passengerId),
       weekday = Value(weekday),
       direction = Value(direction),
       pickupAddress = Value(pickupAddress),
       pickupTime = Value(pickupTime),
       dropoffAddress = Value(dropoffAddress);
  static Insertable<SchedulesCacheData> custom({
    Expression<String>? id,
    Expression<String>? jobId,
    Expression<String>? passengerId,
    Expression<String>? weekday,
    Expression<String>? direction,
    Expression<String>? pickupAddress,
    Expression<String>? pickupPostcode,
    Expression<double>? pickupLatitude,
    Expression<double>? pickupLongitude,
    Expression<String>? pickupTime,
    Expression<String>? dropoffAddress,
    Expression<String>? dropoffPostcode,
    Expression<double>? dropoffLatitude,
    Expression<double>? dropoffLongitude,
    Expression<String>? dropoffTime,
    Expression<String>? exceptionDate,
    Expression<String>? exceptionType,
    Expression<String>? notes,
    Expression<int>? stopOrder,
    Expression<DateTime>? cachedAt,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (jobId != null) 'job_id': jobId,
      if (passengerId != null) 'passenger_id': passengerId,
      if (weekday != null) 'weekday': weekday,
      if (direction != null) 'direction': direction,
      if (pickupAddress != null) 'pickup_address': pickupAddress,
      if (pickupPostcode != null) 'pickup_postcode': pickupPostcode,
      if (pickupLatitude != null) 'pickup_latitude': pickupLatitude,
      if (pickupLongitude != null) 'pickup_longitude': pickupLongitude,
      if (pickupTime != null) 'pickup_time': pickupTime,
      if (dropoffAddress != null) 'dropoff_address': dropoffAddress,
      if (dropoffPostcode != null) 'dropoff_postcode': dropoffPostcode,
      if (dropoffLatitude != null) 'dropoff_latitude': dropoffLatitude,
      if (dropoffLongitude != null) 'dropoff_longitude': dropoffLongitude,
      if (dropoffTime != null) 'dropoff_time': dropoffTime,
      if (exceptionDate != null) 'exception_date': exceptionDate,
      if (exceptionType != null) 'exception_type': exceptionType,
      if (notes != null) 'notes': notes,
      if (stopOrder != null) 'stop_order': stopOrder,
      if (cachedAt != null) 'cached_at': cachedAt,
      if (rowid != null) 'rowid': rowid,
    });
  }

  SchedulesCacheCompanion copyWith({
    Value<String>? id,
    Value<String>? jobId,
    Value<String>? passengerId,
    Value<String>? weekday,
    Value<String>? direction,
    Value<String>? pickupAddress,
    Value<String?>? pickupPostcode,
    Value<double?>? pickupLatitude,
    Value<double?>? pickupLongitude,
    Value<String>? pickupTime,
    Value<String>? dropoffAddress,
    Value<String?>? dropoffPostcode,
    Value<double?>? dropoffLatitude,
    Value<double?>? dropoffLongitude,
    Value<String?>? dropoffTime,
    Value<String?>? exceptionDate,
    Value<String?>? exceptionType,
    Value<String?>? notes,
    Value<int?>? stopOrder,
    Value<DateTime>? cachedAt,
    Value<int>? rowid,
  }) {
    return SchedulesCacheCompanion(
      id: id ?? this.id,
      jobId: jobId ?? this.jobId,
      passengerId: passengerId ?? this.passengerId,
      weekday: weekday ?? this.weekday,
      direction: direction ?? this.direction,
      pickupAddress: pickupAddress ?? this.pickupAddress,
      pickupPostcode: pickupPostcode ?? this.pickupPostcode,
      pickupLatitude: pickupLatitude ?? this.pickupLatitude,
      pickupLongitude: pickupLongitude ?? this.pickupLongitude,
      pickupTime: pickupTime ?? this.pickupTime,
      dropoffAddress: dropoffAddress ?? this.dropoffAddress,
      dropoffPostcode: dropoffPostcode ?? this.dropoffPostcode,
      dropoffLatitude: dropoffLatitude ?? this.dropoffLatitude,
      dropoffLongitude: dropoffLongitude ?? this.dropoffLongitude,
      dropoffTime: dropoffTime ?? this.dropoffTime,
      exceptionDate: exceptionDate ?? this.exceptionDate,
      exceptionType: exceptionType ?? this.exceptionType,
      notes: notes ?? this.notes,
      stopOrder: stopOrder ?? this.stopOrder,
      cachedAt: cachedAt ?? this.cachedAt,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (jobId.present) {
      map['job_id'] = Variable<String>(jobId.value);
    }
    if (passengerId.present) {
      map['passenger_id'] = Variable<String>(passengerId.value);
    }
    if (weekday.present) {
      map['weekday'] = Variable<String>(weekday.value);
    }
    if (direction.present) {
      map['direction'] = Variable<String>(direction.value);
    }
    if (pickupAddress.present) {
      map['pickup_address'] = Variable<String>(pickupAddress.value);
    }
    if (pickupPostcode.present) {
      map['pickup_postcode'] = Variable<String>(pickupPostcode.value);
    }
    if (pickupLatitude.present) {
      map['pickup_latitude'] = Variable<double>(pickupLatitude.value);
    }
    if (pickupLongitude.present) {
      map['pickup_longitude'] = Variable<double>(pickupLongitude.value);
    }
    if (pickupTime.present) {
      map['pickup_time'] = Variable<String>(pickupTime.value);
    }
    if (dropoffAddress.present) {
      map['dropoff_address'] = Variable<String>(dropoffAddress.value);
    }
    if (dropoffPostcode.present) {
      map['dropoff_postcode'] = Variable<String>(dropoffPostcode.value);
    }
    if (dropoffLatitude.present) {
      map['dropoff_latitude'] = Variable<double>(dropoffLatitude.value);
    }
    if (dropoffLongitude.present) {
      map['dropoff_longitude'] = Variable<double>(dropoffLongitude.value);
    }
    if (dropoffTime.present) {
      map['dropoff_time'] = Variable<String>(dropoffTime.value);
    }
    if (exceptionDate.present) {
      map['exception_date'] = Variable<String>(exceptionDate.value);
    }
    if (exceptionType.present) {
      map['exception_type'] = Variable<String>(exceptionType.value);
    }
    if (notes.present) {
      map['notes'] = Variable<String>(notes.value);
    }
    if (stopOrder.present) {
      map['stop_order'] = Variable<int>(stopOrder.value);
    }
    if (cachedAt.present) {
      map['cached_at'] = Variable<DateTime>(cachedAt.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('SchedulesCacheCompanion(')
          ..write('id: $id, ')
          ..write('jobId: $jobId, ')
          ..write('passengerId: $passengerId, ')
          ..write('weekday: $weekday, ')
          ..write('direction: $direction, ')
          ..write('pickupAddress: $pickupAddress, ')
          ..write('pickupPostcode: $pickupPostcode, ')
          ..write('pickupLatitude: $pickupLatitude, ')
          ..write('pickupLongitude: $pickupLongitude, ')
          ..write('pickupTime: $pickupTime, ')
          ..write('dropoffAddress: $dropoffAddress, ')
          ..write('dropoffPostcode: $dropoffPostcode, ')
          ..write('dropoffLatitude: $dropoffLatitude, ')
          ..write('dropoffLongitude: $dropoffLongitude, ')
          ..write('dropoffTime: $dropoffTime, ')
          ..write('exceptionDate: $exceptionDate, ')
          ..write('exceptionType: $exceptionType, ')
          ..write('notes: $notes, ')
          ..write('stopOrder: $stopOrder, ')
          ..write('cachedAt: $cachedAt, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $PassengersCacheTable extends PassengersCache
    with TableInfo<$PassengersCacheTable, PassengersCacheData> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $PassengersCacheTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
    'id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _firstNameMeta = const VerificationMeta(
    'firstName',
  );
  @override
  late final GeneratedColumn<String> firstName = GeneratedColumn<String>(
    'first_name',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _surnameMeta = const VerificationMeta(
    'surname',
  );
  @override
  late final GeneratedColumn<String> surname = GeneratedColumn<String>(
    'surname',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _contactNumber1Meta = const VerificationMeta(
    'contactNumber1',
  );
  @override
  late final GeneratedColumn<String> contactNumber1 = GeneratedColumn<String>(
    'contact_number1',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _educationalSiteAddressMeta =
      const VerificationMeta('educationalSiteAddress');
  @override
  late final GeneratedColumn<String> educationalSiteAddress =
      GeneratedColumn<String>(
        'educational_site_address',
        aliasedName,
        true,
        type: DriftSqlType.string,
        requiredDuringInsert: false,
      );
  static const VerificationMeta _educationalSitePostcodeMeta =
      const VerificationMeta('educationalSitePostcode');
  @override
  late final GeneratedColumn<String> educationalSitePostcode =
      GeneratedColumn<String>(
        'educational_site_postcode',
        aliasedName,
        true,
        type: DriftSqlType.string,
        requiredDuringInsert: false,
      );
  static const VerificationMeta _educationalSiteLatitudeMeta =
      const VerificationMeta('educationalSiteLatitude');
  @override
  late final GeneratedColumn<double> educationalSiteLatitude =
      GeneratedColumn<double>(
        'educational_site_latitude',
        aliasedName,
        true,
        type: DriftSqlType.double,
        requiredDuringInsert: false,
      );
  static const VerificationMeta _educationalSiteLongitudeMeta =
      const VerificationMeta('educationalSiteLongitude');
  @override
  late final GeneratedColumn<double> educationalSiteLongitude =
      GeneratedColumn<double>(
        'educational_site_longitude',
        aliasedName,
        true,
        type: DriftSqlType.double,
        requiredDuringInsert: false,
      );
  static const VerificationMeta _educationalSiteDropoffTimeMeta =
      const VerificationMeta('educationalSiteDropoffTime');
  @override
  late final GeneratedColumn<String> educationalSiteDropoffTime =
      GeneratedColumn<String>(
        'educational_site_dropoff_time',
        aliasedName,
        true,
        type: DriftSqlType.string,
        requiredDuringInsert: false,
      );
  static const VerificationMeta _wheelchairRequiredMeta =
      const VerificationMeta('wheelchairRequired');
  @override
  late final GeneratedColumn<bool> wheelchairRequired = GeneratedColumn<bool>(
    'wheelchair_required',
    aliasedName,
    false,
    type: DriftSqlType.bool,
    requiredDuringInsert: false,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'CHECK ("wheelchair_required" IN (0, 1))',
    ),
    defaultValue: const Constant(false),
  );
  static const VerificationMeta _harnessRequiredMeta = const VerificationMeta(
    'harnessRequired',
  );
  @override
  late final GeneratedColumn<bool> harnessRequired = GeneratedColumn<bool>(
    'harness_required',
    aliasedName,
    false,
    type: DriftSqlType.bool,
    requiredDuringInsert: false,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'CHECK ("harness_required" IN (0, 1))',
    ),
    defaultValue: const Constant(false),
  );
  static const VerificationMeta _cachedAtMeta = const VerificationMeta(
    'cachedAt',
  );
  @override
  late final GeneratedColumn<DateTime> cachedAt = GeneratedColumn<DateTime>(
    'cached_at',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: false,
    defaultValue: currentDateAndTime,
  );
  @override
  List<GeneratedColumn> get $columns => [
    id,
    firstName,
    surname,
    contactNumber1,
    educationalSiteAddress,
    educationalSitePostcode,
    educationalSiteLatitude,
    educationalSiteLongitude,
    educationalSiteDropoffTime,
    wheelchairRequired,
    harnessRequired,
    cachedAt,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'passengers_cache';
  @override
  VerificationContext validateIntegrity(
    Insertable<PassengersCacheData> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('first_name')) {
      context.handle(
        _firstNameMeta,
        firstName.isAcceptableOrUnknown(data['first_name']!, _firstNameMeta),
      );
    } else if (isInserting) {
      context.missing(_firstNameMeta);
    }
    if (data.containsKey('surname')) {
      context.handle(
        _surnameMeta,
        surname.isAcceptableOrUnknown(data['surname']!, _surnameMeta),
      );
    } else if (isInserting) {
      context.missing(_surnameMeta);
    }
    if (data.containsKey('contact_number1')) {
      context.handle(
        _contactNumber1Meta,
        contactNumber1.isAcceptableOrUnknown(
          data['contact_number1']!,
          _contactNumber1Meta,
        ),
      );
    }
    if (data.containsKey('educational_site_address')) {
      context.handle(
        _educationalSiteAddressMeta,
        educationalSiteAddress.isAcceptableOrUnknown(
          data['educational_site_address']!,
          _educationalSiteAddressMeta,
        ),
      );
    }
    if (data.containsKey('educational_site_postcode')) {
      context.handle(
        _educationalSitePostcodeMeta,
        educationalSitePostcode.isAcceptableOrUnknown(
          data['educational_site_postcode']!,
          _educationalSitePostcodeMeta,
        ),
      );
    }
    if (data.containsKey('educational_site_latitude')) {
      context.handle(
        _educationalSiteLatitudeMeta,
        educationalSiteLatitude.isAcceptableOrUnknown(
          data['educational_site_latitude']!,
          _educationalSiteLatitudeMeta,
        ),
      );
    }
    if (data.containsKey('educational_site_longitude')) {
      context.handle(
        _educationalSiteLongitudeMeta,
        educationalSiteLongitude.isAcceptableOrUnknown(
          data['educational_site_longitude']!,
          _educationalSiteLongitudeMeta,
        ),
      );
    }
    if (data.containsKey('educational_site_dropoff_time')) {
      context.handle(
        _educationalSiteDropoffTimeMeta,
        educationalSiteDropoffTime.isAcceptableOrUnknown(
          data['educational_site_dropoff_time']!,
          _educationalSiteDropoffTimeMeta,
        ),
      );
    }
    if (data.containsKey('wheelchair_required')) {
      context.handle(
        _wheelchairRequiredMeta,
        wheelchairRequired.isAcceptableOrUnknown(
          data['wheelchair_required']!,
          _wheelchairRequiredMeta,
        ),
      );
    }
    if (data.containsKey('harness_required')) {
      context.handle(
        _harnessRequiredMeta,
        harnessRequired.isAcceptableOrUnknown(
          data['harness_required']!,
          _harnessRequiredMeta,
        ),
      );
    }
    if (data.containsKey('cached_at')) {
      context.handle(
        _cachedAtMeta,
        cachedAt.isAcceptableOrUnknown(data['cached_at']!, _cachedAtMeta),
      );
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  PassengersCacheData map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return PassengersCacheData(
      id: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}id'],
      )!,
      firstName: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}first_name'],
      )!,
      surname: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}surname'],
      )!,
      contactNumber1: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}contact_number1'],
      ),
      educationalSiteAddress: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}educational_site_address'],
      ),
      educationalSitePostcode: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}educational_site_postcode'],
      ),
      educationalSiteLatitude: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}educational_site_latitude'],
      ),
      educationalSiteLongitude: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}educational_site_longitude'],
      ),
      educationalSiteDropoffTime: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}educational_site_dropoff_time'],
      ),
      wheelchairRequired: attachedDatabase.typeMapping.read(
        DriftSqlType.bool,
        data['${effectivePrefix}wheelchair_required'],
      )!,
      harnessRequired: attachedDatabase.typeMapping.read(
        DriftSqlType.bool,
        data['${effectivePrefix}harness_required'],
      )!,
      cachedAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}cached_at'],
      )!,
    );
  }

  @override
  $PassengersCacheTable createAlias(String alias) {
    return $PassengersCacheTable(attachedDatabase, alias);
  }
}

class PassengersCacheData extends DataClass
    implements Insertable<PassengersCacheData> {
  final String id;
  final String firstName;
  final String surname;
  final String? contactNumber1;
  final String? educationalSiteAddress;
  final String? educationalSitePostcode;
  final double? educationalSiteLatitude;
  final double? educationalSiteLongitude;
  final String? educationalSiteDropoffTime;
  final bool wheelchairRequired;
  final bool harnessRequired;
  final DateTime cachedAt;
  const PassengersCacheData({
    required this.id,
    required this.firstName,
    required this.surname,
    this.contactNumber1,
    this.educationalSiteAddress,
    this.educationalSitePostcode,
    this.educationalSiteLatitude,
    this.educationalSiteLongitude,
    this.educationalSiteDropoffTime,
    required this.wheelchairRequired,
    required this.harnessRequired,
    required this.cachedAt,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['first_name'] = Variable<String>(firstName);
    map['surname'] = Variable<String>(surname);
    if (!nullToAbsent || contactNumber1 != null) {
      map['contact_number1'] = Variable<String>(contactNumber1);
    }
    if (!nullToAbsent || educationalSiteAddress != null) {
      map['educational_site_address'] = Variable<String>(
        educationalSiteAddress,
      );
    }
    if (!nullToAbsent || educationalSitePostcode != null) {
      map['educational_site_postcode'] = Variable<String>(
        educationalSitePostcode,
      );
    }
    if (!nullToAbsent || educationalSiteLatitude != null) {
      map['educational_site_latitude'] = Variable<double>(
        educationalSiteLatitude,
      );
    }
    if (!nullToAbsent || educationalSiteLongitude != null) {
      map['educational_site_longitude'] = Variable<double>(
        educationalSiteLongitude,
      );
    }
    if (!nullToAbsent || educationalSiteDropoffTime != null) {
      map['educational_site_dropoff_time'] = Variable<String>(
        educationalSiteDropoffTime,
      );
    }
    map['wheelchair_required'] = Variable<bool>(wheelchairRequired);
    map['harness_required'] = Variable<bool>(harnessRequired);
    map['cached_at'] = Variable<DateTime>(cachedAt);
    return map;
  }

  PassengersCacheCompanion toCompanion(bool nullToAbsent) {
    return PassengersCacheCompanion(
      id: Value(id),
      firstName: Value(firstName),
      surname: Value(surname),
      contactNumber1: contactNumber1 == null && nullToAbsent
          ? const Value.absent()
          : Value(contactNumber1),
      educationalSiteAddress: educationalSiteAddress == null && nullToAbsent
          ? const Value.absent()
          : Value(educationalSiteAddress),
      educationalSitePostcode: educationalSitePostcode == null && nullToAbsent
          ? const Value.absent()
          : Value(educationalSitePostcode),
      educationalSiteLatitude: educationalSiteLatitude == null && nullToAbsent
          ? const Value.absent()
          : Value(educationalSiteLatitude),
      educationalSiteLongitude: educationalSiteLongitude == null && nullToAbsent
          ? const Value.absent()
          : Value(educationalSiteLongitude),
      educationalSiteDropoffTime:
          educationalSiteDropoffTime == null && nullToAbsent
          ? const Value.absent()
          : Value(educationalSiteDropoffTime),
      wheelchairRequired: Value(wheelchairRequired),
      harnessRequired: Value(harnessRequired),
      cachedAt: Value(cachedAt),
    );
  }

  factory PassengersCacheData.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return PassengersCacheData(
      id: serializer.fromJson<String>(json['id']),
      firstName: serializer.fromJson<String>(json['firstName']),
      surname: serializer.fromJson<String>(json['surname']),
      contactNumber1: serializer.fromJson<String?>(json['contactNumber1']),
      educationalSiteAddress: serializer.fromJson<String?>(
        json['educationalSiteAddress'],
      ),
      educationalSitePostcode: serializer.fromJson<String?>(
        json['educationalSitePostcode'],
      ),
      educationalSiteLatitude: serializer.fromJson<double?>(
        json['educationalSiteLatitude'],
      ),
      educationalSiteLongitude: serializer.fromJson<double?>(
        json['educationalSiteLongitude'],
      ),
      educationalSiteDropoffTime: serializer.fromJson<String?>(
        json['educationalSiteDropoffTime'],
      ),
      wheelchairRequired: serializer.fromJson<bool>(json['wheelchairRequired']),
      harnessRequired: serializer.fromJson<bool>(json['harnessRequired']),
      cachedAt: serializer.fromJson<DateTime>(json['cachedAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'firstName': serializer.toJson<String>(firstName),
      'surname': serializer.toJson<String>(surname),
      'contactNumber1': serializer.toJson<String?>(contactNumber1),
      'educationalSiteAddress': serializer.toJson<String?>(
        educationalSiteAddress,
      ),
      'educationalSitePostcode': serializer.toJson<String?>(
        educationalSitePostcode,
      ),
      'educationalSiteLatitude': serializer.toJson<double?>(
        educationalSiteLatitude,
      ),
      'educationalSiteLongitude': serializer.toJson<double?>(
        educationalSiteLongitude,
      ),
      'educationalSiteDropoffTime': serializer.toJson<String?>(
        educationalSiteDropoffTime,
      ),
      'wheelchairRequired': serializer.toJson<bool>(wheelchairRequired),
      'harnessRequired': serializer.toJson<bool>(harnessRequired),
      'cachedAt': serializer.toJson<DateTime>(cachedAt),
    };
  }

  PassengersCacheData copyWith({
    String? id,
    String? firstName,
    String? surname,
    Value<String?> contactNumber1 = const Value.absent(),
    Value<String?> educationalSiteAddress = const Value.absent(),
    Value<String?> educationalSitePostcode = const Value.absent(),
    Value<double?> educationalSiteLatitude = const Value.absent(),
    Value<double?> educationalSiteLongitude = const Value.absent(),
    Value<String?> educationalSiteDropoffTime = const Value.absent(),
    bool? wheelchairRequired,
    bool? harnessRequired,
    DateTime? cachedAt,
  }) => PassengersCacheData(
    id: id ?? this.id,
    firstName: firstName ?? this.firstName,
    surname: surname ?? this.surname,
    contactNumber1: contactNumber1.present
        ? contactNumber1.value
        : this.contactNumber1,
    educationalSiteAddress: educationalSiteAddress.present
        ? educationalSiteAddress.value
        : this.educationalSiteAddress,
    educationalSitePostcode: educationalSitePostcode.present
        ? educationalSitePostcode.value
        : this.educationalSitePostcode,
    educationalSiteLatitude: educationalSiteLatitude.present
        ? educationalSiteLatitude.value
        : this.educationalSiteLatitude,
    educationalSiteLongitude: educationalSiteLongitude.present
        ? educationalSiteLongitude.value
        : this.educationalSiteLongitude,
    educationalSiteDropoffTime: educationalSiteDropoffTime.present
        ? educationalSiteDropoffTime.value
        : this.educationalSiteDropoffTime,
    wheelchairRequired: wheelchairRequired ?? this.wheelchairRequired,
    harnessRequired: harnessRequired ?? this.harnessRequired,
    cachedAt: cachedAt ?? this.cachedAt,
  );
  PassengersCacheData copyWithCompanion(PassengersCacheCompanion data) {
    return PassengersCacheData(
      id: data.id.present ? data.id.value : this.id,
      firstName: data.firstName.present ? data.firstName.value : this.firstName,
      surname: data.surname.present ? data.surname.value : this.surname,
      contactNumber1: data.contactNumber1.present
          ? data.contactNumber1.value
          : this.contactNumber1,
      educationalSiteAddress: data.educationalSiteAddress.present
          ? data.educationalSiteAddress.value
          : this.educationalSiteAddress,
      educationalSitePostcode: data.educationalSitePostcode.present
          ? data.educationalSitePostcode.value
          : this.educationalSitePostcode,
      educationalSiteLatitude: data.educationalSiteLatitude.present
          ? data.educationalSiteLatitude.value
          : this.educationalSiteLatitude,
      educationalSiteLongitude: data.educationalSiteLongitude.present
          ? data.educationalSiteLongitude.value
          : this.educationalSiteLongitude,
      educationalSiteDropoffTime: data.educationalSiteDropoffTime.present
          ? data.educationalSiteDropoffTime.value
          : this.educationalSiteDropoffTime,
      wheelchairRequired: data.wheelchairRequired.present
          ? data.wheelchairRequired.value
          : this.wheelchairRequired,
      harnessRequired: data.harnessRequired.present
          ? data.harnessRequired.value
          : this.harnessRequired,
      cachedAt: data.cachedAt.present ? data.cachedAt.value : this.cachedAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('PassengersCacheData(')
          ..write('id: $id, ')
          ..write('firstName: $firstName, ')
          ..write('surname: $surname, ')
          ..write('contactNumber1: $contactNumber1, ')
          ..write('educationalSiteAddress: $educationalSiteAddress, ')
          ..write('educationalSitePostcode: $educationalSitePostcode, ')
          ..write('educationalSiteLatitude: $educationalSiteLatitude, ')
          ..write('educationalSiteLongitude: $educationalSiteLongitude, ')
          ..write('educationalSiteDropoffTime: $educationalSiteDropoffTime, ')
          ..write('wheelchairRequired: $wheelchairRequired, ')
          ..write('harnessRequired: $harnessRequired, ')
          ..write('cachedAt: $cachedAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
    id,
    firstName,
    surname,
    contactNumber1,
    educationalSiteAddress,
    educationalSitePostcode,
    educationalSiteLatitude,
    educationalSiteLongitude,
    educationalSiteDropoffTime,
    wheelchairRequired,
    harnessRequired,
    cachedAt,
  );
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is PassengersCacheData &&
          other.id == this.id &&
          other.firstName == this.firstName &&
          other.surname == this.surname &&
          other.contactNumber1 == this.contactNumber1 &&
          other.educationalSiteAddress == this.educationalSiteAddress &&
          other.educationalSitePostcode == this.educationalSitePostcode &&
          other.educationalSiteLatitude == this.educationalSiteLatitude &&
          other.educationalSiteLongitude == this.educationalSiteLongitude &&
          other.educationalSiteDropoffTime == this.educationalSiteDropoffTime &&
          other.wheelchairRequired == this.wheelchairRequired &&
          other.harnessRequired == this.harnessRequired &&
          other.cachedAt == this.cachedAt);
}

class PassengersCacheCompanion extends UpdateCompanion<PassengersCacheData> {
  final Value<String> id;
  final Value<String> firstName;
  final Value<String> surname;
  final Value<String?> contactNumber1;
  final Value<String?> educationalSiteAddress;
  final Value<String?> educationalSitePostcode;
  final Value<double?> educationalSiteLatitude;
  final Value<double?> educationalSiteLongitude;
  final Value<String?> educationalSiteDropoffTime;
  final Value<bool> wheelchairRequired;
  final Value<bool> harnessRequired;
  final Value<DateTime> cachedAt;
  final Value<int> rowid;
  const PassengersCacheCompanion({
    this.id = const Value.absent(),
    this.firstName = const Value.absent(),
    this.surname = const Value.absent(),
    this.contactNumber1 = const Value.absent(),
    this.educationalSiteAddress = const Value.absent(),
    this.educationalSitePostcode = const Value.absent(),
    this.educationalSiteLatitude = const Value.absent(),
    this.educationalSiteLongitude = const Value.absent(),
    this.educationalSiteDropoffTime = const Value.absent(),
    this.wheelchairRequired = const Value.absent(),
    this.harnessRequired = const Value.absent(),
    this.cachedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  PassengersCacheCompanion.insert({
    required String id,
    required String firstName,
    required String surname,
    this.contactNumber1 = const Value.absent(),
    this.educationalSiteAddress = const Value.absent(),
    this.educationalSitePostcode = const Value.absent(),
    this.educationalSiteLatitude = const Value.absent(),
    this.educationalSiteLongitude = const Value.absent(),
    this.educationalSiteDropoffTime = const Value.absent(),
    this.wheelchairRequired = const Value.absent(),
    this.harnessRequired = const Value.absent(),
    this.cachedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  }) : id = Value(id),
       firstName = Value(firstName),
       surname = Value(surname);
  static Insertable<PassengersCacheData> custom({
    Expression<String>? id,
    Expression<String>? firstName,
    Expression<String>? surname,
    Expression<String>? contactNumber1,
    Expression<String>? educationalSiteAddress,
    Expression<String>? educationalSitePostcode,
    Expression<double>? educationalSiteLatitude,
    Expression<double>? educationalSiteLongitude,
    Expression<String>? educationalSiteDropoffTime,
    Expression<bool>? wheelchairRequired,
    Expression<bool>? harnessRequired,
    Expression<DateTime>? cachedAt,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (firstName != null) 'first_name': firstName,
      if (surname != null) 'surname': surname,
      if (contactNumber1 != null) 'contact_number1': contactNumber1,
      if (educationalSiteAddress != null)
        'educational_site_address': educationalSiteAddress,
      if (educationalSitePostcode != null)
        'educational_site_postcode': educationalSitePostcode,
      if (educationalSiteLatitude != null)
        'educational_site_latitude': educationalSiteLatitude,
      if (educationalSiteLongitude != null)
        'educational_site_longitude': educationalSiteLongitude,
      if (educationalSiteDropoffTime != null)
        'educational_site_dropoff_time': educationalSiteDropoffTime,
      if (wheelchairRequired != null) 'wheelchair_required': wheelchairRequired,
      if (harnessRequired != null) 'harness_required': harnessRequired,
      if (cachedAt != null) 'cached_at': cachedAt,
      if (rowid != null) 'rowid': rowid,
    });
  }

  PassengersCacheCompanion copyWith({
    Value<String>? id,
    Value<String>? firstName,
    Value<String>? surname,
    Value<String?>? contactNumber1,
    Value<String?>? educationalSiteAddress,
    Value<String?>? educationalSitePostcode,
    Value<double?>? educationalSiteLatitude,
    Value<double?>? educationalSiteLongitude,
    Value<String?>? educationalSiteDropoffTime,
    Value<bool>? wheelchairRequired,
    Value<bool>? harnessRequired,
    Value<DateTime>? cachedAt,
    Value<int>? rowid,
  }) {
    return PassengersCacheCompanion(
      id: id ?? this.id,
      firstName: firstName ?? this.firstName,
      surname: surname ?? this.surname,
      contactNumber1: contactNumber1 ?? this.contactNumber1,
      educationalSiteAddress:
          educationalSiteAddress ?? this.educationalSiteAddress,
      educationalSitePostcode:
          educationalSitePostcode ?? this.educationalSitePostcode,
      educationalSiteLatitude:
          educationalSiteLatitude ?? this.educationalSiteLatitude,
      educationalSiteLongitude:
          educationalSiteLongitude ?? this.educationalSiteLongitude,
      educationalSiteDropoffTime:
          educationalSiteDropoffTime ?? this.educationalSiteDropoffTime,
      wheelchairRequired: wheelchairRequired ?? this.wheelchairRequired,
      harnessRequired: harnessRequired ?? this.harnessRequired,
      cachedAt: cachedAt ?? this.cachedAt,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (firstName.present) {
      map['first_name'] = Variable<String>(firstName.value);
    }
    if (surname.present) {
      map['surname'] = Variable<String>(surname.value);
    }
    if (contactNumber1.present) {
      map['contact_number1'] = Variable<String>(contactNumber1.value);
    }
    if (educationalSiteAddress.present) {
      map['educational_site_address'] = Variable<String>(
        educationalSiteAddress.value,
      );
    }
    if (educationalSitePostcode.present) {
      map['educational_site_postcode'] = Variable<String>(
        educationalSitePostcode.value,
      );
    }
    if (educationalSiteLatitude.present) {
      map['educational_site_latitude'] = Variable<double>(
        educationalSiteLatitude.value,
      );
    }
    if (educationalSiteLongitude.present) {
      map['educational_site_longitude'] = Variable<double>(
        educationalSiteLongitude.value,
      );
    }
    if (educationalSiteDropoffTime.present) {
      map['educational_site_dropoff_time'] = Variable<String>(
        educationalSiteDropoffTime.value,
      );
    }
    if (wheelchairRequired.present) {
      map['wheelchair_required'] = Variable<bool>(wheelchairRequired.value);
    }
    if (harnessRequired.present) {
      map['harness_required'] = Variable<bool>(harnessRequired.value);
    }
    if (cachedAt.present) {
      map['cached_at'] = Variable<DateTime>(cachedAt.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('PassengersCacheCompanion(')
          ..write('id: $id, ')
          ..write('firstName: $firstName, ')
          ..write('surname: $surname, ')
          ..write('contactNumber1: $contactNumber1, ')
          ..write('educationalSiteAddress: $educationalSiteAddress, ')
          ..write('educationalSitePostcode: $educationalSitePostcode, ')
          ..write('educationalSiteLatitude: $educationalSiteLatitude, ')
          ..write('educationalSiteLongitude: $educationalSiteLongitude, ')
          ..write('educationalSiteDropoffTime: $educationalSiteDropoffTime, ')
          ..write('wheelchairRequired: $wheelchairRequired, ')
          ..write('harnessRequired: $harnessRequired, ')
          ..write('cachedAt: $cachedAt, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $VehiclesCacheTable extends VehiclesCache
    with TableInfo<$VehiclesCacheTable, VehiclesCacheData> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $VehiclesCacheTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
    'id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _companyIdMeta = const VerificationMeta(
    'companyId',
  );
  @override
  late final GeneratedColumn<String> companyId = GeneratedColumn<String>(
    'company_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _nameMeta = const VerificationMeta('name');
  @override
  late final GeneratedColumn<String> name = GeneratedColumn<String>(
    'name',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _makeMeta = const VerificationMeta('make');
  @override
  late final GeneratedColumn<String> make = GeneratedColumn<String>(
    'make',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _modelMeta = const VerificationMeta('model');
  @override
  late final GeneratedColumn<String> model = GeneratedColumn<String>(
    'model',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _taxiLicensePlateNumberMeta =
      const VerificationMeta('taxiLicensePlateNumber');
  @override
  late final GeneratedColumn<String> taxiLicensePlateNumber =
      GeneratedColumn<String>(
        'taxi_license_plate_number',
        aliasedName,
        false,
        type: DriftSqlType.string,
        requiredDuringInsert: true,
      );
  static const VerificationMeta _yearOfFirstRegistrationMeta =
      const VerificationMeta('yearOfFirstRegistration');
  @override
  late final GeneratedColumn<String> yearOfFirstRegistration =
      GeneratedColumn<String>(
        'year_of_first_registration',
        aliasedName,
        true,
        type: DriftSqlType.string,
        requiredDuringInsert: false,
      );
  static const VerificationMeta _cachedAtMeta = const VerificationMeta(
    'cachedAt',
  );
  @override
  late final GeneratedColumn<DateTime> cachedAt = GeneratedColumn<DateTime>(
    'cached_at',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: false,
    defaultValue: currentDateAndTime,
  );
  @override
  List<GeneratedColumn> get $columns => [
    id,
    companyId,
    name,
    make,
    model,
    taxiLicensePlateNumber,
    yearOfFirstRegistration,
    cachedAt,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'vehicles_cache';
  @override
  VerificationContext validateIntegrity(
    Insertable<VehiclesCacheData> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('company_id')) {
      context.handle(
        _companyIdMeta,
        companyId.isAcceptableOrUnknown(data['company_id']!, _companyIdMeta),
      );
    } else if (isInserting) {
      context.missing(_companyIdMeta);
    }
    if (data.containsKey('name')) {
      context.handle(
        _nameMeta,
        name.isAcceptableOrUnknown(data['name']!, _nameMeta),
      );
    }
    if (data.containsKey('make')) {
      context.handle(
        _makeMeta,
        make.isAcceptableOrUnknown(data['make']!, _makeMeta),
      );
    }
    if (data.containsKey('model')) {
      context.handle(
        _modelMeta,
        model.isAcceptableOrUnknown(data['model']!, _modelMeta),
      );
    }
    if (data.containsKey('taxi_license_plate_number')) {
      context.handle(
        _taxiLicensePlateNumberMeta,
        taxiLicensePlateNumber.isAcceptableOrUnknown(
          data['taxi_license_plate_number']!,
          _taxiLicensePlateNumberMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_taxiLicensePlateNumberMeta);
    }
    if (data.containsKey('year_of_first_registration')) {
      context.handle(
        _yearOfFirstRegistrationMeta,
        yearOfFirstRegistration.isAcceptableOrUnknown(
          data['year_of_first_registration']!,
          _yearOfFirstRegistrationMeta,
        ),
      );
    }
    if (data.containsKey('cached_at')) {
      context.handle(
        _cachedAtMeta,
        cachedAt.isAcceptableOrUnknown(data['cached_at']!, _cachedAtMeta),
      );
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  VehiclesCacheData map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return VehiclesCacheData(
      id: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}id'],
      )!,
      companyId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}company_id'],
      )!,
      name: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}name'],
      ),
      make: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}make'],
      ),
      model: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}model'],
      ),
      taxiLicensePlateNumber: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}taxi_license_plate_number'],
      )!,
      yearOfFirstRegistration: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}year_of_first_registration'],
      ),
      cachedAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}cached_at'],
      )!,
    );
  }

  @override
  $VehiclesCacheTable createAlias(String alias) {
    return $VehiclesCacheTable(attachedDatabase, alias);
  }
}

class VehiclesCacheData extends DataClass
    implements Insertable<VehiclesCacheData> {
  final String id;
  final String companyId;
  final String? name;
  final String? make;
  final String? model;
  final String taxiLicensePlateNumber;
  final String? yearOfFirstRegistration;
  final DateTime cachedAt;
  const VehiclesCacheData({
    required this.id,
    required this.companyId,
    this.name,
    this.make,
    this.model,
    required this.taxiLicensePlateNumber,
    this.yearOfFirstRegistration,
    required this.cachedAt,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['company_id'] = Variable<String>(companyId);
    if (!nullToAbsent || name != null) {
      map['name'] = Variable<String>(name);
    }
    if (!nullToAbsent || make != null) {
      map['make'] = Variable<String>(make);
    }
    if (!nullToAbsent || model != null) {
      map['model'] = Variable<String>(model);
    }
    map['taxi_license_plate_number'] = Variable<String>(taxiLicensePlateNumber);
    if (!nullToAbsent || yearOfFirstRegistration != null) {
      map['year_of_first_registration'] = Variable<String>(
        yearOfFirstRegistration,
      );
    }
    map['cached_at'] = Variable<DateTime>(cachedAt);
    return map;
  }

  VehiclesCacheCompanion toCompanion(bool nullToAbsent) {
    return VehiclesCacheCompanion(
      id: Value(id),
      companyId: Value(companyId),
      name: name == null && nullToAbsent ? const Value.absent() : Value(name),
      make: make == null && nullToAbsent ? const Value.absent() : Value(make),
      model: model == null && nullToAbsent
          ? const Value.absent()
          : Value(model),
      taxiLicensePlateNumber: Value(taxiLicensePlateNumber),
      yearOfFirstRegistration: yearOfFirstRegistration == null && nullToAbsent
          ? const Value.absent()
          : Value(yearOfFirstRegistration),
      cachedAt: Value(cachedAt),
    );
  }

  factory VehiclesCacheData.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return VehiclesCacheData(
      id: serializer.fromJson<String>(json['id']),
      companyId: serializer.fromJson<String>(json['companyId']),
      name: serializer.fromJson<String?>(json['name']),
      make: serializer.fromJson<String?>(json['make']),
      model: serializer.fromJson<String?>(json['model']),
      taxiLicensePlateNumber: serializer.fromJson<String>(
        json['taxiLicensePlateNumber'],
      ),
      yearOfFirstRegistration: serializer.fromJson<String?>(
        json['yearOfFirstRegistration'],
      ),
      cachedAt: serializer.fromJson<DateTime>(json['cachedAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'companyId': serializer.toJson<String>(companyId),
      'name': serializer.toJson<String?>(name),
      'make': serializer.toJson<String?>(make),
      'model': serializer.toJson<String?>(model),
      'taxiLicensePlateNumber': serializer.toJson<String>(
        taxiLicensePlateNumber,
      ),
      'yearOfFirstRegistration': serializer.toJson<String?>(
        yearOfFirstRegistration,
      ),
      'cachedAt': serializer.toJson<DateTime>(cachedAt),
    };
  }

  VehiclesCacheData copyWith({
    String? id,
    String? companyId,
    Value<String?> name = const Value.absent(),
    Value<String?> make = const Value.absent(),
    Value<String?> model = const Value.absent(),
    String? taxiLicensePlateNumber,
    Value<String?> yearOfFirstRegistration = const Value.absent(),
    DateTime? cachedAt,
  }) => VehiclesCacheData(
    id: id ?? this.id,
    companyId: companyId ?? this.companyId,
    name: name.present ? name.value : this.name,
    make: make.present ? make.value : this.make,
    model: model.present ? model.value : this.model,
    taxiLicensePlateNumber:
        taxiLicensePlateNumber ?? this.taxiLicensePlateNumber,
    yearOfFirstRegistration: yearOfFirstRegistration.present
        ? yearOfFirstRegistration.value
        : this.yearOfFirstRegistration,
    cachedAt: cachedAt ?? this.cachedAt,
  );
  VehiclesCacheData copyWithCompanion(VehiclesCacheCompanion data) {
    return VehiclesCacheData(
      id: data.id.present ? data.id.value : this.id,
      companyId: data.companyId.present ? data.companyId.value : this.companyId,
      name: data.name.present ? data.name.value : this.name,
      make: data.make.present ? data.make.value : this.make,
      model: data.model.present ? data.model.value : this.model,
      taxiLicensePlateNumber: data.taxiLicensePlateNumber.present
          ? data.taxiLicensePlateNumber.value
          : this.taxiLicensePlateNumber,
      yearOfFirstRegistration: data.yearOfFirstRegistration.present
          ? data.yearOfFirstRegistration.value
          : this.yearOfFirstRegistration,
      cachedAt: data.cachedAt.present ? data.cachedAt.value : this.cachedAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('VehiclesCacheData(')
          ..write('id: $id, ')
          ..write('companyId: $companyId, ')
          ..write('name: $name, ')
          ..write('make: $make, ')
          ..write('model: $model, ')
          ..write('taxiLicensePlateNumber: $taxiLicensePlateNumber, ')
          ..write('yearOfFirstRegistration: $yearOfFirstRegistration, ')
          ..write('cachedAt: $cachedAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
    id,
    companyId,
    name,
    make,
    model,
    taxiLicensePlateNumber,
    yearOfFirstRegistration,
    cachedAt,
  );
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is VehiclesCacheData &&
          other.id == this.id &&
          other.companyId == this.companyId &&
          other.name == this.name &&
          other.make == this.make &&
          other.model == this.model &&
          other.taxiLicensePlateNumber == this.taxiLicensePlateNumber &&
          other.yearOfFirstRegistration == this.yearOfFirstRegistration &&
          other.cachedAt == this.cachedAt);
}

class VehiclesCacheCompanion extends UpdateCompanion<VehiclesCacheData> {
  final Value<String> id;
  final Value<String> companyId;
  final Value<String?> name;
  final Value<String?> make;
  final Value<String?> model;
  final Value<String> taxiLicensePlateNumber;
  final Value<String?> yearOfFirstRegistration;
  final Value<DateTime> cachedAt;
  final Value<int> rowid;
  const VehiclesCacheCompanion({
    this.id = const Value.absent(),
    this.companyId = const Value.absent(),
    this.name = const Value.absent(),
    this.make = const Value.absent(),
    this.model = const Value.absent(),
    this.taxiLicensePlateNumber = const Value.absent(),
    this.yearOfFirstRegistration = const Value.absent(),
    this.cachedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  VehiclesCacheCompanion.insert({
    required String id,
    required String companyId,
    this.name = const Value.absent(),
    this.make = const Value.absent(),
    this.model = const Value.absent(),
    required String taxiLicensePlateNumber,
    this.yearOfFirstRegistration = const Value.absent(),
    this.cachedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  }) : id = Value(id),
       companyId = Value(companyId),
       taxiLicensePlateNumber = Value(taxiLicensePlateNumber);
  static Insertable<VehiclesCacheData> custom({
    Expression<String>? id,
    Expression<String>? companyId,
    Expression<String>? name,
    Expression<String>? make,
    Expression<String>? model,
    Expression<String>? taxiLicensePlateNumber,
    Expression<String>? yearOfFirstRegistration,
    Expression<DateTime>? cachedAt,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (companyId != null) 'company_id': companyId,
      if (name != null) 'name': name,
      if (make != null) 'make': make,
      if (model != null) 'model': model,
      if (taxiLicensePlateNumber != null)
        'taxi_license_plate_number': taxiLicensePlateNumber,
      if (yearOfFirstRegistration != null)
        'year_of_first_registration': yearOfFirstRegistration,
      if (cachedAt != null) 'cached_at': cachedAt,
      if (rowid != null) 'rowid': rowid,
    });
  }

  VehiclesCacheCompanion copyWith({
    Value<String>? id,
    Value<String>? companyId,
    Value<String?>? name,
    Value<String?>? make,
    Value<String?>? model,
    Value<String>? taxiLicensePlateNumber,
    Value<String?>? yearOfFirstRegistration,
    Value<DateTime>? cachedAt,
    Value<int>? rowid,
  }) {
    return VehiclesCacheCompanion(
      id: id ?? this.id,
      companyId: companyId ?? this.companyId,
      name: name ?? this.name,
      make: make ?? this.make,
      model: model ?? this.model,
      taxiLicensePlateNumber:
          taxiLicensePlateNumber ?? this.taxiLicensePlateNumber,
      yearOfFirstRegistration:
          yearOfFirstRegistration ?? this.yearOfFirstRegistration,
      cachedAt: cachedAt ?? this.cachedAt,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (companyId.present) {
      map['company_id'] = Variable<String>(companyId.value);
    }
    if (name.present) {
      map['name'] = Variable<String>(name.value);
    }
    if (make.present) {
      map['make'] = Variable<String>(make.value);
    }
    if (model.present) {
      map['model'] = Variable<String>(model.value);
    }
    if (taxiLicensePlateNumber.present) {
      map['taxi_license_plate_number'] = Variable<String>(
        taxiLicensePlateNumber.value,
      );
    }
    if (yearOfFirstRegistration.present) {
      map['year_of_first_registration'] = Variable<String>(
        yearOfFirstRegistration.value,
      );
    }
    if (cachedAt.present) {
      map['cached_at'] = Variable<DateTime>(cachedAt.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('VehiclesCacheCompanion(')
          ..write('id: $id, ')
          ..write('companyId: $companyId, ')
          ..write('name: $name, ')
          ..write('make: $make, ')
          ..write('model: $model, ')
          ..write('taxiLicensePlateNumber: $taxiLicensePlateNumber, ')
          ..write('yearOfFirstRegistration: $yearOfFirstRegistration, ')
          ..write('cachedAt: $cachedAt, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $SessionsLocalTable extends SessionsLocal
    with TableInfo<$SessionsLocalTable, SessionsLocalData> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $SessionsLocalTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _localIdMeta = const VerificationMeta(
    'localId',
  );
  @override
  late final GeneratedColumn<String> localId = GeneratedColumn<String>(
    'local_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _serverIdMeta = const VerificationMeta(
    'serverId',
  );
  @override
  late final GeneratedColumn<String> serverId = GeneratedColumn<String>(
    'server_id',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _jobIdMeta = const VerificationMeta('jobId');
  @override
  late final GeneratedColumn<String> jobId = GeneratedColumn<String>(
    'job_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _sessionDateMeta = const VerificationMeta(
    'sessionDate',
  );
  @override
  late final GeneratedColumn<String> sessionDate = GeneratedColumn<String>(
    'session_date',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _directionMeta = const VerificationMeta(
    'direction',
  );
  @override
  late final GeneratedColumn<String> direction = GeneratedColumn<String>(
    'direction',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _statusMeta = const VerificationMeta('status');
  @override
  late final GeneratedColumn<String> status = GeneratedColumn<String>(
    'status',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
    defaultValue: const Constant('active'),
  );
  static const VerificationMeta _driverIdMeta = const VerificationMeta(
    'driverId',
  );
  @override
  late final GeneratedColumn<String> driverId = GeneratedColumn<String>(
    'driver_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _startedAtMeta = const VerificationMeta(
    'startedAt',
  );
  @override
  late final GeneratedColumn<DateTime> startedAt = GeneratedColumn<DateTime>(
    'started_at',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: false,
    defaultValue: currentDateAndTime,
  );
  static const VerificationMeta _completedAtMeta = const VerificationMeta(
    'completedAt',
  );
  @override
  late final GeneratedColumn<DateTime> completedAt = GeneratedColumn<DateTime>(
    'completed_at',
    aliasedName,
    true,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _noteMeta = const VerificationMeta('note');
  @override
  late final GeneratedColumn<String> note = GeneratedColumn<String>(
    'note',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _isSyncedMeta = const VerificationMeta(
    'isSynced',
  );
  @override
  late final GeneratedColumn<bool> isSynced = GeneratedColumn<bool>(
    'is_synced',
    aliasedName,
    false,
    type: DriftSqlType.bool,
    requiredDuringInsert: false,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'CHECK ("is_synced" IN (0, 1))',
    ),
    defaultValue: const Constant(false),
  );
  static const VerificationMeta _createdAtMeta = const VerificationMeta(
    'createdAt',
  );
  @override
  late final GeneratedColumn<DateTime> createdAt = GeneratedColumn<DateTime>(
    'created_at',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: false,
    defaultValue: currentDateAndTime,
  );
  static const VerificationMeta _updatedAtMeta = const VerificationMeta(
    'updatedAt',
  );
  @override
  late final GeneratedColumn<DateTime> updatedAt = GeneratedColumn<DateTime>(
    'updated_at',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: false,
    defaultValue: currentDateAndTime,
  );
  @override
  List<GeneratedColumn> get $columns => [
    localId,
    serverId,
    jobId,
    sessionDate,
    direction,
    status,
    driverId,
    startedAt,
    completedAt,
    note,
    isSynced,
    createdAt,
    updatedAt,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'sessions_local';
  @override
  VerificationContext validateIntegrity(
    Insertable<SessionsLocalData> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('local_id')) {
      context.handle(
        _localIdMeta,
        localId.isAcceptableOrUnknown(data['local_id']!, _localIdMeta),
      );
    } else if (isInserting) {
      context.missing(_localIdMeta);
    }
    if (data.containsKey('server_id')) {
      context.handle(
        _serverIdMeta,
        serverId.isAcceptableOrUnknown(data['server_id']!, _serverIdMeta),
      );
    }
    if (data.containsKey('job_id')) {
      context.handle(
        _jobIdMeta,
        jobId.isAcceptableOrUnknown(data['job_id']!, _jobIdMeta),
      );
    } else if (isInserting) {
      context.missing(_jobIdMeta);
    }
    if (data.containsKey('session_date')) {
      context.handle(
        _sessionDateMeta,
        sessionDate.isAcceptableOrUnknown(
          data['session_date']!,
          _sessionDateMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_sessionDateMeta);
    }
    if (data.containsKey('direction')) {
      context.handle(
        _directionMeta,
        direction.isAcceptableOrUnknown(data['direction']!, _directionMeta),
      );
    } else if (isInserting) {
      context.missing(_directionMeta);
    }
    if (data.containsKey('status')) {
      context.handle(
        _statusMeta,
        status.isAcceptableOrUnknown(data['status']!, _statusMeta),
      );
    }
    if (data.containsKey('driver_id')) {
      context.handle(
        _driverIdMeta,
        driverId.isAcceptableOrUnknown(data['driver_id']!, _driverIdMeta),
      );
    } else if (isInserting) {
      context.missing(_driverIdMeta);
    }
    if (data.containsKey('started_at')) {
      context.handle(
        _startedAtMeta,
        startedAt.isAcceptableOrUnknown(data['started_at']!, _startedAtMeta),
      );
    }
    if (data.containsKey('completed_at')) {
      context.handle(
        _completedAtMeta,
        completedAt.isAcceptableOrUnknown(
          data['completed_at']!,
          _completedAtMeta,
        ),
      );
    }
    if (data.containsKey('note')) {
      context.handle(
        _noteMeta,
        note.isAcceptableOrUnknown(data['note']!, _noteMeta),
      );
    }
    if (data.containsKey('is_synced')) {
      context.handle(
        _isSyncedMeta,
        isSynced.isAcceptableOrUnknown(data['is_synced']!, _isSyncedMeta),
      );
    }
    if (data.containsKey('created_at')) {
      context.handle(
        _createdAtMeta,
        createdAt.isAcceptableOrUnknown(data['created_at']!, _createdAtMeta),
      );
    }
    if (data.containsKey('updated_at')) {
      context.handle(
        _updatedAtMeta,
        updatedAt.isAcceptableOrUnknown(data['updated_at']!, _updatedAtMeta),
      );
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {localId};
  @override
  SessionsLocalData map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return SessionsLocalData(
      localId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}local_id'],
      )!,
      serverId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}server_id'],
      ),
      jobId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}job_id'],
      )!,
      sessionDate: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}session_date'],
      )!,
      direction: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}direction'],
      )!,
      status: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}status'],
      )!,
      driverId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}driver_id'],
      )!,
      startedAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}started_at'],
      )!,
      completedAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}completed_at'],
      ),
      note: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}note'],
      ),
      isSynced: attachedDatabase.typeMapping.read(
        DriftSqlType.bool,
        data['${effectivePrefix}is_synced'],
      )!,
      createdAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}created_at'],
      )!,
      updatedAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}updated_at'],
      )!,
    );
  }

  @override
  $SessionsLocalTable createAlias(String alias) {
    return $SessionsLocalTable(attachedDatabase, alias);
  }
}

class SessionsLocalData extends DataClass
    implements Insertable<SessionsLocalData> {
  final String localId;
  final String? serverId;
  final String jobId;
  final String sessionDate;
  final String direction;
  final String status;
  final String driverId;
  final DateTime startedAt;
  final DateTime? completedAt;
  final String? note;
  final bool isSynced;
  final DateTime createdAt;
  final DateTime updatedAt;
  const SessionsLocalData({
    required this.localId,
    this.serverId,
    required this.jobId,
    required this.sessionDate,
    required this.direction,
    required this.status,
    required this.driverId,
    required this.startedAt,
    this.completedAt,
    this.note,
    required this.isSynced,
    required this.createdAt,
    required this.updatedAt,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['local_id'] = Variable<String>(localId);
    if (!nullToAbsent || serverId != null) {
      map['server_id'] = Variable<String>(serverId);
    }
    map['job_id'] = Variable<String>(jobId);
    map['session_date'] = Variable<String>(sessionDate);
    map['direction'] = Variable<String>(direction);
    map['status'] = Variable<String>(status);
    map['driver_id'] = Variable<String>(driverId);
    map['started_at'] = Variable<DateTime>(startedAt);
    if (!nullToAbsent || completedAt != null) {
      map['completed_at'] = Variable<DateTime>(completedAt);
    }
    if (!nullToAbsent || note != null) {
      map['note'] = Variable<String>(note);
    }
    map['is_synced'] = Variable<bool>(isSynced);
    map['created_at'] = Variable<DateTime>(createdAt);
    map['updated_at'] = Variable<DateTime>(updatedAt);
    return map;
  }

  SessionsLocalCompanion toCompanion(bool nullToAbsent) {
    return SessionsLocalCompanion(
      localId: Value(localId),
      serverId: serverId == null && nullToAbsent
          ? const Value.absent()
          : Value(serverId),
      jobId: Value(jobId),
      sessionDate: Value(sessionDate),
      direction: Value(direction),
      status: Value(status),
      driverId: Value(driverId),
      startedAt: Value(startedAt),
      completedAt: completedAt == null && nullToAbsent
          ? const Value.absent()
          : Value(completedAt),
      note: note == null && nullToAbsent ? const Value.absent() : Value(note),
      isSynced: Value(isSynced),
      createdAt: Value(createdAt),
      updatedAt: Value(updatedAt),
    );
  }

  factory SessionsLocalData.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return SessionsLocalData(
      localId: serializer.fromJson<String>(json['localId']),
      serverId: serializer.fromJson<String?>(json['serverId']),
      jobId: serializer.fromJson<String>(json['jobId']),
      sessionDate: serializer.fromJson<String>(json['sessionDate']),
      direction: serializer.fromJson<String>(json['direction']),
      status: serializer.fromJson<String>(json['status']),
      driverId: serializer.fromJson<String>(json['driverId']),
      startedAt: serializer.fromJson<DateTime>(json['startedAt']),
      completedAt: serializer.fromJson<DateTime?>(json['completedAt']),
      note: serializer.fromJson<String?>(json['note']),
      isSynced: serializer.fromJson<bool>(json['isSynced']),
      createdAt: serializer.fromJson<DateTime>(json['createdAt']),
      updatedAt: serializer.fromJson<DateTime>(json['updatedAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'localId': serializer.toJson<String>(localId),
      'serverId': serializer.toJson<String?>(serverId),
      'jobId': serializer.toJson<String>(jobId),
      'sessionDate': serializer.toJson<String>(sessionDate),
      'direction': serializer.toJson<String>(direction),
      'status': serializer.toJson<String>(status),
      'driverId': serializer.toJson<String>(driverId),
      'startedAt': serializer.toJson<DateTime>(startedAt),
      'completedAt': serializer.toJson<DateTime?>(completedAt),
      'note': serializer.toJson<String?>(note),
      'isSynced': serializer.toJson<bool>(isSynced),
      'createdAt': serializer.toJson<DateTime>(createdAt),
      'updatedAt': serializer.toJson<DateTime>(updatedAt),
    };
  }

  SessionsLocalData copyWith({
    String? localId,
    Value<String?> serverId = const Value.absent(),
    String? jobId,
    String? sessionDate,
    String? direction,
    String? status,
    String? driverId,
    DateTime? startedAt,
    Value<DateTime?> completedAt = const Value.absent(),
    Value<String?> note = const Value.absent(),
    bool? isSynced,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) => SessionsLocalData(
    localId: localId ?? this.localId,
    serverId: serverId.present ? serverId.value : this.serverId,
    jobId: jobId ?? this.jobId,
    sessionDate: sessionDate ?? this.sessionDate,
    direction: direction ?? this.direction,
    status: status ?? this.status,
    driverId: driverId ?? this.driverId,
    startedAt: startedAt ?? this.startedAt,
    completedAt: completedAt.present ? completedAt.value : this.completedAt,
    note: note.present ? note.value : this.note,
    isSynced: isSynced ?? this.isSynced,
    createdAt: createdAt ?? this.createdAt,
    updatedAt: updatedAt ?? this.updatedAt,
  );
  SessionsLocalData copyWithCompanion(SessionsLocalCompanion data) {
    return SessionsLocalData(
      localId: data.localId.present ? data.localId.value : this.localId,
      serverId: data.serverId.present ? data.serverId.value : this.serverId,
      jobId: data.jobId.present ? data.jobId.value : this.jobId,
      sessionDate: data.sessionDate.present
          ? data.sessionDate.value
          : this.sessionDate,
      direction: data.direction.present ? data.direction.value : this.direction,
      status: data.status.present ? data.status.value : this.status,
      driverId: data.driverId.present ? data.driverId.value : this.driverId,
      startedAt: data.startedAt.present ? data.startedAt.value : this.startedAt,
      completedAt: data.completedAt.present
          ? data.completedAt.value
          : this.completedAt,
      note: data.note.present ? data.note.value : this.note,
      isSynced: data.isSynced.present ? data.isSynced.value : this.isSynced,
      createdAt: data.createdAt.present ? data.createdAt.value : this.createdAt,
      updatedAt: data.updatedAt.present ? data.updatedAt.value : this.updatedAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('SessionsLocalData(')
          ..write('localId: $localId, ')
          ..write('serverId: $serverId, ')
          ..write('jobId: $jobId, ')
          ..write('sessionDate: $sessionDate, ')
          ..write('direction: $direction, ')
          ..write('status: $status, ')
          ..write('driverId: $driverId, ')
          ..write('startedAt: $startedAt, ')
          ..write('completedAt: $completedAt, ')
          ..write('note: $note, ')
          ..write('isSynced: $isSynced, ')
          ..write('createdAt: $createdAt, ')
          ..write('updatedAt: $updatedAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
    localId,
    serverId,
    jobId,
    sessionDate,
    direction,
    status,
    driverId,
    startedAt,
    completedAt,
    note,
    isSynced,
    createdAt,
    updatedAt,
  );
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is SessionsLocalData &&
          other.localId == this.localId &&
          other.serverId == this.serverId &&
          other.jobId == this.jobId &&
          other.sessionDate == this.sessionDate &&
          other.direction == this.direction &&
          other.status == this.status &&
          other.driverId == this.driverId &&
          other.startedAt == this.startedAt &&
          other.completedAt == this.completedAt &&
          other.note == this.note &&
          other.isSynced == this.isSynced &&
          other.createdAt == this.createdAt &&
          other.updatedAt == this.updatedAt);
}

class SessionsLocalCompanion extends UpdateCompanion<SessionsLocalData> {
  final Value<String> localId;
  final Value<String?> serverId;
  final Value<String> jobId;
  final Value<String> sessionDate;
  final Value<String> direction;
  final Value<String> status;
  final Value<String> driverId;
  final Value<DateTime> startedAt;
  final Value<DateTime?> completedAt;
  final Value<String?> note;
  final Value<bool> isSynced;
  final Value<DateTime> createdAt;
  final Value<DateTime> updatedAt;
  final Value<int> rowid;
  const SessionsLocalCompanion({
    this.localId = const Value.absent(),
    this.serverId = const Value.absent(),
    this.jobId = const Value.absent(),
    this.sessionDate = const Value.absent(),
    this.direction = const Value.absent(),
    this.status = const Value.absent(),
    this.driverId = const Value.absent(),
    this.startedAt = const Value.absent(),
    this.completedAt = const Value.absent(),
    this.note = const Value.absent(),
    this.isSynced = const Value.absent(),
    this.createdAt = const Value.absent(),
    this.updatedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  SessionsLocalCompanion.insert({
    required String localId,
    this.serverId = const Value.absent(),
    required String jobId,
    required String sessionDate,
    required String direction,
    this.status = const Value.absent(),
    required String driverId,
    this.startedAt = const Value.absent(),
    this.completedAt = const Value.absent(),
    this.note = const Value.absent(),
    this.isSynced = const Value.absent(),
    this.createdAt = const Value.absent(),
    this.updatedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  }) : localId = Value(localId),
       jobId = Value(jobId),
       sessionDate = Value(sessionDate),
       direction = Value(direction),
       driverId = Value(driverId);
  static Insertable<SessionsLocalData> custom({
    Expression<String>? localId,
    Expression<String>? serverId,
    Expression<String>? jobId,
    Expression<String>? sessionDate,
    Expression<String>? direction,
    Expression<String>? status,
    Expression<String>? driverId,
    Expression<DateTime>? startedAt,
    Expression<DateTime>? completedAt,
    Expression<String>? note,
    Expression<bool>? isSynced,
    Expression<DateTime>? createdAt,
    Expression<DateTime>? updatedAt,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (localId != null) 'local_id': localId,
      if (serverId != null) 'server_id': serverId,
      if (jobId != null) 'job_id': jobId,
      if (sessionDate != null) 'session_date': sessionDate,
      if (direction != null) 'direction': direction,
      if (status != null) 'status': status,
      if (driverId != null) 'driver_id': driverId,
      if (startedAt != null) 'started_at': startedAt,
      if (completedAt != null) 'completed_at': completedAt,
      if (note != null) 'note': note,
      if (isSynced != null) 'is_synced': isSynced,
      if (createdAt != null) 'created_at': createdAt,
      if (updatedAt != null) 'updated_at': updatedAt,
      if (rowid != null) 'rowid': rowid,
    });
  }

  SessionsLocalCompanion copyWith({
    Value<String>? localId,
    Value<String?>? serverId,
    Value<String>? jobId,
    Value<String>? sessionDate,
    Value<String>? direction,
    Value<String>? status,
    Value<String>? driverId,
    Value<DateTime>? startedAt,
    Value<DateTime?>? completedAt,
    Value<String?>? note,
    Value<bool>? isSynced,
    Value<DateTime>? createdAt,
    Value<DateTime>? updatedAt,
    Value<int>? rowid,
  }) {
    return SessionsLocalCompanion(
      localId: localId ?? this.localId,
      serverId: serverId ?? this.serverId,
      jobId: jobId ?? this.jobId,
      sessionDate: sessionDate ?? this.sessionDate,
      direction: direction ?? this.direction,
      status: status ?? this.status,
      driverId: driverId ?? this.driverId,
      startedAt: startedAt ?? this.startedAt,
      completedAt: completedAt ?? this.completedAt,
      note: note ?? this.note,
      isSynced: isSynced ?? this.isSynced,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (localId.present) {
      map['local_id'] = Variable<String>(localId.value);
    }
    if (serverId.present) {
      map['server_id'] = Variable<String>(serverId.value);
    }
    if (jobId.present) {
      map['job_id'] = Variable<String>(jobId.value);
    }
    if (sessionDate.present) {
      map['session_date'] = Variable<String>(sessionDate.value);
    }
    if (direction.present) {
      map['direction'] = Variable<String>(direction.value);
    }
    if (status.present) {
      map['status'] = Variable<String>(status.value);
    }
    if (driverId.present) {
      map['driver_id'] = Variable<String>(driverId.value);
    }
    if (startedAt.present) {
      map['started_at'] = Variable<DateTime>(startedAt.value);
    }
    if (completedAt.present) {
      map['completed_at'] = Variable<DateTime>(completedAt.value);
    }
    if (note.present) {
      map['note'] = Variable<String>(note.value);
    }
    if (isSynced.present) {
      map['is_synced'] = Variable<bool>(isSynced.value);
    }
    if (createdAt.present) {
      map['created_at'] = Variable<DateTime>(createdAt.value);
    }
    if (updatedAt.present) {
      map['updated_at'] = Variable<DateTime>(updatedAt.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('SessionsLocalCompanion(')
          ..write('localId: $localId, ')
          ..write('serverId: $serverId, ')
          ..write('jobId: $jobId, ')
          ..write('sessionDate: $sessionDate, ')
          ..write('direction: $direction, ')
          ..write('status: $status, ')
          ..write('driverId: $driverId, ')
          ..write('startedAt: $startedAt, ')
          ..write('completedAt: $completedAt, ')
          ..write('note: $note, ')
          ..write('isSynced: $isSynced, ')
          ..write('createdAt: $createdAt, ')
          ..write('updatedAt: $updatedAt, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $PassengersLocalTable extends PassengersLocal
    with TableInfo<$PassengersLocalTable, PassengersLocalData> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $PassengersLocalTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _localIdMeta = const VerificationMeta(
    'localId',
  );
  @override
  late final GeneratedColumn<String> localId = GeneratedColumn<String>(
    'local_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _serverIdMeta = const VerificationMeta(
    'serverId',
  );
  @override
  late final GeneratedColumn<String> serverId = GeneratedColumn<String>(
    'server_id',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _localSessionIdMeta = const VerificationMeta(
    'localSessionId',
  );
  @override
  late final GeneratedColumn<String> localSessionId = GeneratedColumn<String>(
    'local_session_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _passengerIdMeta = const VerificationMeta(
    'passengerId',
  );
  @override
  late final GeneratedColumn<String> passengerId = GeneratedColumn<String>(
    'passenger_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _stopOrderMeta = const VerificationMeta(
    'stopOrder',
  );
  @override
  late final GeneratedColumn<int> stopOrder = GeneratedColumn<int>(
    'stop_order',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _statusMeta = const VerificationMeta('status');
  @override
  late final GeneratedColumn<String> status = GeneratedColumn<String>(
    'status',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
    defaultValue: const Constant('pending'),
  );
  static const VerificationMeta _pickupAddressMeta = const VerificationMeta(
    'pickupAddress',
  );
  @override
  late final GeneratedColumn<String> pickupAddress = GeneratedColumn<String>(
    'pickup_address',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _pickupPostcodeMeta = const VerificationMeta(
    'pickupPostcode',
  );
  @override
  late final GeneratedColumn<String> pickupPostcode = GeneratedColumn<String>(
    'pickup_postcode',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _pickupLatitudeMeta = const VerificationMeta(
    'pickupLatitude',
  );
  @override
  late final GeneratedColumn<double> pickupLatitude = GeneratedColumn<double>(
    'pickup_latitude',
    aliasedName,
    true,
    type: DriftSqlType.double,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _pickupLongitudeMeta = const VerificationMeta(
    'pickupLongitude',
  );
  @override
  late final GeneratedColumn<double> pickupLongitude = GeneratedColumn<double>(
    'pickup_longitude',
    aliasedName,
    true,
    type: DriftSqlType.double,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _dropoffAddressMeta = const VerificationMeta(
    'dropoffAddress',
  );
  @override
  late final GeneratedColumn<String> dropoffAddress = GeneratedColumn<String>(
    'dropoff_address',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _dropoffPostcodeMeta = const VerificationMeta(
    'dropoffPostcode',
  );
  @override
  late final GeneratedColumn<String> dropoffPostcode = GeneratedColumn<String>(
    'dropoff_postcode',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _pickedUpAtMeta = const VerificationMeta(
    'pickedUpAt',
  );
  @override
  late final GeneratedColumn<DateTime> pickedUpAt = GeneratedColumn<DateTime>(
    'picked_up_at',
    aliasedName,
    true,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _droppedOffAtMeta = const VerificationMeta(
    'droppedOffAt',
  );
  @override
  late final GeneratedColumn<DateTime> droppedOffAt = GeneratedColumn<DateTime>(
    'dropped_off_at',
    aliasedName,
    true,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _notesMeta = const VerificationMeta('notes');
  @override
  late final GeneratedColumn<String> notes = GeneratedColumn<String>(
    'notes',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _isSyncedMeta = const VerificationMeta(
    'isSynced',
  );
  @override
  late final GeneratedColumn<bool> isSynced = GeneratedColumn<bool>(
    'is_synced',
    aliasedName,
    false,
    type: DriftSqlType.bool,
    requiredDuringInsert: false,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'CHECK ("is_synced" IN (0, 1))',
    ),
    defaultValue: const Constant(false),
  );
  static const VerificationMeta _createdAtMeta = const VerificationMeta(
    'createdAt',
  );
  @override
  late final GeneratedColumn<DateTime> createdAt = GeneratedColumn<DateTime>(
    'created_at',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: false,
    defaultValue: currentDateAndTime,
  );
  static const VerificationMeta _updatedAtMeta = const VerificationMeta(
    'updatedAt',
  );
  @override
  late final GeneratedColumn<DateTime> updatedAt = GeneratedColumn<DateTime>(
    'updated_at',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: false,
    defaultValue: currentDateAndTime,
  );
  @override
  List<GeneratedColumn> get $columns => [
    localId,
    serverId,
    localSessionId,
    passengerId,
    stopOrder,
    status,
    pickupAddress,
    pickupPostcode,
    pickupLatitude,
    pickupLongitude,
    dropoffAddress,
    dropoffPostcode,
    pickedUpAt,
    droppedOffAt,
    notes,
    isSynced,
    createdAt,
    updatedAt,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'passengers_local';
  @override
  VerificationContext validateIntegrity(
    Insertable<PassengersLocalData> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('local_id')) {
      context.handle(
        _localIdMeta,
        localId.isAcceptableOrUnknown(data['local_id']!, _localIdMeta),
      );
    } else if (isInserting) {
      context.missing(_localIdMeta);
    }
    if (data.containsKey('server_id')) {
      context.handle(
        _serverIdMeta,
        serverId.isAcceptableOrUnknown(data['server_id']!, _serverIdMeta),
      );
    }
    if (data.containsKey('local_session_id')) {
      context.handle(
        _localSessionIdMeta,
        localSessionId.isAcceptableOrUnknown(
          data['local_session_id']!,
          _localSessionIdMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_localSessionIdMeta);
    }
    if (data.containsKey('passenger_id')) {
      context.handle(
        _passengerIdMeta,
        passengerId.isAcceptableOrUnknown(
          data['passenger_id']!,
          _passengerIdMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_passengerIdMeta);
    }
    if (data.containsKey('stop_order')) {
      context.handle(
        _stopOrderMeta,
        stopOrder.isAcceptableOrUnknown(data['stop_order']!, _stopOrderMeta),
      );
    } else if (isInserting) {
      context.missing(_stopOrderMeta);
    }
    if (data.containsKey('status')) {
      context.handle(
        _statusMeta,
        status.isAcceptableOrUnknown(data['status']!, _statusMeta),
      );
    }
    if (data.containsKey('pickup_address')) {
      context.handle(
        _pickupAddressMeta,
        pickupAddress.isAcceptableOrUnknown(
          data['pickup_address']!,
          _pickupAddressMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_pickupAddressMeta);
    }
    if (data.containsKey('pickup_postcode')) {
      context.handle(
        _pickupPostcodeMeta,
        pickupPostcode.isAcceptableOrUnknown(
          data['pickup_postcode']!,
          _pickupPostcodeMeta,
        ),
      );
    }
    if (data.containsKey('pickup_latitude')) {
      context.handle(
        _pickupLatitudeMeta,
        pickupLatitude.isAcceptableOrUnknown(
          data['pickup_latitude']!,
          _pickupLatitudeMeta,
        ),
      );
    }
    if (data.containsKey('pickup_longitude')) {
      context.handle(
        _pickupLongitudeMeta,
        pickupLongitude.isAcceptableOrUnknown(
          data['pickup_longitude']!,
          _pickupLongitudeMeta,
        ),
      );
    }
    if (data.containsKey('dropoff_address')) {
      context.handle(
        _dropoffAddressMeta,
        dropoffAddress.isAcceptableOrUnknown(
          data['dropoff_address']!,
          _dropoffAddressMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_dropoffAddressMeta);
    }
    if (data.containsKey('dropoff_postcode')) {
      context.handle(
        _dropoffPostcodeMeta,
        dropoffPostcode.isAcceptableOrUnknown(
          data['dropoff_postcode']!,
          _dropoffPostcodeMeta,
        ),
      );
    }
    if (data.containsKey('picked_up_at')) {
      context.handle(
        _pickedUpAtMeta,
        pickedUpAt.isAcceptableOrUnknown(
          data['picked_up_at']!,
          _pickedUpAtMeta,
        ),
      );
    }
    if (data.containsKey('dropped_off_at')) {
      context.handle(
        _droppedOffAtMeta,
        droppedOffAt.isAcceptableOrUnknown(
          data['dropped_off_at']!,
          _droppedOffAtMeta,
        ),
      );
    }
    if (data.containsKey('notes')) {
      context.handle(
        _notesMeta,
        notes.isAcceptableOrUnknown(data['notes']!, _notesMeta),
      );
    }
    if (data.containsKey('is_synced')) {
      context.handle(
        _isSyncedMeta,
        isSynced.isAcceptableOrUnknown(data['is_synced']!, _isSyncedMeta),
      );
    }
    if (data.containsKey('created_at')) {
      context.handle(
        _createdAtMeta,
        createdAt.isAcceptableOrUnknown(data['created_at']!, _createdAtMeta),
      );
    }
    if (data.containsKey('updated_at')) {
      context.handle(
        _updatedAtMeta,
        updatedAt.isAcceptableOrUnknown(data['updated_at']!, _updatedAtMeta),
      );
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {localId};
  @override
  PassengersLocalData map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return PassengersLocalData(
      localId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}local_id'],
      )!,
      serverId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}server_id'],
      ),
      localSessionId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}local_session_id'],
      )!,
      passengerId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}passenger_id'],
      )!,
      stopOrder: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}stop_order'],
      )!,
      status: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}status'],
      )!,
      pickupAddress: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}pickup_address'],
      )!,
      pickupPostcode: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}pickup_postcode'],
      ),
      pickupLatitude: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}pickup_latitude'],
      ),
      pickupLongitude: attachedDatabase.typeMapping.read(
        DriftSqlType.double,
        data['${effectivePrefix}pickup_longitude'],
      ),
      dropoffAddress: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}dropoff_address'],
      )!,
      dropoffPostcode: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}dropoff_postcode'],
      ),
      pickedUpAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}picked_up_at'],
      ),
      droppedOffAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}dropped_off_at'],
      ),
      notes: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}notes'],
      ),
      isSynced: attachedDatabase.typeMapping.read(
        DriftSqlType.bool,
        data['${effectivePrefix}is_synced'],
      )!,
      createdAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}created_at'],
      )!,
      updatedAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}updated_at'],
      )!,
    );
  }

  @override
  $PassengersLocalTable createAlias(String alias) {
    return $PassengersLocalTable(attachedDatabase, alias);
  }
}

class PassengersLocalData extends DataClass
    implements Insertable<PassengersLocalData> {
  final String localId;
  final String? serverId;
  final String localSessionId;
  final String passengerId;
  final int stopOrder;
  final String status;
  final String pickupAddress;
  final String? pickupPostcode;
  final double? pickupLatitude;
  final double? pickupLongitude;
  final String dropoffAddress;
  final String? dropoffPostcode;
  final DateTime? pickedUpAt;
  final DateTime? droppedOffAt;
  final String? notes;
  final bool isSynced;
  final DateTime createdAt;
  final DateTime updatedAt;
  const PassengersLocalData({
    required this.localId,
    this.serverId,
    required this.localSessionId,
    required this.passengerId,
    required this.stopOrder,
    required this.status,
    required this.pickupAddress,
    this.pickupPostcode,
    this.pickupLatitude,
    this.pickupLongitude,
    required this.dropoffAddress,
    this.dropoffPostcode,
    this.pickedUpAt,
    this.droppedOffAt,
    this.notes,
    required this.isSynced,
    required this.createdAt,
    required this.updatedAt,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['local_id'] = Variable<String>(localId);
    if (!nullToAbsent || serverId != null) {
      map['server_id'] = Variable<String>(serverId);
    }
    map['local_session_id'] = Variable<String>(localSessionId);
    map['passenger_id'] = Variable<String>(passengerId);
    map['stop_order'] = Variable<int>(stopOrder);
    map['status'] = Variable<String>(status);
    map['pickup_address'] = Variable<String>(pickupAddress);
    if (!nullToAbsent || pickupPostcode != null) {
      map['pickup_postcode'] = Variable<String>(pickupPostcode);
    }
    if (!nullToAbsent || pickupLatitude != null) {
      map['pickup_latitude'] = Variable<double>(pickupLatitude);
    }
    if (!nullToAbsent || pickupLongitude != null) {
      map['pickup_longitude'] = Variable<double>(pickupLongitude);
    }
    map['dropoff_address'] = Variable<String>(dropoffAddress);
    if (!nullToAbsent || dropoffPostcode != null) {
      map['dropoff_postcode'] = Variable<String>(dropoffPostcode);
    }
    if (!nullToAbsent || pickedUpAt != null) {
      map['picked_up_at'] = Variable<DateTime>(pickedUpAt);
    }
    if (!nullToAbsent || droppedOffAt != null) {
      map['dropped_off_at'] = Variable<DateTime>(droppedOffAt);
    }
    if (!nullToAbsent || notes != null) {
      map['notes'] = Variable<String>(notes);
    }
    map['is_synced'] = Variable<bool>(isSynced);
    map['created_at'] = Variable<DateTime>(createdAt);
    map['updated_at'] = Variable<DateTime>(updatedAt);
    return map;
  }

  PassengersLocalCompanion toCompanion(bool nullToAbsent) {
    return PassengersLocalCompanion(
      localId: Value(localId),
      serverId: serverId == null && nullToAbsent
          ? const Value.absent()
          : Value(serverId),
      localSessionId: Value(localSessionId),
      passengerId: Value(passengerId),
      stopOrder: Value(stopOrder),
      status: Value(status),
      pickupAddress: Value(pickupAddress),
      pickupPostcode: pickupPostcode == null && nullToAbsent
          ? const Value.absent()
          : Value(pickupPostcode),
      pickupLatitude: pickupLatitude == null && nullToAbsent
          ? const Value.absent()
          : Value(pickupLatitude),
      pickupLongitude: pickupLongitude == null && nullToAbsent
          ? const Value.absent()
          : Value(pickupLongitude),
      dropoffAddress: Value(dropoffAddress),
      dropoffPostcode: dropoffPostcode == null && nullToAbsent
          ? const Value.absent()
          : Value(dropoffPostcode),
      pickedUpAt: pickedUpAt == null && nullToAbsent
          ? const Value.absent()
          : Value(pickedUpAt),
      droppedOffAt: droppedOffAt == null && nullToAbsent
          ? const Value.absent()
          : Value(droppedOffAt),
      notes: notes == null && nullToAbsent
          ? const Value.absent()
          : Value(notes),
      isSynced: Value(isSynced),
      createdAt: Value(createdAt),
      updatedAt: Value(updatedAt),
    );
  }

  factory PassengersLocalData.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return PassengersLocalData(
      localId: serializer.fromJson<String>(json['localId']),
      serverId: serializer.fromJson<String?>(json['serverId']),
      localSessionId: serializer.fromJson<String>(json['localSessionId']),
      passengerId: serializer.fromJson<String>(json['passengerId']),
      stopOrder: serializer.fromJson<int>(json['stopOrder']),
      status: serializer.fromJson<String>(json['status']),
      pickupAddress: serializer.fromJson<String>(json['pickupAddress']),
      pickupPostcode: serializer.fromJson<String?>(json['pickupPostcode']),
      pickupLatitude: serializer.fromJson<double?>(json['pickupLatitude']),
      pickupLongitude: serializer.fromJson<double?>(json['pickupLongitude']),
      dropoffAddress: serializer.fromJson<String>(json['dropoffAddress']),
      dropoffPostcode: serializer.fromJson<String?>(json['dropoffPostcode']),
      pickedUpAt: serializer.fromJson<DateTime?>(json['pickedUpAt']),
      droppedOffAt: serializer.fromJson<DateTime?>(json['droppedOffAt']),
      notes: serializer.fromJson<String?>(json['notes']),
      isSynced: serializer.fromJson<bool>(json['isSynced']),
      createdAt: serializer.fromJson<DateTime>(json['createdAt']),
      updatedAt: serializer.fromJson<DateTime>(json['updatedAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'localId': serializer.toJson<String>(localId),
      'serverId': serializer.toJson<String?>(serverId),
      'localSessionId': serializer.toJson<String>(localSessionId),
      'passengerId': serializer.toJson<String>(passengerId),
      'stopOrder': serializer.toJson<int>(stopOrder),
      'status': serializer.toJson<String>(status),
      'pickupAddress': serializer.toJson<String>(pickupAddress),
      'pickupPostcode': serializer.toJson<String?>(pickupPostcode),
      'pickupLatitude': serializer.toJson<double?>(pickupLatitude),
      'pickupLongitude': serializer.toJson<double?>(pickupLongitude),
      'dropoffAddress': serializer.toJson<String>(dropoffAddress),
      'dropoffPostcode': serializer.toJson<String?>(dropoffPostcode),
      'pickedUpAt': serializer.toJson<DateTime?>(pickedUpAt),
      'droppedOffAt': serializer.toJson<DateTime?>(droppedOffAt),
      'notes': serializer.toJson<String?>(notes),
      'isSynced': serializer.toJson<bool>(isSynced),
      'createdAt': serializer.toJson<DateTime>(createdAt),
      'updatedAt': serializer.toJson<DateTime>(updatedAt),
    };
  }

  PassengersLocalData copyWith({
    String? localId,
    Value<String?> serverId = const Value.absent(),
    String? localSessionId,
    String? passengerId,
    int? stopOrder,
    String? status,
    String? pickupAddress,
    Value<String?> pickupPostcode = const Value.absent(),
    Value<double?> pickupLatitude = const Value.absent(),
    Value<double?> pickupLongitude = const Value.absent(),
    String? dropoffAddress,
    Value<String?> dropoffPostcode = const Value.absent(),
    Value<DateTime?> pickedUpAt = const Value.absent(),
    Value<DateTime?> droppedOffAt = const Value.absent(),
    Value<String?> notes = const Value.absent(),
    bool? isSynced,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) => PassengersLocalData(
    localId: localId ?? this.localId,
    serverId: serverId.present ? serverId.value : this.serverId,
    localSessionId: localSessionId ?? this.localSessionId,
    passengerId: passengerId ?? this.passengerId,
    stopOrder: stopOrder ?? this.stopOrder,
    status: status ?? this.status,
    pickupAddress: pickupAddress ?? this.pickupAddress,
    pickupPostcode: pickupPostcode.present
        ? pickupPostcode.value
        : this.pickupPostcode,
    pickupLatitude: pickupLatitude.present
        ? pickupLatitude.value
        : this.pickupLatitude,
    pickupLongitude: pickupLongitude.present
        ? pickupLongitude.value
        : this.pickupLongitude,
    dropoffAddress: dropoffAddress ?? this.dropoffAddress,
    dropoffPostcode: dropoffPostcode.present
        ? dropoffPostcode.value
        : this.dropoffPostcode,
    pickedUpAt: pickedUpAt.present ? pickedUpAt.value : this.pickedUpAt,
    droppedOffAt: droppedOffAt.present ? droppedOffAt.value : this.droppedOffAt,
    notes: notes.present ? notes.value : this.notes,
    isSynced: isSynced ?? this.isSynced,
    createdAt: createdAt ?? this.createdAt,
    updatedAt: updatedAt ?? this.updatedAt,
  );
  PassengersLocalData copyWithCompanion(PassengersLocalCompanion data) {
    return PassengersLocalData(
      localId: data.localId.present ? data.localId.value : this.localId,
      serverId: data.serverId.present ? data.serverId.value : this.serverId,
      localSessionId: data.localSessionId.present
          ? data.localSessionId.value
          : this.localSessionId,
      passengerId: data.passengerId.present
          ? data.passengerId.value
          : this.passengerId,
      stopOrder: data.stopOrder.present ? data.stopOrder.value : this.stopOrder,
      status: data.status.present ? data.status.value : this.status,
      pickupAddress: data.pickupAddress.present
          ? data.pickupAddress.value
          : this.pickupAddress,
      pickupPostcode: data.pickupPostcode.present
          ? data.pickupPostcode.value
          : this.pickupPostcode,
      pickupLatitude: data.pickupLatitude.present
          ? data.pickupLatitude.value
          : this.pickupLatitude,
      pickupLongitude: data.pickupLongitude.present
          ? data.pickupLongitude.value
          : this.pickupLongitude,
      dropoffAddress: data.dropoffAddress.present
          ? data.dropoffAddress.value
          : this.dropoffAddress,
      dropoffPostcode: data.dropoffPostcode.present
          ? data.dropoffPostcode.value
          : this.dropoffPostcode,
      pickedUpAt: data.pickedUpAt.present
          ? data.pickedUpAt.value
          : this.pickedUpAt,
      droppedOffAt: data.droppedOffAt.present
          ? data.droppedOffAt.value
          : this.droppedOffAt,
      notes: data.notes.present ? data.notes.value : this.notes,
      isSynced: data.isSynced.present ? data.isSynced.value : this.isSynced,
      createdAt: data.createdAt.present ? data.createdAt.value : this.createdAt,
      updatedAt: data.updatedAt.present ? data.updatedAt.value : this.updatedAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('PassengersLocalData(')
          ..write('localId: $localId, ')
          ..write('serverId: $serverId, ')
          ..write('localSessionId: $localSessionId, ')
          ..write('passengerId: $passengerId, ')
          ..write('stopOrder: $stopOrder, ')
          ..write('status: $status, ')
          ..write('pickupAddress: $pickupAddress, ')
          ..write('pickupPostcode: $pickupPostcode, ')
          ..write('pickupLatitude: $pickupLatitude, ')
          ..write('pickupLongitude: $pickupLongitude, ')
          ..write('dropoffAddress: $dropoffAddress, ')
          ..write('dropoffPostcode: $dropoffPostcode, ')
          ..write('pickedUpAt: $pickedUpAt, ')
          ..write('droppedOffAt: $droppedOffAt, ')
          ..write('notes: $notes, ')
          ..write('isSynced: $isSynced, ')
          ..write('createdAt: $createdAt, ')
          ..write('updatedAt: $updatedAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
    localId,
    serverId,
    localSessionId,
    passengerId,
    stopOrder,
    status,
    pickupAddress,
    pickupPostcode,
    pickupLatitude,
    pickupLongitude,
    dropoffAddress,
    dropoffPostcode,
    pickedUpAt,
    droppedOffAt,
    notes,
    isSynced,
    createdAt,
    updatedAt,
  );
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is PassengersLocalData &&
          other.localId == this.localId &&
          other.serverId == this.serverId &&
          other.localSessionId == this.localSessionId &&
          other.passengerId == this.passengerId &&
          other.stopOrder == this.stopOrder &&
          other.status == this.status &&
          other.pickupAddress == this.pickupAddress &&
          other.pickupPostcode == this.pickupPostcode &&
          other.pickupLatitude == this.pickupLatitude &&
          other.pickupLongitude == this.pickupLongitude &&
          other.dropoffAddress == this.dropoffAddress &&
          other.dropoffPostcode == this.dropoffPostcode &&
          other.pickedUpAt == this.pickedUpAt &&
          other.droppedOffAt == this.droppedOffAt &&
          other.notes == this.notes &&
          other.isSynced == this.isSynced &&
          other.createdAt == this.createdAt &&
          other.updatedAt == this.updatedAt);
}

class PassengersLocalCompanion extends UpdateCompanion<PassengersLocalData> {
  final Value<String> localId;
  final Value<String?> serverId;
  final Value<String> localSessionId;
  final Value<String> passengerId;
  final Value<int> stopOrder;
  final Value<String> status;
  final Value<String> pickupAddress;
  final Value<String?> pickupPostcode;
  final Value<double?> pickupLatitude;
  final Value<double?> pickupLongitude;
  final Value<String> dropoffAddress;
  final Value<String?> dropoffPostcode;
  final Value<DateTime?> pickedUpAt;
  final Value<DateTime?> droppedOffAt;
  final Value<String?> notes;
  final Value<bool> isSynced;
  final Value<DateTime> createdAt;
  final Value<DateTime> updatedAt;
  final Value<int> rowid;
  const PassengersLocalCompanion({
    this.localId = const Value.absent(),
    this.serverId = const Value.absent(),
    this.localSessionId = const Value.absent(),
    this.passengerId = const Value.absent(),
    this.stopOrder = const Value.absent(),
    this.status = const Value.absent(),
    this.pickupAddress = const Value.absent(),
    this.pickupPostcode = const Value.absent(),
    this.pickupLatitude = const Value.absent(),
    this.pickupLongitude = const Value.absent(),
    this.dropoffAddress = const Value.absent(),
    this.dropoffPostcode = const Value.absent(),
    this.pickedUpAt = const Value.absent(),
    this.droppedOffAt = const Value.absent(),
    this.notes = const Value.absent(),
    this.isSynced = const Value.absent(),
    this.createdAt = const Value.absent(),
    this.updatedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  PassengersLocalCompanion.insert({
    required String localId,
    this.serverId = const Value.absent(),
    required String localSessionId,
    required String passengerId,
    required int stopOrder,
    this.status = const Value.absent(),
    required String pickupAddress,
    this.pickupPostcode = const Value.absent(),
    this.pickupLatitude = const Value.absent(),
    this.pickupLongitude = const Value.absent(),
    required String dropoffAddress,
    this.dropoffPostcode = const Value.absent(),
    this.pickedUpAt = const Value.absent(),
    this.droppedOffAt = const Value.absent(),
    this.notes = const Value.absent(),
    this.isSynced = const Value.absent(),
    this.createdAt = const Value.absent(),
    this.updatedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  }) : localId = Value(localId),
       localSessionId = Value(localSessionId),
       passengerId = Value(passengerId),
       stopOrder = Value(stopOrder),
       pickupAddress = Value(pickupAddress),
       dropoffAddress = Value(dropoffAddress);
  static Insertable<PassengersLocalData> custom({
    Expression<String>? localId,
    Expression<String>? serverId,
    Expression<String>? localSessionId,
    Expression<String>? passengerId,
    Expression<int>? stopOrder,
    Expression<String>? status,
    Expression<String>? pickupAddress,
    Expression<String>? pickupPostcode,
    Expression<double>? pickupLatitude,
    Expression<double>? pickupLongitude,
    Expression<String>? dropoffAddress,
    Expression<String>? dropoffPostcode,
    Expression<DateTime>? pickedUpAt,
    Expression<DateTime>? droppedOffAt,
    Expression<String>? notes,
    Expression<bool>? isSynced,
    Expression<DateTime>? createdAt,
    Expression<DateTime>? updatedAt,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (localId != null) 'local_id': localId,
      if (serverId != null) 'server_id': serverId,
      if (localSessionId != null) 'local_session_id': localSessionId,
      if (passengerId != null) 'passenger_id': passengerId,
      if (stopOrder != null) 'stop_order': stopOrder,
      if (status != null) 'status': status,
      if (pickupAddress != null) 'pickup_address': pickupAddress,
      if (pickupPostcode != null) 'pickup_postcode': pickupPostcode,
      if (pickupLatitude != null) 'pickup_latitude': pickupLatitude,
      if (pickupLongitude != null) 'pickup_longitude': pickupLongitude,
      if (dropoffAddress != null) 'dropoff_address': dropoffAddress,
      if (dropoffPostcode != null) 'dropoff_postcode': dropoffPostcode,
      if (pickedUpAt != null) 'picked_up_at': pickedUpAt,
      if (droppedOffAt != null) 'dropped_off_at': droppedOffAt,
      if (notes != null) 'notes': notes,
      if (isSynced != null) 'is_synced': isSynced,
      if (createdAt != null) 'created_at': createdAt,
      if (updatedAt != null) 'updated_at': updatedAt,
      if (rowid != null) 'rowid': rowid,
    });
  }

  PassengersLocalCompanion copyWith({
    Value<String>? localId,
    Value<String?>? serverId,
    Value<String>? localSessionId,
    Value<String>? passengerId,
    Value<int>? stopOrder,
    Value<String>? status,
    Value<String>? pickupAddress,
    Value<String?>? pickupPostcode,
    Value<double?>? pickupLatitude,
    Value<double?>? pickupLongitude,
    Value<String>? dropoffAddress,
    Value<String?>? dropoffPostcode,
    Value<DateTime?>? pickedUpAt,
    Value<DateTime?>? droppedOffAt,
    Value<String?>? notes,
    Value<bool>? isSynced,
    Value<DateTime>? createdAt,
    Value<DateTime>? updatedAt,
    Value<int>? rowid,
  }) {
    return PassengersLocalCompanion(
      localId: localId ?? this.localId,
      serverId: serverId ?? this.serverId,
      localSessionId: localSessionId ?? this.localSessionId,
      passengerId: passengerId ?? this.passengerId,
      stopOrder: stopOrder ?? this.stopOrder,
      status: status ?? this.status,
      pickupAddress: pickupAddress ?? this.pickupAddress,
      pickupPostcode: pickupPostcode ?? this.pickupPostcode,
      pickupLatitude: pickupLatitude ?? this.pickupLatitude,
      pickupLongitude: pickupLongitude ?? this.pickupLongitude,
      dropoffAddress: dropoffAddress ?? this.dropoffAddress,
      dropoffPostcode: dropoffPostcode ?? this.dropoffPostcode,
      pickedUpAt: pickedUpAt ?? this.pickedUpAt,
      droppedOffAt: droppedOffAt ?? this.droppedOffAt,
      notes: notes ?? this.notes,
      isSynced: isSynced ?? this.isSynced,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (localId.present) {
      map['local_id'] = Variable<String>(localId.value);
    }
    if (serverId.present) {
      map['server_id'] = Variable<String>(serverId.value);
    }
    if (localSessionId.present) {
      map['local_session_id'] = Variable<String>(localSessionId.value);
    }
    if (passengerId.present) {
      map['passenger_id'] = Variable<String>(passengerId.value);
    }
    if (stopOrder.present) {
      map['stop_order'] = Variable<int>(stopOrder.value);
    }
    if (status.present) {
      map['status'] = Variable<String>(status.value);
    }
    if (pickupAddress.present) {
      map['pickup_address'] = Variable<String>(pickupAddress.value);
    }
    if (pickupPostcode.present) {
      map['pickup_postcode'] = Variable<String>(pickupPostcode.value);
    }
    if (pickupLatitude.present) {
      map['pickup_latitude'] = Variable<double>(pickupLatitude.value);
    }
    if (pickupLongitude.present) {
      map['pickup_longitude'] = Variable<double>(pickupLongitude.value);
    }
    if (dropoffAddress.present) {
      map['dropoff_address'] = Variable<String>(dropoffAddress.value);
    }
    if (dropoffPostcode.present) {
      map['dropoff_postcode'] = Variable<String>(dropoffPostcode.value);
    }
    if (pickedUpAt.present) {
      map['picked_up_at'] = Variable<DateTime>(pickedUpAt.value);
    }
    if (droppedOffAt.present) {
      map['dropped_off_at'] = Variable<DateTime>(droppedOffAt.value);
    }
    if (notes.present) {
      map['notes'] = Variable<String>(notes.value);
    }
    if (isSynced.present) {
      map['is_synced'] = Variable<bool>(isSynced.value);
    }
    if (createdAt.present) {
      map['created_at'] = Variable<DateTime>(createdAt.value);
    }
    if (updatedAt.present) {
      map['updated_at'] = Variable<DateTime>(updatedAt.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('PassengersLocalCompanion(')
          ..write('localId: $localId, ')
          ..write('serverId: $serverId, ')
          ..write('localSessionId: $localSessionId, ')
          ..write('passengerId: $passengerId, ')
          ..write('stopOrder: $stopOrder, ')
          ..write('status: $status, ')
          ..write('pickupAddress: $pickupAddress, ')
          ..write('pickupPostcode: $pickupPostcode, ')
          ..write('pickupLatitude: $pickupLatitude, ')
          ..write('pickupLongitude: $pickupLongitude, ')
          ..write('dropoffAddress: $dropoffAddress, ')
          ..write('dropoffPostcode: $dropoffPostcode, ')
          ..write('pickedUpAt: $pickedUpAt, ')
          ..write('droppedOffAt: $droppedOffAt, ')
          ..write('notes: $notes, ')
          ..write('isSynced: $isSynced, ')
          ..write('createdAt: $createdAt, ')
          ..write('updatedAt: $updatedAt, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $ChecklistLocalTable extends ChecklistLocal
    with TableInfo<$ChecklistLocalTable, ChecklistLocalData> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $ChecklistLocalTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
    'id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _driverIdMeta = const VerificationMeta(
    'driverId',
  );
  @override
  late final GeneratedColumn<String> driverId = GeneratedColumn<String>(
    'driver_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _vehicleIdMeta = const VerificationMeta(
    'vehicleId',
  );
  @override
  late final GeneratedColumn<String> vehicleId = GeneratedColumn<String>(
    'vehicle_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _vehicleCompanyIdMeta = const VerificationMeta(
    'vehicleCompanyId',
  );
  @override
  late final GeneratedColumn<String> vehicleCompanyId = GeneratedColumn<String>(
    'vehicle_company_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _sessionDateMeta = const VerificationMeta(
    'sessionDate',
  );
  @override
  late final GeneratedColumn<String> sessionDate = GeneratedColumn<String>(
    'session_date',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _checksJsonMeta = const VerificationMeta(
    'checksJson',
  );
  @override
  late final GeneratedColumn<String> checksJson = GeneratedColumn<String>(
    'checks_json',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _statusMeta = const VerificationMeta('status');
  @override
  late final GeneratedColumn<String> status = GeneratedColumn<String>(
    'status',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _isLockedMeta = const VerificationMeta(
    'isLocked',
  );
  @override
  late final GeneratedColumn<bool> isLocked = GeneratedColumn<bool>(
    'is_locked',
    aliasedName,
    false,
    type: DriftSqlType.bool,
    requiredDuringInsert: false,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'CHECK ("is_locked" IN (0, 1))',
    ),
    defaultValue: const Constant(false),
  );
  static const VerificationMeta _serverIdMeta = const VerificationMeta(
    'serverId',
  );
  @override
  late final GeneratedColumn<String> serverId = GeneratedColumn<String>(
    'server_id',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _isSyncedMeta = const VerificationMeta(
    'isSynced',
  );
  @override
  late final GeneratedColumn<bool> isSynced = GeneratedColumn<bool>(
    'is_synced',
    aliasedName,
    false,
    type: DriftSqlType.bool,
    requiredDuringInsert: false,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'CHECK ("is_synced" IN (0, 1))',
    ),
    defaultValue: const Constant(false),
  );
  static const VerificationMeta _createdAtMeta = const VerificationMeta(
    'createdAt',
  );
  @override
  late final GeneratedColumn<DateTime> createdAt = GeneratedColumn<DateTime>(
    'created_at',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: false,
    defaultValue: currentDateAndTime,
  );
  static const VerificationMeta _updatedAtMeta = const VerificationMeta(
    'updatedAt',
  );
  @override
  late final GeneratedColumn<DateTime> updatedAt = GeneratedColumn<DateTime>(
    'updated_at',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: false,
    defaultValue: currentDateAndTime,
  );
  @override
  List<GeneratedColumn> get $columns => [
    id,
    driverId,
    vehicleId,
    vehicleCompanyId,
    sessionDate,
    checksJson,
    status,
    isLocked,
    serverId,
    isSynced,
    createdAt,
    updatedAt,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'checklist_local';
  @override
  VerificationContext validateIntegrity(
    Insertable<ChecklistLocalData> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('driver_id')) {
      context.handle(
        _driverIdMeta,
        driverId.isAcceptableOrUnknown(data['driver_id']!, _driverIdMeta),
      );
    } else if (isInserting) {
      context.missing(_driverIdMeta);
    }
    if (data.containsKey('vehicle_id')) {
      context.handle(
        _vehicleIdMeta,
        vehicleId.isAcceptableOrUnknown(data['vehicle_id']!, _vehicleIdMeta),
      );
    } else if (isInserting) {
      context.missing(_vehicleIdMeta);
    }
    if (data.containsKey('vehicle_company_id')) {
      context.handle(
        _vehicleCompanyIdMeta,
        vehicleCompanyId.isAcceptableOrUnknown(
          data['vehicle_company_id']!,
          _vehicleCompanyIdMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_vehicleCompanyIdMeta);
    }
    if (data.containsKey('session_date')) {
      context.handle(
        _sessionDateMeta,
        sessionDate.isAcceptableOrUnknown(
          data['session_date']!,
          _sessionDateMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_sessionDateMeta);
    }
    if (data.containsKey('checks_json')) {
      context.handle(
        _checksJsonMeta,
        checksJson.isAcceptableOrUnknown(data['checks_json']!, _checksJsonMeta),
      );
    } else if (isInserting) {
      context.missing(_checksJsonMeta);
    }
    if (data.containsKey('status')) {
      context.handle(
        _statusMeta,
        status.isAcceptableOrUnknown(data['status']!, _statusMeta),
      );
    } else if (isInserting) {
      context.missing(_statusMeta);
    }
    if (data.containsKey('is_locked')) {
      context.handle(
        _isLockedMeta,
        isLocked.isAcceptableOrUnknown(data['is_locked']!, _isLockedMeta),
      );
    }
    if (data.containsKey('server_id')) {
      context.handle(
        _serverIdMeta,
        serverId.isAcceptableOrUnknown(data['server_id']!, _serverIdMeta),
      );
    }
    if (data.containsKey('is_synced')) {
      context.handle(
        _isSyncedMeta,
        isSynced.isAcceptableOrUnknown(data['is_synced']!, _isSyncedMeta),
      );
    }
    if (data.containsKey('created_at')) {
      context.handle(
        _createdAtMeta,
        createdAt.isAcceptableOrUnknown(data['created_at']!, _createdAtMeta),
      );
    }
    if (data.containsKey('updated_at')) {
      context.handle(
        _updatedAtMeta,
        updatedAt.isAcceptableOrUnknown(data['updated_at']!, _updatedAtMeta),
      );
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  ChecklistLocalData map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return ChecklistLocalData(
      id: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}id'],
      )!,
      driverId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}driver_id'],
      )!,
      vehicleId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}vehicle_id'],
      )!,
      vehicleCompanyId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}vehicle_company_id'],
      )!,
      sessionDate: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}session_date'],
      )!,
      checksJson: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}checks_json'],
      )!,
      status: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}status'],
      )!,
      isLocked: attachedDatabase.typeMapping.read(
        DriftSqlType.bool,
        data['${effectivePrefix}is_locked'],
      )!,
      serverId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}server_id'],
      ),
      isSynced: attachedDatabase.typeMapping.read(
        DriftSqlType.bool,
        data['${effectivePrefix}is_synced'],
      )!,
      createdAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}created_at'],
      )!,
      updatedAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}updated_at'],
      )!,
    );
  }

  @override
  $ChecklistLocalTable createAlias(String alias) {
    return $ChecklistLocalTable(attachedDatabase, alias);
  }
}

class ChecklistLocalData extends DataClass
    implements Insertable<ChecklistLocalData> {
  final String id;
  final String driverId;
  final String vehicleId;
  final String vehicleCompanyId;
  final String sessionDate;
  final String checksJson;
  final String status;
  final bool isLocked;
  final String? serverId;
  final bool isSynced;
  final DateTime createdAt;
  final DateTime updatedAt;
  const ChecklistLocalData({
    required this.id,
    required this.driverId,
    required this.vehicleId,
    required this.vehicleCompanyId,
    required this.sessionDate,
    required this.checksJson,
    required this.status,
    required this.isLocked,
    this.serverId,
    required this.isSynced,
    required this.createdAt,
    required this.updatedAt,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['driver_id'] = Variable<String>(driverId);
    map['vehicle_id'] = Variable<String>(vehicleId);
    map['vehicle_company_id'] = Variable<String>(vehicleCompanyId);
    map['session_date'] = Variable<String>(sessionDate);
    map['checks_json'] = Variable<String>(checksJson);
    map['status'] = Variable<String>(status);
    map['is_locked'] = Variable<bool>(isLocked);
    if (!nullToAbsent || serverId != null) {
      map['server_id'] = Variable<String>(serverId);
    }
    map['is_synced'] = Variable<bool>(isSynced);
    map['created_at'] = Variable<DateTime>(createdAt);
    map['updated_at'] = Variable<DateTime>(updatedAt);
    return map;
  }

  ChecklistLocalCompanion toCompanion(bool nullToAbsent) {
    return ChecklistLocalCompanion(
      id: Value(id),
      driverId: Value(driverId),
      vehicleId: Value(vehicleId),
      vehicleCompanyId: Value(vehicleCompanyId),
      sessionDate: Value(sessionDate),
      checksJson: Value(checksJson),
      status: Value(status),
      isLocked: Value(isLocked),
      serverId: serverId == null && nullToAbsent
          ? const Value.absent()
          : Value(serverId),
      isSynced: Value(isSynced),
      createdAt: Value(createdAt),
      updatedAt: Value(updatedAt),
    );
  }

  factory ChecklistLocalData.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return ChecklistLocalData(
      id: serializer.fromJson<String>(json['id']),
      driverId: serializer.fromJson<String>(json['driverId']),
      vehicleId: serializer.fromJson<String>(json['vehicleId']),
      vehicleCompanyId: serializer.fromJson<String>(json['vehicleCompanyId']),
      sessionDate: serializer.fromJson<String>(json['sessionDate']),
      checksJson: serializer.fromJson<String>(json['checksJson']),
      status: serializer.fromJson<String>(json['status']),
      isLocked: serializer.fromJson<bool>(json['isLocked']),
      serverId: serializer.fromJson<String?>(json['serverId']),
      isSynced: serializer.fromJson<bool>(json['isSynced']),
      createdAt: serializer.fromJson<DateTime>(json['createdAt']),
      updatedAt: serializer.fromJson<DateTime>(json['updatedAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'driverId': serializer.toJson<String>(driverId),
      'vehicleId': serializer.toJson<String>(vehicleId),
      'vehicleCompanyId': serializer.toJson<String>(vehicleCompanyId),
      'sessionDate': serializer.toJson<String>(sessionDate),
      'checksJson': serializer.toJson<String>(checksJson),
      'status': serializer.toJson<String>(status),
      'isLocked': serializer.toJson<bool>(isLocked),
      'serverId': serializer.toJson<String?>(serverId),
      'isSynced': serializer.toJson<bool>(isSynced),
      'createdAt': serializer.toJson<DateTime>(createdAt),
      'updatedAt': serializer.toJson<DateTime>(updatedAt),
    };
  }

  ChecklistLocalData copyWith({
    String? id,
    String? driverId,
    String? vehicleId,
    String? vehicleCompanyId,
    String? sessionDate,
    String? checksJson,
    String? status,
    bool? isLocked,
    Value<String?> serverId = const Value.absent(),
    bool? isSynced,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) => ChecklistLocalData(
    id: id ?? this.id,
    driverId: driverId ?? this.driverId,
    vehicleId: vehicleId ?? this.vehicleId,
    vehicleCompanyId: vehicleCompanyId ?? this.vehicleCompanyId,
    sessionDate: sessionDate ?? this.sessionDate,
    checksJson: checksJson ?? this.checksJson,
    status: status ?? this.status,
    isLocked: isLocked ?? this.isLocked,
    serverId: serverId.present ? serverId.value : this.serverId,
    isSynced: isSynced ?? this.isSynced,
    createdAt: createdAt ?? this.createdAt,
    updatedAt: updatedAt ?? this.updatedAt,
  );
  ChecklistLocalData copyWithCompanion(ChecklistLocalCompanion data) {
    return ChecklistLocalData(
      id: data.id.present ? data.id.value : this.id,
      driverId: data.driverId.present ? data.driverId.value : this.driverId,
      vehicleId: data.vehicleId.present ? data.vehicleId.value : this.vehicleId,
      vehicleCompanyId: data.vehicleCompanyId.present
          ? data.vehicleCompanyId.value
          : this.vehicleCompanyId,
      sessionDate: data.sessionDate.present
          ? data.sessionDate.value
          : this.sessionDate,
      checksJson: data.checksJson.present
          ? data.checksJson.value
          : this.checksJson,
      status: data.status.present ? data.status.value : this.status,
      isLocked: data.isLocked.present ? data.isLocked.value : this.isLocked,
      serverId: data.serverId.present ? data.serverId.value : this.serverId,
      isSynced: data.isSynced.present ? data.isSynced.value : this.isSynced,
      createdAt: data.createdAt.present ? data.createdAt.value : this.createdAt,
      updatedAt: data.updatedAt.present ? data.updatedAt.value : this.updatedAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('ChecklistLocalData(')
          ..write('id: $id, ')
          ..write('driverId: $driverId, ')
          ..write('vehicleId: $vehicleId, ')
          ..write('vehicleCompanyId: $vehicleCompanyId, ')
          ..write('sessionDate: $sessionDate, ')
          ..write('checksJson: $checksJson, ')
          ..write('status: $status, ')
          ..write('isLocked: $isLocked, ')
          ..write('serverId: $serverId, ')
          ..write('isSynced: $isSynced, ')
          ..write('createdAt: $createdAt, ')
          ..write('updatedAt: $updatedAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
    id,
    driverId,
    vehicleId,
    vehicleCompanyId,
    sessionDate,
    checksJson,
    status,
    isLocked,
    serverId,
    isSynced,
    createdAt,
    updatedAt,
  );
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is ChecklistLocalData &&
          other.id == this.id &&
          other.driverId == this.driverId &&
          other.vehicleId == this.vehicleId &&
          other.vehicleCompanyId == this.vehicleCompanyId &&
          other.sessionDate == this.sessionDate &&
          other.checksJson == this.checksJson &&
          other.status == this.status &&
          other.isLocked == this.isLocked &&
          other.serverId == this.serverId &&
          other.isSynced == this.isSynced &&
          other.createdAt == this.createdAt &&
          other.updatedAt == this.updatedAt);
}

class ChecklistLocalCompanion extends UpdateCompanion<ChecklistLocalData> {
  final Value<String> id;
  final Value<String> driverId;
  final Value<String> vehicleId;
  final Value<String> vehicleCompanyId;
  final Value<String> sessionDate;
  final Value<String> checksJson;
  final Value<String> status;
  final Value<bool> isLocked;
  final Value<String?> serverId;
  final Value<bool> isSynced;
  final Value<DateTime> createdAt;
  final Value<DateTime> updatedAt;
  final Value<int> rowid;
  const ChecklistLocalCompanion({
    this.id = const Value.absent(),
    this.driverId = const Value.absent(),
    this.vehicleId = const Value.absent(),
    this.vehicleCompanyId = const Value.absent(),
    this.sessionDate = const Value.absent(),
    this.checksJson = const Value.absent(),
    this.status = const Value.absent(),
    this.isLocked = const Value.absent(),
    this.serverId = const Value.absent(),
    this.isSynced = const Value.absent(),
    this.createdAt = const Value.absent(),
    this.updatedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  ChecklistLocalCompanion.insert({
    required String id,
    required String driverId,
    required String vehicleId,
    required String vehicleCompanyId,
    required String sessionDate,
    required String checksJson,
    required String status,
    this.isLocked = const Value.absent(),
    this.serverId = const Value.absent(),
    this.isSynced = const Value.absent(),
    this.createdAt = const Value.absent(),
    this.updatedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  }) : id = Value(id),
       driverId = Value(driverId),
       vehicleId = Value(vehicleId),
       vehicleCompanyId = Value(vehicleCompanyId),
       sessionDate = Value(sessionDate),
       checksJson = Value(checksJson),
       status = Value(status);
  static Insertable<ChecklistLocalData> custom({
    Expression<String>? id,
    Expression<String>? driverId,
    Expression<String>? vehicleId,
    Expression<String>? vehicleCompanyId,
    Expression<String>? sessionDate,
    Expression<String>? checksJson,
    Expression<String>? status,
    Expression<bool>? isLocked,
    Expression<String>? serverId,
    Expression<bool>? isSynced,
    Expression<DateTime>? createdAt,
    Expression<DateTime>? updatedAt,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (driverId != null) 'driver_id': driverId,
      if (vehicleId != null) 'vehicle_id': vehicleId,
      if (vehicleCompanyId != null) 'vehicle_company_id': vehicleCompanyId,
      if (sessionDate != null) 'session_date': sessionDate,
      if (checksJson != null) 'checks_json': checksJson,
      if (status != null) 'status': status,
      if (isLocked != null) 'is_locked': isLocked,
      if (serverId != null) 'server_id': serverId,
      if (isSynced != null) 'is_synced': isSynced,
      if (createdAt != null) 'created_at': createdAt,
      if (updatedAt != null) 'updated_at': updatedAt,
      if (rowid != null) 'rowid': rowid,
    });
  }

  ChecklistLocalCompanion copyWith({
    Value<String>? id,
    Value<String>? driverId,
    Value<String>? vehicleId,
    Value<String>? vehicleCompanyId,
    Value<String>? sessionDate,
    Value<String>? checksJson,
    Value<String>? status,
    Value<bool>? isLocked,
    Value<String?>? serverId,
    Value<bool>? isSynced,
    Value<DateTime>? createdAt,
    Value<DateTime>? updatedAt,
    Value<int>? rowid,
  }) {
    return ChecklistLocalCompanion(
      id: id ?? this.id,
      driverId: driverId ?? this.driverId,
      vehicleId: vehicleId ?? this.vehicleId,
      vehicleCompanyId: vehicleCompanyId ?? this.vehicleCompanyId,
      sessionDate: sessionDate ?? this.sessionDate,
      checksJson: checksJson ?? this.checksJson,
      status: status ?? this.status,
      isLocked: isLocked ?? this.isLocked,
      serverId: serverId ?? this.serverId,
      isSynced: isSynced ?? this.isSynced,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (driverId.present) {
      map['driver_id'] = Variable<String>(driverId.value);
    }
    if (vehicleId.present) {
      map['vehicle_id'] = Variable<String>(vehicleId.value);
    }
    if (vehicleCompanyId.present) {
      map['vehicle_company_id'] = Variable<String>(vehicleCompanyId.value);
    }
    if (sessionDate.present) {
      map['session_date'] = Variable<String>(sessionDate.value);
    }
    if (checksJson.present) {
      map['checks_json'] = Variable<String>(checksJson.value);
    }
    if (status.present) {
      map['status'] = Variable<String>(status.value);
    }
    if (isLocked.present) {
      map['is_locked'] = Variable<bool>(isLocked.value);
    }
    if (serverId.present) {
      map['server_id'] = Variable<String>(serverId.value);
    }
    if (isSynced.present) {
      map['is_synced'] = Variable<bool>(isSynced.value);
    }
    if (createdAt.present) {
      map['created_at'] = Variable<DateTime>(createdAt.value);
    }
    if (updatedAt.present) {
      map['updated_at'] = Variable<DateTime>(updatedAt.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('ChecklistLocalCompanion(')
          ..write('id: $id, ')
          ..write('driverId: $driverId, ')
          ..write('vehicleId: $vehicleId, ')
          ..write('vehicleCompanyId: $vehicleCompanyId, ')
          ..write('sessionDate: $sessionDate, ')
          ..write('checksJson: $checksJson, ')
          ..write('status: $status, ')
          ..write('isLocked: $isLocked, ')
          ..write('serverId: $serverId, ')
          ..write('isSynced: $isSynced, ')
          ..write('createdAt: $createdAt, ')
          ..write('updatedAt: $updatedAt, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $SyncQueueTable extends SyncQueue
    with TableInfo<$SyncQueueTable, SyncQueueData> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $SyncQueueTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
    'id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _opTypeMeta = const VerificationMeta('opType');
  @override
  late final GeneratedColumn<String> opType = GeneratedColumn<String>(
    'op_type',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _payloadJsonMeta = const VerificationMeta(
    'payloadJson',
  );
  @override
  late final GeneratedColumn<String> payloadJson = GeneratedColumn<String>(
    'payload_json',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _statusMeta = const VerificationMeta('status');
  @override
  late final GeneratedColumn<String> status = GeneratedColumn<String>(
    'status',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
    defaultValue: const Constant('pending'),
  );
  static const VerificationMeta _retryCountMeta = const VerificationMeta(
    'retryCount',
  );
  @override
  late final GeneratedColumn<int> retryCount = GeneratedColumn<int>(
    'retry_count',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: false,
    defaultValue: const Constant(0),
  );
  static const VerificationMeta _lastErrorMeta = const VerificationMeta(
    'lastError',
  );
  @override
  late final GeneratedColumn<String> lastError = GeneratedColumn<String>(
    'last_error',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _createdAtMeta = const VerificationMeta(
    'createdAt',
  );
  @override
  late final GeneratedColumn<DateTime> createdAt = GeneratedColumn<DateTime>(
    'created_at',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: false,
    defaultValue: currentDateAndTime,
  );
  static const VerificationMeta _updatedAtMeta = const VerificationMeta(
    'updatedAt',
  );
  @override
  late final GeneratedColumn<DateTime> updatedAt = GeneratedColumn<DateTime>(
    'updated_at',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: false,
    defaultValue: currentDateAndTime,
  );
  @override
  List<GeneratedColumn> get $columns => [
    id,
    opType,
    payloadJson,
    status,
    retryCount,
    lastError,
    createdAt,
    updatedAt,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'sync_queue';
  @override
  VerificationContext validateIntegrity(
    Insertable<SyncQueueData> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('op_type')) {
      context.handle(
        _opTypeMeta,
        opType.isAcceptableOrUnknown(data['op_type']!, _opTypeMeta),
      );
    } else if (isInserting) {
      context.missing(_opTypeMeta);
    }
    if (data.containsKey('payload_json')) {
      context.handle(
        _payloadJsonMeta,
        payloadJson.isAcceptableOrUnknown(
          data['payload_json']!,
          _payloadJsonMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_payloadJsonMeta);
    }
    if (data.containsKey('status')) {
      context.handle(
        _statusMeta,
        status.isAcceptableOrUnknown(data['status']!, _statusMeta),
      );
    }
    if (data.containsKey('retry_count')) {
      context.handle(
        _retryCountMeta,
        retryCount.isAcceptableOrUnknown(data['retry_count']!, _retryCountMeta),
      );
    }
    if (data.containsKey('last_error')) {
      context.handle(
        _lastErrorMeta,
        lastError.isAcceptableOrUnknown(data['last_error']!, _lastErrorMeta),
      );
    }
    if (data.containsKey('created_at')) {
      context.handle(
        _createdAtMeta,
        createdAt.isAcceptableOrUnknown(data['created_at']!, _createdAtMeta),
      );
    }
    if (data.containsKey('updated_at')) {
      context.handle(
        _updatedAtMeta,
        updatedAt.isAcceptableOrUnknown(data['updated_at']!, _updatedAtMeta),
      );
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  SyncQueueData map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return SyncQueueData(
      id: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}id'],
      )!,
      opType: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}op_type'],
      )!,
      payloadJson: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}payload_json'],
      )!,
      status: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}status'],
      )!,
      retryCount: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}retry_count'],
      )!,
      lastError: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}last_error'],
      ),
      createdAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}created_at'],
      )!,
      updatedAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}updated_at'],
      )!,
    );
  }

  @override
  $SyncQueueTable createAlias(String alias) {
    return $SyncQueueTable(attachedDatabase, alias);
  }
}

class SyncQueueData extends DataClass implements Insertable<SyncQueueData> {
  final String id;
  final String opType;
  final String payloadJson;
  final String status;
  final int retryCount;
  final String? lastError;
  final DateTime createdAt;
  final DateTime updatedAt;
  const SyncQueueData({
    required this.id,
    required this.opType,
    required this.payloadJson,
    required this.status,
    required this.retryCount,
    this.lastError,
    required this.createdAt,
    required this.updatedAt,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['op_type'] = Variable<String>(opType);
    map['payload_json'] = Variable<String>(payloadJson);
    map['status'] = Variable<String>(status);
    map['retry_count'] = Variable<int>(retryCount);
    if (!nullToAbsent || lastError != null) {
      map['last_error'] = Variable<String>(lastError);
    }
    map['created_at'] = Variable<DateTime>(createdAt);
    map['updated_at'] = Variable<DateTime>(updatedAt);
    return map;
  }

  SyncQueueCompanion toCompanion(bool nullToAbsent) {
    return SyncQueueCompanion(
      id: Value(id),
      opType: Value(opType),
      payloadJson: Value(payloadJson),
      status: Value(status),
      retryCount: Value(retryCount),
      lastError: lastError == null && nullToAbsent
          ? const Value.absent()
          : Value(lastError),
      createdAt: Value(createdAt),
      updatedAt: Value(updatedAt),
    );
  }

  factory SyncQueueData.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return SyncQueueData(
      id: serializer.fromJson<String>(json['id']),
      opType: serializer.fromJson<String>(json['opType']),
      payloadJson: serializer.fromJson<String>(json['payloadJson']),
      status: serializer.fromJson<String>(json['status']),
      retryCount: serializer.fromJson<int>(json['retryCount']),
      lastError: serializer.fromJson<String?>(json['lastError']),
      createdAt: serializer.fromJson<DateTime>(json['createdAt']),
      updatedAt: serializer.fromJson<DateTime>(json['updatedAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'opType': serializer.toJson<String>(opType),
      'payloadJson': serializer.toJson<String>(payloadJson),
      'status': serializer.toJson<String>(status),
      'retryCount': serializer.toJson<int>(retryCount),
      'lastError': serializer.toJson<String?>(lastError),
      'createdAt': serializer.toJson<DateTime>(createdAt),
      'updatedAt': serializer.toJson<DateTime>(updatedAt),
    };
  }

  SyncQueueData copyWith({
    String? id,
    String? opType,
    String? payloadJson,
    String? status,
    int? retryCount,
    Value<String?> lastError = const Value.absent(),
    DateTime? createdAt,
    DateTime? updatedAt,
  }) => SyncQueueData(
    id: id ?? this.id,
    opType: opType ?? this.opType,
    payloadJson: payloadJson ?? this.payloadJson,
    status: status ?? this.status,
    retryCount: retryCount ?? this.retryCount,
    lastError: lastError.present ? lastError.value : this.lastError,
    createdAt: createdAt ?? this.createdAt,
    updatedAt: updatedAt ?? this.updatedAt,
  );
  SyncQueueData copyWithCompanion(SyncQueueCompanion data) {
    return SyncQueueData(
      id: data.id.present ? data.id.value : this.id,
      opType: data.opType.present ? data.opType.value : this.opType,
      payloadJson: data.payloadJson.present
          ? data.payloadJson.value
          : this.payloadJson,
      status: data.status.present ? data.status.value : this.status,
      retryCount: data.retryCount.present
          ? data.retryCount.value
          : this.retryCount,
      lastError: data.lastError.present ? data.lastError.value : this.lastError,
      createdAt: data.createdAt.present ? data.createdAt.value : this.createdAt,
      updatedAt: data.updatedAt.present ? data.updatedAt.value : this.updatedAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('SyncQueueData(')
          ..write('id: $id, ')
          ..write('opType: $opType, ')
          ..write('payloadJson: $payloadJson, ')
          ..write('status: $status, ')
          ..write('retryCount: $retryCount, ')
          ..write('lastError: $lastError, ')
          ..write('createdAt: $createdAt, ')
          ..write('updatedAt: $updatedAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
    id,
    opType,
    payloadJson,
    status,
    retryCount,
    lastError,
    createdAt,
    updatedAt,
  );
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is SyncQueueData &&
          other.id == this.id &&
          other.opType == this.opType &&
          other.payloadJson == this.payloadJson &&
          other.status == this.status &&
          other.retryCount == this.retryCount &&
          other.lastError == this.lastError &&
          other.createdAt == this.createdAt &&
          other.updatedAt == this.updatedAt);
}

class SyncQueueCompanion extends UpdateCompanion<SyncQueueData> {
  final Value<String> id;
  final Value<String> opType;
  final Value<String> payloadJson;
  final Value<String> status;
  final Value<int> retryCount;
  final Value<String?> lastError;
  final Value<DateTime> createdAt;
  final Value<DateTime> updatedAt;
  final Value<int> rowid;
  const SyncQueueCompanion({
    this.id = const Value.absent(),
    this.opType = const Value.absent(),
    this.payloadJson = const Value.absent(),
    this.status = const Value.absent(),
    this.retryCount = const Value.absent(),
    this.lastError = const Value.absent(),
    this.createdAt = const Value.absent(),
    this.updatedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  SyncQueueCompanion.insert({
    required String id,
    required String opType,
    required String payloadJson,
    this.status = const Value.absent(),
    this.retryCount = const Value.absent(),
    this.lastError = const Value.absent(),
    this.createdAt = const Value.absent(),
    this.updatedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  }) : id = Value(id),
       opType = Value(opType),
       payloadJson = Value(payloadJson);
  static Insertable<SyncQueueData> custom({
    Expression<String>? id,
    Expression<String>? opType,
    Expression<String>? payloadJson,
    Expression<String>? status,
    Expression<int>? retryCount,
    Expression<String>? lastError,
    Expression<DateTime>? createdAt,
    Expression<DateTime>? updatedAt,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (opType != null) 'op_type': opType,
      if (payloadJson != null) 'payload_json': payloadJson,
      if (status != null) 'status': status,
      if (retryCount != null) 'retry_count': retryCount,
      if (lastError != null) 'last_error': lastError,
      if (createdAt != null) 'created_at': createdAt,
      if (updatedAt != null) 'updated_at': updatedAt,
      if (rowid != null) 'rowid': rowid,
    });
  }

  SyncQueueCompanion copyWith({
    Value<String>? id,
    Value<String>? opType,
    Value<String>? payloadJson,
    Value<String>? status,
    Value<int>? retryCount,
    Value<String?>? lastError,
    Value<DateTime>? createdAt,
    Value<DateTime>? updatedAt,
    Value<int>? rowid,
  }) {
    return SyncQueueCompanion(
      id: id ?? this.id,
      opType: opType ?? this.opType,
      payloadJson: payloadJson ?? this.payloadJson,
      status: status ?? this.status,
      retryCount: retryCount ?? this.retryCount,
      lastError: lastError ?? this.lastError,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (opType.present) {
      map['op_type'] = Variable<String>(opType.value);
    }
    if (payloadJson.present) {
      map['payload_json'] = Variable<String>(payloadJson.value);
    }
    if (status.present) {
      map['status'] = Variable<String>(status.value);
    }
    if (retryCount.present) {
      map['retry_count'] = Variable<int>(retryCount.value);
    }
    if (lastError.present) {
      map['last_error'] = Variable<String>(lastError.value);
    }
    if (createdAt.present) {
      map['created_at'] = Variable<DateTime>(createdAt.value);
    }
    if (updatedAt.present) {
      map['updated_at'] = Variable<DateTime>(updatedAt.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('SyncQueueCompanion(')
          ..write('id: $id, ')
          ..write('opType: $opType, ')
          ..write('payloadJson: $payloadJson, ')
          ..write('status: $status, ')
          ..write('retryCount: $retryCount, ')
          ..write('lastError: $lastError, ')
          ..write('createdAt: $createdAt, ')
          ..write('updatedAt: $updatedAt, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

abstract class _$AppDatabase extends GeneratedDatabase {
  _$AppDatabase(QueryExecutor e) : super(e);
  $AppDatabaseManager get managers => $AppDatabaseManager(this);
  late final $JobsCacheTable jobsCache = $JobsCacheTable(this);
  late final $SchedulesCacheTable schedulesCache = $SchedulesCacheTable(this);
  late final $PassengersCacheTable passengersCache = $PassengersCacheTable(
    this,
  );
  late final $VehiclesCacheTable vehiclesCache = $VehiclesCacheTable(this);
  late final $SessionsLocalTable sessionsLocal = $SessionsLocalTable(this);
  late final $PassengersLocalTable passengersLocal = $PassengersLocalTable(
    this,
  );
  late final $ChecklistLocalTable checklistLocal = $ChecklistLocalTable(this);
  late final $SyncQueueTable syncQueue = $SyncQueueTable(this);
  @override
  Iterable<TableInfo<Table, Object?>> get allTables =>
      allSchemaEntities.whereType<TableInfo<Table, Object?>>();
  @override
  List<DatabaseSchemaEntity> get allSchemaEntities => [
    jobsCache,
    schedulesCache,
    passengersCache,
    vehiclesCache,
    sessionsLocal,
    passengersLocal,
    checklistLocal,
    syncQueue,
  ];
}

typedef $$JobsCacheTableCreateCompanionBuilder =
    JobsCacheCompanion Function({
      required String id,
      required String jobName,
      Value<String?> internalJobId,
      required String assignedDriverId,
      Value<String?> assignedPaId,
      Value<String?> driverName,
      Value<bool> hasOutbound,
      Value<bool> hasInbound,
      Value<String?> morningStartTime,
      Value<String?> morningEndTime,
      Value<String?> eveningStartTime,
      required String semesterStart,
      required String semesterEnd,
      required String status,
      Value<String?> driverApprovalStatus,
      Value<DateTime> cachedAt,
      Value<int> rowid,
    });
typedef $$JobsCacheTableUpdateCompanionBuilder =
    JobsCacheCompanion Function({
      Value<String> id,
      Value<String> jobName,
      Value<String?> internalJobId,
      Value<String> assignedDriverId,
      Value<String?> assignedPaId,
      Value<String?> driverName,
      Value<bool> hasOutbound,
      Value<bool> hasInbound,
      Value<String?> morningStartTime,
      Value<String?> morningEndTime,
      Value<String?> eveningStartTime,
      Value<String> semesterStart,
      Value<String> semesterEnd,
      Value<String> status,
      Value<String?> driverApprovalStatus,
      Value<DateTime> cachedAt,
      Value<int> rowid,
    });

class $$JobsCacheTableFilterComposer
    extends Composer<_$AppDatabase, $JobsCacheTable> {
  $$JobsCacheTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get jobName => $composableBuilder(
    column: $table.jobName,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get internalJobId => $composableBuilder(
    column: $table.internalJobId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get assignedDriverId => $composableBuilder(
    column: $table.assignedDriverId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get assignedPaId => $composableBuilder(
    column: $table.assignedPaId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get driverName => $composableBuilder(
    column: $table.driverName,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<bool> get hasOutbound => $composableBuilder(
    column: $table.hasOutbound,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<bool> get hasInbound => $composableBuilder(
    column: $table.hasInbound,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get morningStartTime => $composableBuilder(
    column: $table.morningStartTime,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get morningEndTime => $composableBuilder(
    column: $table.morningEndTime,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get eveningStartTime => $composableBuilder(
    column: $table.eveningStartTime,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get semesterStart => $composableBuilder(
    column: $table.semesterStart,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get semesterEnd => $composableBuilder(
    column: $table.semesterEnd,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get status => $composableBuilder(
    column: $table.status,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get driverApprovalStatus => $composableBuilder(
    column: $table.driverApprovalStatus,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get cachedAt => $composableBuilder(
    column: $table.cachedAt,
    builder: (column) => ColumnFilters(column),
  );
}

class $$JobsCacheTableOrderingComposer
    extends Composer<_$AppDatabase, $JobsCacheTable> {
  $$JobsCacheTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get jobName => $composableBuilder(
    column: $table.jobName,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get internalJobId => $composableBuilder(
    column: $table.internalJobId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get assignedDriverId => $composableBuilder(
    column: $table.assignedDriverId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get assignedPaId => $composableBuilder(
    column: $table.assignedPaId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get driverName => $composableBuilder(
    column: $table.driverName,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<bool> get hasOutbound => $composableBuilder(
    column: $table.hasOutbound,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<bool> get hasInbound => $composableBuilder(
    column: $table.hasInbound,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get morningStartTime => $composableBuilder(
    column: $table.morningStartTime,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get morningEndTime => $composableBuilder(
    column: $table.morningEndTime,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get eveningStartTime => $composableBuilder(
    column: $table.eveningStartTime,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get semesterStart => $composableBuilder(
    column: $table.semesterStart,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get semesterEnd => $composableBuilder(
    column: $table.semesterEnd,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get status => $composableBuilder(
    column: $table.status,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get driverApprovalStatus => $composableBuilder(
    column: $table.driverApprovalStatus,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get cachedAt => $composableBuilder(
    column: $table.cachedAt,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$JobsCacheTableAnnotationComposer
    extends Composer<_$AppDatabase, $JobsCacheTable> {
  $$JobsCacheTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get jobName =>
      $composableBuilder(column: $table.jobName, builder: (column) => column);

  GeneratedColumn<String> get internalJobId => $composableBuilder(
    column: $table.internalJobId,
    builder: (column) => column,
  );

  GeneratedColumn<String> get assignedDriverId => $composableBuilder(
    column: $table.assignedDriverId,
    builder: (column) => column,
  );

  GeneratedColumn<String> get assignedPaId => $composableBuilder(
    column: $table.assignedPaId,
    builder: (column) => column,
  );

  GeneratedColumn<String> get driverName => $composableBuilder(
    column: $table.driverName,
    builder: (column) => column,
  );

  GeneratedColumn<bool> get hasOutbound => $composableBuilder(
    column: $table.hasOutbound,
    builder: (column) => column,
  );

  GeneratedColumn<bool> get hasInbound => $composableBuilder(
    column: $table.hasInbound,
    builder: (column) => column,
  );

  GeneratedColumn<String> get morningStartTime => $composableBuilder(
    column: $table.morningStartTime,
    builder: (column) => column,
  );

  GeneratedColumn<String> get morningEndTime => $composableBuilder(
    column: $table.morningEndTime,
    builder: (column) => column,
  );

  GeneratedColumn<String> get eveningStartTime => $composableBuilder(
    column: $table.eveningStartTime,
    builder: (column) => column,
  );

  GeneratedColumn<String> get semesterStart => $composableBuilder(
    column: $table.semesterStart,
    builder: (column) => column,
  );

  GeneratedColumn<String> get semesterEnd => $composableBuilder(
    column: $table.semesterEnd,
    builder: (column) => column,
  );

  GeneratedColumn<String> get status =>
      $composableBuilder(column: $table.status, builder: (column) => column);

  GeneratedColumn<String> get driverApprovalStatus => $composableBuilder(
    column: $table.driverApprovalStatus,
    builder: (column) => column,
  );

  GeneratedColumn<DateTime> get cachedAt =>
      $composableBuilder(column: $table.cachedAt, builder: (column) => column);
}

class $$JobsCacheTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $JobsCacheTable,
          JobsCacheData,
          $$JobsCacheTableFilterComposer,
          $$JobsCacheTableOrderingComposer,
          $$JobsCacheTableAnnotationComposer,
          $$JobsCacheTableCreateCompanionBuilder,
          $$JobsCacheTableUpdateCompanionBuilder,
          (
            JobsCacheData,
            BaseReferences<_$AppDatabase, $JobsCacheTable, JobsCacheData>,
          ),
          JobsCacheData,
          PrefetchHooks Function()
        > {
  $$JobsCacheTableTableManager(_$AppDatabase db, $JobsCacheTable table)
    : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$JobsCacheTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$JobsCacheTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$JobsCacheTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                Value<String> id = const Value.absent(),
                Value<String> jobName = const Value.absent(),
                Value<String?> internalJobId = const Value.absent(),
                Value<String> assignedDriverId = const Value.absent(),
                Value<String?> assignedPaId = const Value.absent(),
                Value<String?> driverName = const Value.absent(),
                Value<bool> hasOutbound = const Value.absent(),
                Value<bool> hasInbound = const Value.absent(),
                Value<String?> morningStartTime = const Value.absent(),
                Value<String?> morningEndTime = const Value.absent(),
                Value<String?> eveningStartTime = const Value.absent(),
                Value<String> semesterStart = const Value.absent(),
                Value<String> semesterEnd = const Value.absent(),
                Value<String> status = const Value.absent(),
                Value<String?> driverApprovalStatus = const Value.absent(),
                Value<DateTime> cachedAt = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => JobsCacheCompanion(
                id: id,
                jobName: jobName,
                internalJobId: internalJobId,
                assignedDriverId: assignedDriverId,
                assignedPaId: assignedPaId,
                driverName: driverName,
                hasOutbound: hasOutbound,
                hasInbound: hasInbound,
                morningStartTime: morningStartTime,
                morningEndTime: morningEndTime,
                eveningStartTime: eveningStartTime,
                semesterStart: semesterStart,
                semesterEnd: semesterEnd,
                status: status,
                driverApprovalStatus: driverApprovalStatus,
                cachedAt: cachedAt,
                rowid: rowid,
              ),
          createCompanionCallback:
              ({
                required String id,
                required String jobName,
                Value<String?> internalJobId = const Value.absent(),
                required String assignedDriverId,
                Value<String?> assignedPaId = const Value.absent(),
                Value<String?> driverName = const Value.absent(),
                Value<bool> hasOutbound = const Value.absent(),
                Value<bool> hasInbound = const Value.absent(),
                Value<String?> morningStartTime = const Value.absent(),
                Value<String?> morningEndTime = const Value.absent(),
                Value<String?> eveningStartTime = const Value.absent(),
                required String semesterStart,
                required String semesterEnd,
                required String status,
                Value<String?> driverApprovalStatus = const Value.absent(),
                Value<DateTime> cachedAt = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => JobsCacheCompanion.insert(
                id: id,
                jobName: jobName,
                internalJobId: internalJobId,
                assignedDriverId: assignedDriverId,
                assignedPaId: assignedPaId,
                driverName: driverName,
                hasOutbound: hasOutbound,
                hasInbound: hasInbound,
                morningStartTime: morningStartTime,
                morningEndTime: morningEndTime,
                eveningStartTime: eveningStartTime,
                semesterStart: semesterStart,
                semesterEnd: semesterEnd,
                status: status,
                driverApprovalStatus: driverApprovalStatus,
                cachedAt: cachedAt,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$JobsCacheTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $JobsCacheTable,
      JobsCacheData,
      $$JobsCacheTableFilterComposer,
      $$JobsCacheTableOrderingComposer,
      $$JobsCacheTableAnnotationComposer,
      $$JobsCacheTableCreateCompanionBuilder,
      $$JobsCacheTableUpdateCompanionBuilder,
      (
        JobsCacheData,
        BaseReferences<_$AppDatabase, $JobsCacheTable, JobsCacheData>,
      ),
      JobsCacheData,
      PrefetchHooks Function()
    >;
typedef $$SchedulesCacheTableCreateCompanionBuilder =
    SchedulesCacheCompanion Function({
      required String id,
      required String jobId,
      required String passengerId,
      required String weekday,
      required String direction,
      required String pickupAddress,
      Value<String?> pickupPostcode,
      Value<double?> pickupLatitude,
      Value<double?> pickupLongitude,
      required String pickupTime,
      required String dropoffAddress,
      Value<String?> dropoffPostcode,
      Value<double?> dropoffLatitude,
      Value<double?> dropoffLongitude,
      Value<String?> dropoffTime,
      Value<String?> exceptionDate,
      Value<String?> exceptionType,
      Value<String?> notes,
      Value<int?> stopOrder,
      Value<DateTime> cachedAt,
      Value<int> rowid,
    });
typedef $$SchedulesCacheTableUpdateCompanionBuilder =
    SchedulesCacheCompanion Function({
      Value<String> id,
      Value<String> jobId,
      Value<String> passengerId,
      Value<String> weekday,
      Value<String> direction,
      Value<String> pickupAddress,
      Value<String?> pickupPostcode,
      Value<double?> pickupLatitude,
      Value<double?> pickupLongitude,
      Value<String> pickupTime,
      Value<String> dropoffAddress,
      Value<String?> dropoffPostcode,
      Value<double?> dropoffLatitude,
      Value<double?> dropoffLongitude,
      Value<String?> dropoffTime,
      Value<String?> exceptionDate,
      Value<String?> exceptionType,
      Value<String?> notes,
      Value<int?> stopOrder,
      Value<DateTime> cachedAt,
      Value<int> rowid,
    });

class $$SchedulesCacheTableFilterComposer
    extends Composer<_$AppDatabase, $SchedulesCacheTable> {
  $$SchedulesCacheTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get jobId => $composableBuilder(
    column: $table.jobId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get passengerId => $composableBuilder(
    column: $table.passengerId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get weekday => $composableBuilder(
    column: $table.weekday,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get direction => $composableBuilder(
    column: $table.direction,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get pickupAddress => $composableBuilder(
    column: $table.pickupAddress,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get pickupPostcode => $composableBuilder(
    column: $table.pickupPostcode,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get pickupLatitude => $composableBuilder(
    column: $table.pickupLatitude,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get pickupLongitude => $composableBuilder(
    column: $table.pickupLongitude,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get pickupTime => $composableBuilder(
    column: $table.pickupTime,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get dropoffAddress => $composableBuilder(
    column: $table.dropoffAddress,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get dropoffPostcode => $composableBuilder(
    column: $table.dropoffPostcode,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get dropoffLatitude => $composableBuilder(
    column: $table.dropoffLatitude,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get dropoffLongitude => $composableBuilder(
    column: $table.dropoffLongitude,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get dropoffTime => $composableBuilder(
    column: $table.dropoffTime,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get exceptionDate => $composableBuilder(
    column: $table.exceptionDate,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get exceptionType => $composableBuilder(
    column: $table.exceptionType,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get notes => $composableBuilder(
    column: $table.notes,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get stopOrder => $composableBuilder(
    column: $table.stopOrder,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get cachedAt => $composableBuilder(
    column: $table.cachedAt,
    builder: (column) => ColumnFilters(column),
  );
}

class $$SchedulesCacheTableOrderingComposer
    extends Composer<_$AppDatabase, $SchedulesCacheTable> {
  $$SchedulesCacheTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get jobId => $composableBuilder(
    column: $table.jobId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get passengerId => $composableBuilder(
    column: $table.passengerId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get weekday => $composableBuilder(
    column: $table.weekday,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get direction => $composableBuilder(
    column: $table.direction,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get pickupAddress => $composableBuilder(
    column: $table.pickupAddress,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get pickupPostcode => $composableBuilder(
    column: $table.pickupPostcode,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get pickupLatitude => $composableBuilder(
    column: $table.pickupLatitude,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get pickupLongitude => $composableBuilder(
    column: $table.pickupLongitude,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get pickupTime => $composableBuilder(
    column: $table.pickupTime,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get dropoffAddress => $composableBuilder(
    column: $table.dropoffAddress,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get dropoffPostcode => $composableBuilder(
    column: $table.dropoffPostcode,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get dropoffLatitude => $composableBuilder(
    column: $table.dropoffLatitude,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get dropoffLongitude => $composableBuilder(
    column: $table.dropoffLongitude,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get dropoffTime => $composableBuilder(
    column: $table.dropoffTime,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get exceptionDate => $composableBuilder(
    column: $table.exceptionDate,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get exceptionType => $composableBuilder(
    column: $table.exceptionType,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get notes => $composableBuilder(
    column: $table.notes,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get stopOrder => $composableBuilder(
    column: $table.stopOrder,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get cachedAt => $composableBuilder(
    column: $table.cachedAt,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$SchedulesCacheTableAnnotationComposer
    extends Composer<_$AppDatabase, $SchedulesCacheTable> {
  $$SchedulesCacheTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get jobId =>
      $composableBuilder(column: $table.jobId, builder: (column) => column);

  GeneratedColumn<String> get passengerId => $composableBuilder(
    column: $table.passengerId,
    builder: (column) => column,
  );

  GeneratedColumn<String> get weekday =>
      $composableBuilder(column: $table.weekday, builder: (column) => column);

  GeneratedColumn<String> get direction =>
      $composableBuilder(column: $table.direction, builder: (column) => column);

  GeneratedColumn<String> get pickupAddress => $composableBuilder(
    column: $table.pickupAddress,
    builder: (column) => column,
  );

  GeneratedColumn<String> get pickupPostcode => $composableBuilder(
    column: $table.pickupPostcode,
    builder: (column) => column,
  );

  GeneratedColumn<double> get pickupLatitude => $composableBuilder(
    column: $table.pickupLatitude,
    builder: (column) => column,
  );

  GeneratedColumn<double> get pickupLongitude => $composableBuilder(
    column: $table.pickupLongitude,
    builder: (column) => column,
  );

  GeneratedColumn<String> get pickupTime => $composableBuilder(
    column: $table.pickupTime,
    builder: (column) => column,
  );

  GeneratedColumn<String> get dropoffAddress => $composableBuilder(
    column: $table.dropoffAddress,
    builder: (column) => column,
  );

  GeneratedColumn<String> get dropoffPostcode => $composableBuilder(
    column: $table.dropoffPostcode,
    builder: (column) => column,
  );

  GeneratedColumn<double> get dropoffLatitude => $composableBuilder(
    column: $table.dropoffLatitude,
    builder: (column) => column,
  );

  GeneratedColumn<double> get dropoffLongitude => $composableBuilder(
    column: $table.dropoffLongitude,
    builder: (column) => column,
  );

  GeneratedColumn<String> get dropoffTime => $composableBuilder(
    column: $table.dropoffTime,
    builder: (column) => column,
  );

  GeneratedColumn<String> get exceptionDate => $composableBuilder(
    column: $table.exceptionDate,
    builder: (column) => column,
  );

  GeneratedColumn<String> get exceptionType => $composableBuilder(
    column: $table.exceptionType,
    builder: (column) => column,
  );

  GeneratedColumn<String> get notes =>
      $composableBuilder(column: $table.notes, builder: (column) => column);

  GeneratedColumn<int> get stopOrder =>
      $composableBuilder(column: $table.stopOrder, builder: (column) => column);

  GeneratedColumn<DateTime> get cachedAt =>
      $composableBuilder(column: $table.cachedAt, builder: (column) => column);
}

class $$SchedulesCacheTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $SchedulesCacheTable,
          SchedulesCacheData,
          $$SchedulesCacheTableFilterComposer,
          $$SchedulesCacheTableOrderingComposer,
          $$SchedulesCacheTableAnnotationComposer,
          $$SchedulesCacheTableCreateCompanionBuilder,
          $$SchedulesCacheTableUpdateCompanionBuilder,
          (
            SchedulesCacheData,
            BaseReferences<
              _$AppDatabase,
              $SchedulesCacheTable,
              SchedulesCacheData
            >,
          ),
          SchedulesCacheData,
          PrefetchHooks Function()
        > {
  $$SchedulesCacheTableTableManager(
    _$AppDatabase db,
    $SchedulesCacheTable table,
  ) : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$SchedulesCacheTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$SchedulesCacheTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$SchedulesCacheTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                Value<String> id = const Value.absent(),
                Value<String> jobId = const Value.absent(),
                Value<String> passengerId = const Value.absent(),
                Value<String> weekday = const Value.absent(),
                Value<String> direction = const Value.absent(),
                Value<String> pickupAddress = const Value.absent(),
                Value<String?> pickupPostcode = const Value.absent(),
                Value<double?> pickupLatitude = const Value.absent(),
                Value<double?> pickupLongitude = const Value.absent(),
                Value<String> pickupTime = const Value.absent(),
                Value<String> dropoffAddress = const Value.absent(),
                Value<String?> dropoffPostcode = const Value.absent(),
                Value<double?> dropoffLatitude = const Value.absent(),
                Value<double?> dropoffLongitude = const Value.absent(),
                Value<String?> dropoffTime = const Value.absent(),
                Value<String?> exceptionDate = const Value.absent(),
                Value<String?> exceptionType = const Value.absent(),
                Value<String?> notes = const Value.absent(),
                Value<int?> stopOrder = const Value.absent(),
                Value<DateTime> cachedAt = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => SchedulesCacheCompanion(
                id: id,
                jobId: jobId,
                passengerId: passengerId,
                weekday: weekday,
                direction: direction,
                pickupAddress: pickupAddress,
                pickupPostcode: pickupPostcode,
                pickupLatitude: pickupLatitude,
                pickupLongitude: pickupLongitude,
                pickupTime: pickupTime,
                dropoffAddress: dropoffAddress,
                dropoffPostcode: dropoffPostcode,
                dropoffLatitude: dropoffLatitude,
                dropoffLongitude: dropoffLongitude,
                dropoffTime: dropoffTime,
                exceptionDate: exceptionDate,
                exceptionType: exceptionType,
                notes: notes,
                stopOrder: stopOrder,
                cachedAt: cachedAt,
                rowid: rowid,
              ),
          createCompanionCallback:
              ({
                required String id,
                required String jobId,
                required String passengerId,
                required String weekday,
                required String direction,
                required String pickupAddress,
                Value<String?> pickupPostcode = const Value.absent(),
                Value<double?> pickupLatitude = const Value.absent(),
                Value<double?> pickupLongitude = const Value.absent(),
                required String pickupTime,
                required String dropoffAddress,
                Value<String?> dropoffPostcode = const Value.absent(),
                Value<double?> dropoffLatitude = const Value.absent(),
                Value<double?> dropoffLongitude = const Value.absent(),
                Value<String?> dropoffTime = const Value.absent(),
                Value<String?> exceptionDate = const Value.absent(),
                Value<String?> exceptionType = const Value.absent(),
                Value<String?> notes = const Value.absent(),
                Value<int?> stopOrder = const Value.absent(),
                Value<DateTime> cachedAt = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => SchedulesCacheCompanion.insert(
                id: id,
                jobId: jobId,
                passengerId: passengerId,
                weekday: weekday,
                direction: direction,
                pickupAddress: pickupAddress,
                pickupPostcode: pickupPostcode,
                pickupLatitude: pickupLatitude,
                pickupLongitude: pickupLongitude,
                pickupTime: pickupTime,
                dropoffAddress: dropoffAddress,
                dropoffPostcode: dropoffPostcode,
                dropoffLatitude: dropoffLatitude,
                dropoffLongitude: dropoffLongitude,
                dropoffTime: dropoffTime,
                exceptionDate: exceptionDate,
                exceptionType: exceptionType,
                notes: notes,
                stopOrder: stopOrder,
                cachedAt: cachedAt,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$SchedulesCacheTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $SchedulesCacheTable,
      SchedulesCacheData,
      $$SchedulesCacheTableFilterComposer,
      $$SchedulesCacheTableOrderingComposer,
      $$SchedulesCacheTableAnnotationComposer,
      $$SchedulesCacheTableCreateCompanionBuilder,
      $$SchedulesCacheTableUpdateCompanionBuilder,
      (
        SchedulesCacheData,
        BaseReferences<_$AppDatabase, $SchedulesCacheTable, SchedulesCacheData>,
      ),
      SchedulesCacheData,
      PrefetchHooks Function()
    >;
typedef $$PassengersCacheTableCreateCompanionBuilder =
    PassengersCacheCompanion Function({
      required String id,
      required String firstName,
      required String surname,
      Value<String?> contactNumber1,
      Value<String?> educationalSiteAddress,
      Value<String?> educationalSitePostcode,
      Value<double?> educationalSiteLatitude,
      Value<double?> educationalSiteLongitude,
      Value<String?> educationalSiteDropoffTime,
      Value<bool> wheelchairRequired,
      Value<bool> harnessRequired,
      Value<DateTime> cachedAt,
      Value<int> rowid,
    });
typedef $$PassengersCacheTableUpdateCompanionBuilder =
    PassengersCacheCompanion Function({
      Value<String> id,
      Value<String> firstName,
      Value<String> surname,
      Value<String?> contactNumber1,
      Value<String?> educationalSiteAddress,
      Value<String?> educationalSitePostcode,
      Value<double?> educationalSiteLatitude,
      Value<double?> educationalSiteLongitude,
      Value<String?> educationalSiteDropoffTime,
      Value<bool> wheelchairRequired,
      Value<bool> harnessRequired,
      Value<DateTime> cachedAt,
      Value<int> rowid,
    });

class $$PassengersCacheTableFilterComposer
    extends Composer<_$AppDatabase, $PassengersCacheTable> {
  $$PassengersCacheTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get firstName => $composableBuilder(
    column: $table.firstName,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get surname => $composableBuilder(
    column: $table.surname,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get contactNumber1 => $composableBuilder(
    column: $table.contactNumber1,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get educationalSiteAddress => $composableBuilder(
    column: $table.educationalSiteAddress,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get educationalSitePostcode => $composableBuilder(
    column: $table.educationalSitePostcode,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get educationalSiteLatitude => $composableBuilder(
    column: $table.educationalSiteLatitude,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get educationalSiteLongitude => $composableBuilder(
    column: $table.educationalSiteLongitude,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get educationalSiteDropoffTime => $composableBuilder(
    column: $table.educationalSiteDropoffTime,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<bool> get wheelchairRequired => $composableBuilder(
    column: $table.wheelchairRequired,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<bool> get harnessRequired => $composableBuilder(
    column: $table.harnessRequired,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get cachedAt => $composableBuilder(
    column: $table.cachedAt,
    builder: (column) => ColumnFilters(column),
  );
}

class $$PassengersCacheTableOrderingComposer
    extends Composer<_$AppDatabase, $PassengersCacheTable> {
  $$PassengersCacheTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get firstName => $composableBuilder(
    column: $table.firstName,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get surname => $composableBuilder(
    column: $table.surname,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get contactNumber1 => $composableBuilder(
    column: $table.contactNumber1,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get educationalSiteAddress => $composableBuilder(
    column: $table.educationalSiteAddress,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get educationalSitePostcode => $composableBuilder(
    column: $table.educationalSitePostcode,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get educationalSiteLatitude => $composableBuilder(
    column: $table.educationalSiteLatitude,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get educationalSiteLongitude => $composableBuilder(
    column: $table.educationalSiteLongitude,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get educationalSiteDropoffTime => $composableBuilder(
    column: $table.educationalSiteDropoffTime,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<bool> get wheelchairRequired => $composableBuilder(
    column: $table.wheelchairRequired,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<bool> get harnessRequired => $composableBuilder(
    column: $table.harnessRequired,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get cachedAt => $composableBuilder(
    column: $table.cachedAt,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$PassengersCacheTableAnnotationComposer
    extends Composer<_$AppDatabase, $PassengersCacheTable> {
  $$PassengersCacheTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get firstName =>
      $composableBuilder(column: $table.firstName, builder: (column) => column);

  GeneratedColumn<String> get surname =>
      $composableBuilder(column: $table.surname, builder: (column) => column);

  GeneratedColumn<String> get contactNumber1 => $composableBuilder(
    column: $table.contactNumber1,
    builder: (column) => column,
  );

  GeneratedColumn<String> get educationalSiteAddress => $composableBuilder(
    column: $table.educationalSiteAddress,
    builder: (column) => column,
  );

  GeneratedColumn<String> get educationalSitePostcode => $composableBuilder(
    column: $table.educationalSitePostcode,
    builder: (column) => column,
  );

  GeneratedColumn<double> get educationalSiteLatitude => $composableBuilder(
    column: $table.educationalSiteLatitude,
    builder: (column) => column,
  );

  GeneratedColumn<double> get educationalSiteLongitude => $composableBuilder(
    column: $table.educationalSiteLongitude,
    builder: (column) => column,
  );

  GeneratedColumn<String> get educationalSiteDropoffTime => $composableBuilder(
    column: $table.educationalSiteDropoffTime,
    builder: (column) => column,
  );

  GeneratedColumn<bool> get wheelchairRequired => $composableBuilder(
    column: $table.wheelchairRequired,
    builder: (column) => column,
  );

  GeneratedColumn<bool> get harnessRequired => $composableBuilder(
    column: $table.harnessRequired,
    builder: (column) => column,
  );

  GeneratedColumn<DateTime> get cachedAt =>
      $composableBuilder(column: $table.cachedAt, builder: (column) => column);
}

class $$PassengersCacheTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $PassengersCacheTable,
          PassengersCacheData,
          $$PassengersCacheTableFilterComposer,
          $$PassengersCacheTableOrderingComposer,
          $$PassengersCacheTableAnnotationComposer,
          $$PassengersCacheTableCreateCompanionBuilder,
          $$PassengersCacheTableUpdateCompanionBuilder,
          (
            PassengersCacheData,
            BaseReferences<
              _$AppDatabase,
              $PassengersCacheTable,
              PassengersCacheData
            >,
          ),
          PassengersCacheData,
          PrefetchHooks Function()
        > {
  $$PassengersCacheTableTableManager(
    _$AppDatabase db,
    $PassengersCacheTable table,
  ) : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$PassengersCacheTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$PassengersCacheTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$PassengersCacheTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                Value<String> id = const Value.absent(),
                Value<String> firstName = const Value.absent(),
                Value<String> surname = const Value.absent(),
                Value<String?> contactNumber1 = const Value.absent(),
                Value<String?> educationalSiteAddress = const Value.absent(),
                Value<String?> educationalSitePostcode = const Value.absent(),
                Value<double?> educationalSiteLatitude = const Value.absent(),
                Value<double?> educationalSiteLongitude = const Value.absent(),
                Value<String?> educationalSiteDropoffTime =
                    const Value.absent(),
                Value<bool> wheelchairRequired = const Value.absent(),
                Value<bool> harnessRequired = const Value.absent(),
                Value<DateTime> cachedAt = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => PassengersCacheCompanion(
                id: id,
                firstName: firstName,
                surname: surname,
                contactNumber1: contactNumber1,
                educationalSiteAddress: educationalSiteAddress,
                educationalSitePostcode: educationalSitePostcode,
                educationalSiteLatitude: educationalSiteLatitude,
                educationalSiteLongitude: educationalSiteLongitude,
                educationalSiteDropoffTime: educationalSiteDropoffTime,
                wheelchairRequired: wheelchairRequired,
                harnessRequired: harnessRequired,
                cachedAt: cachedAt,
                rowid: rowid,
              ),
          createCompanionCallback:
              ({
                required String id,
                required String firstName,
                required String surname,
                Value<String?> contactNumber1 = const Value.absent(),
                Value<String?> educationalSiteAddress = const Value.absent(),
                Value<String?> educationalSitePostcode = const Value.absent(),
                Value<double?> educationalSiteLatitude = const Value.absent(),
                Value<double?> educationalSiteLongitude = const Value.absent(),
                Value<String?> educationalSiteDropoffTime =
                    const Value.absent(),
                Value<bool> wheelchairRequired = const Value.absent(),
                Value<bool> harnessRequired = const Value.absent(),
                Value<DateTime> cachedAt = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => PassengersCacheCompanion.insert(
                id: id,
                firstName: firstName,
                surname: surname,
                contactNumber1: contactNumber1,
                educationalSiteAddress: educationalSiteAddress,
                educationalSitePostcode: educationalSitePostcode,
                educationalSiteLatitude: educationalSiteLatitude,
                educationalSiteLongitude: educationalSiteLongitude,
                educationalSiteDropoffTime: educationalSiteDropoffTime,
                wheelchairRequired: wheelchairRequired,
                harnessRequired: harnessRequired,
                cachedAt: cachedAt,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$PassengersCacheTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $PassengersCacheTable,
      PassengersCacheData,
      $$PassengersCacheTableFilterComposer,
      $$PassengersCacheTableOrderingComposer,
      $$PassengersCacheTableAnnotationComposer,
      $$PassengersCacheTableCreateCompanionBuilder,
      $$PassengersCacheTableUpdateCompanionBuilder,
      (
        PassengersCacheData,
        BaseReferences<
          _$AppDatabase,
          $PassengersCacheTable,
          PassengersCacheData
        >,
      ),
      PassengersCacheData,
      PrefetchHooks Function()
    >;
typedef $$VehiclesCacheTableCreateCompanionBuilder =
    VehiclesCacheCompanion Function({
      required String id,
      required String companyId,
      Value<String?> name,
      Value<String?> make,
      Value<String?> model,
      required String taxiLicensePlateNumber,
      Value<String?> yearOfFirstRegistration,
      Value<DateTime> cachedAt,
      Value<int> rowid,
    });
typedef $$VehiclesCacheTableUpdateCompanionBuilder =
    VehiclesCacheCompanion Function({
      Value<String> id,
      Value<String> companyId,
      Value<String?> name,
      Value<String?> make,
      Value<String?> model,
      Value<String> taxiLicensePlateNumber,
      Value<String?> yearOfFirstRegistration,
      Value<DateTime> cachedAt,
      Value<int> rowid,
    });

class $$VehiclesCacheTableFilterComposer
    extends Composer<_$AppDatabase, $VehiclesCacheTable> {
  $$VehiclesCacheTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get companyId => $composableBuilder(
    column: $table.companyId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get name => $composableBuilder(
    column: $table.name,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get make => $composableBuilder(
    column: $table.make,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get model => $composableBuilder(
    column: $table.model,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get taxiLicensePlateNumber => $composableBuilder(
    column: $table.taxiLicensePlateNumber,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get yearOfFirstRegistration => $composableBuilder(
    column: $table.yearOfFirstRegistration,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get cachedAt => $composableBuilder(
    column: $table.cachedAt,
    builder: (column) => ColumnFilters(column),
  );
}

class $$VehiclesCacheTableOrderingComposer
    extends Composer<_$AppDatabase, $VehiclesCacheTable> {
  $$VehiclesCacheTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get companyId => $composableBuilder(
    column: $table.companyId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get name => $composableBuilder(
    column: $table.name,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get make => $composableBuilder(
    column: $table.make,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get model => $composableBuilder(
    column: $table.model,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get taxiLicensePlateNumber => $composableBuilder(
    column: $table.taxiLicensePlateNumber,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get yearOfFirstRegistration => $composableBuilder(
    column: $table.yearOfFirstRegistration,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get cachedAt => $composableBuilder(
    column: $table.cachedAt,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$VehiclesCacheTableAnnotationComposer
    extends Composer<_$AppDatabase, $VehiclesCacheTable> {
  $$VehiclesCacheTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get companyId =>
      $composableBuilder(column: $table.companyId, builder: (column) => column);

  GeneratedColumn<String> get name =>
      $composableBuilder(column: $table.name, builder: (column) => column);

  GeneratedColumn<String> get make =>
      $composableBuilder(column: $table.make, builder: (column) => column);

  GeneratedColumn<String> get model =>
      $composableBuilder(column: $table.model, builder: (column) => column);

  GeneratedColumn<String> get taxiLicensePlateNumber => $composableBuilder(
    column: $table.taxiLicensePlateNumber,
    builder: (column) => column,
  );

  GeneratedColumn<String> get yearOfFirstRegistration => $composableBuilder(
    column: $table.yearOfFirstRegistration,
    builder: (column) => column,
  );

  GeneratedColumn<DateTime> get cachedAt =>
      $composableBuilder(column: $table.cachedAt, builder: (column) => column);
}

class $$VehiclesCacheTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $VehiclesCacheTable,
          VehiclesCacheData,
          $$VehiclesCacheTableFilterComposer,
          $$VehiclesCacheTableOrderingComposer,
          $$VehiclesCacheTableAnnotationComposer,
          $$VehiclesCacheTableCreateCompanionBuilder,
          $$VehiclesCacheTableUpdateCompanionBuilder,
          (
            VehiclesCacheData,
            BaseReferences<
              _$AppDatabase,
              $VehiclesCacheTable,
              VehiclesCacheData
            >,
          ),
          VehiclesCacheData,
          PrefetchHooks Function()
        > {
  $$VehiclesCacheTableTableManager(_$AppDatabase db, $VehiclesCacheTable table)
    : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$VehiclesCacheTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$VehiclesCacheTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$VehiclesCacheTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                Value<String> id = const Value.absent(),
                Value<String> companyId = const Value.absent(),
                Value<String?> name = const Value.absent(),
                Value<String?> make = const Value.absent(),
                Value<String?> model = const Value.absent(),
                Value<String> taxiLicensePlateNumber = const Value.absent(),
                Value<String?> yearOfFirstRegistration = const Value.absent(),
                Value<DateTime> cachedAt = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => VehiclesCacheCompanion(
                id: id,
                companyId: companyId,
                name: name,
                make: make,
                model: model,
                taxiLicensePlateNumber: taxiLicensePlateNumber,
                yearOfFirstRegistration: yearOfFirstRegistration,
                cachedAt: cachedAt,
                rowid: rowid,
              ),
          createCompanionCallback:
              ({
                required String id,
                required String companyId,
                Value<String?> name = const Value.absent(),
                Value<String?> make = const Value.absent(),
                Value<String?> model = const Value.absent(),
                required String taxiLicensePlateNumber,
                Value<String?> yearOfFirstRegistration = const Value.absent(),
                Value<DateTime> cachedAt = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => VehiclesCacheCompanion.insert(
                id: id,
                companyId: companyId,
                name: name,
                make: make,
                model: model,
                taxiLicensePlateNumber: taxiLicensePlateNumber,
                yearOfFirstRegistration: yearOfFirstRegistration,
                cachedAt: cachedAt,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$VehiclesCacheTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $VehiclesCacheTable,
      VehiclesCacheData,
      $$VehiclesCacheTableFilterComposer,
      $$VehiclesCacheTableOrderingComposer,
      $$VehiclesCacheTableAnnotationComposer,
      $$VehiclesCacheTableCreateCompanionBuilder,
      $$VehiclesCacheTableUpdateCompanionBuilder,
      (
        VehiclesCacheData,
        BaseReferences<_$AppDatabase, $VehiclesCacheTable, VehiclesCacheData>,
      ),
      VehiclesCacheData,
      PrefetchHooks Function()
    >;
typedef $$SessionsLocalTableCreateCompanionBuilder =
    SessionsLocalCompanion Function({
      required String localId,
      Value<String?> serverId,
      required String jobId,
      required String sessionDate,
      required String direction,
      Value<String> status,
      required String driverId,
      Value<DateTime> startedAt,
      Value<DateTime?> completedAt,
      Value<String?> note,
      Value<bool> isSynced,
      Value<DateTime> createdAt,
      Value<DateTime> updatedAt,
      Value<int> rowid,
    });
typedef $$SessionsLocalTableUpdateCompanionBuilder =
    SessionsLocalCompanion Function({
      Value<String> localId,
      Value<String?> serverId,
      Value<String> jobId,
      Value<String> sessionDate,
      Value<String> direction,
      Value<String> status,
      Value<String> driverId,
      Value<DateTime> startedAt,
      Value<DateTime?> completedAt,
      Value<String?> note,
      Value<bool> isSynced,
      Value<DateTime> createdAt,
      Value<DateTime> updatedAt,
      Value<int> rowid,
    });

class $$SessionsLocalTableFilterComposer
    extends Composer<_$AppDatabase, $SessionsLocalTable> {
  $$SessionsLocalTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get localId => $composableBuilder(
    column: $table.localId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get serverId => $composableBuilder(
    column: $table.serverId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get jobId => $composableBuilder(
    column: $table.jobId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get sessionDate => $composableBuilder(
    column: $table.sessionDate,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get direction => $composableBuilder(
    column: $table.direction,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get status => $composableBuilder(
    column: $table.status,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get driverId => $composableBuilder(
    column: $table.driverId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get startedAt => $composableBuilder(
    column: $table.startedAt,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get completedAt => $composableBuilder(
    column: $table.completedAt,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get note => $composableBuilder(
    column: $table.note,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<bool> get isSynced => $composableBuilder(
    column: $table.isSynced,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get createdAt => $composableBuilder(
    column: $table.createdAt,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get updatedAt => $composableBuilder(
    column: $table.updatedAt,
    builder: (column) => ColumnFilters(column),
  );
}

class $$SessionsLocalTableOrderingComposer
    extends Composer<_$AppDatabase, $SessionsLocalTable> {
  $$SessionsLocalTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get localId => $composableBuilder(
    column: $table.localId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get serverId => $composableBuilder(
    column: $table.serverId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get jobId => $composableBuilder(
    column: $table.jobId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get sessionDate => $composableBuilder(
    column: $table.sessionDate,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get direction => $composableBuilder(
    column: $table.direction,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get status => $composableBuilder(
    column: $table.status,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get driverId => $composableBuilder(
    column: $table.driverId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get startedAt => $composableBuilder(
    column: $table.startedAt,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get completedAt => $composableBuilder(
    column: $table.completedAt,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get note => $composableBuilder(
    column: $table.note,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<bool> get isSynced => $composableBuilder(
    column: $table.isSynced,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get createdAt => $composableBuilder(
    column: $table.createdAt,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get updatedAt => $composableBuilder(
    column: $table.updatedAt,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$SessionsLocalTableAnnotationComposer
    extends Composer<_$AppDatabase, $SessionsLocalTable> {
  $$SessionsLocalTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get localId =>
      $composableBuilder(column: $table.localId, builder: (column) => column);

  GeneratedColumn<String> get serverId =>
      $composableBuilder(column: $table.serverId, builder: (column) => column);

  GeneratedColumn<String> get jobId =>
      $composableBuilder(column: $table.jobId, builder: (column) => column);

  GeneratedColumn<String> get sessionDate => $composableBuilder(
    column: $table.sessionDate,
    builder: (column) => column,
  );

  GeneratedColumn<String> get direction =>
      $composableBuilder(column: $table.direction, builder: (column) => column);

  GeneratedColumn<String> get status =>
      $composableBuilder(column: $table.status, builder: (column) => column);

  GeneratedColumn<String> get driverId =>
      $composableBuilder(column: $table.driverId, builder: (column) => column);

  GeneratedColumn<DateTime> get startedAt =>
      $composableBuilder(column: $table.startedAt, builder: (column) => column);

  GeneratedColumn<DateTime> get completedAt => $composableBuilder(
    column: $table.completedAt,
    builder: (column) => column,
  );

  GeneratedColumn<String> get note =>
      $composableBuilder(column: $table.note, builder: (column) => column);

  GeneratedColumn<bool> get isSynced =>
      $composableBuilder(column: $table.isSynced, builder: (column) => column);

  GeneratedColumn<DateTime> get createdAt =>
      $composableBuilder(column: $table.createdAt, builder: (column) => column);

  GeneratedColumn<DateTime> get updatedAt =>
      $composableBuilder(column: $table.updatedAt, builder: (column) => column);
}

class $$SessionsLocalTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $SessionsLocalTable,
          SessionsLocalData,
          $$SessionsLocalTableFilterComposer,
          $$SessionsLocalTableOrderingComposer,
          $$SessionsLocalTableAnnotationComposer,
          $$SessionsLocalTableCreateCompanionBuilder,
          $$SessionsLocalTableUpdateCompanionBuilder,
          (
            SessionsLocalData,
            BaseReferences<
              _$AppDatabase,
              $SessionsLocalTable,
              SessionsLocalData
            >,
          ),
          SessionsLocalData,
          PrefetchHooks Function()
        > {
  $$SessionsLocalTableTableManager(_$AppDatabase db, $SessionsLocalTable table)
    : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$SessionsLocalTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$SessionsLocalTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$SessionsLocalTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                Value<String> localId = const Value.absent(),
                Value<String?> serverId = const Value.absent(),
                Value<String> jobId = const Value.absent(),
                Value<String> sessionDate = const Value.absent(),
                Value<String> direction = const Value.absent(),
                Value<String> status = const Value.absent(),
                Value<String> driverId = const Value.absent(),
                Value<DateTime> startedAt = const Value.absent(),
                Value<DateTime?> completedAt = const Value.absent(),
                Value<String?> note = const Value.absent(),
                Value<bool> isSynced = const Value.absent(),
                Value<DateTime> createdAt = const Value.absent(),
                Value<DateTime> updatedAt = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => SessionsLocalCompanion(
                localId: localId,
                serverId: serverId,
                jobId: jobId,
                sessionDate: sessionDate,
                direction: direction,
                status: status,
                driverId: driverId,
                startedAt: startedAt,
                completedAt: completedAt,
                note: note,
                isSynced: isSynced,
                createdAt: createdAt,
                updatedAt: updatedAt,
                rowid: rowid,
              ),
          createCompanionCallback:
              ({
                required String localId,
                Value<String?> serverId = const Value.absent(),
                required String jobId,
                required String sessionDate,
                required String direction,
                Value<String> status = const Value.absent(),
                required String driverId,
                Value<DateTime> startedAt = const Value.absent(),
                Value<DateTime?> completedAt = const Value.absent(),
                Value<String?> note = const Value.absent(),
                Value<bool> isSynced = const Value.absent(),
                Value<DateTime> createdAt = const Value.absent(),
                Value<DateTime> updatedAt = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => SessionsLocalCompanion.insert(
                localId: localId,
                serverId: serverId,
                jobId: jobId,
                sessionDate: sessionDate,
                direction: direction,
                status: status,
                driverId: driverId,
                startedAt: startedAt,
                completedAt: completedAt,
                note: note,
                isSynced: isSynced,
                createdAt: createdAt,
                updatedAt: updatedAt,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$SessionsLocalTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $SessionsLocalTable,
      SessionsLocalData,
      $$SessionsLocalTableFilterComposer,
      $$SessionsLocalTableOrderingComposer,
      $$SessionsLocalTableAnnotationComposer,
      $$SessionsLocalTableCreateCompanionBuilder,
      $$SessionsLocalTableUpdateCompanionBuilder,
      (
        SessionsLocalData,
        BaseReferences<_$AppDatabase, $SessionsLocalTable, SessionsLocalData>,
      ),
      SessionsLocalData,
      PrefetchHooks Function()
    >;
typedef $$PassengersLocalTableCreateCompanionBuilder =
    PassengersLocalCompanion Function({
      required String localId,
      Value<String?> serverId,
      required String localSessionId,
      required String passengerId,
      required int stopOrder,
      Value<String> status,
      required String pickupAddress,
      Value<String?> pickupPostcode,
      Value<double?> pickupLatitude,
      Value<double?> pickupLongitude,
      required String dropoffAddress,
      Value<String?> dropoffPostcode,
      Value<DateTime?> pickedUpAt,
      Value<DateTime?> droppedOffAt,
      Value<String?> notes,
      Value<bool> isSynced,
      Value<DateTime> createdAt,
      Value<DateTime> updatedAt,
      Value<int> rowid,
    });
typedef $$PassengersLocalTableUpdateCompanionBuilder =
    PassengersLocalCompanion Function({
      Value<String> localId,
      Value<String?> serverId,
      Value<String> localSessionId,
      Value<String> passengerId,
      Value<int> stopOrder,
      Value<String> status,
      Value<String> pickupAddress,
      Value<String?> pickupPostcode,
      Value<double?> pickupLatitude,
      Value<double?> pickupLongitude,
      Value<String> dropoffAddress,
      Value<String?> dropoffPostcode,
      Value<DateTime?> pickedUpAt,
      Value<DateTime?> droppedOffAt,
      Value<String?> notes,
      Value<bool> isSynced,
      Value<DateTime> createdAt,
      Value<DateTime> updatedAt,
      Value<int> rowid,
    });

class $$PassengersLocalTableFilterComposer
    extends Composer<_$AppDatabase, $PassengersLocalTable> {
  $$PassengersLocalTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get localId => $composableBuilder(
    column: $table.localId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get serverId => $composableBuilder(
    column: $table.serverId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get localSessionId => $composableBuilder(
    column: $table.localSessionId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get passengerId => $composableBuilder(
    column: $table.passengerId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get stopOrder => $composableBuilder(
    column: $table.stopOrder,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get status => $composableBuilder(
    column: $table.status,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get pickupAddress => $composableBuilder(
    column: $table.pickupAddress,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get pickupPostcode => $composableBuilder(
    column: $table.pickupPostcode,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get pickupLatitude => $composableBuilder(
    column: $table.pickupLatitude,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<double> get pickupLongitude => $composableBuilder(
    column: $table.pickupLongitude,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get dropoffAddress => $composableBuilder(
    column: $table.dropoffAddress,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get dropoffPostcode => $composableBuilder(
    column: $table.dropoffPostcode,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get pickedUpAt => $composableBuilder(
    column: $table.pickedUpAt,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get droppedOffAt => $composableBuilder(
    column: $table.droppedOffAt,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get notes => $composableBuilder(
    column: $table.notes,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<bool> get isSynced => $composableBuilder(
    column: $table.isSynced,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get createdAt => $composableBuilder(
    column: $table.createdAt,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get updatedAt => $composableBuilder(
    column: $table.updatedAt,
    builder: (column) => ColumnFilters(column),
  );
}

class $$PassengersLocalTableOrderingComposer
    extends Composer<_$AppDatabase, $PassengersLocalTable> {
  $$PassengersLocalTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get localId => $composableBuilder(
    column: $table.localId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get serverId => $composableBuilder(
    column: $table.serverId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get localSessionId => $composableBuilder(
    column: $table.localSessionId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get passengerId => $composableBuilder(
    column: $table.passengerId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get stopOrder => $composableBuilder(
    column: $table.stopOrder,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get status => $composableBuilder(
    column: $table.status,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get pickupAddress => $composableBuilder(
    column: $table.pickupAddress,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get pickupPostcode => $composableBuilder(
    column: $table.pickupPostcode,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get pickupLatitude => $composableBuilder(
    column: $table.pickupLatitude,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<double> get pickupLongitude => $composableBuilder(
    column: $table.pickupLongitude,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get dropoffAddress => $composableBuilder(
    column: $table.dropoffAddress,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get dropoffPostcode => $composableBuilder(
    column: $table.dropoffPostcode,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get pickedUpAt => $composableBuilder(
    column: $table.pickedUpAt,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get droppedOffAt => $composableBuilder(
    column: $table.droppedOffAt,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get notes => $composableBuilder(
    column: $table.notes,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<bool> get isSynced => $composableBuilder(
    column: $table.isSynced,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get createdAt => $composableBuilder(
    column: $table.createdAt,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get updatedAt => $composableBuilder(
    column: $table.updatedAt,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$PassengersLocalTableAnnotationComposer
    extends Composer<_$AppDatabase, $PassengersLocalTable> {
  $$PassengersLocalTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get localId =>
      $composableBuilder(column: $table.localId, builder: (column) => column);

  GeneratedColumn<String> get serverId =>
      $composableBuilder(column: $table.serverId, builder: (column) => column);

  GeneratedColumn<String> get localSessionId => $composableBuilder(
    column: $table.localSessionId,
    builder: (column) => column,
  );

  GeneratedColumn<String> get passengerId => $composableBuilder(
    column: $table.passengerId,
    builder: (column) => column,
  );

  GeneratedColumn<int> get stopOrder =>
      $composableBuilder(column: $table.stopOrder, builder: (column) => column);

  GeneratedColumn<String> get status =>
      $composableBuilder(column: $table.status, builder: (column) => column);

  GeneratedColumn<String> get pickupAddress => $composableBuilder(
    column: $table.pickupAddress,
    builder: (column) => column,
  );

  GeneratedColumn<String> get pickupPostcode => $composableBuilder(
    column: $table.pickupPostcode,
    builder: (column) => column,
  );

  GeneratedColumn<double> get pickupLatitude => $composableBuilder(
    column: $table.pickupLatitude,
    builder: (column) => column,
  );

  GeneratedColumn<double> get pickupLongitude => $composableBuilder(
    column: $table.pickupLongitude,
    builder: (column) => column,
  );

  GeneratedColumn<String> get dropoffAddress => $composableBuilder(
    column: $table.dropoffAddress,
    builder: (column) => column,
  );

  GeneratedColumn<String> get dropoffPostcode => $composableBuilder(
    column: $table.dropoffPostcode,
    builder: (column) => column,
  );

  GeneratedColumn<DateTime> get pickedUpAt => $composableBuilder(
    column: $table.pickedUpAt,
    builder: (column) => column,
  );

  GeneratedColumn<DateTime> get droppedOffAt => $composableBuilder(
    column: $table.droppedOffAt,
    builder: (column) => column,
  );

  GeneratedColumn<String> get notes =>
      $composableBuilder(column: $table.notes, builder: (column) => column);

  GeneratedColumn<bool> get isSynced =>
      $composableBuilder(column: $table.isSynced, builder: (column) => column);

  GeneratedColumn<DateTime> get createdAt =>
      $composableBuilder(column: $table.createdAt, builder: (column) => column);

  GeneratedColumn<DateTime> get updatedAt =>
      $composableBuilder(column: $table.updatedAt, builder: (column) => column);
}

class $$PassengersLocalTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $PassengersLocalTable,
          PassengersLocalData,
          $$PassengersLocalTableFilterComposer,
          $$PassengersLocalTableOrderingComposer,
          $$PassengersLocalTableAnnotationComposer,
          $$PassengersLocalTableCreateCompanionBuilder,
          $$PassengersLocalTableUpdateCompanionBuilder,
          (
            PassengersLocalData,
            BaseReferences<
              _$AppDatabase,
              $PassengersLocalTable,
              PassengersLocalData
            >,
          ),
          PassengersLocalData,
          PrefetchHooks Function()
        > {
  $$PassengersLocalTableTableManager(
    _$AppDatabase db,
    $PassengersLocalTable table,
  ) : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$PassengersLocalTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$PassengersLocalTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$PassengersLocalTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                Value<String> localId = const Value.absent(),
                Value<String?> serverId = const Value.absent(),
                Value<String> localSessionId = const Value.absent(),
                Value<String> passengerId = const Value.absent(),
                Value<int> stopOrder = const Value.absent(),
                Value<String> status = const Value.absent(),
                Value<String> pickupAddress = const Value.absent(),
                Value<String?> pickupPostcode = const Value.absent(),
                Value<double?> pickupLatitude = const Value.absent(),
                Value<double?> pickupLongitude = const Value.absent(),
                Value<String> dropoffAddress = const Value.absent(),
                Value<String?> dropoffPostcode = const Value.absent(),
                Value<DateTime?> pickedUpAt = const Value.absent(),
                Value<DateTime?> droppedOffAt = const Value.absent(),
                Value<String?> notes = const Value.absent(),
                Value<bool> isSynced = const Value.absent(),
                Value<DateTime> createdAt = const Value.absent(),
                Value<DateTime> updatedAt = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => PassengersLocalCompanion(
                localId: localId,
                serverId: serverId,
                localSessionId: localSessionId,
                passengerId: passengerId,
                stopOrder: stopOrder,
                status: status,
                pickupAddress: pickupAddress,
                pickupPostcode: pickupPostcode,
                pickupLatitude: pickupLatitude,
                pickupLongitude: pickupLongitude,
                dropoffAddress: dropoffAddress,
                dropoffPostcode: dropoffPostcode,
                pickedUpAt: pickedUpAt,
                droppedOffAt: droppedOffAt,
                notes: notes,
                isSynced: isSynced,
                createdAt: createdAt,
                updatedAt: updatedAt,
                rowid: rowid,
              ),
          createCompanionCallback:
              ({
                required String localId,
                Value<String?> serverId = const Value.absent(),
                required String localSessionId,
                required String passengerId,
                required int stopOrder,
                Value<String> status = const Value.absent(),
                required String pickupAddress,
                Value<String?> pickupPostcode = const Value.absent(),
                Value<double?> pickupLatitude = const Value.absent(),
                Value<double?> pickupLongitude = const Value.absent(),
                required String dropoffAddress,
                Value<String?> dropoffPostcode = const Value.absent(),
                Value<DateTime?> pickedUpAt = const Value.absent(),
                Value<DateTime?> droppedOffAt = const Value.absent(),
                Value<String?> notes = const Value.absent(),
                Value<bool> isSynced = const Value.absent(),
                Value<DateTime> createdAt = const Value.absent(),
                Value<DateTime> updatedAt = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => PassengersLocalCompanion.insert(
                localId: localId,
                serverId: serverId,
                localSessionId: localSessionId,
                passengerId: passengerId,
                stopOrder: stopOrder,
                status: status,
                pickupAddress: pickupAddress,
                pickupPostcode: pickupPostcode,
                pickupLatitude: pickupLatitude,
                pickupLongitude: pickupLongitude,
                dropoffAddress: dropoffAddress,
                dropoffPostcode: dropoffPostcode,
                pickedUpAt: pickedUpAt,
                droppedOffAt: droppedOffAt,
                notes: notes,
                isSynced: isSynced,
                createdAt: createdAt,
                updatedAt: updatedAt,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$PassengersLocalTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $PassengersLocalTable,
      PassengersLocalData,
      $$PassengersLocalTableFilterComposer,
      $$PassengersLocalTableOrderingComposer,
      $$PassengersLocalTableAnnotationComposer,
      $$PassengersLocalTableCreateCompanionBuilder,
      $$PassengersLocalTableUpdateCompanionBuilder,
      (
        PassengersLocalData,
        BaseReferences<
          _$AppDatabase,
          $PassengersLocalTable,
          PassengersLocalData
        >,
      ),
      PassengersLocalData,
      PrefetchHooks Function()
    >;
typedef $$ChecklistLocalTableCreateCompanionBuilder =
    ChecklistLocalCompanion Function({
      required String id,
      required String driverId,
      required String vehicleId,
      required String vehicleCompanyId,
      required String sessionDate,
      required String checksJson,
      required String status,
      Value<bool> isLocked,
      Value<String?> serverId,
      Value<bool> isSynced,
      Value<DateTime> createdAt,
      Value<DateTime> updatedAt,
      Value<int> rowid,
    });
typedef $$ChecklistLocalTableUpdateCompanionBuilder =
    ChecklistLocalCompanion Function({
      Value<String> id,
      Value<String> driverId,
      Value<String> vehicleId,
      Value<String> vehicleCompanyId,
      Value<String> sessionDate,
      Value<String> checksJson,
      Value<String> status,
      Value<bool> isLocked,
      Value<String?> serverId,
      Value<bool> isSynced,
      Value<DateTime> createdAt,
      Value<DateTime> updatedAt,
      Value<int> rowid,
    });

class $$ChecklistLocalTableFilterComposer
    extends Composer<_$AppDatabase, $ChecklistLocalTable> {
  $$ChecklistLocalTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get driverId => $composableBuilder(
    column: $table.driverId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get vehicleId => $composableBuilder(
    column: $table.vehicleId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get vehicleCompanyId => $composableBuilder(
    column: $table.vehicleCompanyId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get sessionDate => $composableBuilder(
    column: $table.sessionDate,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get checksJson => $composableBuilder(
    column: $table.checksJson,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get status => $composableBuilder(
    column: $table.status,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<bool> get isLocked => $composableBuilder(
    column: $table.isLocked,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get serverId => $composableBuilder(
    column: $table.serverId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<bool> get isSynced => $composableBuilder(
    column: $table.isSynced,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get createdAt => $composableBuilder(
    column: $table.createdAt,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get updatedAt => $composableBuilder(
    column: $table.updatedAt,
    builder: (column) => ColumnFilters(column),
  );
}

class $$ChecklistLocalTableOrderingComposer
    extends Composer<_$AppDatabase, $ChecklistLocalTable> {
  $$ChecklistLocalTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get driverId => $composableBuilder(
    column: $table.driverId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get vehicleId => $composableBuilder(
    column: $table.vehicleId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get vehicleCompanyId => $composableBuilder(
    column: $table.vehicleCompanyId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get sessionDate => $composableBuilder(
    column: $table.sessionDate,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get checksJson => $composableBuilder(
    column: $table.checksJson,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get status => $composableBuilder(
    column: $table.status,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<bool> get isLocked => $composableBuilder(
    column: $table.isLocked,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get serverId => $composableBuilder(
    column: $table.serverId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<bool> get isSynced => $composableBuilder(
    column: $table.isSynced,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get createdAt => $composableBuilder(
    column: $table.createdAt,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get updatedAt => $composableBuilder(
    column: $table.updatedAt,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$ChecklistLocalTableAnnotationComposer
    extends Composer<_$AppDatabase, $ChecklistLocalTable> {
  $$ChecklistLocalTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get driverId =>
      $composableBuilder(column: $table.driverId, builder: (column) => column);

  GeneratedColumn<String> get vehicleId =>
      $composableBuilder(column: $table.vehicleId, builder: (column) => column);

  GeneratedColumn<String> get vehicleCompanyId => $composableBuilder(
    column: $table.vehicleCompanyId,
    builder: (column) => column,
  );

  GeneratedColumn<String> get sessionDate => $composableBuilder(
    column: $table.sessionDate,
    builder: (column) => column,
  );

  GeneratedColumn<String> get checksJson => $composableBuilder(
    column: $table.checksJson,
    builder: (column) => column,
  );

  GeneratedColumn<String> get status =>
      $composableBuilder(column: $table.status, builder: (column) => column);

  GeneratedColumn<bool> get isLocked =>
      $composableBuilder(column: $table.isLocked, builder: (column) => column);

  GeneratedColumn<String> get serverId =>
      $composableBuilder(column: $table.serverId, builder: (column) => column);

  GeneratedColumn<bool> get isSynced =>
      $composableBuilder(column: $table.isSynced, builder: (column) => column);

  GeneratedColumn<DateTime> get createdAt =>
      $composableBuilder(column: $table.createdAt, builder: (column) => column);

  GeneratedColumn<DateTime> get updatedAt =>
      $composableBuilder(column: $table.updatedAt, builder: (column) => column);
}

class $$ChecklistLocalTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $ChecklistLocalTable,
          ChecklistLocalData,
          $$ChecklistLocalTableFilterComposer,
          $$ChecklistLocalTableOrderingComposer,
          $$ChecklistLocalTableAnnotationComposer,
          $$ChecklistLocalTableCreateCompanionBuilder,
          $$ChecklistLocalTableUpdateCompanionBuilder,
          (
            ChecklistLocalData,
            BaseReferences<
              _$AppDatabase,
              $ChecklistLocalTable,
              ChecklistLocalData
            >,
          ),
          ChecklistLocalData,
          PrefetchHooks Function()
        > {
  $$ChecklistLocalTableTableManager(
    _$AppDatabase db,
    $ChecklistLocalTable table,
  ) : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$ChecklistLocalTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$ChecklistLocalTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$ChecklistLocalTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                Value<String> id = const Value.absent(),
                Value<String> driverId = const Value.absent(),
                Value<String> vehicleId = const Value.absent(),
                Value<String> vehicleCompanyId = const Value.absent(),
                Value<String> sessionDate = const Value.absent(),
                Value<String> checksJson = const Value.absent(),
                Value<String> status = const Value.absent(),
                Value<bool> isLocked = const Value.absent(),
                Value<String?> serverId = const Value.absent(),
                Value<bool> isSynced = const Value.absent(),
                Value<DateTime> createdAt = const Value.absent(),
                Value<DateTime> updatedAt = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => ChecklistLocalCompanion(
                id: id,
                driverId: driverId,
                vehicleId: vehicleId,
                vehicleCompanyId: vehicleCompanyId,
                sessionDate: sessionDate,
                checksJson: checksJson,
                status: status,
                isLocked: isLocked,
                serverId: serverId,
                isSynced: isSynced,
                createdAt: createdAt,
                updatedAt: updatedAt,
                rowid: rowid,
              ),
          createCompanionCallback:
              ({
                required String id,
                required String driverId,
                required String vehicleId,
                required String vehicleCompanyId,
                required String sessionDate,
                required String checksJson,
                required String status,
                Value<bool> isLocked = const Value.absent(),
                Value<String?> serverId = const Value.absent(),
                Value<bool> isSynced = const Value.absent(),
                Value<DateTime> createdAt = const Value.absent(),
                Value<DateTime> updatedAt = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => ChecklistLocalCompanion.insert(
                id: id,
                driverId: driverId,
                vehicleId: vehicleId,
                vehicleCompanyId: vehicleCompanyId,
                sessionDate: sessionDate,
                checksJson: checksJson,
                status: status,
                isLocked: isLocked,
                serverId: serverId,
                isSynced: isSynced,
                createdAt: createdAt,
                updatedAt: updatedAt,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$ChecklistLocalTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $ChecklistLocalTable,
      ChecklistLocalData,
      $$ChecklistLocalTableFilterComposer,
      $$ChecklistLocalTableOrderingComposer,
      $$ChecklistLocalTableAnnotationComposer,
      $$ChecklistLocalTableCreateCompanionBuilder,
      $$ChecklistLocalTableUpdateCompanionBuilder,
      (
        ChecklistLocalData,
        BaseReferences<_$AppDatabase, $ChecklistLocalTable, ChecklistLocalData>,
      ),
      ChecklistLocalData,
      PrefetchHooks Function()
    >;
typedef $$SyncQueueTableCreateCompanionBuilder =
    SyncQueueCompanion Function({
      required String id,
      required String opType,
      required String payloadJson,
      Value<String> status,
      Value<int> retryCount,
      Value<String?> lastError,
      Value<DateTime> createdAt,
      Value<DateTime> updatedAt,
      Value<int> rowid,
    });
typedef $$SyncQueueTableUpdateCompanionBuilder =
    SyncQueueCompanion Function({
      Value<String> id,
      Value<String> opType,
      Value<String> payloadJson,
      Value<String> status,
      Value<int> retryCount,
      Value<String?> lastError,
      Value<DateTime> createdAt,
      Value<DateTime> updatedAt,
      Value<int> rowid,
    });

class $$SyncQueueTableFilterComposer
    extends Composer<_$AppDatabase, $SyncQueueTable> {
  $$SyncQueueTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get opType => $composableBuilder(
    column: $table.opType,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get payloadJson => $composableBuilder(
    column: $table.payloadJson,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get status => $composableBuilder(
    column: $table.status,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get retryCount => $composableBuilder(
    column: $table.retryCount,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get lastError => $composableBuilder(
    column: $table.lastError,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get createdAt => $composableBuilder(
    column: $table.createdAt,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get updatedAt => $composableBuilder(
    column: $table.updatedAt,
    builder: (column) => ColumnFilters(column),
  );
}

class $$SyncQueueTableOrderingComposer
    extends Composer<_$AppDatabase, $SyncQueueTable> {
  $$SyncQueueTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get opType => $composableBuilder(
    column: $table.opType,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get payloadJson => $composableBuilder(
    column: $table.payloadJson,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get status => $composableBuilder(
    column: $table.status,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get retryCount => $composableBuilder(
    column: $table.retryCount,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get lastError => $composableBuilder(
    column: $table.lastError,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get createdAt => $composableBuilder(
    column: $table.createdAt,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get updatedAt => $composableBuilder(
    column: $table.updatedAt,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$SyncQueueTableAnnotationComposer
    extends Composer<_$AppDatabase, $SyncQueueTable> {
  $$SyncQueueTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get opType =>
      $composableBuilder(column: $table.opType, builder: (column) => column);

  GeneratedColumn<String> get payloadJson => $composableBuilder(
    column: $table.payloadJson,
    builder: (column) => column,
  );

  GeneratedColumn<String> get status =>
      $composableBuilder(column: $table.status, builder: (column) => column);

  GeneratedColumn<int> get retryCount => $composableBuilder(
    column: $table.retryCount,
    builder: (column) => column,
  );

  GeneratedColumn<String> get lastError =>
      $composableBuilder(column: $table.lastError, builder: (column) => column);

  GeneratedColumn<DateTime> get createdAt =>
      $composableBuilder(column: $table.createdAt, builder: (column) => column);

  GeneratedColumn<DateTime> get updatedAt =>
      $composableBuilder(column: $table.updatedAt, builder: (column) => column);
}

class $$SyncQueueTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $SyncQueueTable,
          SyncQueueData,
          $$SyncQueueTableFilterComposer,
          $$SyncQueueTableOrderingComposer,
          $$SyncQueueTableAnnotationComposer,
          $$SyncQueueTableCreateCompanionBuilder,
          $$SyncQueueTableUpdateCompanionBuilder,
          (
            SyncQueueData,
            BaseReferences<_$AppDatabase, $SyncQueueTable, SyncQueueData>,
          ),
          SyncQueueData,
          PrefetchHooks Function()
        > {
  $$SyncQueueTableTableManager(_$AppDatabase db, $SyncQueueTable table)
    : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$SyncQueueTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$SyncQueueTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$SyncQueueTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                Value<String> id = const Value.absent(),
                Value<String> opType = const Value.absent(),
                Value<String> payloadJson = const Value.absent(),
                Value<String> status = const Value.absent(),
                Value<int> retryCount = const Value.absent(),
                Value<String?> lastError = const Value.absent(),
                Value<DateTime> createdAt = const Value.absent(),
                Value<DateTime> updatedAt = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => SyncQueueCompanion(
                id: id,
                opType: opType,
                payloadJson: payloadJson,
                status: status,
                retryCount: retryCount,
                lastError: lastError,
                createdAt: createdAt,
                updatedAt: updatedAt,
                rowid: rowid,
              ),
          createCompanionCallback:
              ({
                required String id,
                required String opType,
                required String payloadJson,
                Value<String> status = const Value.absent(),
                Value<int> retryCount = const Value.absent(),
                Value<String?> lastError = const Value.absent(),
                Value<DateTime> createdAt = const Value.absent(),
                Value<DateTime> updatedAt = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => SyncQueueCompanion.insert(
                id: id,
                opType: opType,
                payloadJson: payloadJson,
                status: status,
                retryCount: retryCount,
                lastError: lastError,
                createdAt: createdAt,
                updatedAt: updatedAt,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$SyncQueueTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $SyncQueueTable,
      SyncQueueData,
      $$SyncQueueTableFilterComposer,
      $$SyncQueueTableOrderingComposer,
      $$SyncQueueTableAnnotationComposer,
      $$SyncQueueTableCreateCompanionBuilder,
      $$SyncQueueTableUpdateCompanionBuilder,
      (
        SyncQueueData,
        BaseReferences<_$AppDatabase, $SyncQueueTable, SyncQueueData>,
      ),
      SyncQueueData,
      PrefetchHooks Function()
    >;

class $AppDatabaseManager {
  final _$AppDatabase _db;
  $AppDatabaseManager(this._db);
  $$JobsCacheTableTableManager get jobsCache =>
      $$JobsCacheTableTableManager(_db, _db.jobsCache);
  $$SchedulesCacheTableTableManager get schedulesCache =>
      $$SchedulesCacheTableTableManager(_db, _db.schedulesCache);
  $$PassengersCacheTableTableManager get passengersCache =>
      $$PassengersCacheTableTableManager(_db, _db.passengersCache);
  $$VehiclesCacheTableTableManager get vehiclesCache =>
      $$VehiclesCacheTableTableManager(_db, _db.vehiclesCache);
  $$SessionsLocalTableTableManager get sessionsLocal =>
      $$SessionsLocalTableTableManager(_db, _db.sessionsLocal);
  $$PassengersLocalTableTableManager get passengersLocal =>
      $$PassengersLocalTableTableManager(_db, _db.passengersLocal);
  $$ChecklistLocalTableTableManager get checklistLocal =>
      $$ChecklistLocalTableTableManager(_db, _db.checklistLocal);
  $$SyncQueueTableTableManager get syncQueue =>
      $$SyncQueueTableTableManager(_db, _db.syncQueue);
}
