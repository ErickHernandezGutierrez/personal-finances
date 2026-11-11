/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { type ThemeColors } from '@/types/theme';
import { Platform } from 'react-native';

const tintColorLight = '#2771D8';
const tintColorDark = '#fff';

export const THEMES = {
  light: {
    name: 'light',
    primary: '#2771D8',
    text: '#11181C',
    background: '#F8F8FF',
    secondaryBackground: '#1F2431',
    tertiaryBackground: '#212E36',
    fieldBackground: '#F8F8FF',
    hovered: '#D9F9FB',
    border: '#E6E8EB',
    tint: tintColorLight,
    icon: '#687076',
    button: {
      primary: {
        background: '#2771D8',
        backgroundHovered: '#D9F9FB',
        text: '#FFFFFF',
        textHovered: '#14192E',
        border: 'transparent',
      },
      secondary: {
        background: 'transparent',
        backgroundHovered: '#D9F9FB',
        text: '#FFFFFF',
        textHovered: '#14192E',
        border: '#2A2828',
      },
      tertiary: {
        background: 'transparent',
        backgroundHovered: '#D9F9FB',
        text: '#FFFFFF',
        textHovered: '#14192E',
        border: 'transparent',
      },
    },
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    balancePositive: '#00804C',
    balanceNegative: '#BC2D29',
    balanceNeutral: '#9BA1A6',
  },
  dark: {
    name: 'dark',
    primary: '#2771D8',
    text: '#FFFFFF',
    background: '#000000',
    secondaryBackground: '#1F2431',
    tertiaryBackground: '#212E36',
    fieldBackground: '#2A2828',
    hovered: '#D9F9FB',
    border: '#464444',
    tint: tintColorDark,
    icon: '#9BA1A6',
    button: {
      primary: {
        background: '#2771D8',
        backgroundHovered: '#D9F9FB',
        text: '#FFFFFF',
        textHovered: '#14192E',
        border: 'transparent',
      },
      secondary: {
        background: 'transparent',
        backgroundHovered: '#D9F9FB',
        text: '#2771D8',
        textHovered: '#14192E',
        border: '#2771D8',
      },
      tertiary: {
        background: 'transparent',
        backgroundHovered: '#D9F9FB',
        text: '#FFFFFF',
        textHovered: '#14192E',
        border: 'transparent',
      },
    },
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    balancePositive: '#00804C',
    balanceNegative: '#BC2D29',
    balanceNeutral: '#9BA1A6',
  },
} satisfies Record<ThemeColors['name'], ThemeColors>;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
