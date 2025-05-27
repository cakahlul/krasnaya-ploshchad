'use client';

import PieChart from '@src/features/monitoring/components/pieChart';

export default function MonitoringPage() {
  const sampleData = [
    { name: 'Success', value: 900 },
    { name: 'Errors', value: 100 },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Application Monitoring</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-card p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-semibold mb-4">User Distribution</h2>
          <div className="h-[300px]">
            <PieChart data={sampleData} />
          </div>
        </div>
      </div>
    </div>
  );
}
