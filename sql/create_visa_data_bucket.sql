-- 創建用於存儲簽證數據 CSV 的 bucket

-- 直接插入 storage.buckets 表來創建 bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('visa_data_files', 'Visa Data Files', TRUE)
ON CONFLICT (id) DO NOTHING;

-- 檢查並創建政策，避免重複錯誤
DO $$
BEGIN
  -- 檢查管理員上傳文件政策是否存在
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage'
    AND policyname = 'Allow admins to upload visa data files'
  ) THEN
    -- 允許管理員上傳文件
    EXECUTE 'CREATE POLICY "Allow admins to upload visa data files"
    ON storage.objects
    FOR INSERT
    WITH CHECK (
      bucket_id = ''visa_data_files'' AND
      auth.uid() IN (SELECT id FROM public.users WHERE role = ''admin'')
    )';
  END IF;
  
  -- 檢查公共下載文件政策是否存在
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage'
    AND policyname = 'Allow public to download visa data files'
  ) THEN
    -- 允許所有人下載文件
    EXECUTE 'CREATE POLICY "Allow public to download visa data files"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = ''visa_data_files'')';
  END IF;
END
$$;
