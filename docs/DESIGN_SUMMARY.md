# Personal Finances — Design Summary

## 1. Overview

A personal finance tracking app for a single user, targeting **Android APK** and **Web (SPA)**. All data is stored in Supabase (Postgres) and requires an active internet connection. Each feature is scoped to the authenticated user via Row Level Security.

---

## 2. Technology Stack

| Layer | Technology |
|---|---|
| Framework | Expo SDK 54, Expo Router v6 |
| Language | TypeScript (strict mode) |
| Database | Supabase (Postgres on free tier) |
| Auth | Supabase Auth — email/password |
| Token storage (Android) | `expo-secure-store` v15 |
| Token storage (Web) | `localStorage` via `lib/storage.web.ts` |
| URL polyfill (RN) | `react-native-url-polyfill` |
| Web output mode | SPA (`"output": "single"`) — no SSR |

> **Why SPA and not static?** All content is behind auth and is user-specific, so server-side pre-rendering has no benefit. SPA mode also avoids the `localStorage is not defined` error that occurs when Expo pre-renders routes in a Node.js context during static build.

---

## 3. Data Schema

All tables have `user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE` and Row Level Security enabled with a single `FOR ALL` policy: `auth.uid() = user_id`.

### 3.1 `accounts`

Holds all financial accounts for a user.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | auto-generated |
| `user_id` | uuid FK | RLS anchor |
| `name` | text | display name |
| `type` | text | `checking \| savings \| investment \| cash \| credit_card` |
| `currency` | text | ISO 4217 code, e.g. `COP`, `USD` |
| `initial_balance` | numeric(15,2) | balance at the time tracking started |
| `current_balance` | numeric(15,2) | **denormalized**, kept in sync by `recalculateBalance()` |
| `credit_limit` | numeric(15,2)? | credit cards only |
| `billing_cycle_day` | int? | day of month (1–31), credit cards only |
| `payment_due_day` | int? | day of month (1–31), credit cards only |
| `bank` | text? | institution name |
| `color` | text | hex color for UI |
| `is_active` | boolean | false = archived; never hard-deleted |

**Credit card balance semantics:** `current_balance` uses the same signed convention as every other account — **negative = you owe that amount, positive = the card owes you** (e.g. after an overpayment). It starts at `initial_balance` (existing debt when tracking began, entered as a negative number) and moves further negative with charges, back toward/past zero with payments or refunds.

### 3.2 `categories`

Simple user-defined labels for transactions.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid FK | |
| `name` | text | |

### 3.3 `transactions`

The central ledger — every financial event recorded by the user.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid FK | |
| `type` | text | `expense \| income \| transfer \| credit_payment \| withdrawal \| investment` |
| `amount` | numeric(15,2) | always positive; direction implied by `type` |
| `currency` | text | |
| `date` | date | user-selected date of the event |
| `description` | text | |
| `is_paid` | boolean | `false` = scheduled/pending, `true` = confirmed in real account |
| `account_id` | uuid FK | source account (or the sole account for income/expense) |
| `to_account_id` | uuid FK? | destination account — transfers, credit payments, investments, withdrawals (bank account → cash account) |
| `category_id` | uuid FK? | |
| `recurring_transaction_id` | uuid FK? | set when part of a recurring plan; SET NULL on plan delete (paid rows are kept) |
| `occurrence_number` | int? | 1-based occurrence index within the recurring plan; unique per plan |
| `installment_plan_id` | uuid FK? | set when part of a cuotas plan; CASCADE DELETE |
| `installment_number` | int? | 1-based index within the plan |

**`is_paid` lifecycle:**
- Created as `false` → scheduled event (shows in forecast, does not affect balance)
- Toggled to `true` → `recalculateBalance()` runs and updates `account.current_balance`
- Toggled back to `false` → `recalculateBalance()` runs again, reversing the effect

### 3.4 `recurring_transactions`

Finite recurring plans. Like installment plans, every occurrence between `start_date` and `end_date` is created up front, but as a **pending** transaction (max 1,000 per plan).

**Sync rules** (`services/recurring-transactions.ts`), keyed by `transactions.occurrence_number`:
- Occurrence `n` is dated `start_date + (n-1) × frequency`, computed from the start (month-end clamped: Jan 31 → Feb 28 → Mar 31) by `lib/recurrence.ts`.
- **End date reduced** → pending occurrences past the new end are deleted; paid ones stay.
- **End date extended** → missing occurrences are created as pending.
- **Template fields edited** (type, amount, currency, description, accounts, category) → only the changed fields are copied to pending transactions.
- **Start date / frequency edited** → pending transactions are re-dated from their occurrence number.
- **Plan deleted** → pending transactions are deleted, paid ones are kept and unlinked.
- **Editing a single transaction** affects only that transaction. Paid transactions are never modified by plan changes, so no balance recalculation is needed.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid FK | |
| `type` | text | same enum as transactions |
| `amount` | numeric(15,2) | |
| `currency` | text | |
| `description` | text | |
| `account_id` | uuid FK | |
| `to_account_id` | uuid FK? | |
| `category_id` | uuid FK? | |
| `frequency` | text | `daily \| weekly \| biweekly \| monthly \| yearly` |
| `start_date` | date | |
| `end_date` | date | required; `>= start_date` |

