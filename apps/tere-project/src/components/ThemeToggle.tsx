'use client';

import { useTheme } from '@src/hooks/useTheme';
import type { Theme } from '@src/hooks/useTheme';

const THEME_SWATCHES: { val: Theme; color: string; label: string }[] = [
  { val: 'light', color: '#1282a2', label: 'Atlas' },
  { val: 'void', color: '#22b8d4', label: 'Void' },
  { val: 'crimson', color: '#e53935', label: 'Krasnaya' },
];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const isVoid = theme === 'void' || theme === 'crimson';

  return (
    <div
      className="flex items-center gap-1.5 rounded-[10px] px-2 py-1.5"
      style={{ background: isVoid ? 'rgba(255,255,255,0.06)' : '#f2f4f8' }}
    >
      {THEME_SWATCHES.map(t => (
        <button
          key={t.val}
          onClick={() => setTheme(t.val)}
          title={t.label}
          className="transition-all duration-200 rounded-full border-none cursor-pointer p-0"
          style={{
            width: theme === t.val ? 22 : 14,
            height: 14,
            background: t.color,
            outline: theme === t.val
              ? `2px solid ${isVoid ? 'rgba(255,255,255,0.4)' : 'rgba(1,29,77,0.25)'}`
              : '2px solid transparent',
            outlineOffset: 2,
            boxShadow: theme === t.val ? `0 0 8px ${t.color}80` : 'none',
          }}
        />
      ))}
    </div>
  );
}
