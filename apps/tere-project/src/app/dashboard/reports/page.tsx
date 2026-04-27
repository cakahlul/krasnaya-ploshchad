'use client';
import LoadingBar from '@src/components/loadingBar';
import { FilterReport } from '@src/features/dashboard/components/filterReport';
import TeamTable from '@src/features/dashboard/components/teamTable';
import { useTeamReportTransform } from '@src/features/dashboard/hooks/useTeamReportTransform';
import RoleBasedRoute from '@src/components/RoleBasedRoute';
import { useThemeColors } from '@src/hooks/useTheme';

export default function Dashboard() {
  const { isLoading } = useTeamReportTransform();
  const { titleCol, subCol } = useThemeColors();
  return (
    <RoleBasedRoute allowedRoles={['Lead', 'Member']}>
      <div className="relative p-6 tere-table tere-input">
        {isLoading && <LoadingBar />}
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
