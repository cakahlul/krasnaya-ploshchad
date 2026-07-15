'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useThemeColors } from '@src/hooks/useTheme';
import {
  CONFIG_TABS,
  DEFAULT_CONFIG_TAB,
  type ConfigTabId,
} from '@src/shared/constants/configuration-tabs';
import HolidayCalendar from '@src/features/holiday-management/components/HolidayCalendar';
import BulkInsert from '@src/features/holiday-management/components/BulkInsert';
import HolidayListView from '@src/features/holiday-management/components/HolidayListView';
import ComingSoon from './ComingSoon';
import WpWeightConfigPanel from './WpWeightConfigPanel';
import WpWeightAuditLogPanel from './WpWeightAuditLogPanel';
import HolidayAuditLogPanel from './HolidayAuditLogPanel';

const sans = "var(--font-space-grotesk), 'Space Grotesk', sans-serif";

type HolidayViewMode = 'list' | 'calendar';

function resolveTab(raw: string | null): ConfigTabId {
  return CONFIG_TABS.find(tab => tab.id === raw)?.id ?? DEFAULT_CONFIG_TAB;
}

export default function ConfigurationTabs() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = resolveTab(searchParams.get('tab'));
  const { accent, subCol, iconBg } = useThemeColors();
  const [holidayView, setHolidayView] = useState<HolidayViewMode>('list');

  const handleTabClick = (tabId: ConfigTabId) => {
    router.replace(`/dashboard/configuration?tab=${tabId}`, { scroll: false });
  };

  return (
    <div>
      <nav
        aria-label="Configuration sections"
        style={{
          display: 'flex',
          alignItems: 'center',
          background: iconBg,
          borderRadius: 10,
          padding: 3,
          gap: 2,
          marginBottom: 18,
          width: 'fit-content',
          maxWidth: '100%',
          overflowX: 'auto',
        }}
      >
        {CONFIG_TABS.map(tab => (
          <button
            key={tab.id}
            aria-current={activeTab === tab.id ? 'page' : undefined}
            onClick={() => handleTabClick(tab.id)}
            style={{
              padding: '6px 14px',
              borderRadius: 8,
              border: 'none',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 600,
              fontFamily: sans,
              background: activeTab === tab.id ? accent : 'transparent',
              color: activeTab === tab.id ? '#fff' : subCol,
              transition: 'all 0.15s',
              whiteSpace: 'nowrap',
            }}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {activeTab === 'holiday' && (
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              marginBottom: 14,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                background: iconBg,
                borderRadius: 10,
                padding: 3,
                gap: 2,
              }}
            >
              <button
                onClick={() => setHolidayView('list')}
                style={{
                  padding: '6px 14px',
                  borderRadius: 8,
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 600,
                  fontFamily: sans,
                  background: holidayView === 'list' ? accent : 'transparent',
                  color: holidayView === 'list' ? '#fff' : subCol,
                  transition: 'all 0.15s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                >
                  <line x1="2" y1="4" x2="14" y2="4" />
                  <line x1="2" y1="8" x2="14" y2="8" />
                  <line x1="2" y1="12" x2="14" y2="12" />
                </svg>
                List
              </button>
              <button
                onClick={() => setHolidayView('calendar')}
                style={{
                  padding: '6px 14px',
                  borderRadius: 8,
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 600,
                  fontFamily: sans,
                  background:
                    holidayView === 'calendar' ? accent : 'transparent',
                  color: holidayView === 'calendar' ? '#fff' : subCol,
                  transition: 'all 0.15s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="1.5" y="3" width="13" height="11" rx="1.5" />
                  <line x1="1.5" y1="7" x2="14.5" y2="7" />
                  <line x1="5" y1="1.5" x2="5" y2="4.5" />
                  <line x1="11" y1="1.5" x2="11" y2="4.5" />
                </svg>
                Calendar
              </button>
            </div>
          </div>

          {holidayView === 'list' ? (
            <HolidayListView />
          ) : (
            <div className="space-y-8">
              <HolidayCalendar />
              <BulkInsert />
            </div>
          )}

          <div style={{ marginTop: 24 }}>
            <HolidayAuditLogPanel />
          </div>
        </div>
      )}

      {activeTab === 'wp-weight' && <WpWeightConfigPanel />}
      {activeTab === 'target-wp' && <ComingSoon label="Target WP Config" />}
      {activeTab === 'audit-log' && <WpWeightAuditLogPanel />}
    </div>
  );
}
