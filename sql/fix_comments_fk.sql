-- Script to fix the comments table's foreign key relationship

-- Step 1: Check if the comments table exists, if not create it with proper foreign keys
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'comments') THEN
    CREATE TABLE public.comments (
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
      user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
      content text NOT NULL,
      created_at timestamp with time zone DEFAULT now() NOT NULL
    );
  ELSE
    -- Step 2: If the table exists, check and fix the user_id foreign key
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints tc
      JOIN information_schema.constraint_column_usage ccu 
        ON tc.constraint_name = ccu.constraint_name 
        AND tc.constraint_schema = ccu.constraint_schema
      WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_name = 'comments'
        AND ccu.column_name = 'user_id'
    ) THEN
      -- Drop user_id column if it exists but without proper FK
      ALTER TABLE public.comments 
        DROP COLUMN IF EXISTS user_id CASCADE;
      
      -- Add user_id column with proper FK reference
      ALTER TABLE public.comments 
        ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;
  END IF;
END
$$;

-- Step 3: Set up RLS policies for comments
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to view all comments
CREATE POLICY IF NOT EXISTS "Anyone can view comments"
  ON public.comments
  FOR SELECT
  USING (true);

-- Policy to allow users to insert their own comments
CREATE POLICY IF NOT EXISTS "Users can create their own comments"
  ON public.comments
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to update their own comments
CREATE POLICY IF NOT EXISTS "Users can update their own comments"
  ON public.comments
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy to allow users to delete their own comments
CREATE POLICY IF NOT EXISTS "Users can delete their own comments"
  ON public.comments
  FOR DELETE
  USING (auth.uid() = user_id);

-- Notify successful completion
DO $$
BEGIN
  RAISE NOTICE 'Comments table and policies have been successfully set up or updated.';
END
$$;
