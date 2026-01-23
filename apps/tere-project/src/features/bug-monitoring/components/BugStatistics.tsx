'use client';

import type { BugStatistics } from '../types/bug-monitoring.types';
import { Card, Progress } from 'antd';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { motion } from 'framer-motion';
import { BugOutlined, ClockCircleOutlined } from '@ant-design/icons';

interface BugStatisticsProps {
  statistics: BugStatistics;
}

const STATUS_COLORS: Record<string, string> = {
  // Active statuses
  'Detected': '#EF4444',      // Red
  'Ready to test': '#3B82F6', // Blue
  
  // Other common statuses
  'To Do': '#6B7280',         // Gray
  'In Progress': '#F97316',   // Orange
  'Testing': '#8B5CF6',       // Purple
  'Done': '#10B981',          // Green
  'Closed': '#059669',        // Dark Green
  'Resolved': '#10B981',      // Green
  'Open': '#EAB308',          // Yellow
  'Reopened': '#DC2626',      // Dark Red
};

const PRIORITY_COLORS = ['#EF4444', '#F97316', '#FBBF24', '#3B82F6', '#10B981', '#6B7280'];

export default function BugStatisticsView({ statistics }: BugStatisticsProps) {
  const statusData = Object.entries(statistics.countByStatus).map(([status, count]) => {
    const color = STATUS_COLORS[status] || '#6366F1'; // Indigo as default
    
    // Debug: log if status is not in mapping
    if (!STATUS_COLORS[status]) {
      console.warn(`Status "${status}" not in STATUS_COLORS mapping, using default color`);
    }
    
    return {
      name: status,
      value: count,
      color,
    };
  });

  const priorityData = statistics.priorityDistribution.map((item, index) => ({
    priority: item.priority,
    count: item.count,
    fill: PRIORITY_COLORS[index % PRIORITY_COLORS.length],
  }));

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6"
    >
      {/* Total Bugs Card */}
      <motion.div variants={itemVariants}>
        <Card className="h-full bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-500 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Bugs</p>
              <p className="text-4xl font-bold text-red-600">{statistics.totalCount}</p>
            </div>
            <BugOutlined className="text-5xl text-red-500 opacity-70" />
          </div>
        </Card>
      </motion.div>

      {/* Average Days Open Card */}
      <motion.div variants={itemVariants}>
        <Card className="h-full bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-500 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Avg Days Open</p>
              <p className="text-4xl font-bold text-orange-600">
                {statistics.averageDaysOpen.toFixed(1)}
              </p>
            </div>
            <ClockCircleOutlined className="text-5xl text-orange-500 opacity-70" />
          </div>
          <Progress
            percent={Math.min((statistics.averageDaysOpen / 30) * 100, 100)}
            strokeColor={statistics.averageDaysOpen > 14 ? '#F97316' : '#10B981'}
            showInfo={false}
            className="mt-2"
          />
        </Card>
      </motion.div>

      {/* Status Distribution Pie Chart */}
      <motion.div variants={itemVariants} className="md:col-span-2">
        <Card
          title="Bug Distribution by Status"
          className="h-full hover:shadow-xl transition-all duration-300"
        >
          <div className="flex items-center justify-center h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend 
                  layout="vertical" 
                  verticalAlign="middle" 
                  align="right"
                  wrapperStyle={{ paddingLeft: '20px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </motion.div>

      {/* Priority Distribution Bar Chart */}
      <motion.div variants={itemVariants} className="lg:col-span-4">
        <Card
          title="Bug Distribution by Priority"
          className="hover:shadow-xl transition-all duration-300"
        >
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={priorityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="priority" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                {priorityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </motion.div>
    </motion.div>
  );
}
