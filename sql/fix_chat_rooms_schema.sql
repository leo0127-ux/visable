-- Add participants column to chat_rooms table
DO $$
BEGIN
  -- Check if participants column exists
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' 
      AND table_name = 'chat_rooms'
      AND column_name = 'participants'
  ) THEN
    -- Add the missing column
    ALTER TABLE public.chat_rooms ADD COLUMN participants uuid[] DEFAULT '{}';
    RAISE NOTICE 'Added participants column to chat_rooms table';
  END IF;
END
$$;

-- Ensure chat_rooms table has proper RLS policies
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to select their chat rooms
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE tablename = 'chat_rooms'
    AND policyname = 'Allow users to view their chat rooms'
  ) THEN
    -- Create the policy only if it doesn't exist
    EXECUTE 'CREATE POLICY "Allow users to view their chat rooms" ON public.chat_rooms FOR SELECT USING (auth.uid() = ANY(participants) OR created_by = auth.uid())';
  END IF;
END
$$;

-- Create policy to allow users to insert chat rooms
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE tablename = 'chat_rooms'
    AND policyname = 'Allow users to create chat rooms'
  ) THEN
    -- Create the policy only if it doesn't exist
    EXECUTE 'CREATE POLICY "Allow users to create chat rooms" ON public.chat_rooms FOR INSERT WITH CHECK (auth.uid() = created_by)';
  END IF;
END
$$;
