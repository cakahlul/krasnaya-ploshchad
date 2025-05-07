'use client';
import { create } from 'zustand';

type FilterState = {
  board: { id: number; name: string };
  setSelectedBoard: (board: { id: number; name: string }) => void;
};

export const useSprintFilterStore = create<FilterState>(set => ({
  board: { id: 0, name: '' },
  setSelectedBoard: (board: { id: number; name: string }) => set({ board }),
}));
