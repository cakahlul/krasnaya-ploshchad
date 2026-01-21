'use client';
import { create } from 'zustand';

interface TalentLeaveState {
  selectedMonthStart: Date;
  setSelectedMonthStart: (date: Date) => void;

  // Date range for calendar view
  dateRangeStart: Date;
  dateRangeEnd: Date;
  setDateRange: (start: Date, end: Date) => void;

  modalState: {
    open: boolean;
    mode: 'create' | 'edit';
    leaveId?: string;
  };
  openCreateModal: () => void;
  openEditModal: (leaveId: string) => void;
  closeModal: () => void;
}

// Helper to calculate default date range (1 month)
const getDefaultDateRange = () => {
  const start = new Date();
  start.setDate(1); // First day of current month

  const end = new Date(start);
  end.setMonth(end.getMonth() + 1); // Move to next month
  end.setDate(0); // Last day of current month

  return { start, end };
};

const defaultRange = getDefaultDateRange();

export const useTalentLeaveStore = create<TalentLeaveState>((set) => ({
  // Default to first day of current month (kept for backward compatibility)
  selectedMonthStart: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  setSelectedMonthStart: (date: Date) =>
    set({ selectedMonthStart: date }),

  // Date range state
  dateRangeStart: defaultRange.start,
  dateRangeEnd: defaultRange.end,
  setDateRange: (start: Date, end: Date) =>
    set({
      dateRangeStart: start,
      dateRangeEnd: end,
      selectedMonthStart: start // Update selectedMonthStart for backward compatibility
    }),

  // Modal state - initially closed with 'create' mode
  modalState: {
    open: false,
    mode: 'create',
  },
  openCreateModal: () =>
    set({ modalState: { open: true, mode: 'create' } }),
  openEditModal: (leaveId: string) =>
    set({ modalState: { open: true, mode: 'edit', leaveId } }),
  closeModal: () =>
    set({ modalState: { open: false, mode: 'create' } }),
}));
