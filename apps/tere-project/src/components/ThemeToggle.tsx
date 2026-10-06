'use client';

import { useTheme, useThemeColors } from '@src/hooks/useTheme';
const THEME_SWATCHES = [
  { val: 'light', color: '#087ea4', label: 'Light' },
  { val: 'dark', color: '#67d2ff', label: 'Dark' },
  { val: 'system', color: '#8898a0', label: 'System' },
] as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const { isDark } = useThemeColors();

  return (
    <div
      className="flex items-center gap-1.5 rounded-[10px] px-2 py-1.5"
      style={{ background: isDark ? 'rgba(255,255,255,0.06)' : '#e8eff1' }}
    >
      {THEME_SWATCHES.map(t => (
        <button
          key={t.val}
          onClick={() => setTheme(t.val)}
          title={t.label}
          aria-label={`Use ${t.label} theme`}
          className="transition-all duration-200 rounded-full border-none cursor-pointer p-0"
          style={{
            width: theme === t.val ? 22 : 14,
            height: 14,
            background: t.color,
            outline: theme === t.val
              ? `2px solid ${isDark ? 'rgba(255,255,255,0.4)' : 'rgba(16,42,54,0.25)'}`
              : '2px solid transparent',
            outlineOffset: 2,
            boxShadow: theme === t.val ? `0 0 8px ${t.color}80` : 'none',
          }}
        />
      ))}
    </div>
  );
}
