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
