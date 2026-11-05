import { IconSymbol, type IconSymbolName } from '@/components/ui/icon-symbol';
import { BUTTON_SIZES } from '@/constants/button-sizes';
import { useTheme } from '@/contexts/theme-context';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

type ButtonProps = {
	variant: 'primary' | 'secondary' | 'tertiary';
	size: 'xsmall' | 'small' | 'medium' | 'large';
	title: string;
	disabled?: boolean;
	loading?: boolean;
	leadingIconName?: IconSymbolName;
	trailingIconName?: IconSymbolName;
	onPress: () => void;
};

export function Button(props: ButtonProps) {
	const { theme } = useTheme();

	const colors = theme.button[props.variant];
	const size = BUTTON_SIZES[props.size];

	return (
		<Pressable 
			style={({ hovered }) => [
				styles.container, 
				{
					height: size.height,
					paddingHorizontal: size.paddingHorizontal,
					borderRadius: size.borderRadius,
					gap: size.gap,
					backgroundColor: hovered ? colors.backgroundHovered : colors.background,
					borderColor: colors.border,
					borderWidth: colors.border === 'transparent' ? 0 : 1,
				},
			]} 
			onPress={props.onPress} 
			hitSlop={8}
			disabled={props.disabled || props.loading}
		>
			{({ hovered }) => (
				<>
					{props.loading ? (
						<ActivityIndicator color={hovered ? colors.textHovered : colors.text} />
					) : props.leadingIconName && (
						<IconSymbol 
							name={props.leadingIconName} 
							size={size.iconSize} 
							color={hovered ? colors.textHovered : colors.text} 
						/>
					)}
					<Text 
						style={[
							styles.text, 
							{
								fontSize: size.fontSize, 
								color: hovered ? colors.textHovered : colors.text, 
							},
						]}
					>
						{props.loading ? 'Loading' : props.title}
					</Text>
					{props.trailingIconName && (
						<IconSymbol 
							name={props.trailingIconName} 
							size={size.iconSize} 
							color={hovered ? colors.textHovered : colors.text} 
						/>
					)}
				</>
			)}
		</Pressable> 
	);
}

const styles = StyleSheet.create({
	container: { 
		minWidth: 140, 
		height: 45, 
		flexDirection: 'row',
		gap: 4, 
		padding: 2, 
		borderRadius: 18, 
		alignSelf: 'center',
		alignItems: 'center',
		justifyContent: 'center',
	},
	text: {
		fontSize: 20,
		fontWeight: 400,
		lineHeight: 22,
	},
});