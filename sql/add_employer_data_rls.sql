-- 為 H-1B 雇主資料表啟用行級安全策略

-- 啟用行級安全
ALTER TABLE public.visa_h1b_employer_data ENABLE ROW LEVEL SECURITY;

-- 創建允許所有用戶查看資料的策略
CREATE POLICY "Allow public to view employer data" 
ON public.visa_h1b_employer_data 
FOR SELECT USING (true);

-- 只允許管理員新增和修改資料
CREATE POLICY "Allow admins to modify employer data"
ON public.visa_h1b_employer_data
FOR ALL
USING (
  auth.uid() IN (
    SELECT id FROM public.users WHERE role = 'admin'
  )
);
