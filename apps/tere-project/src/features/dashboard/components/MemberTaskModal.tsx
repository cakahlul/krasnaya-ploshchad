'use client';

import { useState } from 'react';
import { Modal, Select } from 'antd';
import {
  TagOutlined,
  UserOutlined,
  ClockCircleOutlined,
  ExperimentOutlined,
  CheckCircleOutlined,
  LinkOutlined,
  DownOutlined,
  RightOutlined,
} from '@ant-design/icons';
import { WorkItem } from '../types/dashboard';
import { useMemberIssues } from '../hooks/useMemberIssues';
import { TicketDetail } from '../hooks/useTicketDetail';
import { useThemeColors } from '@src/hooks/useTheme';

interface MemberTaskModalProps {
  open: boolean;
  onClose: () => void;
  member: WorkItem | null;
}

// --- Shared helpers ---
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

const BADGE_BASE: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  padding: '2px 10px',
  borderRadius: 8,
  fontFamily: 'inherit',
};

// --- Collapsible Ticket Item with micro-interactions ---
function TicketItem({ ticket, index }: { ticket: TicketDetail; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const [headerHover, setHeaderHover] = useState(false);
  const [jiraHover, setJiraHover] = useState(false);
  const { isDark, accent, accentL, cardBg, cardBrd, titleCol, subCol, rowCol, headBg } = useThemeColors();

  const resolutionVal = getSafeResolution(ticket);
  const jiraUrl = ticket.webUrl;

  return (
    <div
      style={{
        border: `1px solid ${cardBrd}`,
        borderRadius: 12,
        overflow: 'hidden',
        animationDelay: `${index * 60}ms`,
        animationFillMode: 'both',
      }}
      className="transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 group/item"
    >
      {/* Collapsed header */}
      <button
        onClick={() => setExpanded(!expanded)}
        onMouseEnter={() => setHeaderHover(true)}
        onMouseLeave={() => setHeaderHover(false)}
        className="w-full flex items-center gap-3 p-3 transition-all duration-300 cursor-pointer text-left"
        style={{
          background: headerHover
            ? isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)'
            : 'transparent',
        }}
      >
        <span
          className="transition-all duration-300"
          style={{ color: subCol }}
        >
          {expanded ? (
            <DownOutlined className="text-xs transition-transform duration-300" />
          ) : (
            <RightOutlined className="text-xs transition-transform duration-300" />
          )}
        </span>

        <div
          className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-transform duration-300 group-hover/item:scale-110 group-hover/item:shadow-md"
          style={{ background: accent + '15' }}
        >
          {ticket.issueTypeIcon ? (
            <img src={ticket.issueTypeIcon} alt={ticket.issueType} className="w-3.5 h-3.5" />
          ) : (
            <TagOutlined style={{ color: accent, fontSize: 12 }} />
          )}
        </div>

        <span
          className="text-xs flex-shrink-0 transition-all duration-200"
          style={{
            color: accent,
            background: accent + '15',
            fontSize: 12,
            fontWeight: 700,
            padding: '2px 8px',
            borderRadius: 6,
          }}
        >
          {ticket.key}
        </span>

        {resolutionVal && (
          <span className={`text-xs font-medium px-2 py-0.5 rounded-md flex-shrink-0 ${getResolutionColor(resolutionVal)}`}>
            {resolutionVal}
          </span>
        )}

        {ticket.totalWeightPoints !== undefined && ticket.totalWeightPoints > 0 && (
          <span className="text-xs font-bold px-2 py-0.5 rounded-md flex-shrink-0 bg-cyan-100/80 text-cyan-700 border border-cyan-200/50">
            {ticket.totalWeightPoints} WP
          </span>
        )}

        <span
          className="text-sm line-clamp-1 flex-1 transition-colors duration-200"
          style={{ color: rowCol }}
        >
          {ticket.summary}
        </span>
      </button>

      {/* Expanded detail */}
      <div
        className={`overflow-hidden transition-all duration-400 ease-in-out ${
          expanded ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div
          className="p-4"
          style={{
            borderTop: `1px solid ${cardBrd}`,
            background: headBg,
          }}
        >
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
                className="flex items-center gap-1.5 text-xs font-medium transition-all duration-200 px-2.5 py-1 rounded-lg hover:shadow-sm"
                style={{
                  color: jiraHover ? accent : subCol,
                  background: cardBg,
                  border: `1px solid ${cardBrd}`,
                }}
                onMouseEnter={() => setJiraHover(true)}
                onMouseLeave={() => setJiraHover(false)}
              >
                <LinkOutlined />
                Jira
              </a>
            )}
          </div>

          {/* Meta grid */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div
              className="p-2.5 transition-all duration-200 hover:shadow-sm"
              style={{ background: cardBg, borderRadius: 10 }}
            >
              <p className="text-xs mb-0.5" style={{ color: subCol }}>Assignee</p>
              <div className="flex items-center gap-1.5">
                {ticket.assigneeAvatar ? (
                  <img src={ticket.assigneeAvatar} alt="" className="w-5 h-5 rounded-full" />
                ) : (
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ background: accent + '20' }}
                  >
                    <UserOutlined style={{ color: accent, fontSize: 10 }} />
                  </div>
                )}
                <span className="text-xs font-medium" style={{ color: rowCol }}>
                  {ticket.assignee || 'Unassigned'}
                </span>
              </div>
            </div>
            <div
              className="p-2.5 transition-all duration-200 hover:shadow-sm"
              style={{ background: cardBg, borderRadius: 10 }}
            >
              <p className="text-xs mb-0.5" style={{ color: subCol }}>Priority</p>
              <div className="flex items-center gap-1.5">
                {ticket.priorityIcon && <img src={ticket.priorityIcon} alt="" className="w-3.5 h-3.5" />}
                <span className="text-xs font-medium" style={{ color: rowCol }}>
                  {ticket.priority}
                </span>
              </div>
            </div>
          </div>

          {/* SP Type & Weight */}
          {(ticket.spType || ticket.appendixV3 !== undefined) && (
            <div className="space-y-3 mb-4">
              {ticket.spType && (
                <div
                  className="p-2.5 transition-all duration-200 hover:shadow-sm"
                  style={{
                    background: accent + '10',
                    borderRadius: 10,
                    border: `1px solid ${accent}20`,
                  }}
                >
                  <p
                    className="text-[10px] mb-0.5 font-semibold uppercase tracking-wider"
                    style={{ color: accent, opacity: 0.8 }}
                  >
                    SP Type
                  </p>
                  <span className="text-xs font-bold" style={{ color: accent }}>
                    {ticket.spType}
                  </span>
                </div>
              )}
              {ticket.appendixV3 !== undefined && (
                <div className="bg-orange-50/50 rounded-xl p-2.5 border border-orange-100/50 transition-all duration-200 hover:shadow-sm hover:border-orange-200">
                  <p className="text-[10px] text-orange-600/80 mb-1 font-semibold uppercase tracking-wider flex items-center gap-1">
                    <ExperimentOutlined />
                    Weight Complexity
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {Array.isArray(ticket.appendixV3) ? (
                      ticket.appendixV3.map((val, idx) => (
                        <span key={idx} className="text-xs font-medium text-orange-700 bg-white px-2 py-0.5 rounded-lg border border-orange-200 shadow-sm transition-all duration-200 hover:scale-105 hover:shadow-md">
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
              <p className="text-xs mb-1" style={{ color: subCol }}>Description</p>
              <div
                className="jira-description rounded-xl p-3 text-xs max-h-60 overflow-y-auto"
                style={{ background: cardBg, color: rowCol }}
                dangerouslySetInnerHTML={{ __html: ticket.description }}
              />
            </div>
          )}

          {/* Dates */}
          <div
            className="flex items-center gap-3 text-[10px] pt-2"
            style={{ color: subCol, borderTop: `1px solid ${cardBrd}` }}
          >
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
      </div>
    </div>
  );
}

// --- Loading Skeleton ---
function TicketListSkeleton() {
  const { cardBg, cardBrd } = useThemeColors();

  return (
    <div className="space-y-3 animate-pulse">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="h-12 rounded-xl"
          style={{ background: cardBrd, animationDelay: `${i * 100}ms` }}
        />
      ))}
    </div>
  );
}

// --- Main Modal ---
export default function MemberTaskModal({ open, onClose, member }: MemberTaskModalProps) {
  const { issues, isLoading, totalKeys } = useMemberIssues(
    member?.issueKeys ?? [],
    open && !!member,
  );

  const [sortBy, setSortBy] = useState<'wp-desc' | 'wp-asc' | 'default'>('wp-desc');
  const { isDark, accent, accentL, cardBg, cardBrd, titleCol, subCol, rowCol, headBg } = useThemeColors();

  const sortedIssues = [...issues].sort((a, b) => {
    if (sortBy === 'default') return 0;
    const wpA = a.totalWeightPoints ?? 0;
    const wpB = b.totalWeightPoints ?? 0;
    return sortBy === 'wp-desc' ? wpB - wpA : wpA - wpB;
  });

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
          background: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.3)',
        },
      }}
    >
      <div
        className="animate-airdrop"
        style={{
          background: isDark ? 'rgba(16,30,50,0.95)' : 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(24px)',
          borderRadius: 20,
          border: `1px solid ${cardBrd}`,
          boxShadow: isDark ? '0 24px 48px rgba(0,0,0,0.4)' : '0 24px 48px rgba(1,29,77,0.12)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div className="relative px-6 pt-6 pb-4">
          <div
            className="absolute inset-0"
            style={{ background: `linear-gradient(135deg, ${accent}15, ${accentL}10)` }}
          />
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-bold" style={{ color: titleCol }}>
                {member?.member}
              </h2>
              <div className="flex items-center gap-4">
                <div style={{ background: cardBg, borderColor: cardBrd }} className="rounded-lg border">
                  <Select
                    value={sortBy}
                    onChange={(value) => setSortBy(value)}
                    options={[
                      { value: 'wp-desc', label: 'WP: High to Low' },
                      { value: 'wp-asc', label: 'WP: Low to High' },
                      { value: 'default', label: 'Default' },
                    ]}
                    size="small"
                    className="w-40 min-w-40"
                    bordered={false}
                    popupMatchSelectWidth={false}
                    dropdownStyle={{ zIndex: 1100 }}
                  />
                </div>
                <span className="text-sm font-medium whitespace-nowrap" style={{ color: subCol }}>
                  {issues.length}/{totalKeys} tasks loaded
                </span>
              </div>
            </div>

            {/* Stats row */}
            <div className="flex gap-3 flex-wrap">
              <span
                className="transition-transform duration-200 hover:scale-105"
                style={{ background: '#10b98118', color: '#10b981', ...BADGE_BASE }}
              >
                WP Product: {member?.weightPointsProduct ?? 0}
              </span>
              <span
                className="transition-transform duration-200 hover:scale-105"
                style={{ background: '#f59e0b18', color: '#f59e0b', ...BADGE_BASE }}
              >
                WP Tech Debt: {member?.weightPointsTechDebt ?? 0}
              </span>
              <span
                className="transition-transform duration-200 hover:scale-105"
                style={{ background: accent + '18', color: accent, ...BADGE_BASE }}
              >
                Total WP: {member?.totalWeightPoints ?? 0}
              </span>
              <span
                className="transition-transform duration-200 hover:scale-105"
                style={{ background: '#3b82f618', color: '#3b82f6', ...BADGE_BASE }}
              >
                Productivity Rate: {member?.productivityRate}
              </span>
            </div>
          </div>
        </div>

        {/* Task List */}
        <div
          className="tere-table px-6 pb-6 max-h-[60vh] overflow-y-auto scroll-smooth"
          style={{ scrollBehavior: 'smooth' }}
        >
          {isLoading ? (
            <TicketListSkeleton />
          ) : sortedIssues.length === 0 ? (
            <div className="text-center py-8" style={{ color: subCol }}>
              <TagOutlined className="text-3xl mb-2" />
              <p className="text-sm">No tasks found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {sortedIssues.map((ticket, index) => (
                <TicketItem key={ticket.key} ticket={ticket} index={index} />
              ))}

              <div className="text-center py-3">
                <p className="text-xs" style={{ color: subCol }}>
                  All {issues.length} tasks loaded
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
