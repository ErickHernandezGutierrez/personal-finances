import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SearchField } from '@/components/forms/search-field';
import { SelectField, type SelectOption } from '@/components/forms/select-field';
import { MoneyExchangeList } from '@/components/money-exchanges/money-exchange-list';
import {
  RecurringTransactionList,
  type RecurringTransactionFilters,
} from '@/components/recurring-transactions/recurring-transaction-list';
import { DateRangeFilter } from '@/components/transactions/date-range-filter';
import { ListTabs, type ListTab } from '@/components/transactions/list-tabs';
import { TransactionList } from '@/components/transactions/transaction-list';
import { useTheme } from '@/contexts/theme-context';
import { useAccounts } from '@/hooks/use-accounts';
import { useCategories } from '@/hooks/use-categories';
import { presetRange, type DateRange } from '@/lib/date-range';
import type { MoneyExchangeFilters } from '@/services/money-exchanges';
import type { TransactionFilters } from '@/services/transactions';

const ALL_ACCOUNTS = '__all_accounts__';
const ALL_CATEGORIES = '__all_categories__';

export default function TransactionsScreen() {
  const { theme } = useTheme();
  const [tab, setTab] = useState<ListTab>('transactions');
  const [dateRange, setDateRange] = useState<DateRange>(() => presetRange('this_month'));
  const [accountFilter, setAccountFilter] = useState(ALL_ACCOUNTS);
  const [categoryFilter, setCategoryFilter] = useState(ALL_CATEGORIES);
  const [search, setSearch] = useState('');

  const { fromDate, toDate } = dateRange;
  const accountId = accountFilter !== ALL_ACCOUNTS ? accountFilter : undefined;

  const transactionFilters = useMemo<TransactionFilters>(() => ({
    from: fromDate,
    to: toDate,
    accountId,
    categoryId: categoryFilter !== ALL_CATEGORIES ? categoryFilter : undefined,
  }), [fromDate, toDate, accountId, categoryFilter]);

  const exchangeFilters = useMemo<MoneyExchangeFilters>(() => ({
    from: fromDate,
    to: toDate,
    accountId,
  }), [fromDate, toDate, accountId]);

  // Recurring templates have no single date, so the date range doesn't apply to them.
  const recurringFilters = useMemo<RecurringTransactionFilters>(() => ({
    accountId,
    categoryId: categoryFilter !== ALL_CATEGORIES ? categoryFilter : undefined,
  }), [accountId, categoryFilter]);

  const { accounts, loading: accountsLoading, refetch: refetchAccounts } = useAccounts();
  const { categories, loading: categoriesLoading, refetch: refetchCategories } = useCategories();

  // Accounts/categories may have changed on another tab (e.g. an account created or renamed).
  useFocusEffect(
    useCallback(() => {
      refetchAccounts();
      refetchCategories();
    }, [refetchAccounts, refetchCategories]),
  );

  const accountOptions = useMemo<SelectOption[]>(
    () => [{ label: 'All accounts', value: ALL_ACCOUNTS }, ...accounts.map((a) => ({ label: a.name, value: a.id }))],
    [accounts],
  );
  const categoryOptions = useMemo<SelectOption[]>(
    () => [
      { label: 'All categories', value: ALL_CATEGORIES },
      ...categories.map((c) => ({ label: c.name, value: c.id })),
    ],
    [categories],
  );

  const isTransactionsTab = tab === 'transactions';
  const isRecurringTab = tab === 'recurring';
  const showCategoryFilter = isTransactionsTab || isRecurringTab;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>Transactions</Text>

      <ListTabs value={tab} onChange={setTab} />

      <View style={styles.filters}>
        <SearchField value={search} onChange={setSearch} placeholder="Search by description or amount" />
        <View style={styles.filterRow}>
          <SelectField label="Account" value={accountFilter} options={accountOptions} onChange={setAccountFilter} />
          {/* Money exchanges have no category, so the filter only applies to transactions and recurring. */}
          {showCategoryFilter ? (
            <SelectField label="Category" value={categoryFilter} options={categoryOptions} onChange={setCategoryFilter} />
          ) : null}
        </View>
        {!isRecurringTab ? <DateRangeFilter from={fromDate} to={toDate} onChange={setDateRange} /> : null}
      </View>

      {accountsLoading || categoriesLoading ? (
        <ActivityIndicator color={theme.tint} style={styles.centered} />
      ) : isTransactionsTab ? (
        <TransactionList filters={transactionFilters} accounts={accounts} categories={categories} search={search} />
      ) : isRecurringTab ? (
        <RecurringTransactionList
          filters={recurringFilters}
          accounts={accounts}
          categories={categories}
          search={search}
        />
      ) : (
        <MoneyExchangeList filters={exchangeFilters} accounts={accounts} search={search} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  title: { fontSize: 28, fontWeight: 'bold', paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8 },
  filters: { flexDirection: 'row', paddingHorizontal: 24, paddingBottom: 12, gap: 12 },
  filterRow: { flexDirection: 'row', gap: 12 },
  centered: { flex: 1 },
});
