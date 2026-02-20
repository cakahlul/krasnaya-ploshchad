'use client';

import { useState } from 'react';
import { Modal } from 'antd';
import {
  TagOutlined,
  UserOutlined,
  ClockCircleOutlined,
  ExperimentOutlined,
  CheckCircleOutlined,
  LinkOutlined,
  LoadingOutlined,
  DownOutlined,
  RightOutlined,
} from '@ant-design/icons';
import { WorkItem } from '../types/dashboard';
import { useMemberIssues } from '../hooks/useMemberIssues';
import { TicketDetail } from '../hooks/useTicketDetail';

interface MemberTaskModalProps {
  open: boolean;
  onClose: () => void;
  member: WorkItem | null;
}

// --- Shared helpers (same as GlobalSearch) ---
const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

const getStatusBadgeColor = (status: string) => {
  const s = status.toLowerCase();
  if (s.includes('done') || s.includes('closed'))
    return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
  if (s.includes('progress') || s.includes('review'))
    return 'bg-blue-100 text-blue-700 border border-blue-200';
  if (s.includes('blocked'))
    return 'bg-red-100 text-red-700 border border-red-200';
  return 'bg-gray-100 text-gray-700 border border-gray-200';
};

const getResolutionColor = (resolution: string) => {
  const r = resolution.toLowerCase();
  if (r.includes('done') || r.includes('fixed') || r.includes('resolved'))
    return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
  if (r.includes('in progress') || r.includes('review'))
    return 'bg-amber-100 text-amber-700 border border-amber-200';
  if (r.includes('to do') || r.includes('open'))
    return 'bg-gray-100 text-gray-700 border border-gray-200';
  return 'bg-purple-100 text-purple-700 border border-purple-200';
};

const getSafeResolution = (ticket: TicketDetail) => {
  if (!ticket.resolution) return '';
  return typeof ticket.resolution === 'object'
    ? (ticket.resolution as any).name || (ticket.resolution as any).value || 'Resolved'
    : ticket.resolution;
};

const safeRender = (val: any) => {
  if (typeof val === 'object' && val !== null) {
    return val.value || val.name || val.id || JSON.stringify(val);
  }
  return val;
};

