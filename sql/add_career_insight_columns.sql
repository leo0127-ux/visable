-- Add career insight columns to posts table
ALTER TABLE public.posts 
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS company_name text,
  ADD COLUMN IF NOT EXISTS job_title text,
  ADD COLUMN IF NOT EXISTS location text,
  ADD COLUMN IF NOT EXISTS base_salary numeric,
  ADD COLUMN IF NOT EXISTS job_type text,
  ADD COLUMN IF NOT EXISTS visa_sponsorship boolean,
  ADD COLUMN IF NOT EXISTS work_hours_per_week text,
  ADD COLUMN IF NOT EXISTS benefits text,
  ADD COLUMN IF NOT EXISTS insight_type text,
  ADD COLUMN IF NOT EXISTS interview_date date,
  ADD COLUMN IF NOT EXISTS interview_outcome text,
  ADD COLUMN IF NOT EXISTS interview_difficulty text,
  ADD COLUMN IF NOT EXISTS number_of_rounds text,
  ADD COLUMN IF NOT EXISTS technical_interview boolean,
  ADD COLUMN IF NOT EXISTS behavioral_interview boolean,
  ADD COLUMN IF NOT EXISTS case_study boolean,
  ADD COLUMN IF NOT EXISTS advice text;

-- Create index on category for faster filtering
CREATE INDEX IF NOT EXISTS idx_posts_category ON public.posts(category);

-- Create index on insight_type for filtering within career insights
CREATE INDEX IF NOT EXISTS idx_posts_insight_type ON public.posts(insight_type);
