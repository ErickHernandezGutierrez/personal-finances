export type ButtonSize = 'xsmall' | 'small' | 'medium' | 'large';

export const BUTTON_SIZES: Record<ButtonSize, {
    height: number;
    paddingHorizontal: number;
    fontSize: number;
    iconSize: number;
    gap: number;
    borderRadius: number
}> = {
    xsmall: { height: 32, paddingHorizontal: 12, fontSize: 13, iconSize: 16, gap: 4, borderRadius: 12 },
    small: { height: 38, paddingHorizontal: 14, fontSize: 15, iconSize: 18, gap: 4, borderRadius: 14 },
    medium: { height: 45, paddingHorizontal: 16, fontSize: 20, iconSize: 26, gap: 4, borderRadius: 18 },
    large: { height: 52, paddingHorizontal: 20, fontSize: 22, iconSize: 28, gap: 6, borderRadius: 20 },
};