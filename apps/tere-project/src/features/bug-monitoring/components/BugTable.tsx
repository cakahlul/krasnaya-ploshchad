'use client';

import { Bug, BugsByStatus } from '../types/bug-monitoring.types';
import { Table, Tag, Tabs } from 'antd';
import { ColumnsType } from 'antd/es/table';
import { motion } from 'framer-motion';

interface BugTableProps {
  bugsByStatus: BugsByStatus[];
}

const statusColors: Record<string, string> = {
  'To Do': 'gray',
  'In Progress': 'orange',
  'Ready to Test': 'blue',
  'Ready Set Test': 'blue'
};

const priorityColors: Record<string, string> = {
  'Highest': 'error',
  'High': 'warning',
  'Medium': 'processing',
  'Low': 'success',
  'Lowest': 'default',
  'None': 'default',
};

export default function BugTable({ bugsByStatus }: BugTableProps) {
  const columns: ColumnsType<Bug> = [
    {
      title: 'Bug Key',
      dataIndex: 'key',
      key: 'key',
      render: (key: string) => (
        <a
          href={`https://amarbank.atlassian.net/browse/${key}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 font-bold hover:underline transition-colors flex items-center gap-1"
        >
          {key}
        </a>
      ),
      width: 120,
    },
    {
      title: 'Summary',
      dataIndex: 'summary',
      key: 'summary',
      ellipsis: true,
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority: string) => (
        <Tag color={priorityColors[priority] || 'default'} className="px-2 py-0.5 rounded-md font-medium border-0 shadow-sm">{priority}</Tag>
      ),
      width: 100,
      sorter: (a, b) => {
        const order = ['Highest', 'High', 'Medium', 'Low', 'Lowest', 'None'];
        return order.indexOf(a.priority) - order.indexOf(b.priority);
      },
    },
    {
      title: 'Assignee',
      dataIndex: 'assignee',
      key: 'assignee',
      render: (assignee: string | null) => (
        <span className="flex items-center gap-2">
          {assignee ? (
            <>
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-200 text-indigo-700 font-bold flex items-center justify-center text-xs shadow-inner">
                {assignee.charAt(0)}
              </div>
              <span className="font-medium text-gray-700">{assignee}</span>
            </>
          ) : (
            <span className="text-gray-400 italic">Unassigned</span>
          )}
        </span>
      ),
      width: 180,
    },
    {
      title: 'Days Open',
      dataIndex: 'daysOpen',
      key: 'daysOpen',
      render: (days: number) => (
        <span
          className={`font-semibold ${
            days > 30 ? 'text-red-600' : days > 14 ? 'text-orange-600' : 'text-green-600'
          }`}
        >
          {days} {days === 1 ? 'day' : 'days'}
        </span>
      ),
      width: 100,
      sorter: (a, b) => a.daysOpen - b.daysOpen,
      defaultSortOrder: 'descend',
    },
    {
      title: 'Created',
      dataIndex: 'created',
      key: 'created',
      render: (date: string) => new Date(date).toLocaleDateString(),
      width: 120,
    },
  ];

  const tabItems = bugsByStatus.map((statusGroup) => ({
    key: statusGroup.status,
    label: (
      <span className="flex items-center gap-2">
        <Tag color={statusColors[statusGroup.status] || 'default'}>
          {statusGroup.status}
        </Tag>
        <span className="font-semibold">{statusGroup.count}</span>
      </span>
    ),
    children: (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Table
          columns={columns}
          dataSource={statusGroup.bugs}
          rowKey={(bug) => `${bug.key}-${statusGroup.status}`}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50'],
            showTotal: (total) => `Total ${total} bugs`,
          }}
          className="shadow-sm"
          rowClassName="hover:bg-gray-50 transition-colors cursor-pointer"
        />
      </motion.div>
    ),
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="bg-white/90 backdrop-blur-sm shadow-sm border border-gray-100 rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-xl font-bold flex items-center gap-2 text-gray-800">
            <span className="text-2xl animate-pulse">📋</span> Active Bug List
          </h2>
        </div>
        <div className="p-2 sm:p-6">
          <Tabs
            items={tabItems}
            type="card"
            size="large"
            className="bug-monitoring-tabs custom-modern-tabs"
          />
        </div>
      </div>
    </motion.div>
  );
}
