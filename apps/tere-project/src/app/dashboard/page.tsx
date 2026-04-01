'use client';

import useUser from '@src/hooks/useUser';
import { remoteConfig } from '@src/lib/firebase';
import { fetchAndActivate, getValue } from 'firebase/remote-config';
import { useEffect, useState } from 'react';
import { useDashboardSummary, useDashboardBugSummary, TeamSummary, BugSummary } from '@src/features/dashboard/hooks/useDashboardSummary';
import { useMemberProfile } from '@src/features/dashboard/hooks/useMemberProfile';
import { useBoards } from '@src/features/dashboard/hooks/useBoards';
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
import LoadingBounce from '@src/components/loadingBounce';
import { ThemeToggle } from '@src/components/ThemeToggle';
import dynamic from 'next/dynamic';

const GlobalSearch = dynamic(
  () => import('@src/features/dashboard/components/GlobalSearch'),
  { ssr: false }
);

export default function Dashboard() {
  const { getDisplayName } = useUser();
  const [message, setMessage] = useState(
    "Ready to rock this day? Let's code and conquer 💻🔥",
  );

  const { teams: memberTeams, isLoading: profileLoading } = useMemberProfile();
  const { boards, isLoading: boardsLoading } = useBoards();

  const LEAD_TEAMS = ['lead', 'circle lead'];
  const isLead = memberTeams.some(t => LEAD_TEAMS.includes(t.toLowerCase()));

  // Map member's team shortNames → boardIds for non-leads
  const memberBoardIds: number[] | undefined = isLead
    ? undefined
    : boards
        .filter(b => memberTeams.some(t => t.toLowerCase() === b.shortName.toLowerCase()))
        .map(b => b.boardId);

  const { teams, isLoading: summaryLoading } = useDashboardSummary(
    isLead ? undefined : memberBoardIds,
  );
  const { bugs } = useDashboardBugSummary();

  const isBootstrapping = profileLoading || boardsLoading;

  useEffect(() => {
    fetchAndActivate(remoteConfig).then(() => {
      setMessage(getValue(remoteConfig, 'welcome_message').asString());
    });
  }, []);

  if (isBootstrapping) return <LoadingBounce />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 dark:text-gray-100 p-8 transition-colors duration-300">
      {/* Animated background orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-200/40 rounded-full blur-3xl animate-float" />
        <div className="absolute top-40 right-20 w-96 h-96 bg-cyan-200/40 rounded-full blur-3xl animate-float-delayed" />
        <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-pink-200/40 rounded-full blur-3xl animate-float-slow" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 animate-slide-in flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-3">
              <span className="text-5xl animate-wave">👋</span>
              <span>Yo! {getDisplayName()}!</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 font-medium">
              {message}
            </p>
          </div>
          <ThemeToggle />
        </div>

        {/* Global Search */}
        <div className="flex justify-center mb-10">
          <GlobalSearch />
        </div>

        {/* Sprint Overview */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
            <RocketOutlined className="text-purple-600" />
            Current Sprint Overview
          </h2>

          {summaryLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[...Array(isLead ? 4 : Math.max(memberBoardIds?.length ?? 2, 1))].map((_, i) => (
                <TeamCardSkeleton key={i} delay={i * 100} />
              ))}
            </div>
          ) : teams.length === 0 ? (
            <div className="bg-white/80 backdrop-blur-sm border border-gray-100 rounded-2xl p-10 text-center text-gray-400 shadow-sm">
              No active sprint data found.
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {teams.map((team, index) => (
                <TeamCard
                  key={team.boardId}
                  team={team}
                  colorTheme={COLOR_THEMES[index % COLOR_THEMES.length]}
                  delay={index * 100}
                />
              ))}
            </div>
          )}
        </div>

        {/* Bug Summary — leads only */}
        {isLead && (
          <div className="animate-fade-in" style={{ animationDelay: '200ms' }}>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
              <BugOutlined className="text-red-500" />
              Open Bug Report Summary
            </h2>
            <BugSummaryCard bugs={bugs} />
          </div>
        )}
      </div>
    </div>
  );
}

const COLOR_THEMES = ['purple', 'cyan', 'green', 'orange'] as const;
type ColorTheme = typeof COLOR_THEMES[number];

const THEME_STYLES: Record<ColorTheme, { gradient: string; accent: string; bgAccent: string; border: string; shadow: string }> = {
  purple: { gradient: 'from-purple-500 to-indigo-600', accent: 'text-purple-600', bgAccent: 'bg-purple-50', border: 'border-purple-100', shadow: 'shadow-purple-100' },
  cyan:   { gradient: 'from-cyan-500 to-blue-600',     accent: 'text-cyan-600',   bgAccent: 'bg-cyan-50',   border: 'border-cyan-100',   shadow: 'shadow-cyan-100'   },
  green:  { gradient: 'from-green-500 to-teal-600',    accent: 'text-green-600',  bgAccent: 'bg-green-50',  border: 'border-green-100',  shadow: 'shadow-green-100'  },
  orange: { gradient: 'from-orange-500 to-amber-600',  accent: 'text-orange-600', bgAccent: 'bg-orange-50', border: 'border-orange-100', shadow: 'shadow-orange-100' },
};

