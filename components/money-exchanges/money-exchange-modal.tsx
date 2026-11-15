import { useState } from 'react';

import { MoneyExchangeForm, type MoneyExchangeFormSubmitPayload } from '@/components/money-exchanges/money-exchange-form';
import { AppModal } from '@/components/modal';
import type { Account, MoneyExchange } from '@/types/app';

type MoneyExchangeModalProps = {
  visible: boolean;
  /** The exchange to edit, or `null` to create a new one. */
  exchange: MoneyExchange | null;
  accounts: Account[];
  /** Persists the payload. Should throw on failure so the error is shown in the form. */
  onSubmit: (payload: MoneyExchangeFormSubmitPayload) => Promise<void>;
  onClose: () => void;
};

export function MoneyExchangeModal({
  visible,
  exchange,
  accounts,
  onSubmit,
  onClose,
}: MoneyExchangeModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mode = exchange ? 'edit' : 'create';

  function handleClose() {
    setError(null);
    onClose();
  }

  async function handleSubmit(payload: MoneyExchangeFormSubmitPayload) {
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
      title={mode === 'edit' ? 'Edit Money Exchange' : 'New Money Exchange'}
      onClose={handleClose}>
      <MoneyExchangeForm
        mode={mode}
        exchange={exchange}
        accounts={accounts}
        submitting={submitting}
        error={error}
        onSubmit={handleSubmit}
        onCancel={handleClose}
      />
    </AppModal>
  );
}
