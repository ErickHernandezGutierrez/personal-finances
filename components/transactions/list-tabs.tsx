import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/contexts/theme-context';

export type ListTab = 'transactions' | 'money_exchanges';

const TABS: { label: string; value: ListTab }[] = [
  { label: 'Transactions', value: 'transactions' },
  { label: 'Money Exchanges', value: 'money_exchanges' },
];

type ListTabsProps = {
  value: ListTab;
  onChange: (tab: ListTab) => void;
};

export function ListTabs({ value, onChange }: ListTabsProps) {
  const { theme } = useTheme();

  return (
    <View style={styles.container} accessibilityRole="tablist">
      {TABS.map((tab) => {
        const selected = tab.value === value;
        return (
          <Pressable
            key={tab.value}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => onChange(tab.value)}
            style={[styles.tab, { borderBottomColor: selected ? theme.tint : 'transparent' }]}>
            <Text style={[styles.label, { color: selected ? theme.text : theme.icon }]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', paddingHorizontal: 24, paddingBottom: 12, gap: 16 },
  tab: { paddingVertical: 8, borderBottomWidth: 2 },
  label: { fontSize: 16, fontWeight: '600' },
});
