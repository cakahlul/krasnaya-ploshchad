'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserAccess } from '@src/hooks/useUserAccess';
import { UserRole } from '@src/types/user-access.types';
import LoadingScreen from './LoadingScreen';
import { useTheme } from '@src/hooks/useTheme';

interface RoleBasedRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  redirectTo?: string;
}

export default function RoleBasedRoute({
  children,
  allowedRoles,
  redirectTo = '/dashboard/reports',
}: RoleBasedRouteProps) {
  const { role, isLoading } = useUserAccess();
  const router = useRouter();
  const { theme } = useTheme();

  useEffect(() => {
    if (!isLoading && role && !allowedRoles.includes(role)) {
      router.push(redirectTo);
    }
  }, [role, isLoading, allowedRoles, redirectTo, router]);

  if (isLoading) {
    return <LoadingScreen onComplete={() => {}} theme={theme} />;
  }

  if (!role || !allowedRoles.includes(role)) {
    return null;
  }

  return <>{children}</>;
}
