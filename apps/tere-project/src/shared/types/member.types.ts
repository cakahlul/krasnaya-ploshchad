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
}

export interface UpdateMemberRequest {
  jiraId?: string;
  name?: string;
  fullName?: string;
  email?: string;
  level?: Level;
  teams?: string[];
  isLead?: boolean;
}
