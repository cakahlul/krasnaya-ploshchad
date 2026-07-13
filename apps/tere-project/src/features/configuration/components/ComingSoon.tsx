'use client';

import { useThemeColors } from '@src/hooks/useTheme';

const sans = "var(--font-space-grotesk), 'Space Grotesk', sans-serif";

interface ComingSoonProps {
  label: string;
}

export default function ComingSoon({ label }: ComingSoonProps) {
  const { titleCol, subCol, cardBg, cardBrd } = useThemeColors();

  return (
    <div
      style={{
        background: cardBg,
        border: `1px solid ${cardBrd}`,
        borderRadius: 12,
        padding: '48px 24px',
        textAlign: 'center',
        fontFamily: sans,
      }}
    >
      <p style={{ fontSize: 15, fontWeight: 700, color: titleCol, margin: 0 }}>
        {label}
      </p>
      <p style={{ fontSize: 12.5, color: subCol, margin: '6px 0 0' }}>
        Coming soon
      </p>
    </div>
  );
}
