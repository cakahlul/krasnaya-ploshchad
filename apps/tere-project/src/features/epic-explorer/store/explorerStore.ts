'use client';
import { create } from 'zustand';

/**
 * Epic Explorer selection state (SLS-16796). Decouples ProjectSelect /
 * EpicSearch / detail area without prop drilling. Selecting a project clears
 * the epic selection (a stale epic key would 404 against a different project).
 */
type ExplorerState = {
  project: string | null;
  epicKey: string | null;
  setProject: (project: string | null) => void;
  setEpicKey: (epicKey: string | null) => void;
};

export const useExplorerStore = create<ExplorerState>(set => ({
  project: null,
  epicKey: null,
  setProject: project => set({ project, epicKey: null }),
  setEpicKey: epicKey => set({ epicKey }),
}));
