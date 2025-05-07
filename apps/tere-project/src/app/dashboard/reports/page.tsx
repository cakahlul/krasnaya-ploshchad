'use client';
import { FilterReport } from '@src/features/dashboard/components/filterReport';
import TeamTable from '@src/features/dashboard/components/teamTable';

export default function Dashboard() {
  return (
    <>
      <FilterReport />
      <TeamTable></TeamTable>
    </>
  );
}