### 3.5 `installment_plans`

"Cuotas sin interés" — a purchase split into N equal monthly charges.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid FK | |
| `description` | text | e.g. "iPhone 16" |
| `total_amount` | numeric(15,2) | |
| `installment_amount` | numeric(15,2) | `total_amount / num_installments` |
| `currency` | text | |
| `num_installments` | int | CHECK > 1 |
| `account_id` | uuid FK | the credit card being charged |
| `category_id` | uuid FK? | |
| `start_date` | date | date of first installment |

On creation, `createInstallmentPlan()` immediately inserts `num_installments` transaction rows, dated monthly from `start_date` with month-end clamping (Jan 31 → Feb 28 → Mar 31, via `lib/recurrence.ts`), all with `is_paid = true`, then recalculates the account balance. Deleting the plan cascades to all its transaction rows and recalculates the balance again.

### 3.6 `money_exchanges`

Foreign exchange events between two accounts in different currencies.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid FK | |
| `from_account_id` | uuid FK | account that sends |
| `to_account_id` | uuid FK | account that receives |
| `amount_sent` | numeric(15,2) | |
| `currency_sent` | text | |
| `amount_received` | numeric(15,2) | |
| `currency_received` | text | |
| `fx_rate` | numeric(20,6) | **generated column**: `amount_received / NULLIF(amount_sent, 0)` — never writable |
| `date_sent` | date | |
| `date_received` | date | may differ from `date_sent` |
| `is_sent` | boolean | true = `from_account` balance has been debited |
| `is_received` | boolean | true = `to_account` balance has been credited |
| `description` | text? | |

`fx_rate` is a Postgres `GENERATED ALWAYS AS ... STORED` column. It is computed from the inserted amounts and cannot be written by the application. The TypeScript `ExchangeInsert` / `ExchangeUpdate` types explicitly omit it to prevent accidental writes.

---

## 4. Account Balance Recalculation

### 4.1 Why denormalize `current_balance`?

Querying the full transaction history to derive a live balance on every render would be slow and require multiple round-trips. Instead, `current_balance` is stored and kept in sync by the service layer after every mutation that affects a paid balance.

### 4.2 The `recalculateBalance(accountId)` function

Located in `services/accounts.ts`. Called automatically by the transactions and money-exchanges services after any create / update / delete that may affect a balance.

**Algorithm:**

The same formula applies to every account type, including credit cards — there is no
per-type branching. A credit card's `expense` charges push its balance further negative
(more owed); a `credit_payment` or `income` (refund) received by it push the balance back
up (less owed, or positive if overpaid).

```
balance = account.initial_balance

For each paid transaction involving this account:
  income   (account_id = this)  → balance += amount
  expense  (account_id = this)  → balance -= amount
  withdrawal (account_id = this) → balance -= amount  // outgoing, from the bank account
  withdrawal (to_account_id = this) → balance += amount // incoming, into the cash account
  transfer (account_id = this)  → balance -= amount   // outgoing
  transfer (to_account_id = this) → balance += amount // incoming
  credit_payment (account_id = this) → balance -= amount // paying from this account
  credit_payment (to_account_id = this) → balance += amount // received by this account (e.g. a credit card)
  investment (account_id = this) → balance -= amount  // outgoing
  investment (to_account_id = this) → balance += amount // incoming

For each money exchange involving this account:
  is_sent     AND from_account_id = this → balance -= amount_sent
  is_received AND to_account_id = this   → balance += amount_received

UPDATE accounts SET current_balance = balance WHERE id = accountId
```

**When it is called:**

| Event | Accounts recalculated |
|---|---|
| `createTransaction` with `is_paid = true` | `account_id`, `to_account_id` |
| `updateTransaction` (any field) | all accounts that appear in the before or after snapshot |
| `deleteTransaction` with `is_paid = true` | `account_id`, `to_account_id` |
| `createMoneyExchange` with `is_sent` or `is_received` | `from_account_id`, `to_account_id` |
| `updateMoneyExchange` | all accounts in before + after snapshot |
| `deleteMoneyExchange` with `is_sent` or `is_received` | the affected side(s) |

