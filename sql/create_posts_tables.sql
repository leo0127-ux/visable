-- 创建帖子相关表，确保所有通知系统依赖的表都存在

-- 确保posts表存在
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  board_id TEXT,
  type VARCHAR(50) DEFAULT 'text',
  media_urls TEXT[],
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 创建帖子点赞表 (被通知系统引用但不存在)
CREATE TABLE IF NOT EXISTS public.post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- 创建帖子评论表 (被通知系统引用但可能不存在)
CREATE TABLE IF NOT EXISTS public.post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES public.post_comments(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 创建职业洞察表 (被通知系统引用但可能不存在)
CREATE TABLE IF NOT EXISTS public.career_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author TEXT,
  author_title TEXT,
  published_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  category TEXT,
  tags TEXT[],
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 为所有表启用行级安全策略
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.career_insights ENABLE ROW LEVEL SECURITY;

-- 创建基本的RLS策略
CREATE POLICY "Public posts are viewable by everyone" ON public.posts
  FOR SELECT USING (true);

CREATE POLICY "Users can create posts" ON public.posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can like any post" ON public.post_likes
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can comment on any post" ON public.post_comments
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Career insights are viewable by everyone" ON public.career_insights
  FOR SELECT USING (true);

CREATE POLICY "Users can create career insights" ON public.career_insights
  FOR INSERT WITH CHECK (auth.uid() = user_id);
