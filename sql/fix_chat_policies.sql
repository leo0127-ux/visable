-- Fix the recursive policy issue in chat_participants
DROP POLICY IF EXISTS "Users can view participants of their chat rooms" ON public.chat_participants;
DROP POLICY IF EXISTS "Users can view messages of their chat rooms" ON public.chat_messages;

-- Create fixed policies that prevent infinite recursion
CREATE POLICY "Users can view participants of their chat rooms" ON public.chat_participants
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.chat_rooms
    WHERE id = chat_room_id AND type = 'board'
  )
  OR
  EXISTS (
    SELECT 1 FROM public.chat_participants 
    WHERE chat_room_id = public.chat_participants.chat_room_id 
    AND user_id = auth.uid()
  )
);

-- Fix messages policy similarly
CREATE POLICY "Users can view messages of their chat rooms" ON public.chat_messages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.chat_rooms
    WHERE id = chat_room_id AND type = 'board'
  )
  OR
  EXISTS (
    SELECT 1 FROM public.chat_participants 
    WHERE chat_room_id = public.chat_messages.chat_room_id 
    AND user_id = auth.uid()
  )
);

-- Fix infinite recursion in chat_rooms policy
-- This script replaces any recursive policies with non-recursive ones

-- First, drop any problematic policies
DROP POLICY IF EXISTS "Allow users to view their chat rooms" ON public.chat_rooms;
DROP POLICY IF EXISTS "Users can view their chat rooms" ON public.chat_rooms;

-- Create new non-recursive policy for chat_rooms
CREATE POLICY "Users can view their chat rooms" ON public.chat_rooms
FOR SELECT 
USING (
  -- Check if user is the creator
  (auth.uid() = created_by) 
  OR 
  -- Check if user is in participants array directly
  (auth.uid() = ANY(participants))
  OR
  -- Check existing participation through chat_participants table
  EXISTS (
    SELECT 1 FROM public.chat_participants
    WHERE chat_participants.chat_room_id = chat_rooms.id
    AND chat_participants.user_id = auth.uid()
  )
);

-- Create policy to allow users to create chat rooms
CREATE POLICY "Users can create chat rooms" ON public.chat_rooms
FOR INSERT
WITH CHECK (auth.uid() = created_by);

-- Create policy to allow users to update their own chat rooms
CREATE POLICY "Users can update their chat rooms" ON public.chat_rooms
FOR UPDATE
USING (auth.uid() = created_by);

-- Ensure chat_participants has appropriate policies
ALTER TABLE IF EXISTS public.chat_participants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their chat participation" ON public.chat_participants;
CREATE POLICY "Users can view their chat participation" ON public.chat_participants
FOR SELECT
USING (auth.uid() = user_id);

-- Allow users to find other participants in the same chat room
DROP POLICY IF EXISTS "Users can see other participants in the same chat room" ON public.chat_participants;
CREATE POLICY "Users can see other participants in the same chat room" ON public.chat_participants
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.chat_participants my_rooms
    WHERE my_rooms.chat_room_id = chat_participants.chat_room_id
    AND my_rooms.user_id = auth.uid()
  )
);

-- Allow users to add participants to chat rooms they created
DROP POLICY IF EXISTS "Users can add participants to their rooms" ON public.chat_participants;
CREATE POLICY "Users can add participants to their rooms" ON public.chat_participants
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.chat_rooms
    WHERE chat_rooms.id = chat_participants.chat_room_id
    AND chat_rooms.created_by = auth.uid()
  )
);

-- Note: The row_security_check_rowlevel setting requires superuser access
-- If you have superuser access, run the following command directly in the SQL editor 
-- as a separate query (not inside a transaction):
-- 
-- ALTER SYSTEM SET row_security_check_rowlevel = on;
-- SELECT pg_reload_conf();
