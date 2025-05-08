'use client';
import { WorkItem } from '../types/dashboard';
import { Table, TableColumnsType } from 'antd';
import { useTeamReportTransform } from '../hooks/useTeamReportTransform';
import TeamPerformance from './teamPerformance';
import { useState } from 'react';

export default function TeamTable() {
  const { data } = useTeamReportTransform();
  const [pageSize, setPageSize] = useState(5);

  const columns: TableColumnsType<WorkItem> = [
    { title: 'Member', dataIndex: 'member', key: 'member' },
    { title: 'Product Point', dataIndex: 'productPoint', key: 'productPoint' },
    {
      title: 'Tech Debt Point',
      dataIndex: 'techDebtPoint',
      key: 'techDebtPoint',
    },
    { title: 'Total Point', dataIndex: 'totalPoint', key: 'totalPoint' },
    {
      title: 'Productivity Rate',
      dataIndex: 'productivityRate',
      key: 'productivityRate',
    },
    {
      title: 'Avg. Complexity',
      dataIndex: 'averageComplexity',
      key: 'averageComplexity',
    },
    {
      title: 'Total Weight Points',
      dataIndex: 'totalWeightPoints',
      key: 'totalWeightPoints',
    },
    { title: 'Dev Defect', dataIndex: 'devDefect', key: 'devDefect' },
    {
      title: 'Dev Defect Rate',
      dataIndex: 'devDefectRate',
      key: 'devDefectRate',
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
          )} // Added header
        />
      </div>
      {!!data && (
        <div>
          <p className="text-red-500 text-xs">
            **The shown data is collected based on the assumption that each team
            member works 10 days per sprint. This data may vary based on actual
            workdays and team dynamics.
          </p>
        </div>
      )}
    </div>
  );
}
