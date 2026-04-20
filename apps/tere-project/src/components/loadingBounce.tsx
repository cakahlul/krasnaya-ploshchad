'use client';

import LoadingScreen from './LoadingScreen';
import { useTheme } from '@src/hooks/useTheme';

export default function LoadingBounce() {
  const { theme } = useTheme();
  return <LoadingScreen onComplete={() => {}} theme={theme} />;
}
