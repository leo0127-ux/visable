create table if not exists public.boards (
  id uuid not null default gen_random_uuid(),
  name character varying(100) not null unique,
  description text null,
  created_at timestamp without time zone not null default now(),
  constraint boards_pkey primary key (id)
);
