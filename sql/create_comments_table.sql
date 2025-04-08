-- Create comments table
create table if not exists public.comments (
  id uuid not null default gen_random_uuid(),
  post_id uuid not null,
  user_id uuid not null,
  content text not null,
  created_at timestamp without time zone not null default now(),
  constraint comments_pkey primary key (id),
  constraint comments_post_id_fkey foreign key (post_id) references public.posts (id) on delete cascade,
  constraint comments_user_id_fkey foreign key (user_id) references auth.users (id) on delete cascade
);

-- Enable Row Level Security
alter table public.comments enable row level security;

-- Allow anyone to view comments
create policy "Allow users to view all comments"
on public.comments
for select
using (true);

-- Allow authenticated users to create comments
create policy "Allow authenticated users to create comments"
on public.comments
for insert
with check (auth.role() = 'authenticated');

-- Allow users to delete their own comments
create policy "Allow users to delete their own comments"
on public.comments
for delete
using (auth.uid() = user_id);
