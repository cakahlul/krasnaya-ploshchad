'use client';

import { LockOutlined, LogoutOutlined, MenuOutlined } from '@ant-design/icons';
import { logout } from '@src/lib/auth';
import { useTheme, useThemeColors } from '@src/hooks/useTheme';
import type { Theme } from '@src/hooks/useTheme';
import { Dropdown, message } from 'antd';
import type { MenuProps } from 'antd';
import useUser from '../hooks/useUser';
import { useIsFetching } from '@tanstack/react-query';
import { useDashboardSummary } from '@src/features/dashboard/hooks/useDashboardSummary';
import { useMemberProfile } from '@src/features/dashboard/hooks/useMemberProfile';
import { useBoards } from '@src/features/dashboard/hooks/useBoards';
import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

const PAGE_TITLES: Record<string, string> = {
  dashboard: 'Main Dashboard',
  reports: 'Team Reporting',
  'productivity-summary': 'Productivity Summary',
  'bug-monitoring': 'Bug Monitoring',
  'talent-leave': 'Talent Leave',
  'team-members': 'Team Members',
  'holiday-management': 'Holiday Management',
};

const THEME_SWATCHES: { key: Theme; color: string }[] = [
  { key: 'light', color: '#1282a2' },
  { key: 'void', color: '#22b8d4' },
  { key: 'crimson', color: '#e53935' },
];

