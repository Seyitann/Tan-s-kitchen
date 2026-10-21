-- Tan's Kitchen database tables.
-- Paste this whole file into Supabase: SQL Editor > New query > Run.

create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null unique,
  password_hash text not null,
  created_at timestamptz not null default now()
);

create table if not exists orders (
  id text primary key,
  customer_id uuid not null references customers (id),
  items jsonb not null,
  subtotal integer not null,
  delivery_fee integer not null,
  total integer not null,
  fulfilment text not null check (fulfilment in ('delivery', 'pickup')),
  address text not null default '',
  notes text not null default '',
  status text not null default 'received',
  notifications jsonb not null default '[]',
  payment_method text not null default 'on_delivery'
    check (payment_method in ('online', 'on_delivery')),
  payment_status text not null default 'unpaid'
    check (payment_status in ('unpaid', 'paid', 'failed')),
  payment_reference text,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists orders_payment_reference_idx on orders (payment_reference);

create index if not exists orders_customer_created_idx
  on orders (customer_id, created_at desc);

-- Row Level Security on, with no policies, means the public (browser) keys cannot
-- read or write these tables at all. Only the server, using the secret key, can.
alter table customers enable row level security;
alter table orders enable row level security;

-- ---------- The editable menu ----------
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
