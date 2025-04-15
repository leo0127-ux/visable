-- 創建 H-1B 雇主資料表
CREATE TABLE IF NOT EXISTS visa_h1b_employer_data (
  id BIGSERIAL PRIMARY KEY,
  fiscal_year VARCHAR(4),
  employer_name TEXT,
  tax_id TEXT,
  industry_code TEXT,
  petitioner_city TEXT,
  petitioner_state VARCHAR(2),
  petitioner_zip TEXT,
  initial_approval INTEGER DEFAULT 0,
  initial_denial INTEGER DEFAULT 0,
  continuing_approval INTEGER DEFAULT 0,
  continuing_denial INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 創建索引以加速查詢
CREATE INDEX IF NOT EXISTS idx_h1b_employer_data_fiscal_year ON visa_h1b_employer_data(fiscal_year);
CREATE INDEX IF NOT EXISTS idx_h1b_employer_data_employer ON visa_h1b_employer_data(employer_name);
CREATE INDEX IF NOT EXISTS idx_h1b_employer_data_state ON visa_h1b_employer_data(petitioner_state);
CREATE INDEX IF NOT EXISTS idx_h1b_employer_data_industry ON visa_h1b_employer_data(industry_code);

-- 更新元數據表以跟踪數據更新
INSERT INTO visa_data_metadata (table_name, last_updated, record_count, status)
VALUES ('visa_h1b_employer_data', NOW(), 0, 'initialized')
ON CONFLICT (table_name) 
DO UPDATE SET 
  last_updated = NOW(),
  status = 'initialized';
