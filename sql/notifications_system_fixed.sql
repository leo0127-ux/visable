-- 修复版本的通知系统，确保先验证所需的表是否存在

-- 确保用户表有 vpoint 列用于积分记录
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS vpoint INTEGER DEFAULT 0;

-- 创建通知表
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'like', 'comment', 'follow', 'points' 等类型
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  target_id TEXT, -- 相关的帖子、板块等ID
  avatar TEXT, -- 相关用户的头像
  link TEXT, -- 可选的链接
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 为通知表添加索引
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at);

-- 为通知表添加RLS策略
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 确保用户只能查看自己的通知
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'notifications' 
    AND policyname = 'Users can view their own notifications'
  ) THEN
    CREATE POLICY "Users can view their own notifications" ON public.notifications
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
END
$$;

-- 创建板块追踪表
CREATE TABLE IF NOT EXISTS public.board_followers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  board_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, board_id)
);

-- 为板块追踪表添加索引
CREATE INDEX IF NOT EXISTS idx_board_followers_user_id ON public.board_followers(user_id);
CREATE INDEX IF NOT EXISTS idx_board_followers_board_id ON public.board_followers(board_id);

-- 为板块追踪表添加RLS策略
ALTER TABLE public.board_followers ENABLE ROW LEVEL SECURITY;

-- 安全地创建RLS策略，避免已存在错误
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'board_followers' 
    AND policyname = 'Users can view their own follows'
  ) THEN
    CREATE POLICY "Users can view their own follows" ON public.board_followers
      FOR SELECT USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'board_followers' 
    AND policyname = 'Users can follow boards'
  ) THEN
    CREATE POLICY "Users can follow boards" ON public.board_followers
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'board_followers' 
    AND policyname = 'Users can unfollow boards'
  ) THEN
    CREATE POLICY "Users can unfollow boards" ON public.board_followers
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END
$$;

