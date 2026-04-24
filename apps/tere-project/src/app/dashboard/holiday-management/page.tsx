'use client';

import { useMemberProfile } from '@src/features/dashboard/hooks/useMemberProfile';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import LoadingBounce from '@src/components/loadingBounce';
import HolidayCalendar from '@src/features/holiday-management/components/HolidayCalendar';
import BulkInsert from '@src/features/holiday-management/components/BulkInsert';
import { Calendar } from 'lucide-react';

export default function HolidayManagementPage() {
  const { member, isLoading } = useMemberProfile();
  const router = useRouter();
  const isLead = member?.isLead ?? false;

  useEffect(() => {
    if (!isLoading && !isLead) {
      router.push('/dashboard');
    }
  }, [isLead, isLoading, router]);

  if (isLoading) return <LoadingBounce />;
  if (!isLead) return null;

  return (
    <div className="p-8 max-w-[1400px] mx-auto min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 animate-fade-in-down">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-cyan-500 flex items-center gap-3">
            <Calendar className="text-purple-600" size={32} />
            Holiday Management
          </h1>
          <p className="text-gray-500 mt-2">
            Configure system-wide national holidays for productivity tracking.
          </p>
        </div>
      </div>

      <div className="animate-fade-in-up space-y-8">
        <HolidayCalendar />
        <BulkInsert />
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fade-in-down {
          0% { opacity: 0; transform: translateY(-10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-in-up {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-down { animation: fade-in-down 0.5s ease-out forwards; }
        .animate-fade-in-up { animation: fade-in-up 0.5s ease-out forwards; }
      `}} />
    </div>
  );
}
