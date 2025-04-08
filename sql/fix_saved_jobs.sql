-- Drop the existing constraints if there are issues
ALTER TABLE IF EXISTS public.saved_jobs
DROP CONSTRAINT IF EXISTS saved_jobs_job_id_fkey;

-- Recreate the saved_jobs table with correct references
ALTER TABLE public.saved_jobs
ADD CONSTRAINT saved_jobs_job_id_fkey 
FOREIGN KEY (job_id) REFERENCES public.jobs (job_id) ON DELETE CASCADE;

-- Enable Row Level Security
ALTER TABLE public.saved_jobs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for saved_jobs
CREATE POLICY "Users can insert their own saved jobs" 
ON public.saved_jobs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own saved jobs" 
ON public.saved_jobs 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved jobs" 
ON public.saved_jobs 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create an index on job_id and user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_saved_jobs_job_id ON public.saved_jobs(job_id);
CREATE INDEX IF NOT EXISTS idx_saved_jobs_user_id ON public.saved_jobs(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_saved_jobs_unique_job_per_user 
ON public.saved_jobs(user_id, job_id);
