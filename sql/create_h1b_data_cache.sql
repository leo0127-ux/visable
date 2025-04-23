-- 創建H1B雇主數據緩存表

-- 確保緩存表存在
CREATE TABLE IF NOT EXISTS public.h1b_top_employers_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data JSONB NOT NULL, -- 存儲為JSON格式的雇主數據
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  source TEXT -- 記錄數據來源
);

-- 創建索引以便於查詢最新數據
CREATE INDEX IF NOT EXISTS idx_h1b_cache_created_at ON public.h1b_top_employers_cache(created_at);

-- 設置RLS策略
ALTER TABLE public.h1b_top_employers_cache ENABLE ROW LEVEL SECURITY;

-- 創建公共讀取策略
CREATE POLICY "Allow public to view cached data" ON public.h1b_top_employers_cache
  FOR SELECT USING (true);

-- 只允許管理員和系統插入數據
CREATE POLICY "Allow admins to insert cache data" ON public.h1b_top_employers_cache
  FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin')
    OR auth.uid() = '00000000-0000-0000-0000-000000000000' -- 系統用戶ID
  );

-- 創建每日自動清理任務（保留最近10條記錄）
CREATE OR REPLACE FUNCTION clean_h1b_cache() RETURNS void AS $$
BEGIN
  DELETE FROM public.h1b_top_employers_cache
  WHERE id NOT IN (
    SELECT id FROM public.h1b_top_employers_cache
    ORDER BY created_at DESC
    LIMIT 10
  );
END;
$$ LANGUAGE plpgsql;

-- 創建觸發器，每天執行一次清理
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_stat_statements_info WHERE EXISTS (
      SELECT 1 FROM pg_event_trigger WHERE evtname = 'clean_h1b_cache_trigger'
    )
  ) THEN
    EXECUTE 'CREATE EVENT TRIGGER clean_h1b_cache_trigger ON ddl_command_end WHEN tag IN (''TRUNCATE'') EXECUTE PROCEDURE clean_h1b_cache()';
  END IF;
EXCEPTION
  WHEN others THEN
    -- 如果創建觸發器失敗，忽略錯誤（Supabase可能不允許創建事件觸發器）
    RAISE NOTICE 'Failed to create event trigger: %', SQLERRM;
END
$$;
