'use client';
import { create } from 'zustand';

/**
 * Epic Explorer selection state (SLS-16796). Decouples ProjectSelect /
 * EpicSearch / detail area without prop drilling. Selecting a project clears
 * the epic selection (a stale epic key would 404 against a different project).
 */
type ExplorerState = {
  projects: string[];
  epicKeys: string[];
  setProjects: (projects: string[]) => void;
  setEpicKeys: (epicKeys: string[]) => void;
};

export const useExplorerStore = create<ExplorerState>(set => ({
  projects: [],
  epicKeys: [],
  setProjects: projects => set({ projects, epicKeys: [] }),
  setEpicKeys: epicKeys => set({ epicKeys }),
}));
