'use client';

import { useEffect, useState } from 'react';
import type { Theme } from '@src/hooks/useTheme';

interface LoadingScreenProps {
  onComplete: () => void;
  isDataReady?: boolean;
  theme?: Theme;
}

export default function LoadingScreen({ onComplete, isDataReady = false }: LoadingScreenProps) {
  const [progress, setProgress] = useState(12);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (isDataReady) return;
    const timer = window.setInterval(() => setProgress(value => Math.min(value + Math.max(1, (92 - value) * .08), 92)), 180);
    return () => window.clearInterval(timer);
  }, [isDataReady]);

  useEffect(() => {
    if (!isDataReady) return;
    const finish = window.setTimeout(() => setProgress(100), 80);
    const leave = window.setTimeout(() => setLeaving(true), 300);
    const done = window.setTimeout(onComplete, 720);
    return () => [finish, leave, done].forEach(timer => window.clearTimeout(timer));
  }, [isDataReady, onComplete]);

  return (
    <div className={`loading-desktop ${leaving ? 'is-leaving' : ''}`} role="status" aria-label="Loading TERE">
      <div className="wallpaper-shape wallpaper-shape-a" />
      <div className="wallpaper-shape wallpaper-shape-b" />
      <div className="loading-window liquid-glass">
        <div className="tere-glyph" aria-hidden><span /><span /><span /></div>
        <div className="loading-copy"><strong>Opening TERE</strong><span>Preparing your workspace…</span></div>
        <div className="loading-track" aria-hidden><span style={{ width: `${progress}%` }} /></div>
      </div>
    </div>
  );
}
