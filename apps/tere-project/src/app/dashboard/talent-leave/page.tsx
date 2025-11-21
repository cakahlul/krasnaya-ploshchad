'use client';
import LoadingBar from '@src/components/loadingBar';
import { DateRangePicker } from '@src/features/talent-leave/components/DateRangePicker';
import { LeaveCalendarSimple } from '@src/features/talent-leave/components/LeaveCalendarSimple';
import { LeaveModal } from '@src/features/talent-leave/components/LeaveModal';
import { ExportButton } from '@src/features/talent-leave/components/ExportButton';
import { ExportToast } from '@src/features/talent-leave/components/ExportToast';
import { useTalentLeaveStore } from '@src/features/talent-leave/store/talentLeaveStore';
import { useTalentLeave } from '@src/features/talent-leave/hooks/useTalentLeave';
import { useIsAdmin } from '@src/hooks/useIsAdmin';
import { Button } from 'antd';
import { useMemo, useState } from 'react';

export default function TalentLeavePage() {
  const { openCreateModal, modalState } = useTalentLeaveStore();
  const { isLoading, data: leaveRecords } = useTalentLeave();
  const { data: isAdmin = false } = useIsAdmin();
  const [toast, setToast] = useState<{
    show: boolean;
    type: 'success' | 'error';
    spreadsheetUrl?: string;
  }>({
    show: false,
    type: 'success',
  });

  // Find the leave record for edit mode
  const leaveRecord = useMemo(() => {
    if (modalState.mode === 'edit' && modalState.leaveId && leaveRecords) {
      return leaveRecords.find(record => record.id === modalState.leaveId);
    }
    return undefined;
  }, [modalState.mode, modalState.leaveId, leaveRecords]);

  return (
    <div className="relative p-6 overflow-x-hidden">
      {isLoading && <LoadingBar />}

      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Talent Leave</h1>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-sm text-gray-600">Showing data from</p>
              <DateRangePicker />
            </div>
            <p className="text-sm text-red-600 italic mt-2">
              *Penghitungan jumlah berdasarkan total hari cuti yang diambil pada
              rentang tanggal yang ditampilkan tanpa menghitung hari libur.
            </p>
          </div>
        </div>
        <div className="flex gap-4 items-center">
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
          {isAdmin && (
            <Button
              type="primary"
              onClick={openCreateModal}
              aria-label="Add new leave record"
            >
              Add Leave
            </Button>
          )}
        </div>
      </div>

      <LeaveCalendarSimple />

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
                role: leaveRecord.role,
                leaveDate: leaveRecord.leaveDate,
              }
            : undefined
        }
        isAdmin={isAdmin}
      />
    </div>
  );
}
