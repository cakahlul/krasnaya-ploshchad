'use client';
import { WorkItem } from '../types/dashboard';
import { Table, TableColumnsType } from 'antd';
import { useTeamReportTransform } from '../hooks/useTeamReportTransform';

export default function TeamTable() {
  const { data, isLoading } = useTeamReportTransform();

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

  if (isLoading) {
    return <div>Loading item...</div>;
  }

  return (
    <div style={{ padding: 24 }}>
      <h1>Issue Productivity Table</h1>
      <Table
        columns={columns}
        dataSource={data?.workItems.map((item, index) => ({
          ...item,
          key: index,
        }))}
        pagination={false}
      />
    </div>
  );
}
