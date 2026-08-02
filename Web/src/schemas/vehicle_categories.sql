create table public.vehicle_categories (
  id uuid not null default gen_random_uuid (),
  category_key text not null,
  variant_label text not null,
  seats integer not null,
  wheelchair_accessible boolean not null default false,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint vehicle_categories_pkey primary key (id),
  constraint vehicle_categories_seats_check check (seats > 0),
  constraint vehicle_categories_unique_variant unique (category_key, variant_label)
) TABLESPACE pg_default;


insert into public.vehicle_categories
  (category_key, variant_label, seats, wheelchair_accessible)
values
  ('Car', '4 seater', 4, false),

  ('People Carrier', '6 passenger', 6, false),
  ('People Carrier', '7 passenger', 7, false),

  ('Minibus', '8 passenger', 8, false),
  ('Minibus', 'Wheelchair ramp', 8, true),
  ('Minibus', 'Wheelchair tail lift', 8, true),

  ('Hackney', '5 passenger', 5, false),
  ('Hackney', '6 passenger', 6, false),
  ('Hackney', 'Wheelchair', 5, true);