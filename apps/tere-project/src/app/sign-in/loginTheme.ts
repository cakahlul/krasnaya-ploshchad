'use client';
import { useEffect, useState } from 'react';
import { getSystemLoginTheme, isLoginThemePreference, readLoginThemePreference, resolveLoginTheme, writeLoginThemePreference } from './loginThemeCore';
export { getSystemLoginTheme, isLoginThemePreference, readLoginThemePreference, resolveLoginTheme, writeLoginThemePreference } from './loginThemeCore';
export type LoginThemePreference = 'system' | 'light' | 'dark';
export type LoginResolvedTheme = 'light' | 'dark';
export const LOGIN_THEME_STORAGE_KEY = 'tere-login-theme';
export type LoginThemeTokens = {
  pageBackground: string;
  grid: string;
  glow: string;
  cardBackground: string;
  cardBorder: string;
  text: string;
  mutedText: string;
  subtleText: string;
  controlBackground: string;
  controlBorder: string;
  controlText: string;
  focusRing: string;
  accent: string;
  accentStrong: string;
  modalBackground: string;
  modalText: string;
  tooltipBackground: string;
  tooltipText: string;
  sceneBackdrop: string;
};
export const LOGIN_THEME_TOKENS: Record<LoginResolvedTheme, LoginThemeTokens> = {
  dark: {
    pageBackground: 'linear-gradient(135deg, #060d1a, #011d4d, #034078)',
    grid: 'rgba(255,255,255,0.05)',
    glow: 'radial-gradient(circle, rgba(18,130,162,0.15) 0%, transparent 70%)',
    cardBackground: 'rgba(255,255,255,0.04)',
    cardBorder: 'rgba(255,255,255,0.12)',
    text: '#f8fafc',
    mutedText: '#cbd5e1',
    subtleText: '#94a3b8',
    controlBackground: 'rgba(6,13,26,0.82)',
    controlBorder: 'rgba(255,255,255,0.3)',
    controlText: '#f8fafc',
    focusRing: '#67e8f9',
    accent: '#22b8d4',
    accentStrong: '#1282a2',
    modalBackground: 'linear-gradient(160deg, #0b1a30 0%, #051025 100%)',
    modalText: '#e2e8f0',
    tooltipBackground: 'rgba(6,13,26,0.95)',
    tooltipText: '#f8fafc',
    sceneBackdrop: '#060d1a',
  },
  light: {
    pageBackground: 'linear-gradient(135deg, #eff6ff, #dbeafe, #c7d2fe)',
    grid: 'rgba(15,23,42,0.1)',
    glow: 'radial-gradient(circle, rgba(14,116,144,0.2) 0%, transparent 70%)',
    cardBackground: 'rgba(255,255,255,0.9)',
    cardBorder: 'rgba(15,23,42,0.18)',
    text: '#0f172a',
    mutedText: '#334155',
    subtleText: '#475569',
    controlBackground: '#ffffff',
    controlBorder: '#334155',
    controlText: '#0f172a',
    focusRing: '#0369a1',
    accent: '#0e7490',
    accentStrong: '#075985',
    modalBackground: 'linear-gradient(160deg, #ffffff 0%, #eff6ff 100%)',
    modalText: '#334155',
    tooltipBackground: '#0f172a',
    tooltipText: '#f8fafc',
    sceneBackdrop: '#e0f2fe',
  },
};
function getBrowserMatchMedia(): ((query: string) => MediaQueryList) | undefined {
  try {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return undefined;
    return window.matchMedia.bind(window);
  } catch {
    return undefined;
  }
}
function getBrowserStorage(): Storage | undefined {
  try {
    if (typeof window === 'undefined') return undefined;
    return window.localStorage;
  } catch {
    return undefined;
  }
}
export function useLoginTheme(): {
  preference: LoginThemePreference;
  resolvedTheme: LoginResolvedTheme;
  tokens: LoginThemeTokens;
  setPreference: (value: LoginThemePreference) => void;
} {
  const [preference, setPreferenceState] = useState<LoginThemePreference>('system');
  const [resolvedTheme, setResolvedTheme] = useState<LoginResolvedTheme>('light');
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setPreferenceState(readLoginThemePreference(getBrowserStorage()));
    setMounted(true);
  }, []);
  useEffect(() => {
    if (!mounted) return;
    const updateResolvedTheme = (systemTheme = getSystemLoginTheme()) => {
      setResolvedTheme(resolveLoginTheme(preference, systemTheme));
    };
    updateResolvedTheme();
    if (preference !== 'system') return;
    let mediaQuery: MediaQueryList | undefined;
    try {
      const matchMedia = getBrowserMatchMedia();
      mediaQuery = matchMedia?.('(prefers-color-scheme: dark)');
      if (!mediaQuery) return;
      const handleChange = (event: MediaQueryListEvent) => {
        updateResolvedTheme(event.matches ? 'dark' : 'light');
      };
      if (typeof mediaQuery.addEventListener === 'function') {
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery?.removeEventListener('change', handleChange);
      }
      if (typeof mediaQuery.addListener === 'function') {
        mediaQuery.addListener(handleChange);
        return () => mediaQuery?.removeListener(handleChange);
      }
    } catch {
      // Missing or broken media-query APIs fall back to light.
    }
    return undefined;
  }, [mounted, preference]);
  const setPreference = (value: LoginThemePreference) => {
    if (!isLoginThemePreference(value)) return;
    setPreferenceState(value);
    writeLoginThemePreference(getBrowserStorage(), value);
  };
  return { preference, resolvedTheme, tokens: LOGIN_THEME_TOKENS[resolvedTheme], setPreference };
}
