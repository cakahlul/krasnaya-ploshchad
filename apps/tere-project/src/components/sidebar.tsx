'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useMediaQuery } from 'react-responsive';
import clsx from 'clsx';
import { useUserAccess } from '@src/hooks/useUserAccess';
import { useMemo, useState, useEffect, useCallback } from 'react';
import { useThemeColors } from '@src/hooks/useTheme';

/* ------------------------------------------------------------------ */
/*  SVG Icons – chunky hand-drawn stroke style                        */
/* ------------------------------------------------------------------ */

function IconDashboard({ color }: { color: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="7" height="7" rx="1.5" />
      <rect x="11" y="2" width="7" height="7" rx="1.5" />
      <rect x="2" y="11" width="7" height="7" rx="1.5" />
      <rect x="11" y="11" width="7" height="7" rx="1.5" />
    </svg>
  );
}

function IconTeamReporting({ color }: { color: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="12" width="3.5" height="6" rx="0.8" />
      <rect x="8" y="8" width="3.5" height="10" rx="0.8" />
      <rect x="14" y="4" width="3.5" height="14" rx="0.8" />
      <polyline points="2,6 8,4 16,2" strokeWidth="1.6" />
      <polyline points="14,2 16.5,2 16.5,4.5" strokeWidth="1.6" />
    </svg>
  );
}

function IconProductivity({ color }: { color: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16z" />
      <path d="M10 10 L6 13" strokeWidth="2" />
      <path d="M10 10 L13 6" strokeWidth="1.5" />
      <circle cx="10" cy="10" r="1.2" fill={color} stroke="none" />
    </svg>
  );
}

function IconBug({ color }: { color: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="10" cy="12" rx="5" ry="5.5" />
      <path d="M8 7.5c0-1.5 1-2.5 2-2.5s2 1 2 2.5" />
      <circle cx="8.5" cy="6" r="0.8" fill={color} stroke="none" />
      <circle cx="11.5" cy="6" r="0.8" fill={color} stroke="none" />
      <line x1="5" y1="10" x2="2" y2="8.5" />
      <line x1="15" y1="10" x2="18" y2="8.5" />
      <line x1="5" y1="13" x2="2" y2="14.5" />
      <line x1="15" y1="13" x2="18" y2="14.5" />
      <line x1="6" y1="16.5" x2="3.5" y2="18" />
      <line x1="14" y1="16.5" x2="16.5" y2="18" />
    </svg>
  );
}

function IconTalentLeave({ color }: { color: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="7" cy="6" r="2.8" />
      <path d="M2 16.5c0-3 2.2-5.2 5-5.2s5 2.2 5 5.2" />
      <rect x="13" y="10" width="5" height="7" rx="1" />
      <line x1="15.5" y1="10" x2="15.5" y2="8" />
    </svg>
  );
}

function IconTeamMembers({ color }: { color: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="7" cy="6" r="2.5" />
      <path d="M2 16c0-2.8 2.2-5 5-5s5 2.2 5 5" />
      <circle cx="14" cy="7" r="2" />
      <path d="M12.5 16c0-2.3 1.5-4 3.5-4s3 1.2 3 3.5" />
    </svg>
  );
}

