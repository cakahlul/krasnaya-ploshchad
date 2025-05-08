'use client';
import LoadingBar from '@src/components/loadingBar';
import { FilterReport } from '@src/features/dashboard/components/filterReport';
import TeamTable from '@src/features/dashboard/components/teamTable';
import { useTeamReportTransform } from '@src/features/dashboard/hooks/useTeamReportTransform';

export default function Dashboard() {
  const { isLoading } = useTeamReportTransform();
  return (
    <div className="relative p-6">
      {isLoading && <LoadingBar />}
      <FilterReport />
      <TeamTable />
    </div>
  );
}