function TeamCardSkeleton({ delay }: { delay: number }) {
  return (
    <div
      className="bg-white/80 backdrop-blur-sm border border-gray-100 rounded-2xl p-6 animate-pulse shadow-sm"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="space-y-2">
          <div className="h-5 bg-gray-200 rounded w-28" />
          <div className="h-3 bg-gray-100 rounded w-40" />
        </div>
        <div className="w-12 h-12 bg-gray-200 rounded-xl" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-20 bg-gray-100 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

interface TeamCardProps {
  team: TeamSummary & { isLoading: boolean; error: Error | null };
  colorTheme: ColorTheme;
  delay: number;
}

function TeamCard({ team, colorTheme, delay }: TeamCardProps) {
  const colors = THEME_STYLES[colorTheme];

  if (team.error) {
    return (
      <div className="bg-white/80 backdrop-blur-sm border border-red-200 rounded-2xl p-6 shadow-sm">
        <p className="text-red-500">Failed to load {team.teamName} data</p>
      </div>
    );
  }

  return (
    <div
      className={`bg-white/90 backdrop-blur-sm border ${colors.border} rounded-2xl p-6 transform transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:${colors.shadow} shadow-sm animate-fade-in`}
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className={`text-xl font-bold ${colors.accent}`}>{team.teamName}</h3>
          <p className="text-gray-500 text-sm font-medium">
            {team.sprintName || 'No active sprint'}
          </p>
        </div>
        <div className={`bg-gradient-to-br ${colors.gradient} p-3 rounded-xl shadow-md`}>
          <TeamOutlined className="text-white text-xl" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatItem icon={<RiseOutlined />}         label="Productivity"   value={team.averageProductivity || '-'}                             iconColor={colors.accent} bgColor={colors.bgAccent} />
        <StatItem icon={<ThunderboltOutlined />}  label="WP/Hour"        value={team.averageWpPerHour?.toFixed(2) || '-'}                    iconColor={colors.accent} bgColor={colors.bgAccent} />
        <StatItem icon={<ClockCircleOutlined />}  label="Avg Hours Open" value={team.averageHoursOpen ? `${team.averageHoursOpen.toFixed(1)}h` : '-'} iconColor={colors.accent} bgColor={colors.bgAccent} />
        <StatItem icon={<CheckCircleOutlined />}  label="Work Items"     value={team.totalWorkItems ? `${team.closedWorkItems}/${team.totalWorkItems}` : '-'} iconColor={colors.accent} bgColor={colors.bgAccent} />
      </div>

      {team.productPercentage && team.techDebtPercentage && (
        <div className="mt-5 bg-gray-50 p-3 rounded-xl border border-gray-100">
          <div className="flex justify-between text-xs font-semibold text-gray-500 mb-2">
            <span>Product: {team.productPercentage}</span>
            <span>Tech Debt: {team.techDebtPercentage}</span>
          </div>
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden flex shadow-inner">
            <div className="h-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all duration-500" style={{ width: team.productPercentage }} />
            <div className="h-full bg-gradient-to-r from-orange-400 to-amber-500 transition-all duration-500" style={{ width: team.techDebtPercentage }} />
          </div>
        </div>
      )}
    </div>
  );
}

function StatItem({ icon, label, value, iconColor, bgColor }: {
  icon: React.ReactNode; label: string; value: string; iconColor: string; bgColor: string;
}) {
  return (
    <div className={`${bgColor} rounded-xl p-3 transition-all duration-200 hover:scale-105 cursor-default border border-transparent hover:border-gray-100 shadow-sm hover:shadow-md`}>
      <div className={`${iconColor} text-lg mb-1`}>{icon}</div>
      <p className="text-xs text-gray-500 font-medium">{label}</p>
      <p className="text-lg font-bold text-gray-800">{value}</p>
    </div>
  );
}

function BugSummaryCard({ bugs }: { bugs: BugSummary & { isLoading: boolean; error: Error | null } }) {
  if (bugs.isLoading) {
    return (
      <div className="bg-white/80 backdrop-blur-sm border border-gray-100 rounded-2xl p-6 animate-pulse shadow-sm">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-xl" />)}
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
    { label: 'Total Bugs',    value: bugs.totalBugs,                    icon: <BugOutlined />,              bg: 'bg-red-50',     border: 'border-red-100',     textColor: 'text-red-600',     iconColor: 'text-red-500'     },
    { label: 'Critical',      value: bugs.criticalCount,                icon: <ExclamationCircleOutlined />, bg: 'bg-rose-50',    border: 'border-rose-100',    textColor: 'text-rose-600',    iconColor: 'text-rose-500'    },
    { label: 'High',          value: bugs.highCount,                    icon: <WarningOutlined />,           bg: 'bg-orange-50',  border: 'border-orange-100',  textColor: 'text-orange-600',  iconColor: 'text-orange-500'  },
    { label: 'Medium',        value: bugs.mediumCount,                  icon: <InfoCircleOutlined />,        bg: 'bg-amber-50',   border: 'border-amber-100',   textColor: 'text-amber-600',   iconColor: 'text-amber-500'   },
    { label: 'Low',           value: bugs.lowCount,                     icon: <CheckCircleOutlined />,       bg: 'bg-emerald-50', border: 'border-emerald-100', textColor: 'text-emerald-600', iconColor: 'text-emerald-500' },
    { label: 'Avg Days Open', value: bugs.averageDaysOpen.toFixed(1),   icon: <CalendarOutlined />,          bg: 'bg-slate-50',   border: 'border-slate-100',   textColor: 'text-slate-600',   iconColor: 'text-slate-500'   },
  ];

  return (
    <div className="bg-white/90 backdrop-blur-sm border border-gray-100 rounded-2xl p-6 shadow-sm">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {bugStats.map((stat, idx) => (
          <div
            key={stat.label}
            className={`${stat.bg} ${stat.border} border rounded-xl p-4 text-center transform transition-all duration-300 hover:scale-105 hover:shadow-lg animate-fade-in cursor-default`}
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
