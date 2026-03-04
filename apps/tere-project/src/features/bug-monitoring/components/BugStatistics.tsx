'use client';

import type { BugStatistics } from '../types/bug-monitoring.types';
import { Progress } from 'antd';
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
        <div className="h-full bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-200 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:scale-105 transition-all duration-300 overflow-hidden relative group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-red-200 rounded-full blur-2xl opacity-50 group-hover:bg-red-300 transition-all duration-500"></div>
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="text-sm font-semibold text-red-600/80 mb-1 tracking-wide uppercase">Total Bugs</p>
              <p className="text-5xl font-extrabold text-red-600 drop-shadow-sm">{statistics.totalCount}</p>
            </div>
            <div className="bg-white/60 p-4 rounded-full shadow-inner">
              <BugOutlined className="text-4xl text-red-500" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Average Days Open Card */}
      <motion.div variants={itemVariants}>
        <div className="h-full bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-200 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:scale-105 transition-all duration-300 overflow-hidden relative group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-orange-200 rounded-full blur-2xl opacity-50 group-hover:bg-orange-300 transition-all duration-500"></div>
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="text-sm font-semibold text-orange-600/80 mb-1 tracking-wide uppercase">Avg Days Open</p>
              <p className="text-5xl font-extrabold text-orange-600 drop-shadow-sm">
                {statistics.averageDaysOpen.toFixed(1)}
              </p>
            </div>
            <div className="bg-white/60 p-4 rounded-full shadow-inner">
              <ClockCircleOutlined className="text-4xl text-orange-500" />
            </div>
          </div>
          <div className="relative z-10 mt-4">
            <Progress
              percent={Math.min((statistics.averageDaysOpen / 30) * 100, 100)}
              strokeColor={statistics.averageDaysOpen > 14 ? '#F97316' : '#10B981'}
              showInfo={false}
              size="small"
              className="drop-shadow-sm"
            />
          </div>
        </div>
      </motion.div>

      {/* Status Distribution Pie Chart */}
      <motion.div variants={itemVariants} className="md:col-span-2">
        <div className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl p-6 shadow-sm h-full hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
          <h3 className="text-xl font-bold text-gray-800 mb-4 border-b border-gray-100 pb-2">Bug Distribution by Status</h3>
          <div className="flex items-center justify-center h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ fontWeight: 'bold' }}
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
        </div>
      </motion.div>

      {/* Priority Distribution Bar Chart */}
      <motion.div variants={itemVariants} className="lg:col-span-4">
        <div className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
          <h3 className="text-xl font-bold text-gray-800 mb-6 border-b border-gray-100 pb-2">Bug Distribution by Priority</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={priorityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis dataKey="priority" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontWeight: 500 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280' }} />
              <Tooltip 
                cursor={{ fill: '#F3F4F6' }}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)' }}
              />
              <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={40}>
                {priorityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </motion.div>
  );
}
