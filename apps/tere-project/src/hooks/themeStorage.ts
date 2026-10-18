export type Theme = 'light' | 'void' | 'crimson';

const THEME_ORDER: Theme[] = ['light', 'void', 'crimson'];

export function readDashboardTheme(storage: Storage | undefined): Theme | null {
  if (!storage) return null;
  try {
    const stored = storage.getItem('theme');
    return stored && THEME_ORDER.includes(stored as Theme) ? (stored as Theme) : null;
  } catch {
    return null;
  }
}

export function writeDashboardTheme(storage: Storage | undefined, theme: Theme): void {
  try {
    storage?.setItem('theme', theme);
  } catch {
    // Browser storage is optional; dashboard interaction remains usable.
  }
}
