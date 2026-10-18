export type LoginThemePreference = 'system' | 'light' | 'dark';
export type LoginResolvedTheme = 'light' | 'dark';
export const LOGIN_THEME_STORAGE_KEY = 'tere-login-theme';
export function isLoginThemePreference(value: unknown): value is LoginThemePreference {
  return value === 'system' || value === 'light' || value === 'dark';
}
export function readLoginThemePreference(storage: Storage | undefined): LoginThemePreference {
  if (!storage) return 'system';
  try {
    const stored = storage.getItem(LOGIN_THEME_STORAGE_KEY);
    return isLoginThemePreference(stored) ? stored : 'system';
  } catch {
    return 'system';
  }
}
export function writeLoginThemePreference(storage: Storage | undefined, preference: LoginThemePreference): void {
  try {
    storage?.setItem(LOGIN_THEME_STORAGE_KEY, preference);
  } catch {
    // Browser storage is optional; selection remains in memory.
  }
}
export function resolveLoginTheme(preference: LoginThemePreference, systemTheme: LoginResolvedTheme): LoginResolvedTheme {
  return preference === 'system' ? systemTheme : preference;
}
export function subscribeToSystemLoginTheme(
  matchMedia: ((query: string) => MediaQueryList) | undefined,
  onChange: (theme: LoginResolvedTheme) => void,
): () => void {
  let active = true;
  let removeListener: (() => void) | undefined;
  try {
    const mediaQuery = matchMedia?.('(prefers-color-scheme: dark)');
    if (!mediaQuery) return () => { active = false; };
    const handleChange = (event: MediaQueryListEvent) => {
      if (!active) return;
      try {
        onChange(event.matches ? 'dark' : 'light');
      } catch {
        // A stale or broken media callback must not escape into the page.
      }
    };
    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleChange);
      removeListener = () => {
        try {
          mediaQuery.removeEventListener?.('change', handleChange);
        } catch {
          // Browser cleanup can fail under restricted media-query APIs.
        }
      };
    } else if (typeof mediaQuery.addListener === 'function') {
      mediaQuery.addListener(handleChange);
      removeListener = () => {
        try {
          mediaQuery.removeListener?.(handleChange);
        } catch {
          // Browser cleanup can fail under restricted media-query APIs.
        }
      };
    }
  } catch {
    active = false;
  }
  return () => {
    active = false;
    try {
      removeListener?.();
    } catch {
      // Cleanup remains best effort.
    }
  };
}
function getBrowserMatchMedia(): ((query: string) => MediaQueryList) | undefined {
  try {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return undefined;
    return window.matchMedia.bind(window);
  } catch {
    return undefined;
  }
}
export function getSystemLoginTheme(matchMedia: ((query: string) => MediaQueryList) | undefined = getBrowserMatchMedia()): LoginResolvedTheme {
  if (!matchMedia) return 'light';
  try {
    return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}
