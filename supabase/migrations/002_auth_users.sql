-- MIO auth users: credentials are stored as scrypt hashes, never plaintext passwords.
create table if not exists public.app_users (
  username text primary key,
  role text not null check (role in ('admin', 'viewer')),
  password_hash text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.app_users enable row level security;
-- Only the server's service-role client may read this table.