// --- Collapsible Ticket Item ---
function TicketItem({ ticket }: { ticket: TicketDetail }) {
  const [expanded, setExpanded] = useState(false);
  const resolutionVal = getSafeResolution(ticket);
  const jiraUrl = ticket.webUrl;

  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden transition-all duration-200 hover:shadow-md">
      {/* Collapsed header - always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-3 bg-white hover:bg-gray-50/80 transition-colors cursor-pointer text-left"
      >
        <span className="text-gray-400 transition-transform duration-200">
          {expanded ? <DownOutlined className="text-xs" /> : <RightOutlined className="text-xs" />}
        </span>

        <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500/20 to-cyan-500/20 flex items-center justify-center">
          {ticket.issueTypeIcon ? (
            <img src={ticket.issueTypeIcon} alt={ticket.issueType} className="w-3.5 h-3.5" />
          ) : (
            <TagOutlined className="text-purple-600 text-xs" />
          )}
        </div>

        <span className="text-xs font-bold text-purple-600 bg-purple-100/60 px-2 py-0.5 rounded-md flex-shrink-0">
          {ticket.key}
        </span>

        {resolutionVal && (
          <span className={`text-xs font-medium px-2 py-0.5 rounded-md flex-shrink-0 ${getResolutionColor(resolutionVal)}`}>
            {resolutionVal}
          </span>
        )}

        <span className="text-sm text-gray-800 line-clamp-1 flex-1">
          {ticket.summary}
        </span>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-gray-100 bg-gray-50/30 p-4 animate-airdrop">
          {/* Action bar */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 flex-wrap">
              {!(ticket.key.startsWith('SLS-') || ticket.key.startsWith('DS-')) && (
                <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${getStatusBadgeColor(ticket.status)}`}>
                  {safeRender(ticket.status)}
                </span>
              )}
              {resolutionVal && (
                <span className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-md ${getResolutionColor(resolutionVal)}`}>
                  <CheckCircleOutlined />
                  {resolutionVal}
                </span>
              )}
            </div>
            {jiraUrl && (
              <a
                href={jiraUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-purple-600 transition-colors bg-white px-2.5 py-1 rounded-lg border border-gray-200 hover:border-purple-200"
              >
                <LinkOutlined />
                Jira
              </a>
            )}
          </div>

          {/* Meta grid */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-white rounded-xl p-2.5">
              <p className="text-xs text-gray-500 mb-0.5">Assignee</p>
              <div className="flex items-center gap-1.5">
                {ticket.assigneeAvatar ? (
                  <img src={ticket.assigneeAvatar} alt="" className="w-5 h-5 rounded-full" />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center">
                    <UserOutlined className="text-purple-500 text-[10px]" />
                  </div>
                )}
                <span className="text-xs font-medium text-gray-800">{ticket.assignee || 'Unassigned'}</span>
              </div>
            </div>
            <div className="bg-white rounded-xl p-2.5">
              <p className="text-xs text-gray-500 mb-0.5">Priority</p>
              <div className="flex items-center gap-1.5">
                {ticket.priorityIcon && <img src={ticket.priorityIcon} alt="" className="w-3.5 h-3.5" />}
                <span className="text-xs font-medium text-gray-800">{ticket.priority}</span>
              </div>
            </div>
          </div>

          {/* Story Points & Weight */}
          {(ticket.storyPoints !== undefined || ticket.spType || ticket.appendixV3 !== undefined) && (
            <div className="space-y-3 mb-4">
              {(ticket.storyPoints !== undefined || ticket.spType) && (
                <div className="grid grid-cols-2 gap-3">
                  {ticket.storyPoints !== undefined && (
                    <div className="bg-cyan-50/50 rounded-xl p-2.5 border border-cyan-100/50">
                      <p className="text-[10px] text-cyan-600/80 mb-0.5 font-semibold uppercase tracking-wider">Story Points</p>
                      <span className="text-sm font-bold text-cyan-700">{ticket.storyPoints} SP</span>
                    </div>
                  )}
                  {ticket.spType && (
                    <div className="bg-purple-50/50 rounded-xl p-2.5 border border-purple-100/50">
                      <p className="text-[10px] text-purple-600/80 mb-0.5 font-semibold uppercase tracking-wider">SP Type</p>
                      <span className="text-xs font-bold text-purple-700">{ticket.spType}</span>
                    </div>
                  )}
                </div>
              )}
              {ticket.appendixV3 !== undefined && (
                <div className="bg-orange-50/50 rounded-xl p-2.5 border border-orange-100/50">
                  <p className="text-[10px] text-orange-600/80 mb-1 font-semibold uppercase tracking-wider flex items-center gap-1">
                    <ExperimentOutlined />
                    Weight Complexity
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {Array.isArray(ticket.appendixV3) ? (
                      ticket.appendixV3.map((val, idx) => (
                        <span key={idx} className="text-xs font-medium text-orange-700 bg-white px-2 py-0.5 rounded-lg border border-orange-200 shadow-sm">
                          {safeRender(val)}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs font-medium text-orange-700 bg-white px-2 py-0.5 rounded-lg border border-orange-200 shadow-sm">
                        {safeRender(ticket.appendixV3)}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Description */}
          {ticket.description && (
            <div className="mb-3">
              <p className="text-xs text-gray-500 mb-1">Description</p>
              <div className="bg-white rounded-xl p-3 text-xs text-gray-700 max-h-28 overflow-y-auto">
                {ticket.description}
              </div>
            </div>
          )}

          {/* Dates */}
          <div className="flex items-center gap-3 text-[10px] text-gray-400 pt-2 border-t border-gray-100">
            <span className="flex items-center gap-1">
              <ClockCircleOutlined />
              Created: {formatDate(ticket.created)}
            </span>
            <span className="flex items-center gap-1">
              <ClockCircleOutlined />
              Updated: {formatDate(ticket.updated)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Loading Skeleton ---
function TicketListSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-12 bg-gray-100 rounded-xl" />
      ))}
    </div>
  );
}

// --- Main Modal ---
export default function MemberTaskModal({ open, onClose, member }: MemberTaskModalProps) {
  const { issues, isLoading } = useMemberIssues(member?.issueKeys ?? [], open && !!member);

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={700}
      centered
      styles={{
        content: {
          background: 'transparent',
          boxShadow: 'none',
          padding: 0,
        },
        mask: {
          backdropFilter: 'blur(8px)',
          background: 'rgba(0, 0, 0, 0.3)',
        },
      }}
    >
      <div className="backdrop-blur-2xl bg-white/90 rounded-3xl border border-white/50 shadow-2xl shadow-purple-500/20 overflow-hidden animate-airdrop">
        {/* Header */}
        <div className="relative px-6 pt-6 pb-4">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-cyan-500/10 to-pink-500/10" />
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-bold text-gray-800">
                {member?.member}
              </h2>
              <span className="text-sm text-gray-500 font-medium">
                {member?.issueKeys?.length ?? 0} tasks
              </span>
            </div>

            {/* Stats row */}
            <div className="flex gap-3 flex-wrap">
              <span className="text-xs font-medium px-2.5 py-1 bg-emerald-100/80 text-emerald-700 rounded-lg">
                WP Product: {member?.weightPointsProduct ?? 0}
              </span>
              <span className="text-xs font-medium px-2.5 py-1 bg-orange-100/80 text-orange-700 rounded-lg">
                WP Tech Debt: {member?.weightPointsTechDebt ?? 0}
              </span>
              <span className="text-xs font-medium px-2.5 py-1 bg-purple-100/80 text-purple-700 rounded-lg">
                Total WP: {member?.totalWeightPoints ?? 0}
              </span>
              <span className="text-xs font-medium px-2.5 py-1 bg-blue-100/80 text-blue-700 rounded-lg">
                Productivity: {member?.productivityRate}
              </span>
            </div>
          </div>
        </div>

        {/* Task List */}
        <div className="px-6 pb-6 max-h-[60vh] overflow-y-auto">
          {isLoading ? (
            <TicketListSkeleton />
          ) : issues.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <TagOutlined className="text-3xl mb-2" />
              <p className="text-sm">No tasks found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {issues.map((ticket) => (
                <TicketItem key={ticket.key} ticket={ticket} />
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
