-- Drop the problematic foreign key constraint
ALTER TABLE IF EXISTS public.saved_jobs
DROP CONSTRAINT IF EXISTS saved_jobs_user_id_fkey;

-- Modify the foreign key to reference auth.users instead of public.users
ALTER TABLE public.saved_jobs
ADD CONSTRAINT saved_jobs_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create or replace the sync function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, created_at, vpoint)
  VALUES (new.id, new.email, now(), 0)
  ON CONFLICT (id) DO UPDATE 
    SET email = excluded.email,
        updated_at = now();
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Reapply the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Sync existing auth users to public users
DO $$
BEGIN
  INSERT INTO public.users (id, email, created_at)
  SELECT id, email, created_at FROM auth.users
  ON CONFLICT (id) DO NOTHING;
END
$$;
