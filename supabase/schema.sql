-- Enable pgvector extension for embeddings
create extension if not exists vector;

-- Reset tables if they exist (Order matters due to foreign keys)
drop table if exists public.company_documents cascade;
drop table if exists public.companies cascade;
drop table if exists public.saved_searches cascade;
drop table if exists public.tenders cascade;
drop table if exists public.profiles cascade;

drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

-- Profiles table (Multiple profiles per user)
create table public.profiles (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  email text,
  full_name text,
  avatar_url text,
  profile_type text default 'individual', -- 'individual', 'company'
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Allow multiple profiles per user
create index idx_profiles_user_id on public.profiles(user_id);

-- Function to handle new user signup
-- This creates a default profile when a user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (user_id, email, full_name, avatar_url)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new user signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Companies table (Company profile information)
create table public.companies (
  id uuid default gen_random_uuid() primary key,
  profile_id uuid references public.profiles(id) on delete cascade not null unique,
  company_name text not null,
  nit text,
  legal_representative text,
  economic_sector text,
  phone text,
  address text,
  city text,
  department text,
  country text default 'Colombia',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_companies_profile_id on public.companies(profile_id);

-- Company Documents table (Legal, financial, and technical documents)
create table public.company_documents (
  id uuid default gen_random_uuid() primary key,
  company_id uuid references public.companies(id) on delete cascade not null,
  document_type text not null, -- 'legal', 'financial', 'technical'
  document_name text not null, -- e.g., 'RUT', 'Cámara de Comercio', etc.
  file_url text not null, -- Storage URL
  file_size bigint, -- File size in bytes
  mime_type text, -- e.g., 'application/pdf'
  is_required boolean default false,
  uploaded_at timestamptz default now(),
  uploaded_by uuid references public.profiles(id),
  metadata jsonb -- Additional metadata like expiry dates, etc.
);

create index idx_company_documents_company_id on public.company_documents(company_id);
create index idx_company_documents_type on public.company_documents(document_type);

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
  closing_at timestamptz,
  url text,
  entity_name text,
  region text,
  department text,
  city text,
  category text,
  subcategory text,
  embedding vector(1536), -- OpenAI embedding size for semantic search
  metadata jsonb, -- Additional tender metadata
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_tenders_secop_id on public.tenders(secop_id);
create index idx_tenders_status on public.tenders(status);
create index idx_tenders_published_at on public.tenders(published_at);

-- Saved Searches (Alerts and tracking)
create table public.saved_searches (
  id uuid default gen_random_uuid() primary key,
  profile_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  query text,
  filters jsonb, -- Advanced filters (category, region, amount range, etc.)
  frequency text default 'daily', -- 'daily', 'weekly', 'real-time'
  is_active boolean default true,
  last_run_at timestamptz,
  last_results_count integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_saved_searches_profile_id on public.saved_searches(profile_id);
create index idx_saved_searches_active on public.saved_searches(is_active);

-- RLS Policies
-- Profiles
alter table public.profiles enable row level security;
create policy "Profiles are viewable by profile owner" on public.profiles 
  for select using (auth.uid() = user_id);
create policy "Users can insert their own profile" on public.profiles 
  for insert with check (auth.uid() = user_id);
create policy "Users can update own profiles" on public.profiles 
  for update using (auth.uid() = user_id);
create policy "Users can delete own profiles" on public.profiles 
  for delete using (auth.uid() = user_id);

-- Companies
alter table public.companies enable row level security;
create policy "Companies are viewable by profile owner" on public.companies 
  for select using (
    exists (
      select 1 from public.profiles
      where profiles.id = companies.profile_id
      and profiles.user_id = auth.uid()
    )
  );
create policy "Users can insert company for their profile" on public.companies 
  for insert with check (
    exists (
      select 1 from public.profiles
      where profiles.id = companies.profile_id
      and profiles.user_id = auth.uid()
    )
  );
create policy "Users can update their company" on public.companies 
  for update using (
    exists (
      select 1 from public.profiles
      where profiles.id = companies.profile_id
      and profiles.user_id = auth.uid()
    )
  );
create policy "Users can delete their company" on public.companies 
  for delete using (
    exists (
      select 1 from public.profiles
      where profiles.id = companies.profile_id
      and profiles.user_id = auth.uid()
    )
  );

-- Company Documents
alter table public.company_documents enable row level security;
create policy "Documents are viewable by company owner" on public.company_documents 
  for select using (
    exists (
      select 1 from public.companies
      join public.profiles on companies.profile_id = profiles.id
      where companies.id = company_documents.company_id
      and profiles.user_id = auth.uid()
    )
  );
create policy "Users can insert documents for their company" on public.company_documents 
  for insert with check (
    exists (
      select 1 from public.companies
      join public.profiles on companies.profile_id = profiles.id
      where companies.id = company_documents.company_id
      and profiles.user_id = auth.uid()
    )
  );
create policy "Users can update their company documents" on public.company_documents 
  for update using (
    exists (
      select 1 from public.companies
      join public.profiles on companies.profile_id = profiles.id
      where companies.id = company_documents.company_id
      and profiles.user_id = auth.uid()
    )
  );
create policy "Users can delete their company documents" on public.company_documents 
  for delete using (
    exists (
      select 1 from public.companies
      join public.profiles on companies.profile_id = profiles.id
      where companies.id = company_documents.company_id
      and profiles.user_id = auth.uid()
    )
  );

-- Tenders (Public read access for all authenticated users)
alter table public.tenders enable row level security;
create policy "Tenders are viewable by authenticated users" on public.tenders 
  for select using (auth.uid() is not null);

-- Saved Searches
alter table public.saved_searches enable row level security;
create policy "Users can view own searches" on public.saved_searches 
  for select using (
    exists (
      select 1 from public.profiles
      where profiles.id = saved_searches.profile_id
      and profiles.user_id = auth.uid()
    )
  );
create policy "Users can insert own searches" on public.saved_searches 
  for insert with check (
    exists (
      select 1 from public.profiles
      where profiles.id = saved_searches.profile_id
      and profiles.user_id = auth.uid()
    )
  );
create policy "Users can update own searches" on public.saved_searches 
  for update using (
    exists (
      select 1 from public.profiles
      where profiles.id = saved_searches.profile_id
      and profiles.user_id = auth.uid()
    )
  );
create policy "Users can delete own searches" on public.saved_searches 
  for delete using (
    exists (
      select 1 from public.profiles
      where profiles.id = saved_searches.profile_id
      and profiles.user_id = auth.uid()
    )
  );

-- Helpful Views
-- View to get complete user profile with company info
create or replace view public.complete_profiles as
select 
  p.id as profile_id,
  p.user_id,
  p.email,
  p.full_name,
  p.avatar_url,
  p.profile_type,
  p.created_at as profile_created_at,
  c.id as company_id,
  c.company_name,
  c.nit,
  c.legal_representative,
  c.economic_sector,
  c.phone,
  c.address,
  c.city,
  c.department,
  c.country
from public.profiles p
left join public.companies c on c.profile_id = p.id;

-- Grant access to the view
grant select on public.complete_profiles to authenticated;
