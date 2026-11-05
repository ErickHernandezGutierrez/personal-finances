import { THEMES } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { type ThemeColors } from '@/types/theme';
import React, { createContext, useContext, useState } from 'react';

type ThemeState = {
    theme: ThemeColors;
    toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeState | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const colorScheme = useColorScheme() ?? 'light';
    const [theme, setTheme] = useState<ThemeColors>(THEMES['dark']);

    const toggleTheme = () => {
        setTheme(prevTheme => prevTheme.name === 'light'
            ? THEMES['dark']
            : THEMES['light']
        );
    };

    const value = { theme, toggleTheme };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => {
    const ctx = useContext(ThemeContext);
    if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
    return ctx;
};