-- 全面修复数据库问题的脚本

-- 第1部分: 清除所有潜在的无限递归策略
DROP POLICY IF EXISTS "Chat participants are viewable by participants" ON public.chat_participants;
DROP POLICY IF EXISTS "Users can join chats" ON public.chat_participants;
DROP POLICY IF EXISTS "View own participation" ON public.chat_participants;
DROP POLICY IF EXISTS "View participants in same room" ON public.chat_participants;
DROP POLICY IF EXISTS "Add participants" ON public.chat_participants;
DROP POLICY IF EXISTS "View room messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Create messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can view their chat rooms" ON public.chat_rooms;
DROP POLICY IF EXISTS "Chat room access for participants" ON public.chat_rooms;
DROP POLICY IF EXISTS "Allow users to view their chat rooms" ON public.chat_rooms;
DROP POLICY IF EXISTS "Allow users to create chat rooms" ON public.chat_rooms;

-- 第2部分: 确保所有表都启用了RLS
ALTER TABLE IF EXISTS public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.board_followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.users ENABLE ROW LEVEL SECURITY;

-- 第3部分: 修复聊天参与者表的结构
DO $$
BEGIN
  -- 确保chat_participants表有user_email列
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'chat_participants'
      AND column_name = 'user_email'
  ) THEN
    ALTER TABLE public.chat_participants ADD COLUMN user_email TEXT;
    
    -- 从auth.users表中填充user_email数据
    UPDATE public.chat_participants cp
    SET user_email = u.email
    FROM auth.users u
    WHERE cp.user_id = u.id AND cp.user_email IS NULL;
    
    RAISE NOTICE 'Added user_email column to chat_participants table';
  END IF;
END
$$;

-- 第4部分: 修复board_id类型问题(针对多个表)
DO $$
DECLARE
  tables_with_board_id TEXT[] := ARRAY['board_followers', 'posts', 'chat_rooms'];
  table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY tables_with_board_id
  LOOP
    -- 检查该表是否存在且有board_id列是TEXT类型
    IF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = table_name
        AND column_name = 'board_id'
        AND data_type = 'text'
    ) THEN
      -- 创建临时UUID列
      EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS board_id_uuid UUID', table_name);
      
      -- 尝试将TEXT值转换为UUID
      BEGIN
        EXECUTE format('
          UPDATE public.%I
          SET board_id_uuid = board_id::uuid
          WHERE board_id IS NOT NULL 
            AND board_id ~ ''^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$''
        ', table_name);
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error converting TEXT to UUID in %: %', table_name, SQLERRM;
      END;
      
      -- 替换原始列
      BEGIN
        EXECUTE format('ALTER TABLE public.%I DROP COLUMN board_id', table_name);
        EXECUTE format('ALTER TABLE public.%I RENAME COLUMN board_id_uuid TO board_id', table_name);
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Error replacing board_id column in %: %', table_name, SQLERRM;
      END;
      
      RAISE NOTICE 'Converted board_id from TEXT to UUID in table %', table_name;
    END IF;
  END LOOP;
END
$$;

-- 第5部分: 创建简单的非递归RLS策略
-- chat_rooms表策略
CREATE POLICY "Simple chat rooms access" 
ON public.chat_rooms
FOR SELECT 
USING (true);

CREATE POLICY "Simple chat rooms creation" 
ON public.chat_rooms
FOR INSERT
WITH CHECK (auth.uid() = created_by);

-- chat_participants表策略
CREATE POLICY "Simple view own participation" 
ON public.chat_participants
FOR SELECT
USING (true);

CREATE POLICY "Simple join chat" 
ON public.chat_participants
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- chat_messages表策略
CREATE POLICY "Simple view messages" 
ON public.chat_messages
FOR SELECT
USING (true);

CREATE POLICY "Simple create messages" 
ON public.chat_messages
FOR INSERT
WITH CHECK (sender_id = auth.uid());

-- 第6部分: 确保chat_rooms表有participants列
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

-- 添加到chat_rooms的必要外键参照
ALTER TABLE IF EXISTS public.chat_rooms
  DROP CONSTRAINT IF EXISTS fk_chat_rooms_board,
  ADD CONSTRAINT fk_chat_rooms_board 
  FOREIGN KEY (board_id) 
  REFERENCES public.boards(id)
  ON DELETE SET NULL;

-- 通知PGRST重新加载模式以应用变更
NOTIFY pgrst, 'reload schema';
