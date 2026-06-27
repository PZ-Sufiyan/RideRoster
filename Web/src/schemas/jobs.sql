create table public.jobs (
  id uuid not null default gen_random_uuid (),
  company_id uuid not null,
  assigned_driver_id uuid null,
  assigned_pa_id uuid null,
  job_name text not null,
  job_type text not null,
  client_school_name text not null,
  internal_job_id text null,
  driver_pay numeric(10, 2) null,
  passenger_assistant_pay numeric(10, 2) null,
  status text not null default 'draft'::text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  driver_approval_status text null,
  semester_start date null,
  semester_end date null,
  has_outbound boolean not null default true,
  has_inbound boolean not null default true,
  morning_start_time time without time zone null,
  morning_end_time time without time zone null,
  evening_start_time time without time zone null,
  city text null,
  constraint jobs_pkey1 primary key (id),
  constraint jobs_company_id_fkey1 foreign KEY (company_id) references companies (id) on delete CASCADE,
  constraint jobs_assigned_driver_id_fkey1 foreign KEY (assigned_driver_id) references drivers (id) on delete set null,
  constraint jobs_assigned_pa_id_fkey1 foreign KEY (assigned_pa_id) references passenger_assistant (id) on delete set null,
  constraint jobs_driver_pay_check1 check ((driver_pay >= (0)::numeric)),
  constraint jobs_passenger_assistant_pay_check1 check ((passenger_assistant_pay >= (0)::numeric))
) TABLESPACE pg_default;

create index IF not exists idx_jobs_company on public.jobs using btree (company_id) TABLESPACE pg_default;

create index IF not exists idx_jobs_driver on public.jobs using btree (assigned_driver_id) TABLESPACE pg_default;

-- =====================================================
-- Passenger Schedules Table
-- =====================================================

create table public.passenger_schedules (
  id uuid not null default gen_random_uuid (),
  job_id uuid not null,
  passenger_id uuid not null,
  weekday text not null,
  direction text not null,
  pickup_address text not null,
  pickup_postcode text null,
  pickup_latitude numeric(10, 7) null,
  pickup_longitude numeric(10, 7) null,
  pickup_time time without time zone not null,
  dropoff_address text not null,
  dropoff_postcode text null,
  dropoff_latitude numeric(10, 7) null,
  dropoff_longitude numeric(10, 7) null,
  dropoff_time time without time zone null,
  exception_date date null,
  exception_type text null,
  notes text null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  stop_order integer null,
  constraint passenger_schedules_pkey primary key (id),
  constraint uq_passenger_schedule unique (
    job_id,
    passenger_id,
    weekday,
    direction,
    exception_date
  ),
  constraint passenger_schedules_passenger_id_fkey foreign KEY (passenger_id) references passenger (id) on delete CASCADE,
  constraint passenger_schedules_job_id_fkey foreign KEY (job_id) references jobs (id) on delete CASCADE,
  constraint chk_exception_type check (
    (
      (
        exception_type = any (
          array[
            'skip'::text,
            'alternative_location'::text,
            'extra_day'::text
          ]
        )
      )
      or (exception_type is null)
    )
  ),
  constraint chk_direction check (
    (
      direction = any (array['outbound'::text, 'inbound'::text])
    )
  ),
  constraint chk_weekday check (
    (
      weekday = any (
        array[
          'mon'::text,
          'tue'::text,
          'wed'::text,
          'thu'::text,
          'fri'::text,
          'sat'::text,
          'sun'::text
        ]
      )
    )
  ),
  constraint chk_exception_consistency check (
    (
      (
        (exception_date is null)
        and (exception_type is null)
      )
      or (
        (exception_date is not null)
        and (exception_type is not null)
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_passenger_schedules_job on public.passenger_schedules using btree (job_id) TABLESPACE pg_default;

create index IF not exists idx_passenger_schedules_passenger on public.passenger_schedules using btree (passenger_id) TABLESPACE pg_default;

create index IF not exists idx_passenger_schedules_daily_lookup on public.passenger_schedules using btree (job_id, weekday, direction, exception_date) TABLESPACE pg_default;

create index IF not exists idx_passenger_schedules_stop_order on public.passenger_schedules using btree (job_id, weekday, stop_order) TABLESPACE pg_default
where
  (
    (exception_date is null)
    and (direction = 'outbound'::text)
  );


-- =====================================================
-- Job Sessions Table
-- =====================================================

create table public.job_sessions (
  id uuid not null default gen_random_uuid (),
  job_id uuid not null,
  session_date date not null,
  direction text not null,
  status text not null default 'pending'::text,
  started_at timestamp with time zone null,
  completed_at timestamp with time zone null,
  note text null,
  driver_id uuid null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint job_sessions_pkey primary key (id),
  constraint uq_job_session unique (job_id, session_date, direction),
  constraint job_sessions_job_id_fkey foreign KEY (job_id) references jobs (id) on delete CASCADE,
  constraint job_sessions_driver_id_fkey foreign KEY (driver_id) references drivers (id) on delete set null,
  constraint job_sessions_direction_check check (
    (
      direction = any (array['outbound'::text, 'inbound'::text])
    )
  ),
  constraint job_sessions_status_check check (
    (
      status = any (
        array[
          'pending'::text,
          'active'::text,
          'completed'::text,
          'cancelled'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_job_sessions_job on public.job_sessions using btree (job_id) TABLESPACE pg_default;

create index IF not exists idx_job_sessions_date on public.job_sessions using btree (session_date, direction) TABLESPACE pg_default;

create index IF not exists idx_job_sessions_driver on public.job_sessions using btree (driver_id) TABLESPACE pg_default;
-- =====================================================
-- Job Session Passengers Table
-- =====================================================

create table public.job_session_passengers (
  id uuid not null default gen_random_uuid (),
  session_id uuid not null,
  passenger_id uuid not null,
  stop_order integer not null,
  status text not null default 'pending'::text,
  pickup_address text not null,
  pickup_postcode text null,
  pickup_latitude numeric(10, 7) null,
  pickup_longitude numeric(10, 7) null,
  dropoff_address text not null,
  dropoff_postcode text null,
  picked_up_at timestamp with time zone null,
  dropped_off_at timestamp with time zone null,
  missed_reason text null,
  notes text null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint job_session_passengers_pkey primary key (id),
  constraint uq_session_passenger unique (session_id, passenger_id),
  constraint job_session_passengers_session_id_fkey foreign KEY (session_id) references job_sessions (id) on delete CASCADE,
  constraint job_session_passengers_passenger_id_fkey foreign KEY (passenger_id) references passenger (id) on delete CASCADE,
  constraint job_session_passengers_status_check check (
    (
      status = any (
        array[
          'pending'::text,
          'picked_up'::text,
          'missed'::text,
          'dropped_off'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_session_passengers_session on public.job_session_passengers using btree (session_id, stop_order) TABLESPACE pg_default;

create index IF not exists idx_session_passengers_passenger on public.job_session_passengers using btree (passenger_id) TABLESPACE pg_default;



-- Indexes
CREATE INDEX idx_jobs_company ON public.jobs(company_id);
CREATE INDEX idx_jobs_driver ON public.jobs(assigned_driver_id);
CREATE INDEX idx_job_pickups_job ON public.job_pickups(job_id);
CREATE INDEX idx_job_dropoffs_job ON public.job_dropoffs(job_id);