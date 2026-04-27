'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMemberProfile } from '@src/features/dashboard/hooks/useMemberProfile';
import LoadingScreen from './LoadingScreen';
import { useTheme } from '@src/hooks/useTheme';

interface RoleBasedRouteProps {
  children: React.ReactNode;
  allowedRoles: ('Lead' | 'Member')[];
  redirectTo?: string;
}

export default function RoleBasedRoute({
  children,
  allowedRoles,
  redirectTo = '/dashboard/reports',
}: RoleBasedRouteProps) {
  const { member, isLoading } = useMemberProfile();
  const router = useRouter();
  const { theme } = useTheme();

  const role = member ? (member.isLead ? 'Lead' : 'Member') : undefined;

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
