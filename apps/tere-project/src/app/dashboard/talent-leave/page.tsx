'use client';
import LoadingBar from '@src/components/loadingBar';
import { DateRangePicker } from '@src/features/talent-leave/components/DateRangePicker';
import { LeaveCalendarSimple } from '@src/features/talent-leave/components/LeaveCalendarSimple';
import { LeaveListView } from '@src/features/talent-leave/components/LeaveListView';
import { LeaveModal } from '@src/features/talent-leave/components/LeaveModal';
import { ExportButton } from '@src/features/talent-leave/components/ExportButton';
import { ExportToast } from '@src/features/talent-leave/components/ExportToast';
import { useTalentLeaveStore } from '@src/features/talent-leave/store/talentLeaveStore';
import { useTalentLeave } from '@src/features/talent-leave/hooks/useTalentLeave';
import { useMemberProfile } from '@src/features/dashboard/hooks/useMemberProfile';
import RoleBasedRoute from '@src/components/RoleBasedRoute';
import { Button } from 'antd';
import { useMemo, useState } from 'react';
import { useThemeColors } from '@src/hooks/useTheme';

const sans = "var(--font-space-grotesk), 'Space Grotesk', sans-serif";

type ViewMode = 'calendar' | 'list';

export default function TalentLeavePage() {
  const { openCreateModal, modalState } = useTalentLeaveStore();
  const { isLoading, data: leaveRecords } = useTalentLeave();
  const { member } = useMemberProfile();
  const { accent, accentL, titleCol, subCol, isDark, cardBg, cardBrd, iconBg } = useThemeColors();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [toast, setToast] = useState<{
    show: boolean;
    type: 'success' | 'error';
    spreadsheetUrl?: string;
  }>({
    show: false,
    type: 'success',
  });

  const canEdit = !!member;

  const leaveRecord = useMemo(() => {
    if (modalState.mode === 'edit' && modalState.leaveId && leaveRecords) {
      return leaveRecords.find(record => record.id === modalState.leaveId);
    }
    return undefined;
  }, [modalState.mode, modalState.leaveId, leaveRecords]);

  return (
    <RoleBasedRoute allowedRoles={['Lead', 'Member']}>
      <div className="relative p-6 overflow-x-hidden tere-input tere-modal tere-table">
        {isLoading && <LoadingBar />}

        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: titleCol, margin: 0, fontFamily: sans, letterSpacing: -0.3 }}>
              Talent Leave
            </h2>
            <p style={{ color: subCol, margin: '4px 0 0', fontSize: 12.5, fontFamily: sans }}>
              Leave records and calendar overview
            </p>
            <div className="flex items-center gap-3 mt-3">
              <span style={{ color: subCol, fontSize: 12.5, fontFamily: sans }}>Showing data from</span>
              <DateRangePicker />
            </div>
            <p style={{
              color: isDark ? '#f87171' : '#dc2626',
              margin: '8px 0 0',
              fontSize: 12,
              fontStyle: 'italic',
              fontFamily: sans,
              opacity: isDark ? 0.85 : 1,
            }}>
              *Penghitungan jumlah berdasarkan total hari cuti yang diambil pada
              rentang tanggal yang ditampilkan tanpa menghitung hari libur.
            </p>
          </div>
          <div className="flex gap-3 items-center">
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

            <ExportButton
              onSuccess={(url) => {
                setToast({ show: true, type: 'success', spreadsheetUrl: url });
                setTimeout(() => setToast({ show: false, type: 'success' }), 8000);
              }}
              onError={() => {
                setToast({ show: true, type: 'error' });
                setTimeout(() => setToast({ show: false, type: 'error' }), 8000);
              }}
            />
            {canEdit && (
              <Button
                type="primary"
                onClick={openCreateModal}
                aria-label="Add new leave record"
                style={{
                  background: accent,
                  borderColor: accent,
                  fontFamily: sans,
                  fontWeight: 600,
                  borderRadius: 8,
                }}
              >
                Add Leave
              </Button>
            )}
          </div>
        </div>

        {viewMode === 'list' ? <LeaveListView /> : <LeaveCalendarSimple />}

        <ExportToast
          show={toast.show}
          type={toast.type}
          spreadsheetUrl={toast.spreadsheetUrl}
          onClose={() => setToast({ ...toast, show: false })}
        />

        <LeaveModal
          leaveRecord={
            leaveRecord
              ? {
                  id: leaveRecord.id,
                  name: leaveRecord.name,
                  team: leaveRecord.team,
                  leaveDate: leaveRecord.leaveDate,
                }
              : undefined
          }
          isAdmin={canEdit}
        />
      </div>
    </RoleBasedRoute>
  );
}
