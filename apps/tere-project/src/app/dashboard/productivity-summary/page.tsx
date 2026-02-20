import ProductivitySummary from '@src/features/dashboard/components/ProductivitySummary';

export const metadata = {
  title: 'Productivity Summary',
  description: 'Monthly report of performance productivity for all teams.',
};

export default function ProductivitySummaryPage() {
  return <ProductivitySummary />;
}
