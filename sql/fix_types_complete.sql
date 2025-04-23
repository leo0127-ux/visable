-- 全面修复数据类型不匹配问题

-- 修复board_followers表中的board_id类型
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'board_followers'
      AND column_name = 'board_id'
      AND data_type = 'text'
  ) THEN
    -- 仅当board_id是text类型时执行转换
    BEGIN
      -- 创建临时UUID列
      ALTER TABLE public.board_followers ADD COLUMN board_id_uuid UUID;
      
      -- 转换有效的UUID值
      UPDATE public.board_followers
      SET board_id_uuid = board_id::uuid
      WHERE board_id IS NOT NULL 
        AND board_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
      
      -- 删除原始列并重命名新列
      ALTER TABLE public.board_followers DROP COLUMN board_id;
      ALTER TABLE public.board_followers RENAME COLUMN board_id_uuid TO board_id;
      
      -- 添加外键约束
      ALTER TABLE public.board_followers 
      ADD CONSTRAINT fk_board_followers_board_id
      FOREIGN KEY (board_id) REFERENCES public.boards(id) ON DELETE CASCADE;
      
      RAISE NOTICE 'board_followers表的board_id已从TEXT转换为UUID';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'board_followers表转换失败: %', SQLERRM;
    END;
  END IF;
  
  -- 修复posts表中的board_id类型
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'posts'
      AND column_name = 'board_id'
      AND data_type = 'text'
  ) THEN
    BEGIN
      -- 创建临时UUID列
      ALTER TABLE public.posts ADD COLUMN board_id_uuid UUID;
      
      -- 转换有效的UUID值
      UPDATE public.posts
      SET board_id_uuid = board_id::uuid
      WHERE board_id IS NOT NULL 
        AND board_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
      
      -- 删除原始列并重命名新列
      ALTER TABLE public.posts DROP COLUMN board_id;
      ALTER TABLE public.posts RENAME COLUMN board_id_uuid TO board_id;
      
      -- 添加外键约束
      ALTER TABLE public.posts 
      ADD CONSTRAINT fk_posts_board_id
      FOREIGN KEY (board_id) REFERENCES public.boards(id) ON DELETE SET NULL;
      
      RAISE NOTICE 'posts表的board_id已从TEXT转换为UUID';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'posts表转换失败: %', SQLERRM;
    END;
  END IF;
  
  -- 修复chat_rooms表中的board_id类型
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'chat_rooms'
      AND column_name = 'board_id'
      AND data_type = 'text'
  ) THEN
    BEGIN
      -- 创建临时UUID列
      ALTER TABLE public.chat_rooms ADD COLUMN board_id_uuid UUID;
      
      -- 转换有效的UUID值
      UPDATE public.chat_rooms
      SET board_id_uuid = board_id::uuid
      WHERE board_id IS NOT NULL 
        AND board_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
      
      -- 删除原始列并重命名新列
      ALTER TABLE public.chat_rooms DROP COLUMN board_id;
      ALTER TABLE public.chat_rooms RENAME COLUMN board_id_uuid TO board_id;
      
      -- 添加外键约束
      ALTER TABLE public.chat_rooms 
      ADD CONSTRAINT fk_chat_rooms_board_id
      FOREIGN KEY (board_id) REFERENCES public.boards(id) ON DELETE SET NULL;
      
      RAISE NOTICE 'chat_rooms表的board_id已从TEXT转换为UUID';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'chat_rooms表转换失败: %', SQLERRM;
    END;
  END IF;
  
  -- 修复任何其他类型不匹配的列
  -- 处理chat_participants表中的user_email缺失问题
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'chat_participants'
      AND column_name = 'user_email'
  ) THEN
    BEGIN
      ALTER TABLE public.chat_participants ADD COLUMN user_email TEXT;
      
      -- 从auth.users中填充email数据
      UPDATE public.chat_participants cp
      SET user_email = u.email
      FROM auth.users u
      WHERE cp.user_id = u.id
      AND cp.user_email IS NULL;
      
      RAISE NOTICE '已添加user_email列到chat_participants表';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE '添加user_email列失败: %', SQLERRM;
    END;
  END IF;
END
$$;

-- 创建必要的索引以优化性能
CREATE INDEX IF NOT EXISTS idx_board_followers_board_id ON public.board_followers(board_id);
CREATE INDEX IF NOT EXISTS idx_posts_board_id ON public.posts(board_id);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_board_id ON public.chat_rooms(board_id);
CREATE INDEX IF NOT EXISTS idx_chat_participants_chat_room_id ON public.chat_participants(chat_room_id);
CREATE INDEX IF NOT EXISTS idx_chat_participants_user_id ON public.chat_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_chat_room_id ON public.chat_messages(chat_room_id);

-- 确保所有表都启用了RLS
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.board_followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
