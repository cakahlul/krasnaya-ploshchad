'use client';
import LoadingBar from '@src/components/loadingBar';
import { MonthSelector } from '@src/features/talent-leave/components/MonthSelector';
import { LeaveCalendar } from '@src/features/talent-leave/components/LeaveCalendar';
import { LeaveModal } from '@src/features/talent-leave/components/LeaveModal';
import { useTalentLeaveStore } from '@src/features/talent-leave/store/talentLeaveStore';
import { useTalentLeave } from '@src/features/talent-leave/hooks/useTalentLeave';
import { useIsAdmin } from '@src/hooks/useIsAdmin';
import { Button } from 'antd';
import { useMemo } from 'react';

export default function TalentLeavePage() {
  const { openCreateModal, modalState, selectedMonthStart } = useTalentLeaveStore();
  const { isLoading, data: leaveRecords } = useTalentLeave();
  const { data: isAdmin = false } = useIsAdmin();

  // Calculate date range for display: day 1 of selected month to last day of next month
  const dateRange = useMemo(() => {
    const start = new Date(selectedMonthStart);
    start.setDate(1); // First day of selected month
    const startDate = start.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    const end = new Date(selectedMonthStart);
    end.setMonth(end.getMonth() + 2); // Move to month after next
    end.setDate(0); // Last day of next month
    const endDate = end.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    return `${startDate} - ${endDate}`;
  }, [selectedMonthStart]);

  // Find the leave record for edit mode
  const leaveRecord = useMemo(() => {
    if (modalState.mode === 'edit' && modalState.leaveId && leaveRecords) {
      return leaveRecords.find((record) => record.id === modalState.leaveId);
    }
    return undefined;
  }, [modalState.mode, modalState.leaveId, leaveRecords]);

  return (
    <div className="relative p-6">
      {isLoading && <LoadingBar />}

      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold">Talent Leave</h1>
          <p className="text-sm text-gray-600 mt-1">Showing data from {dateRange}</p>
        </div>
        <div className="flex gap-4 items-center">
          <MonthSelector />
          {isAdmin && (
            <Button type="primary" onClick={openCreateModal} aria-label="Add new leave record">
              Add Leave
            </Button>
          )}
        </div>
      </div>

      <LeaveCalendar />

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
