'use client';

import { useQuery } from '@tanstack/react-query';
import axiosClient from '@src/lib/axiosClient';

const apiUrl = process.env.NEXT_PUBLIC_AIOC_SERVICE;

export interface TicketDetail {
  key: string;
  summary: string;
  description: string | null;
  status: string;
  statusColor?: string;
  resolution?: string; // To Do, In Progress, Done
  assignee: string | null;
  assigneeAvatar?: string;
  reporter: string | null;
  reporterAvatar?: string;
  priority: string;
  priorityIcon?: string;
  issueType: string;
  issueTypeIcon?: string;
  labels: string[];
  created: string;
  updated: string;
  projectKey: string;
  projectName: string;
  sprint?: string;
  storyPoints?: number;
  appendixV3?: number | string | string[]; // Weight Complexity
  webUrl?: string;
}

async function fetchTicketDetail(key: string): Promise<TicketDetail> {
  const response = await axiosClient.get(`${apiUrl}/search/tickets/${key}`);
  return response.data;
}

export function useTicketDetail(key: string | null) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['ticket-detail', key],
    queryFn: () => fetchTicketDetail(key!),
    enabled: !!key,
    staleTime: 60 * 1000, // 1 minute cache
  });

  return {
    ticket: data ?? null,
    isLoading,
    error: error as Error | null,
  };
}
