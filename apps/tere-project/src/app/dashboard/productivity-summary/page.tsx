'use client';

import RoleBasedRoute from '@src/components/RoleBasedRoute';
import ProductivitySummary from '@src/features/dashboard/components/ProductivitySummary';

export default function ProductivitySummaryPage() {
  return (
    <RoleBasedRoute allowedRoles={['Lead']} redirectTo="/dashboard">
      <ProductivitySummary />
    </RoleBasedRoute>
  );
}
