'use client';

import { useEffect, useState } from 'react';
import { useTheme } from './useTheme';

export type LoginTheme = 'system' | 'light' | 'dark';
export type LoginEffectiveTheme = Exclude<LoginTheme, 'system'>;

export const LOGIN_THEME_STORAGE_KEY = 'tere-login-theme';
const SYSTEM_THEME_QUERY = '(prefers-color-scheme: dark)';
const LOGIN_THEMES: LoginTheme[] = ['system', 'light', 'dark'];

export function isLoginTheme(value: string | null): value is LoginTheme {
  return value !== null && LOGIN_THEMES.includes(value as LoginTheme);
}

function readStoredLoginTheme(): LoginTheme {
  try {
    if (typeof window === 'undefined') return 'system';
    const stored = window.localStorage.getItem(LOGIN_THEME_STORAGE_KEY);
    return isLoginTheme(stored) ? stored : 'system';
  } catch {
    return 'system';
  }
}

function writeStoredLoginTheme(theme: LoginTheme) {
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(LOGIN_THEME_STORAGE_KEY, theme);
    }
  } catch {
    // A denied write only disables persistence; current page remains usable.
  }
}

function getSystemTheme(): LoginEffectiveTheme {
  try {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return 'dark';
    return window.matchMedia(SYSTEM_THEME_QUERY).matches ? 'dark' : 'light';
  } catch {
    return 'dark';
  }
}

export function useLoginTheme() {
  const { isReady: providerReady } = useTheme();
  const [selectedTheme, setSelectedThemeState] = useState<LoginTheme>(() => readStoredLoginTheme());
  const [systemTheme, setSystemTheme] = useState<LoginEffectiveTheme>(() => getSystemTheme());
  const isReady = providerReady;

  useEffect(() => {
    if (!providerReady || selectedTheme !== 'system') return;

    let mediaQuery: MediaQueryList;
    try {
      if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
        return;
      }
      mediaQuery = window.matchMedia(SYSTEM_THEME_QUERY);
    } catch {
      return;
    }

    const handleChange = (event?: MediaQueryListEvent) => {
      setSystemTheme((event ?? mediaQuery).matches ? 'dark' : 'light');
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      mediaQuery.addListener?.(handleChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        mediaQuery.removeListener?.(handleChange);
      }
    };
  }, [providerReady, selectedTheme]);

  const setSelectedTheme = (theme: LoginTheme) => {
    if (!isLoginTheme(theme)) return;
    setSelectedThemeState(theme);
    writeStoredLoginTheme(theme);
  };

  const effectiveTheme: LoginEffectiveTheme =
    !isReady ? 'dark' : selectedTheme === 'system' ? systemTheme : selectedTheme;

  return { selectedTheme, setSelectedTheme, effectiveTheme, isReady };
}