function formatDate(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function BellIcon({ stroke }: { stroke: string }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

export default function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const { getDisplayName, setLoginPageMessage, getUserPhoto } = useUser();
  const { theme, setTheme } = useTheme();
  const { isDark, accent, accentL, titleCol, subCol } = useThemeColors();
  const isFetching = useIsFetching();
  const pathname = usePathname();

  // Subscribe reactively to dashboard data filtered by user's managed teams
  const { teams: memberTeams } = useMemberProfile();
  const { boards } = useBoards();
  const managedBoardIds = boards
    .filter(b => !b.isBugMonitoring && memberTeams.some(t => t.toLowerCase() === b.shortName.toLowerCase()))
    .map(b => b.boardId);
  const { teams: dashTeams } = useDashboardSummary(
    managedBoardIds.length > 0 ? managedBoardIds : undefined,
  );
  const sprints = dashTeams
    .filter(t => t.sprintName)
    .map(t => ({ board: t.teamName, sprint: t.sprintName! }));

  const [sprintHover, setSprintHover] = useState(false);
  const { member } = useMemberProfile();

  const pageTitle = useMemo(() => {
    const segments = pathname.split('/').filter(Boolean);
    const lastSegment = segments[segments.length - 1] ?? 'dashboard';
    return PAGE_TITLES[lastSegment] ?? 'Main Dashboard';
  }, [pathname]);

  const dateStr = useMemo(() => formatDate(), []);

  const handleLogout = async () => {
    try {
      await logout();
      setLoginPageMessage('✌️ Logged out! The keyboard misses you already.');
    } catch (error) {
      message.error('Logout failed');
      console.error(error);
    }
  };

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    if (key === 'logout') {
      handleLogout();
    } else if (key === 'password') {
      message.info('Change password clicked');
    }
  };

  const menuItems: MenuProps['items'] = [
    {
      key: 'password',
      icon: <LockOutlined />,
      label: 'Change Password',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      danger: true,
    },
  ];

  const displayGreeting = isFetching > 0
    ? `Loading...`
    : `Hey, ${member?.name || getDisplayName()?.split(' ')[0] || 'User'}!`;

  const userInitial = (member?.name || getDisplayName() || 'U').charAt(0).toUpperCase();
  const photoUrl = getUserPhoto();

  return (
    <header
      className="fixed top-[14px] left-[252px] right-[14px] h-[62px] rounded-[16px] z-50 flex items-center justify-between px-5 transition-colors duration-300"
      style={{
        backgroundColor: isDark ? 'rgba(13,24,41,0.92)' : 'rgba(255,255,255,0.94)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        boxShadow: isDark
          ? '0 2px 16px rgba(0,0,0,0.35)'
          : '0 2px 16px rgba(0,0,0,0.06)',
      }}
    >
      {/* Mobile menu toggle */}
      <button
        className="lg:hidden mr-3 p-1.5 rounded-lg cursor-pointer"
        onClick={onMenuClick}
        style={{ color: titleCol }}
        aria-label="Toggle menu"
      >
        <MenuOutlined className="text-lg" />
      </button>

      {/* Left section: greeting + page title + date */}
      <div className="flex flex-col justify-center min-w-0">
        <div className="flex items-center gap-2">
          <span
            className="text-[15px] font-semibold whitespace-nowrap"
            style={{ color: titleCol }}
          >
            {displayGreeting}
          </span>
          <span className="animate-topbar-wave text-base leading-none">👋</span>
          <span
            className="text-[13px] font-medium whitespace-nowrap hidden sm:inline"
            style={{ color: subCol }}
          >
            / {pageTitle}
          </span>
        </div>
        <span
          className="text-[11px] mt-0.5 whitespace-nowrap"
          style={{ color: subCol }}
        >
          {dateStr}
        </span>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right section */}
      <div className="flex items-center gap-3">
        {/* Theme switcher pill */}
        <div
          className="hidden sm:flex items-center gap-1.5 rounded-full px-2 py-1.5 transition-colors duration-300"
          style={{
            backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)',
          }}
        >
          {THEME_SWATCHES.map(({ key, color }) => {
            const isActive = theme === key;
            return (
              <button
                key={key}
                onClick={() => setTheme(key)}
                className="rounded-full cursor-pointer transition-all duration-200 h-[14px]"
                style={{
                  width: isActive ? 22 : 14,
                  backgroundColor: color,
                  boxShadow: isActive ? `0 0 0 2px ${isDark ? 'rgba(0,0,0,0.6)' : '#fff'}, 0 0 8px ${color}66` : 'none',
                }}
                aria-label={`Switch to ${key} theme`}
                title={`${key.charAt(0).toUpperCase() + key.slice(1)} theme`}
              />
            );
          })}
        </div>

        {/* Sprint live badge — stacked with hover overlay */}
        {sprints.length > 0 && (
          <div
            className="hidden md:block relative"
            onMouseEnter={() => setSprintHover(true)}
            onMouseLeave={() => setSprintHover(false)}
          >
            {/* Stacked badges */}
            <div style={{ position: 'relative', cursor: 'pointer' }}>
              {sprints.slice(0, 3).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 rounded-full px-3 py-1.5 text-white text-[11px] font-bold tracking-wider uppercase"
                  style={{
                    background: `linear-gradient(135deg, ${accent}, ${accentL})`,
                    position: i === 0 ? 'relative' : 'absolute',
                    top: i === 0 ? 0 : i * 3,
                    left: i === 0 ? 0 : i * 3,
                    zIndex: sprints.length - i,
                    opacity: i === 0 ? 1 : 0.4 - i * 0.15,
                  }}
                >
                  {i === 0 && (
                    <>
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
                      </span>
                      {sprints[0].sprint}
                      {sprints.length > 1 && (
                        <span style={{ opacity: 0.7, fontSize: 10 }}>+{sprints.length - 1}</span>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>

            {/* Hover dropdown showing all sprints */}
            {sprintHover && sprints.length > 1 && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: 8,
                  background: isDark ? '#101e32' : '#fff',
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#ebedf5'}`,
                  borderRadius: 12,
                  padding: '6px 0',
                  boxShadow: isDark ? '0 12px 40px rgba(0,0,0,0.5)' : '0 12px 40px rgba(1,29,77,0.12)',
                  zIndex: 100,
                  minWidth: 240,
                }}
              >
                {sprints.map((s, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '8px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      borderBottom: i < sprints.length - 1 ? `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#f5f6fb'}` : 'none',
                    }}
                  >
                    <span
                      style={{
                        background: `${accent}18`,
                        color: accent,
                        fontSize: 9.5,
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: 5,
                        flexShrink: 0,
                        fontFamily: "'Space Grotesk', sans-serif",
                      }}
                    >
                      {s.board}
                    </span>
                    <span
                      style={{
                        fontSize: 12,
                        color: isDark ? '#e8edf5' : '#011d4d',
                        fontWeight: 500,
                        fontFamily: "'Space Grotesk', sans-serif",
                      }}
                    >
                      {s.sprint}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* User avatar dropdown */}
        <Dropdown
          menu={{ items: menuItems, onClick: handleMenuClick }}
          trigger={['click']}
        >
          <button
            className="flex items-center justify-center w-9 h-9 rounded-[10px] text-white text-sm font-semibold cursor-pointer transition-transform hover:scale-105 overflow-hidden"
            style={{
              background: photoUrl
                ? undefined
                : `linear-gradient(135deg, ${accent}, ${accentL})`,
            }}
            title="Account options"
          >
            {photoUrl ? (
              <Image
                src={photoUrl}
                alt="User avatar"
                width={36}
                height={36}
                className="object-cover w-full h-full"
              />
            ) : (
              userInitial
            )}
          </button>
        </Dropdown>
      </div>
    </header>
  );
}
