-- 調整 RLS 策略，確保 Google 登入用戶可以創建帖子
drop policy if exists "Allow logged-in users to insert posts" on public.posts;

create policy "Allow logged-in users to insert posts"
on public.posts
for insert
with check (auth.role() = 'authenticated');

-- 確保 user_id 字段可以正常使用
alter table public.posts
drop constraint if exists posts_user_id_fkey;

alter table public.posts
add constraint posts_user_id_fkey
foreign key (user_id) references auth.users(id) on delete cascade;

-- 添加查詢權限
create policy "Allow users to view all posts"
on public.posts
for select
using (true);
