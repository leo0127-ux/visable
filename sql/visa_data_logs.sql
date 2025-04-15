-- 创建日志表以跟踪签证数据抓取和处理过程
CREATE TABLE IF NOT EXISTS public.visa_data_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message TEXT NOT NULL,
    is_error BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 添加适当的索引以加速查询
CREATE INDEX IF NOT EXISTS idx_visa_data_logs_created_at ON public.visa_data_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_visa_data_logs_is_error ON public.visa_data_logs(is_error);

-- 日志表的RLS策略 - 只有管理员可以写入和查看
ALTER TABLE public.visa_data_logs ENABLE ROW LEVEL SECURITY;

-- 允许函数服务角色写入日志
CREATE POLICY "Allow service role to insert logs" 
ON public.visa_data_logs FOR INSERT 
WITH CHECK (true);

-- 首先添加角色列到用户表（如果不存在）
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'user';

-- 将现有的管理员账户更新为管理员角色（如果需要）
-- 请将'your-admin-email@example.com'替换为实际管理员的电子邮件
UPDATE public.users SET role = 'admin' WHERE email = 'your-admin-email@example.com';

-- 允许管理员查看日志
CREATE POLICY "Allow admins to view logs" 
ON public.visa_data_logs FOR SELECT 
USING (auth.uid() IN (
    SELECT id FROM public.users WHERE role = 'admin'
));

-- 先删除现有函数，然后重新创建
DROP FUNCTION IF EXISTS public.get_avg_prevailing_wage();

-- 创建函数以获取平均薪资
CREATE OR REPLACE FUNCTION public.get_avg_prevailing_wage()
RETURNS NUMERIC AS $$
DECLARE
    avg_wage NUMERIC;
BEGIN
    SELECT AVG(prevailing_wage) INTO avg_wage
    FROM public.visa_prevailing_wage
    WHERE prevailing_wage > 0;
    
    RETURN avg_wage;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
