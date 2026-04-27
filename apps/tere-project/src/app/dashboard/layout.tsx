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
  const { pageBg, theme } = useThemeColors();

  // Show animated loading screen on first load (once per browser tab)
  const [animationDone, setAnimationDone] = useState(() => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem('tere_loaded_v2') === '1';
  });

  // Track when LoadingScreen animation finishes
  const [animFinished, setAnimFinished] = useState(animationDone);

  const handleLoadingComplete = () => {
    setAnimFinished(true);
    sessionStorage.setItem('tere_loaded_v2', '1');
  };

  // Only mark fully done when animation finished AND auth resolved
  useEffect(() => {
    if (animFinished && !loading && user) {
      setAnimationDone(true);
    }
  }, [animFinished, loading, user]);

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

  if (!loading && !user) return null;

  // Show loading screen: first visit animation OR auth still loading
  const showLoading = !animationDone || loading;
  // Only render app shell once user is authenticated (prevents 401 from hooks)
  const canRenderApp = !!user;

  return (
    <QueryClientProvider client={queryClient}>
      <App>
        <AxiosErrorInterceptor />
        {showLoading && (
          <LoadingScreen onComplete={handleLoadingComplete} theme={theme} />
        )}
        {canRenderApp && (
          <div
            className="min-h-screen overflow-hidden transition-colors duration-300"
            style={{
              background: pageBg,
              visibility: showLoading ? 'hidden' : 'visible',
              position: showLoading ? 'fixed' : undefined,
              inset: showLoading ? 0 : undefined,
            }}
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
        )}
      </App>
    </QueryClientProvider>
  );
}
