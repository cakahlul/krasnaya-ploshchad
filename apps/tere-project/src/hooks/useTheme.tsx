'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function normalizeTheme(value: string | null): Theme {
  return value === 'dark' || value === 'void' || value === 'crimson' ? 'dark' : 'light';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Hydrate persisted browser preference after server render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(normalizeTheme(localStorage.getItem('theme')));
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.classList.toggle('light', theme === 'light');
    document.documentElement.style.colorScheme = theme;
    localStorage.setItem('theme', theme);
  }, [theme, mounted]);

  useEffect(() => {
    const move = (event: PointerEvent) => {
      const target = (event.target as Element | null)?.closest<HTMLElement>(
        '.liquid-glass, .liquid-group, button, a, input, select, textarea, [role="button"], .ant-select, .ant-picker',
      );
      if (!target) return;
      const rect = target.getBoundingClientRect();
      target.style.setProperty('--liquid-x', `${event.clientX - rect.left}px`);
      target.style.setProperty('--liquid-y', `${event.clientY - rect.top}px`);
    };
    document.addEventListener('pointermove', move, { passive: true });
    return () => document.removeEventListener('pointermove', move);
  }, []);

  if (!mounted) return null;

  return (
    <ThemeContext.Provider
      value={{ theme, setTheme, toggleTheme: () => setTheme(value => value === 'light' ? 'dark' : 'light') }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
}

/** Existing feature token contract, now backed by two Liquid Glass appearances. */
export function useThemeColors() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return {
    theme,
    isDark,
    isVoid: isDark,
    isCrimson: false,
    accent: '#0a84ff',
    accentL: '#64d2ff',
    pageBg: 'transparent',
    cardBg: 'var(--content-surface)',
    cardBrd: 'var(--content-stroke)',
    titleCol: 'var(--lg-text)',
    subCol: 'var(--lg-muted)',
    rowCol: 'var(--lg-text)',
    rowBrd: 'var(--content-divider)',
    headBg: 'var(--content-raised)',
    iconBg: 'var(--control-fill)',
    iconStr: isDark ? 'rgba(255,255,255,.66)' : '#52627a',
    statusSuccess: isDark ? '#30d158' : '#15803d',
    statusSuccessBg: isDark ? 'rgba(48,209,88,.12)' : 'rgba(34,197,94,.10)',
    statusSuccessBrd: isDark ? 'rgba(48,209,88,.28)' : 'rgba(22,163,74,.22)',
    statusWarning: isDark ? '#ffd60a' : '#b45309',
    statusWarningBg: isDark ? 'rgba(255,214,10,.12)' : 'rgba(245,158,11,.10)',
    statusWarningBrd: isDark ? 'rgba(255,214,10,.28)' : 'rgba(217,119,6,.22)',
    statusDanger: isDark ? '#ff453a' : '#dc2626',
    statusDangerBg: isDark ? 'rgba(255,69,58,.12)' : 'rgba(239,68,68,.10)',
    statusDangerBrd: isDark ? 'rgba(255,69,58,.28)' : 'rgba(220,38,38,.22)',
    statusInfo: isDark ? '#64d2ff' : '#0071e3',
    statusInfoBg: isDark ? 'rgba(100,210,255,.12)' : 'rgba(0,113,227,.09)',
    statusInfoBrd: isDark ? 'rgba(100,210,255,.28)' : 'rgba(0,113,227,.20)',
    statusPurple: isDark ? '#bf5af2' : '#7c3aed',
    statusPurpleBg: isDark ? 'rgba(191,90,242,.12)' : 'rgba(124,58,237,.09)',
    statusPurpleBrd: isDark ? 'rgba(191,90,242,.28)' : 'rgba(124,58,237,.20)',
    statusOrange: isDark ? '#ff9f0a' : '#c2410c',
    statusOrangeBg: isDark ? 'rgba(255,159,10,.12)' : 'rgba(249,115,22,.09)',
    statusOrangeBrd: isDark ? 'rgba(255,159,10,.28)' : 'rgba(194,65,12,.20)',
    chartLineA: '#30d158', chartLineB: '#ff453a', chartLineC: '#0a84ff', chartLineD: '#bf5af2',
    chartGradientA: ['#ff453a', 'rgba(255,69,58,0)'],
    chartGradientB: ['#30d158', 'rgba(48,209,88,0)'],
  };
}
