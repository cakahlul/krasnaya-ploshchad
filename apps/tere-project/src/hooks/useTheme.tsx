'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type Theme = 'light' | 'void' | 'crimson';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_ORDER: Theme[] = ['light', 'void', 'crimson'];

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('theme') as Theme | null;
    if (stored && THEME_ORDER.includes(stored)) {
      setThemeState(stored);
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const el = document.documentElement;
    el.classList.remove('light', 'void', 'crimson', 'dark');
    el.classList.add(theme);
    // Keep 'dark' class for Tailwind dark: utilities on void & crimson
    if (theme === 'void' || theme === 'crimson') {
      el.classList.add('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme, mounted]);

  const toggleTheme = () => {
    setThemeState(prev => {
      const idx = THEME_ORDER.indexOf(prev);
      return THEME_ORDER[(idx + 1) % THEME_ORDER.length];
    });
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  if (!mounted) return null;

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

/** Helper to get theme-aware colors inline */
export function useThemeColors() {
  const { theme } = useTheme();
  const isVoid = theme === 'void';
  const isCrimson = theme === 'crimson';
  const isDark = isVoid || isCrimson;

  const accent = isCrimson ? '#e53935' : '#1282a2';
  const accentL = isCrimson ? '#ff6659' : '#22b8d4';

  return {
    theme, isVoid, isCrimson, isDark, accent, accentL,
    pageBg: isVoid ? '#080f1e' : isCrimson ? '#0a0505' : '#f2f4f9',
    cardBg: isVoid ? '#101e32' : '#fff',
    cardBrd: isVoid ? 'rgba(255,255,255,0.06)' : '#ebedf5',
    titleCol: isVoid ? '#e8edf5' : '#011d4d',
    subCol: isVoid ? 'rgba(255,255,255,0.3)' : '#9ca3af',
    rowCol: isVoid ? 'rgba(255,255,255,0.8)' : '#011d4d',
    rowBrd: isVoid ? 'rgba(255,255,255,0.04)' : '#f5f6fb',
    headBg: isVoid ? 'rgba(255,255,255,0.03)' : '#fafbfd',
    iconBg: isVoid ? 'rgba(255,255,255,0.06)' : '#f2f4f8',
    iconStr: isVoid ? 'rgba(255,255,255,0.4)' : '#6b7280',
  };
}
