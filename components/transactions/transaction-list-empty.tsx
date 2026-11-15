import { StyleSheet, Text } from 'react-native';

import { useTheme } from '@/contexts/theme-context';

type EmptyTransactionListProps = {
  isSearching: boolean;
};

export function EmptyTransactionList({ isSearching }: EmptyTransactionListProps) {
  const { theme } = useTheme();

  return (
    <Text style={[styles.empty, { color: theme.icon }]}>
      {isSearching ? 'No transactions match your search.' : 'No transactions in this date range.'}
    </Text>
  );
}

const styles = StyleSheet.create({
  empty: { textAlign: 'center', marginTop: 32 },
});
