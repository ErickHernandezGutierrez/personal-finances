import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import React, { createContext, useContext, useState } from 'react';

type ThemeColor = {
    name: string;
    text: string;
    background: string;
    border: string;
    tint: string;
    icon: string;
    tabIconDefault: string;
    tabIconSelected: string;
};

type ThemeState = {
    theme: ThemeColor;
    toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeState | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const colorScheme = useColorScheme() ?? 'light';
    const [theme, setTheme] = useState<ThemeColor>(Colors[colorScheme]);

    const toggleTheme = () => {
        setTheme(prevTheme => prevTheme.name === 'light'
            ? Colors['dark']
            : Colors['light']
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