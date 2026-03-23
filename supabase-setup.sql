-- Users profiles (extends Supabase auth)
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  bio text default '',
  avatar_color text default '#ff2d78',
  created_at timestamptz default now()
);

-- Tracks
create table if not exists tracks (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  artist text not null,
  genre text not null,
  bpm integer default 0,
  cover_url text,
  audio_url text not null,
  snippet_start integer default 0,
  tags text[] default '{}',
  uploaded_by uuid references profiles(id) on delete cascade,
  uploaded_by_username text,
  hards integer default 0,
  trash integer default 0,
  listed_at timestamptz default now()
);

-- Votes
create table if not exists votes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade,
  track_id uuid references tracks(id) on delete cascade,
  vote text check (vote in ('right', 'left')) not null,
  created_at timestamptz default now(),
  unique(user_id, track_id)
);

-- Comments
create table if not exists comments (
  id uuid default gen_random_uuid() primary key,
  track_id uuid references tracks(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  username text not null,
  avatar_color text default '#ff2d78',
  text text not null,
  created_at timestamptz default now()
);

-- Reactions
create table if not exists reactions (
  id uuid default gen_random_uuid() primary key,
  track_id uuid references tracks(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  emoji text not null,
  created_at timestamptz default now(),
  unique(user_id, track_id, emoji)
);

-- Enable Row Level Security
alter table profiles enable row level security;
alter table tracks enable row level security;
alter table votes enable row level security;
alter table comments enable row level security;
alter table reactions enable row level security;

-- RLS Policies

-- Profiles: anyone can read, only owner can update
create policy "Public profiles" on profiles for select using (true);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on profiles for insert with check (auth.uid() = id);

-- Tracks: anyone can read, authenticated users can insert
create policy "Public tracks" on tracks for select using (true);
create policy "Auth users can insert tracks" on tracks for insert with check (auth.uid() is not null);
create policy "Owners can update tracks" on tracks for update using (auth.uid() = uploaded_by);

-- Votes: anyone can read, auth users can vote
create policy "Public votes" on votes for select using (true);
create policy "Auth users can vote" on votes for insert with check (auth.uid() is not null);
create policy "Users can update own vote" on votes for update using (auth.uid() = user_id);
create policy "Users can delete own vote" on votes for delete using (auth.uid() = user_id);

-- Comments: anyone can read, auth users can comment
create policy "Public comments" on comments for select using (true);
create policy "Auth users can comment" on comments for insert with check (auth.uid() is not null);
create policy "Users can delete own comments" on comments for delete using (auth.uid() = user_id);

-- Reactions: anyone can read, auth users can react
create policy "Public reactions" on reactions for select using (true);
create policy "Auth users can react" on reactions for insert with check (auth.uid() is not null);
create policy "Users can delete own reactions" on reactions for delete using (auth.uid() = user_id);

-- Storage bucket for audio
insert into storage.buckets (id, name, public) values ('audio', 'audio', true) on conflict do nothing;
create policy "Public audio" on storage.objects for select using (bucket_id = 'audio');
create policy "Auth users can upload audio" on storage.objects for insert with check (bucket_id = 'audio' AND auth.uid() is not null);

-- Storage bucket for covers
insert into storage.buckets (id, name, public) values ('covers', 'covers', true) on conflict do nothing;
create policy "Public covers" on storage.objects for select using (bucket_id = 'covers');
create policy "Auth users can upload covers" on storage.objects for insert with check (bucket_id = 'covers' AND auth.uid() is not null);
