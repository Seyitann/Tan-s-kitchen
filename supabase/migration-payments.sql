-- Adds online payment to an orders table made with the first schema.sql.
-- Paste into Supabase: SQL Editor > New query > Run. Safe to run more than once.

alter table orders
  add column if not exists payment_method text not null default 'on_delivery'
    check (payment_method in ('online', 'on_delivery'));

alter table orders
  add column if not exists payment_status text not null default 'unpaid'
    check (payment_status in ('unpaid', 'paid', 'failed'));

alter table orders add column if not exists payment_reference text;
alter table orders add column if not exists paid_at timestamptz;

create index if not exists orders_payment_reference_idx on orders (payment_reference);
