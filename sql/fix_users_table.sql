-- Ensure the public.users table exists with the necessary columns
CREATE TABLE IF NOT EXISTS public.users (
  id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  full_name text,
  bio text,
  website text,
  location text,
  avatar_url text,
  updated_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  vpoint integer DEFAULT 0,
  PRIMARY KEY (id)
);

-- Enable row level security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to view all user profiles (without IF NOT EXISTS)
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
  END IF;
END
$$;

-- Insert data from auth.users if missing
INSERT INTO public.users (id, email, created_at)
SELECT id, email, created_at
FROM auth.users
WHERE NOT EXISTS (SELECT 1 FROM public.users WHERE users.id = auth.users.id);

-- Insert some sample users for testing (only if table is empty)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.users LIMIT 1) THEN
    INSERT INTO public.users (id, email, full_name, location, bio, created_at)
    VALUES 
      ('00000000-0000-0000-0000-000000000001', 'john.doe@example.com', 'John Doe', 'New York, USA', 'Software Engineer with 5 years experience', now()),
      ('00000000-0000-0000-0000-000000000002', 'jane.smith@example.com', 'Jane Smith', 'San Francisco, USA', 'Product Manager passionate about UX', now()),
      ('00000000-0000-0000-0000-000000000003', 'sam.wilson@example.com', 'Sam Wilson', 'London, UK', 'Data Scientist specializing in ML', now()),
      ('00000000-0000-0000-0000-000000000004', 'alex.wong@example.com', 'Alex Wong', 'Toronto, Canada', 'Front-end developer focused on React', now()),
      ('00000000-0000-0000-0000-000000000005', 'maria.garcia@example.com', 'Maria Garcia', 'Berlin, Germany', 'UX/UI Designer with international experience', now());
  END IF;
END
$$;
