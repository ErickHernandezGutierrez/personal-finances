-- ============================================================
-- Recurring transactions become finite plans
--
-- Recurring transactions now behave like installment plans: end_date is
-- required and every occurrence is created up front as a pending
-- transaction. next_date (lazy generation cursor) is no longer used.
--
-- transactions.recurring_id is renamed to recurring_transaction_id and
-- each linked row stores its 1-based occurrence_number within the plan.
-- The FK stays ON DELETE SET NULL: the app deletes pending rows before
-- deleting a plan, so paid rows are kept and simply unlinked.
--
-- No recurring transactions exist yet, so no data migration is needed.
-- ============================================================

alter table recurring_transactions drop column next_date;
alter table recurring_transactions alter column end_date set not null;
alter table recurring_transactions
  add constraint recurring_transactions_dates_chk check (end_date >= start_date);

alter table transactions rename column recurring_id to recurring_transaction_id;
alter table transactions rename constraint transactions_recurring_id_fkey
  to transactions_recurring_transaction_id_fkey;
alter table transactions add column occurrence_number int check (occurrence_number > 0);

create unique index transactions_recurring_occurrence_uq
  on transactions (recurring_transaction_id, occurrence_number)
  where recurring_transaction_id is not null;
