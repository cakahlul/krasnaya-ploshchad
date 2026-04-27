'use client';
import { WorkItem } from '../types/dashboard';
import { Popover, Table, TableColumnsType } from 'antd';
import { useTeamReportTransform } from '../hooks/useTeamReportTransform';
import TeamPerformance from './teamPerformance';
import MemberTaskModal from './MemberTaskModal';
import { useState } from 'react';
import { useTeamReportFilterStore } from '../store/teamReportFilterStore';
import { useBoards } from '../hooks/useBoards';
import { useWpWeightConfig } from '../hooks/useWpWeightConfig';
import { useTargetWpConfig } from '../hooks/useTargetWpConfig';
import { Info } from 'lucide-react';
import { useThemeColors } from '@src/hooks/useTheme';

interface ColumnInfo {
  label: string;
  description: string;
  formula?: string;
  note?: string;
}

const COLUMN_INFO: Record<string, ColumnInfo> = {
  member: {
    label: 'Member',
    description:
      'The Jira display name of the team member. Click to view their assigned tickets for this sprint.',
  },
  spProduct: {
    label: 'SP Product',
    description: 'Story Points contributed from product work.',
    formula: '(WP Product \u00d7 8 \u00d7 Working Days) / Target WP',
  },
  spTechDebt: {
    label: 'SP Tech Debt',
    description: 'Story Points contributed from tech debt work.',
    formula: '(WP Tech Debt \u00d7 8 \u00d7 Working Days) / Target WP',
  },
  spMeeting: {
    label: 'SP Meeting',
    description: 'Story Points contributed from meeting-related work.',
  },
  spTotal: {
    label: 'SP Total',
    description: 'Total Story Points across all work types.',
    formula: 'SP Product + SP Tech Debt + SP Meeting',
  },
  productivityRate: {
    label: 'Productivity Rate',
    description: 'SP-based productivity comparing actual SP output against available working hours.',
    formula: '(SP Total / (Working Days \u00d7 8)) \u00d7 100%',
    note: '1 SP = 1 hour, 1 working day = 8 hours',
  },
  weightPointsProduct: {
    label: 'Weight Points Product',
    description:
      'Sum of weight points from product-related Jira issues, based on appendix complexity levels.',
  },
  weightPointsTechDebt: {
    label: 'Weight Points Tech Debt',
    description:
      'Sum of weight points from tech debt Jira issues, based on appendix complexity levels.',
  },
  totalWeightPoints: {
    label: 'Total Weight Points',
    description: 'Sum of all weight points regardless of type.',
    formula: 'WP Product + WP Tech Debt',
  },
  targetWeightPoints: {
    label: 'Target WP',
    description:
      'The expected weight points for this member based on their level and working days.',
    formula: 'Daily Rate (by level) \u00d7 Working Days',
    note: 'Daily rates: Junior=4.5, Medior=6, Senior/IC=8',
  },
  workingDays: {
    label: 'Working Days',
    description:
      'Actual working days in the sprint after deducting weekends, national holidays, and approved personal leaves.',
  },
  wpToHours: {
    label: 'WP to Hours',
    description: 'Weight points output per working hour.',
    formula: 'Total WP / (Working Days \u00d7 8)',
  },
  plannedWP: {
    label: 'Planned WP',
    description: 'Sum of weight points from open (unresolved) issues in the current sprint. Helps identify if a member still has capacity.',
  },
};

const mono = "var(--font-ibm-plex-mono), 'IBM Plex Mono', monospace";
const sans = "var(--font-space-grotesk), 'Space Grotesk', sans-serif";

