import { Level } from './common.types';

export interface MemberEntity {
  id?: string;
  jiraId?: string | null;
  name: string;
  fullName: string;
  email: string;
  level: Level;
  teams: string[];
  isLead?: boolean;
  joinDate: string;
  resignDate?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MemberResponse {
  id: string;
  jiraId: string | null;
  name: string;
  fullName: string;
  email: string;
  level: Level;
  teams: string[];
  isLead?: boolean;
  joinDate: string;
  resignDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMemberRequest {
  jiraId?: string;
  name: string;
  fullName: string;
  email: string;
  level: Level;
  teams: string[];
  isLead?: boolean;
  /** ISO `YYYY-MM-DD`. Archive aggregation excludes months before this date. */
  joinDate?: string;
  /** ISO `YYYY-MM-DD`, or null while the member is still active. */
  resignDate?: string | null;
}

export interface UpdateMemberRequest {
  jiraId?: string;
  name?: string;
  fullName?: string;
  email?: string;
  level?: Level;
  teams?: string[];
  isLead?: boolean;
  joinDate?: string;
  resignDate?: string | null;
}
