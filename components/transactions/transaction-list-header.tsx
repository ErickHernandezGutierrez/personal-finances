import { useTheme } from '@/contexts/theme-context';
import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/card';

export function TransactionListHeader() {
    const { theme } = useTheme();

    return (
			<Card style={[styles.card, { backgroundColor: theme.secondaryBackground }]}>
				<View style={{ width: 40, marginRight: 8 }} />
				<Text style={[styles.columnHeader, { color: theme.text }]}>Description</Text>
				<Text style={[styles.columnHeader, { color: theme.text }]}>Date</Text>
				<Text style={[styles.columnHeader, { color: theme.text }]}>Type</Text>
				<Text style={[styles.columnHeader, { color: theme.text }]}>Amount</Text>
				<View style={{ width: 20, marginRight: 8 }} />
			</Card>
    );
}

const styles = StyleSheet.create({
  card: { 
		borderWidth: 0, 
		flexDirection: 'row', 
		marginBottom: 12, 
		marginHorizontal: 24, 
		paddingVertical: 8, 
	},
	columnHeader: {
		flex: 1, 
		fontWeight: 'bold',
	},
});