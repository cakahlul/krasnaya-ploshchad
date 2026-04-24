'use client';

import RoleBasedRoute from '@src/components/RoleBasedRoute';
import TeamMembersPage from '@src/features/team-members/components/TeamMembersPage';

export default function Page() {
  return (
    <RoleBasedRoute allowedRoles={['Lead']} redirectTo="/dashboard">
      <TeamMembersPage />
    </RoleBasedRoute>
  );
}
