-- Adds the editable menu. Paste into Supabase: SQL Editor > New query > Run.
-- Safe to run more than once.

create table if not exists menu_items (
  id text primary key,
  name text not null,
  description text not null default '',
  price integer not null check (price >= 0),
  category text not null,
  image text not null default '',
  ingredients jsonb not null default '[]',
  tags jsonb not null default '[]',
  available boolean not null default true,
  featured boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists settings (
  key text primary key,
  value jsonb not null
);

-- No policies: the public (browser) keys cannot touch these tables.
-- Customers see the menu through the website, which uses the secret key.
alter table menu_items enable row level security;
alter table settings enable row level security;

-- A public folder for dish photos. Anyone can look at the photos, but only the website can add them.
insert into storage.buckets (id, name, public)
values ('menu-images', 'menu-images', true)
on conflict (id) do nothing;