> **Installment plans:** transactions are created with `is_paid = true`, so the full purchase amount hits the account balance at plan creation (`createInstallmentPlan` calls `recalculateBalance`). Deleting a plan also recalculates, since the cascade removes paid rows.

### 4.3 Correctness guarantees

- Recalculation is a full recompute from `initial_balance`, not an incremental delta. This means the result is always correct regardless of edit order, and there is no accumulated floating-point drift from repeated additions/subtractions.
- `Promise.all()` is used to recalculate multiple affected accounts concurrently.
- RLS ensures only the authenticated user's own transactions and exchanges are included in the query.

---

## 5. Service Layer

Each service file in `services/` exports plain async functions. No classes. Errors are thrown (not returned), so callers use try/catch.

| File | Responsibilities |
|---|---|
| `services/accounts.ts` | CRUD for accounts, `deactivateAccount`, `recalculateBalance` |
| `services/categories.ts` | CRUD for categories |
| `services/transactions.ts` | CRUD for transactions, balance trigger after mutations |
| `services/installment-plans.ts` | Plan CRUD + auto-generate N transaction rows on create |
| `services/recurring-transactions.ts` | Plan CRUD; creates all pending occurrences on create and syncs them on update/delete |
| `services/money-exchanges.ts` | Exchange CRUD, `fx_rate` omitted from all writes |

**`getUserId()`** — shared helper exported from `lib/supabase.ts`. Reads the cached session (no network call) and returns `user.id`. All insert operations call this to set `user_id`; selects/updates rely on RLS to filter automatically.

---

## 6. Navigation Structure

```
app/
  _layout.tsx               Root: ThemeProvider → AuthProvider → Stack
  (auth)/
    _layout.tsx             Redirects to /(tabs) if session exists
    sign-in.tsx
    sign-up.tsx
  (tabs)/
    _layout.tsx             Redirects to /(auth)/sign-in if no session; 4-tab layout
    index.tsx               Dashboard
    accounts/
      _layout.tsx           Stack
      index.tsx             Account list + create/edit modal
    transactions/
      _layout.tsx           Stack
      index.tsx             Merged transaction + money-exchange feed, single create/edit modal
    more/
      _layout.tsx           Stack
      index.tsx             Menu → categories, recurring, installments
      categories.tsx
      recurring.tsx
      installments.tsx
```

**Money exchanges live in the Transactions tab, not a separate page.** `money_exchanges` is a
distinct table from `transactions` (two amounts, two currencies, two dates, two paid-flags), but
the Transactions screen fetches both and merges them into one date-sorted feed. Creating one:
picking "Money Exchange" as the `type` in the transaction modal swaps the form body for
`MoneyExchangeForm` (`components/money-exchanges/money-exchange-form.tsx`) instead of adding it to
the `TransactionType` enum. Editing/deleting an existing row dispatches to the transactions or
money-exchanges service depending on which table it came from. Since money exchanges have no
`category_id`, filtering the screen by a specific category naturally excludes them from the feed.

**Auth redirect pattern:**
- `session === undefined` → loading state (render `null`, show nothing)
- `session === null` → not authenticated → `<Redirect href="/(auth)/sign-in" />`
- `session !== null` → authenticated → render tabs normally

No `useEffect`/`router.replace` — uses `<Redirect>` component which is synchronous and avoids layout flash.

---

## 7. Platform-Specific Storage

Supabase requires a custom `storage` adapter for session persistence on React Native (no `localStorage` in Hermes). Metro's platform file resolution is used to avoid any `Platform.OS` checks:

| File | Resolved on | Implementation |
|---|---|---|
| `lib/storage.ts` | Android | `expo-secure-store` (Android Keystore, no size limit) |
| `lib/storage.web.ts` | Web | `localStorage` with `typeof` guard for SSR safety |

`lib/supabase.ts` imports from `'./storage'` — Metro picks the right file automatically.

---

## 8. Multi-Currency

All monetary tables store a `currency text` column alongside `amount`. The app does not perform automatic currency conversion for net worth calculations — each account shows its native currency balance. `money_exchanges` handles explicit FX events between accounts and stores the historical `fx_rate` as a generated column for reference.

---

## 9. Type Generation

TypeScript types are generated from the live Supabase schema:

```bash
npx supabase gen types typescript --project-id <project-id> --schema public > types/database.ts
```

Re-run this after any schema migration. The generated `Database` type is passed as a generic to `createClient<Database>()`, giving full type inference on every `.from()` query. `types/app.ts` re-exports clean aliases (`Account`, `TransactionInsert`, etc.) — application code imports from there, never directly from `types/database.ts`.
