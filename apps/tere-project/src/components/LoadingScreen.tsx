'use client';

import { useEffect, useState } from 'react';

interface LoadingScreenProps {
  onComplete: () => void;
  isDataReady?: boolean;
  theme?: string;
}

export default function LoadingScreen({ onComplete, isDataReady = false, theme = 'system' }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const isDark = theme === 'dark' || (theme === 'system' && typeof document !== 'undefined' && document.documentElement.classList.contains('dark'));

  useEffect(() => {
    if (isDataReady) {
      const timer = window.setTimeout(() => setProgress(100), 120);
      return () => window.clearTimeout(timer);
    }
    if (progress >= 90) return;
    const timer = window.setTimeout(() => setProgress(value => Math.min(value + 10, 90)), 160);
    return () => window.clearTimeout(timer);
  }, [isDataReady, progress]);

  useEffect(() => {
    if (progress < 100) return;
    const timer = window.setTimeout(onComplete, 180);
    return () => window.clearTimeout(timer);
  }, [onComplete, progress]);

  const text = isDataReady ? 'Opening your workspace' : 'Loading workspace';
  return (
    <main
      aria-live="polite"
      aria-busy={!isDataReady}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-6"
      style={{ background: isDark ? '#101418' : '#f4f7f8', color: isDark ? '#edf6f9' : '#102a36' }}
    >
      <section className="w-full max-w-sm rounded-2xl p-6" style={{ background: isDark ? 'rgba(24,31,37,.78)' : 'rgba(255,255,255,.76)', border: `1px solid ${isDark ? 'rgba(214,235,244,.12)' : 'rgba(20,57,73,.12)'}` }}>
        <p className="m-0 text-xs font-semibold uppercase tracking-[.16em]" style={{ color: isDark ? '#67d2ff' : '#087ea4' }}>Tere</p>
        <h1 className="mb-2 mt-4 text-xl font-semibold">{text}</h1>
        <p className="m-0 text-sm" style={{ color: isDark ? 'rgba(237,246,249,.62)' : '#607782' }}>Checking your access and assigned boards.</p>
        <div className="mt-6 h-1.5 overflow-hidden rounded-full" style={{ background: isDark ? 'rgba(214,235,244,.12)' : 'rgba(20,57,73,.12)' }}>
          <div className="h-full rounded-full transition-[width] duration-150" style={{ width: `${progress}%`, background: isDark ? '#67d2ff' : '#087ea4' }} />
        </div>
      </section>
    </main>
  );
}
