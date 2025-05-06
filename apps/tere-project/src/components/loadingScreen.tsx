'use client';

import { Spin } from 'antd';

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-muted bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
      <Spin size="large" style={{ color: 'var(--color-primary)' }} />
    </div>
  );
}
