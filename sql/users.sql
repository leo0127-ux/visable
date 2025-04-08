create table if not exists public.users (
  id uuid not null default gen_random_uuid(),
  email text not null unique,
  password_hash text null, -- Google 登錄不需要密碼
  created_at timestamp without time zone not null default now(),
  updated_at timestamp without time zone not null default now(),
  vpoint integer not null default 0, -- 新增 Vpoint 欄位
  constraint users_pkey primary key (id)
);

-- 測試插入用戶數據
insert into public.users (email, vpoint)
values
  ('test@example.com', 0)
on conflict (email) do nothing;