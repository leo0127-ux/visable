-- Ensure chat_rooms table has correct structure and constraints

-- First create the table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.chat_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  board_id UUID REFERENCES public.boards(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  participants UUID[] DEFAULT '{}'
);

-- Enable row level security
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;

-- Create policy to let participants see chat rooms
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE tablename = 'chat_rooms'
    AND policyname = 'Chat room access for participants'
  ) THEN
    EXECUTE 'CREATE POLICY "Chat room access for participants" ON public.chat_rooms
      FOR SELECT 
      USING (
        -- Creator can access the room
        (auth.uid() = created_by) 
        OR 
        -- Participant can access via participants array
        (participants IS NOT NULL AND auth.uid() = ANY(participants))
      )';
  END IF;
END
$$;

-- Create policies for inserting and updating
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE tablename = 'chat_rooms'
    AND policyname = 'Chat room creation'
  ) THEN
    EXECUTE 'CREATE POLICY "Chat room creation" ON public.chat_rooms
      FOR INSERT
      WITH CHECK (auth.uid() = created_by)';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE tablename = 'chat_rooms'
    AND policyname = 'Chat room update'
  ) THEN
    EXECUTE 'CREATE POLICY "Chat room update" ON public.chat_rooms
      FOR UPDATE
      USING (auth.uid() = created_by)';
  END IF;
END
$$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chat_rooms_created_by ON public.chat_rooms(created_by);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_board_id ON public.chat_rooms(board_id);
