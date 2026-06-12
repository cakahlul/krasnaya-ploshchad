'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useBoards } from './useBoards';
import { useMemberProfile } from './useMemberProfile';
import { useMultiSprintDataTransform } from './useMultiSprintDataTransform';
import { useTeamReportFilterStore } from '../store/teamReportFilterStore';
import { getKanbanDateRange } from '@shared/utils/kanban-cycle.util';

/**
 * Drives the one-shot auto-default selections (team / sprint / kanban date-range)
 * for the Team Reporting page, and exposes `isInitializing` so callers can keep
 * the loading state visible until those defaults have settled.
 */
export function useTeamReportAutoDefaults() {
  const { boards, isLoading: boardsLoading } = useBoards();
  const { member, teams: memberTeamShortNames, isLoading: memberLoading } = useMemberProfile();

  const selectedTeams = useTeamReportFilterStore(s => s.selectedTeams);
  const selectedSprints = useTeamReportFilterStore(s => s.selectedSprints);
  const { sprint, startDate, endDate } = useTeamReportFilterStore(s => s.selectedFilter);
  const setTeams = useTeamReportFilterStore(s => s.setTeams);
  const setSprints = useTeamReportFilterStore(s => s.setSprints);
  const setDateRangeFilter = useTeamReportFilterStore(s => s.setDateRangeFilter);

  const memberTeamSet = useMemo(
    () => new Set(memberTeamShortNames),
    [memberTeamShortNames],
  );

  const memberBoardIds = useMemo(
    () =>
      boards
        .filter(b => !b.isBugMonitoring && memberTeamSet.has(b.shortName))
        .map(b => b.boardId),
    [boards, memberTeamSet],
  );

  const nonKanbanTeamIds = useMemo(
    () => selectedTeams.filter(id => !boards.find(b => b.boardId === id)?.isKanban),
    [selectedTeams, boards],
  );

  const kanbanOnlyTeamIds = useMemo(
    () => selectedTeams.filter(id => boards.find(b => b.boardId === id)?.isKanban),
    [selectedTeams, boards],
  );

  const { sprints, isLoading: sprintsLoading } = useMultiSprintDataTransform(nonKanbanTeamIds);

  const shortNameMap = useMemo<Record<number, string>>(
    () => Object.fromEntries(boards.map(b => [b.boardId, b.shortName])),
    [boards],
  );

  const didInitTeamsRef = useRef(false);
  const didInitFilterRef = useRef(false);
  const lastAutoSetKeyRef = useRef<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  const memberBoardIdsKey = useMemo(
    () => [...memberBoardIds].sort((a, b) => a - b).join(','),
    [memberBoardIds],
  );
  const selectedTeamsKey = useMemo(
    () => [...selectedTeams].sort((a, b) => a - b).join(','),
    [selectedTeams],
  );

  // Step 1: auto-select user's teams (Lead + non-Lead).
  // Re-syncs while the user hasn't touched the team filter, so that if
  // `memberBoardIds` resolves incrementally (e.g. boards query finishes after
  // member query), all matching boards end up selected — not just the first batch.
  useEffect(() => {
    if (didInitTeamsRef.current) return;
    if (boardsLoading || memberLoading) return;
    if (!member) return;

    // Wait for boards to actually arrive — an empty array may just be the
    // first render before the query resolves.
    if (boards.length === 0) return;

    const lastAutoKey = lastAutoSetKeyRef.current;
    const userInteracted =
      lastAutoKey !== null && selectedTeamsKey !== lastAutoKey;

    if (userInteracted) {
      didInitTeamsRef.current = true;
      return;
    }

    // Pre-existing selection from another page/session — respect it.
    if (lastAutoKey === null && selectedTeams.length > 0) {
      didInitTeamsRef.current = true;
      return;
    }

    if (memberBoardIds.length === 0) {
      didInitTeamsRef.current = true;
      didInitFilterRef.current = true;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsInitializing(false);
      return;
    }

    // Only push to the store when the desired set actually differs — prevents
    // an infinite loop, but still re-syncs if memberBoardIds grew.
    if (selectedTeamsKey !== memberBoardIdsKey) {
      setTeams(memberBoardIds);
    }
    lastAutoSetKeyRef.current = memberBoardIdsKey;
  }, [
    boardsLoading,
    memberLoading,
    member,
    boards.length,
    memberBoardIds,
    memberBoardIdsKey,
    selectedTeams.length,
    selectedTeamsKey,
    setTeams,
  ]);

  // Step 2: auto-select active sprints OR kanban date range once teams are set.
  useEffect(() => {
    if (didInitFilterRef.current) return;
    if (selectedTeams.length === 0) return;

    const hasCommittedFilter = !!sprint || (!!startDate && !!endDate) || selectedSprints.length > 0;
    if (hasCommittedFilter) {
      didInitFilterRef.current = true;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsInitializing(false);
      return;
    }

    // Perf guard: skip sprint/date-range auto-fill when the user has 3+ teams.
    // The Jira fetch is expensive; let them pick a sprint manually until that
    // pipeline is faster. Team filter itself stays populated via step 1.
    if (selectedTeams.length > 2) {
      didInitFilterRef.current = true;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsInitializing(false);
      return;
    }

    const projectName = selectedTeams
      .map(id => shortNameMap[id])
      .filter(Boolean)
      .join(', ') || 'Multi-Team';

    if (nonKanbanTeamIds.length > 0) {
      // Wait until sprint list resolves before picking active sprints.
      if (sprintsLoading) return;
      const activeSprintIds = sprints
        .filter(s => s.state === 'active')
        .map(s => String(s.value));
      if (activeSprintIds.length > 0) {
        setSprints(activeSprintIds, projectName);
      }
      didInitFilterRef.current = true;
      setIsInitializing(false);
      return;
    }

    if (kanbanOnlyTeamIds.length > 0) {
      const { startDate: s, endDate: e } = getKanbanDateRange();
      setDateRangeFilter(s, e, projectName);
      didInitFilterRef.current = true;
      setIsInitializing(false);
      return;
    }

    // No applicable default.
    didInitFilterRef.current = true;
    setIsInitializing(false);
  }, [
    selectedTeams,
    sprint,
    startDate,
    endDate,
    selectedSprints.length,
    nonKanbanTeamIds.length,
    kanbanOnlyTeamIds.length,
    sprintsLoading,
    sprints,
    shortNameMap,
    setSprints,
    setDateRangeFilter,
  ]);

  return { isInitializing };
}
