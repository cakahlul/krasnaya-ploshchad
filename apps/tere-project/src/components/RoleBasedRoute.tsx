'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserAccess } from '@src/hooks/useUserAccess';
import { UserRole } from '@src/types/user-access.types';
import LoadingBounce from './loadingBounce';

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

  useEffect(() => {
    if (!isLoading && role && !allowedRoles.includes(role)) {
      router.push(redirectTo);
    }
  }, [role, isLoading, allowedRoles, redirectTo, router]);

  if (isLoading) {
    return <LoadingBounce />;
  }

  if (!role || !allowedRoles.includes(role)) {
    return null;
  }

  return <>{children}</>;
}
