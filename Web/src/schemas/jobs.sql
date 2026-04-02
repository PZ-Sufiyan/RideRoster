CREATE TABLE IF NOT EXISTS public.jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  
  -- Nullable: assigned later
  assigned_driver_id uuid NULL REFERENCES public.drivers(id) ON DELETE SET NULL,
  assigned_pa_id uuid NULL REFERENCES public.passenger_assistant(id) ON DELETE SET NULL,
  
  job_name text NOT NULL,
  job_type text NOT NULL,
  client_school_name text NOT NULL,
  internal_job_id text NULL,
  job_date date NOT NULL,
  pickup_time time NOT NULL,
  estimated_dropoff_time time NOT NULL,
  is_recurring boolean NOT NULL DEFAULT false,
  recurrence_pattern jsonb NULL,
  
  driver_pay numeric(10,2) NULL CHECK (driver_pay >= 0),
  passenger_assistant_pay numeric(10,2) NULL CHECK (passenger_assistant_pay >= 0),
  
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.job_pickups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  pickup_order integer NOT NULL CHECK (pickup_order > 0),
  address text NOT NULL,        -- ← added
  postcode text NOT NULL,
  latitude numeric(10,7) NULL,
  longitude numeric(10,7) NULL,
  scheduled_time time NULL,     -- ← per-stop pickup time
  notes_for_driver text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (job_id, pickup_order)
);

CREATE TABLE IF NOT EXISTS public.job_dropoffs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  dropoff_order integer NOT NULL CHECK (dropoff_order > 0),
  address text NOT NULL,        -- ← added
  postcode text NOT NULL,
  latitude numeric(10,7) NULL,
  longitude numeric(10,7) NULL,
  scheduled_time time NULL,     -- ← per-stop dropoff time
  notes_for_driver text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (job_id, dropoff_order)
);

CREATE TABLE IF NOT EXISTS public.job_passenger_routes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  passenger_id uuid NOT NULL REFERENCES public.passenger(id) ON DELETE RESTRICT,
  pickup_id uuid NOT NULL REFERENCES public.job_pickups(id) ON DELETE RESTRICT,
  dropoff_id uuid NOT NULL REFERENCES public.job_dropoffs(id) ON DELETE RESTRICT,
  wheelchair_required boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (job_id, passenger_id)
);

-- Indexes
CREATE INDEX idx_jobs_company ON public.jobs(company_id);
CREATE INDEX idx_jobs_driver ON public.jobs(assigned_driver_id);
CREATE INDEX idx_job_pickups_job ON public.job_pickups(job_id);
CREATE INDEX idx_job_dropoffs_job ON public.job_dropoffs(job_id);
CREATE INDEX idx_jpr_job ON public.job_passenger_routes(job_id);
CREATE INDEX idx_jpr_passenger ON public.job_passenger_routes(passenger_id);