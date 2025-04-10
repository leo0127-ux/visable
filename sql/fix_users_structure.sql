-- This script ensures that the users table has the expected columns

-- First check if the full_name column exists and add it if it doesn't
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'users'
    AND column_name = 'full_name'
  ) THEN
    ALTER TABLE public.users ADD COLUMN full_name text;
    RAISE NOTICE 'Added missing full_name column to users table';
  END IF;
  
  -- Check for other expected columns and add them if missing
  
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'users'
    AND column_name = 'bio'
  ) THEN
    ALTER TABLE public.users ADD COLUMN bio text;
    RAISE NOTICE 'Added missing bio column to users table';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'users'
    AND column_name = 'website'
  ) THEN
    ALTER TABLE public.users ADD COLUMN website text;
    RAISE NOTICE 'Added missing website column to users table';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'users'
    AND column_name = 'location'
  ) THEN
    ALTER TABLE public.users ADD COLUMN location text;
    RAISE NOTICE 'Added missing location column to users table';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'users'
    AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE public.users ADD COLUMN avatar_url text;
    RAISE NOTICE 'Added missing avatar_url column to users table';
  END IF;
END;
$$;

-- Also verify that RLS policy exists for viewing users
DO $$
BEGIN
  -- Check if the policy already exists
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE tablename = 'users'
    AND policyname = 'Allow users to view all profiles'
  ) THEN
    -- Create the policy only if it doesn't exist
    EXECUTE 'CREATE POLICY "Allow users to view all profiles" ON public.users FOR SELECT USING (true)';
    RAISE NOTICE 'Created missing RLS policy for viewing users';
  END IF;
END
$$;

-- Migrate existing user data from auth.users to add names if missing
UPDATE public.users
SET full_name = auth.users.raw_user_meta_data->>'full_name'
FROM auth.users
WHERE public.users.id = auth.users.id
AND public.users.full_name IS NULL
AND auth.users.raw_user_meta_data->>'full_name' IS NOT NULL;

-- Set notification that the script is complete
DO $$
BEGIN
  RAISE NOTICE 'User table structure verification complete';
END;
$$;
