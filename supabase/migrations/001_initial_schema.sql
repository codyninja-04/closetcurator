-- ClosetCurator schema. Everything hangs off wardrobe_items.user_id, and RLS
-- checks that ownership on every read and write.

create extension if not exists "uuid-ossp";

-- One row per user for the plan and a couple of preferences. Created on sign
-- up by the trigger further down.
create table profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  plan text not null default 'free' check (plan in ('free', 'pro')),
  temp_unit text not null default 'C' check (temp_unit in ('C', 'F')),
  -- Used for the weather when the browser won't share a location.
  home_city text check (char_length(home_city) <= 80)
);

create table wardrobe_items (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  added_at timestamptz not null default now(),
  -- Storage path inside the private closet-photos bucket, not a public URL.
  -- Pages sign it on the way out.
  photo_url text not null,
  name text not null default 'Untitled piece' check (char_length(name) between 1 and 80),
  category text not null check (category in ('top', 'bottom', 'dress', 'outerwear', 'shoes', 'accessory', 'bag')),
  subcategory text check (char_length(subcategory) <= 60),
  primary_color text check (char_length(primary_color) <= 40),
  -- Approximate swatch for the UI, e.g. #1F2A44.
  color_hex text check (color_hex ~ '^#[0-9A-Fa-f]{6}$'),
  pattern text check (char_length(pattern) <= 40),
  style_tags text[] not null default '{}',
  brand text check (char_length(brand) <= 60),
  season_appropriate text[] not null default '{"year_round"}',
  warmth text not null default 'medium' check (warmth in ('light', 'medium', 'warm')),
  notes text check (char_length(notes) <= 500),
  -- Both kept in sync from wear_log by refresh_item_wear(), never written by the app.
  wear_count integer not null default 0,
  last_worn_date date,
  -- False once something is donated, sold or put away. Kept for the history.
  is_active boolean not null default true
);

create table wear_log (
  id uuid primary key default uuid_generate_v4(),
  item_id uuid not null references wardrobe_items(id) on delete cascade,
  created_at timestamptz not null default now(),
  worn_date date not null,
  occasion text check (occasion in ('work', 'casual', 'date', 'formal', 'gym', 'other')),
  -- One entry per item per day, so a double tap can't inflate the count.
  unique (item_id, worn_date)
);

-- Every outfit Claude put together, so "try another" can avoid repeats and the
-- outfit page can show recent ones.
create table outfit_suggestions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  occasion text not null check (occasion in ('work', 'casual', 'date', 'formal', 'gym')),
  weather_summary text check (char_length(weather_summary) <= 200),
  anchor_item_id uuid references wardrobe_items(id) on delete set null,
  -- [{ "item_id": uuid, "reasoning": text }]
  picks jsonb not null default '[]',
  overall_note text check (char_length(overall_note) <= 1000),
  gap_note text check (char_length(gap_note) <= 400),
  worn_on date
);

-- One row per Claude call, only used for the daily caps. Users can read and
-- add rows but not delete them, so the cap can't be reset from the client.
create table ai_calls (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  kind text not null check (kind in ('scan', 'outfit'))
);

create index idx_items_user on wardrobe_items(user_id, category, is_active);
create index idx_ai_calls_user on ai_calls(user_id, kind, created_at desc);
create index idx_wear_item on wear_log(item_id, worn_date desc);
create index idx_wear_date on wear_log(worn_date desc);
create index idx_outfits_user on outfit_suggestions(user_id, created_at desc);

-- Wear totals -------------------------------------------------------------------

create or replace function refresh_item_wear(iid uuid) returns void
language sql security definer set search_path = public as $$
  update wardrobe_items i set
    wear_count = (select count(*) from wear_log w where w.item_id = iid),
    last_worn_date = (select max(worn_date) from wear_log w where w.item_id = iid)
  where i.id = iid;
$$;

create or replace function on_wear_change() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform refresh_item_wear(coalesce(new.item_id, old.item_id));
  return null;
end $$;

create trigger wear_totals after insert or update or delete on wear_log
  for each row execute function on_wear_change();

-- Profiles -----------------------------------------------------------------------

create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (user_id) values (new.id) on conflict do nothing;
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();

-- RLS ----------------------------------------------------------------------------

alter table profiles enable row level security;
alter table wardrobe_items enable row level security;
alter table wear_log enable row level security;
alter table outfit_suggestions enable row level security;
alter table ai_calls enable row level security;

-- Users can read their profile and change their preferences, never the plan.
create policy "own_profile_read" on profiles for select using (auth.uid() = user_id);
create policy "own_profile_update" on profiles for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
revoke update on profiles from authenticated;
grant update (temp_unit, home_city) on profiles to authenticated;

create policy "own_items" on wardrobe_items for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- The wear counters belong to the trigger. Users can edit everything else.
revoke update on wardrobe_items from authenticated;
grant update (name, category, subcategory, primary_color, color_hex, pattern, style_tags, brand, season_appropriate, warmth, notes, is_active)
  on wardrobe_items to authenticated;

create policy "own_wear_log" on wear_log for all using (
  exists (select 1 from wardrobe_items i where i.id = wear_log.item_id and i.user_id = auth.uid())
) with check (
  exists (select 1 from wardrobe_items i where i.id = wear_log.item_id and i.user_id = auth.uid())
);

create policy "own_outfits" on outfit_suggestions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own_ai_calls_read" on ai_calls for select using (auth.uid() = user_id);
create policy "own_ai_calls_insert" on ai_calls for insert with check (auth.uid() = user_id);

-- Storage ------------------------------------------------------------------------

-- Private bucket. Files live under {user_id}/..., so the first folder in the
-- path decides who can touch it.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('closet-photos', 'closet-photos', false, 8388608, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "own_photos_read" on storage.objects for select
  using (bucket_id = 'closet-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own_photos_insert" on storage.objects for insert
  with check (bucket_id = 'closet-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own_photos_delete" on storage.objects for delete
  using (bucket_id = 'closet-photos' and (storage.foldername(name))[1] = auth.uid()::text);
