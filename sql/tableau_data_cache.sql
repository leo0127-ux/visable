-- 創建存儲Tableau數據的表格
CREATE TABLE IF NOT EXISTS public.tableau_data_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL, -- 'summary', 'employers', 'industries', 'geography', 'salaries'
  filter_hash TEXT, -- 存儲過濾條件的哈希值，用於快速查找
  data JSONB NOT NULL, -- 存儲從Tableau獲取的數據
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '1 day')
);

-- 索引以加速查詢
CREATE INDEX IF NOT EXISTS idx_tableau_data_cache_category ON public.tableau_data_cache (category);
CREATE INDEX IF NOT EXISTS idx_tableau_data_cache_filter_hash ON public.tableau_data_cache (filter_hash);
CREATE INDEX IF NOT EXISTS idx_tableau_data_cache_expires_at ON public.tableau_data_cache (expires_at);

-- RLS 策略
ALTER TABLE public.tableau_data_cache ENABLE ROW LEVEL SECURITY;

-- 先創建函數以檢查是否為服務角色 (BEFORE policies that use it)
CREATE OR REPLACE FUNCTION is_service()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN current_setting('request.jwt.claims', true)::jsonb->>'role' = 'service_role';
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$;

-- 創建函數以檢查是否為管理員 (BEFORE policies that use it)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$;

-- 允許任何人讀取緩存數據
CREATE POLICY "Allow anyone to select tableau data cache" 
ON public.tableau_data_cache FOR SELECT USING (true);

-- 只允許服務角色和管理員寫入緩存數據 (修正版本)
DROP POLICY IF EXISTS "Allow service role to insert tableau data cache" ON public.tableau_data_cache;

CREATE POLICY "Allow service role to insert tableau data cache"
ON public.tableau_data_cache FOR INSERT
WITH CHECK (
  (SELECT is_service() OR (SELECT is_admin()))
);

-- 函數：獲取緩存數據或將其標記為過期
CREATE OR REPLACE FUNCTION get_tableau_cache(p_category TEXT, p_filter_hash TEXT DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_data JSONB;
BEGIN
  -- 嘗試獲取非過期的緩存數據
  SELECT data INTO v_data
  FROM public.tableau_data_cache
  WHERE category = p_category
    AND (filter_hash = p_filter_hash OR p_filter_hash IS NULL)
    AND expires_at > now()
  ORDER BY updated_at DESC
  LIMIT 1;
  
  -- 如果找到數據，返回
  IF v_data IS NOT NULL THEN
    RETURN v_data;
  END IF;
  
  -- 沒有找到數據，返回空JSON
  RETURN '{}';
END;
$$;
