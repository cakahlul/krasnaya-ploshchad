'use client';

import { useEffect, useState } from 'react';
import useUser from '@src/hooks/useUser';
import { useRouter } from 'next/navigation';
import LoadingBounce from '@src/components/loadingBounce';
import Sidebar from '@src/components/sidebar';
import Topbar from '@src/components/topbar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, loading } = useUser();
  const router = useRouter();
  const [queryClient] = useState(() => new QueryClient());

  useEffect(() => {
    if (!loading && !user) {
      router.push('/sign-in');
    }
  }, [user, loading, router]);

  if (loading) return <LoadingBounce />;
  if (!user) return null;
  return (
    <>
      <QueryClientProvider client={queryClient}>
        <div className="flex min-h-screen bg-white text-gray-800">
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          <div className="flex flex-col flex-1">
            <Topbar onMenuClick={() => setSidebarOpen(true)} />
            <main className="flex-1 p-6 bg-white">{children}</main>
            <footer className="bg-muted text-center text-sm py-1.5">
              Made with ☕, code, and probably too many semicolons by{' '}
              <strong>Esasjana</strong> © 2025
            </footer>
          </div>
        </div>
      </QueryClientProvider>
    </>
  );
}
