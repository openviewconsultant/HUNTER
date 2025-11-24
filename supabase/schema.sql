-- Enable pgvector extension for embeddings
create extension if not exists vector;

-- Profiles table
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Tenders table
create table public.tenders (
  id uuid default gen_random_uuid() primary key,
  secop_id text unique not null,
  title text not null,
  description text,
  amount numeric,
  currency text default 'COP',
  status text,
  published_at timestamptz,
  url text,
  entity_name text,
  region text,
  embedding vector(1536), -- OpenAI embedding size
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Saved Searches
create table public.saved_searches (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  query text,
  filters jsonb,
  frequency text default 'daily', -- daily, weekly, etc.
  last_run_at timestamptz,
  created_at timestamptz default now()
);

-- RLS Policies (Basic)
alter table public.profiles enable row level security;
create policy "Public profiles are viewable by everyone." on public.profiles for select using (true);
create policy "Users can insert their own profile." on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile." on public.profiles for update using (auth.uid() = id);

alter table public.tenders enable row level security;
create policy "Tenders are viewable by everyone." on public.tenders for select using (true);

alter table public.saved_searches enable row level security;
create policy "Users can view own searches." on public.saved_searches for select using (auth.uid() = user_id);
create policy "Users can insert own searches." on public.saved_searches for insert with check (auth.uid() = user_id);
create policy "Users can update own searches." on public.saved_searches for update using (auth.uid() = user_id);
create policy "Users can delete own searches." on public.saved_searches for delete using (auth.uid() = user_id);
