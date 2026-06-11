'use client';
import { useState, useCallback, useEffect, useRef } from 'react';
import LoadingBar from '@src/components/loadingBar';
import { FilterReport } from '@src/features/dashboard/components/filterReport';
import TeamTable from '@src/features/dashboard/components/teamTable';
import { useTeamReportTransform } from '@src/features/dashboard/hooks/useTeamReportTransform';
import { useTeamReportAutoDefaults } from '@src/features/dashboard/hooks/useTeamReportAutoDefaults';
import RoleBasedRoute from '@src/components/RoleBasedRoute';
import { useThemeColors } from '@src/hooks/useTheme';

export default function Dashboard() {
  const { isLoading } = useTeamReportTransform();
  const { isInitializing } = useTeamReportAutoDefaults();
  const { titleCol, subCol } = useThemeColors();
  const effectiveLoading = isLoading || isInitializing;
  const [showLoading, setShowLoading] = useState(true);
  const prevLoading = useRef(effectiveLoading);

  // Re-show loading screen when a new fetch starts (e.g., filter change)
  useEffect(() => {
    if (effectiveLoading && !prevLoading.current) {
      setShowLoading(true);
    }
    prevLoading.current = effectiveLoading;
  }, [effectiveLoading]);

  const handleLoadingComplete = useCallback(() => {
    setShowLoading(false);
  }, []);

  return (
    <RoleBasedRoute allowedRoles={['Lead', 'Member']}>
      <div className="relative p-6 tere-table tere-input">
        {showLoading && (
          <LoadingBar
            isDataReady={!effectiveLoading}
            onComplete={handleLoadingComplete}
          />
        )}
        <div style={{ marginBottom: 18 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: titleCol, margin: 0, fontFamily: "'Space Grotesk',sans-serif", letterSpacing: -0.3 }}>
            Team Reporting
          </h2>
          <p style={{ color: subCol, margin: '4px 0 0', fontSize: 12.5, fontFamily: "'Space Grotesk',sans-serif" }}>
            Sprint performance overview · All teams
          </p>
        </div>
        <FilterReport />
        <TeamTable />
      </div>
    </RoleBasedRoute>
  );
}
