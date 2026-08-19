import {
  check,
  foreignKey,
  index,
  numeric,
  pgTable,
  unique,
  uniqueIndex,
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
  joinDate: date('join_date').notNull().default('2025-01-01'),
  resignDate: date('resign_date'),
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

// Manual actual-close dates for bug tickets whose author closed them late (or not at all) in Jira.
// Key present here wins over Jira's resolutiondate; absent falls back to Jira.
export const bugCloseOverride = pgTable('bug_close_override', {
  key: text('key').primaryKey(),
  closedDate: date('closed_date').notNull(),
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
  bugJql: text('bug_jql'),
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
  spTarget: numeric('sp_target'),
  workingDays: numeric('working_days'),
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

export const teamReportingSnapshots = pgTable('team_reporting_snapshot', {
  id: uuid('id').primaryKey().defaultRandom(),
  boardId: integer('board_id').notNull(),
  boardName: text('board_name').notNull(),
  periodKind: text('period_kind').notNull(),
  sprintId: text('sprint_id'),
  sprintName: text('sprint_name'),
  periodStartDate: date('period_start_date').notNull(),
  periodEndDate: date('period_end_date').notNull(),
  reportingMonth: date('reporting_month').notNull(),
  rawJiraInput: jsonb('raw_jira_input').notNull(),
  calculatedOutput: jsonb('calculated_output').notNull(),
  rawInputCount: integer('raw_input_count').notNull(),
  calculatedOutputCount: integer('calculated_output_count').notNull(),
  rawInputChecksum: text('raw_input_checksum').notNull(),
  calculatedOutputChecksum: text('calculated_output_checksum').notNull(),
  integrityEvidence: jsonb('integrity_evidence').notNull(),
  requiredSegmentCount: integer('required_segment_count').notNull(),
  capturedAt: timestamp('captured_at', { withTimezone: true }).notNull().defaultNow(),
}, table => [
  foreignKey({
    columns: [table.boardId],
    foreignColumns: [boards.boardId],
    name: 'team_reporting_snapshot_board_fkey',
  }).onDelete('restrict'),
  check('team_reporting_snapshot_period_kind_supported', sql`${table.periodKind} in ('scrum', 'kanban')`),
  check(
    'team_reporting_snapshot_period_identity_valid',
    sql`(${table.periodKind} = 'scrum' and ${table.sprintId} is not null and btrim(${table.sprintId}) <> '')
      or (${table.periodKind} = 'kanban' and ${table.sprintId} is null and ${table.sprintName} is null)`,
  ),
  check('team_reporting_snapshot_dates_ordered', sql`${table.periodEndDate} >= ${table.periodStartDate}`),
  check(
    'team_reporting_snapshot_reporting_month_matches_period_end',
    sql`${table.reportingMonth} = date_trunc('month', ${table.periodEndDate})::date`,
  ),
  check(
    'team_reporting_snapshot_counts_nonnegative',
    sql`${table.rawInputCount} >= 0 and ${table.calculatedOutputCount} >= 0 and ${table.requiredSegmentCount} > 0`,
  ),
  check(
    'team_reporting_snapshot_checksums_nonblank',
    sql`btrim(${table.rawInputChecksum}) <> '' and btrim(${table.calculatedOutputChecksum}) <> ''`,
  ),
  uniqueIndex('team_reporting_snapshot_board_sprint_unique')
    .on(table.boardId, table.sprintId)
    .where(sql`${table.periodKind} = 'scrum'`),
  uniqueIndex('team_reporting_snapshot_board_period_unique')
    .on(table.boardId, table.periodStartDate, table.periodEndDate)
    .where(sql`${table.periodKind} = 'kanban'`),
]);

export const teamReportingSnapshotCoverage = pgTable('team_reporting_snapshot_coverage', {
  id: uuid('id').primaryKey().defaultRandom(),
  snapshotId: uuid('snapshot_id').notNull(),
  segmentKey: text('segment_key').notNull(),
  rawInputCount: integer('raw_input_count').notNull(),
  calculatedOutputCount: integer('calculated_output_count').notNull(),
  checksum: text('checksum').notNull(),
}, table => [
  foreignKey({
    columns: [table.snapshotId],
    foreignColumns: [teamReportingSnapshots.id],
    name: 'team_reporting_snapshot_coverage_snapshot_fkey',
  }).onDelete('cascade'),
  unique('team_reporting_snapshot_coverage_segment_unique').on(table.snapshotId, table.segmentKey),
  check('team_reporting_snapshot_coverage_counts_nonnegative', sql`${table.rawInputCount} >= 0 and ${table.calculatedOutputCount} >= 0`),
  check('team_reporting_snapshot_coverage_checksum_nonblank', sql`btrim(${table.checksum}) <> ''`),
]);

export const teamReportingCaptureRuns = pgTable('team_reporting_capture_run', {
  id: uuid('id').primaryKey().defaultRandom(),
  actor: text('actor').notNull(),
  windowStartDate: date('window_start_date').notNull(),
  windowEndDate: date('window_end_date').notNull(),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  status: text('status').notNull(),
  attemptedCount: integer('attempted_count').notNull().default(0),
  succeededCount: integer('succeeded_count').notNull().default(0),
  failedCount: integer('failed_count').notNull().default(0),
  unchangedCount: integer('unchanged_count').notNull().default(0),
}, table => [
  check('team_reporting_capture_run_actor_valid', sql`btrim(${table.actor}) <> '' and char_length(${table.actor}) <= 160`),
  check('team_reporting_capture_run_window_ordered', sql`${table.windowEndDate} >= ${table.windowStartDate}`),
  check('team_reporting_capture_run_status_supported', sql`${table.status} in ('running', 'complete', 'partial', 'failed')`),
  check('team_reporting_capture_run_counts_nonnegative', sql`${table.attemptedCount} >= 0 and ${table.succeededCount} >= 0 and ${table.failedCount} >= 0 and ${table.unchangedCount} >= 0`),
  check('team_reporting_capture_run_terminal_consistent', sql`(${table.status} = 'running' and ${table.completedAt} is null)
    or (${table.status} in ('complete', 'partial', 'failed') and ${table.completedAt} is not null
      and ${table.succeededCount} + ${table.failedCount} + ${table.unchangedCount} = ${table.attemptedCount})`),
  check('team_reporting_capture_run_complete_without_failures', sql`${table.status} <> 'complete' or ${table.failedCount} = 0`),
]);

export const teamReportingCaptureFailures = pgTable('team_reporting_capture_failure', {
  id: uuid('id').primaryKey().defaultRandom(),
  runId: uuid('run_id').notNull(),
  boardId: integer('board_id').notNull(),
  period: text('period_key').notNull(),
  reason: text('reason').notNull(),
  occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow(),
}, table => [
  foreignKey({
    columns: [table.runId],
    foreignColumns: [teamReportingCaptureRuns.id],
    name: 'team_reporting_capture_failure_run_fkey',
  }).onDelete('cascade'),
  foreignKey({
    columns: [table.boardId],
    foreignColumns: [boards.boardId],
    name: 'team_reporting_capture_failure_board_fkey',
  }).onDelete('restrict'),
  check('team_reporting_capture_failure_period_valid', sql`btrim(${table.period}) <> '' and char_length(${table.period}) <= 160`),
  check('team_reporting_capture_failure_reason_safe', sql`${table.reason} ~ '^CAPTURE_[A-Z_]{1,96}$'`),
  index('team_reporting_capture_failure_run_idx').on(table.runId),
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
