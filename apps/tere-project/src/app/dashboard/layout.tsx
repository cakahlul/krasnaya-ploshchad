'use client';

import { useEffect, useRef, useState } from 'react';
import useUser from '@src/hooks/useUser';
import { useRouter, usePathname } from 'next/navigation';
import Sidebar from '@src/components/sidebar';
import Topbar from '@src/components/topbar';
import PageSkeleton from '@src/components/PageSkeleton';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App } from 'antd';
import AxiosErrorInterceptor from '@src/components/AxiosErrorInterceptor';
import { useThemeColors } from '@src/hooks/useTheme';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, loading } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const [queryClient] = useState(() => new QueryClient());
  const [pageLoading, setPageLoading] = useState(false);
  const prevPathnameRef = useRef(pathname);
  const { pageBg, isDark, theme } = useThemeColors();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/sign-in');
    }
  }, [user, loading, router]);

  // Page transition skeleton
  useEffect(() => {
    if (pathname !== prevPathnameRef.current) {
      prevPathnameRef.current = pathname;
      setPageLoading(true);
      const timer = setTimeout(() => setPageLoading(false), 380);
      return () => clearTimeout(timer);
    }
  }, [pathname]);

  if (loading) {
    return (
      <div
        className="flex items-center justify-center min-h-screen transition-colors duration-300"
        style={{ background: pageBg }}
      >
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-12 h-12 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : '#ebedf5', borderTopColor: isDark ? '#22b8d4' : '#1282a2' }}
          />
          <p className="text-sm font-medium" style={{ color: isDark ? 'rgba(255,255,255,0.4)' : '#9ca3af', fontFamily: "'Space Grotesk', sans-serif" }}>
            Loading workspace...
          </p>
        </div>
      </div>
    );
  }
  if (!user) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <App>
        <AxiosErrorInterceptor />
        <div
          className="min-h-screen overflow-hidden transition-colors duration-300"
          style={{ background: pageBg }}
        >
          <Sidebar
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />
          <Topbar onMenuClick={() => setSidebarOpen(true)} />

          {/* Main content area - offset for floating sidebar + topbar */}
          <div
            className="absolute top-0 bottom-0 overflow-y-auto"
            style={{
              left: 252,
              right: 0,
              paddingTop: 88,
              paddingLeft: 14,
              paddingRight: 14,
              paddingBottom: 14,
            }}
          >
            {pageLoading ? (
              <PageSkeleton theme={theme} />
            ) : (
              children
            )}
          </div>
        </div>
      </App>
    </QueryClientProvider>
  );
}
