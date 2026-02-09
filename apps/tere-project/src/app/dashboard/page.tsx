'use client';

import useUser from '@src/hooks/useUser';
import { remoteConfig } from '@src/lib/firebase';
import { fetchAndActivate, getValue } from 'firebase/remote-config';
import { useEffect, useState } from 'react';
import { useDashboardSummary, useDashboardBugSummary, TeamSummary, BugSummary } from '@src/features/dashboard/hooks/useDashboardSummary';
import {
  RocketOutlined,
  TeamOutlined,
  BugOutlined,
  ThunderboltOutlined,
  RiseOutlined,
  CalendarOutlined,
  WarningOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import RoleBasedRoute from '@src/components/RoleBasedRoute';
import { useUserAccess } from '@src/hooks/useUserAccess';
import LoadingBounce from '@src/components/loadingBounce';
import dynamic from 'next/dynamic';

// Dynamic import with SSR disabled to prevent hydration errors
const GlobalSearch = dynamic(
  () => import('@src/features/dashboard/components/GlobalSearch'),
  { ssr: false }
);

export default function Dashboard() {
  const { getDisplayName } = useUser();
  const [message, setMessage] = useState(
    "Ready to rock this day? Let's code and conquer 💻🔥",
  );
  const { ds, sls } = useDashboardSummary();
  const { bugs } = useDashboardBugSummary();

  const { role, isLoading } = useUserAccess();

  useEffect(() => {
    fetchAndActivate(remoteConfig).then(() => {
      setMessage(getValue(remoteConfig, 'welcome_message').asString());
    });
  }, []);

  if (isLoading) return <LoadingBounce />;

  if (role === 'Member') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] bg-gradient-to-br from-accent via-muted text-center space-y-6 px-4">
        <h1 className="text-5xl font-extrabold text-primary transition-transform duration-500 hover:scale-110 hover:rotate-1">
          👋 Yo! {getDisplayName()}!
        </h1>

        <p className="text-xl text-secondary font-medium transition-all duration-300 hover:tracking-wider hover:text-primary">
          {message}
        </p>

        <div className="mt-6 bg-muted px-6 py-4 rounded-2xl shadow-xl text-gray-800 text-lg transition-all duration-300 hover:shadow-2xl hover:scale-105 hover:rotate-1">
          <span className="inline-block animate-bounce text-2xl">📊</span>
          <span className="ml-2">
            Click the menu and make some magic happen ✨
          </span>
        </div>

        <p className="text-sm text-gray-500 italic animate-pulse">
          Try hovering over elements for some fun surprises! 🎉
        </p>
      </div>
    );
  }

  return (
    <RoleBasedRoute allowedRoles={['Lead', 'Member']}>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 p-8">
        {/* Animated background orbs - lighter and more subtle */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-purple-200/40 rounded-full blur-3xl animate-float" />
          <div className="absolute top-40 right-20 w-96 h-96 bg-cyan-200/40 rounded-full blur-3xl animate-float-delayed" />
          <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-pink-200/40 rounded-full blur-3xl animate-float-slow" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="mb-6 animate-slide-in">
            <h1 className="text-4xl font-extrabold text-gray-900 mb-3 flex items-center gap-3">
              <span className="text-5xl animate-wave">👋</span>
              <span>Yo! {getDisplayName()}!</span>
            </h1>
            <p className="text-xl text-gray-600 font-medium">
              {message}
            </p>
          </div>

          {/* Global Search - Spotlight style centered */}
          <div className="flex justify-center mb-10">
            <GlobalSearch />
          </div>

          {/* Sprint Statistics Section */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <RocketOutlined className="text-purple-600" />
              Current Sprint Overview
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TeamCard team={ds} colorTheme="purple" delay={0} />
              <TeamCard team={sls} colorTheme="cyan" delay={100} />
            </div>
          </div>

          {/* Bug Summary Section */}
          <div className="animate-fade-in" style={{ animationDelay: '200ms' }}>
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <BugOutlined className="text-red-500" />
              Open Bug Report Summary
            </h2>
            <BugSummaryCard bugs={bugs} />
          </div>
        </div>
      </div>
    </RoleBasedRoute>
  );
}

interface TeamCardProps {
  team: TeamSummary & { isLoading: boolean; error: Error | null };
  colorTheme: 'purple' | 'cyan';
  delay: number;
}

function TeamCard({ team, colorTheme, delay }: TeamCardProps) {
  const colors = colorTheme === 'purple' 
    ? { 
        gradient: 'from-purple-500 to-indigo-600', 
        accent: 'text-purple-600', 
        bgAccent: 'bg-purple-50',
        border: 'border-purple-100',
        shadow: 'shadow-purple-100'
      }
    : { 
        gradient: 'from-cyan-500 to-blue-600', 
        accent: 'text-cyan-600', 
        bgAccent: 'bg-cyan-50',
        border: 'border-cyan-100',
        shadow: 'shadow-cyan-100'
      };

  if (team.isLoading) {
    return (
      <div 
        className={`bg-white/80 backdrop-blur-sm border border-gray-100 rounded-2xl p-6 animate-pulse shadow-sm`}
        style={{ animationDelay: `${delay}ms` }}
      >
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-6" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-20 bg-gray-100 rounded-xl" />
          <div className="h-20 bg-gray-100 rounded-xl" />
          <div className="h-20 bg-gray-100 rounded-xl" />
          <div className="h-20 bg-gray-100 rounded-xl" />
        </div>
      </div>
    );
  }

  if (team.error) {
    return (
      <div className={`bg-white/80 backdrop-blur-sm border border-red-200 rounded-2xl p-6 shadow-sm`}>
        <p className="text-red-500">Failed to load {team.teamName} data</p>
      </div>
    );
  }

  return (
    <div 
      className={`
        bg-white/90 backdrop-blur-sm border ${colors.border} rounded-2xl p-6
        transform transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:${colors.shadow}
        shadow-sm animate-fade-in
      `}
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}
    >
      {/* Team Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className={`text-xl font-bold ${colors.accent}`}>
            {team.teamName}
          </h3>
          <p className="text-gray-500 text-sm font-medium">
            {team.sprintName || 'No active sprint'}
          </p>
        </div>
        <div className={`bg-gradient-to-br ${colors.gradient} p-3 rounded-xl shadow-md`}>
          <TeamOutlined className="text-white text-xl" />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatItem 
          icon={<RiseOutlined />}
          label="Productivity"
          value={team.averageProductivity || '-'}
          iconColor={colors.accent}
          bgColor={colors.bgAccent}
        />
        <StatItem 
          icon={<ThunderboltOutlined />}
          label="WP/Hour"
          value={team.averageWpPerHour?.toFixed(2) || '-'}
          iconColor={colors.accent}
          bgColor={colors.bgAccent}
        />
        <StatItem 
          icon={<ClockCircleOutlined />}
          label="Avg Hours Open"
          value={team.averageHoursOpen ? `${team.averageHoursOpen.toFixed(1)}h` : '-'}
          iconColor={colors.accent}
          bgColor={colors.bgAccent}
        />
        <StatItem 
          icon={<CheckCircleOutlined />}
          label="Work Items"
          value={team.totalWorkItems ? `${team.totalWorkItems}/${team.closedWorkItems}` : '-'}
          iconColor={colors.accent}
          bgColor={colors.bgAccent}
        />
      </div>

      {/* Product vs Tech Debt Bar */}
      {team.productPercentage && team.techDebtPercentage && (
        <div className="mt-5 bg-gray-50 p-3 rounded-xl border border-gray-100">
          <div className="flex justify-between text-xs font-semibold text-gray-500 mb-2">
            <span>Product: {team.productPercentage}</span>
            <span>Tech Debt: {team.techDebtPercentage}</span>
          </div>
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden flex shadow-inner">
            <div 
              className="h-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all duration-500"
              style={{ width: team.productPercentage }}
            />
            <div 
              className="h-full bg-gradient-to-r from-orange-400 to-amber-500 transition-all duration-500"
              style={{ width: team.techDebtPercentage }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

interface StatItemProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  iconColor: string;
  bgColor: string;
}

function StatItem({ icon, label, value, iconColor, bgColor }: StatItemProps) {
  return (
    <div className={`${bgColor} rounded-xl p-3 transition-all duration-200 hover:scale-105 cursor-default border border-transparent hover:border-gray-100 shadow-sm hover:shadow-md`}>
      <div className={`${iconColor} text-lg mb-1`}>{icon}</div>
      <p className="text-xs text-gray-500 font-medium">{label}</p>
      <p className="text-lg font-bold text-gray-800">{value}</p>
    </div>
  );
}

interface BugSummaryCardProps {
  bugs: BugSummary & { isLoading: boolean; error: Error | null };
}

function BugSummaryCard({ bugs }: BugSummaryCardProps) {
  if (bugs.isLoading) {
    return (
      <div className="bg-white/80 backdrop-blur-sm border border-gray-100 rounded-2xl p-6 animate-pulse shadow-sm">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (bugs.error) {
    return (
      <div className="bg-white/80 backdrop-blur-sm border border-red-200 rounded-2xl p-6 shadow-sm">
        <p className="text-red-500">Failed to load bug data</p>
      </div>
    );
  }

  const bugStats = [
    { 
      label: 'Total Bugs', 
      value: bugs.totalBugs, 
      icon: <BugOutlined />, 
      bg: 'bg-red-50',
      border: 'border-red-100',
      textColor: 'text-red-600',
      iconColor: 'text-red-500'
    },
    { 
      label: 'Critical', 
      value: bugs.criticalCount, 
      icon: <ExclamationCircleOutlined />, 
      bg: 'bg-rose-50',
      border: 'border-rose-100',
      textColor: 'text-rose-600',
      iconColor: 'text-rose-500'
    },
    { 
      label: 'High', 
      value: bugs.highCount, 
      icon: <WarningOutlined />, 
      bg: 'bg-orange-50',
      border: 'border-orange-100',
      textColor: 'text-orange-600',
      iconColor: 'text-orange-500'
    },
    { 
      label: 'Medium', 
      value: bugs.mediumCount, 
      icon: <InfoCircleOutlined />, 
      bg: 'bg-amber-50',
      border: 'border-amber-100',
      textColor: 'text-amber-600',
      iconColor: 'text-amber-500'
    },
    { 
      label: 'Low', 
      value: bugs.lowCount, 
      icon: <CheckCircleOutlined />, 
      bg: 'bg-emerald-50',
      border: 'border-emerald-100',
      textColor: 'text-emerald-600',
      iconColor: 'text-emerald-500'
    },
    { 
      label: 'Avg Days Open', 
      value: bugs.averageDaysOpen.toFixed(1), 
      icon: <CalendarOutlined />, 
      bg: 'bg-slate-50',
      border: 'border-slate-100',
      textColor: 'text-slate-600',
      iconColor: 'text-slate-500'
    },
  ];

  return (
    <div className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl p-6 shadow-sm">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {bugStats.map((stat, idx) => (
          <div
            key={stat.label}
            className={`
              ${stat.bg} ${stat.border} border rounded-xl p-4 text-center
              transform transition-all duration-300 hover:scale-105 hover:shadow-lg
              animate-fade-in cursor-default
            `}
            style={{ animationDelay: `${300 + idx * 50}ms`, animationFillMode: 'both' }}
          >
            <div className={`${stat.iconColor} text-2xl mb-2`}>{stat.icon}</div>
            <p className={`text-2xl font-bold ${stat.textColor}`}>{stat.value}</p>
            <p className="text-xs text-gray-500 mt-1 font-medium">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
