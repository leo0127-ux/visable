-- 向chat_rooms表添加board_id列

DO $$
BEGIN
  -- 检查board_id列是否已存在
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'chat_rooms'
      AND column_name = 'board_id'
  ) THEN
    -- 添加board_id列
    ALTER TABLE public.chat_rooms ADD COLUMN board_id UUID;
    
    -- 添加外键约束
    ALTER TABLE public.chat_rooms 
    ADD CONSTRAINT fk_chat_rooms_board
    FOREIGN KEY (board_id) 
    REFERENCES public.boards(id)
    ON DELETE SET NULL;
    
    RAISE NOTICE '已添加board_id列到chat_rooms表';
  END IF;
  
  -- 检查description列是否已存在
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'chat_rooms'
      AND column_name = 'description'
  ) THEN
    -- 添加description列
    ALTER TABLE public.chat_rooms ADD COLUMN description TEXT;
    RAISE NOTICE '已添加description列到chat_rooms表';
  END IF;
END
$$;

-- 确保RLS策略允许访问群聊
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'chat_rooms' 
    AND policyname = 'Board chat rooms are public'
  ) THEN
    CREATE POLICY "Board chat rooms are public" 
    ON public.chat_rooms FOR SELECT 
    USING (type = 'group' AND board_id IS NOT NULL);
    
    RAISE NOTICE '已创建群聊公开访问策略';
  END IF;
END
$$;
