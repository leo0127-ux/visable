-- 创建H1B雇主数据存储表

-- 创建主表 - 用于存储雇主数据
CREATE TABLE IF NOT EXISTS public.h1b_employer_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_name TEXT NOT NULL,
  fiscal_year TEXT NOT NULL,
  total_petitions INTEGER NOT NULL DEFAULT 0,
  approved_petitions INTEGER NOT NULL DEFAULT 0,
  denied_petitions INTEGER NOT NULL DEFAULT 0,
  approval_rate NUMERIC(5,1) NOT NULL DEFAULT 0,
  data_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(employer_name, fiscal_year)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_h1b_employer_data_employer_name ON public.h1b_employer_data(employer_name);
CREATE INDEX IF NOT EXISTS idx_h1b_employer_data_fiscal_year ON public.h1b_employer_data(fiscal_year);
CREATE INDEX IF NOT EXISTS idx_h1b_employer_data_total ON public.h1b_employer_data(total_petitions DESC);

-- 启用RLS
ALTER TABLE public.h1b_employer_data ENABLE ROW LEVEL SECURITY;

-- 创建公共访问策略 - 允许所有用户查看数据
DO $$
BEGIN
  -- Check if the policy already exists
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE tablename = 'h1b_employer_data'
    AND policyname = 'Allow public to view employer data'
  ) THEN
    -- Create the policy only if it doesn't exist
    EXECUTE 'CREATE POLICY "Allow public to view employer data" ON public.h1b_employer_data FOR SELECT USING (true)';
  END IF;
END
$$;

-- 创建管理员更新策略 - 只允许管理员更新数据
DO $$
BEGIN
  -- Check if the policy already exists
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE tablename = 'h1b_employer_data'
    AND policyname = 'Allow admins to update employer data'
  ) THEN
    -- Create the policy only if it doesn't exist
    EXECUTE 'CREATE POLICY "Allow admins to update employer data" ON public.h1b_employer_data FOR ALL USING (auth.uid() IN (SELECT id FROM public.users WHERE role = ''admin''))';
  END IF;
END
$$;
