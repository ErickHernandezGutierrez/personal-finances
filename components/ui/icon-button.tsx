import { IconSymbol, type IconSymbolName } from '@/components/ui/icon-symbol';
import { useTheme } from '@/contexts/theme-context';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';

type IconButtonProps = {
	name: IconSymbolName
	onPress: () => void
};

export function IconButton({ name, onPress }: IconButtonProps) {
	const { theme } = useTheme();
	const [isHovered, setIsHovered] = useState<boolean>(false);

	const onHoverIn = useCallback(() => setIsHovered(true), []);
	const onHoverOut = useCallback(() => setIsHovered(false), []);

	return (
		<Pressable 
			style={[
				styles.container, 
				{ backgroundColor: isHovered ? theme.hovered : theme.background },
			]} 
			onPress={onPress} 
			onHoverIn={onHoverIn}
			onHoverOut={onHoverOut}
			hitSlop={8}
		>
			<IconSymbol name={name} size={18} color={theme.icon} />
		</Pressable> 
	);
}

const styles = StyleSheet.create({
	container: { padding: 2, borderRadius: 8 },
	hovered: {}
});