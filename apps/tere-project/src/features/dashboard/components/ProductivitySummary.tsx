'use client';

import { useState, useEffect } from 'react';
import { DatePicker, Table, Spin, Tooltip, Empty } from 'antd';
import dayjs from 'dayjs';
import axiosClient from '@src/lib/axiosClient';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Zap,
  Briefcase,
  Layers,
  Award,
  BarChart2,
  PieChart,
  Activity,
  Clock,
} from 'lucide-react';
import { ProductivitySummaryExportButton } from './ProductivitySummaryExportButton';

interface ProductivitySummaryMemberDto {
  name: string;
  team: string; // 'DS' or 'SLS'
  wpProduct: number;
  wpTech: number;
  wpTotal: number;
  workingDays: number;
  averageWp: number;
  expectedAverageWp: number;
}

interface ProductivitySummaryData {
  summary: {
    totalDaysOfWorks: number;
    totalWpExpected: number;
    averageWpExpected: number;
    productivityExpected: number;
    totalWpProduced: number;
    averageWpProduced: number;
    productivityProduced: number;
    productivityProduceVsExpected: number;
  };
  details: ProductivitySummaryMemberDto[];
}

export default function ProductivitySummary() {
  const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs>(dayjs());
  const [data, setData] = useState<ProductivitySummaryData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData(selectedDate.month() + 1, selectedDate.year());
  }, [selectedDate]);

  const fetchData = async (month: number, year: number) => {
    setLoading(true);
    try {
      const response = await axiosClient.get(
        `/report/productivity-summary`,
        {
          params: { month, year },
        }
      );
      setData(response.data);
    } catch (error) {
      console.error('Failed to fetch productivity summary:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (date: dayjs.Dayjs | null) => {
    if (date) {
      setSelectedDate(date);
    }
  };

  // --- UI Components ---
  const StatCard = ({
    title,
    value,
    icon,
    subtitle,
    isHighlight = false,
    highlightValue = 0,
    delay = 0,
    colorTheme = 'default',
  }: {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    subtitle?: React.ReactNode;
    isHighlight?: boolean;
    highlightValue?: number;
    delay?: number;
    colorTheme?: 'default' | 'success' | 'danger' | 'purple' | 'amber' | 'blue';
  }) => {
    let bgClass = 'bg-white border border-gray-100 shadow-sm hover:border-purple-200';
    let textClass = 'text-gray-900';
    let titleClass = 'text-gray-500';
    let iconClass = 'bg-purple-50 text-purple-600';
    let subtitleClass = 'text-gray-400';

    if (isHighlight) {
        if (highlightValue >= 0) colorTheme = 'success';
        else colorTheme = 'danger';
    }

    if (colorTheme === 'success') {
      bgClass = 'bg-gradient-to-br from-emerald-500 to-teal-400 text-white shadow-emerald-500/30 border-transparent';
      textClass = 'text-white';
      titleClass = 'text-emerald-50/80';
      iconClass = 'bg-white/20 text-white';
      subtitleClass = 'text-white/80';
    } else if (colorTheme === 'danger') {
      bgClass = 'bg-gradient-to-br from-red-500 to-rose-400 text-white shadow-rose-500/30 border-transparent';
      textClass = 'text-white';
      titleClass = 'text-rose-50/80';
      iconClass = 'bg-white/20 text-white';
      subtitleClass = 'text-white/80';
    } else if (colorTheme === 'purple') {
      bgClass = 'bg-gradient-to-br from-purple-600 to-indigo-500 text-white shadow-purple-500/30 border-transparent hover:shadow-purple-500/50 hover:border-transparent';
      textClass = 'text-white';
      titleClass = 'text-purple-100/80';
      iconClass = 'bg-white/20 text-white';
      subtitleClass = 'text-purple-100/80';
    } else if (colorTheme === 'amber') {
      bgClass = 'bg-gradient-to-br from-orange-500 to-amber-400 text-white shadow-orange-500/30 border-transparent hover:shadow-orange-500/50 hover:border-transparent';
      textClass = 'text-white';
      titleClass = 'text-orange-50/80';
      iconClass = 'bg-white/20 text-white';
      subtitleClass = 'text-orange-50/80';
    } else if (colorTheme === 'blue') {
      bgClass = 'bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-blue-500/30 border-transparent hover:shadow-blue-500/50 hover:border-transparent';
      textClass = 'text-white';
      titleClass = 'text-blue-100/80';
      iconClass = 'bg-white/20 text-white';
      subtitleClass = 'text-blue-100/80';
    }

    return (
      <div
        className={`relative overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${bgClass}`}
        style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}
      >
        <div className="flex justify-between items-start mb-4">
          <div className={`p-3 rounded-xl flex items-center justify-center ${iconClass}`}>
            {icon}
          </div>
          {isHighlight && (
            <span className="flex items-center gap-1 text-sm font-semibold bg-white/20 px-2 py-1 rounded-lg backdrop-blur-sm text-white">
              {highlightValue >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              {Math.abs(highlightValue).toFixed(2)}%
            </span>
          )}
        </div>
        <div>
          <h3 className={`text-sm font-medium mb-1 ${titleClass}`}>
            {title}
          </h3>
          <p className={`text-3xl font-bold tracking-tight ${textClass}`}>
            {value}
          </p>
          {subtitle && (
            <div className={`text-xs mt-2 ${subtitleClass}`}>
              {subtitle}
            </div>
          )}
        </div>
        <div className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full bg-gradient-to-br from-white/5 to-white/20 blur-2xl pointer-events-none" />
      </div>
    );
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <span className="font-medium text-gray-800">{text}</span>,
      sorter: (a: any, b: any) => a.name.localeCompare(b.name),
    },
    {
      title: 'Team',
      dataIndex: 'team',
      key: 'team',
      render: (team: string) => (
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${
            team === 'DS'
              ? 'bg-blue-50 text-blue-600 border border-blue-100'
              : 'bg-purple-50 text-purple-600 border border-purple-100'
          }`}
        >
          {team}
        </span>
      ),
      filters: [
        { text: 'DS', value: 'DS' },
        { text: 'SLS', value: 'SLS' },
      ],
      onFilter: (value: any, record: any) => record.team === value,
    },
    {
      title: 'Working Days',
      dataIndex: 'workingDays',
      key: 'workingDays',
      align: 'center' as const,
      sorter: (a: any, b: any) => a.workingDays - b.workingDays,
    },
    {
      title: 'WP Product',
      dataIndex: 'wpProduct',
      key: 'wpProduct',
      align: 'center' as const,
      sorter: (a: any, b: any) => a.wpProduct - b.wpProduct,
    },
    {
      title: 'WP Tech',
      dataIndex: 'wpTech',
      key: 'wpTech',
      align: 'center' as const,
      sorter: (a: any, b: any) => a.wpTech - b.wpTech,
    },
    {
      title: 'WP Total',
      dataIndex: 'wpTotal',
      key: 'wpTotal',
      align: 'center' as const,
      render: (val: number) => (
        <span className="font-bold text-gray-900 bg-gray-50 px-2.5 py-1 rounded-md">
          {val.toFixed(2)}
        </span>
      ),
      sorter: (a: any, b: any) => a.wpTotal - b.wpTotal,
    },
    {
      title: 'Avg WP / Day',
      dataIndex: 'averageWp',
      key: 'averageWp',
      align: 'center' as const,
      render: (val: number, record: any) => {
        const isAboveTarget = val >= record.expectedAverageWp;
        return (
          <Tooltip title={`Target: ${record.expectedAverageWp.toFixed(2)}`}>
            <div className="flex flex-col items-center gap-1">
              <span
                className={`text-sm font-semibold flex items-center gap-1 ${
                  isAboveTarget ? 'text-emerald-600' : 'text-rose-500'
                }`}
              >
                {val.toFixed(2)}
                {isAboveTarget ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              </span>
            </div>
          </Tooltip>
        );
      },
      sorter: (a: any, b: any) => a.averageWp - b.averageWp,
    },
    {
      title: 'Expected Avg WP',
      dataIndex: 'expectedAverageWp',
      key: 'expectedAverageWp',
      align: 'center' as const,
      render: (val: number) => (
        <span className="text-gray-500">{val.toFixed(2)}</span>
      ),
      sorter: (a: any, b: any) => a.expectedAverageWp - b.expectedAverageWp,
    },
  ];

  return (
    <div className="p-8 max-w-[1400px] mx-auto min-h-screen bg-gray-50/30">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 animate-fade-in-down">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-cyan-500 flex items-center gap-3">
            <Activity className="text-purple-600" size={32} />
            Productivity Summary
          </h1>
          <p className="text-gray-500 mt-2">
            Comprehensive team performance overview across DS and SLS.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <ProductivitySummaryExportButton 
            month={selectedDate.month() + 1}
            year={selectedDate.year()}
          />
          <Calendar className="text-purple-500 ml-2" size={20} />
          <DatePicker
            picker="month"
            value={selectedDate}
            onChange={handleDateChange}
            format="MMMM YYYY"
            allowClear={false}
            className="border-none shadow-none focus:ring-0 text-sm font-medium min-w-[150px]"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] bg-white rounded-3xl border border-gray-100 shadow-sm">
          <Spin size="large" />
          <p className="text-gray-500 mt-4 animate-pulse">Calculating metrics...</p>
        </div>
      ) : data ? (
        <div className="space-y-8 animate-fade-in-up">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Working Days"
              value={data.summary.totalDaysOfWorks}
              icon={<Briefcase />}
              delay={0}
            />
            <StatCard
              title="Avg WP Expected"
              value={data.summary.averageWpExpected.toFixed(2)}
              icon={<BarChart2 />}
              subtitle={`Total Expected WP: ${data.summary.totalWpExpected.toFixed(2)}`}
              delay={100}
            />
            <StatCard
              title="Avg WP Produced"
              value={data.summary.averageWpProduced.toFixed(2)}
              icon={<Zap />}
              subtitle={`Total Produced WP: ${data.summary.totalWpProduced.toFixed(2)}`}
              delay={200}
            />
            <StatCard
              title="vs. Expected"
              value={`${(data.summary.productivityProduceVsExpected * 100).toFixed(2)}%`}
              icon={<Award />}
              isHighlight={true}
              highlightValue={data.summary.productivityProduceVsExpected * 100}
              subtitle="Overall Productivity Diff"
              delay={300}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <StatCard
              title="Productivity Expected"
              value={data.summary.productivityExpected.toFixed(2)}
              icon={<Layers />}
              subtitle={<span className="flex items-center gap-1.5 opacity-90 font-medium"><Clock size={12} /> Calculation is per hour</span>}
              delay={400}
              colorTheme="purple"
            />
            <StatCard
              title="Productivity Produced"
              value={data.summary.productivityProduced.toFixed(2)}
              icon={<PieChart />}
              subtitle={<span className="flex items-center gap-1.5 opacity-90 font-medium"><Clock size={12} /> Calculation is per hour</span>}
              delay={500}
              colorTheme="blue"
            />
          </div>

          {/* Detailed Table */}
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm transition-shadow hover:shadow-md" style={{ animationDelay: '600ms' }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">Member Breakdown</h2>
            </div>
            <Table
              dataSource={data.details}
              columns={columns}
              rowKey="name"
              pagination={{ pageSize: 20 }}
              className="custom-tailwind-table"
              rowClassName="hover:bg-purple-50/30 transition-colors"
            />
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-gray-100 p-12 flex flex-col items-center justify-center">
          <Empty description="No productivity data found for this month" />
        </div>
      )}

      {/* Tailwind specific animations for smooth entrance */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fade-in-down {
          0% { opacity: 0; transform: translateY(-10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-in-up {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-down { animation: fade-in-down 0.5s ease-out forwards; }
        .animate-fade-in-up { animation: fade-in-up 0.5s ease-out forwards; }
        
        /* Custom AntD Table overrides for more modern look */
        .custom-tailwind-table .ant-table-thead > tr > th {
          background-color: #f9fafb;
          color: #4b5563;
          font-weight: 600;
          text-transform: uppercase;
          font-size: 0.75rem;
          letter-spacing: 0.05em;
          border-bottom: 1px solid #f3f4f6;
        }
        .custom-tailwind-table .ant-table-tbody > tr > td {
          border-bottom: 1px solid #f3f4f6;
          font-size: 0.875rem;
        }
        .custom-tailwind-table .ant-pagination-item-active {
          border-color: #a855f7;
        }
        .custom-tailwind-table .ant-pagination-item-active a {
          color: #a855f7;
        }
      `}} />
    </div>
  );
}
