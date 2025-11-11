'use client';

import { useEffect, useState } from 'react';
import useUser from '@src/hooks/useUser';
import { useRouter } from 'next/navigation';
import LoadingBounce from '@src/components/loadingBounce';
import Sidebar from '@src/components/sidebar';
import Topbar from '@src/components/topbar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App } from 'antd';

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
        <App>
          <div className="flex min-h-screen bg-white text-gray-800">
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <div className="flex flex-col flex-1">
              <Topbar onMenuClick={() => setSidebarOpen(true)} />
              <main className="flex-1 bg-white">{children}</main>
              <footer className="shadow-sm bg-white/60 backdrop-blur-sm text-center text-xs py-1.5">
                Built with ⚒️ by{' '}
                <strong className="text-primary">Esasjana</strong> – still cooler
                than your average dev 😎
              </footer>
            </div>
          </div>
        </App>
      </QueryClientProvider>
    </>
  );
}
