create table if not exists public.jobs (
  id uuid not null default gen_random_uuid(),
  job_id text not null unique, -- Scraping Dog 提供的 job_id
  job_position text not null,
  job_link text not null,
  company_name text not null,
  company_profile text null,
  job_location text not null,
  job_posting_date date null,
  company_logo_url text null,
  created_at timestamp without time zone not null default now(),
  constraint jobs_pkey primary key (id)
);
