import { redirect } from 'next/navigation';

export default function HolidayManagementPage() {
  redirect('/dashboard/configuration?tab=holiday');
}
