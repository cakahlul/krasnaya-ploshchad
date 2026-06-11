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
  const [isInitializing, setIsInitializing] = useState(true);

  // Step 1: auto-select user's teams (Lead + non-Lead) on first load.
  useEffect(() => {
    if (didInitTeamsRef.current) return;
    if (boardsLoading || memberLoading) return;
    if (!member) return;
    if (selectedTeams.length > 0) {
      didInitTeamsRef.current = true;
      return;
    }
    if (memberBoardIds.length === 0) {
      // Nothing to default to — end initialization early.
      didInitTeamsRef.current = true;
      didInitFilterRef.current = true;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsInitializing(false);
      return;
    }
    setTeams(memberBoardIds);
    didInitTeamsRef.current = true;
  }, [
    boardsLoading,
    memberLoading,
    member,
    memberBoardIds,
    selectedTeams.length,
    setTeams,
  ]);

  // Step 2: auto-select active sprints OR kanban date range once teams are set.
  useEffect(() => {
    if (didInitFilterRef.current) return;
    if (!didInitTeamsRef.current) return;
    if (selectedTeams.length === 0) return;

    const hasCommittedFilter = !!sprint || (!!startDate && !!endDate) || selectedSprints.length > 0;
    if (hasCommittedFilter) {
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
