import {
  check,
  foreignKey,
  index,
  numeric,
  pgTable,
  unique,
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
export const reportingGroupConfig = pgTable('reporting_group_config', {
  code: text('code').primaryKey(),
  displayName: text('display_name').notNull(),
  reportingLeadEmail: text('reporting_lead_email'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
}, table => [
  foreignKey({
    columns: [table.reportingLeadEmail],
    foreignColumns: [members.email],
    name: 'reporting_group_config_lead_email_fkey',
  }).onDelete('set null'),
  check(
    'reporting_group_config_code_supported',
    sql`${table.code} in ('Loan', 'Transaction', 'User')`,
  ),
]);

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
  reportingGroup: text('reporting_group'),
  reportingBoardLeadEmail: text('reporting_board_lead_email'),
}, table => [
  foreignKey({
    columns: [table.reportingGroup],
    foreignColumns: [reportingGroupConfig.code],
    name: 'boards_reporting_group_fkey',
  }).onDelete('set null'),
  foreignKey({
    columns: [table.reportingBoardLeadEmail],
    foreignColumns: [members.email],
    name: 'boards_reporting_board_lead_email_fkey',
  }).onDelete('set null'),
]);

export const groupRuleConfig = pgTable('group_rule_config', {
  id: uuid('id').primaryKey().defaultRandom(),
  reportingGroup: text('reporting_group').notNull(),
  effectiveMonth: date('effective_month').notNull(),
  ruleVersion: text('rule_version').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
}, table => [
  foreignKey({
    columns: [table.reportingGroup],
    foreignColumns: [reportingGroupConfig.code],
    name: 'group_rule_config_group_fkey',
  }).onDelete('restrict'),
  check(
    'group_rule_config_effective_month_first_day',
    sql`${table.effectiveMonth} = date_trunc('month', ${table.effectiveMonth})::date`,
  ),
  check(
    'group_rule_config_version_supported',
    sql`${table.ruleVersion} in ('legacy', 'new', 'v3')`,
  ),
  unique('group_rule_config_group_effective_month_unique')
    .on(table.reportingGroup, table.effectiveMonth),
  index('group_rule_config_lookup_idx')
    .on(table.reportingGroup, table.effectiveMonth.desc()),
]);

