-- 创建帖子交互表 (点赞和评论)
-- 这些表被通知系统触发器引用，但目前在数据库中缺失

-- 创建帖子点赞表
CREATE TABLE IF NOT EXISTS public.post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(post_id, user_id) -- 一个用户只能给一个帖子点一次赞
);

-- 创建帖子评论表
CREATE TABLE IF NOT EXISTS public.post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES public.post_comments(id) ON DELETE CASCADE, -- 支持嵌套评论
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 为帖子交互表添加索引
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON public.post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON public.post_likes(user_id);

CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON public.post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_user_id ON public.post_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_parent_id ON public.post_comments(parent_id);

-- 启用行级安全策略
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

-- 为点赞表创建RLS策略
CREATE POLICY "Users can see all post likes" ON public.post_likes
  FOR SELECT USING (true);

CREATE POLICY "Users can like posts" ON public.post_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own likes" ON public.post_likes
  FOR DELETE USING (auth.uid() = user_id);

-- 为评论表创建RLS策略
CREATE POLICY "Users can see all post comments" ON public.post_comments
  FOR SELECT USING (true);

CREATE POLICY "Users can comment on posts" ON public.post_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments" ON public.post_comments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" ON public.post_comments
  FOR DELETE USING (auth.uid() = user_id);

-- 创建更新posts表中评论和点赞计数的函数
CREATE OR REPLACE FUNCTION update_post_counters()
RETURNS TRIGGER AS $$
BEGIN
  -- 更新点赞数量
  IF (TG_OP = 'INSERT' AND TG_TABLE_NAME = 'post_likes') THEN
    UPDATE public.posts
    SET like_count = (SELECT COUNT(*) FROM public.post_likes WHERE post_id = NEW.post_id)
    WHERE id = NEW.post_id;
  END IF;
  
  -- 更新评论数量
  IF (TG_OP = 'INSERT' AND TG_TABLE_NAME = 'post_comments') THEN
    UPDATE public.posts
    SET comment_count = (SELECT COUNT(*) FROM public.post_comments WHERE post_id = NEW.post_id)
    WHERE id = NEW.post_id;
  END IF;
  
  -- 删除点赞时也更新计数
  IF (TG_OP = 'DELETE' AND TG_TABLE_NAME = 'post_likes') THEN
    UPDATE public.posts
    SET like_count = (SELECT COUNT(*) FROM public.post_likes WHERE post_id = OLD.post_id)
    WHERE id = OLD.post_id;
  END IF;
  
  -- 删除评论时也更新计数
  IF (TG_OP = 'DELETE' AND TG_TABLE_NAME = 'post_comments') THEN
    UPDATE public.posts
    SET comment_count = (SELECT COUNT(*) FROM public.post_comments WHERE post_id = OLD.post_id)
    WHERE id = OLD.post_id;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 为点赞和评论表创建触发器以更新计数
CREATE TRIGGER update_post_like_count
  AFTER INSERT OR DELETE ON public.post_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_post_counters();

CREATE TRIGGER update_post_comment_count
  AFTER INSERT OR DELETE ON public.post_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_post_counters();

-- 确保posts表有like_count和comment_count列
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'posts' 
    AND column_name = 'like_count'
  ) THEN
    ALTER TABLE public.posts ADD COLUMN like_count INTEGER DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'posts' 
    AND column_name = 'comment_count'
  ) THEN
    ALTER TABLE public.posts ADD COLUMN comment_count INTEGER DEFAULT 0;
  END IF;
END
$$;
