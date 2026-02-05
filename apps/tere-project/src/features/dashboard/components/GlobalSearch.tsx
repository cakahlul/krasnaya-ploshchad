'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { SearchOutlined, CloseCircleFilled, LoadingOutlined, TagOutlined, UserOutlined, ClockCircleOutlined, ExperimentOutlined, CheckCircleOutlined, SyncOutlined, LinkOutlined } from '@ant-design/icons';
import { Modal } from 'antd';
import { useGlobalSearch, SearchTicket } from '../hooks/useGlobalSearch';
import { useTicketDetail, TicketDetail } from '../hooks/useTicketDetail';

export default function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTicketKey, setSelectedTicketKey] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  
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

  const getStatusBadgeColor = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('done') || statusLower.includes('closed')) {
      return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
    }
    if (statusLower.includes('progress') || statusLower.includes('review')) {
      return 'bg-blue-100 text-blue-700 border border-blue-200';
    }
    if (statusLower.includes('blocked')) {
      return 'bg-red-100 text-red-700 border border-red-200';
    }
    return 'bg-gray-100 text-gray-700 border border-gray-200';
  };

  const getResolutionColor = (resolution: string) => {
    const resLower = resolution.toLowerCase();
    if (resLower.includes('done') || resLower.includes('fixed') || resLower.includes('resolved')) {
      return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
    }
    if (resLower.includes('in progress') || resLower.includes('review')) {
      return 'bg-amber-100 text-amber-700 border border-amber-200';
    }
    if (resLower.includes('to do') || resLower.includes('open')) {
      return 'bg-gray-100 text-gray-700 border border-gray-200';
    }
    return 'bg-purple-100 text-purple-700 border border-purple-200';
  };
  
  const getSafeResolution = (ticket: SearchTicket | TicketDetail) => {
    if (!ticket.resolution) return '';
    return typeof ticket.resolution === 'object' 
      ? (ticket.resolution as any).name || (ticket.resolution as any).value || 'Resolved' 
      : ticket.resolution;
  };

  const getPriorityColor = (priority: string) => {
    const priorityLower = priority.toLowerCase();
    if (priorityLower.includes('highest') || priorityLower.includes('critical')) {
      return 'text-red-500';
    }
    if (priorityLower.includes('high')) {
      return 'text-orange-500';
    }
    if (priorityLower.includes('medium')) {
      return 'text-amber-500';
    }
    return 'text-gray-500';
  };

  return (
    <>
      <div id="global-search-container" className="relative w-full max-w-xl">
        {/* Glassmorphism Search Input - Spotlight Style */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/30 via-cyan-500/30 to-pink-500/30 rounded-2xl blur-2xl opacity-70" />
          <div className="relative backdrop-blur-2xl bg-white/50 border border-white/60 rounded-2xl shadow-2xl shadow-purple-500/20 overflow-hidden">
            <div className="flex items-center px-5 py-4">
              <SearchOutlined className="text-gray-500 text-xl mr-4" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={handleInputChange}
                onFocus={handleInputFocus}
                placeholder="Search tickets, PRs, docs..."
                className="flex-1 bg-transparent outline-none text-gray-800 placeholder-gray-400 text-base font-medium"
              />
              {query && (
                <button
                  onClick={handleClear}
                  className="ml-3 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <CloseCircleFilled className="text-xl" />
                </button>
              )}
              {isLoading && (
                <LoadingOutlined className="ml-3 text-purple-500 text-xl animate-spin" />
              )}
            </div>
          </div>
        </div>

        {/* Glassmorphism Results Dropdown */}
        {isOpen && query.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 z-50">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-cyan-500/10 to-pink-500/10 rounded-2xl blur-xl" />
            <div 
              ref={resultsRef}
              onScroll={handleScroll}
              className="relative backdrop-blur-2xl bg-white/70 border border-white/50 rounded-2xl shadow-2xl shadow-purple-500/20 max-h-[360px] overflow-y-auto animate-airdrop"
            >
              {results.length === 0 && !isLoading ? (
                <div className="p-6 text-center text-gray-500">
                  <SearchOutlined className="text-3xl mb-2 opacity-50" />
                  <p className="text-sm">No results found</p>
                </div>
              ) : (
                <div className="p-2">
                  {results.map((ticket, index) => {
                    const resolutionVal = getSafeResolution(ticket);
                    return (
                    <div
                      key={ticket.key}
                      onClick={() => handleTicketClick(ticket)}
                      className="p-3 rounded-xl cursor-pointer transition-all duration-200 hover:bg-white/60 hover:shadow-md group animate-airdrop-item"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex items-start gap-3">
                        {/* Issue Type Icon */}
                        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/20 to-cyan-500/20 flex items-center justify-center">
                          {ticket.issueTypeIcon ? (
                            <img src={ticket.issueTypeIcon} alt={ticket.issueType} className="w-4 h-4" />
                          ) : (
                            <TagOutlined className="text-purple-600 text-sm" />
                          )}
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-xs font-bold text-purple-600 bg-purple-100/60 px-2 py-0.5 rounded-md">
                              {ticket.key}
                            </span>
                            {!(ticket.key.startsWith('SLS-') || ticket.key.startsWith('DS-')) && (
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${getStatusBadgeColor(ticket.status)}`}>
                                {ticket.status}
                              </span>
                            )}
                            {ticket.resolution && (
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${getResolutionColor(resolutionVal)}`}>
                                {resolutionVal}
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-medium text-gray-800 line-clamp-1 group-hover:text-purple-700 transition-colors">
                            {ticket.summary}
                          </p>
                          <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                            {ticket.assignee && (
                              <span className="flex items-center gap-1">
                                <UserOutlined className="text-gray-400" />
                                {ticket.assignee}
                              </span>
                            )}
                            <span className={`flex items-center gap-1 ${getPriorityColor(ticket.priority)}`}>
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
                      <LoadingOutlined className="text-purple-500 text-lg animate-spin" />
                    </div>
                  )}
                  
                  {/* Has more indicator */}
                  {hasMore && !isFetching && (
                    <div className="p-2 text-center text-xs text-gray-400">
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
              background: 'rgba(0, 0, 0, 0.3)',
            },
          }}
        >
          {isLoadingDetail ? (
            <TicketDetailSkeleton />
          ) : selectedTicket ? (
            <TicketDetailCard 
              ticket={selectedTicket} 
              formatDate={formatDate} 
              getStatusBadgeColor={getStatusBadgeColor}
              getResolutionColor={getResolutionColor}
              getSafeResolution={getSafeResolution}
            />
          ) : null}
        </Modal>
    </>
  );
}

function TicketDetailSkeleton() {
  return (
    <div className="backdrop-blur-2xl bg-white/80 rounded-3xl border border-white/50 shadow-2xl shadow-purple-500/20 p-6 animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
      <div className="h-8 bg-gray-200 rounded w-full mb-6" />
      <div className="space-y-3">
        <div className="h-4 bg-gray-100 rounded w-full" />
        <div className="h-4 bg-gray-100 rounded w-3/4" />
        <div className="h-4 bg-gray-100 rounded w-1/2" />
      </div>
    </div>
  );
}

interface TicketDetailCardProps {
  ticket: TicketDetail;
  formatDate: (date: string) => string;
  getStatusBadgeColor: (status: string) => string;
  getResolutionColor: (resolution: string) => string;
  getSafeResolution: (ticket: SearchTicket | TicketDetail) => string;
}

function TicketDetailCard({ ticket, formatDate, getStatusBadgeColor, getResolutionColor, getSafeResolution }: TicketDetailCardProps) {
  // Helper for safe rendering
  const safeRender = (val: any) => {
    if (typeof val === 'object' && val !== null) {
       return val.value || val.name || val.id || JSON.stringify(val);
    }
    return val;
  };

  const resolutionVal = getSafeResolution(ticket);
  
  return (
    <div className="backdrop-blur-2xl bg-white/90 rounded-3xl border border-white/50 shadow-2xl shadow-purple-500/20 overflow-hidden animate-airdrop">
      
      {/* Header with gradient */}
      <div className="relative px-6 pt-6 pb-4">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-cyan-500/10 to-pink-500/10" />
        <div className="relative">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm font-bold text-purple-600 bg-purple-100/80 px-3 py-1 rounded-lg">
                {ticket.key}
              </span>
              {!(ticket.key.startsWith('SLS-') || ticket.key.startsWith('DS-')) && (
                <span className={`text-sm font-medium px-3 py-1 rounded-lg ${getStatusBadgeColor(ticket.status)}`}>
                  {safeRender(ticket.status)}
                </span>
              )}
              {ticket.resolution && (
                <span className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1 rounded-lg ${getResolutionColor(resolutionVal)}`}>
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
                className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-purple-600 transition-colors bg-white/50 hover:bg-white px-3 py-1.5 rounded-lg border border-gray-200 hover:border-purple-200"
              >
                <LinkOutlined />
                Open in Jira
              </a>
            )}
          </div>
          <h2 className="text-xl font-bold text-gray-800">{ticket.summary}</h2>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 pb-6">
        {/* Meta info grid */}
        <div className="grid grid-cols-2 gap-4 mb-5">
          <div className="bg-gray-50/80 rounded-xl p-3">
            <p className="text-xs text-gray-500 mb-1">Assignee</p>
            <div className="flex items-center gap-2">
              {ticket.assigneeAvatar ? (
                <img src={ticket.assigneeAvatar} alt="" className="w-6 h-6 rounded-full" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center">
                  <UserOutlined className="text-purple-500 text-xs" />
                </div>
              )}
              <span className="text-sm font-medium text-gray-800">
                {ticket.assignee || 'Unassigned'}
              </span>
            </div>
          </div>
          <div className="bg-gray-50/80 rounded-xl p-3">
            <p className="text-xs text-gray-500 mb-1">Reporter</p>
            <div className="flex items-center gap-2">
              {ticket.reporterAvatar ? (
                <img src={ticket.reporterAvatar} alt="" className="w-6 h-6 rounded-full" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-cyan-100 flex items-center justify-center">
                  <UserOutlined className="text-cyan-500 text-xs" />
                </div>
              )}
              <span className="text-sm font-medium text-gray-800">
                {ticket.reporter || 'Unknown'}
              </span>
            </div>
          </div>
          <div className="bg-gray-50/80 rounded-xl p-3">
            <p className="text-xs text-gray-500 mb-1">Priority</p>
            <div className="flex items-center gap-2">
              {ticket.priorityIcon && (
                <img src={ticket.priorityIcon} alt="" className="w-4 h-4" />
              )}
              <span className="text-sm font-medium text-gray-800">{ticket.priority}</span>
            </div>
          </div>
          <div className="bg-gray-50/80 rounded-xl p-3">
            <p className="text-xs text-gray-500 mb-1">Type</p>
            <div className="flex items-center gap-2">
              {ticket.issueTypeIcon && (
                <img src={ticket.issueTypeIcon} alt="" className="w-4 h-4" />
              )}
              <span className="text-sm font-medium text-gray-800">{ticket.issueType}</span>
            </div>
          </div>
        </div>

        {/* Complexity & Weight (New Section) */}
        {(ticket.storyPoints !== undefined || ticket.spType || ticket.appendixV3 !== undefined) && (
          <div className="space-y-4 mb-5">
            {/* Story Points & SP Type Row */}
            {(ticket.storyPoints !== undefined || ticket.spType) && (
              <div className="grid grid-cols-2 gap-4">
                {ticket.storyPoints !== undefined && (
                  <div className="bg-cyan-50/50 rounded-xl p-3 border border-cyan-100/50">
                    <p className="text-xs text-cyan-600/80 mb-1 font-semibold uppercase tracking-wider">Story Points</p>
                    <span className="text-lg font-bold text-cyan-700">
                      {ticket.storyPoints} SP
                    </span>
                  </div>
                )}
                {ticket.spType && (
                  <div className="bg-purple-50/50 rounded-xl p-3 border border-purple-100/50">
                    <p className="text-xs text-purple-600/80 mb-1 font-semibold uppercase tracking-wider">Story Point Type</p>
                    <span className="text-sm font-bold text-purple-700">
                      {ticket.spType}
                    </span>
                  </div>
                )}
              </div>
            )}
            
            {ticket.appendixV3 !== undefined && (
              <div className="bg-orange-50/50 rounded-xl p-3 border border-orange-100/50">
                <p className="text-xs text-orange-600/80 mb-2 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                  <ExperimentOutlined />
                  Weight Complexity
                </p>
                <div className="flex flex-wrap gap-2">
                  {Array.isArray(ticket.appendixV3) ? (
                    ticket.appendixV3.map((val, idx) => (
                      <span key={idx} className="text-sm font-medium text-orange-700 bg-white px-3 py-1 rounded-lg border border-orange-200 shadow-sm">
                        {safeRender(val)}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm font-medium text-orange-700 bg-white px-3 py-1 rounded-lg border border-orange-200 shadow-sm">
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
            <p className="text-xs text-gray-500 mb-1">Sprint</p>
            <p className="text-sm font-medium text-gray-800">{ticket.sprint}</p>
          </div>
        )}

        {/* Labels */}
        {ticket.labels.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-2">Labels</p>
            <div className="flex flex-wrap gap-2">
              {ticket.labels.map((label) => (
                <span key={label} className="text-xs font-medium px-2 py-1 bg-gray-100 text-gray-600 rounded-md">
                  {label}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Description */}
        {ticket.description && (
          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-2">Description</p>
            <div className="bg-gray-50/80 rounded-xl p-4 text-sm text-gray-700 max-h-40 overflow-y-auto">
              {ticket.description}
            </div>
          </div>
        )}

        {/* Dates */}
        <div className="flex items-center gap-4 text-xs text-gray-400 pt-3 border-t border-gray-100">
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
