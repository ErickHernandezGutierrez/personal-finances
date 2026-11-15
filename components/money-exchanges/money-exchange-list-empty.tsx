import { StyleSheet, Text } from 'react-native';

import { useTheme } from '@/contexts/theme-context';

type EmptyMoneyExchangeListProps = {
  isSearching: boolean;
};

export function EmptyMoneyExchangeList({ isSearching }: EmptyMoneyExchangeListProps) {
  const { theme } = useTheme();

  return (
    <Text style={[styles.empty, { color: theme.icon }]}>
      {isSearching ? 'No money exchanges match your search.' : 'No money exchanges in this date range.'}
    </Text>
  );
}

const styles = StyleSheet.create({
  empty: { textAlign: 'center', marginTop: 32 },
});
