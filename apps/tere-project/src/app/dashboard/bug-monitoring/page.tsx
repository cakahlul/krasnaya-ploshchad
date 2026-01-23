'use client';

import RoleBasedRoute from '@src/components/RoleBasedRoute';
import { useBugMonitoring } from '@src/features/bug-monitoring/hooks/useBugMonitoring';
import BugStatisticsView from '@src/features/bug-monitoring/components/BugStatistics';
import BugTrendChart from '@src/features/bug-monitoring/components/BugTrendChart';
import BugTable from '@src/features/bug-monitoring/components/BugTable';
import { Skeleton, Alert, Switch } from 'antd';
import { motion } from 'framer-motion';
import { useState, useMemo } from 'react';
import '../../bug-monitoring.css';

const BUZZ_BOARD_ID = 177;
const ACTIVE_STATUSES = ['To Do', 'In Progress', 'Ready to Test'];

export default function BugMonitoringPage() {
  const { data, isLoading, error } = useBugMonitoring(BUZZ_BOARD_ID);
  const [showAllBugs, setShowAllBugs] = useState(true);

  // Calculate statistics based on toggle
  const displayStatistics = useMemo(() => {
    if (!data) return null;
    
    if (showAllBugs) {
      // Show all bugs statistics
      return data.statistics;
    } else {
      // Calculate statistics only for active bugs
      const activeBugsCount = data.bugsByStatus.reduce((sum, group) => sum + group.count, 0);
      
      // Filter statistics for active statuses only
      const activeCountByStatus: Record<string, number> = {};
      ACTIVE_STATUSES.forEach(status => {
        const group = data.bugsByStatus.find(g => g.status === status);
        if (group) {
          activeCountByStatus[status] = group.count;
        }
      });
      
      // Calculate priority distribution from active bugs only
      const activePriorityMap: Record<string, number> = {};
      data.bugsByStatus.forEach(group => {
        group.bugs.forEach(bug => {
          activePriorityMap[bug.priority] = (activePriorityMap[bug.priority] || 0) + 1;
        });
      });
      
      const activePriorityDistribution = Object.entries(activePriorityMap).map(([priority, count]) => ({
        priority,
        count,
      }));
      
      // Calculate average days open for active bugs only
      let totalDaysOpen = 0;
      let bugCount = 0;
      data.bugsByStatus.forEach(group => {
        group.bugs.forEach(bug => {
          totalDaysOpen += bug.daysOpen;
          bugCount++;
        });
      });
      const activeAverageDaysOpen = bugCount > 0 ? totalDaysOpen / bugCount : 0;
      
      // Calculate assignee distribution for active bugs
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
    }
  }, [data, showAllBugs]);

  return (
    <RoleBasedRoute allowedRoles={['Lead']}>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-red-50 to-orange-50 p-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-7xl mx-auto"
        >
          {/* Header with Toggle */}
          <div className="mb-8 flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                <span className="text-red-600">🐛</span>
                Bug Monitoring
              </h1>
              <p className="text-gray-600 text-lg">
                Real-time bug tracking from BUZZ
              </p>
            </div>
            
            {/* Statistics Filter Toggle */}
            <div className="bg-white rounded-lg shadow-md p-4 border-2 border-gray-200">
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-gray-700">
                  Statistics Filter:
                </span>
                <div className="flex items-center gap-2">
                  <span className={`text-sm ${!showAllBugs ? 'font-bold text-blue-600' : 'text-gray-500'}`}>
                    Active Only
                  </span>
                  <Switch
                    checked={showAllBugs}
                    onChange={(checked) => setShowAllBugs(checked)}
                    className="bg-gray-300"
                  />
                  <span className={`text-sm ${showAllBugs ? 'font-bold text-blue-600' : 'text-gray-500'}`}>
                    All Bugs
                  </span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {showAllBugs 
                  ? 'Showing statistics for all bugs (all statuses)'
                  : 'Showing statistics for active bugs only (To Do, In Progress, Ready to Test)'}
              </p>
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton.Node
                    key={i}
                    active
                    style={{ width: '100%', height: '150px' }}
                  />
                ))}
              </div>
              <Skeleton active paragraph={{ rows: 8 }} />
            </div>
          )}

          {/* Error State */}
          {error && (
            <Alert
              message="Error Loading Bugs"
              description={
                error instanceof Error
                  ? error.message
                  : 'Failed to fetch bug data from Jira. Please try again.'
              }
              type="error"
              showIcon
              className="mb-6"
            />
          )}

          {/* Data Display */}
          {data && !isLoading && displayStatistics && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="space-y-6"
            >
              {/* Statistics */}
              <BugStatisticsView statistics={displayStatistics} />

              {/* Bug Trend Chart */}
              <BugTrendChart bugs={data.allBugs} showActiveOnly={!showAllBugs} />


              {/* Bug Table - Always show Active Bug List */}
              <BugTable bugsByStatus={data.bugsByStatus} />
            </motion.div>
          )}

          {/* Empty State */}
          {data && data.statistics.totalCount === 0 && (
            <Alert
              message="No Bugs Found"
              description="There are currently no bugs in the BUZZ project. Great job! 🎉"
              type="success"
              showIcon
              className="mt-6"
            />
          )}
        </motion.div>
      </div>
    </RoleBasedRoute>
  );
}
