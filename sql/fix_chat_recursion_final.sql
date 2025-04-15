-- Fix infinite recursion issues in chat RLS policies
-- This script completely replaces all chat-related policies to eliminate recursion

-- First, drop all existing policies for chat-related tables to start fresh
DO $$
DECLARE
  policy_name text;
BEGIN
  -- Drop chat_rooms policies
  FOR policy_name IN (SELECT policyname FROM pg_policies WHERE tablename = 'chat_rooms')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.chat_rooms', policy_name);
  END LOOP;

  -- Drop chat_participants policies
  FOR policy_name IN (SELECT policyname FROM pg_policies WHERE tablename = 'chat_participants')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.chat_participants', policy_name);
  END LOOP;

  -- Drop chat_messages policies
  FOR policy_name IN (SELECT policyname FROM pg_policies WHERE tablename = 'chat_messages')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.chat_messages', policy_name);
  END LOOP;
END
$$;

-- Make sure RLS is enabled on all relevant tables
ALTER TABLE IF EXISTS public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Add a participants array column to chat_rooms if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' 
      AND table_name = 'chat_rooms'
      AND column_name = 'participants'
  ) THEN
    ALTER TABLE public.chat_rooms ADD COLUMN participants uuid[] DEFAULT '{}';
    RAISE NOTICE 'Added participants column to chat_rooms table';
  END IF;
END
$$;

-- SIMPLER NON-RECURSIVE POLICIES FOR CHAT ROOMS
CREATE POLICY "chat_rooms_select" ON public.chat_rooms
FOR SELECT USING (
  auth.uid() = created_by OR 
  auth.uid() = ANY(participants) OR
  type = 'board' -- Allow access to board chats for everyone
);

CREATE POLICY "chat_rooms_insert" ON public.chat_rooms
FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "chat_rooms_update" ON public.chat_rooms
FOR UPDATE USING (
  auth.uid() = created_by OR
  (type = 'board' AND EXISTS (
    SELECT 1 FROM public.boards 
    WHERE id = board_id AND created_by = auth.uid()
  ))
);

-- SIMPLER NON-RECURSIVE POLICIES FOR CHAT PARTICIPANTS
-- Now using a completely different approach to avoid recursion
CREATE POLICY "chat_participants_select" ON public.chat_participants
FOR SELECT USING (
  -- Users can see their own participation
  user_id = auth.uid() OR
  -- Users can see participants in rooms they created
  chat_room_id IN (
    SELECT id FROM public.chat_rooms WHERE created_by = auth.uid()
  ) OR
  -- Users can see participants in rooms where they're in the participants array
  chat_room_id IN (
    SELECT id FROM public.chat_rooms WHERE auth.uid() = ANY(participants)
  )
);

CREATE POLICY "chat_participants_insert" ON public.chat_participants
FOR INSERT WITH CHECK (
  -- Either you're adding yourself as participant
  user_id = auth.uid() OR 
  -- Or you're the creator of the chat room (using a non-recursive approach)
  chat_room_id IN (
    SELECT id FROM public.chat_rooms WHERE created_by = auth.uid()
  )
);

-- SIMPLER NON-RECURSIVE POLICIES FOR CHAT MESSAGES
CREATE POLICY "chat_messages_select" ON public.chat_messages
FOR SELECT USING (
  -- Users can see messages in rooms they've created
  chat_room_id IN (
    SELECT id FROM public.chat_rooms WHERE created_by = auth.uid()
  ) OR
  -- Users can see messages in rooms where they're in the participants array
  chat_room_id IN (
    SELECT id FROM public.chat_rooms WHERE auth.uid() = ANY(participants)
  ) OR
  -- All users can see board chat messages
  chat_room_id IN (
    SELECT id FROM public.chat_rooms WHERE type = 'board'
  )
);

CREATE POLICY "chat_messages_insert" ON public.chat_messages
FOR INSERT WITH CHECK (
  -- Users can only send messages if they're the sender and in the participants array or creator
  sender_id = auth.uid() AND (
    chat_room_id IN (
      SELECT id FROM public.chat_rooms WHERE auth.uid() = ANY(participants) OR created_by = auth.uid()
    ) OR
    chat_room_id IN (
      SELECT id FROM public.chat_rooms WHERE type = 'board'
    )
  )
);

-- Clear PostgreSQL cache to ensure changes take effect
NOTIFY pgrst, 'reload schema';

SELECT 'Chat policies successfully updated without recursion!' AS result;
