'use client';
import TeamTable from '@src/features/dashboard/components/teamTable';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export default function Dashboard() {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={queryClient}>
      {<TeamTable></TeamTable>}
    </QueryClientProvider>
  );
}
