-- Fix schema issues with posts and related tables

-- Add missing media_urls column to posts table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' 
      AND table_name = 'posts'
      AND column_name = 'media_urls'
  ) THEN
    ALTER TABLE public.posts ADD COLUMN media_urls TEXT[] DEFAULT '{}';
    RAISE NOTICE 'Added missing media_urls column to posts table';
  END IF;
END
$$;

-- Check for missing like_count and comment_count columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' 
      AND table_name = 'posts'
      AND column_name = 'like_count'
  ) THEN
    ALTER TABLE public.posts ADD COLUMN like_count INTEGER DEFAULT 0;
    RAISE NOTICE 'Added missing like_count column to posts table';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' 
      AND table_name = 'posts'
      AND column_name = 'comment_count'
  ) THEN
    ALTER TABLE public.posts ADD COLUMN comment_count INTEGER DEFAULT 0;
    RAISE NOTICE 'Added missing comment_count column to posts table';
  END IF;
END
$$;

-- Fix potential issues with posts table by ensuring correct field names
DO $$
BEGIN
  -- Check if table uses author_id instead of user_id
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' 
      AND table_name = 'posts'
      AND column_name = 'author_id'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' 
      AND table_name = 'posts'
      AND column_name = 'user_id'
  ) THEN
    -- Add user_id column based on author_id
    ALTER TABLE public.posts ADD COLUMN user_id UUID REFERENCES auth.users(id);
    
    -- Update user_id from author_id
    UPDATE public.posts SET user_id = author_id;
    
    RAISE NOTICE 'Added and migrated user_id column from author_id in posts table';
  END IF;
END
$$;

-- Verify other required columns are present in posts table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' 
      AND table_name = 'posts'
      AND column_name = 'board_id'
  ) THEN
    ALTER TABLE public.posts ADD COLUMN board_id TEXT;
    RAISE NOTICE 'Added missing board_id column to posts table';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' 
      AND table_name = 'posts'
      AND column_name = 'type'
  ) THEN
    ALTER TABLE public.posts ADD COLUMN type VARCHAR(50) DEFAULT 'text';
    RAISE NOTICE 'Added missing type column to posts table';
  END IF;
END
$$;

-- Verify career_insights schema
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' 
      AND table_name = 'career_insights'
  ) THEN
    CREATE TABLE public.career_insights (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      author TEXT,
      author_title TEXT,
      category TEXT, -- 'salary' or 'interview'
      tags TEXT[],
      published_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      view_count INTEGER DEFAULT 0,
      like_count INTEGER DEFAULT 0,
      comment_count INTEGER DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );
    
    -- Enable RLS
    ALTER TABLE public.career_insights ENABLE ROW LEVEL SECURITY;
    
    -- Add select policy
    CREATE POLICY "Career insights are viewable by everyone" 
      ON public.career_insights FOR SELECT USING (true);
      
    -- Add insert policy
    CREATE POLICY "Users can create career insights" 
      ON public.career_insights FOR INSERT WITH CHECK (auth.uid() = user_id);
    
    RAISE NOTICE 'Created missing career_insights table';
  END IF;
END
$$;

-- Confirm changes were made
DO $$
BEGIN
  RAISE NOTICE 'Schema verification complete';
END
$$;
