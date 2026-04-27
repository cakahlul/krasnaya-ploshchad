'use client';

import { useMemberProfile } from '@src/features/dashboard/hooks/useMemberProfile';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import LoadingBounce from '@src/components/loadingBounce';
import HolidayCalendar from '@src/features/holiday-management/components/HolidayCalendar';
import BulkInsert from '@src/features/holiday-management/components/BulkInsert';
import HolidayListView from '@src/features/holiday-management/components/HolidayListView';
import { useThemeColors } from '@src/hooks/useTheme';

const sans = "var(--font-space-grotesk), 'Space Grotesk', sans-serif";

type ViewMode = 'list' | 'calendar';

export default function HolidayManagementPage() {
  const { member, isLoading } = useMemberProfile();
  const router = useRouter();
  const isLead = member?.isLead ?? false;
  const { accent, titleCol, subCol, iconBg } = useThemeColors();
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  useEffect(() => {
    if (!isLoading && !isLead) {
      router.push('/dashboard');
    }
  }, [isLead, isLoading, router]);

  if (isLoading) return <LoadingBounce />;
  if (!isLead) return null;

  return (
    <div className="p-8 max-w-[1400px] mx-auto min-h-screen">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
        <div>
          <h2 style={{
            fontSize: 22,
            fontWeight: 700,
            color: titleCol,
            margin: 0,
            fontFamily: sans,
            letterSpacing: -0.3,
          }}>
            Holiday Management
          </h2>
          <p style={{
            color: subCol,
            margin: '4px 0 0',
            fontSize: 12.5,
            fontFamily: sans,
          }}>
            Configure system-wide national holidays for productivity tracking
          </p>
        </div>

        {/* View Toggle */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          background: iconBg,
          borderRadius: 10,
          padding: 3,
          gap: 2,
        }}>
          <button
            onClick={() => setViewMode('list')}
            style={{
              padding: '6px 14px',
              borderRadius: 8,
              border: 'none',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 600,
              fontFamily: sans,
              background: viewMode === 'list' ? accent : 'transparent',
              color: viewMode === 'list' ? '#fff' : subCol,
              transition: 'all 0.15s',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <line x1="2" y1="4" x2="14" y2="4" />
              <line x1="2" y1="8" x2="14" y2="8" />
              <line x1="2" y1="12" x2="14" y2="12" />
            </svg>
            List
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            style={{
              padding: '6px 14px',
              borderRadius: 8,
              border: 'none',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 600,
              fontFamily: sans,
              background: viewMode === 'calendar' ? accent : 'transparent',
              color: viewMode === 'calendar' ? '#fff' : subCol,
              transition: 'all 0.15s',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="1.5" y="3" width="13" height="11" rx="1.5" />
              <line x1="1.5" y1="7" x2="14.5" y2="7" />
              <line x1="5" y1="1.5" x2="5" y2="4.5" />
              <line x1="11" y1="1.5" x2="11" y2="4.5" />
            </svg>
            Calendar
          </button>
        </div>
      </div>

      {viewMode === 'list' ? (
        <HolidayListView />
      ) : (
        <div className="space-y-8">
          <HolidayCalendar />
          <BulkInsert />
        </div>
      )}
    </div>
  );
}
