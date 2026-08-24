-- ============================================================
-- Credit card balance sign flip
--
-- Credit cards previously stored current_balance/initial_balance as the
-- amount owed (positive = debt). They now use the same signed convention
-- as every other account: negative = you owe, positive = the card owes
-- you (overpaid). Negate the existing values once; the app's
-- recalculateBalance() will keep them correct going forward.
-- ============================================================

update accounts
set current_balance = -current_balance,
    initial_balance = -initial_balance
where type = 'credit_card';
