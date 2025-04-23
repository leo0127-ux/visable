-- 彻底修复聊天策略中的递归问题

-- 首先删除所有有问题的策略
DROP POLICY IF EXISTS "Chat participants are viewable by participants" ON public.chat_participants;
DROP POLICY IF EXISTS "Users can join chats" ON public.chat_participants;
DROP POLICY IF EXISTS "View own participation" ON public.chat_participants;
DROP POLICY IF EXISTS "View participants in same room" ON public.chat_participants;
DROP POLICY IF EXISTS "Add participants" ON public.chat_participants;
DROP POLICY IF EXISTS "View room messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Create messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can view their chat rooms" ON public.chat_rooms;
DROP POLICY IF EXISTS "Chat room access for participants" ON public.chat_rooms;

-- 确保所有表启用了RLS
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;

-- 为chat_participants创建简单高效的策略
CREATE POLICY "View own chat participation" 
ON public.chat_participants
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "View chat participants" 
ON public.chat_participants
FOR SELECT 
USING (
  chat_room_id IN (
    SELECT DISTINCT chat_room_id 
    FROM public.chat_participants
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Join public chat rooms" 
ON public.chat_participants
FOR INSERT 
WITH CHECK (
  (SELECT type FROM public.chat_rooms WHERE id = chat_room_id) = 'group'
  OR 
  (SELECT created_by FROM public.chat_rooms WHERE id = chat_room_id) = auth.uid()
);

-- 为chat_messages创建策略
CREATE POLICY "View chat messages" 
ON public.chat_messages
FOR SELECT
USING (
  chat_room_id IN (
    SELECT chat_room_id 
    FROM public.chat_participants 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Send chat messages" 
ON public.chat_messages
FOR INSERT
WITH CHECK (
  chat_room_id IN (
    SELECT chat_room_id 
    FROM public.chat_participants 
    WHERE user_id = auth.uid()
  )
);

-- 为chat_rooms创建策略
CREATE POLICY "Access chat rooms" 
ON public.chat_rooms
FOR SELECT 
USING (
  id IN (
    SELECT chat_room_id 
    FROM public.chat_participants 
    WHERE user_id = auth.uid()
  )
  OR
  (type = 'group' AND board_id IS NOT NULL)
);

CREATE POLICY "Create chat rooms" 
ON public.chat_rooms
FOR INSERT
WITH CHECK (created_by = auth.uid());

-- 刷新RLS缓存
NOTIFY pgrst, 'reload schema';
