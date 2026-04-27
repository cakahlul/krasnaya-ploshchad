'use client';

import RoleBasedRoute from '@src/components/RoleBasedRoute';
import { useBugMonitoring } from '@src/features/bug-monitoring/hooks/useBugMonitoring';
import BugStatisticsView from '@src/features/bug-monitoring/components/BugStatistics';
import BugListView from '@src/features/bug-monitoring/components/BugListView';
import dynamic from 'next/dynamic';

const BugTrendChart = dynamic(
  () => import('@src/features/bug-monitoring/components/BugTrendChart'),
  { ssr: false }
);
import BugTable from '@src/features/bug-monitoring/components/BugTable';
import { useBoards } from '@src/features/dashboard/hooks/useBoards';
import { Alert } from 'antd';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useMemo } from 'react';
import { useThemeColors } from '@src/hooks/useTheme';

const BOARD_STYLES: Record<string, { icon: string; gradient: string; accent: string }> = {
  BUZZ: { icon: '\u26A1', gradient: 'from-violet-500 to-purple-600', accent: 'violet' },
  INCF: { icon: '\uD83C\uDFE6', gradient: 'from-cyan-500 to-blue-600', accent: 'cyan' },
};
const DEFAULT_STYLE = { icon: '\uD83D\uDC1B', gradient: 'from-gray-500 to-slate-600', accent: 'gray' };

const ACTIVE_STATUSES = ['To Do', 'In Progress', 'Ready to Test', 'Detected', 'In Review'];

function BoardContent({ boardId, showAllBugs }: { boardId: number; showAllBugs: boolean }) {
  const { data, isLoading, error } = useBugMonitoring(boardId);
  const { cardBg, cardBrd, subCol } = useThemeColors();

  const displayStatistics = useMemo(() => {
    if (!data) return null;

    if (showAllBugs) return data.statistics;

    const activeBugsCount = data.bugsByStatus.reduce((sum, group) => sum + group.count, 0);
    const activeCountByStatus: Record<string, number> = {};
    ACTIVE_STATUSES.forEach(status => {
      const group = data.bugsByStatus.find(g => g.status === status);
      if (group) activeCountByStatus[status] = group.count;
    });
    const activePriorityMap: Record<string, number> = {};
    data.bugsByStatus.forEach(group => {
      group.bugs.forEach(bug => {
        activePriorityMap[bug.priority] = (activePriorityMap[bug.priority] || 0) + 1;
      });
    });
    const activePriorityDistribution = Object.entries(activePriorityMap).map(([priority, count]) => ({ priority, count }));
    let totalDaysOpen = 0;
    let bugCount = 0;
    data.bugsByStatus.forEach(group => {
      group.bugs.forEach(bug => { totalDaysOpen += bug.daysOpen; bugCount++; });
    });
    const activeAverageDaysOpen = bugCount > 0 ? totalDaysOpen / bugCount : 0;
    const activeAssigneeMap: Record<string, number> = {};
    data.bugsByStatus.forEach(group => {
      group.bugs.forEach(bug => {
        const assignee = bug.assignee || 'Unassigned';
        activeAssigneeMap[assignee] = (activeAssigneeMap[assignee] || 0) + 1;
      });
    });

    return {
      totalCount: activeBugsCount,
      countByStatus: activeCountByStatus,
      priorityDistribution: activePriorityDistribution,
      averageDaysOpen: activeAverageDaysOpen,
      assigneeDistribution: activeAssigneeMap,
    };
  }, [data, showAllBugs]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="animate-pulse rounded-xl"
              style={{ background: cardBg, border: `1px solid ${cardBrd}`, height: 150 }}
            />
          ))}
        </div>
        <div
          className="animate-pulse rounded-xl"
          style={{ background: cardBg, border: `1px solid ${cardBrd}`, height: 200 }}
        />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="animate-pulse rounded-lg"
              style={{ background: cardBg, border: `1px solid ${cardBrd}`, height: 24 }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        message="Error Loading Bugs"
        description={error instanceof Error ? error.message : 'Failed to fetch bug data from Jira. Please try again.'}
        type="error"
        showIcon
        className="mb-6"
      />
    );
  }

  if (data && data.statistics.totalCount === 0) {
    return (
      <Alert
        message="No Bugs Found"
        description="There are currently no bugs in this project."
        type="success"
        showIcon
        style={{
          marginTop: 24,
          borderRadius: 12,
          background: cardBg,
          borderColor: cardBrd,
          color: subCol,
        }}
      />
    );
  }

  if (!data || !displayStatistics) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="space-y-6"
    >
      <BugStatisticsView statistics={displayStatistics} />
      <BugTrendChart bugs={data.allBugs} showActiveOnly={!showAllBugs} />
      <BugTable bugsByStatus={data.bugsByStatus} />
    </motion.div>
  );
}

