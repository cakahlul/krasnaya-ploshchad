import { useQuery } from '@tanstack/react-query';
import { userAccessClient } from '@src/lib/user-access.client';
import { UserAccess, UserRole } from '@src/types/user-access.types';
import useUser from './useUser';

export function useUserAccess() {
  const { user } = useUser();
  const userEmail = user?.email;

  const { data, isLoading, error } = useQuery<UserAccess>({
    queryKey: ['user-access', userEmail],
    queryFn: () => userAccessClient.getUserAccess(userEmail!),
    enabled: !!userEmail, // Only fetch if user email is available
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    retry: 1,
  });

  return {
    userAccess: data,
    role: data?.role as UserRole | undefined,
    isLoading,
    error,
  };
}
