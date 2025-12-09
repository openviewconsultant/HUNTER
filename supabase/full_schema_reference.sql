
-- Full Database Schema Reference
-- Sourced from user input on 2025-12-09

CREATE EXTENSION IF NOT EXISTS vector;

DO $$ BEGIN
    CREATE TYPE project_methodology AS ENUM ('PMBOK', 'AGILE', 'HYBRID');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE project_status AS ENUM ('DRAFT', 'ACTIVE', 'SUBMITTED', 'AWARDED', 'LOST', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE task_priority AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE task_status AS ENUM ('TODO', 'IN_PROGRESS', 'REVIEW', 'DONE', 'BLOCKED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.ai_alerts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL,
  alert_type text NOT NULL,
  priority text DEFAULT 'medium'::text,
  title text NOT NULL,
  message text NOT NULL,
  related_entity_id text,
  related_entity_type text,
  is_read boolean DEFAULT false,
  action_required boolean DEFAULT false,
  metadata jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT ai_alerts_pkey PRIMARY KEY (id),
  CONSTRAINT ai_alerts_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id)
);

CREATE TABLE IF NOT EXISTS public.ai_predictions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tender_id uuid,
  secop_process_id text,
  prediction_type text NOT NULL,
  score numeric,
  confidence numeric,
  explanation text,
  details jsonb,
  model_version text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT ai_predictions_pkey PRIMARY KEY (id),
  CONSTRAINT ai_predictions_tender_id_fkey FOREIGN KEY (tender_id) REFERENCES public.historical_tenders(id)
);

CREATE TABLE IF NOT EXISTS public.ai_token_usage (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  company_id uuid,
  total_tokens integer NOT NULL DEFAULT 0,
  prompt_tokens integer NOT NULL DEFAULT 0,
  completion_tokens integer NOT NULL DEFAULT 0,
  model character varying NOT NULL DEFAULT 'gpt-4-turbo'::character varying,
  provider character varying NOT NULL DEFAULT 'openai'::character varying,
  feature character varying,
  request_type character varying,
  estimated_cost numeric,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT ai_token_usage_pkey PRIMARY KEY (id),
  CONSTRAINT ai_token_usage_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT ai_token_usage_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id),
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS public.companies (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL UNIQUE,
  company_name text NOT NULL,
  nit text,
  legal_representative text,
  economic_sector text,
  phone text,
  address text,
  city text,
  department text,
  country text DEFAULT 'Colombia'::text,
  unspsc_codes jsonb,
  financial_indicators jsonb,
  experience_summary jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT companies_pkey PRIMARY KEY (id),
  CONSTRAINT companies_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id)
);

CREATE TABLE IF NOT EXISTS public.company_contracts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  contract_number text NOT NULL,
  client_name text NOT NULL,
  contract_value numeric NOT NULL,
  contract_value_smmlv numeric,
  execution_date date,
  unspsc_codes jsonb,
  description text,
  document_url text,
  document_name text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT company_contracts_pkey PRIMARY KEY (id),
  CONSTRAINT company_contracts_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id)
);

CREATE TABLE IF NOT EXISTS public.company_documents (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  document_type text NOT NULL,
  document_name text NOT NULL,
  file_url text NOT NULL,
  file_size bigint,
  mime_type text,
  is_required boolean DEFAULT false,
  uploaded_at timestamp with time zone DEFAULT now(),
  uploaded_by uuid,
  metadata jsonb,
  CONSTRAINT company_documents_pkey PRIMARY KEY (id),
  CONSTRAINT company_documents_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id),
  CONSTRAINT company_documents_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.profiles(id)
);

CREATE TABLE IF NOT EXISTS public.competitor_analysis (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nit text NOT NULL UNIQUE,
  name text NOT NULL,
  total_contracts integer DEFAULT 0,
  total_amount numeric DEFAULT 0,
  win_rate numeric,
  top_sectors jsonb,
  top_entities jsonb,
  risk_score numeric,
  last_analyzed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT competitor_analysis_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.gap_analysis (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  analysis_date timestamp with time zone DEFAULT now(),
  overall_match_score numeric,
  missing_requirements jsonb,
  recommendations jsonb,
  critical_risks jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT gap_analysis_pkey PRIMARY KEY (id),
  CONSTRAINT gap_analysis_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id)
);