export const productivityArchiveImportBatch = pgTable('productivity_archive_import_batch', {
  id: uuid('id').primaryKey().defaultRandom(),
  targetMonth: date('target_month').notNull(),
  sourceFormat: text('source_format').notNull(),
  status: text('status').notNull(),
  sourceFileName: text('source_file_name'),
  sourceFileSha256: text('source_file_sha256'),
  rawSource: jsonb('raw_source'),
  normalizedSummary: jsonb('normalized_summary'),
  rejectionReasons: jsonb('rejection_reasons'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  validatedAt: timestamp('validated_at', { withTimezone: true }),
  createdBy: text('created_by'),
}, table => [
  check(
    'productivity_archive_import_batch_target_month_first_day',
    sql`${table.targetMonth} = date_trunc('month', ${table.targetMonth})::date`,
  ),
  check(
    'productivity_archive_import_batch_source_format_supported',
    sql`${table.sourceFormat} in ('green-2025', 'blue-2026')`,
  ),
  check(
    'productivity_archive_import_batch_status_supported',
    sql`${table.status} in ('pending', 'validated', 'rejected')`,
  ),
  unique('productivity_archive_import_batch_id_target_month_unique')
    .on(table.id, table.targetMonth),
  index('productivity_archive_import_batch_month_status_idx')
    .on(table.targetMonth, table.status),
]);

export const productivityArchiveDeveloperSprint = pgTable('productivity_archive_developer_sprint', {
  id: uuid('id').primaryKey().defaultRandom(),
  importBatchId: uuid('import_batch_id').notNull(),
  archivedMonth: date('archived_month').notNull(),
  sprintId: text('sprint_id').notNull(),
  sprintName: text('sprint_name').notNull(),
  sprintStartDate: date('sprint_start_date').notNull(),
  sprintEndDate: date('sprint_end_date').notNull(),
  boardIdSnapshot: integer('board_id_snapshot'),
  boardNameSnapshot: text('board_name_snapshot'),
  reportingGroupSnapshot: text('reporting_group_snapshot'),
  developerIdentityRaw: text('developer_identity_raw').notNull(),
  developerIdentityNormalized: text('developer_identity_normalized').notNull(),
  developerLevelRaw: text('developer_level_raw'),
  developerLevelNormalized: text('developer_level_normalized'),
  mainRoleRaw: text('main_role_raw'),
  mainRoleNormalized: text('main_role_normalized'),
  sourceTeam: text('source_team'),
  sourceFormat: text('source_format').notNull(),
  sourceStatus: text('source_status'),
  spTotal: numeric('sp_total'),
  spCompleted: numeric('sp_completed'),
  spProvenance: text('sp_provenance'),
  rawRecord: jsonb('raw_record').notNull(),
  normalizedRecord: jsonb('normalized_record').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
}, table => [
  foreignKey({
    columns: [table.importBatchId, table.archivedMonth],
    foreignColumns: [productivityArchiveImportBatch.id, productivityArchiveImportBatch.targetMonth],
    name: 'productivity_archive_developer_sprint_batch_month_fkey',
  }).onDelete('restrict'),
  check(
    'productivity_archive_developer_sprint_month_first_day',
    sql`${table.archivedMonth} = date_trunc('month', ${table.archivedMonth})::date`,
  ),
  check(
    'productivity_archive_developer_sprint_month_matches_end',
    sql`${table.archivedMonth} = date_trunc('month', ${table.sprintEndDate})::date`,
  ),
  check(
    'productivity_archive_developer_sprint_dates_ordered',
    sql`${table.sprintEndDate} >= ${table.sprintStartDate}`,
  ),
  check(
    'productivity_archive_developer_sprint_group_supported',
    sql`${table.reportingGroupSnapshot} is null or ${table.reportingGroupSnapshot} in ('Loan', 'Transaction', 'User')`,
  ),
  check(
    'productivity_archive_developer_sprint_source_format_supported',
    sql`${table.sourceFormat} in ('green-2025', 'blue-2026')`,
  ),
  check(
    'productivity_archive_developer_sprint_sp_nonnegative',
    sql`(${table.spTotal} is null or ${table.spTotal} >= 0)
      and (${table.spCompleted} is null or ${table.spCompleted} >= 0)`,
  ),
  unique('productivity_archive_developer_sprint_developer_sprint_start_unique')
    .on(table.archivedMonth, table.developerIdentityNormalized, table.sprintId, table.sprintStartDate),
  index('productivity_archive_developer_sprint_month_group_idx')
    .on(table.archivedMonth, table.reportingGroupSnapshot),
]);

export const productivityArchiveCoverage = pgTable('productivity_archive_coverage', {
  archivedMonth: date('archived_month').primaryKey(),
  importBatchId: uuid('import_batch_id').notNull().unique(),
  rowCount: integer('row_count').notNull(),
  coveredAt: timestamp('covered_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
}, table => [
  foreignKey({
    columns: [table.importBatchId, table.archivedMonth],
    foreignColumns: [productivityArchiveImportBatch.id, productivityArchiveImportBatch.targetMonth],
    name: 'productivity_archive_coverage_batch_month_fkey',
  }).onDelete('restrict'),
  check(
    'productivity_archive_coverage_month_first_day',
    sql`${table.archivedMonth} = date_trunc('month', ${table.archivedMonth})::date`,
  ),
  check('productivity_archive_coverage_row_count_nonempty', sql`${table.rowCount} > 0`),
]);

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
  index('config_audit_log_cursor_idx')
    .on(table.entityType, table.changedAt.desc(), table.id.desc()),
  check('config_audit_log_actor_nonblank', sql`btrim(${table.changedBy}) <> ''`),
  check(
    'config_audit_log_entity_supported',
    sql`${table.entityType} in ('wp_weight_config', 'holiday', 'target_wp_config')`,
  ),
  check('config_audit_log_action_supported', sql`${table.action} in ('create', 'delete', 'update')`),
  check(
    'config_audit_log_snapshot_shape',
    sql`(${table.action} = 'create' and ${table.oldValue} is null and ${table.newValue} is not null)
      or (${table.action} = 'delete' and ${table.oldValue} is not null and ${table.newValue} is null)
      or (${table.action} = 'update' and ${table.oldValue} is not null and ${table.newValue} is not null)`,
  ),
]);
