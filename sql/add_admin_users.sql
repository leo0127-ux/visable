-- Add admin role to specified users
UPDATE public.users 
SET role = 'admin' 
WHERE email IN ('admin@example.com', 'your-email@example.com');

-- Check admin users
SELECT id, email, role 
FROM public.users 
WHERE role = 'admin';
