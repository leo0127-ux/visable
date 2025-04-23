-- 创建美国公司数据存储表

-- 主要公司信息表
CREATE TABLE IF NOT EXISTS public.us_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  legal_name TEXT,
  ticker_symbol TEXT,
  website TEXT,
  logo_url TEXT,
  founded_year INTEGER,
  hq_address TEXT,
  hq_city TEXT,
  hq_state TEXT,
  hq_zip TEXT,
  industry TEXT,
  sector TEXT,
  description TEXT,
  employee_count INTEGER,
  is_public BOOLEAN DEFAULT FALSE,
  company_domain TEXT,
  linkedin_url TEXT,
  twitter_url TEXT,
  facebook_url TEXT,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 公司标签表
CREATE TABLE IF NOT EXISTS public.us_company_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.us_companies(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- API调用日志表
CREATE TABLE IF NOT EXISTS public.company_api_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_name TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  request_params JSONB,
  status_code INTEGER,
  response JSONB,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_us_companies_name ON public.us_companies(company_name);
CREATE INDEX IF NOT EXISTS idx_us_companies_domain ON public.us_companies(company_domain);
CREATE INDEX IF NOT EXISTS idx_us_companies_sector ON public.us_companies(sector);
CREATE INDEX IF NOT EXISTS idx_us_company_tags_company_id ON public.us_company_tags(company_id);
CREATE INDEX IF NOT EXISTS idx_us_company_tags_tag ON public.us_company_tags(tag);

-- 启用RLS
ALTER TABLE public.us_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.us_company_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_api_logs ENABLE ROW LEVEL SECURITY;

-- 添加RLS策略，使用DO块确保不会重复创建
DO $$
BEGIN
  -- 检查并创建公司数据查看策略
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'us_companies' 
    AND policyname = '允许所有用户查看公司数据'
  ) THEN
    CREATE POLICY "允许所有用户查看公司数据" 
      ON public.us_companies FOR SELECT USING (true);
    RAISE NOTICE '已创建 允许所有用户查看公司数据 策略';
  END IF;

  -- 检查并创建公司标签查看策略
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'us_company_tags' 
    AND policyname = '允许所有用户查看公司标签'
  ) THEN
    CREATE POLICY "允许所有用户查看公司标签" 
      ON public.us_company_tags FOR SELECT USING (true);
    RAISE NOTICE '已创建 允许所有用户查看公司标签 策略';
  END IF;

  -- 检查并创建管理员添加公司数据策略
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'us_companies' 
    AND policyname = '只允许管理员添加公司数据'
  ) THEN
    CREATE POLICY "只允许管理员添加公司数据" 
      ON public.us_companies FOR INSERT 
      WITH CHECK (auth.jwt() ? 'role' AND auth.jwt()->>'role' = 'admin');
    RAISE NOTICE '已创建 只允许管理员添加公司数据 策略';
  END IF;

  -- 检查并创建管理员修改公司数据策略
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'us_companies' 
    AND policyname = '只允许管理员修改公司数据'
  ) THEN
    CREATE POLICY "只允许管理员修改公司数据" 
      ON public.us_companies FOR UPDATE 
      USING (auth.jwt() ? 'role' AND auth.jwt()->>'role' = 'admin');
    RAISE NOTICE '已创建 只允许管理员修改公司数据 策略';
  END IF;

  -- 检查并创建管理员查看API日志策略
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'company_api_logs' 
    AND policyname = '只允许管理员查看API日志'
  ) THEN
    CREATE POLICY "只允许管理员查看API日志" 
      ON public.company_api_logs FOR SELECT 
      USING (auth.jwt() ? 'role' AND auth.jwt()->>'role' = 'admin');
    RAISE NOTICE '已创建 只允许管理员查看API日志 策略';
  END IF;

  -- 检查并创建管理员添加API日志策略
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'company_api_logs' 
    AND policyname = '只允许管理员添加API日志'
  ) THEN
    CREATE POLICY "只允许管理员添加API日志" 
      ON public.company_api_logs FOR INSERT 
      WITH CHECK (auth.jwt() ? 'role' AND auth.jwt()->>'role' = 'admin');
    RAISE NOTICE '已创建 只允许管理员添加API日志 策略';
  END IF;
END
$$;
