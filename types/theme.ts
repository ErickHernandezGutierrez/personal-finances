export type ButtonVariant = 'primary' | 'secondary' | 'tertiary';

export type ButtonVariantColors = {
    background: string;
    backgroundHovered: string;
    text: string;
    textHovered: string;
    border: string;
};

export type ThemeColors = {
    name: 'light' | 'dark';
    primary: string;
    text: string;
    background: string;
    secondaryBackground: string;
    tertiaryBackground: string;
    hovered: string;
    border: string;
    tint: string;
    icon: string;
    button: Record<ButtonVariant, ButtonVariantColors>;
    tabIconDefault: string;
    tabIconSelected: string;
    balancePositive: string;
    balanceNegative: string;
    balanceNeutral: string;
};