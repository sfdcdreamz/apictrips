-- APIcTrips — Supabase Schema
-- Run this in the Supabase SQL editor

create extension if not exists "uuid-ossp";

-- ============================================================
-- TRIPS TABLE
-- ============================================================
create table public.trips (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  destination text not null,
  start_date date not null,
  end_date date not null,
  group_size integer not null default 2,
  organiser_id uuid references auth.users(id) on delete cascade not null,
  invite_code text unique not null,
  created_at timestamptz default now() not null
);

-- ============================================================
-- MEMBERS TABLE
-- ============================================================
create table public.members (
  id uuid default uuid_generate_v4() primary key,
  trip_id uuid references public.trips(id) on delete cascade not null,
  name text not null,
  email text not null,
  status text not null default 'tentative' check (status in ('in', 'tentative', 'out')),
  is_organiser boolean default false not null,
  vibe_budget text check (vibe_budget in ('budget', 'mid-range', 'luxury')),
  vibe_pace text check (vibe_pace in ('relaxed', 'moderate', 'packed')),
  vibe_style text check (vibe_style in ('beach', 'adventure', 'culture', 'city', 'mixed')),
  vibe_accommodation text check (vibe_accommodation in ('hostel', 'airbnb', 'hotel', 'luxury')),
  vibe_completed boolean default false not null,
  joined_at timestamptz default now() not null,
  unique(trip_id, email)
);

-- ============================================================
-- INDEXES
-- ============================================================
create index members_trip_id_idx on public.members(trip_id);
create index trips_invite_code_idx on public.trips(invite_code);
create index trips_organiser_id_idx on public.trips(organiser_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.trips enable row level security;
alter table public.members enable row level security;

-- Trips policies
create policy "Organisers can view their trips"
  on public.trips for select
  using (auth.uid() = organiser_id);

create policy "Organisers can create trips"
  on public.trips for insert
  with check (auth.uid() = organiser_id);

-- Members policies
create policy "Members can view trip members"
  on public.members for select
  using (
    trip_id in (
      select id from public.trips where organiser_id = auth.uid()
    )
  );

create policy "Anyone can join a trip"
  on public.members for insert
  with check (true);

create policy "Organisers can update members"
  on public.members for update
  using (
    trip_id in (
      select id from public.trips where organiser_id = auth.uid()
    )
  );

-- ============================================================
-- ITINERARY ITEMS TABLE
-- ============================================================
create table public.itinerary_items (
  id uuid default uuid_generate_v4() primary key,
  trip_id uuid references public.trips(id) on delete cascade not null,
  day_number integer not null,
  day_date date,
  time text,
  title text not null,
  description text,
  item_type text not null default 'activity'
    check (item_type in ('activity', 'meal', 'transport', 'stay')),
  status text not null default 'pending'
    check (status in ('pending', 'done')),
  cost integer not null default 0,
  created_at timestamptz default now() not null
);

create index itinerary_items_trip_id_idx on public.itinerary_items(trip_id);

alter table public.itinerary_items enable row level security;

create policy "Organisers can manage itinerary"
  on public.itinerary_items for all
  using (
    trip_id in (select id from public.trips where organiser_id = auth.uid())
  );
