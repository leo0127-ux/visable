-- 創建 users 表
create table if not exists public.users (
  id uuid not null default gen_random_uuid(),
  email character varying(255) not null unique,
  password_hash character varying(255) null, -- 改為允許 null，因 Google 登入無密碼
  created_at timestamp without time zone not null default now(),
  updated_at timestamp without time zone not null default now(),
  vpoint integer not null default 0,
  constraint users_pkey primary key (id)
);

-- 修改 RLS 策略，確保表可以正確訪問
alter table public.users enable row level security;

create policy "Allow users to select their own data"
on public.users
for select
using (auth.uid() = id);

create policy "Allow users to update their own data"
on public.users
for update
using (auth.uid() = id);

-- 允許觸發器插入用戶數據
create policy "Allow system to insert user data"
on public.users
for insert
with check (true);

-- 創建 boards 表
create table if not exists public.boards (
  id uuid not null default gen_random_uuid(),
  name character varying(100) not null unique,
  description text null,
  created_at timestamp without time zone not null default now(),
  constraint boards_pkey primary key (id)
);

-- 創建 posts 表
create table if not exists public.posts (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  board_id uuid null,
  title character varying(200) not null,
  content text not null,
  is_anonymous boolean null default false,
  image_path text null,
  created_at timestamp without time zone null default now(),
  constraint posts_pkey primary key (id),
  constraint posts_board_id_fkey foreign key (board_id) references boards (id) on delete set null,
  constraint posts_user_id_fkey foreign key (user_id) references users (id) on delete cascade
);

-- 創建 career_insights 表
create table if not exists public.career_insights (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  type character varying(50) not null, -- "Salary" or "Interview"
  company_name character varying(100) not null,
  job_title character varying(100) not null,
  location character varying(100) null,
  base_salary numeric null,
  additional_compensation text null,
  bonus numeric null,
  stock_rsu numeric null,
  signing_bonus numeric null,
  job_type character varying(50) null, -- "Full-time", "Part-time", "Internship"
  visa_sponsorship boolean null,
  work_hours_per_week character varying(50) null,
  overtime_frequency character varying(50) null,
  benefits text null,
  job_satisfaction integer null check (job_satisfaction >= 1 and job_satisfaction <= 5),
  comments text null,
  interview_date date null,
  interview_outcome character varying(50) null, -- "Accepted", "Rejected", etc.
  interview_difficulty character varying(50) null, -- "Easy", "Medium", "Hard"
  number_of_rounds character varying(50) null,
  interview_process text null,
  technical_interview boolean null,
  behavioral_interview boolean null,
  case_study boolean null,
  interview_experience integer null check (interview_experience >= 1 and interview_experience <= 5),
  visa_sponsorship_asked boolean null,
  advice text null,
  image_path text null,
  created_at timestamp without time zone null default now(),
  constraint career_insights_pkey primary key (id),
  constraint career_insights_user_id_fkey foreign key (user_id) references users (id) on delete cascade
);

-- 請通過 Supabase 管理界面或 CLI 創建存儲桶 post-images

-- 設置存儲桶的公開訪問策略
create policy "Public access to post-images"
on storage.objects
for select
using (bucket_id = 'post-images');

-- 行級安全性 (RLS) 策略
-- 啟用 RLS
alter table public.posts enable row level security;
alter table public.career_insights enable row level security;
alter table public.boards enable row level security;

-- posts 表插入策略
create policy "Allow logged-in users to insert posts"
on public.posts
for insert
with check (auth.uid() = user_id);

-- career_insights 表插入策略
create policy "Allow logged-in users to insert career insights"
on public.career_insights
for insert
with check (auth.uid() = user_id);

-- Allow logged-in users to select posts
create policy "Allow logged-in users to select posts"
on public.posts
for select
using (auth.role() = 'authenticated');

-- Allow logged-in users to select boards
create policy "Allow logged-in users to select boards"
on public.boards
for select
using (auth.role() = 'authenticated');

-- 確保允許已登入用戶選取 posts
create policy "Allow logged-in users to select posts"
on public.posts
for select
using (auth.role() = 'authenticated');

-- 確保允許已登入用戶選取 boards
create policy "Allow logged-in users to select boards"
on public.boards
for select
using (auth.role() = 'authenticated');

-- 創建觸發器函數和觸發器
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, created_at, vpoint)
  values (new.id, new.email, now(), 0)
  on conflict (id) do update 
    set email = excluded.email,
        updated_at = now();
  return new;
end;
$$ language plpgsql security definer;

-- 先刪除可能存在的觸發器，然後創建新的觸發器
drop trigger if exists on_auth_user_created on auth.users;

-- 創建觸發器
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
