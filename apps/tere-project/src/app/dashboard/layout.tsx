'use client';

import { useEffect, useRef, useState } from 'react';
import useUser from '@src/hooks/useUser';
import { useRouter, usePathname } from 'next/navigation';
import Sidebar from '@src/components/sidebar';
import Topbar from '@src/components/topbar';
import PageSkeleton from '@src/components/PageSkeleton';
import LoadingScreen from '@src/components/LoadingScreen';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App, ConfigProvider, theme as antdTheme } from 'antd';
import AxiosErrorInterceptor from '@src/components/AxiosErrorInterceptor';
import { useThemeColors } from '@src/hooks/useTheme';
import type { Theme } from '@src/hooks/useTheme';
import { useMemberProfile } from '@src/features/dashboard/hooks/useMemberProfile';
import { logout } from '@src/lib/auth';

function NotRegisteredScreen({ email }: { email: string | null }) {
  const router = useRouter();

  const handleSignOut = async () => {
    await logout();
    router.push('/sign-in');
  };

  return (
    <div className="grid min-h-screen place-items-center p-4">
      <div className="liquid-glass max-w-md rounded-[26px] p-8 text-center">
        <div className="mx-auto mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-amber-400/20 text-2xl">!</div>
        <h2 className="mb-2 text-xl font-semibold">Account not registered</h2>
        <p className="mb-6 text-sm text-[var(--lg-muted)]">
          Your account{email ? ` (${email})` : ''} is not registered as a team member yet.
          Please contact your admin to be added.
        </p>
        <button onClick={handleSignOut} className="glass-button is-primary w-full">Sign out</button>
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
}: {
  children: React.ReactNode;
  showLoading: boolean;
  isDataReady: boolean;
  handleLoadingComplete: () => void;
  theme: Theme;
}) {
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
      <div className={`liquid-desktop ${showLoading ? 'is-loading' : ''}`}>
        <div className="wallpaper-shape wallpaper-shape-a" />
        <div className="wallpaper-shape wallpaper-shape-b" />
        <div className="wallpaper-shape wallpaper-shape-c" />
        {notRegistered ? (
          <NotRegisteredScreen email={user?.email ?? null} />
        ) : (
          <>
            <Sidebar />
            <Topbar />
            <main className="dashboard-scroll">
              {pageLoading ? <PageSkeleton theme={theme} /> : children}
            </main>
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
  const { theme } = useThemeColors();

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
      <ConfigProvider theme={{
        algorithm: theme === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        token: {
          colorPrimary: '#0a84ff',
          colorBgContainer: theme === 'dark' ? 'rgba(20,27,39,.64)' : 'rgba(255,255,255,.62)',
          colorBorder: theme === 'dark' ? 'rgba(255,255,255,.14)' : 'rgba(255,255,255,.72)',
          borderRadius: 12,
          borderRadiusLG: 18,
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", sans-serif',
        },
      }}>
        <App>
          <AxiosErrorInterceptor />
          {canRenderApp && (
            <DashboardShell
              showLoading={showLoading}
              isDataReady={!loading}
              handleLoadingComplete={handleLoadingComplete}
              theme={theme}
            >
              {children}
            </DashboardShell>
          )}
        </App>
      </ConfigProvider>
    </QueryClientProvider>
  );
}
