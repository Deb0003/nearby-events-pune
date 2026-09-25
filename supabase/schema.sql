-- Nearby.Events — Pune — database schema
-- Run this in the Supabase SQL Editor (Project → SQL Editor → New query)

create extension if not exists "pgcrypto";

create table if not exists organizers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact text,
  is_verified boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  category text not null,
  sub_category text not null,
  venue_name text not null,
  area text not null,
  latitude double precision,
  longitude double precision,
  start_date date not null,
  start_time text not null,
  organizer_id uuid references organizers(id) on delete set null,
  organizer_name text not null,
  format text,
  tags text[] default '{}',
  rsvp_url text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

create index if not exists events_status_idx on events(status);
create index if not exists events_start_date_idx on events(start_date);

-- Row Level Security: the anon key is public, so these rules are what
-- actually keep the data safe once this ships to the browser.
alter table events enable row level security;
alter table organizers enable row level security;

-- Anyone can read approved events (this is the public map).
create policy "public can view approved events"
  on events for select
  using (status = 'approved');

-- Anyone can submit a new event, but only ever as 'pending' —
-- nobody can insert a row that's already approved.
create policy "public can submit pending events"
  on events for insert
  with check (status = 'pending');

-- Organizer records are lightweight and public to read/create
-- (no sensitive data stored here in the MVP).
create policy "public can view organizers"
  on organizers for select
  using (true);

create policy "public can create organizers"
  on organizers for insert
  with check (true);

-- Note: there is deliberately NO public update/delete policy on events.
-- Approving/rejecting a pending event is done via the /api/admin/events
-- route using the service_role key (server-side only — see README).

-- Seed data (optional) — mirrors the prototype's sample events so the
-- map isn't empty on first run. Safe to skip or delete.
insert into events (title, description, category, sub_category, venue_name, area, latitude, longitude, start_date, start_time, organizer_name, format, tags, status)
values
  ('Pune Founders Pitch Night', 'Five early-stage founders pitch to a room of local investors and operators, followed by open networking.', 'pro', 'Pitch Night', 'The Hive, Baner', 'Baner', 18.5590, 73.7868, '2026-09-24', '6:30 PM', 'Pune Startup Collective', 'Free · RSVP', array['Early-stage','English'], 'approved'),
  ('Sunday Football Pickup', 'Casual 7-a-side pickup games, all skill levels welcome. Bring your own boots.', 'sport', 'Football', 'Symbiosis Ground, Viman Nagar', 'Viman Nagar', 18.5679, 73.9143, '2026-09-27', '7:00 AM', 'Pune Weekend Football', '₹150 · Drop-in', array['Beginner-friendly'], 'approved'),
  ('Sunrise Yoga in the Park', 'Gentle vinyasa flow by the lake as the sun comes up. Mats not provided.', 'well', 'Yoga', 'Pashan Lake Park', 'Baner', 18.5390, 73.7930, '2026-09-25', '6:00 AM', 'Prana Yoga Circle', 'Free · Donation-based', array['Beginner-friendly','Outdoors'], 'approved'),
  ('Open Mic Night', 'Poetry, stand-up, and acoustic sets — sign-ups open 30 min before start.', 'arts', 'Open Mic', 'High Spirits Cafe, Kalyani Nagar', 'Kalyani Nagar', 18.5490, 73.9020, '2026-09-26', '8:00 PM', 'Pune Poets & Storytellers', 'Free entry', array['All languages'], 'approved'),
  ('Board Games & Chai Meetup', 'Weekly casual meetup — Catan, Codenames, and whatever else people bring.', 'gen', 'Board Games', 'Cafe Goodluck, Deccan', 'Deccan', 18.5158, 73.8412, '2026-09-25', '5:00 PM', 'Pune Boardgamers', 'Free · Just show up', array['English','Beginner-friendly'], 'approved');
