-- 創建實用的視圖以方便前端查詢

-- 創建按州統計的雇主資料視圖
CREATE OR REPLACE VIEW public.visa_employer_by_state AS
SELECT 
  petitioner_state as state,
  COUNT(*) as company_count,
  SUM(initial_approval) as total_approvals,
  SUM(initial_denial) as total_denials,
  CASE 
    WHEN SUM(initial_approval + initial_denial) > 0 
    THEN ROUND((SUM(initial_approval)::numeric / SUM(initial_approval + initial_denial)) * 100, 2)
    ELSE 0
  END as approval_rate
FROM public.visa_h1b_employer_data
GROUP BY petitioner_state
ORDER BY company_count DESC;

-- 創建按行業統計的雇主資料視圖
CREATE OR REPLACE VIEW public.visa_employer_by_industry AS
SELECT 
  industry_code,
  COUNT(*) as company_count,
  SUM(initial_approval) as total_approvals,
  SUM(initial_denial) as total_denials,
  CASE 
    WHEN SUM(initial_approval + initial_denial) > 0 
    THEN ROUND((SUM(initial_approval)::numeric / SUM(initial_approval + initial_denial)) * 100, 2)
    ELSE 0
  END as approval_rate
FROM public.visa_h1b_employer_data
GROUP BY industry_code
ORDER BY company_count DESC;