function IconHoliday({ color }: { color: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="16" height="14" rx="2" />
      <line x1="2" y1="9" x2="18" y2="9" />
      <line x1="6" y1="2" x2="6" y2="6" />
      <line x1="14" y1="2" x2="14" y2="6" />
      <circle cx="12" cy="13" r="0.7" fill={color} stroke="none" />
      <circle cx="15" cy="12" r="0.5" fill={color} stroke="none" />
      <circle cx="14" cy="15" r="0.6" fill={color} stroke="none" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Menu definition                                                    */
/* ------------------------------------------------------------------ */

interface MenuItem {
  key: string;
  label: string;
  icon: (color: string) => React.ReactNode;
  roles: string[];
}

const menuItems: MenuItem[] = [
  {
    key: '/dashboard',
    label: 'Main Dashboard',
    icon: (c) => <IconDashboard color={c} />,
    roles: ['Lead', 'Member'],
  },
  {
    key: '/dashboard/reports',
    label: 'Team Reporting',
    icon: (c) => <IconTeamReporting color={c} />,
    roles: ['Lead', 'Member'],
  },
  {
    key: '/dashboard/productivity-summary',
    label: 'Productivity',
    icon: (c) => <IconProductivity color={c} />,
    roles: ['Lead'],
  },
  {
    key: '/dashboard/bug-monitoring',
    label: 'Bug Monitoring',
    icon: (c) => <IconBug color={c} />,
    roles: ['Lead'],
  },
  {
    key: '/dashboard/talent-leave',
    label: 'Talent Leave',
    icon: (c) => <IconTalentLeave color={c} />,
    roles: ['Lead', 'Member'],
  },
  {
    key: '/dashboard/team-members',
    label: 'Team Members',
    icon: (c) => <IconTeamMembers color={c} />,
    roles: ['Lead'],
  },
  {
    key: '/dashboard/holiday-management',
    label: 'Holidays',
    icon: (c) => <IconHoliday color={c} />,
    roles: ['Lead'],
  },
];

/* ------------------------------------------------------------------ */
/*  Fun quotes                                                         */
/* ------------------------------------------------------------------ */

const FUN_QUOTES = [
  '"Ship it before the sprint gods notice."',
  '"A bug-free build is just a myth with tests."',
  '"Keep calm and clear your Jira board."',
  '"Coffee first, deploy later."',
  '"Velocity is a vibe, not a number."',
  '"Today\u2019s blocker is tomorrow\u2019s retro joke."',
  '"Merge conflicts build character."',
  '"No meetings before noon. Ever."',
];

/* ------------------------------------------------------------------ */
/*  Sidebar Component                                                  */
/* ------------------------------------------------------------------ */

export default function Sidebar({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const isDesktop = useMediaQuery({ minWidth: 1024 });
  const pathname = usePathname();
  const router = useRouter();
  const { role } = useUserAccess();
  const { isDark, accent, accentL } = useThemeColors();

  const [quote, setQuote] = useState('');

  useEffect(() => {
    setQuote(FUN_QUOTES[Math.floor(Math.random() * FUN_QUOTES.length)]);
  }, []);

  const filteredMenuItems = useMemo(() => {
    if (!role) return [];
    return menuItems.filter((item) => item.roles.includes(role));
  }, [role]);

  const handleClick = useCallback(
    (path: string) => {
      router.push(path);
      if (!isDesktop) onClose();
    },
    [router, isDesktop, onClose],
  );

  /* ---- derived colours ---- */
  const sidebarBg = isDark
    ? 'linear-gradient(180deg, #0d1829 0%, #0f1f36 100%)'
    : '#ffffff';
  const navTextColor = isDark ? 'rgba(255,255,255,0.7)' : '#4b5563';
  const navTextActive = isDark ? '#ffffff' : '#011d4d';
  const hoverBg = isDark ? 'rgba(255,255,255,0.06)' : '#f3f4f6';
  const activeBg = isDark
    ? `${accent}22`
    : `${accent}12`;
  const quoteColor = isDark ? 'rgba(255,255,255,0.3)' : '#9ca3af';

  /* ---- Header chip for Lead ---- */
  const TeamHealthChip = () => (
    <div className="flex gap-1.5 mt-2">
      <div
        className="flex-1 rounded-lg px-2 py-1 text-center"
        style={{ background: 'rgba(255,255,255,0.12)' }}
      >
        <div className="text-[11px] text-white/50 leading-tight">Above Target</div>
        <div className="text-sm font-bold text-white leading-tight">3/6</div>
      </div>
      <div
        className="flex-1 rounded-lg px-2 py-1 text-center"
        style={{ background: 'rgba(255,255,255,0.12)' }}
      >
        <div className="text-[11px] text-white/50 leading-tight">Open Bugs</div>
        <div className="text-sm font-bold text-white leading-tight">4</div>
      </div>
    </div>
  );

  /* ---- Header chip for Member ---- */
  const SprintProgressChip = () => {
    const pct = 64;
    const day = 7;
    const total = 10;
    return (
      <div className="mt-2">
        <div className="flex justify-between text-[11px] text-white/60 mb-1">
          <span>Sprint 24.2</span>
          <span>Day {day} of {total}</span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.15)' }}>
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${pct}%`,
              background: `linear-gradient(90deg, ${accent}, ${accentL})`,
            }}
          />
        </div>
        <div className="text-[11px] text-white/50 mt-0.5 text-right">{pct}%</div>
      </div>
    );
  };

  /* ---- Sidebar inner content ---- */
  const SidebarContent = () => (
    <div
      className={clsx(
        'flex flex-col h-full',
        isDesktop && 'rounded-[20px]',
      )}
      style={{
        width: 224,
        background: sidebarBg,
        boxShadow: isDesktop
          ? '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)'
          : undefined,
      }}
    >
      {/* ---- Header ---- */}
      <div
        className="px-4 pt-5 pb-4 rounded-t-[20px]"
        style={{
          background: `linear-gradient(135deg, #0b1a2e 0%, #0f2b3d 60%, ${accent}44 100%)`,
        }}
      >
        <div className="flex items-center gap-3">
          {/* Logo icon */}
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{
              background: `linear-gradient(135deg, ${accent}, ${accentL})`,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <rect x="2" y="10" width="3" height="6" rx="0.8" fill="white" opacity="0.9" />
              <rect x="7.5" y="6" width="3" height="10" rx="0.8" fill="white" />
              <rect x="13" y="2" width="3" height="14" rx="0.8" fill="white" opacity="0.9" />
            </svg>
          </div>
          <div>
            <div className="text-white font-bold text-lg leading-tight">TERE</div>
            <div className="text-[11px] text-white/50 leading-tight">
              v2.0 &middot; {role ?? '...'}
            </div>
          </div>
        </div>

        {role === 'Lead' && <TeamHealthChip />}
        {role === 'Member' && <SprintProgressChip />}
      </div>

      {/* ---- Navigation ---- */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {filteredMenuItems.map((item) => {
          const isActive = pathname === item.key;
          const iconColor = isActive ? accent : (isDark ? 'rgba(255,255,255,0.45)' : '#6b7280');

          return (
            <button
              key={item.key}
              onClick={() => handleClick(item.key)}
              className={clsx(
                'w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left text-[13px] transition-all duration-150 relative group',
              )}
              style={{
                background: isActive ? activeBg : undefined,
                color: isActive ? navTextActive : navTextColor,
                fontWeight: isActive ? 600 : 400,
                borderLeft: isActive ? `3px solid ${accent}` : '3px solid transparent',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.background = hoverBg;
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.background = '';
                }
              }}
            >
              {/* Glowing dot for active */}
              {isActive && (
                <span
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full"
                  style={{
                    background: accent,
                    boxShadow: `0 0 6px ${accent}`,
                  }}
                />
              )}
              <span className="flex-shrink-0">{item.icon(iconColor)}</span>
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* ---- Fun quote footer ---- */}
      <div className="px-4 pb-4 pt-2">
        <p
          className="text-[11px] italic leading-snug"
          style={{ color: quoteColor }}
        >
          {quote}
        </p>
      </div>
    </div>
  );

  /* ---- Desktop: floating fixed sidebar ---- */
  if (isDesktop) {
    return (
      <div
        className="fixed z-40"
        style={{
          left: 14,
          top: 14,
          bottom: 14,
          width: 224,
        }}
      >
        <SidebarContent />
      </div>
    );
  }

  /* ---- Mobile: drawer ---- */
  return (
    <>
      <div
        className={clsx(
          'fixed inset-y-0 left-0 z-50 transition-transform duration-300',
        )}
        style={{
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
          width: 224,
        }}
      >
        <SidebarContent />
      </div>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
          onClick={onClose}
        />
      )}
    </>
  );
}
