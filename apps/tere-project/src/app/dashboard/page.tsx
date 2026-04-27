'use client';

import { remoteConfig } from '@src/lib/firebase';
import { fetchAndActivate, getValue } from 'firebase/remote-config';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDashboardSummary, useDashboardBugSummary, TeamSummary } from '@src/features/dashboard/hooks/useDashboardSummary';
import { useMemberProfile } from '@src/features/dashboard/hooks/useMemberProfile';
import { useBoards } from '@src/features/dashboard/hooks/useBoards';
import { useMembers } from '@src/features/dashboard/hooks/useMembers';
import { useThemeColors } from '@src/hooks/useTheme';
import type { MemberResponse } from '@shared/types/member.types';
import dynamic from 'next/dynamic';

const GlobalSearch = dynamic(
  () => import('@src/features/dashboard/components/GlobalSearch'),
  { ssr: false }
);

const mono = "var(--font-ibm-plex-mono), 'IBM Plex Mono', monospace";
const sans = "var(--font-space-grotesk), 'Space Grotesk', sans-serif";

export default function Dashboard() {
  const [message, setMessage] = useState(
    "Ready to rock this day? Let's code and conquer",
  );
  const T = useThemeColors();

  const { member, teams: memberTeams, isLoading: profileLoading } = useMemberProfile();
  const { boards, isLoading: boardsLoading } = useBoards();
  const { members } = useMembers();

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

  // Build boardId → shortName lookup for member matching
  const boardShortNameMap = new Map(boards.map(b => [b.boardId, b.shortName]));

  return isLead
    ? <LeadDashboard teams={teams} bugBoards={bugBoards} members={members} boardShortNameMap={boardShortNameMap} summaryLoading={summaryLoading} message={message} />
    : <MemberDashboard teams={teams} memberName={member?.fullName ?? null} summaryLoading={summaryLoading} message={message} />;
}

/* ── Gradient KPI Card ── */
function GradCard({ label, value, emoji, vibe, gradient, shadow }: {
  label: string; value: string | number; emoji: string; vibe: string;
  gradient: string; shadow: string;
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
        <div style={{ fontSize: 20, marginBottom: 6 }}>{emoji}</div>
        <div style={{ fontSize: 30, fontWeight: 800, color: '#fff', fontFamily: mono, lineHeight: 1, letterSpacing: -1, marginBottom: 3 }}>{value}</div>
        <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.6)', fontFamily: sans, fontWeight: 500, marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.92)', fontFamily: sans, fontWeight: 700 }}>{vibe}</div>
      </div>
    </div>
  );
}

/* ── Sprint Card Stack ── */
interface SprintInfo {
  board: string;
  sprint: string;
  startDate: string | null;
  endDate: string | null;
  workingDays: number | null;
}

