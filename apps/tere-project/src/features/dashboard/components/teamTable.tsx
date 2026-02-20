'use client';
import { WorkItem } from '../types/dashboard';
import { Table, TableColumnsType } from 'antd';
import { useTeamReportTransform } from '../hooks/useTeamReportTransform';
import TeamPerformance from './teamPerformance';
import MemberTaskModal from './MemberTaskModal';
import { useState } from 'react';

export default function TeamTable() {
  const { data } = useTeamReportTransform();
  const [pageSize, setPageSize] = useState(5);
  const [selectedMember, setSelectedMember] = useState<WorkItem | null>(null);

  const columns: TableColumnsType<WorkItem> = [
    {
      title: 'Member',
      dataIndex: 'member',
      key: 'member',
      render: (text: string, record: WorkItem) => (
        <button
          className="text-purple-600 hover:text-purple-800 font-medium hover:underline cursor-pointer bg-transparent border-none p-0 text-left"
          onClick={() => setSelectedMember(record)}
        >
          {text}
        </button>
      ),
    },
    {
      title: 'Productivity Rate',
      dataIndex: 'productivityRate',
      key: 'productivityRate',
    },
    {
      title: 'Weight Points Product',
      dataIndex: 'weightPointsProduct',
      key: 'weightPointsProduct',
    },
    {
      title: 'Weight Points Tech Debt',
      dataIndex: 'weightPointsTechDebt',
      key: 'weightPointsTechDebt',
    },
    {
      title: 'Total Weight Points',
      dataIndex: 'totalWeightPoints',
      key: 'totalWeightPoints',
    },
    {
      title: 'Target WP',
      dataIndex: 'targetWeightPoints',
      key: 'targetWeightPoints',
    },
    {
      title: 'Working Days',
      dataIndex: 'workingDays',
      key: 'workingDays',
    },
    {
      title: 'WP to Hours',
      dataIndex: 'wpToHours',
      key: 'wpToHours',
      render: (value: number | undefined) => value?.toFixed(2) ?? '-',
    },
  ];
  return (
    <div className="relative flex-1">
      <div className="p-4">
        {!!data && <TeamPerformance />}
        <Table
          columns={columns}
          dataSource={data?.workItems.map((item, index) => ({
            ...item,
            key: index,
          }))}
          pagination={{
            pageSize,
            showSizeChanger: true,
            pageSizeOptions: ['5', '10', '20', '50'],
          }}
          onChange={pagination => {
            setPageSize(pagination.pageSize || 5);
          }}
          title={() => (
            <h2>
              <strong>Team Performance Metrics</strong>
            </h2>
          )}
        />
      </div>
      {!!data && (
        <div>
          <p className="text-red-500 text-xs">
            **The shown data is collected based on the actual working days per sprint. There is a chance about inaccurate joint holidays and personal leaves.
          </p>
        </div>
      )}

      <MemberTaskModal
        open={!!selectedMember}
        onClose={() => setSelectedMember(null)}
        member={selectedMember}
      />
    </div>
  );
}
