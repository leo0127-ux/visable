create table public.posts (
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
