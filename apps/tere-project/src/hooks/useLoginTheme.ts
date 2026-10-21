'use client';

import { useEffect, useRef, useState } from 'react';

export type LoginTheme = 'system' | 'light' | 'dark';
export type LoginEffectiveTheme = Exclude<LoginTheme, 'system'>;
export type LoginThemeStorage = Pick<Storage, 'getItem' | 'setItem'>;
export type LoginMatchMedia = (query: string) => MediaQueryList;
export type LoginThemeSelection = {
  getSelectedTheme: () => LoginTheme;
  setSelectedTheme: (theme: LoginTheme) => LoginTheme;
  reload: () => LoginTheme;
};

export const LOGIN_THEME_STORAGE_KEY = 'tere-login-theme';
export const LOGIN_THEME_MEDIA_QUERY = '(prefers-color-scheme: dark)';
const LOGIN_THEMES: LoginTheme[] = ['system', 'light', 'dark'];

export const LOGIN_THEME_CONTRAST_PAIRS = [
  { mode: 'light', foreground: '#0b1f33', background: '#ffffff', minimum: 4.5 },
  { mode: 'light', foreground: '#40566b', background: '#ffffff', minimum: 4.5 },
  { mode: 'light', foreground: '#536b80', background: '#f6fafd', minimum: 4.5 },
  { mode: 'light', foreground: '#0b7285', background: '#ffffff', minimum: 4.5 },
  { mode: 'light', foreground: '#075985', background: '#ffffff', minimum: 4.5 },
  { mode: 'light', foreground: '#18794e', background: '#ffffff', minimum: 4.5 },
  { mode: 'light', foreground: '#55788f', background: '#ffffff', minimum: 4.5 },
  { mode: 'dark', foreground: '#ffffff', background: '#060d1a', minimum: 4.5 },
  { mode: 'dark', foreground: '#7fd8ee', background: '#060d1a', minimum: 4.5 },
  { mode: 'dark', foreground: '#22b8d4', background: '#060d1a', minimum: 4.5 },
] as const;

export function isLoginTheme(value: string | null | undefined): value is LoginTheme {
  return value !== null && value !== undefined && LOGIN_THEMES.includes(value as LoginTheme);
}

function getBrowserStorage(): LoginThemeStorage | undefined {
  try {
    return typeof window === 'undefined' ? undefined : window.localStorage;
  } catch {
    return undefined;
  }
}

export function readStoredLoginTheme(storage: LoginThemeStorage | undefined = getBrowserStorage()): LoginTheme {
  try {
    const stored = storage?.getItem(LOGIN_THEME_STORAGE_KEY) ?? null;
    return isLoginTheme(stored) ? stored : 'system';
  } catch {
    return 'system';
  }
}

export function writeStoredLoginTheme(
  theme: LoginTheme,
  storage: LoginThemeStorage | undefined = getBrowserStorage(),
): boolean {
  try {
    storage?.setItem(LOGIN_THEME_STORAGE_KEY, theme);
    return storage !== undefined;
  } catch {
    return false;
  }
}

export function createLoginThemeSelection(storage: LoginThemeStorage | undefined): LoginThemeSelection {
  let selectedTheme = readStoredLoginTheme(storage);

  return {
    getSelectedTheme: () => selectedTheme,
    setSelectedTheme: (theme) => {
      if (!isLoginTheme(theme)) return selectedTheme;
      selectedTheme = theme;
      writeStoredLoginTheme(theme, storage);
      return selectedTheme;
    },
    reload: () => {
      selectedTheme = readStoredLoginTheme(storage);
      return selectedTheme;
    },
  };
}

function getBrowserMatchMedia(): LoginMatchMedia | undefined {
  try {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return undefined;
    return window.matchMedia.bind(window);
  } catch {
    return undefined;
  }
}

export function getSystemLoginTheme(
  matchMedia: LoginMatchMedia | undefined = getBrowserMatchMedia(),
): LoginEffectiveTheme {
  try {
    if (!matchMedia) return 'dark';
    return matchMedia(LOGIN_THEME_MEDIA_QUERY).matches ? 'dark' : 'light';
  } catch {
    return 'dark';
  }
}

export function getEffectiveLoginTheme(
  selectedTheme: LoginTheme,
  systemTheme: LoginEffectiveTheme,
): LoginEffectiveTheme {
  return selectedTheme === 'system' ? systemTheme : selectedTheme;
}

export function createLoginThemeMediaController(mediaQuery: MediaQueryList) {
  const getCurrentTheme = (): LoginEffectiveTheme => {
    try {
      return mediaQuery.matches ? 'dark' : 'light';
    } catch {
      return 'dark';
    }
  };

  const subscribe = (onChange: () => void) => {
    const handleChange = () => onChange();

    try {
      if (typeof mediaQuery.addEventListener === 'function') {
        mediaQuery.addEventListener('change', handleChange);
      } else if (typeof mediaQuery.addListener === 'function') {
        mediaQuery.addListener(handleChange);
      } else {
        return () => undefined;
      }
    } catch {
      return () => undefined;
    }

    return () => {
      try {
        if (typeof mediaQuery.removeEventListener === 'function') {
          mediaQuery.removeEventListener('change', handleChange);
        } else if (typeof mediaQuery.removeListener === 'function') {
          mediaQuery.removeListener(handleChange);
        }
      } catch {
        // A denied listener cleanup must not break unmount.
      }
    };
  };

  return { getCurrentTheme, subscribe };
}

function getLoginThemeMediaQuery(): MediaQueryList | undefined {
  const matchMedia = getBrowserMatchMedia();
  try {
    return matchMedia?.(LOGIN_THEME_MEDIA_QUERY);
  } catch {
    return undefined;
  }
}

export function useLoginTheme() {
  const selectionRef = useRef<LoginThemeSelection | null>(null);
  if (selectionRef.current === null) {
    selectionRef.current = createLoginThemeSelection({
      getItem: () => null,
      setItem: () => undefined,
    });
  }

  const [selectedTheme, setSelectedThemeState] = useState<LoginTheme>('system');
  const [systemTheme, setSystemTheme] = useState<LoginEffectiveTheme>('dark');
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const selection = createLoginThemeSelection(getBrowserStorage());
    selectionRef.current = selection;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedThemeState(selection.getSelectedTheme());
    setSystemTheme(getSystemLoginTheme());
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated || selectedTheme !== 'system') return;

    const mediaQuery = getLoginThemeMediaQuery();
    if (!mediaQuery) return;

    const mediaController = createLoginThemeMediaController(mediaQuery);
    const handleChange = () => setSystemTheme(mediaController.getCurrentTheme());

    handleChange();
    return mediaController.subscribe(handleChange);
  }, [isHydrated, selectedTheme]);

  const setSelectedTheme = (theme: LoginTheme) => {
    if (!isLoginTheme(theme)) return;
    setSelectedThemeState(theme);
    selectionRef.current?.setSelectedTheme(theme);
    if (theme === 'system') setSystemTheme(getSystemLoginTheme());
  };

  return {
    selectedTheme,
    setSelectedTheme,
    effectiveTheme: isHydrated ? getEffectiveLoginTheme(selectedTheme, systemTheme) : 'dark',
  };
}
