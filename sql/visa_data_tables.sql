-- Create tables for storing visa data

-- H1B Approvals
CREATE TABLE IF NOT EXISTS public.visa_h1b_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employer_name TEXT NOT NULL,
    job_title TEXT NOT NULL,
    worksite_location TEXT,
    fiscal_year TEXT,
    wage NUMERIC,
    case_status TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- H1B Denials
CREATE TABLE IF NOT EXISTS public.visa_h1b_denials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employer_name TEXT NOT NULL,
    job_title TEXT NOT NULL,
    worksite_location TEXT,
    fiscal_year TEXT,
    denial_reason TEXT,
    case_status TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- H1B LCA (Labor Condition Application)
CREATE TABLE IF NOT EXISTS public.visa_h1b_lca (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_number TEXT,
    employer_name TEXT NOT NULL,
    job_title TEXT NOT NULL,
    worksite_location TEXT,
    wage NUMERIC,
    wage_unit TEXT,
    submission_date DATE,
    start_date DATE,
    end_date DATE,
    status TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- PERM (Green Card Applications)
CREATE TABLE IF NOT EXISTS public.visa_perm (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_number TEXT,
    employer_name TEXT NOT NULL,
    job_title TEXT NOT NULL,
    worksite_location TEXT,
    wage NUMERIC,
    wage_unit TEXT,
    filing_date DATE,
    case_status TEXT,
    decision_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- H1B Prevailing Wage Data
CREATE TABLE IF NOT EXISTS public.visa_prevailing_wage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_title TEXT NOT NULL,
    area_of_employment TEXT,
    wage_level TEXT,
    prevailing_wage NUMERIC,
    wage_unit TEXT,
    effective_date DATE,
    expiration_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Metadata table to track last update time
CREATE TABLE IF NOT EXISTS public.visa_data_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name TEXT UNIQUE NOT NULL,
    last_updated TIMESTAMP WITH TIME ZONE,
    record_count INTEGER,
    status TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Summary statistics table
CREATE TABLE IF NOT EXISTS public.visa_data_summary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    total_h1b_approvals INTEGER DEFAULT 0,
    total_h1b_denials INTEGER DEFAULT 0,
    approval_rate NUMERIC DEFAULT 0,
    avg_prevailing_wage NUMERIC DEFAULT 0,
    total_green_card_approvals INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add appropriate indexes
CREATE INDEX IF NOT EXISTS idx_visa_h1b_approvals_employer ON public.visa_h1b_approvals(employer_name);
CREATE INDEX IF NOT EXISTS idx_visa_h1b_denials_employer ON public.visa_h1b_denials(employer_name);
CREATE INDEX IF NOT EXISTS idx_visa_h1b_lca_employer ON public.visa_h1b_lca(employer_name);
CREATE INDEX IF NOT EXISTS idx_visa_perm_employer ON public.visa_perm(employer_name);
CREATE INDEX IF NOT EXISTS idx_visa_prevailing_wage_job ON public.visa_prevailing_wage(job_title);

-- Add RLS policies
ALTER TABLE public.visa_h1b_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visa_h1b_denials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visa_h1b_lca ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visa_perm ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visa_prevailing_wage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visa_data_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visa_data_summary ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Allow public to view H1B approvals" ON public.visa_h1b_approvals;
DROP POLICY IF EXISTS "Allow public to view H1B denials" ON public.visa_h1b_denials;
DROP POLICY IF EXISTS "Allow public to view H1B LCA" ON public.visa_h1b_lca;
DROP POLICY IF EXISTS "Allow public to view PERM" ON public.visa_perm;
DROP POLICY IF EXISTS "Allow public to view prevailing wages" ON public.visa_prevailing_wage;
DROP POLICY IF EXISTS "Allow public to view metadata" ON public.visa_data_metadata;
DROP POLICY IF EXISTS "Allow public to view summary" ON public.visa_data_summary;

-- Create policies for public read access
CREATE POLICY "Allow public to view H1B approvals" ON public.visa_h1b_approvals FOR SELECT USING (true);
CREATE POLICY "Allow public to view H1B denials" ON public.visa_h1b_denials FOR SELECT USING (true);
CREATE POLICY "Allow public to view H1B LCA" ON public.visa_h1b_lca FOR SELECT USING (true);
CREATE POLICY "Allow public to view PERM" ON public.visa_perm FOR SELECT USING (true);
CREATE POLICY "Allow public to view prevailing wages" ON public.visa_prevailing_wage FOR SELECT USING (true);
CREATE POLICY "Allow public to view metadata" ON public.visa_data_metadata FOR SELECT USING (true);
CREATE POLICY "Allow public to view summary" ON public.visa_data_summary FOR SELECT USING (true);

-- Insert initial metadata entries
INSERT INTO public.visa_data_metadata (table_name, last_updated, record_count, status)
VALUES 
  ('visa_h1b_approvals', NULL, 0, 'initialized'),
  ('visa_h1b_denials', NULL, 0, 'initialized'),
  ('visa_h1b_lca', NULL, 0, 'initialized'),
  ('visa_perm', NULL, 0, 'initialized'),
  ('visa_prevailing_wage', NULL, 0, 'initialized')
ON CONFLICT (table_name) DO NOTHING;

-- Insert initial summary record
INSERT INTO public.visa_data_summary (total_h1b_approvals, total_h1b_denials, approval_rate, avg_prevailing_wage, total_green_card_approvals)
VALUES (0, 0, 0, 0, 0)
ON CONFLICT (id) DO NOTHING;
