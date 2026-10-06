'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
const THEMES: Theme[] = ['light', 'dark', 'system'];

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system');
  const [systemDark, setSystemDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const sync = () => setSystemDark(media.matches);
    media.addEventListener('change', sync);
    const timer = window.setTimeout(() => {
      const savedTheme = localStorage.getItem('theme');
      setThemeState(savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'system' ? savedTheme : 'system');
      sync();
      setMounted(true);
    }, 0);
    return () => {
      window.clearTimeout(timer);
      media.removeEventListener('change', sync);
    };
  }, []);

  const resolved = theme === 'system' ? (systemDark ? 'dark' : 'light') : theme;
  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(resolved);
    localStorage.setItem('theme', theme);
  }, [mounted, resolved, theme]);

  if (!mounted) return null;
  return (
    <ThemeContext.Provider value={{
      theme,
      setTheme: setThemeState,
      toggleTheme: () => setThemeState(current => THEMES[(THEMES.indexOf(current) + 1) % THEMES.length]),
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
}

export function useThemeColors() {
  const { theme } = useTheme();
  const isDark = typeof document === 'undefined'
    ? theme === 'dark'
    : document.documentElement.classList.contains('dark');
  const dark = (light: string, value: string) => isDark ? value : light;

  return {
    theme, resolvedTheme: isDark ? ('dark' as const) : ('light' as const), isDark,
    accent: dark('#087ea4', '#67d2ff'), accentL: dark('#0ea5c9', '#9ae4ff'),
    pageBg: dark('#f4f7f8', '#101418'), cardBg: dark('rgba(255,255,255,.76)', 'rgba(24,31,37,.78)'),
    cardBrd: dark('rgba(20,57,73,.12)', 'rgba(214,235,244,.12)'), titleCol: dark('#102a36', '#edf6f9'),
    subCol: dark('#607782', 'rgba(237,246,249,.62)'), rowCol: dark('#163744', 'rgba(237,246,249,.88)'),
    rowBrd: dark('rgba(20,57,73,.08)', 'rgba(214,235,244,.08)'), headBg: dark('rgba(255,255,255,.48)', 'rgba(255,255,255,.04)'),
    iconBg: dark('rgba(8,126,164,.10)', 'rgba(103,210,255,.12)'), iconStr: dark('#42606c', 'rgba(237,246,249,.7)'),
    statusSuccess: dark('#087f5b', '#62d6a6'), statusSuccessBg: dark('#e7f7ef', 'rgba(98,214,166,.12)'), statusSuccessBrd: dark('#bcebd4', 'rgba(98,214,166,.26)'),
    statusWarning: dark('#a45b09', '#f6c56f'), statusWarningBg: dark('#fff4de', 'rgba(246,197,111,.12)'), statusWarningBrd: dark('#f3d49a', 'rgba(246,197,111,.26)'),
    statusDanger: dark('#be3e3a', '#ff8e8a'), statusDangerBg: dark('#ffebea', 'rgba(255,142,138,.12)'), statusDangerBrd: dark('#f6c2c0', 'rgba(255,142,138,.28)'),
    statusInfo: dark('#2563a8', '#81b8ff'), statusInfoBg: dark('#eaf2ff', 'rgba(129,184,255,.12)'), statusInfoBrd: dark('#c8ddfb', 'rgba(129,184,255,.26)'),
    statusPurple: dark('#6941c6', '#c2a8ff'), statusPurpleBg: dark('#f1edff', 'rgba(194,168,255,.12)'), statusPurpleBrd: dark('#dbd0ff', 'rgba(194,168,255,.25)'),
    statusOrange: dark('#b84f16', '#fbb07b'), statusOrangeBg: dark('#fff0e8', 'rgba(251,176,123,.12)'), statusOrangeBrd: dark('#f7ceb4', 'rgba(251,176,123,.25)'),
    chartLineA: dark('#138b67', '#62d6a6'), chartLineB: dark('#c84a46', '#ff8e8a'), chartLineC: dark('#337ab7', '#81b8ff'), chartLineD: dark('#7a5bd3', '#c2a8ff'),
    chartGradientA: isDark ? ['#62d6a6', 'rgba(98,214,166,0)'] : ['#138b67', 'rgba(19,139,103,0)'],
    chartGradientB: isDark ? ['#ff8e8a', 'rgba(255,142,138,0)'] : ['#c84a46', 'rgba(200,74,70,0)'],
  };
}
