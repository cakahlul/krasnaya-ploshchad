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
import { Info } from 'lucide-react';

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
  spTotal: {
    label: 'SP Total',
    description: 'Total Story Points across all work types.',
    formula: 'SP Product + SP Tech Debt',
  },
  productivityRate: {
    label: 'Productivity Rate',
    description: 'How much of the target weight points the member achieved.',
    formula: '(Total WP / Target WP) \u00d7 100%',
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

function ColumnHeader({ columnKey }: { columnKey: string }) {
  const wpWeights = useWpWeightConfig();
  const info = { ...COLUMN_INFO[columnKey] };
  if (!info) return <span>{columnKey}</span>;

  if (columnKey === 'weightPointsProduct' || columnKey === 'weightPointsTechDebt') {
    const levels = Object.entries(wpWeights)
      .map(([k, v]) => `${k}=${v}`)
      .join(', ');
    info.note = `Complexity levels: ${levels}`;
  }

  const popoverContent = (
    <div className="max-w-[280px]">
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 -mx-3 -mt-3 px-4 py-2.5 rounded-t-lg mb-3">
        <span className="text-white font-semibold text-sm tracking-wide">
          {info.label}
        </span>
      </div>
      <p className="text-gray-700 text-xs leading-relaxed m-0 mb-2">
        {info.description}
      </p>
      {info.formula && (
        <div className="mt-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
            Formula
          </span>
          <div className="mt-1 rounded-md bg-gray-900 px-3 py-2">
            <code className="text-emerald-400 text-xs font-mono whitespace-pre-wrap">
              {info.formula}
            </code>
          </div>
        </div>
      )}
      {info.note && (
        <p className="text-[11px] text-indigo-500 mt-2 mb-0 italic leading-snug">
          {info.note}
        </p>
      )}
    </div>
  );

  return (
    <span className="inline-flex items-center gap-1.5">
      <span>{info.label}</span>
      <Popover
        content={popoverContent}
        trigger="hover"
        placement="bottom"
        overlayInnerStyle={{ padding: 12, borderRadius: 12 }}
      >
        <Info
          size={13}
          className="text-indigo-400 hover:text-indigo-600 cursor-help transition-colors duration-150 shrink-0"
        />
      </Popover>
    </span>
  );
}

export default function TeamTable() {
  const { data } = useTeamReportTransform();
  const [pageSize, setPageSize] = useState(5);
  const [selectedMember, setSelectedMember] = useState<WorkItem | null>(null);
  const selectedTeams = useTeamReportFilterStore(state => state.selectedTeams);
  const { boards } = useBoards();

  const hasAbadiBoard = selectedTeams.some(teamId => {
    const board = boards.find(b => b.boardId === teamId);
    return board?.isShowPlannedWP === true;
  });

  const columns: TableColumnsType<WorkItem> = [
    {
      title: <ColumnHeader columnKey="member" />,
      dataIndex: 'member',
      key: 'member',
      render: (text: string, record: WorkItem) => (
        <button
          className="text-purple-600 hover:text-purple-800 font-medium hover:underline cursor-pointer bg-transparent border-none p-0 text-left"
          onClick={() => setSelectedMember(record)}
        >
          {text}
        </button>
      ),
    },
    {
      title: <ColumnHeader columnKey="spProduct" />,
      dataIndex: 'spProduct',
      key: 'spProduct',
      render: (value: number | undefined) => value?.toFixed(2) ?? '-',
    },
    {
      title: <ColumnHeader columnKey="spTechDebt" />,
      dataIndex: 'spTechDebt',
      key: 'spTechDebt',
      render: (value: number | undefined) => value?.toFixed(2) ?? '-',
    },
    {
      title: <ColumnHeader columnKey="spTotal" />,
      dataIndex: 'spTotal',
      key: 'spTotal',
      render: (value: number | undefined) => value?.toFixed(2) ?? '-',
    },
    {
      title: <ColumnHeader columnKey="productivityRate" />,
      dataIndex: 'productivityRate',
      key: 'productivityRate',
    },
    {
      title: <ColumnHeader columnKey="weightPointsProduct" />,
      dataIndex: 'weightPointsProduct',
      key: 'weightPointsProduct',
    },
    {
      title: <ColumnHeader columnKey="weightPointsTechDebt" />,
      dataIndex: 'weightPointsTechDebt',
      key: 'weightPointsTechDebt',
    },
    {
      title: <ColumnHeader columnKey="totalWeightPoints" />,
      dataIndex: 'totalWeightPoints',
      key: 'totalWeightPoints',
    },
    ...(hasAbadiBoard ? [{
      title: <ColumnHeader columnKey="plannedWP" />,
      dataIndex: 'plannedWP',
      key: 'plannedWP',
      render: (value: number | undefined) => value?.toFixed(2) ?? '-',
    }] : []),
    {
      title: <ColumnHeader columnKey="targetWeightPoints" />,
      dataIndex: 'targetWeightPoints',
      key: 'targetWeightPoints',
    },
    {
      title: <ColumnHeader columnKey="workingDays" />,
      dataIndex: 'workingDays',
      key: 'workingDays',
    },
    {
      title: <ColumnHeader columnKey="wpToHours" />,
      dataIndex: 'wpToHours',
      key: 'wpToHours',
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
      <div className="p-4">
        {!!data && <TeamPerformance />}

        {isMultiTeam ? (
          groupedItems.map(({ boardId, label, shortName, items }) => (
            <div key={boardId} className="mb-6">
              <Table
                columns={columns}
                dataSource={items.map((item, index) => ({ ...item, key: `${shortName}-${index}` }))}
                pagination={{
                  pageSize,
                  showSizeChanger: true,
                  pageSizeOptions: ['5', '10', '20', '50'],
                }}
                onChange={pagination => setPageSize(pagination.pageSize || 5)}
                title={() => (
                  <h2>
                    <strong>{label}</strong>
                    <span className="ml-2 text-sm font-normal text-gray-500">
                      ({items.length} member{items.length !== 1 ? 's' : ''})
                    </span>
                  </h2>
                )}
              />
            </div>
          ))
        ) : (
          <Table
            columns={columns}
            dataSource={data?.workItems.map((item, index) => ({ ...item, key: index }))}
            pagination={{
              pageSize,
              showSizeChanger: true,
              pageSizeOptions: ['5', '10', '20', '50'],
            }}
            onChange={pagination => setPageSize(pagination.pageSize || 5)}
            title={() => (
              <h2>
                <strong>Team Performance Metrics</strong>
              </h2>
            )}
          />
        )}
      </div>

      {!!data && (
        <div>
          <p className="text-red-500 text-xs">
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
