-- Chat rooms table - stores info about all chat rooms
CREATE TABLE IF NOT EXISTS public.chat_rooms (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text,
  type text NOT NULL CHECK (type IN ('board', 'direct', 'group')),
  board_id uuid REFERENCES public.boards(id) ON DELETE SET NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT chat_rooms_pkey PRIMARY KEY (id)
);

-- Chat participants table - stores participants of each chat room
CREATE TABLE IF NOT EXISTS public.chat_participants (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  chat_room_id uuid NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL, -- Changed from CASCADE to SET NULL
  user_email text, -- Store the email separately to preserve it if user is deleted
  joined_at timestamp with time zone NOT NULL DEFAULT now(),
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'admin')),
  status text DEFAULT 'active' CHECK (status IN ('active', 'deleted')), -- Track if user was deleted
  CONSTRAINT chat_participants_pkey PRIMARY KEY (id),
  CONSTRAINT chat_participants_unique_user_per_room UNIQUE (chat_room_id, user_id) 
    WHERE user_id IS NOT NULL -- Only apply uniqueness for non-null user_ids
);

-- Add a trigger to capture user email when adding them to a chat
CREATE OR REPLACE FUNCTION public.capture_chat_user_email()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_id IS NOT NULL THEN
    NEW.user_email := (SELECT email FROM auth.users WHERE id = NEW.user_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER capture_chat_participant_email
BEFORE INSERT ON public.chat_participants
FOR EACH ROW EXECUTE FUNCTION public.capture_chat_user_email();

-- Chat messages table - stores all messages
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  chat_room_id uuid NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES auth.users(id) ON DELETE SET NULL, -- Changed from CASCADE to SET NULL
  sender_email text, -- Store the sender email separately to preserve it
  message text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  is_system boolean NOT NULL DEFAULT false,
  read_by uuid[] DEFAULT '{}',
  CONSTRAINT chat_messages_pkey PRIMARY KEY (id)
);

-- Add a trigger to capture sender email when sending a message
CREATE OR REPLACE FUNCTION public.capture_chat_sender_email()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.sender_id IS NOT NULL AND NEW.is_system = FALSE THEN
    NEW.sender_email := (SELECT email FROM auth.users WHERE id = NEW.sender_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER capture_message_sender_email
BEFORE INSERT ON public.chat_messages
FOR EACH ROW EXECUTE FUNCTION public.capture_chat_sender_email();

-- Handle user deletion by updating chat_participants
CREATE OR REPLACE FUNCTION public.handle_user_deletion()
RETURNS TRIGGER AS $$
BEGIN
  -- User is being deleted, update their status in chat_participants
  UPDATE public.chat_participants
  SET status = 'deleted'
  WHERE user_id = OLD.id;

  -- Update any related rooms to show user has been deleted
  -- (This is only needed if you want to display a special indicator for these rooms)
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_user_deleted
BEFORE DELETE ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_user_deletion();

-- Enable Row Level Security
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Users can view chat rooms they're a participant in or public board chats
CREATE POLICY "Users can view chat rooms they're in" ON public.chat_rooms
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.chat_participants 
    WHERE chat_room_id = id AND user_id = auth.uid()
  )
  OR 
  type = 'board' -- Board chats are visible to all
);

-- Users can view participants of rooms they're in
CREATE POLICY "Users can view participants of their chat rooms" ON public.chat_participants
FOR SELECT USING (
  chat_room_id IN (
    SELECT chat_room_id FROM public.chat_participants 
    WHERE user_id = auth.uid()
  )
  OR
  chat_room_id IN (
    SELECT id FROM public.chat_rooms
    WHERE type = 'board'
  )
);

-- Users can view messages for rooms they're in
CREATE POLICY "Users can view messages of their chat rooms" ON public.chat_messages
FOR SELECT USING (
  chat_room_id IN (
    SELECT chat_room_id FROM public.chat_participants 
    WHERE user_id = auth.uid()
  )
  OR
  chat_room_id IN (
    SELECT id FROM public.chat_rooms
    WHERE type = 'board'
  )
);

-- Users can send messages to rooms they're in
CREATE POLICY "Users can send messages to their chat rooms" ON public.chat_messages
FOR INSERT WITH CHECK (
  chat_room_id IN (
    SELECT chat_room_id FROM public.chat_participants 
    WHERE user_id = auth.uid()
  )
  OR
  chat_room_id IN (
    SELECT id FROM public.chat_rooms
    WHERE type = 'board'
  )
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_chat_room_id ON public.chat_messages(chat_room_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_participants_user_id ON public.chat_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_participants_chat_room_id ON public.chat_participants(chat_room_id);
