-- 首先确保users表中有role列
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'user';

-- 将自己的账户更新为admin角色
-- 注意：将下面的YOUR_EMAIL@example.com替换为你的实际邮箱地址
UPDATE public.users 
SET role = 'admin' 
WHERE email = 'leowinmoney@gmail.com';

-- 确认更新是否成功
SELECT id, email, role FROM public.users WHERE role = 'admin';
