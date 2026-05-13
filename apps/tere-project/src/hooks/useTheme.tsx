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

function SocialistSwitchAnimation({ show }: { show: boolean }) {
  if (!show) return null;

  return (
    <div className="socialist-switch-overlay" aria-hidden>
      <div className="socialist-switch-rays" />
      <div className="socialist-switch-banner">Workers of data, unite!</div>
      <div className="socialist-switch-star" />
      {Array.from({ length: 18 }).map((_, i) => (
        <span
          key={i}
          className="socialist-switch-spark"
          style={{
            left: `${8 + (i * 5) % 84}%`,
            animationDelay: `${i * 45}ms`,
            transform: `rotate(${i * 23}deg)`,
          }}
        />
      ))}
    </div>
  );
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);
  const [showSocialistAnimation, setShowSocialistAnimation] = useState(false);
  const [socialistAnimationKey, setSocialistAnimationKey] = useState(0);

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
    if (newTheme === 'crimson') {
      setShowSocialistAnimation(true);
      setSocialistAnimationKey(k => k + 1);
      setTimeout(() => setShowSocialistAnimation(false), 2800);
    }
    setThemeState(newTheme);
  };

  if (!mounted) return null;

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
      <SocialistSwitchAnimation key={socialistAnimationKey} show={showSocialistAnimation} />
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

  const accent = isCrimson ? '#C21518' : '#1282a2';
  const accentL = isCrimson ? '#FF6B3A' : '#22b8d4';

  return {
    theme, isVoid, isCrimson, isDark, accent, accentL,
    pageBg: isVoid ? '#080f1e' : isCrimson ? '#1a0202' : '#f2f4f9',
    cardBg: isVoid ? '#101e32' : isCrimson ? '#2B1810' : '#fff',
    cardBrd: isVoid ? 'rgba(255,255,255,0.06)' : isCrimson ? 'rgba(194,21,24,0.45)' : '#ebedf5',
    titleCol: isVoid ? '#e8edf5' : isCrimson ? '#fff6e6' : '#011d4d',
    subCol: isVoid ? 'rgba(255,255,255,0.3)' : isCrimson ? 'rgba(255,215,0,0.65)' : '#9ca3af',
    rowCol: isVoid ? 'rgba(255,255,255,0.8)' : isCrimson ? 'rgba(255,240,200,0.9)' : '#011d4d',
    rowBrd: isVoid ? 'rgba(255,255,255,0.04)' : isCrimson ? 'rgba(194,21,24,0.15)' : '#f5f6fb',
    headBg: isVoid ? 'rgba(255,255,255,0.03)' : isCrimson ? 'rgba(194,21,24,0.12)' : '#fafbfd',
    iconBg: isVoid ? 'rgba(255,255,255,0.06)' : isCrimson ? 'rgba(194,21,24,0.20)' : '#f2f4f8',
    iconStr: isVoid ? 'rgba(255,255,255,0.4)' : isCrimson ? '#FFD700' : '#6b7280',
    // Soviet palette for crimson — propaganda poster status colors
    statusSuccess: isCrimson ? '#FFD700' : isDark ? '#34d399' : '#10b981',
    statusSuccessBg: isCrimson ? 'rgba(255,215,0,0.12)' : isDark ? '#0a2a1e' : '#f0fdf7',
    statusSuccessBrd: isCrimson ? 'rgba(255,215,0,0.35)' : isDark ? '#10b98130' : '#d1fae5',
    statusWarning: isCrimson ? '#FF6B3A' : isDark ? '#f59e0b' : '#d97706',
    statusWarningBg: isCrimson ? 'rgba(255,107,58,0.12)' : isDark ? '#2e1f08' : '#fff8ed',
    statusWarningBrd: isCrimson ? 'rgba(255,107,58,0.35)' : isDark ? '#f59e0b30' : '#d9770630',
    statusDanger: isCrimson ? '#FF4444' : isDark ? '#ef4444' : '#ef4444',
    statusDangerBg: isCrimson ? 'rgba(255,68,68,0.15)' : isDark ? '#2a0f10' : '#fff1f1',
    statusDangerBrd: isCrimson ? 'rgba(255,68,68,0.40)' : isDark ? '#ef444430' : '#fecaca',
    statusInfo: isCrimson ? '#C21518' : isDark ? '#3b82f6' : '#3b82f6',
    statusInfoBg: isCrimson ? 'rgba(194,21,24,0.18)' : isDark ? '#0d1a35' : '#eff6ff',
    statusInfoBrd: isCrimson ? 'rgba(194,21,24,0.40)' : isDark ? '#3b82f630' : '#bfdbfe',
    statusPurple: isCrimson ? '#FFD700' : isDark ? '#8b5cf6' : '#8b5cf6',
    statusPurpleBg: isCrimson ? 'rgba(255,215,0,0.10)' : isDark ? '#1a0f2e' : '#f5f3ff',
    statusPurpleBrd: isCrimson ? 'rgba(255,215,0,0.30)' : isDark ? '#8b5cf630' : '#e9d5ff',
    statusOrange: isCrimson ? '#FF6B3A' : isDark ? '#f97316' : '#f97316',
    statusOrangeBg: isCrimson ? 'rgba(255,107,58,0.12)' : isDark ? '#1f0e04' : '#fff7ed',
    statusOrangeBrd: isCrimson ? 'rgba(255,107,58,0.35)' : isDark ? '#f9731630' : '#fed7aa',
    chartLineA: isCrimson ? '#FFD700' : '#10b981',
    chartLineB: isCrimson ? '#FF6B3A' : '#ef4444',
    chartLineC: isCrimson ? '#FFD70088' : '#3b82f6',
    chartLineD: isCrimson ? '#C2151888' : '#8b5cf6',
    chartGradientA: isCrimson ? ['#FFD700', 'rgba(255,215,0,0)'] : ['#EF4444', 'rgba(239,68,68,0)'],
    chartGradientB: isCrimson ? ['#FF6B3A', 'rgba(255,107,58,0)'] : ['#10B981', 'rgba(16,185,129,0)'],
  };
}
