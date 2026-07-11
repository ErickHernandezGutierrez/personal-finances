-- ============================================================
-- Personal Finances — Initial Schema
-- Run this once in the Supabase SQL Editor.
-- ============================================================

create extension if not exists "pgcrypto";

-- ============================================================
-- accounts
-- ============================================================
create table accounts (
  id                uuid        primary key default gen_random_uuid(),
  user_id           uuid        not null references auth.users(id) on delete cascade,
  name              text        not null,
  type              text        not null
    check (type in ('checking', 'savings', 'investment', 'cash', 'credit_card')),
  currency          text        not null,
  initial_balance   numeric(15, 2) not null default 0,
  current_balance   numeric(15, 2) not null default 0,
  credit_limit      numeric(15, 2),
  billing_cycle_day int         check (billing_cycle_day between 1 and 31),
  payment_due_day   int         check (payment_due_day between 1 and 31),
  bank              text,
  color             text        not null default '#0a7ea4',
  is_active         boolean     not null default true
);

alter table accounts enable row level security;

create policy "accounts_own"
  on accounts for all
  using (auth.uid() = user_id);

-- ============================================================
-- categories
-- ============================================================
create table categories (
  id       uuid primary key default gen_random_uuid(),
  user_id  uuid not null references auth.users(id) on delete cascade,
  name     text not null
);

alter table categories enable row level security;

create policy "categories_own"
  on categories for all
  using (auth.uid() = user_id);

-- ============================================================
-- recurring_transactions
-- (declared before transactions because transactions.recurring_id references it)
-- ============================================================
create table recurring_transactions (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  type           text not null
    check (type in ('expense', 'income', 'transfer', 'credit_payment', 'withdrawal', 'investment')),
  amount         numeric(15, 2) not null,
  currency       text not null,
  description    text not null,
  account_id     uuid not null references accounts(id) on delete cascade,
  to_account_id  uuid references accounts(id) on delete set null,
  category_id    uuid references categories(id) on delete set null,
  frequency      text not null
    check (frequency in ('daily', 'weekly', 'biweekly', 'monthly', 'yearly')),
  start_date     date not null,
  end_date       date,
  next_date      date not null
);

alter table recurring_transactions enable row level security;

create policy "recurring_transactions_own"
  on recurring_transactions for all
  using (auth.uid() = user_id);

-- ============================================================
-- installment_plans
-- (declared before transactions because transactions.installment_plan_id references it)
-- ============================================================
create table installment_plans (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references auth.users(id) on delete cascade,
  description          text not null,
  total_amount         numeric(15, 2) not null,
  installment_amount   numeric(15, 2) not null,
  currency             text not null,
  num_installments     int  not null check (num_installments > 1),
  account_id           uuid not null references accounts(id) on delete cascade,
  category_id          uuid references categories(id) on delete set null,
  start_date           date not null
);

alter table installment_plans enable row level security;

create policy "installment_plans_own"
  on installment_plans for all
  using (auth.uid() = user_id);

-- ============================================================
-- transactions
-- ============================================================
create table transactions (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references auth.users(id) on delete cascade,
  type                 text not null
    check (type in ('expense', 'income', 'transfer', 'credit_payment', 'withdrawal', 'investment')),
  amount               numeric(15, 2) not null,
  currency             text not null,
  date                 date not null,
  description          text not null,
  is_paid              boolean not null default false,
  account_id           uuid not null references accounts(id) on delete cascade,
  to_account_id        uuid references accounts(id) on delete set null,
  category_id          uuid references categories(id) on delete set null,
  recurring_id         uuid references recurring_transactions(id) on delete set null,
  installment_plan_id  uuid references installment_plans(id) on delete cascade,
  installment_number   int
);

alter table transactions enable row level security;

create policy "transactions_own"
  on transactions for all
  using (auth.uid() = user_id);

-- ============================================================
-- money_exchanges
-- fx_rate is computed automatically from the inserted amounts.
-- Do NOT include fx_rate in INSERT statements.
-- ============================================================
create table money_exchanges (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  from_account_id   uuid not null references accounts(id) on delete cascade,
  to_account_id     uuid not null references accounts(id) on delete cascade,
  amount_sent       numeric(15, 2) not null,
  currency_sent     text not null,
  amount_received   numeric(15, 2) not null,
  currency_received text not null,
  fx_rate           numeric(20, 6)
    generated always as (amount_received / nullif(amount_sent, 0)) stored,
  date_sent         date not null,
  date_received     date not null,
  is_sent           boolean not null default false,
  is_received       boolean not null default false,
  description       text
);

alter table money_exchanges enable row level security;

create policy "money_exchanges_own"
  on money_exchanges for all
  using (auth.uid() = user_id);
