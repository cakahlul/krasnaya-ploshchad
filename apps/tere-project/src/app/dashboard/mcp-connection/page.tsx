'use client';

import RoleBasedRoute from '@src/components/RoleBasedRoute';
import McpConnectionPage from '@src/features/api-keys/components/McpConnectionPage';

export default function Page() {
  return (
    <RoleBasedRoute allowedRoles={['Lead']} redirectTo="/dashboard">
      <McpConnectionPage />
    </RoleBasedRoute>
  );
}
