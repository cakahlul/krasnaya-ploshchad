'use client';

import RoleBasedRoute from '@src/components/RoleBasedRoute';
import { useBugMonitoring } from '@src/features/bug-monitoring/hooks/useBugMonitoring';
import BugStatisticsView from '@src/features/bug-monitoring/components/BugStatistics';
import dynamic from 'next/dynamic';

const BugTrendChart = dynamic(
  () => import('@src/features/bug-monitoring/components/BugTrendChart'),
  { ssr: false }
);
import BugTable from '@src/features/bug-monitoring/components/BugTable';
import { Skeleton, Alert } from 'antd';
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 p-8">
        {/* Animated background orbs - matching Main Dashboard */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-purple-200/40 rounded-full blur-3xl animate-float" />
          <div className="absolute top-40 right-20 w-96 h-96 bg-cyan-200/40 rounded-full blur-3xl animate-float-delayed" />
          <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-pink-200/40 rounded-full blur-3xl animate-float-slow" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto">
          {/* Header with Toggle */}
          <div className="mb-8 flex items-start justify-between animate-slide-in">
            <div>
              <h1 className="text-4xl font-extrabold text-gray-900 mb-3 flex items-center gap-3">
                <span className="text-5xl animate-wave inline-block origin-bottom-right">🐛</span>
                <span>Bug Monitoring</span>
              </h1>
              <p className="text-xl text-gray-600 font-medium">
                Real-time bug tracking from BUZZ
              </p>
            </div>
            
            
            {/* Statistics Filter Toggle - Glassmorphism style with sophisticated animation */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 p-5 transform transition-all duration-300 hover:shadow-md hover:scale-[1.02]">
              <div className="flex items-center gap-5">
                <span className="text-sm font-bold text-gray-800 flex items-center gap-2">
                  Statistics Filter:
                </span>
                
                {/* Custom Animated Pill Toggle */}
                <div 
                  className="relative flex items-center bg-gray-100/90 p-1.5 rounded-xl shadow-inner cursor-pointer w-64 h-[44px] hover:bg-gray-200/80 transition-colors"
                  onClick={() => setShowAllBugs(!showAllBugs)}
                >
                  <motion.div
                    className="absolute top-[6px] bottom-[6px] bg-white rounded-lg shadow-md border border-gray-200"
                    animate={{
                      x: showAllBugs ? '100%' : '0%',
                      width: 'calc(50% - 6px)'
                    }}
                    transition={{ type: "spring", stiffness: 450, damping: 30 }}
                    style={{ left: 6 }}
                  />
                  <div className={`relative z-10 w-1/2 h-full flex items-center justify-center text-sm transition-colors duration-200 select-none ${!showAllBugs ? 'font-bold text-blue-600' : 'text-gray-500 font-medium'}`}>
                    Active Only
                  </div>
                  <div className={`relative z-10 w-1/2 h-full flex items-center justify-center text-sm transition-colors duration-200 select-none ${showAllBugs ? 'font-bold text-blue-600' : 'text-gray-500 font-medium'}`}>
                    All Bugs
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-3 font-medium flex items-center gap-1">
                <span className="text-blue-500">ℹ️</span> 
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
              className="mt-6 rounded-2xl bg-emerald-50 border-emerald-200"
            />
          )}
        </div>
      </div>
    </RoleBasedRoute>
  );
}
