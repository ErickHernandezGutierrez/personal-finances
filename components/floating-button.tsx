import { Pressable, StyleSheet } from "react-native";

import { IconSymbol } from "@/components/ui/icon-symbol";
import { useTheme } from "@/contexts/theme-context";

export default function FloatingButton({ onPress }: { onPress: () => void }) {
  const { theme } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[styles.button, { backgroundColor: theme.tint }]}
    >
      <IconSymbol name="plus" size={24} color={theme.background} />
    </Pressable>
	);
}

const styles = StyleSheet.create({
	button: {
		position: "absolute",
		bottom: 24,
		right: 24,
		width: 56,
		height: 56,
		borderRadius: 28,
		justifyContent: "center",
		alignItems: "center",
	}
});