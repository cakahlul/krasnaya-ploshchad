'use client';

import {
  PieChartOutlined,
  RiseOutlined,
  CalendarOutlined,
  RocketOutlined,
  ThunderboltOutlined,
  ToolOutlined,
} from '@ant-design/icons';
import { useTeamReportTransform } from '../hooks/useTeamReportTransform';

interface StatCardProps {
  label: string;
  value: string | number | undefined;
  icon: React.ReactNode;
  gradient: string;
  delay: number;
  accentColor: string;
}

function StatCard({ label, value, icon, gradient, delay, accentColor }: StatCardProps) {
  return (
    <div
      className={`
        relative overflow-hidden rounded-2xl p-5
        ${gradient}
        transform transition-all duration-300 ease-out
        hover:scale-105 hover:-translate-y-1
        hover:shadow-2xl hover:shadow-black/20
        cursor-default group
        animate-fade-in-up
      `}
      style={{ 
        animationDelay: `${delay}ms`,
        animationFillMode: 'both',
      }}
    >
      {/* Glassmorphism overlay */}
      <div className="absolute inset-0 bg-white/10 backdrop-blur-[2px]" />
      
      {/* Animated background orb */}
      <div 
        className={`
          absolute -right-8 -top-8 w-24 h-24 rounded-full
          ${accentColor} opacity-30 blur-2xl
          group-hover:opacity-50 group-hover:scale-150
          transition-all duration-500
        `}
      />
      
      {/* Icon with micro-animation */}
      <div className="relative flex items-center gap-3 mb-3">
        <div 
          className={`
            p-2.5 rounded-xl bg-white/20 backdrop-blur-sm
            group-hover:bg-white/30 group-hover:rotate-6
            transition-all duration-300
          `}
        >
          <span className="text-white text-xl group-hover:scale-110 transition-transform duration-300 inline-block">
            {icon}
          </span>
        </div>
        <span className="text-white/90 text-sm font-medium tracking-wide">
          {label}
        </span>
      </div>
      
      {/* Value with number animation feel */}
      <div className="relative">
        <p 
          className={`
            text-3xl font-bold text-white
            group-hover:tracking-wider
            transition-all duration-300
          `}
        >
          {value ?? '-'}
        </p>
      </div>
      
      {/* Shine effect on hover */}
      <div 
        className={`
          absolute inset-0 opacity-0 group-hover:opacity-100
          bg-gradient-to-r from-transparent via-white/10 to-transparent
          -translate-x-full group-hover:translate-x-full
          transition-all duration-700 ease-out
        `}
      />
    </div>
  );
}

export default function TeamPerformance() {
  const { data } = useTeamReportTransform();

  const statsData = [
    {
      label: 'Avg WP per Hour',
      value: data?.averageWpPerHour?.toFixed(2) ?? '-',
      icon: <RocketOutlined />,
      gradient: 'bg-gradient-to-br from-teal-500 via-teal-600 to-emerald-700',
      accentColor: 'bg-emerald-300',
    },
    {
      label: 'Avg Productivity',
      value: data?.averageProductivity,
      icon: <RiseOutlined />,
      gradient: 'bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700',
      accentColor: 'bg-blue-300',
    },
    {
      label: 'Product %',
      value: data?.productPercentage,
      icon: <PieChartOutlined />,
      gradient: 'bg-gradient-to-br from-emerald-500 via-green-600 to-teal-700',
      accentColor: 'bg-green-300',
    },
    {
      label: 'Tech Debt %',
      value: data?.techDebtPercentage,
      icon: <ToolOutlined />,
      gradient: 'bg-gradient-to-br from-orange-500 via-orange-600 to-red-600',
      accentColor: 'bg-orange-300',
    },
    {
      label: 'Working Days',
      value: data?.totalWorkingDays,
      icon: <CalendarOutlined />,
      gradient: 'bg-gradient-to-br from-purple-500 via-purple-600 to-violet-700',
      accentColor: 'bg-purple-300',
    },
    {
      label: 'Total Weight Points',
      value: data?.totalWeightPoints ?? '-',
      icon: <ThunderboltOutlined />,
      gradient: 'bg-gradient-to-br from-amber-500 via-yellow-500 to-orange-600',
      accentColor: 'bg-yellow-300',
    },
  ];

  return (
    <div className="py-6">
      {/* Section header */}
      <div className="flex items-center gap-3 mb-5 animate-fade-in">
        <div className="h-8 w-1 bg-gradient-to-b from-purple-500 to-blue-500 rounded-full" />
        <h2 className="text-xl font-bold text-gray-800">Sprint Performance</h2>
      </div>
      
      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {statsData.map((item, idx) => (
          <StatCard
            key={item.label}
            label={item.label}
            value={item.value}
            icon={item.icon}
            gradient={item.gradient}
            accentColor={item.accentColor}
            delay={idx * 80}
          />
        ))}
      </div>
    </div>
  );
}
