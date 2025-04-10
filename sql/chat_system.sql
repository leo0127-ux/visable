-- Chat rooms table - stores info about all chat rooms
CREATE TABLE IF NOT EXISTS public.chat_rooms (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text,
  type text NOT NULL CHECK (type IN ('board', 'direct', 'group')),
  board_id uuid REFERENCES public.boards(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid NOT NULL REFERENCES auth.users(id),
  CONSTRAINT chat_rooms_pkey PRIMARY KEY (id)
);

-- Chat participants table - stores participants of each chat room
CREATE TABLE IF NOT EXISTS public.chat_participants (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  chat_room_id uuid NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at timestamp with time zone NOT NULL DEFAULT now(),
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'admin')),
  CONSTRAINT chat_participants_pkey PRIMARY KEY (id),
  CONSTRAINT chat_participants_unique_user_per_room UNIQUE (chat_room_id, user_id)
);

-- Chat messages table - stores all messages
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  chat_room_id uuid NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  message text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  is_system boolean NOT NULL DEFAULT false,
  read_by uuid[] DEFAULT '{}',
  CONSTRAINT chat_messages_pkey PRIMARY KEY (id)
);

-- Board chat trigger - automatically create a chat room when a board is created
CREATE OR REPLACE FUNCTION public.create_board_chat_room()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.chat_rooms (name, type, board_id, created_by)
  VALUES (NEW.name || ' Chat', 'board', NEW.id, auth.uid());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER create_board_chat_room_trigger
AFTER INSERT ON public.boards
FOR EACH ROW EXECUTE FUNCTION public.create_board_chat_room();

-- RLS policies
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Anyone can view chat rooms they're a participant in
CREATE POLICY "Users can view chat rooms they're in" ON public.chat_rooms
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.chat_participants 
    WHERE chat_room_id = id AND user_id = auth.uid()
  )
  OR 
  type = 'board' -- Board chats are visible to all
);

-- Users can view chat participants for rooms they're in
CREATE POLICY "Users can view participants of their chat rooms" ON public.chat_participants
FOR SELECT USING (
  chat_room_id IN (
    SELECT chat_room_id FROM public.chat_participants 
    WHERE user_id = auth.uid()
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
