create table if not exists public.saved_jobs (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  job_id text not null,
  created_at timestamp without time zone not null default now(),
  constraint saved_jobs_pkey primary key (id),
  constraint saved_jobs_user_id_fkey foreign key (user_id) references public.users (id) on delete cascade,
  constraint saved_jobs_job_id_fkey foreign key (job_id) references public.jobs (job_id) on delete cascade
);
