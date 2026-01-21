'use client';
import LoadingBar from '@src/components/loadingBar';
import { FilterReport } from '@src/features/dashboard/components/filterReport';
import TeamTable from '@src/features/dashboard/components/teamTable';
import { useTeamReportTransform } from '@src/features/dashboard/hooks/useTeamReportTransform';
import RoleBasedRoute from '@src/components/RoleBasedRoute';

export default function Dashboard() {
  const { isLoading } = useTeamReportTransform();
  return (
    <RoleBasedRoute allowedRoles={['Lead', 'Member']}>
      <div className="relative p-6">
        {isLoading && <LoadingBar />}
        <FilterReport />
        <TeamTable />
      </div>
    </RoleBasedRoute>
  );
}
