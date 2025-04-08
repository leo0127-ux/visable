-- Drop the problematic foreign key constraint
ALTER TABLE IF EXISTS public.saved_jobs
DROP CONSTRAINT IF EXISTS saved_jobs_user_id_fkey;

-- Check if we have the public.users table
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users') THEN
    -- Reference public.users if it exists
    ALTER TABLE public.saved_jobs
    ADD CONSTRAINT saved_jobs_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
  ELSE
    -- Reference auth.users directly
    ALTER TABLE public.saved_jobs
    ADD CONSTRAINT saved_jobs_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Make sure we have the right policies
DROP POLICY IF EXISTS "Users can insert their own saved jobs" ON public.saved_jobs;
DROP POLICY IF EXISTS "Users can view their own saved jobs" ON public.saved_jobs;
DROP POLICY IF EXISTS "Users can delete their own saved jobs" ON public.saved_jobs;

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
