-- 创建或更新boards表

-- 检查表是否存在，如果不存在则创建
CREATE TABLE IF NOT EXISTS public.boards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 为boards表启用行级安全性
ALTER TABLE public.boards ENABLE ROW LEVEL SECURITY;

-- 删除现有策略以避免冲突
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'boards' AND schemaname = 'public'
  ) THEN
    DROP POLICY IF EXISTS "Allow users to view boards" ON public.boards;
    DROP POLICY IF EXISTS "Allow admins to manage boards" ON public.boards;
  END IF;
END
$$;

-- 创建公共访问策略 - 允许所有用户查看boards
CREATE POLICY "Allow users to view boards" 
ON public.boards 
FOR SELECT 
USING (true);

-- 创建管理员管理策略 - 只允许管理员创建和修改boards
CREATE POLICY "Allow admins to manage boards" 
ON public.boards 
FOR ALL
USING (
  auth.uid() IN (
    SELECT id FROM public.users WHERE role = 'admin'
  )
);

-- 创建示例boards数据（如果表为空）
INSERT INTO public.boards (name, description, created_at)
SELECT 
  'General Discussion', 
  'A place to discuss anything related to careers, work, and professional development.',
  now()
WHERE NOT EXISTS (SELECT 1 FROM public.boards LIMIT 1);

INSERT INTO public.boards (name, description, created_at)
SELECT 
  'Job Hunting Tips', 
  'Share and learn job search strategies, interview techniques, and resume advice.',
  now()
WHERE NOT EXISTS (SELECT 1 FROM public.boards WHERE name = 'Job Hunting Tips');

-- 确保创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_boards_created_at ON public.boards(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_boards_created_by ON public.boards(created_by);
