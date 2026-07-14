import {
  check,
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
  boolean,
  integer,
  date,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// members
export const members = pgTable('members', {
  id: uuid('id').primaryKey().defaultRandom(),
  jiraId: text('jira_id').unique(),
  name: text('name').notNull(),
  fullName: text('full_name').notNull(),
  email: text('email').notNull().unique(),
  level: text('level').notNull(),
  isLead: boolean('is_lead').notNull().default(false),
  teams: jsonb('teams').$type<string[]>().notNull().default([]),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// talent leave (1 row per member)
export const talentLeave = pgTable('talent_leave', {
  id: uuid('id').primaryKey().defaultRandom(),
  memberId: text('member_id').notNull().unique(),
  name: text('name').notNull(),
  team: text('team').notNull(),
  leaveDate: jsonb('leave_date')
    .$type<
      Array<{
        dateFrom: string;
        dateTo: string;
        status: 'Leave' | 'Sick';
      }>
    >()
    .notNull()
    .default([]),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// holidays
export const holidays = pgTable('holidays', {
  id: uuid('id').primaryKey().defaultRandom(),
  date: date('date').notNull(),
  name: text('name').notNull(),
  isNationalHoliday: boolean('is_national_holiday').notNull().default(true),
});

// boards
export const boards = pgTable('boards', {
  id: uuid('id').primaryKey().defaultRandom(),
  boardId: integer('board_id').notNull().unique(),
  name: text('name').notNull(),
  shortName: text('short_name').notNull(),
  isSubtaskType: boolean('is_subtask_type').notNull().default(false),
  isKanban: boolean('is_kanban').notNull().default(false),
  isShowPlannedWP: boolean('is_show_planned_wp').notNull().default(false),
  isBugMonitoring: boolean('is_bug_monitoring').notNull().default(false),
  bugIssueType: text('bug_issue_type'),
  isStoryGrouping: boolean('is_story_grouping').notNull().default(false),
  kanbanCycleStartDate: date('kanban_cycle_start_date'),
});

// api keys
export const apiKeys = pgTable('api_keys', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  hashedKey: text('hashed_key').notNull().unique(),
  createdBy: text('created_by').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
  isActive: boolean('is_active').notNull().default(true),
});

// user access (RBAC)
export const userAccess = pgTable('user_access', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  role: text('role', { enum: ['Lead', 'Member'] })
    .notNull()
    .default('Member'),
});

// target wp config
export const targetWpConfig = pgTable('target_wp_config', {
  id: uuid('id').primaryKey().defaultRandom(),
  effectiveDate: date('effective_date').notNull(),
  rates: jsonb('rates').$type<Record<string, number>>().notNull(),
});

// wp weight config
export const wpWeightConfig = pgTable('wp_weight_config', {
  id: uuid('id').primaryKey().defaultRandom(),
  effectiveDate: date('effective_date').notNull().unique(),
  weights: jsonb('weights').$type<Record<string, number>>().notNull(),
});

// immutable config audit trail
export const configAuditLog = pgTable('config_audit_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  entityType: text('entity_type').notNull(),
  entityId: text('entity_id').notNull(),
  action: text('action').notNull(),
  changedBy: text('changed_by').notNull(),
  oldValue: jsonb('old_value'),
  newValue: jsonb('new_value'),
  changedAt: timestamp('changed_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
}, table => [
  check('config_audit_log_actor_nonblank', sql`btrim(${table.changedBy}) <> ''`),
  check('config_audit_log_entity_supported', sql`${table.entityType} = 'wp_weight_config'`),
  check('config_audit_log_action_supported', sql`${table.action} in ('create', 'delete')`),
  check(
    'config_audit_log_snapshot_shape',
    sql`(${table.action} = 'create' and ${table.oldValue} is null and ${table.newValue} is not null)
      or (${table.action} = 'delete' and ${table.oldValue} is not null and ${table.newValue} is null)`,
  ),
]);
