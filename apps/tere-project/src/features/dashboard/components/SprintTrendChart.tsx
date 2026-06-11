'use client';

import { useMemo, useState } from 'react';
import { Segmented, Empty, Spin, Alert } from 'antd';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useSprintTrend } from '../hooks/useSprintTrend';
import { useTeamReportFilterStore } from '../store/teamReportFilterStore';
import { useMultiSprintDataTransform } from '../hooks/useMultiSprintDataTransform';
import { useBoards } from '../hooks/useBoards';
import { useThemeColors } from '@src/hooks/useTheme';

type Metric = 'velocity' | 'wpAttainment' | 'spVelocity';

const METRIC_OPTIONS: { label: string; value: Metric }[] = [
  { label: 'Velocity (WP)', value: 'velocity' },
  { label: 'WP Attainment %', value: 'wpAttainment' },
  { label: 'SP Velocity', value: 'spVelocity' },
];

const TEAM_COLORS = [
  '#1282a2',
  '#ef4444',
  '#10b981',
  '#8b5cf6',
  '#f59e0b',
  '#3b82f6',
  '#ec4899',
  '#14b8a6',
];

export function SprintTrendChart() {
  const T = useThemeColors();
  const [metric, setMetric] = useState<Metric>('velocity');
  const { data, isLoading, error } = useSprintTrend();
  const selectedSprints = useTeamReportFilterStore(s => s.selectedSprints);
  const selectedTeams = useTeamReportFilterStore(s => s.selectedTeams);
  const { boards } = useBoards();

  const nonKanbanBoardIds = useMemo(
    () => selectedTeams.filter(id => !boards.find(b => b.boardId === id)?.isKanban),
    [selectedTeams, boards],
  );
  const { sprints: sprintOptions } = useMultiSprintDataTransform(nonKanbanBoardIds);
  const sprintNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const s of sprintOptions) map.set(String(s.value), s.label);
    return map;
  }, [sprintOptions]);

  const { chartData, teamKeys } = useMemo(() => {
    if (!data) return { chartData: [], teamKeys: [] as string[] };
    const sortedPoints = [...data.points].sort((a, b) => {
      const aDate = a.sprintStartDate ?? '';
      const bDate = b.sprintStartDate ?? '';
      return aDate.localeCompare(bDate);
    });
    const teams = new Set<string>();
    const rows = sortedPoints.map(point => {
      const row: Record<string, string | number> = {
        sprint: sprintNameById.get(point.sprintId) ?? `#${point.sprintId}`,
      };
      for (const team of point.teams) {
        teams.add(team.team);
        row[team.team] = team[metric];
      }
      return row;
    });
    return { chartData: rows, teamKeys: Array.from(teams).sort() };
  }, [data, metric, sprintNameById]);

  if (selectedSprints.length < 2) {
    return (
      <div style={cardStyle(T)}>
        <Header T={T} />
        <Empty
          description="Select at least 2 sprints to see velocity trend"
          style={{ padding: '24px 0' }}
        />
      </div>
    );
  }

  return (
    <div style={cardStyle(T)}>
      <Header T={T} />

      {data?.slowdownAlerts && data.slowdownAlerts.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          {data.slowdownAlerts.map(alert => (
            <Alert
              key={alert.team}
              type="warning"
              showIcon
              style={{ marginBottom: 6 }}
              message={
                <span>
                  <b>{alert.team}</b> slowing down — velocity dropped{' '}
                  <b>{alert.declinePercent.toFixed(1)}%</b> over{' '}
                  {alert.consecutiveDeclines} consecutive sprints (
                  {alert.baselineVelocity.toFixed(1)} → {alert.latestVelocity.toFixed(1)} WP)
                </span>
              }
            />
          ))}
        </div>
      )}

      <div style={{ marginBottom: 12 }}>
        <Segmented
          value={metric}
          onChange={v => setMetric(v as Metric)}
          options={METRIC_OPTIONS}
        />
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
          <Spin />
        </div>
      ) : error ? (
        <Alert type="error" message="Failed to load sprint trend" />
      ) : chartData.length === 0 ? (
        <Empty description="No data for selected sprints" />
      ) : (
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={chartData} margin={{ top: 8, right: 24, left: 0, bottom: 8 }}>
            <CartesianGrid stroke={T.rowBrd} strokeDasharray="3 3" />
            <XAxis dataKey="sprint" tick={{ fill: T.subCol, fontSize: 11 }} />
            <YAxis
              tick={{ fill: T.subCol, fontSize: 11 }}
              tickFormatter={v => (metric === 'wpAttainment' ? `${v}%` : `${v}`)}
            />
            <Tooltip
              contentStyle={{
                background: T.cardBg,
                border: `1px solid ${T.cardBrd}`,
                borderRadius: 6,
                color: T.titleCol,
              }}
              formatter={(value: number) =>
                metric === 'wpAttainment' ? `${value.toFixed(1)}%` : value.toFixed(2)
              }
            />
            <Legend wrapperStyle={{ fontSize: 12, color: T.subCol }} />
            {teamKeys.map((team, idx) => (
              <Line
                key={team}
                type="monotone"
                dataKey={team}
                stroke={TEAM_COLORS[idx % TEAM_COLORS.length]}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

function cardStyle(T: ReturnType<typeof useThemeColors>): React.CSSProperties {
  return {
    background: T.cardBg,
    border: `1px solid ${T.cardBrd}`,
    borderRadius: 12,
    padding: 18,
    marginTop: 18,
  };
}

function Header({ T }: { T: ReturnType<typeof useThemeColors> }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <h3
        style={{
          fontSize: 16,
          fontWeight: 700,
          color: T.titleCol,
          margin: 0,
          fontFamily: "'Space Grotesk',sans-serif",
          letterSpacing: -0.2,
        }}
      >
        Sprint-over-Sprint Trend
      </h3>
      <p
        style={{
          color: T.subCol,
          margin: '2px 0 0',
          fontSize: 12,
          fontFamily: "'Space Grotesk',sans-serif",
        }}
      >
        Velocity & WP attainment across sprints · alerts flag 2+ consecutive declines ≥ 20%
      </p>
    </div>
  );
}