function SprintCardStack({ sprints }: { sprints: SprintInfo[] }) {
  const [expanded, setExpanded] = useState(false);
  const T = useThemeColors();

  if (sprints.length === 0) {
    return (
      <span style={{ color: T.subCol, fontSize: 12.5, fontFamily: sans }}>No active sprints</span>
    );
  }

  if (sprints.length === 1) {
    const s = sprints[0];
    return (
      <span style={{ color: T.subCol, fontSize: 12.5, fontFamily: sans }}>
        {s.sprint}
        {s.startDate && s.endDate && (
          <span style={{ fontFamily: mono, fontSize: 11.5, marginLeft: 8 }}>
            {s.startDate} → {s.endDate}
            {s.workingDays ? ` · ${s.workingDays} days` : ''}
          </span>
        )}
      </span>
    );
  }

  return (
    <div
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 8 }}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      {/* Stacked cards preview */}
      <div style={{ position: 'relative', cursor: 'pointer', height: 28, paddingRight: (Math.min(sprints.length, 3) - 1) * 4 }}>
        {sprints.slice(0, 3).map((s, i) => (
          <div
            key={i}
            style={{
              position: i === 0 ? 'relative' : 'absolute',
              top: i * 2,
              left: i * 4,
              zIndex: sprints.length - i,
              background: T.isDark ? `rgba(255,255,255,${0.08 - i * 0.02})` : `rgba(1,29,77,${0.06 - i * 0.015})`,
              border: `1px solid ${T.cardBrd}`,
              borderRadius: 8,
              padding: '4px 12px',
              fontSize: 12,
              fontFamily: sans,
              fontWeight: 600,
              color: T.subCol,
              whiteSpace: 'nowrap',
              transition: 'all 0.2s',
            }}
          >
            {i === 0 ? s.sprint : ''}
          </div>
        ))}
      </div>
      <span style={{ fontSize: 10, color: T.accent, fontWeight: 700, fontFamily: mono, flexShrink: 0 }}>
        +{sprints.length - 1}
      </span>

      {/* Expanded dropdown on hover — each sprint shows its own dates */}
      {expanded && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          marginTop: 6,
          background: T.cardBg,
          border: `1px solid ${T.cardBrd}`,
          borderRadius: 12,
          padding: '6px 0',
          boxShadow: T.isDark ? '0 12px 40px rgba(0,0,0,0.5)' : '0 12px 40px rgba(1,29,77,0.12)',
          zIndex: 100,
          minWidth: 300,
        }}>
          {sprints.map((s, i) => (
            <div
              key={i}
              style={{
                padding: '8px 14px',
                borderBottom: i < sprints.length - 1 ? `1px solid ${T.rowBrd}` : 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  background: `${T.accent}15`, color: T.accent,
                  fontSize: 9.5, fontWeight: 700, padding: '2px 7px', borderRadius: 5,
                  fontFamily: sans, flexShrink: 0,
                }}>
                  {s.board}
                </span>
                <span style={{ fontSize: 12, color: T.titleCol, fontFamily: sans, fontWeight: 600 }}>
                  {s.sprint}
                </span>
              </div>
              {s.startDate && s.endDate && (
                <div style={{ fontSize: 10.5, color: T.subCol, fontFamily: mono, marginTop: 3, marginLeft: 2 }}>
                  {s.startDate} → {s.endDate}
                  {s.workingDays ? ` · ${s.workingDays} working days` : ''}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── LEAD DASHBOARD ── */
function LeadDashboard({ teams, bugBoards, members, boardShortNameMap, summaryLoading, message }: {
  teams: (TeamSummary & { isLoading: boolean; error: Error | null })[];
  bugBoards: { boardId: number; name: string; shortName: string }[];
  members: MemberResponse[];
  boardShortNameMap: Map<number, string>;
  summaryLoading: boolean;
  message: string;
}) {
  const T = useThemeColors();

  const allMemberSummaries = teams.flatMap(t => t.memberSummaries ?? []);
  const totalMembers = allMemberSummaries.length;
  const meetTarget = allMemberSummaries.filter(m => parseFloat(m.wpProductivity) >= 100).length;

  const avgProd = teams.length > 0
    ? (teams.reduce((s, t) => s + parseFloat(t.averageProductivity || '0'), 0) / teams.length).toFixed(1)
    : '-';

  const totalWorkItems = teams.reduce((s, t) => s + t.totalWorkItems, 0);
  const totalEpics = teams.reduce((s, t) => s + t.totalEpics, 0);
  const hasStoryGrouping = teams.some(t => t.isStoryGrouping);
  const epicOrStoryLabel = hasStoryGrouping ? 'Story' : 'Epic';

  // Sprint info for the card stack (includes dates + working days per board)
  const sprintInfos = teams
    .filter(t => t.sprintName)
    .map(t => ({
      board: t.teamName,
      sprint: t.sprintName!,
      startDate: t.sprintStartDate,
      endDate: t.sprintEndDate,
      workingDays: t.totalWorkingDays,
    }));

  const boardColors = [
    { gradient: 'linear-gradient(135deg,#0f766e,#0891b2)', shadow: 'rgba(8,145,178,0.3)', color: T.accent },
    { gradient: 'linear-gradient(135deg,#4f46e5,#7c3aed)', shadow: 'rgba(124,58,237,0.3)', color: '#7c3aed' },
    { gradient: 'linear-gradient(135deg,#059669,#0d9488)', shadow: 'rgba(5,150,105,0.3)', color: '#059669' },
    { gradient: 'linear-gradient(135deg,#d97706,#ea580c)', shadow: 'rgba(217,119,6,0.3)', color: '#d97706' },
  ];

  return (
    <div style={{ paddingBottom: 24 }}>
      {/* Header with sprint card stack + dates */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: T.titleCol, margin: 0, fontFamily: sans, letterSpacing: -0.5 }}>
          Team at a Glance
        </h1>
        <div style={{ marginTop: 6 }}>
          <SprintCardStack sprints={sprintInfos} />
        </div>
      </div>

      {/* Global Search */}
      <div className="flex justify-center mb-6">
        <GlobalSearch />
      </div>

      {/* Top KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 14 }}>
        <GradCard
          label="All-team Avg Productivity"
          value={avgProd !== '-' ? `${avgProd}%` : '-'}
          emoji={parseFloat(avgProd) >= 100 ? '🔥' : '📈'}
          vibe={parseFloat(avgProd) >= 100 ? 'Crushing it!' : 'Keep pushing'}
          gradient="linear-gradient(135deg,#0f766e,#0891b2)"
          shadow="rgba(8,145,178,0.35)"
        />
        <GradCard
          label="Total Work Items"
          value={totalWorkItems}
          emoji="⚡"
          vibe="all boards combined"
          gradient="linear-gradient(135deg,#4f46e5,#7c3aed)"
          shadow="rgba(124,58,237,0.35)"
        />
        <GradCard
          label={`Total ${epicOrStoryLabel}`}
          value={totalEpics}
          emoji="📋"
          vibe={`across ${teams.length} board${teams.length !== 1 ? 's' : ''}`}
          gradient="linear-gradient(135deg,#059669,#0d9488)"
          shadow="rgba(5,150,105,0.35)"
        />
        <GradCard
          label="Active Members"
          value={totalMembers}
          emoji="👥"
          vibe={`${meetTarget} meet target`}
          gradient="linear-gradient(135deg,#d97706,#ea580c)"
          shadow="rgba(217,119,6,0.35)"
        />
      </div>

      {/* Firebase message */}
      {message && (
        <p style={{ color: T.subCol, fontSize: 12, fontFamily: sans, fontStyle: 'italic', marginBottom: 14, textAlign: 'center' }}>{message}</p>
      )}

      {/* Board summary cards with member listing */}
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
            const shortName = boardShortNameMap.get(team.boardId) ?? '';
            const boardMembers = members.filter(m =>
              !m.isLead && m.teams.some(t => t.toLowerCase() === shortName.toLowerCase())
            );

            return (
              <BoardSummaryCard
                key={team.boardId}
                team={team}
                members={boardMembers}
                bc={bc}
              />
            );
          })}
        </div>
      )}

      {/* Bug Summary — click to navigate to Bug Monitoring */}
      {bugBoards.length > 0 && (
        <div style={{ background: T.cardBg, borderRadius: 16, border: `1px solid ${T.cardBrd}`, overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: `1px solid ${T.cardBrd}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: T.titleCol, fontFamily: sans }}>Active Bug Snapshot</span>
                <span style={{ fontSize: 9.5, fontWeight: 700, color: '#ef4444', background: '#ef444418', border: '1px solid #ef444435', borderRadius: 5, padding: '1px 6px', fontFamily: sans }}>Production Bug</span>
              </div>
              <div style={{ fontSize: 11, color: T.subCol, fontFamily: sans, marginTop: 1 }}>{bugBoards.length} board{bugBoards.length !== 1 ? 's' : ''} monitored</div>
            </div>
          </div>
          <div style={{ padding: '6px 0' }}>
            {bugBoards.map(board => (
              <DashboardBugRow key={board.boardId} boardId={board.boardId} title={board.name} shortName={board.shortName} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Board Summary Card with Member Listing ── */
function BoardSummaryCard({ team, members: boardMembers, bc }: {
  team: TeamSummary & { isLoading: boolean; error: Error | null };
  members: MemberResponse[];
  bc: { gradient: string; shadow: string; color: string };
}) {
  const T = useThemeColors();

  return (
    <div style={{ background: T.cardBg, borderRadius: 16, border: `1px solid ${T.cardBrd}`, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* Board header with gradient */}
      <div style={{ background: bc.gradient, padding: '16px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', fontFamily: sans, whiteSpace: 'nowrap' }}>{team.teamName}</div>
          <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.65)', fontFamily: mono, marginTop: 2, whiteSpace: 'nowrap' }}>
            {team.teamMembers} members
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#fff', fontFamily: mono, lineHeight: 1 }}>{team.averageProductivity || '-'}</div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.65)', fontFamily: sans }}>avg productivity</div>
        </div>
      </div>

      {/* Members list with productivity */}
      <div style={{ padding: '10px 0', flex: 1 }}>
        {team.memberSummaries.length > 0 ? (
          team.memberSummaries.map((ms, mi) => {
            const prodVal = parseFloat(ms.wpProductivity) || 0;
            const isAbove = prodVal >= 100;
            return (
              <div key={mi} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 16px',
                borderBottom: mi < team.memberSummaries.length - 1 ? `1px solid ${T.rowBrd}` : 'none',
              }}>
                {/* Initials avatar */}
                <div style={{
                  width: 28, height: 28, borderRadius: 8,
                  background: isAbove ? `${bc.color}20` : 'rgba(156,163,175,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700, color: isAbove ? bc.color : T.subCol,
                  fontFamily: sans, flexShrink: 0,
                }}>
                  {getInitials(ms.name)}
                </div>
                {/* Name + WP */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: T.rowCol, fontFamily: sans, lineHeight: 1 }}>
                    {ms.name}
                  </div>
                  <div style={{ fontSize: 10, color: T.subCol, fontFamily: mono, marginTop: 2 }}>
                    WP: {ms.totalWeightPoints} / {ms.targetWeightPoints.toFixed(0)} &middot; SP: {ms.spTotal.toFixed(2)}
                  </div>
                </div>
                {/* Productivity bar + percentage */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 52, height: 5, background: T.isDark ? 'rgba(255,255,255,0.06)' : '#f0f2f8', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${Math.min(prodVal, 130) / 130 * 100}%`, background: isAbove ? bc.gradient : '#9ca3af', borderRadius: 99 }} />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: isAbove ? bc.color : '#9ca3af', fontFamily: mono, width: 42, textAlign: 'right' }}>
                    {ms.wpProductivity}
                  </span>
                </div>
              </div>
            );
          })
        ) : boardMembers.length > 0 ? (
          boardMembers.map((m, mi) => (
            <div key={m.id} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 16px',
              borderBottom: mi < boardMembers.length - 1 ? `1px solid ${T.rowBrd}` : 'none',
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: 8,
                background: `${bc.color}20`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, color: bc.color,
                fontFamily: sans, flexShrink: 0,
              }}>
                {getInitials(m.name)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: T.rowCol, fontFamily: sans, lineHeight: 1 }}>
                  {m.name}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div style={{ padding: '12px 16px', fontSize: 11, color: T.subCol, fontFamily: sans }}>
            {team.teamMembers} team member{team.teamMembers !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Board footer stats — always at bottom */}
      <div style={{ padding: '10px 16px', borderTop: `1px solid ${T.cardBrd}`, display: 'flex', gap: 16, marginTop: 'auto' }}>
        <div>
          <div style={{ fontSize: 9.5, color: T.subCol, fontFamily: sans, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 2 }}>WP/Hour</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: T.titleCol, fontFamily: mono }}>{team.averageWpPerHour?.toFixed(2) || '-'}</div>
        </div>
        <div>
          <div style={{ fontSize: 9.5, color: T.subCol, fontFamily: sans, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 2 }}>Work Items</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: T.titleCol, fontFamily: mono }}>
            {team.totalWorkItems ? `${team.closedWorkItems}/${team.totalWorkItems}` : '-'}
          </div>
        </div>
        {team.averageHoursOpen != null && (
          <div>
            <div style={{ fontSize: 9.5, color: T.subCol, fontFamily: sans, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 2 }}>Avg Hours Open</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: T.titleCol, fontFamily: mono }}>{team.averageHoursOpen.toFixed(1)}h</div>
          </div>
        )}
      </div>
    </div>
  );
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/* ── Bug Row for Lead Dashboard — clickable to Bug Monitoring ── */
function DashboardBugRow({ boardId, title, shortName }: { boardId: number; title: string; shortName: string }) {
  const T = useThemeColors();
  const router = useRouter();
  const { bugs } = useDashboardBugSummary(boardId, true);

  if (bugs.isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 18px' }}>
        <div className="animate-pulse" style={{ height: 16, width: 200, background: T.rowBrd, borderRadius: 4 }} />
      </div>
    );
  }

  return (
    <div
      onClick={() => router.push('/dashboard/bug-monitoring')}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '10px 18px',
        borderBottom: `1px solid ${T.rowBrd}`,
        cursor: 'pointer',
        transition: 'background 0.15s',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = T.isDark ? 'rgba(255,255,255,0.03)' : '#f9fafb'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ''; }}
    >
      <span style={{
        background: `${T.accent}15`, color: T.accent,
        fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 5, fontFamily: sans,
      }}>{shortName}</span>
      <span style={{ fontSize: 12.5, color: T.rowCol, fontFamily: sans, fontWeight: 500, flex: 1 }}>{title}</span>
      <div style={{ display: 'flex', gap: 12, fontSize: 11, fontFamily: mono }}>
        <span style={{ color: '#ef4444', fontWeight: 600 }}>{bugs.criticalCount} critical</span>
        <span style={{ color: '#f59e0b', fontWeight: 600 }}>{bugs.highCount} high</span>
        <span style={{ color: T.subCol }}>{bugs.totalBugs} total</span>
      </div>
    </div>
  );
}

