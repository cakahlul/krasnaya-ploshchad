/**
 * Report DTOs — mirrors tere-project/src/shared/types/report.types.ts exactly.
 *
 * These types are kept in sync manually (cannot import cross-package).
 * Source of truth: tere-project report.types.ts + common.types.ts
 *
 * Last synced: 2026-05-07
 */

// ── Common ───────────────────────────────────────────────────────────────────

export enum Level {
  Junior = 'junior',
  Medior = 'medior',
  Senior = 'senior',
  IC = 'individual contributor',
}

// ── Epic ─────────────────────────────────────────────────────────────────────

export interface EpicDto {
  id: string;
  key: string;
  name: string;
  summary: string;
  status?: string;
}

// ── Sprint ───────────────────────────────────────────────────────────────────

export interface SprintDto {
  id: number;
  name: string;
  /** 'active' | 'closed' */
  state: string;
  /** YYYY-MM-DD */
  startDate: string;
  /** YYYY-MM-DD */
  endDate: string;
  boardId: number;
}

// ── Team Report ──────────────────────────────────────────────────────────────

export interface JiraIssueReportResponseDto {
  member: string;
  team: string;
  /** SP-based productivity: (SP Total / (Working Days × 8)) × 100% */
  productivityRate: string;
  /** WP-based productivity: (Total WP / Target WP) × 100% */
  wpProductivity: string;
  devDefect: number;
  devDefectRate: string;
  totalWeightPoints: number;
  level: Level;
  weightPointsProduct: number;
  weightPointsTechDebt: number;
  targetWeightPoints: number;
  issueKeys: string[];
  /**
   * Unique epic/parent keys associated with this member's issues.
   * Value 'null' (string) indicates issues with no parent epic.
   */
  epicKeys?: string[];
  workingDays?: number;
  wpToHours?: number;
  spProduct?: number;
  spTechDebt?: number;
  /** Direct Story Points from meeting tickets (ALL-Meeting prefix). Not converted via WP. */
  spMeeting?: number;
  spTotal?: number;
  plannedWP?: number;
  leaveDays?: number;
  sickDays?: number;
  epic?: EpicDto | null;
}

export interface GetReportResponseDto {
  issues: JiraIssueReportResponseDto[];
  totalWeightPointsProduct: number;
  totalWeightPointsTechDebt: number;
  productPercentage: string;
  techDebtPercentage: string;
  averageProductivity: string;
  totalWorkingDays?: number;
  averageWorkingDays?: number;
  averageWpPerHour?: number;
  totalWeightPoints?: number;
  totalSP?: number;
  targetSP?: number;
  spProductPercentage?: string;
  spTechDebtPercentage?: string;
  spMeetingPercentage?: string;
  totalLeave?: number;
  totalSick?: number;
  totalMemberWorkingDays?: number;
  sprintStartDate?: string;
  sprintEndDate?: string;
  sprintName?: string;
  sprintId?: number;
}

// ── Productivity Summary ──────────────────────────────────────────────────────

export interface ProductivitySummaryMemberDto {
  name: string;
  team: string;
  wpProduct: number;
  wpTech: number;
  wpTotal: number;
  spProduct: number;
  spTechDebt: number;
  spMeeting: number;
  spTotal: number;
  workingDays: number;
  averageWp: number;
  expectedAverageWp: number;
  /** (Total WP / Target WP) × 100%, formatted as "XX.XX%" */
  wpProductivity: string;
  /** (SP Total / (Working Days × 8)) × 100%, formatted as "XX.XX%" */
  productivityRate: string;
}

export interface ProductivitySummaryDto {
  /** Total working days across all members */
  totalDaysOfWorks: number;
  /** Expected total WP for the month */
  totalWpExpected: number;
  /** Expected WP per working day */
  averageWpExpected: number;
  /** Expected productivity = averageWpExpected / 8 (decimal, not %) */
  productivityExpected: number;
  /** Actual total WP produced */
  totalWpProduced: number;
  /** Actual WP per working day */
  averageWpProduced: number;
  /** Actual productivity = averageWpProduced / 8 (decimal, not %) */
  productivityProduced: number;
  /**
   * Variance: (productivityProduced - productivityExpected) / productivityExpected
   * Decimal: 0.1 = 10% above expected, -0.1 = 10% below expected
   */
  productivityProduceVsExpected: number;
}

export interface ProductivitySummaryResponseDto {
  summary: ProductivitySummaryDto;
  /** Sorted alphabetically by name */
  details: ProductivitySummaryMemberDto[];
}

// ── Talent Leave ───────────────────────────────────────────────────────────────

export interface LeaveDateRangeDto {
  dateFrom: string;
  dateTo: string;
  status: 'Leave' | 'Sick';
}

export interface TalentLeaveResponseDto {
  id: string;
  memberId: string;
  name: string;
  team: string;
  leaveDate: LeaveDateRangeDto[];
  createdAt: string;
  updatedAt: string;
}
