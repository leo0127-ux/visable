create table public.career_insights (
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
  created_at timestamp without time zone null default now(),
  constraint career_insights_pkey primary key (id),
  constraint career_insights_user_id_fkey foreign key (user_id) references users (id) on delete cascade
);
