'use client';

import LoadingScreen from './LoadingScreen';
import { useTheme } from '@src/hooks/useTheme';

interface LoadingBarProps {
  isDataReady?: boolean;
  onComplete?: () => void;
}

export default function LoadingBar({ isDataReady = false, onComplete = () => {} }: LoadingBarProps) {
  const { theme } = useTheme();
  return <LoadingScreen onComplete={onComplete} isDataReady={isDataReady} theme={theme} />;
}
