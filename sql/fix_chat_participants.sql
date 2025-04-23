-- 修复chat_participants表的架构问题

-- 添加缺失的user_email列
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'chat_participants'
      AND column_name = 'user_email'
  ) THEN
    ALTER TABLE public.chat_participants ADD COLUMN user_email TEXT;
    RAISE NOTICE '添加了缺失的user_email列到chat_participants表';
    
    -- 从auth.users表中填充user_email数据
    UPDATE public.chat_participants cp
    SET user_email = u.email
    FROM auth.users u
    WHERE cp.user_id = u.id AND cp.user_email IS NULL;
  END IF;
END
$$;

-- 确保chat_participants表启用了RLS
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;

-- 创建访问策略（如果尚不存在）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'chat_participants' 
    AND policyname = 'Chat participants are viewable by participants'
  ) THEN
    CREATE POLICY "Chat participants are viewable by participants" 
    ON public.chat_participants FOR SELECT 
    USING (
      -- 如果是参与者，可以查看
      user_id = auth.uid() OR 
      -- 如果参与相同的聊天室，也可以查看
      chat_room_id IN (
        SELECT chat_room_id FROM public.chat_participants WHERE user_id = auth.uid()
      )
    );
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'chat_participants' 
    AND policyname = 'Users can join chats'
  ) THEN
    CREATE POLICY "Users can join chats" 
    ON public.chat_participants FOR INSERT 
    WITH CHECK (auth.uid() = user_id);
  END IF;
END
$$;
