-- 升级visa数据表结构以支持数据老化和性能优化

-- 为H1B批准数据表添加索引和数据老化支持
ALTER TABLE public.visa_h1b_approvals 
ADD COLUMN IF NOT EXISTS insertion_date TIMESTAMP WITH TIME ZONE DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_h1b_approvals_insertion_date ON public.visa_h1b_approvals(insertion_date);
CREATE INDEX IF NOT EXISTS idx_h1b_approvals_fiscal_year ON public.visa_h1b_approvals(fiscal_year);

-- 为H1B拒绝数据表添加索引和数据老化支持
ALTER TABLE public.visa_h1b_denials 
ADD COLUMN IF NOT EXISTS insertion_date TIMESTAMP WITH TIME ZONE DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_h1b_denials_insertion_date ON public.visa_h1b_denials(insertion_date);
CREATE INDEX IF NOT EXISTS idx_h1b_denials_fiscal_year ON public.visa_h1b_denials(fiscal_year);

-- 为H1B LCA数据表添加索引和数据老化支持
ALTER TABLE public.visa_h1b_lca 
ADD COLUMN IF NOT EXISTS insertion_date TIMESTAMP WITH TIME ZONE DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_h1b_lca_insertion_date ON public.visa_h1b_lca(insertion_date);
CREATE INDEX IF NOT EXISTS idx_h1b_lca_submission_date ON public.visa_h1b_lca(submission_date);

-- 为PERM数据表添加索引和数据老化支持
ALTER TABLE public.visa_perm 
ADD COLUMN IF NOT EXISTS insertion_date TIMESTAMP WITH TIME ZONE DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_perm_insertion_date ON public.visa_perm(insertion_date);
CREATE INDEX IF NOT EXISTS idx_perm_filing_date ON public.visa_perm(filing_date);

-- 为工资数据表添加索引和数据老化支持
ALTER TABLE public.visa_prevailing_wage 
ADD COLUMN IF NOT EXISTS insertion_date TIMESTAMP WITH TIME ZONE DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_prevailing_wage_insertion_date ON public.visa_prevailing_wage(insertion_date);

-- 创建函数获取平均工资
CREATE OR REPLACE FUNCTION public.get_avg_prevailing_wage()
RETURNS TABLE (avg_wage NUMERIC) AS $$
BEGIN
  RETURN QUERY
  SELECT AVG(prevailing_wage)::NUMERIC
  FROM public.visa_prevailing_wage
  WHERE prevailing_wage > 0;
END;
$$ LANGUAGE plpgsql;

-- 为元数据表添加字段以跟踪数据源版本
ALTER TABLE public.visa_data_metadata 
ADD COLUMN IF NOT EXISTS data_version TEXT,
ADD COLUMN IF NOT EXISTS source_url TEXT;

-- 创建一个数据清理函数
CREATE OR REPLACE FUNCTION public.cleanup_old_visa_data(years_to_keep INTEGER DEFAULT 10)
RETURNS TEXT AS $$
DECLARE
  cutoff_date TIMESTAMP;
  tables TEXT[] := ARRAY['visa_h1b_approvals', 'visa_h1b_denials', 'visa_h1b_lca', 'visa_perm', 'visa_prevailing_wage'];
  t TEXT;
  deleted_count INTEGER;
  total_deleted INTEGER := 0;
BEGIN
  -- 计算截止日期
  cutoff_date := (CURRENT_DATE - (years_to_keep * INTERVAL '1 year'))::TIMESTAMP;
  
  -- 遍历每个表执行删除
  FOREACH t IN ARRAY tables
  LOOP
    EXECUTE format('DELETE FROM public.%I WHERE created_at < $1', t) 
      USING cutoff_date;
      
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    total_deleted := total_deleted + deleted_count;
  END LOOP;
  
  RETURN 'Deleted ' || total_deleted || ' records older than ' || cutoff_date;
END;
$$ LANGUAGE plpgsql;
