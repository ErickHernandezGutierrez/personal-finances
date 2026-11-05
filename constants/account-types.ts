import type { AccountType } from '@/types/app'

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  checking: 'Checking',
  savings: 'Savings',
  investment: 'Investment',
  cash: 'Cash',
  credit_card: 'Credit Card',
}