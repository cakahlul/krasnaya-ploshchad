'use client';

import { useEffect, useRef, useState } from 'react';
import useUser from '@src/hooks/useUser';
import { useRouter, usePathname } from 'next/navigation';
import Sidebar from '@src/components/sidebar';
import Topbar from '@src/components/topbar';
import PageSkeleton from '@src/components/PageSkeleton';
import LoadingScreen from '@src/components/LoadingScreen';
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

  // Show animated loading screen on first load (once per browser tab)
  const [animationDone, setAnimationDone] = useState(() => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem('tere_loaded_v2') === '1';
  });

  const handleLoadingComplete = () => {
    setAnimationDone(true);
    sessionStorage.setItem('tere_loaded_v2', '1');
  };

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

  // First load: show animated loading screen
  if (!animationDone) {
    return <LoadingScreen onComplete={handleLoadingComplete} theme={theme} />;
  }

  // Subsequent loads: show loading screen while auth resolves
  if (loading) {
    return <LoadingScreen onComplete={() => {}} theme={theme} />;
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
