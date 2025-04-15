-- 確保元數據表包含雇主資料表的記錄

-- 更新元數據表以跟踪雇主資料更新
INSERT INTO visa_data_metadata (table_name, last_updated, record_count, status)
VALUES ('visa_h1b_employer_data', NOW(), 0, 'initialized')
ON CONFLICT (table_name) 
DO UPDATE SET 
  last_updated = NOW(),
  status = 'initialized';
