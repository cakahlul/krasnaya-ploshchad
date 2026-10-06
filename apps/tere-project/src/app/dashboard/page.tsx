'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import dayjs from 'dayjs';
import { ArrowRightOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { DateRangeSelect } from '@src/features/dashboard/components/DateRangeSelect';
import { useDashboardSummaries, TeamSummary } from '@src/features/dashboard/hooks/useDashboardSummary';
import { useMemberProfile } from '@src/features/dashboard/hooks/useMemberProfile';
import { useBoards } from '@src/features/dashboard/hooks/useBoards';
import { useMembers } from '@src/features/dashboard/hooks/useMembers';
import { useThemeColors } from '@src/hooks/useTheme';
import { getKanbanDateRange } from '@shared/utils/kanban-cycle.util';

const GlobalSearch = dynamic(() => import('@src/features/dashboard/components/GlobalSearch'), { ssr: false });
type LoadedTeam = TeamSummary & { isLoading: boolean; error: Error | null };
type RangeHandler = (dates: [dayjs.Dayjs | null, dayjs.Dayjs | null] | null) => void;

export default function Dashboard() {
  const { member, teams: assignedTeams, isLoading: profileLoading } = useMemberProfile();
  const { boards, isLoading: boardsLoading } = useBoards();
  const { members } = useMembers(member?.isLead === true);
  const [range, setRange] = useState(() => getKanbanDateRange());
  const [manualRange, setManualRange] = useState(false);
  const boardIds = boards.filter(board => !board.isBugMonitoring && assignedTeams.some(team => team.toLowerCase() === board.shortName.toLowerCase())).map(board => board.boardId);
  const { teams, isLoading } = useDashboardSummaries(boardIds, manualRange ? range.startDate : undefined, manualRange ? range.endDate : undefined, !profileLoading && !boardsLoading);
  const boardKanban = useMemo(() => new Map(boards.map(board => [board.boardId, Boolean(board.isKanban)])), [boards]);

  useEffect(() => {
    if (manualRange) return;
    const board = boards.find(item => item.isKanban && item.kanbanCycleStartDate);
    if (!board?.kanbanCycleStartDate) return;
    const timer = window.setTimeout(() => setRange(getKanbanDateRange(dayjs(), board.kanbanCycleStartDate)), 0);
    return () => window.clearTimeout(timer);
  }, [boards, manualRange]);

  const changeRange: RangeHandler = dates => {
    if (!dates?.[0] || !dates[1]) { setRange(getKanbanDateRange()); setManualRange(false); return; }
    setRange({ startDate: dates[0].format('YYYY-MM-DD'), endDate: dates[1].format('YYYY-MM-DD') });
    setManualRange(true);
  };

  if (profileLoading || boardsLoading) return <div className="tere-dashboard-loading"><div /><span>Preparing your workspace</span></div>;
  return member?.isLead
    ? <LeadView teams={teams} members={members.length} bugBoards={boards.filter(board => board.isBugMonitoring)} boardKanban={boardKanban} range={range} onRangeChange={changeRange} loading={isLoading} />
    : <MemberView teams={teams} memberName={member?.fullName ?? member?.name ?? ''} boardKanban={boardKanban} range={range} onRangeChange={changeRange} loading={isLoading} />;
}

function DashboardFrame({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) {
  const T = useThemeColors();
  return <main className="tere-dashboard" style={{ color: T.titleCol }}><header className="tere-dashboard__intro"><div><p className="tere-eyebrow">{eyebrow}</p><h1>{title}</h1></div><div className="tere-dashboard__search"><GlobalSearch /></div></header>{children}</main>;
}

function LeadView({ teams, members, bugBoards, boardKanban, range, onRangeChange, loading }: { teams: LoadedTeam[]; members: number; bugBoards: { boardId: number; name: string; shortName: string }[]; boardKanban: Map<number, boolean>; range: { startDate: string; endDate: string }; onRangeChange: RangeHandler; loading: boolean }) {
  const sorted = [...teams].sort((a, b) => Number(a.averageProductivity || 0) - Number(b.averageProductivity || 0));
  const atRisk = sorted.filter(team => Number(team.averageProductivity || 0) < 100);
  const average = teams.length ? teams.reduce((sum, team) => sum + Number(team.averageProductivity || 0), 0) / teams.length : 0;
  const workItems = teams.reduce((sum, team) => sum + team.totalWorkItems, 0);
  return <DashboardFrame eyebrow={`${teams.length} ASSIGNED BOARD${teams.length === 1 ? '' : 'S'} · LEAD VIEW`} title="Delivery control room">
    <section className="tere-lead-hero"><div className="tere-glass tere-priority-panel"><div className="tere-priority-panel__head"><span className="tere-eyebrow">Needs your attention</span><span className={atRisk.length ? 'tere-status tere-status--risk' : 'tere-status'}>{atRisk.length ? `${atRisk.length} at risk` : 'On track'}</span></div><h2>{atRisk.length ? `${atRisk.length} board${atRisk.length === 1 ? ' is' : 's are'} below target.` : 'No board is below target.'}</h2><p>{atRisk.length ? 'Start with the lowest delivery signal, then move to the next risk.' : 'Use the board list to check throughput and active work.'}</p><div className="tere-priority-list">{sorted.slice(0, 3).map((team, index) => <BoardPulse key={team.boardId} team={team} index={index} />)}{!loading && sorted.length === 0 && <span className="tere-muted">No assigned board data is available.</span>}</div></div><div className="tere-glass tere-portfolio-panel"><span className="tere-eyebrow">Portfolio signal</span><div className="tere-portfolio-score"><strong>{average ? `${average.toFixed(0)}%` : '—'}</strong><span>average productivity</span></div><div className="tere-portfolio-metrics"><Metric label="Assigned boards" value={teams.length} /><Metric label="Active members" value={members} /><Metric label="Work items" value={workItems} /></div></div></section>
    <section className="tere-section"><div className="tere-section__heading"><div><p className="tere-eyebrow">Board pulse</p><h2>Scan, then intervene</h2></div><span>{atRisk.length} below target</span></div><div className="tere-board-rail">{loading && !teams.length ? <BoardSkeleton /> : sorted.map((team, index) => <LeadBoard key={team.boardId} team={team} index={index} isKanban={boardKanban.get(team.boardId) ?? false} range={range} onRangeChange={onRangeChange} />)}</div></section>
    {bugBoards.length > 0 && <BugStrip boards={bugBoards} />}
  </DashboardFrame>;
}

function MemberView({ teams, memberName, boardKanban, range, onRangeChange, loading }: { teams: LoadedTeam[]; memberName: string; boardKanban: Map<number, boolean>; range: { startDate: string; endDate: string }; onRangeChange: RangeHandler; loading: boolean }) {
  const mine = teams.map(team => ({ team, me: team.memberSummaries?.find(summary => summary.name === memberName) }));
  const productive = mine.filter(({ me }) => me && Number(me.productivityRate) >= 100).length;
  const next = mine.find(({ me }) => !me || Number(me.productivityRate) < 100) ?? mine[0];
  const totalWp = mine.reduce((sum, { me }) => sum + (me?.totalWeightPoints ?? 0), 0);
  return <DashboardFrame eyebrow={`${teams.length} ASSIGNED BOARD${teams.length === 1 ? '' : 'S'} · MY WORK`} title="My delivery day">
    <section className="tere-member-hero"><div className="tere-glass tere-focus-panel"><p className="tere-eyebrow">Next best action</p><h2>{next?.team.teamName ?? 'Your assigned work'}</h2><p>{!next?.me ? 'Your work has not been measured for this period yet. Check your assigned items.' : Number(next.me.productivityRate) < 100 ? 'Review in-progress work and surface blockers before the next stand-up.' : 'Your current board is on target. Keep completed work updated.'}</p><span className="tere-focus-panel__meta">{next?.team.sprintName ?? 'Current delivery period'}</span></div><div className="tere-glass tere-personal-score"><span className="tere-eyebrow">This period</span><strong>{mine.length ? `${productive}/${mine.length}` : '—'}</strong><span>boards at target</span><div><Metric label="Weight points" value={totalWp} /><Metric label="Active boards" value={teams.length} /></div></div></section>
    <section className="tere-section"><div className="tere-section__heading"><div><p className="tere-eyebrow">My board queue</p><h2>Workboard by workboard</h2></div><span>Your metrics only</span></div><div className="tere-board-rail">{loading && !teams.length ? <BoardSkeleton /> : mine.map(({ team, me }, index) => <MemberBoard key={team.boardId} team={team} me={me} index={index} isKanban={boardKanban.get(team.boardId) ?? false} range={range} onRangeChange={onRangeChange} />)}</div></section>
  </DashboardFrame>;
}

function LeadBoard({ team, index, isKanban, range, onRangeChange }: { team: LoadedTeam; index: number; isKanban: boolean; range: { startDate: string; endDate: string }; onRangeChange: RangeHandler }) { const T = useThemeColors(); const risk = Number(team.averageProductivity || 0) < 100; return <article className="tere-glass tere-board-card"><div className="tere-board-card__top"><span className="tere-board-index">{String(index + 1).padStart(2, '0')}</span><span className={risk ? 'tere-status tere-status--risk' : 'tere-status'}>{risk ? 'Needs review' : 'On target'}</span></div><h3>{team.teamName}</h3><p>{isKanban ? `${team.sprintStartDate ?? range.startDate} → ${team.sprintEndDate ?? range.endDate}` : team.sprintName || 'No active sprint'}</p><div className="tere-board-value"><strong>{team.averageProductivity || '—'}</strong><span>avg. productivity</span></div><div className="tere-progress"><span style={{ width: `${Math.min(Number(team.averageProductivity || 0), 130) / 1.3}%`, background: risk ? T.statusDanger : T.accent }} /></div><div className="tere-board-stats"><Metric label="Work items" value={`${team.closedWorkItems}/${team.totalWorkItems}`} /><Metric label="Members" value={team.teamMembers} /></div>{isKanban && <div className="tere-board-range"><DateRangeSelect startDate={range.startDate} endDate={range.endDate} onChange={onRangeChange} isActive /></div>}</article>; }
function MemberBoard({ team, me, index, isKanban, range, onRangeChange }: { team: LoadedTeam; me: TeamSummary['memberSummaries'][number] | undefined; index: number; isKanban: boolean; range: { startDate: string; endDate: string }; onRangeChange: RangeHandler }) { const risk = !me || Number(me.productivityRate) < 100; return <article className="tere-glass tere-board-card"><div className="tere-board-card__top"><span className="tere-board-index">{String(index + 1).padStart(2, '0')}</span><span className={risk ? 'tere-status tere-status--risk' : 'tere-status'}>{risk ? 'Action needed' : 'On target'}</span></div><h3>{team.teamName}</h3><p>{isKanban ? `${team.sprintStartDate ?? range.startDate} → ${team.sprintEndDate ?? range.endDate}` : team.sprintName || 'No active sprint'}</p><div className="tere-board-value"><strong>{me?.productivityRate ?? '—'}</strong><span>my productivity</span></div><div className="tere-board-stats"><Metric label="Weight points" value={me ? `${me.totalWeightPoints}/${me.targetWeightPoints.toFixed(0)}` : '—'} /><Metric label="Story points" value={me?.spTotal.toFixed(2) ?? '—'} /></div>{isKanban && <div className="tere-board-range"><DateRangeSelect startDate={range.startDate} endDate={range.endDate} onChange={onRangeChange} isActive /></div>}</article>; }
function BoardPulse({ team, index }: { team: LoadedTeam; index: number }) { const risk = Number(team.averageProductivity || 0) < 100; return <div className="tere-pulse-row"><span>{String(index + 1).padStart(2, '0')}</span><strong>{team.teamName}</strong><em className={risk ? 'tere-risk-text' : ''}>{team.averageProductivity || '—'}</em><ArrowRightOutlined /></div>; }
function Metric({ label, value }: { label: string; value: string | number }) { return <div className="tere-metric"><span>{label}</span><strong>{value}</strong></div>; }
function BoardSkeleton() { return <><div className="tere-glass tere-board-card tere-skeleton" /><div className="tere-glass tere-board-card tere-skeleton" /></>; }
function BugStrip({ boards }: { boards: { boardId: number; name: string; shortName: string }[] }) { const router = useRouter(); return <section className="tere-glass tere-bug-strip"><div><ExclamationCircleOutlined /><div><p className="tere-eyebrow">Production quality</p><h2>{boards.length} monitored bug board{boards.length === 1 ? '' : 's'}</h2></div></div><button onClick={() => router.push('/dashboard/bug-monitoring')}>Open bug monitoring <ArrowRightOutlined /></button></section>; }
