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
import type { Theme } from '@src/hooks/useTheme';
import { useMemberProfile } from '@src/features/dashboard/hooks/useMemberProfile';
import { logout } from '@src/lib/auth';

function NotRegisteredScreen({ email }: { email: string | null }) {
  const { isDark } = useThemeColors();
  const router = useRouter();

  const handleSignOut = async () => {
    await logout();
    router.push('/sign-in');
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: isDark ? 'linear-gradient(180deg, #0d1829 0%, #0f1f36 100%)' : '#f9fafb' }}
    >
      <div
        className="max-w-md w-full mx-4 rounded-2xl p-8 text-center"
        style={{
          background: isDark ? 'rgba(255,255,255,0.04)' : '#ffffff',
          border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e5e7eb'}`,
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        }}
      >
        <div className="text-4xl mb-4">🚧</div>
        <h2
          className="text-xl font-bold mb-2"
          style={{ color: isDark ? '#ffffff' : '#111827' }}
        >
          Account Not Registered
        </h2>
        <p className="text-sm mb-4" style={{ color: isDark ? 'rgba(255,255,255,0.5)' : '#6b7280' }}>
          Your account{email ? ` (${email})` : ''} is not registered as a team member yet.
          Please contact your admin to be added.
        </p>
        <button
          onClick={handleSignOut}
          className="w-full rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
          style={{ background: 'linear-gradient(135deg, #1282a2, #22b8d4)' }}
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}

function DashboardShell({
  children,
  showLoading,
  isDataReady,
  handleLoadingComplete,
  theme,
  pageBg,
}: {
  children: React.ReactNode;
  showLoading: boolean;
  isDataReady: boolean;
  handleLoadingComplete: () => void;
  theme: Theme;
  pageBg: string;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const [pageLoading, setPageLoading] = useState(false);
  const prevPathnameRef = useRef(pathname);
  const { member, isLoading: memberLoading } = useMemberProfile();
  const { user } = useUser();

  useEffect(() => {
    if (pathname !== prevPathnameRef.current) {
      prevPathnameRef.current = pathname;
      setPageLoading(true);
      const timer = setTimeout(() => setPageLoading(false), 380);
      return () => clearTimeout(timer);
    }
  }, [pathname]);

  const notRegistered = !memberLoading && !showLoading && member === null;

  return (
    <>
      {showLoading && (
        <LoadingScreen onComplete={handleLoadingComplete} isDataReady={isDataReady} theme={theme} />
      )}
      <div
        className="min-h-screen overflow-hidden transition-colors duration-300"
        style={{
          background: pageBg,
          visibility: showLoading ? 'hidden' : 'visible',
          position: showLoading ? 'fixed' : undefined,
          inset: showLoading ? 0 : undefined,
        }}
      >
        {notRegistered ? (
          <NotRegisteredScreen email={user?.email ?? null} />
        ) : (
          <>
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <Topbar onMenuClick={() => setSidebarOpen(true)} />
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
              {pageLoading ? <PageSkeleton theme={theme} /> : children}
            </div>
          </>
        )}
      </div>
    </>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useUser();
  const router = useRouter();
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        // Keep data fresh for 5 minutes before background refetch
        staleTime: 5 * 60 * 1000,
        // Garbage collect unused query data after 10 minutes
        gcTime: 10 * 60 * 1000,
      },
    },
  }));
  const { pageBg, theme } = useThemeColors();

  const [animFinished, setAnimFinished] = useState(() => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem('tere_loaded_v2') === '1';
  });

  const handleLoadingComplete = () => {
    setAnimFinished(true);
    sessionStorage.setItem('tere_loaded_v2', '1');
  };

  useEffect(() => {
    if (!loading && !user) {
      router.push('/sign-in');
    }
  }, [user, loading, router]);

  if (!loading && !user) return null;

  const showLoading = !animFinished || loading;
  const canRenderApp = !!user;

  return (
    <QueryClientProvider client={queryClient}>
      <App>
        <AxiosErrorInterceptor />
        {canRenderApp && (
          <DashboardShell
            showLoading={showLoading}
            isDataReady={!loading}
            handleLoadingComplete={handleLoadingComplete}
            theme={theme}
            pageBg={pageBg}
          >
            {children}
          </DashboardShell>
        )}
      </App>
    </QueryClientProvider>
  );
}
