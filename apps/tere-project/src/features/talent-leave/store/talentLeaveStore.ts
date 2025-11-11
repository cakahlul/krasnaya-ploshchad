'use client';
import { create } from 'zustand';

interface TalentLeaveState {
  selectedMonthStart: Date;
  setSelectedMonthStart: (date: Date) => void;

  modalState: {
    open: boolean;
    mode: 'create' | 'edit';
    leaveId?: string;
  };
  openCreateModal: () => void;
  openEditModal: (leaveId: string) => void;
  closeModal: () => void;
}

export const useTalentLeaveStore = create<TalentLeaveState>((set) => ({
  // Default to first day of current month
  selectedMonthStart: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  setSelectedMonthStart: (date: Date) =>
    set({ selectedMonthStart: date }),

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
