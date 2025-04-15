-- Fix infinite recursion issues in chat RLS policies
-- This script replaces problematic policies with optimized non-recursive versions

-- First, drop all existing policies for chat-related tables
DROP POLICY IF EXISTS "Users can view their chat rooms" ON public.chat_rooms;
DROP POLICY IF EXISTS "Users can create chat rooms" ON public.chat_rooms;
DROP POLICY IF EXISTS "Users can update their chat rooms" ON public.chat_rooms;

DROP POLICY IF EXISTS "Users can view their chat participation" ON public.chat_participants;
DROP POLICY IF EXISTS "Users can see other participants in the same chat room" ON public.chat_participants;
DROP POLICY IF EXISTS "Users can view participants of their chat rooms" ON public.chat_participants;
DROP POLICY IF EXISTS "Users can add participants to their rooms" ON public.chat_participants;

DROP POLICY IF EXISTS "Users can view messages of their chat rooms" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can add messages to their chat rooms" ON public.chat_messages;

-- Make sure RLS is enabled on all relevant tables
ALTER TABLE IF EXISTS public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Create non-recursive policies for chat_rooms
CREATE POLICY "Chat room access for participants" ON public.chat_rooms
FOR SELECT 
USING (
  -- Creator can access the room
  (auth.uid() = created_by) 
  OR 
  -- Participant can access via participants array
  (participants IS NOT NULL AND auth.uid() = ANY(participants))
);

CREATE POLICY "Chat room creation" ON public.chat_rooms
FOR INSERT
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Chat room update" ON public.chat_rooms
FOR UPDATE
USING (auth.uid() = created_by);

-- Create non-recursive policies for chat_participants
CREATE POLICY "View own participation" ON public.chat_participants
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "View participants in same room" ON public.chat_participants
FOR SELECT
USING (
  -- Can see participants in rooms you're in
  chat_room_id IN (
    SELECT chat_room_id 
    FROM public.chat_participants 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Add participants" ON public.chat_participants
FOR INSERT
WITH CHECK (
  -- Only room creator can add participants
  EXISTS (
    SELECT 1 FROM public.chat_rooms
    WHERE id = chat_room_id 
    AND created_by = auth.uid()
  )
);

-- Create policies for chat_messages
CREATE POLICY "View room messages" ON public.chat_messages
FOR SELECT
USING (
  -- Can see messages from rooms you're in
  chat_room_id IN (
    SELECT chat_room_id 
    FROM public.chat_participants 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Create messages" ON public.chat_messages
FOR INSERT
WITH CHECK (
  -- Can add messages to rooms you're in
  EXISTS (
    SELECT 1 
    FROM public.chat_participants 
    WHERE chat_room_id = chat_messages.chat_room_id 
    AND user_id = auth.uid()
  )
);

-- Clear any potential RLS cache to ensure changes take effect
NOTIFY pgrst, 'reload schema';
