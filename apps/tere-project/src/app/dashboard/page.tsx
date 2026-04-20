'use client';

import useUser from '@src/hooks/useUser';
import { remoteConfig } from '@src/lib/firebase';
import { fetchAndActivate, getValue } from 'firebase/remote-config';
import { useEffect, useState } from 'react';
import { useDashboardSummary, useDashboardBugSummary, TeamSummary, BugSummary } from '@src/features/dashboard/hooks/useDashboardSummary';
import { useMemberProfile } from '@src/features/dashboard/hooks/useMemberProfile';
import { useBoards } from '@src/features/dashboard/hooks/useBoards';
import { useThemeColors } from '@src/hooks/useTheme';
import dynamic from 'next/dynamic';

const GlobalSearch = dynamic(
  () => import('@src/features/dashboard/components/GlobalSearch'),
  { ssr: false }
);

const mono = "var(--font-ibm-plex-mono), 'IBM Plex Mono', monospace";
const sans = "var(--font-space-grotesk), 'Space Grotesk', sans-serif";

export default function Dashboard() {
  const { getDisplayName } = useUser();
  const [message, setMessage] = useState(
    "Ready to rock this day? Let's code and conquer",
  );
  const T = useThemeColors();

  const { member, teams: memberTeams, isLoading: profileLoading } = useMemberProfile();
  const { boards, isLoading: boardsLoading } = useBoards();

  const isLead = member?.isLead ?? false;

  const memberBoardIds: number[] | undefined = boards
    .filter(b => !b.isBugMonitoring && memberTeams.some(t => t.toLowerCase() === b.shortName.toLowerCase()))
    .map(b => b.boardId);

  const { teams, isLoading: summaryLoading } = useDashboardSummary(
    memberBoardIds,
  );
  const bugBoards = boards.filter(b => b.isBugMonitoring);

  const isBootstrapping = profileLoading || boardsLoading;

  useEffect(() => {
    fetchAndActivate(remoteConfig).then(() => {
      setMessage(getValue(remoteConfig, 'welcome_message').asString());
    });
  }, []);

  if (isBootstrapping) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: T.cardBrd, borderTopColor: T.accent }}
          />
          <p style={{ color: T.subCol, fontFamily: sans, fontSize: 13 }}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return isLead
    ? <LeadDashboard teams={teams} bugBoards={bugBoards} summaryLoading={summaryLoading} displayName={getDisplayName() ?? 'User'} message={message} />
    : <MemberDashboard teams={teams} summaryLoading={summaryLoading} displayName={getDisplayName() ?? 'User'} message={message} />;
}

/* ── Gradient KPI Card ── */
function GradCard({ label, value, vibe, gradient, shadow, delay }: {
  label: string; value: string | number; vibe: string;
  gradient: string; shadow: string; delay: number;
}) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: gradient,
        borderRadius: 16,
        padding: '18px',
        boxShadow: hov ? `0 16px 40px ${shadow}` : `0 4px 20px ${shadow}88`,
        transform: hov ? 'translateY(-4px) scale(1.02)' : 'none',
        transition: 'all 0.25s cubic-bezier(0.34,1.4,0.64,1)',
        position: 'relative',
        overflow: 'hidden',
        cursor: 'default',
      }}
    >
      <div style={{ position: 'absolute', top: -18, right: -18, width: 72, height: 72, borderRadius: '50%', background: 'rgba(255,255,255,0.12)', filter: 'blur(18px)' }} />
      <div style={{ position: 'relative' }}>
        <div style={{ fontSize: 30, fontWeight: 800, color: '#fff', fontFamily: mono, lineHeight: 1, letterSpacing: -1, marginBottom: 3 }}>{value}</div>
        <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.6)', fontFamily: sans, fontWeight: 500, marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.92)', fontFamily: sans, fontWeight: 700 }}>{vibe}</div>
      </div>
    </div>
  );
}