export default function BugMonitoringPage() {
  const { boards, isLoading: boardsLoading } = useBoards();
  const bugBoards = useMemo(() => boards.filter(b => b.isBugMonitoring), [boards]);
  const [activeBoard, setActiveBoard] = useState<number | null>(null);
  const [showAllBugs, setShowAllBugs] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'charts'>('list');
  const {
    accent, accentL, cardBg, cardBrd, titleCol, subCol, rowCol, isDark, iconBg,
  } = useThemeColors();

  // Auto-select first bug board once loaded
  const selectedBoard = activeBoard ?? bugBoards[0]?.boardId ?? null;

  const toggleTrackBg = isDark ? 'rgba(255,255,255,0.06)' : '#f3f4f6';
  const toggleThumbBg = cardBg;
  const toggleThumbBrd = cardBrd;

  return (
    <RoleBasedRoute allowedRoles={['Lead']}>
      <div className="relative p-6 tere-table tere-tabs tere-input">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6 flex items-start justify-between">
            <div style={{ marginBottom: 18 }}>
              <h2
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  color: titleCol,
                  margin: 0,
                  fontFamily: "'Space Grotesk',sans-serif",
                  letterSpacing: -0.3,
                }}
              >
                Bug Monitoring
              </h2>
              <p
                style={{
                  color: subCol,
                  margin: '4px 0 0',
                  fontSize: 12.5,
                  fontFamily: "'Space Grotesk',sans-serif",
                }}
              >
                Real-time production bug tracking
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* View Mode Toggle */}
              <div
                style={{
                  background: iconBg,
                  borderRadius: 10,
                  padding: 3,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                }}
              >
                <button
                  onClick={() => setViewMode('list')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 5,
                    padding: '6px 12px',
                    borderRadius: 8,
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: 600,
                    fontFamily: "'Space Grotesk',sans-serif",
                    background: viewMode === 'list' ? accent : 'transparent',
                    color: viewMode === 'list' ? '#fff' : subCol,
                    transition: 'all 0.15s',
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="8" y1="6" x2="21" y2="6" />
                    <line x1="8" y1="12" x2="21" y2="12" />
                    <line x1="8" y1="18" x2="21" y2="18" />
                    <line x1="3" y1="6" x2="3.01" y2="6" />
                    <line x1="3" y1="12" x2="3.01" y2="12" />
                    <line x1="3" y1="18" x2="3.01" y2="18" />
                  </svg>
                  List
                </button>
                <button
                  onClick={() => setViewMode('charts')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 5,
                    padding: '6px 12px',
                    borderRadius: 8,
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: 600,
                    fontFamily: "'Space Grotesk',sans-serif",
                    background: viewMode === 'charts' ? accent : 'transparent',
                    color: viewMode === 'charts' ? '#fff' : subCol,
                    transition: 'all 0.15s',
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="20" x2="18" y2="10" />
                    <line x1="12" y1="20" x2="12" y2="4" />
                    <line x1="6" y1="20" x2="6" y2="14" />
                  </svg>
                  Charts
                </button>
              </div>

              {/* Statistics Filter Toggle - only visible in charts mode */}
              {viewMode === 'charts' && (
                <div
                  style={{
                    background: cardBg,
                    border: `1px solid ${cardBrd}`,
                    borderRadius: 12,
                    padding: 16,
                  }}
                >
                  <div className="flex items-center gap-4">
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: titleCol,
                        fontFamily: "'Space Grotesk',sans-serif",
                      }}
                    >
                      Statistics Filter:
                    </span>
                    <div
                      className="relative flex items-center cursor-pointer"
                      onClick={() => setShowAllBugs(!showAllBugs)}
                      style={{
                        background: toggleTrackBg,
                        padding: 4,
                        borderRadius: 10,
                        width: 240,
                        height: 40,
                      }}
                    >
                      <motion.div
                        className="absolute rounded-lg"
                        style={{
                          background: toggleThumbBg,
                          border: `1px solid ${toggleThumbBrd}`,
                          top: 4,
                          bottom: 4,
                          left: 4,
                          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                        }}
                        animate={{
                          x: showAllBugs ? '100%' : '0%',
                          width: 'calc(50% - 4px)',
                        }}
                        transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                      />
                      <div
                        className="relative z-10 flex items-center justify-center select-none"
                        style={{
                          width: '50%',
                          height: '100%',
                          fontSize: 13,
                          fontWeight: !showAllBugs ? 700 : 500,
                          color: !showAllBugs ? accent : subCol,
                          transition: 'color 0.2s, font-weight 0.2s',
                          fontFamily: "'Space Grotesk',sans-serif",
                        }}
                      >
                        Active Only
                      </div>
                      <div
                        className="relative z-10 flex items-center justify-center select-none"
                        style={{
                          width: '50%',
                          height: '100%',
                          fontSize: 13,
                          fontWeight: showAllBugs ? 700 : 500,
                          color: showAllBugs ? accent : subCol,
                          transition: 'color 0.2s, font-weight 0.2s',
                          fontFamily: "'Space Grotesk',sans-serif",
                        }}
                      >
                        All Bugs
                      </div>
                    </div>
                  </div>
                  <p
                    style={{
                      fontSize: 11.5,
                      color: subCol,
                      margin: '10px 0 0',
                      fontFamily: "'Space Grotesk',sans-serif",
                    }}
                  >
                    {showAllBugs
                      ? 'Showing statistics for all bugs (all statuses)'
                      : 'Showing statistics for active bugs only'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Board Tabs */}
          {boardsLoading ? (
            <div className="flex gap-3 mb-6">
              {[1, 2].map(i => (
                <div
                  key={i}
                  className="animate-pulse rounded-xl"
                  style={{
                    width: 200,
                    height: 64,
                    background: cardBg,
                    border: `1px solid ${cardBrd}`,
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="flex gap-3 mb-6">
              {bugBoards.map((board) => {
                const style = BOARD_STYLES[board.shortName] ?? DEFAULT_STYLE;
                const isActive = selectedBoard === board.boardId;
                return (
                  <button
                    key={board.boardId}
                    onClick={() => setActiveBoard(board.boardId)}
                    className="relative flex items-center gap-3 text-left transition-all duration-200"
                    style={{
                      padding: '12px 20px',
                      borderRadius: 12,
                      fontWeight: 600,
                      border: isActive ? '1px solid transparent' : `1px solid ${cardBrd}`,
                      background: isActive
                        ? `linear-gradient(135deg, ${accent}, ${accentL})`
                        : cardBg,
                      color: isActive ? '#fff' : rowCol,
                      cursor: 'pointer',
                      fontFamily: "'Space Grotesk',sans-serif",
                    }}
                  >
                    <span style={{ fontSize: 22 }}>{style.icon}</span>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700 }}>{board.name}</div>
                      <div
                        style={{
                          fontSize: 11.5,
                          fontWeight: 500,
                          opacity: isActive ? 0.8 : 1,
                          color: isActive ? '#fff' : subCol,
                        }}
                      >
                        {board.shortName} Production Bugs
                      </div>
                    </div>
                    {isActive && (
                      <motion.div
                        layoutId="activeBoardIndicator"
                        className="absolute left-1/2 -translate-x-1/2"
                        style={{
                          bottom: -3,
                          width: 28,
                          height: 3,
                          borderRadius: 2,
                          background: '#fff',
                        }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Board Content */}
          {selectedBoard && (
            <AnimatePresence mode="wait">
              <motion.div
                key={`${selectedBoard}-${viewMode}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.3 }}
              >
                {viewMode === 'list' ? (
                  <BugListView boardId={selectedBoard} />
                ) : (
                  <BoardContent boardId={selectedBoard} showAllBugs={showAllBugs} />
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>
    </RoleBasedRoute>
  );
}
