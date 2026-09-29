-- MIO Bloggerlar boshqaruvi: production persistence schema
create extension if not exists pgcrypto;

create table if not exists public.bloggers (
  id text primary key,
  nickname text not null,
  date date not null,
  collaboration_type text not null check (collaboration_type in ('barter', 'paid')),
  brand text not null check (brand in ('mio_beauty', 'mio_home')),
  status text not null default 'pending' check (status in ('pending', 'completed')),
  manager text,
  history jsonb not null default '[]'::jsonb,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists bloggers_status_idx on public.bloggers(status);
create index if not exists bloggers_created_at_idx on public.bloggers(created_at desc);
create unique index if not exists bloggers_nickname_key_idx on public.bloggers(lower(regexp_replace(nickname, '^@+', '')));

alter table public.bloggers enable row level security;
-- The Express API uses the service-role key on the server, so no public client policy is needed.
-- Keep the table private; never expose SUPABASE_SERVICE_ROLE_KEY to the browser.
