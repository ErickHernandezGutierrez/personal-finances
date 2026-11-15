import { useState } from 'react';

import { AppModal } from '@/components/modal';
import { TransactionForm, type TransactionFormSubmitPayload } from '@/components/transactions/transaction-form';
import type { Account, Category, Transaction } from '@/types/app';

type TransactionModalProps = {
  visible: boolean;
  /** The transaction to edit, or `null` to create a new one. */
  transaction: Transaction | null;
  accounts: Account[];
  categories: Category[];
  /** Persists the payload. Should throw on failure so the error is shown in the form. */
  onSubmit: (payload: TransactionFormSubmitPayload) => Promise<void>;
  onClose: () => void;
};

export function TransactionModal({
  visible,
  transaction,
  accounts,
  categories,
  onSubmit,
  onClose,
}: TransactionModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mode = transaction ? 'edit' : 'create';

  function handleClose() {
    setError(null);
    onClose();
  }

  async function handleSubmit(payload: TransactionFormSubmitPayload) {
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(payload);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppModal
      visible={visible}
      title={mode === 'edit' ? 'Edit Transaction' : 'New Transaction'}
      onClose={handleClose}>
      <TransactionForm
        mode={mode}
        transaction={transaction}
        accounts={accounts}
        categories={categories}
        submitting={submitting}
        error={error}
        onSubmit={handleSubmit}
        onCancel={handleClose}
      />
    </AppModal>
  );
}
