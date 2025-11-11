import { useQuery } from '@tanstack/react-query';
import useUser from './useUser';

async function checkIsAdmin(email: string | null): Promise<boolean> {
  if (!email) return false;

  try {
    const response = await fetch(`/api/auth/is-admin?email=${encodeURIComponent(email)}`);
    if (!response.ok) return false;

    const data = await response.json();
    return data.isAdmin || false;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

export function useIsAdmin() {
  const { getUserEmail } = useUser();
  const userEmail = getUserEmail();

  return useQuery({
    queryKey: ['isAdmin', userEmail],
    queryFn: () => checkIsAdmin(userEmail),
    enabled: !!userEmail,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}