/* ── MEMBER DASHBOARD — personal progress per board ── */
function MemberDashboard({ teams, memberName, summaryLoading, message }: {
  teams: (TeamSummary & { isLoading: boolean; error: Error | null })[];
  memberName: string | null;
  summaryLoading: boolean;
  message: string;
}) {
  const T = useThemeColors();

  const boardColors = [
    { gradient: 'linear-gradient(135deg,#0f766e,#0891b2)', color: T.accent },
    { gradient: 'linear-gradient(135deg,#4f46e5,#7c3aed)', color: '#7c3aed' },
    { gradient: 'linear-gradient(135deg,#059669,#0d9488)', color: '#059669' },
    { gradient: 'linear-gradient(135deg,#d97706,#ea580c)', color: '#d97706' },
  ];

  // Find my data per board
  const myBoards = teams.map((team, bi) => {
    const me = memberName ? team.memberSummaries?.find(m => m.name === memberName) : null;
    return { team, me, bc: boardColors[bi % boardColors.length] };
  });

  // KPIs from personal data across all boards
  const allMySummaries = myBoards.filter(b => b.me).map(b => b.me!);
  const totalWP = allMySummaries.reduce((s, m) => s + m.totalWeightPoints, 0);
  const totalTargetWP = allMySummaries.reduce((s, m) => s + m.targetWeightPoints, 0);
  const avgProd = allMySummaries.length > 0
    ? (allMySummaries.reduce((s, m) => s + parseFloat(m.wpProductivity), 0) / allMySummaries.length).toFixed(1)
    : '-';
  const totalSP = allMySummaries.reduce((s, m) => s + m.spTotal, 0);

  // Sprint info
  const sprintInfos = teams
    .filter(t => t.sprintName)
    .map(t => ({
      board: t.teamName,
      sprint: t.sprintName!,
      startDate: t.sprintStartDate,
      endDate: t.sprintEndDate,
      workingDays: t.totalWorkingDays,
    }));

  return (
    <div style={{ paddingBottom: 24 }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: T.titleCol, margin: 0, fontFamily: sans, letterSpacing: -0.5 }}>
          My Sprint Dashboard
        </h1>
        <div style={{ marginTop: 6 }}>
          <SprintCardStack sprints={sprintInfos} />
        </div>
      </div>

      {/* Global Search */}
      <div className="flex justify-center mb-6">
        <GlobalSearch />
      </div>

      {/* Personal KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 14 }}>
        <GradCard
          label="My Productivity"
          value={avgProd !== '-' ? `${avgProd}%` : '-'}
          emoji={parseFloat(avgProd) >= 100 ? '🔥' : '📈'}
          vibe={parseFloat(avgProd) >= 100 ? 'Above target!' : 'Keep going!'}
          gradient="linear-gradient(135deg,#0f766e,#0891b2)"
          shadow="rgba(8,145,178,0.35)"
        />
        <GradCard
          label="My WP Total"
          value={totalWP}
          emoji="⚡"
          vibe={`of ${totalTargetWP.toFixed(0)} target`}
          gradient="linear-gradient(135deg,#4f46e5,#7c3aed)"
          shadow="rgba(124,58,237,0.35)"
        />
        <GradCard
          label="My SP Total"
          value={totalSP.toFixed(2)}
          emoji="📊"
          vibe="story points"
          gradient="linear-gradient(135deg,#d97706,#ea580c)"
          shadow="rgba(217,119,6,0.35)"
        />
        <GradCard
          label="Active Boards"
          value={myBoards.filter(b => b.me).length}
          emoji="📋"
          vibe={`of ${teams.length} total`}
          gradient="linear-gradient(135deg,#059669,#0d9488)"
          shadow="rgba(5,150,105,0.35)"
        />
      </div>

      {/* Firebase message */}
      {message && (
        <p style={{ color: T.subCol, fontSize: 12, fontFamily: sans, fontStyle: 'italic', marginBottom: 14, textAlign: 'center' }}>{message}</p>
      )}

      {/* Per-board personal progress */}
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
          {myBoards.map(({ team, me, bc }, bi) => {
            const myProd = me ? parseFloat(me.wpProductivity) : 0;
            const isAbove = myProd >= 100;
            return (
              <div key={team.boardId} style={{ background: T.cardBg, borderRadius: 16, border: `1px solid ${T.cardBrd}`, overflow: 'hidden' }}>
                {/* Board header — shows MY productivity, not team average */}
                <div style={{ background: bc.gradient, padding: '16px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', fontFamily: sans }}>{team.teamName}</div>
                    <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.65)', fontFamily: mono, marginTop: 2 }}>{team.sprintName || 'No active sprint'}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 28, fontWeight: 800, color: '#fff', fontFamily: mono, lineHeight: 1 }}>{me ? me.wpProductivity : '-'}</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.65)', fontFamily: sans }}>my productivity</div>
                  </div>
                </div>

                {me ? (
                  <div className="grid grid-cols-2 gap-3 p-4">
                    {[
                      { label: 'WP Total', value: `${me.totalWeightPoints} / ${me.targetWeightPoints.toFixed(0)}` },
                      { label: 'SP Total', value: me.spTotal.toFixed(2) },
                      { label: 'My Rank', value: (() => {
                        const sorted = [...(team.memberSummaries ?? [])].sort((a, b) => parseFloat(b.wpProductivity) - parseFloat(a.wpProductivity));
                        const rank = sorted.findIndex(m => m.name === me.name) + 1;
                        return `#${rank} of ${sorted.length}`;
                      })() },
                      { label: 'Team Avg', value: team.averageProductivity || '-' },
                    ].map((stat, si) => (
                      <div key={si} style={{ background: T.isDark ? 'rgba(255,255,255,0.04)' : '#f5f6fb', borderRadius: 10, padding: '10px 12px' }}>
                        <div style={{ fontSize: 9.5, color: T.subCol, fontFamily: sans, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>{stat.label}</div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: T.titleCol, fontFamily: mono }}>{stat.value}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: 16, textAlign: 'center' }}>
                    <p style={{ color: T.subCol, fontFamily: sans, fontSize: 12 }}>No data for this sprint yet</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
