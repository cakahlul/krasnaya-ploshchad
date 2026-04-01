import { Level } from './common.types';

export interface MemberEntity {
  id?: string;
  name: string;
  fullName: string;
  email: string;
  level: Level;
  teams: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface MemberResponse {
  id: string;
  name: string;
  fullName: string;
  email: string;
  level: Level;
  teams: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateMemberRequest {
  name: string;
  fullName: string;
  email: string;
  level: Level;
  teams: string[];
}

export interface UpdateMemberRequest {
  name?: string;
  fullName?: string;
  email?: string;
  level?: Level;
  teams?: string[];
}