-- 创建触发器函数：用户注册时赠送3积分并创建通知
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  -- 添加初始积分
  UPDATE public.users
  SET vpoint = vpoint + 3
  WHERE id = NEW.id;
  
  -- 创建通知
  INSERT INTO public.notifications (
    user_id, 
    type, 
    title, 
    message,
    target_id,
    link
  ) VALUES (
    NEW.id,
    'points',
    '歡迎加入 Visable!',
    '恭喜您成功註冊，獲得 3 VPoints 獎勵!',
    NEW.id,
    '/account'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建用户注册后触发器
DROP TRIGGER IF EXISTS on_user_created ON public.users;
CREATE TRIGGER on_user_created
  AFTER INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 创建触发器函数：发布Career Insight后奖励3积分
CREATE OR REPLACE FUNCTION public.handle_new_career_insight() 
RETURNS TRIGGER AS $$
BEGIN
  -- 添加积分
  UPDATE public.users
  SET vpoint = vpoint + 3
  WHERE id = NEW.user_id;
  
  -- 创建通知
  INSERT INTO public.notifications (
    user_id, 
    type, 
    title, 
    message,
    target_id,
    link
  ) VALUES (
    NEW.user_id,
    'points',
    '分享獎勵',
    '感謝您分享職業洞察，獲得 3 VPoints 獎勵!',
    NEW.id,
    '/career'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 为Career Insights表添加触发器 (确保表存在再添加)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'career_insights'
  ) THEN
    DROP TRIGGER IF EXISTS on_career_insight_created ON public.career_insights;
    CREATE TRIGGER on_career_insight_created
      AFTER INSERT ON public.career_insights
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_new_career_insight();
  ELSE
    RAISE NOTICE '表 career_insights 不存在，跳过创建触发器';
  END IF;
END
$$;

-- 创建触发器函数：有人点赞或评论时创建通知
CREATE OR REPLACE FUNCTION public.handle_post_interaction() 
RETURNS TRIGGER AS $$
DECLARE
  post_author_id UUID;
  actor_name TEXT;
  post_title TEXT;
BEGIN
  -- 获取帖子作者ID和标题
  SELECT user_id, title INTO post_author_id, post_title FROM public.posts WHERE id = NEW.post_id;
  
  -- 不要给自己发通知
  IF post_author_id = NEW.user_id THEN
    RETURN NEW;
  END IF;
  
  -- 获取互动用户的名称
  SELECT full_name INTO actor_name FROM public.users WHERE id = NEW.user_id;
  
  -- 如果是空的，使用email前缀
  IF actor_name IS NULL THEN
    SELECT SPLIT_PART(email, '@', 1) INTO actor_name FROM auth.users WHERE id = NEW.user_id;
  END IF;
  
  -- 创建通知
  IF TG_TABLE_NAME = 'post_likes' THEN
    INSERT INTO public.notifications (
      user_id, 
      type, 
      title, 
      message,
      target_id,
      link
    ) VALUES (
      post_author_id,
      'like',
      '獲得新的讚',
      actor_name || ' 讚了您的帖子: ' || post_title,
      NEW.post_id,
      '/post/' || NEW.post_id
    );
  ELSIF TG_TABLE_NAME = 'post_comments' THEN
    INSERT INTO public.notifications (
      user_id, 
      type, 
      title, 
      message,
      target_id,
      link
    ) VALUES (
      post_author_id,
      'comment',
      '獲得新的評論',
      actor_name || ' 評論了您的帖子: ' || post_title,
      NEW.post_id,
      '/post/' || NEW.post_id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 安全地为点赞和评论表添加触发器
DO $$
BEGIN
  -- 检查点赞表是否存在
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'post_likes'
  ) THEN
    DROP TRIGGER IF EXISTS on_post_like_created ON public.post_likes;
    CREATE TRIGGER on_post_like_created
      AFTER INSERT ON public.post_likes
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_post_interaction();
  ELSE
    RAISE NOTICE '表 post_likes 不存在，跳过创建触发器';
  END IF;

  -- 检查评论表是否存在
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'post_comments'
  ) THEN
    DROP TRIGGER IF EXISTS on_post_comment_created ON public.post_comments;
    CREATE TRIGGER on_post_comment_created
      AFTER INSERT ON public.post_comments
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_post_interaction();
  ELSE
    RAISE NOTICE '表 post_comments 不存在，跳过创建触发器';
  END IF;
END
$$;

-- 创建触发器函数：追踪的板块有新帖子时创建通知
CREATE OR REPLACE FUNCTION public.handle_new_post_in_followed_board() 
RETURNS TRIGGER AS $$
DECLARE
  follower_record RECORD;
  board_name TEXT;
BEGIN
  -- 获取板块名称
  SELECT name INTO board_name FROM public.boards WHERE id = NEW.board_id;
  
  -- 为每个追踪者创建通知
  FOR follower_record IN 
    SELECT user_id FROM public.board_followers WHERE board_id = NEW.board_id
  LOOP
    -- 不要给作者自己发通知
    IF follower_record.user_id != NEW.user_id THEN
      INSERT INTO public.notifications (
        user_id, 
        type, 
        title, 
        message,
        target_id,
        link
      ) VALUES (
        follower_record.user_id,
        'follow',
        '您追蹤的板塊有新帖子',
        board_name || ' 板塊有新帖子: ' || NEW.title,
        NEW.id,
        '/post/' || NEW.id
      );
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 安全地为帖子表添加触发器
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'posts'
  ) THEN
    DROP TRIGGER IF EXISTS on_post_created_in_followed_board ON public.posts;
    CREATE TRIGGER on_post_created_in_followed_board
      AFTER INSERT ON public.posts
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_new_post_in_followed_board();
  ELSE
    RAISE NOTICE '表 posts 不存在，跳过创建触发器';
  END IF;
END
$$;