function ColumnHeader({ columnKey, referenceDate }: { columnKey: string; referenceDate?: string }) {
  const wpWeights = useWpWeightConfig(referenceDate);
  const targetWpRates = useTargetWpConfig(referenceDate);
  const { accent, isDark, rowCol, subCol } = useThemeColors();
  const info = { ...COLUMN_INFO[columnKey] };
  if (!info) return <span>{columnKey}</span>;

  if (columnKey === 'weightPointsProduct' || columnKey === 'weightPointsTechDebt') {
    const levels = Object.entries(wpWeights)
      .map(([k, v]) => `${k}=${v}`)
      .join(', ');
    info.note = `Complexity levels: ${levels}`;
  }

  if (columnKey === 'targetWeightPoints') {
    const rates = Object.entries(targetWpRates)
      .map(([k, v]) => `${k.charAt(0).toUpperCase() + k.slice(1)}=${v}`)
      .join(', ');
    info.note = `Daily rates: ${rates}`;
  }

  const popoverContent = (
    <div style={{ maxWidth: 280 }}>
      <div
        style={{
          background: accent,
          padding: '8px 14px',
          borderRadius: '8px 8px 0 0',
          margin: '-12px -12px 12px',
        }}
      >
        <span style={{ color: '#fff', fontWeight: 600, fontSize: 13, letterSpacing: '0.025em' }}>
          {info.label}
        </span>
      </div>
      <p style={{ color: rowCol, fontSize: 12, lineHeight: 1.6, margin: '0 0 8px' }}>
        {info.description}
      </p>
      {info.formula && (
        <div style={{ marginTop: 8 }}>
          <span style={{ color: subCol, fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Formula
          </span>
          <div
            style={{
              background: isDark ? 'rgba(255,255,255,0.06)' : '#f5f6fb',
              borderRadius: 6,
              padding: '6px 10px',
              marginTop: 4,
            }}
          >
            <code style={{ color: accent, fontFamily: mono, fontSize: 12, whiteSpace: 'pre-wrap' }}>
              {info.formula}
            </code>
          </div>
        </div>
      )}
      {info.note && (
        <p style={{ color: subCol, fontSize: 11, marginTop: 8, marginBottom: 0, fontStyle: 'italic', lineHeight: 1.4 }}>
          {info.note}
        </p>
      )}
    </div>
  );

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span>{info.label}</span>
      <Popover
        content={popoverContent}
        trigger="hover"
        placement="bottom"
        overlayInnerStyle={{ padding: 12, borderRadius: 12 }}
      >
        <Info
          size={13}
          style={{ color: subCol, cursor: 'help', flexShrink: 0, transition: 'color 150ms' }}
        />
      </Popover>
    </span>
  );
}

export default function TeamTable() {
  const { data } = useTeamReportTransform();
  const [pageSize, setPageSize] = useState(10);
  const [selectedMember, setSelectedMember] = useState<WorkItem | null>(null);
  const selectedTeams = useTeamReportFilterStore(state => state.selectedTeams);
  const { startDate: filterStartDate } = useTeamReportFilterStore(state => state.selectedFilter);
  const { boards } = useBoards();
  const { accent, cardBg, cardBrd, titleCol, subCol } = useThemeColors();

  const referenceDate = data?.sprintStartDate ?? filterStartDate;

  const hasAbadiBoard = selectedTeams.some(teamId => {
    const board = boards.find(b => b.boardId === teamId);
    return board?.isShowPlannedWP === true;
  });

  const columns: TableColumnsType<WorkItem> = [
    {
      title: <ColumnHeader columnKey="member" referenceDate={referenceDate} />,
      dataIndex: 'member',
      key: 'member',
      fixed: 'left',
      width: 200,
      render: (text: string, record: WorkItem) => (
        <button
          style={{
            color: accent,
            fontWeight: 500,
            background: 'transparent',
            border: 'none',
            padding: 0,
            textAlign: 'left',
            cursor: 'pointer',
          }}
          onClick={() => setSelectedMember(record)}
        >
          {text}
        </button>
      ),
    },
    {
      title: <ColumnHeader columnKey="spProduct" referenceDate={referenceDate} />,
      dataIndex: 'spProduct',
      key: 'spProduct',
      width: 110,
      align: 'center',
      render: (value: number | undefined) => value?.toFixed(2) ?? '-',
    },
    {
      title: <ColumnHeader columnKey="spTechDebt" referenceDate={referenceDate} />,
      dataIndex: 'spTechDebt',
      key: 'spTechDebt',
      width: 120,
      align: 'center',
      render: (value: number | undefined) => value?.toFixed(2) ?? '-',
    },
    {
      title: <ColumnHeader columnKey="spMeeting" referenceDate={referenceDate} />,
      dataIndex: 'spMeeting',
      key: 'spMeeting',
      width: 115,
      align: 'center',
      render: (value: number | undefined) => value?.toFixed(2) ?? '-',
    },
    {
      title: <ColumnHeader columnKey="spTotal" referenceDate={referenceDate} />,
      dataIndex: 'spTotal',
      key: 'spTotal',
      width: 100,
      align: 'center',
      render: (value: number | undefined) => value?.toFixed(2) ?? '-',
    },
    {
      title: <ColumnHeader columnKey="productivityRate" referenceDate={referenceDate} />,
      dataIndex: 'productivityRate',
      key: 'productivityRate',
      width: 145,
      align: 'center',
    },
    {
      title: <ColumnHeader columnKey="weightPointsProduct" referenceDate={referenceDate} />,
      dataIndex: 'weightPointsProduct',
      key: 'weightPointsProduct',
      width: 130,
      align: 'center',
    },
    {
      title: <ColumnHeader columnKey="weightPointsTechDebt" referenceDate={referenceDate} />,
      dataIndex: 'weightPointsTechDebt',
      key: 'weightPointsTechDebt',
      width: 140,
      align: 'center',
    },
    {
      title: <ColumnHeader columnKey="totalWeightPoints" referenceDate={referenceDate} />,
      dataIndex: 'totalWeightPoints',
      key: 'totalWeightPoints',
      width: 120,
      align: 'center',
    },
    ...(hasAbadiBoard ? [{
      title: <ColumnHeader columnKey="plannedWP" referenceDate={referenceDate} />,
      dataIndex: 'plannedWP',
      key: 'plannedWP',
      width: 110,
      align: 'center' as const,
      render: (value: number | undefined) => value?.toFixed(2) ?? '-',
    }] : []),
    {
      title: <ColumnHeader columnKey="targetWeightPoints" referenceDate={referenceDate} />,
      dataIndex: 'targetWeightPoints',
      key: 'targetWeightPoints',
      width: 110,
      align: 'center',
    },
    {
      title: <ColumnHeader columnKey="workingDays" referenceDate={referenceDate} />,
      dataIndex: 'workingDays',
      key: 'workingDays',
      width: 120,
      align: 'center',
    },
    {
      title: <ColumnHeader columnKey="wpToHours" referenceDate={referenceDate} />,
      dataIndex: 'wpToHours',
      key: 'wpToHours',
      width: 115,
      align: 'center',
      render: (value: number | undefined) => value?.toFixed(2) ?? '-',
    },
  ];

  const isMultiTeam = selectedTeams.length > 1;

  // Build grouped data: { teamShortName -> WorkItem[] }
  const groupedItems: { boardId: number; label: string; shortName: string; items: WorkItem[] }[] = isMultiTeam
    ? selectedTeams.map(boardId => {
        const board = boards.find(b => b.boardId === boardId);
        const shortName = board?.shortName ?? String(boardId);
        const label = board?.name ?? `Board ${boardId}`;
        const items = (data?.workItems ?? []).filter(w => w.team === shortName);
        return { boardId, label, shortName, items };
      })
    : [];

  return (
    <div className="relative flex-1">
      {!!data && <TeamPerformance />}

      {isMultiTeam ? (
        groupedItems.map(({ boardId, label, shortName, items }) => (
          <div key={boardId} style={{ marginBottom: 24 }}>
            <div
              className="tere-table"
              style={{
                background: cardBg,
                borderRadius: 14,
                border: '1px solid ' + cardBrd,
                overflow: 'hidden',
              }}
            >
              <Table
                columns={columns}
                dataSource={items.map((item, index) => ({ ...item, key: `${shortName}-${index}` }))}
                scroll={{ x: 'max-content' }}
                size="small"
                pagination={{
                  pageSize,
                  showSizeChanger: true,
                  pageSizeOptions: ['5', '10', '20', '50'],
                }}
                onChange={pagination => setPageSize(pagination.pageSize || 5)}
                title={() => (
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: titleCol,
                      fontFamily: sans,
                      padding: '12px 16px',
                      borderBottom: '1px solid ' + cardBrd,
                      background: cardBg,
                    }}
                  >
                    {label}
                    <span style={{ color: subCol, marginLeft: 8, fontSize: 13, fontWeight: 400 }}>
                      ({items.length} member{items.length !== 1 ? 's' : ''})
                    </span>
                  </div>
                )}
              />
            </div>
          </div>
        ))
      ) : (
        <div
          className="tere-table"
          style={{
            background: cardBg,
            borderRadius: 14,
            border: '1px solid ' + cardBrd,
            overflow: 'hidden',
          }}
        >
          <Table
            columns={columns}
            dataSource={data?.workItems.map((item, index) => ({ ...item, key: index }))}
            scroll={{ x: 'max-content' }}
            size="small"
            pagination={{
              pageSize,
              showSizeChanger: true,
              pageSizeOptions: ['5', '10', '20', '50'],
            }}
            onChange={pagination => setPageSize(pagination.pageSize || 5)}
            title={() => (
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: titleCol,
                  fontFamily: sans,
                  padding: '12px 16px',
                  borderBottom: '1px solid ' + cardBrd,
                  background: cardBg,
                }}
              >
                Team Performance Metrics
              </div>
            )}
          />
        </div>
      )}

      {!!data && (
        <div>
          <p
            style={{
              fontSize: 11,
              color: '#ef4444',
              fontFamily: sans,
              padding: '10px 16px',
              borderTop: '1px solid ' + cardBrd,
            }}
          >
            **The shown data is collected based on the actual working days per sprint. There is a chance about inaccurate joint holidays and personal leaves.
          </p>
        </div>
      )}

      <MemberTaskModal
        open={!!selectedMember}
        onClose={() => setSelectedMember(null)}
        member={selectedMember}
      />
    </div>
  );
}
