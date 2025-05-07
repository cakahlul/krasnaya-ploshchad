import DashboardLayout from './dashboard/layout';

export default function Home({ children }: { children: React.ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
