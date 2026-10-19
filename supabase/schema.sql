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
