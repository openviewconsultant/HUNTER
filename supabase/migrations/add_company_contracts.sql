-- Create company_contracts table for individual contract records
-- This allows companies to track their executed contracts with supporting documents

create table if not exists public.company_contracts (
  id uuid default gen_random_uuid() primary key,
  company_id uuid references public.companies(id) on delete cascade not null,
  contract_number text not null,
  client_name text not null,
  contract_value numeric not null, -- Value in COP
  contract_value_smmlv numeric, -- Value in SMMLV (Salarios Mínimos)
  execution_date date,
  unspsc_codes jsonb, -- Array of UNSPSC classification codes for this contract
  description text,
  document_url text, -- URL to supporting document in Supabase Storage
  document_name text, -- Original filename of uploaded document
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes for better query performance
create index idx_company_contracts_company_id on public.company_contracts(company_id);
create index idx_company_contracts_execution_date on public.company_contracts(execution_date);

-- Row Level Security Policies
alter table public.company_contracts enable row level security;

-- Users can view contracts for their own company
create policy "Users can view own company contracts" on public.company_contracts 
  for select using (
    exists (
      select 1 from public.companies
      join public.profiles on companies.profile_id = profiles.id
      where companies.id = company_contracts.company_id
      and profiles.user_id = auth.uid()
    )
  );

-- Users can insert contracts for their own company
create policy "Users can insert own company contracts" on public.company_contracts 
  for insert with check (
    exists (
      select 1 from public.companies
      join public.profiles on companies.profile_id = profiles.id
      where companies.id = company_contracts.company_id
      and profiles.user_id = auth.uid()
    )
  );

-- Users can update their own company contracts
create policy "Users can update own company contracts" on public.company_contracts 
  for update using (
    exists (
      select 1 from public.companies
      join public.profiles on companies.profile_id = profiles.id
      where companies.id = company_contracts.company_id
      and profiles.user_id = auth.uid()
    )
  );

-- Users can delete their own company contracts
create policy "Users can delete own company contracts" on public.company_contracts 
  for delete using (
    exists (
      select 1 from public.companies
      join public.profiles on companies.profile_id = profiles.id
      where companies.id = company_contracts.company_id
      and profiles.user_id = auth.uid()
    )
  );

-- Function to automatically update experience_summary when contracts change
-- This keeps the companies.experience_summary field in sync with actual contract data
create or replace function update_company_experience_summary()
returns trigger as $$
declare
  v_company_id uuid;
  v_total_contracts integer;
  v_total_value_smmlv numeric;
begin
  -- Determine which company_id to update
  if TG_OP = 'DELETE' then
    v_company_id := OLD.company_id;
  else
    v_company_id := NEW.company_id;
  end if;

  -- Calculate totals from all contracts for this company
  select 
    count(*),
    coalesce(sum(contract_value_smmlv), 0)
  into v_total_contracts, v_total_value_smmlv
  from public.company_contracts
  where company_id = v_company_id;

  -- Update the company's experience_summary
  update public.companies
  set 
    experience_summary = jsonb_build_object(
      'total_contracts', v_total_contracts,
      'total_value_smmlv', v_total_value_smmlv
    ),
    updated_at = now()
  where id = v_company_id;

  return NEW;
end;
$$ language plpgsql security definer;

-- Triggers to automatically update experience_summary
create trigger update_experience_summary_on_insert
  after insert on public.company_contracts
  for each row execute function update_company_experience_summary();

create trigger update_experience_summary_on_update
  after update on public.company_contracts
  for each row execute function update_company_experience_summary();

create trigger update_experience_summary_on_delete
  after delete on public.company_contracts
  for each row execute function update_company_experience_summary();