CREATE TABLE IF NOT EXISTS public.historical_tenders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  secop_id text NOT NULL UNIQUE,
  title text NOT NULL,
  description text,
  amount numeric,
  currency text DEFAULT 'COP'::text,
  status text,
  published_at timestamp with time zone,
  closing_at timestamp with time zone,
  awarded_at timestamp with time zone,
  entity_name text,
  entity_nit text,
  region text,
  department text,
  city text,
  category text,
  unspsc_codes jsonb,
  winner_nit text,
  winner_name text,
  competitors_count integer,
  embedding vector(1536),
  processed_for_ai boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT historical_tenders_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.market_metrics (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  metric_type text NOT NULL,
  dimension text,
  period text,
  start_date date,
  end_date date,
  value numeric,
  data jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT market_metrics_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.monitored_entities (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  entity_name character varying NOT NULL,
  entity_nit character varying,
  notify_on_new_tender boolean DEFAULT true,
  notify_on_changes boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT monitored_entities_pkey PRIMARY KEY (id),
  CONSTRAINT monitored_entities_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type character varying NOT NULL CHECK (type::text = ANY (ARRAY['new_tender'::character varying, 'deadline'::character varying, 'market_change'::character varying, 'alert'::character varying]::text[])),
  title character varying NOT NULL,
  message text NOT NULL,
  read boolean DEFAULT false,
  action_url character varying,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  email text,
  full_name text,
  avatar_url text,
  profile_type text DEFAULT 'individual'::text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS public.project_documents (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  user_id uuid NOT NULL,
  document_type character varying NOT NULL CHECK (document_type::text = ANY (ARRAY['technical_proposal'::character varying, 'economic_proposal'::character varying, 'cover_letter'::character varying, 'timeline'::character varying, 'risk_matrix'::character varying, 'work_plan'::character varying, 'custom'::character varying]::text[])),
  title character varying NOT NULL,
  content text,
  file_path character varying,
  status character varying DEFAULT 'DRAFT'::character varying CHECK (status::text = ANY (ARRAY['DRAFT'::character varying, 'FINAL'::character varying, 'SUBMITTED'::character varying]::text[])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT project_documents_pkey PRIMARY KEY (id),
  CONSTRAINT project_documents_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id),
  CONSTRAINT project_documents_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS public.project_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  user_id uuid NOT NULL,
  event_type character varying NOT NULL CHECK (event_type::text = ANY (ARRAY['question_deadline'::character varying, 'answer_release'::character varying, 'proposal_deadline'::character varying, 'opening_event'::character varying, 'adjudication'::character varying, 'contract_signing'::character varying, 'custom'::character varying]::text[])),
  title character varying NOT NULL,
  description text,
  event_date timestamp with time zone NOT NULL,
  reminder_sent boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT project_events_pkey PRIMARY KEY (id),
  CONSTRAINT project_events_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id),
  CONSTRAINT project_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS public.project_stages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  name text NOT NULL,
  "order" integer NOT NULL,
  color text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT project_stages_pkey PRIMARY KEY (id),
  CONSTRAINT project_stages_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id)
);

CREATE TABLE IF NOT EXISTS public.project_tasks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  stage_id uuid,
  title text NOT NULL,
  description text,
  priority task_priority DEFAULT 'MEDIUM'::task_priority,
  status task_status DEFAULT 'TODO'::task_status,
  assigned_to uuid,
  due_date timestamp with time zone,
  is_requirement boolean DEFAULT false,
  requirement_type text,
  requirement_met boolean DEFAULT false,
  gap_analysis_note text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT project_tasks_pkey PRIMARY KEY (id),
  CONSTRAINT project_tasks_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id),
  CONSTRAINT project_tasks_stage_id_fkey FOREIGN KEY (stage_id) REFERENCES public.project_stages(id),
  CONSTRAINT project_tasks_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.profiles(id)
);

CREATE TABLE IF NOT EXISTS public.projects (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  tender_id uuid,
  name text NOT NULL,
  description text,
  methodology project_methodology DEFAULT 'AGILE'::project_methodology,
  status project_status DEFAULT 'ACTIVE'::project_status,
  start_date date DEFAULT CURRENT_DATE,
  deadline_date date,
  budget numeric,
  progress numeric DEFAULT 0,
  secop_process_id text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  deadline timestamp with time zone,
  submission_date timestamp with time zone,
  result character varying CHECK (result::text = ANY (ARRAY['WON'::character varying, 'LOST'::character varying, 'PENDING'::character varying]::text[])),
  result_date timestamp with time zone,
  result_notes text,
  lessons_learned text,
  CONSTRAINT projects_pkey PRIMARY KEY (id),
  CONSTRAINT projects_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id),
  CONSTRAINT projects_tender_id_fkey FOREIGN KEY (tender_id) REFERENCES public.historical_tenders(id)
);

CREATE TABLE IF NOT EXISTS public.saved_searches (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL,
  name text NOT NULL,
  query text,
  filters jsonb,
  frequency text DEFAULT 'daily'::text,
  is_active boolean DEFAULT true,
  last_run_at timestamp with time zone,
  last_results_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT saved_searches_pkey PRIMARY KEY (id),
  CONSTRAINT saved_searches_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id)
);

CREATE TABLE IF NOT EXISTS public.tenders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  secop_id text NOT NULL UNIQUE,
  title text NOT NULL,
  description text,
  amount numeric,
  currency text DEFAULT 'COP'::text,
  status text,
  published_at timestamp with time zone,
  closing_at timestamp with time zone,
  url text,
  entity_name text,
  region text,
  department text,
  city text,
  category text,
  subcategory text,
  embedding vector(1536),
  metadata jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT tenders_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.user_ai_preferences (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL,
  preferred_sectors jsonb,
  preferred_regions jsonb,
  min_amount numeric,
  max_amount numeric,
  risk_tolerance text DEFAULT 'medium'::text,
  competitor_avoidance_list jsonb,
  keywords_positive jsonb,
  keywords_negative jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_ai_preferences_pkey PRIMARY KEY (id),
  CONSTRAINT user_ai_preferences_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id)
);

CREATE TABLE IF NOT EXISTS public.user_alert_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  email_notifications boolean DEFAULT true,
  new_tenders boolean DEFAULT true,
  deadlines boolean DEFAULT true,
  market_changes boolean DEFAULT true,
  critical_alerts boolean DEFAULT true,
  deadline_days_before integer DEFAULT 2,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_alert_settings_pkey PRIMARY KEY (id),
  CONSTRAINT user_alert_settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