/* ── LEAD DASHBOARD ── */
function LeadDashboard({ teams, bugBoards, summaryLoading, displayName, message }: {
  teams: (TeamSummary & { isLoading: boolean; error: Error | null })[];
  bugBoards: { boardId: number; name: string; shortName: string }[];
  summaryLoading: boolean;
  displayName: string;
  message: string;
}) {
  const T = useThemeColors();

  const totalBoards = teams.length;
  const aboveTarget = teams.filter(t => {
    const prod = parseFloat(t.averageProductivity || '0');
    return prod >= 100;
  }).length;

  const boardColors = [
    { gradient: 'linear-gradient(135deg,#0f766e,#0891b2)', shadow: 'rgba(8,145,178,0.3)', color: T.accent, colorL: T.accentL },
    { gradient: 'linear-gradient(135deg,#4f46e5,#7c3aed)', shadow: 'rgba(124,58,237,0.3)', color: '#7c3aed', colorL: '#a78bfa' },
    { gradient: 'linear-gradient(135deg,#059669,#0d9488)', shadow: 'rgba(5,150,105,0.3)', color: '#059669', colorL: '#34d399' },
    { gradient: 'linear-gradient(135deg,#d97706,#ea580c)', shadow: 'rgba(217,119,6,0.3)', color: '#d97706', colorL: '#fbbf24' },
  ];

  return (
    <div style={{ paddingBottom: 24 }}>
      {/* Welcome */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: T.titleCol, margin: 0, fontFamily: sans, letterSpacing: -0.5 }}>
          Team at a Glance
        </h1>
        <p style={{ color: T.subCol, margin: '4px 0 0', fontSize: 12.5, fontFamily: sans }}>{message}</p>
      </div>

      {/* Global Search */}
      <div className="flex justify-center mb-6">
        <GlobalSearch />
      </div>

      {/* Top KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 14 }}>
        <GradCard label="Total Boards" value={totalBoards} vibe={`${aboveTarget} above target`} gradient="linear-gradient(135deg,#0f766e,#0891b2)" shadow="rgba(8,145,178,0.35)" delay={0} />
        <GradCard label="Teams Tracked" value={teams.length} vibe="all boards" gradient="linear-gradient(135deg,#4f46e5,#7c3aed)" shadow="rgba(124,58,237,0.35)" delay={60} />
        <GradCard label="Bug Boards" value={bugBoards.length} vibe="monitoring active" gradient="linear-gradient(135deg,#059669,#0d9488)" shadow="rgba(5,150,105,0.35)" delay={120} />
        <GradCard label="Active Members" value="-" vibe="across all boards" gradient="linear-gradient(135deg,#d97706,#ea580c)" shadow="rgba(217,119,6,0.35)" delay={180} />
      </div>

      {/* Board summary cards */}
      {summaryLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
          {[0, 1].map(i => (
            <div key={i} style={{ background: T.cardBg, borderRadius: 16, border: `1px solid ${T.cardBrd}`, padding: 24, minHeight: 200 }}>
              <div className="animate-pulse" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ height: 20, width: 140, background: T.rowBrd, borderRadius: 6 }} />
                <div style={{ height: 40, width: 100, background: T.rowBrd, borderRadius: 6 }} />
                <div style={{ height: 16, width: '100%', background: T.rowBrd, borderRadius: 6 }} />
                <div style={{ height: 16, width: '80%', background: T.rowBrd, borderRadius: 6 }} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: teams.length > 1 ? '1fr 1fr' : '1fr', gap: 12, marginBottom: 14 }}>
          {teams.map((team, bi) => {
            const bc = boardColors[bi % boardColors.length];
            const prod = parseFloat(team.averageProductivity || '0');
            return (
              <div key={team.boardId} style={{ background: T.cardBg, borderRadius: 16, border: `1px solid ${T.cardBrd}`, overflow: 'hidden' }}>
                {/* Board header */}
                <div style={{ background: bc.gradient, padding: '16px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', fontFamily: sans }}>{team.teamName}</div>
                    <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.65)', fontFamily: mono, marginTop: 2 }}>{team.sprintName || 'No active sprint'}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 28, fontWeight: 800, color: '#fff', fontFamily: mono, lineHeight: 1 }}>{team.averageProductivity || '-'}</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.65)', fontFamily: sans }}>avg productivity</div>
                  </div>
                </div>
                {/* Stats */}
                <div style={{ padding: '12px 16px', display: 'flex', gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 9.5, color: T.subCol, fontFamily: sans, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 2 }}>WP/Hour</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: T.titleCol, fontFamily: mono }}>{team.averageWpPerHour?.toFixed(2) || '-'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 9.5, color: T.subCol, fontFamily: sans, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 2 }}>Work Items</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: T.titleCol, fontFamily: mono }}>{team.totalWorkItems ? `${team.closedWorkItems}/${team.totalWorkItems}` : '-'}</div>
                  </div>
                  {team.averageHoursOpen != null && (
                    <div>
                      <div style={{ fontSize: 9.5, color: T.subCol, fontFamily: sans, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 2 }}>Avg Hours Open</div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: T.titleCol, fontFamily: mono }}>{team.averageHoursOpen.toFixed(1)}h</div>
                    </div>
                  )}
                </div>
                {/* Progress bar */}
                {team.productPercentage && team.techDebtPercentage && (
                  <div style={{ padding: '0 16px 14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9.5, color: T.subCol, fontFamily: sans, marginBottom: 4 }}>
                      <span>Product: {team.productPercentage}</span>
                      <span>Tech Debt: {team.techDebtPercentage}</span>
                    </div>
                    <div style={{ height: 5, background: T.isVoid ? 'rgba(255,255,255,0.06)' : '#f0f2f8', borderRadius: 99, overflow: 'hidden', display: 'flex' }}>
                      <div style={{ height: '100%', width: team.productPercentage, background: `linear-gradient(90deg, #10b981, #059669)`, borderRadius: 99 }} />
                      <div style={{ height: '100%', width: team.techDebtPercentage, background: `linear-gradient(90deg, #f59e0b, #d97706)`, borderRadius: 99 }} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Bug Summary — leads only */}
      {bugBoards.length > 0 && (
        <div style={{ background: T.cardBg, borderRadius: 16, border: `1px solid ${T.cardBrd}`, overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: `1px solid ${T.cardBrd}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: 13, fontWeight: 700, color: T.titleCol, fontFamily: sans }}>Bug Board Summary</span>
              <div style={{ fontSize: 11, color: T.subCol, fontFamily: sans, marginTop: 1 }}>{bugBoards.length} board{bugBoards.length !== 1 ? 's' : ''} monitored</div>
            </div>
          </div>
          <div style={{ padding: '12px 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {bugBoards.map(board => (
              <DashboardBugRow key={board.boardId} boardId={board.boardId} title={board.name} shortName={board.shortName} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Bug Row for Lead Dashboard ── */
function DashboardBugRow({ boardId, title, shortName }: { boardId: number; title: string; shortName: string }) {
  const T = useThemeColors();
  const { bugs } = useDashboardBugSummary(boardId, true);

  if (bugs.isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0' }}>
        <div className="animate-pulse" style={{ height: 16, width: 200, background: T.rowBrd, borderRadius: 4 }} />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: `1px solid ${T.rowBrd}` }}>
      <span style={{ background: `${T.accent}15`, color: T.accent, fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 5, fontFamily: sans }}>{shortName}</span>
      <span style={{ fontSize: 12.5, color: T.rowCol, fontFamily: sans, fontWeight: 500, flex: 1 }}>{title}</span>
      <div style={{ display: 'flex', gap: 12, fontSize: 11, fontFamily: mono }}>
        <span style={{ color: '#ef4444', fontWeight: 600 }}>{bugs.criticalCount} critical</span>
        <span style={{ color: '#f59e0b', fontWeight: 600 }}>{bugs.highCount} high</span>
        <span style={{ color: T.subCol }}>{bugs.totalBugs} total</span>
      </div>
    </div>
  );
}

/* ── MEMBER DASHBOARD ── */
function MemberDashboard({ teams, summaryLoading, displayName, message }: {
  teams: (TeamSummary & { isLoading: boolean; error: Error | null })[];
  summaryLoading: boolean;
  displayName: string;
  message: string;
}) {
  const T = useThemeColors();

  return (
    <div style={{ paddingBottom: 24 }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: T.titleCol, margin: 0, fontFamily: sans, letterSpacing: -0.5 }}>
          My Sprint Dashboard
        </h1>
        <p style={{ color: T.subCol, margin: '4px 0 0', fontSize: 12.5, fontFamily: sans }}>{message}</p>
      </div>

      {/* Global Search */}
      <div className="flex justify-center mb-6">
        <GlobalSearch />
      </div>

      {/* Sprint Overview */}
      {summaryLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
          {[0, 1].map(i => (
            <div key={i} style={{ background: T.cardBg, borderRadius: 16, border: `1px solid ${T.cardBrd}`, padding: 24, minHeight: 160 }}>
              <div className="animate-pulse" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ height: 20, width: 140, background: T.rowBrd, borderRadius: 6 }} />
                <div style={{ height: 40, width: 100, background: T.rowBrd, borderRadius: 6 }} />
              </div>
            </div>
          ))}
        </div>
      ) : teams.length === 0 ? (
        <div style={{ background: T.cardBg, borderRadius: 16, border: `1px solid ${T.cardBrd}`, padding: 40, textAlign: 'center' }}>
          <p style={{ color: T.subCol, fontFamily: sans }}>No active sprint data found.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: teams.length > 1 ? '1fr 1fr' : '1fr', gap: 12 }}>
          {teams.map((team, bi) => {
            const gradients = [
              'linear-gradient(135deg,#0f766e,#0891b2)',
              'linear-gradient(135deg,#4f46e5,#7c3aed)',
              'linear-gradient(135deg,#059669,#0d9488)',
              'linear-gradient(135deg,#d97706,#ea580c)',
            ];
            const grad = gradients[bi % gradients.length];
            return (
              <div key={team.boardId} style={{ background: T.cardBg, borderRadius: 16, border: `1px solid ${T.cardBrd}`, overflow: 'hidden' }}>
                <div style={{ background: grad, padding: '16px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', fontFamily: sans }}>{team.teamName}</div>
                    <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.65)', fontFamily: mono, marginTop: 2 }}>{team.sprintName || 'No active sprint'}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 28, fontWeight: 800, color: '#fff', fontFamily: mono, lineHeight: 1 }}>{team.averageProductivity || '-'}</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.65)', fontFamily: sans }}>productivity</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 p-4">
                  {[
                    { label: 'WP/Hour', value: team.averageWpPerHour?.toFixed(2) || '-' },
                    { label: 'Work Items', value: team.totalWorkItems ? `${team.closedWorkItems}/${team.totalWorkItems}` : '-' },
                    { label: 'Avg Hours Open', value: team.averageHoursOpen ? `${team.averageHoursOpen.toFixed(1)}h` : '-' },
                    { label: 'Product %', value: team.productPercentage || '-' },
                  ].map((stat, si) => (
                    <div key={si} style={{ background: T.isVoid ? 'rgba(255,255,255,0.04)' : '#f5f6fb', borderRadius: 10, padding: '10px 12px' }}>
                      <div style={{ fontSize: 9.5, color: T.subCol, fontFamily: sans, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>{stat.label}</div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: T.titleCol, fontFamily: mono }}>{stat.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
