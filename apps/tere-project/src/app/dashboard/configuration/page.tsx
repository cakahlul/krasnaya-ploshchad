'use client';

import { Suspense } from 'react';
import RoleBasedRoute from '@src/components/RoleBasedRoute';
import LoadingBounce from '@src/components/loadingBounce';
import ConfigurationTabs from '@src/features/configuration/components/ConfigurationTabs';
import { useThemeColors } from '@src/hooks/useTheme';

const sans = "var(--font-space-grotesk), 'Space Grotesk', sans-serif";

function ConfigurationHeader() {
  const { titleCol, subCol } = useThemeColors();

  return (
    <div style={{ marginBottom: 18 }}>
      <h2 style={{
        fontSize: 22,
        fontWeight: 700,
        color: titleCol,
        margin: 0,
        fontFamily: sans,
        letterSpacing: -0.3,
      }}>
        Configuration
      </h2>
      <p style={{
        color: subCol,
        margin: '4px 0 0',
        fontSize: 12.5,
        fontFamily: sans,
      }}>
        Manage system-wide settings
      </p>
    </div>
  );
}

export default function ConfigurationPage() {
  return (
    <RoleBasedRoute allowedRoles={['Lead']} redirectTo="/dashboard">
      <div className="p-8 max-w-[1400px] mx-auto min-h-screen">
        <ConfigurationHeader />
        <Suspense fallback={<LoadingBounce />}>
          <ConfigurationTabs />
        </Suspense>
      </div>
    </RoleBasedRoute>
  );
}
