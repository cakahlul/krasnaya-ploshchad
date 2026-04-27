'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { SearchOutlined, CloseCircleFilled, LoadingOutlined, TagOutlined, UserOutlined, ClockCircleOutlined, ExperimentOutlined, CheckCircleOutlined, SyncOutlined, LinkOutlined } from '@ant-design/icons';
import { Modal } from 'antd';
import { useGlobalSearch, SearchTicket } from '../hooks/useGlobalSearch';
import { useTicketDetail, TicketDetail } from '../hooks/useTicketDetail';
import { useThemeColors } from '@src/hooks/useTheme';

export default function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTicketKey, setSelectedTicketKey] = useState<string | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [jiraHovered, setJiraHovered] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const { isDark, accent, accentL, cardBg, cardBrd, titleCol, subCol, rowCol, headBg } = useThemeColors();

  const {
    query,
    setQuery,
    results,
    total,
    hasMore,
    isLoading,
    isFetching,
    fetchMore,
    clearSearch,
  } = useGlobalSearch(300);

  const { ticket: selectedTicket, isLoading: isLoadingDetail } = useTicketDetail(selectedTicketKey);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const container = document.getElementById('global-search-container');
      if (container && !container.contains(target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle scroll for infinite loading
  const handleScroll = useCallback(() => {
    if (!resultsRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = resultsRef.current;
    if (scrollTop + clientHeight >= scrollHeight - 50 && hasMore && !isFetching) {
      fetchMore();
    }
  }, [hasMore, isFetching, fetchMore]);

  const handleInputFocus = () => {
    if (query.length > 0) {
      setIsOpen(true);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setIsOpen(e.target.value.length > 0);
  };

  const handleClear = () => {
    clearSearch();
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleTicketClick = (ticket: SearchTicket) => {
    setSelectedTicketKey(ticket.key);
    setIsOpen(false);
  };

  const handleModalClose = () => {
    setSelectedTicketKey(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusBadgeStyle = (status: string): React.CSSProperties => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('done') || statusLower.includes('closed')) {
      return {
        background: isDark ? '#0a2a1e' : '#f0fdf7',
        color: '#10b981',
        border: '1px solid #10b98130',
        fontSize: 12,
        fontWeight: 500,
        padding: '2px 8px',
        borderRadius: 6,
      };
    }
    if (statusLower.includes('progress') || statusLower.includes('review')) {
      return {
        background: isDark ? '#0f2030' : '#f0f7ff',
        color: accent,
        border: `1px solid ${accent}30`,
        fontSize: 12,
        fontWeight: 500,
        padding: '2px 8px',
        borderRadius: 6,
      };
    }
    if (statusLower.includes('blocked')) {
      return {
        background: isDark ? '#2a0f10' : '#fff5f5',
        color: '#ef4444',
        border: '1px solid #ef444430',
        fontSize: 12,
        fontWeight: 500,
        padding: '2px 8px',
        borderRadius: 6,
      };
    }
    return {
      background: isDark ? 'rgba(255,255,255,0.06)' : '#f5f6fb',
      color: subCol,
      border: `1px solid ${cardBrd}`,
      fontSize: 12,
      fontWeight: 500,
      padding: '2px 8px',
      borderRadius: 6,
    };
  };

  const getResolutionStyle = (resolution: string): React.CSSProperties => {
    const resLower = resolution.toLowerCase();
    if (resLower.includes('done') || resLower.includes('fixed') || resLower.includes('resolved')) {
      return {
        background: isDark ? '#0a2a1e' : '#f0fdf7',
        color: '#10b981',
        border: '1px solid #10b98130',
        fontSize: 12,
        fontWeight: 500,
        padding: '2px 8px',
        borderRadius: 6,
      };
    }
    if (resLower.includes('in progress') || resLower.includes('review')) {
      return {
        background: isDark ? '#0f2030' : '#fff8f0',
        color: isDark ? '#f59e0b' : '#d97706',
        border: `1px solid ${isDark ? '#f59e0b30' : '#d9770630'}`,
        fontSize: 12,
        fontWeight: 500,
        padding: '2px 8px',
        borderRadius: 6,
      };
    }
    if (resLower.includes('to do') || resLower.includes('open')) {
      return {
        background: isDark ? 'rgba(255,255,255,0.06)' : '#f5f6fb',
        color: subCol,
        border: `1px solid ${cardBrd}`,
        fontSize: 12,
        fontWeight: 500,
        padding: '2px 8px',
        borderRadius: 6,
      };
    }
    return {
      background: isDark ? '#0f2030' : '#f0f7ff',
      color: accent,
      border: `1px solid ${accent}30`,
      fontSize: 12,
      fontWeight: 500,
      padding: '2px 8px',
      borderRadius: 6,
    };
  };

  const getSafeResolution = (ticket: SearchTicket | TicketDetail) => {
    if (!ticket.resolution) return '';
    return typeof ticket.resolution === 'object'
      ? (ticket.resolution as any).name || (ticket.resolution as any).value || 'Resolved'
      : ticket.resolution;
  };

  const getPriorityStyle = (priority: string): React.CSSProperties => {
    const priorityLower = priority.toLowerCase();
    if (priorityLower.includes('highest') || priorityLower.includes('critical')) {
      return { color: '#ef4444' };
    }
    if (priorityLower.includes('high')) {
      return { color: '#f97316' };
    }
    if (priorityLower.includes('medium')) {
      return { color: '#f59e0b' };
    }
    return { color: subCol };
  };

  return (
    <>
      <div id="global-search-container" className="relative w-full max-w-xl">
        {/* Search Input */}
        <div className="relative">
          <div
            style={{
              background: isDark ? 'rgba(16,30,50,0.9)' : 'rgba(255,255,255,0.9)',
              backdropFilter: 'blur(16px)',
              border: `1px solid ${cardBrd}`,
              borderRadius: 16,
              boxShadow: isDark ? '0 4px 24px rgba(0,0,0,0.3)' : '0 4px 24px rgba(1,29,77,0.08)',
            }}
            className="overflow-hidden"
          >
            <div className="flex items-center px-5 py-4">
              <SearchOutlined className="text-xl mr-4" style={{ color: subCol }} />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={handleInputChange}
                onFocus={handleInputFocus}
                placeholder="Search tickets, PRs, docs..."
                className="flex-1 bg-transparent outline-none text-base font-medium"
                style={{ color: rowCol }}
              />
              {/* Placeholder color via inline style sheet */}
              <style>{`
                #global-search-container input::placeholder {
                  color: ${subCol};
                }
              `}</style>
              {query && (
                <button
                  onClick={handleClear}
                  className="ml-3 transition-colors"
                  style={{ color: subCol }}
                >
                  <CloseCircleFilled className="text-xl" />
                </button>
              )}
              {isLoading && (
                <LoadingOutlined className="ml-3 text-xl animate-spin" style={{ color: accent }} />
              )}
            </div>
          </div>
        </div>

        {/* Results Dropdown */}
        {isOpen && query.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 z-50">
            <div
              ref={resultsRef}
              onScroll={handleScroll}
              className="max-h-[360px] overflow-y-auto animate-airdrop"
              style={{
                background: isDark ? 'rgba(16,30,50,0.96)' : 'rgba(255,255,255,0.96)',
                backdropFilter: 'blur(16px)',
                border: `1px solid ${cardBrd}`,
                borderRadius: 16,
                boxShadow: isDark ? '0 16px 48px rgba(0,0,0,0.4)' : '0 16px 48px rgba(1,29,77,0.12)',
              }}
            >
              {results.length === 0 && !isLoading ? (
                <div className="p-6 text-center">
                  <SearchOutlined className="text-3xl mb-2 opacity-50" style={{ color: subCol }} />
                  <p className="text-sm" style={{ color: subCol }}>No results found</p>
                </div>
              ) : (
                <div className="p-2">
                  {results.map((ticket, index) => {
                    const resolutionVal = getSafeResolution(ticket);
                    return (
                    <div
                      key={ticket.key}
                      onClick={() => handleTicketClick(ticket)}
                      onMouseEnter={() => setHoveredIndex(index)}
                      onMouseLeave={() => setHoveredIndex(null)}
                      className="p-3 rounded-xl cursor-pointer transition-all duration-200 group animate-airdrop-item"
                      style={{
                        animationDelay: `${index * 50}ms`,
                        background: hoveredIndex === index
                          ? (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)')
                          : 'transparent',
                      }}
                    >
                      <div className="flex items-start gap-3">
                        {/* Issue Type Icon */}
                        <div
                          className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{ background: accent + '15' }}
                        >
                          {ticket.issueTypeIcon ? (
                            <img src={ticket.issueTypeIcon} alt={ticket.issueType} className="w-4 h-4" />
                          ) : (
                            <TagOutlined className="text-sm" style={{ color: accent }} />
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span
                              style={{
                                color: accent,
                                background: accent + '15',
                                fontWeight: 700,
                                fontSize: 12,
                                padding: '2px 8px',
                                borderRadius: 6,
                              }}
                            >
                              {ticket.key}
                            </span>
                            {!(ticket.key.startsWith('SLS-') || ticket.key.startsWith('DS-')) && (
                              <span style={getStatusBadgeStyle(ticket.status)}>
                                {ticket.status}
                              </span>
                            )}
                            {ticket.resolution && (
                              <span style={getResolutionStyle(resolutionVal)}>
                                {resolutionVal}
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-medium line-clamp-1 transition-colors" style={{ color: rowCol }}>
                            {ticket.summary}
                          </p>
                          <div className="flex items-center gap-3 mt-1.5 text-xs" style={{ color: subCol }}>
                            {ticket.assignee && (
                              <span className="flex items-center gap-1">
                                <UserOutlined style={{ color: subCol }} />
                                {ticket.assignee}
                              </span>
                            )}
                            <span className="flex items-center gap-1" style={getPriorityStyle(ticket.priority)}>
                              {ticket.priority}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                  })}

                  {/* Loading more indicator */}
                  {isFetching && results.length > 0 && (
                    <div className="p-3 text-center">
                      <LoadingOutlined className="text-lg animate-spin" style={{ color: accent }} />
                    </div>
                  )}

                  {/* Has more indicator */}
                  {hasMore && !isFetching && (
                    <div className="p-2 text-center text-xs" style={{ color: subCol }}>
                      Scroll for more • {total} total results
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Ticket Detail Modal */}
      <Modal
        key={selectedTicketKey || 'modal'}
        open={!!selectedTicketKey}
        onCancel={handleModalClose}
        footer={null}
        width={600}
        centered
        className="ticket-detail-modal"
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
          {isLoadingDetail ? (
            <TicketDetailSkeleton
              isDark={isDark}
              cardBg={cardBg}
              cardBrd={cardBrd}
            />
          ) : selectedTicket ? (
            <TicketDetailCard
              ticket={selectedTicket}
              formatDate={formatDate}
              getStatusBadgeStyle={getStatusBadgeStyle}
              getResolutionStyle={getResolutionStyle}
              getSafeResolution={getSafeResolution}
              isDark={isDark}
              accent={accent}
              accentL={accentL}
              cardBg={cardBg}
              cardBrd={cardBrd}
              titleCol={titleCol}
              subCol={subCol}
              rowCol={rowCol}
              headBg={headBg}
            />
          ) : null}
        </Modal>
    </>
  );
}

interface TicketDetailSkeletonProps {
  isDark: boolean;
  cardBg: string;
  cardBrd: string;
}

function TicketDetailSkeleton({ isDark, cardBg, cardBrd }: TicketDetailSkeletonProps) {
  const shimmer = isDark ? 'rgba(255,255,255,0.06)' : '#e5e7eb';
  const shimmerLight = isDark ? 'rgba(255,255,255,0.03)' : '#f3f4f6';

  return (
    <div
      className="p-6 animate-pulse"
      style={{
        background: isDark ? 'rgba(16,30,50,0.95)' : 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(24px)',
        borderRadius: 20,
        border: `1px solid ${cardBrd}`,
        boxShadow: isDark ? '0 16px 48px rgba(0,0,0,0.4)' : '0 16px 48px rgba(1,29,77,0.12)',
      }}
    >
      <div style={{ background: shimmer, height: 24, borderRadius: 6, width: '33%', marginBottom: 16 }} />
      <div style={{ background: shimmer, height: 32, borderRadius: 6, width: '100%', marginBottom: 24 }} />
      <div className="space-y-3">
        <div style={{ background: shimmerLight, height: 16, borderRadius: 6, width: '100%' }} />
        <div style={{ background: shimmerLight, height: 16, borderRadius: 6, width: '75%' }} />
        <div style={{ background: shimmerLight, height: 16, borderRadius: 6, width: '50%' }} />
      </div>
    </div>
  );
}

interface TicketDetailCardProps {
  ticket: TicketDetail;
  formatDate: (date: string) => string;
  getStatusBadgeStyle: (status: string) => React.CSSProperties;
  getResolutionStyle: (resolution: string) => React.CSSProperties;
  getSafeResolution: (ticket: SearchTicket | TicketDetail) => string;
  isDark: boolean;
  accent: string;
  accentL: string;
  cardBg: string;
  cardBrd: string;
  titleCol: string;
  subCol: string;
  rowCol: string;
  headBg: string;
}

function TicketDetailCard({
  ticket,
  formatDate,
  getStatusBadgeStyle,
  getResolutionStyle,
  getSafeResolution,
  isDark,
  accent,
  accentL,
  cardBg,
  cardBrd,
  titleCol,
  subCol,
  rowCol,
  headBg,
}: TicketDetailCardProps) {
  const [jiraHovered, setJiraHovered] = useState(false);

  // Helper for safe rendering
  const safeRender = (val: any) => {
    if (typeof val === 'object' && val !== null) {
       return val.value || val.name || val.id || JSON.stringify(val);
    }
    return val;
  };

  const resolutionVal = getSafeResolution(ticket);

  return (
    <div
      className="overflow-hidden animate-airdrop"
      style={{
        background: isDark ? 'rgba(16,30,50,0.95)' : 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(24px)',
        borderRadius: 20,
        border: `1px solid ${cardBrd}`,
        boxShadow: isDark ? '0 16px 48px rgba(0,0,0,0.4)' : '0 16px 48px rgba(1,29,77,0.12)',
      }}
    >

      {/* Header with gradient */}
      <div className="relative px-6 pt-6 pb-4">
        <div
          className="absolute inset-0"
          style={{ background: `linear-gradient(135deg, ${accent}15, ${accentL}10)` }}
        />
        <div className="relative">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3 flex-wrap">
              <span
                style={{
                  color: accent,
                  background: accent + '15',
                  fontWeight: 700,
                  fontSize: 14,
                  padding: '4px 12px',
                  borderRadius: 8,
                }}
              >
                {ticket.key}
              </span>
              {!(ticket.key.startsWith('SLS-') || ticket.key.startsWith('DS-')) && (
                <span
                  className="flex items-center"
                  style={{
                    ...getStatusBadgeStyle(ticket.status),
                    fontSize: 14,
                    padding: '4px 12px',
                    borderRadius: 8,
                  }}
                >
                  {safeRender(ticket.status)}
                </span>
              )}
              {ticket.resolution && (
                <span
                  className="flex items-center gap-1.5"
                  style={{
                    ...getResolutionStyle(resolutionVal),
                    fontSize: 14,
                    padding: '4px 12px',
                    borderRadius: 8,
                  }}
                >
                  <CheckCircleOutlined />
                  {resolutionVal}
                </span>
              )}
            </div>
            {ticket.webUrl && (
              <a
                href={ticket.webUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm font-medium transition-colors px-3 py-1.5 rounded-lg"
                style={{
                  color: jiraHovered ? accent : subCol,
                  background: cardBg,
                  border: `1px solid ${cardBrd}`,
                }}
                onMouseEnter={() => setJiraHovered(true)}
                onMouseLeave={() => setJiraHovered(false)}
              >
                <LinkOutlined />
                Open in Jira
              </a>
            )}
          </div>
          <h2 className="text-xl font-bold" style={{ color: titleCol }}>{ticket.summary}</h2>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 pb-6">
        {/* Meta info grid */}
        <div className="grid grid-cols-2 gap-4 mb-5">
          <div className="p-3" style={{ background: headBg, borderRadius: 10 }}>
            <p className="text-xs mb-1" style={{ color: subCol }}>Assignee</p>
            <div className="flex items-center gap-2">
              {ticket.assigneeAvatar ? (
                <img src={ticket.assigneeAvatar} alt="" className="w-6 h-6 rounded-full" />
              ) : (
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ background: accent + '15' }}
                >
                  <UserOutlined className="text-xs" style={{ color: accent }} />
                </div>
              )}
              <span className="text-sm font-medium" style={{ color: rowCol }}>
                {ticket.assignee || 'Unassigned'}
              </span>
            </div>
          </div>
          <div className="p-3" style={{ background: headBg, borderRadius: 10 }}>
            <p className="text-xs mb-1" style={{ color: subCol }}>Reporter</p>
            <div className="flex items-center gap-2">
              {ticket.reporterAvatar ? (
                <img src={ticket.reporterAvatar} alt="" className="w-6 h-6 rounded-full" />
              ) : (
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ background: accent + '15' }}
                >
                  <UserOutlined className="text-xs" style={{ color: accent }} />
                </div>
              )}
              <span className="text-sm font-medium" style={{ color: rowCol }}>
                {ticket.reporter || 'Unknown'}
              </span>
            </div>
          </div>
          <div className="p-3" style={{ background: headBg, borderRadius: 10 }}>
            <p className="text-xs mb-1" style={{ color: subCol }}>Priority</p>
            <div className="flex items-center gap-2">
              {ticket.priorityIcon && (
                <img src={ticket.priorityIcon} alt="" className="w-4 h-4" />
              )}
              <span className="text-sm font-medium" style={{ color: rowCol }}>{ticket.priority}</span>
            </div>
          </div>
          <div className="p-3" style={{ background: headBg, borderRadius: 10 }}>
            <p className="text-xs mb-1" style={{ color: subCol }}>Type</p>
            <div className="flex items-center gap-2">
              {ticket.issueTypeIcon && (
                <img src={ticket.issueTypeIcon} alt="" className="w-4 h-4" />
              )}
              <span className="text-sm font-medium" style={{ color: rowCol }}>{ticket.issueType}</span>
            </div>
          </div>
        </div>

        {/* Complexity & Weight */}
        {(ticket.spType || ticket.appendixV3 !== undefined) && (
          <div className="space-y-4 mb-5">
            {/* SP Type Row */}
            {ticket.spType && (
              <div
                className="p-3"
                style={{
                  background: accent + '10',
                  borderRadius: 10,
                  border: `1px solid ${accent}20`,
                }}
              >
                <p
                  className="text-xs mb-1 font-semibold uppercase tracking-wider"
                  style={{ color: accent }}
                >
                  Story Point Type
                </p>
                <span className="text-sm font-bold" style={{ color: accent }}>
                  {ticket.spType}
                </span>
              </div>
            )}

            {ticket.appendixV3 !== undefined && (
              <div
                className="p-3"
                style={{
                  background: isDark ? 'rgba(245,158,11,0.08)' : '#fff8f0',
                  borderRadius: 10,
                  border: `1px solid ${isDark ? 'rgba(245,158,11,0.15)' : '#fed7aa60'}`,
                }}
              >
                <p
                  className="text-xs mb-2 font-semibold uppercase tracking-wider flex items-center gap-1.5"
                  style={{ color: isDark ? '#f59e0b' : '#d97706' }}
                >
                  <ExperimentOutlined />
                  Weight Complexity
                </p>
                <div className="flex flex-wrap gap-2">
                  {Array.isArray(ticket.appendixV3) ? (
                    ticket.appendixV3.map((val, idx) => (
                      <span
                        key={idx}
                        className="text-sm font-medium px-3 py-1 rounded-lg shadow-sm"
                        style={{
                          color: isDark ? '#f59e0b' : '#d97706',
                          background: isDark ? 'rgba(245,158,11,0.1)' : '#fff',
                          border: `1px solid ${isDark ? 'rgba(245,158,11,0.2)' : '#fed7aa'}`,
                        }}
                      >
                        {safeRender(val)}
                      </span>
                    ))
                  ) : (
                    <span
                      className="text-sm font-medium px-3 py-1 rounded-lg shadow-sm"
                      style={{
                        color: isDark ? '#f59e0b' : '#d97706',
                        background: isDark ? 'rgba(245,158,11,0.1)' : '#fff',
                        border: `1px solid ${isDark ? 'rgba(245,158,11,0.2)' : '#fed7aa'}`,
                      }}
                    >
                      {safeRender(ticket.appendixV3)}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Sprint */}
        {ticket.sprint && (
          <div className="mb-4">
            <p className="text-xs mb-1" style={{ color: subCol }}>Sprint</p>
            <p className="text-sm font-medium" style={{ color: rowCol }}>{ticket.sprint}</p>
          </div>
        )}

        {/* Labels */}
        {ticket.labels.length > 0 && (
          <div className="mb-4">
            <p className="text-xs mb-2" style={{ color: subCol }}>Labels</p>
            <div className="flex flex-wrap gap-2">
              {ticket.labels.map((label) => (
                <span
                  key={label}
                  className="text-xs font-medium px-2 py-1 rounded-md"
                  style={{
                    background: headBg,
                    color: rowCol,
                    border: `1px solid ${cardBrd}`,
                  }}
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Description */}
        {ticket.description && (
          <div className="mb-4">
            <p className="text-xs mb-2" style={{ color: subCol }}>Description</p>
            <div
              className="p-4 text-sm max-h-40 overflow-y-auto"
              style={{
                background: headBg,
                borderRadius: 10,
                color: rowCol,
              }}
            >
              {ticket.description}
            </div>
          </div>
        )}

        {/* Dates */}
        <div
          className="flex items-center gap-4 text-xs pt-3"
          style={{
            color: subCol,
            borderTop: `1px solid ${cardBrd}`,
          }}
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
  );
}
