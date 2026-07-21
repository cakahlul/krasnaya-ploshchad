/**
 * Self-check for Epic Explorer metrics roll-up (SLS-16808).
 * Run: npx tsx src/server/modules/reports/epic-explorer.metrics.test.ts
 * Pure — no DB/network.
 */
import assert from 'node:assert/strict';
import type { JiraIssueEntity } from '@shared/types/report.types';
import type { WpWeights } from '@server/modules/wp-weight-config/wp-weight-config.repository';
import {
  buildDescendant,
  rollupMetrics,
  resolveStatusCategory,
  resolveSprint,
} from './epic-explorer.metrics';

const WEIGHTS: WpWeights = { 'Very Low': 1, Low: 2, Medium: 4, High: 8 };
const ROSTER = new Set(['acc-roster']);

function issue(overrides: Partial<JiraIssueEntity['fields']>, key = 'AB-1'): JiraIssueEntity {
  const fields = {
    summary: 'x',
    issuetype: { id: '1', name: 'Story', description: '', self: '' },
    status: { name: 'To Do', statusCategory: { key: 'new', name: 'To Do' } },
    assignee: { accountId: 'acc-roster', displayName: 'Ros Ter' },
    customfield_10796: { value: 'SP Product' },
    customfield_11543: [{ value: 'ALL-High', id: '1', self: '' }],
    ...overrides,
  } as unknown as JiraIssueEntity['fields'];
  return { id: key, key, summary: 'x', fields };
}

// ── resolveStatusCategory maps Jira category key → bucket + name ──────────────
assert.equal(resolveStatusCategory(issue({ status: { name: 'Done', statusCategory: { key: 'done' } } })).bucket, 'done');
assert.equal(resolveStatusCategory(issue({ status: { name: 'X', statusCategory: { key: 'indeterminate' } } })).bucket, 'inProgress');
assert.equal(resolveStatusCategory(issue({ status: undefined })).bucket, 'toDo');

// ── WP uses appendix weights, not hand-rolled; roster gates storyPoint ────────
const high = buildDescendant(
  issue({ customfield_11543: [{ value: 'ALL-High' }] as never, customfield_10005: 5 }),
  WEIGHTS,
  ROSTER,
);
assert.equal(high.weightPoint, 8, 'High → 8 from config');
assert.equal(high.appendixLevel, 'High');
assert.equal(high.storyPoint, 5, 'roster assignee → raw SP surfaced');
assert.equal(high.isMeeting, false);
assert.equal(high.missingMetricData, false);

// non-roster assignee → storyPoint null (row kept)
const nonRoster = buildDescendant(
  issue({ assignee: { accountId: 'acc-other', displayName: 'Other' } as never, customfield_10005: 9 }),
  WEIGHTS,
  ROSTER,
);
assert.equal(nonRoster.storyPoint, null, 'non-roster → SP null');
assert.equal(nonRoster.assigneeAccountId, 'acc-other');

// unassigned → storyPoint null
const unassigned = buildDescendant(
  issue({ assignee: undefined, customfield_10005: 3 }),
  WEIGHTS,
  ROSTER,
);
assert.equal(unassigned.storyPoint, null);
assert.equal(unassigned.assignee, null);

// meeting ticket → WP 0, spMeeting > 0, isMeeting true
const meeting = buildDescendant(
  issue({ customfield_11543: [{ value: 'ALL-Meeting 2-No Complexity-2SP' }] as never }),
  WEIGHTS,
  ROSTER,
);
assert.equal(meeting.weightPoint, 0, 'meeting excluded from WP');
assert.equal(meeting.spMeeting, 2, 'meeting SP via strategy.extractMeetingSP');
assert.equal(meeting.isMeeting, true);

// roster meeting ticket WITH raw SP set → SP must NOT leak into product/techDebt,
// only into the meeting leg (meeting SP already flows via spMeeting).
const meetingWithRawSp = buildDescendant(
  issue({
    customfield_11543: [{ value: 'ALL-Meeting 2-No Complexity-2SP' }] as never,
    customfield_10005: 7,
  }),
  WEIGHTS,
  ROSTER,
);
assert.equal(meetingWithRawSp.storyPoint, null, 'meeting raw SP not attributed to product/techDebt');
assert.equal(meetingWithRawSp.spMeeting, 2);
assert.equal(meetingWithRawSp.isMeeting, true);
const meetingRollup = rollupMetrics([meetingWithRawSp]);
assert.equal(meetingRollup.storyPoint.product, null, 'no product SP from a meeting ticket');
assert.equal(meetingRollup.storyPoint.techDebt, null, 'no techDebt SP from a meeting ticket');
assert.equal(meetingRollup.storyPoint.meeting, 2, 'meeting SP only in the meeting leg');
assert.equal(meetingRollup.storyPoint.total, 2);

// missing appendix → missingMetricData true, appendixLevel null
const missing = buildDescendant(issue({ customfield_11543: [] as never, customfield_10005: 1 }), WEIGHTS, ROSTER);
assert.equal(missing.missingMetricData, true);
assert.equal(missing.appendixLevel, null);
assert.equal(missing.weightPoint, 0);

// ── rollupMetrics ─────────────────────────────────────────────────────────────
const metrics = rollupMetrics([high, nonRoster, unassigned, meeting, missing]);
assert.equal(metrics.weightPoint.total, 24, '8*3 (high+nonRoster+unassigned) = 24');
assert.equal(metrics.completionByCount.total, 5);
assert.equal(metrics.statusCounts.toDo, 5);
assert.equal(metrics.coverage.withMetricData, 4, 'only "missing" lacks metric data');
assert.equal(metrics.coverage.total, 5);
assert.equal(metrics.missingMetricCount, 1);
assert.deepEqual(metrics.missingMetricData, [missing.key]);
// roster high(5) + roster missing(1) both surface raw SP (independent of appendix)
assert.equal(metrics.storyPoint.product, 6);
assert.equal(metrics.storyPoint.meeting, 2);
assert.equal(metrics.storyPoint.total, 8);
// composition: all WP is product here
assert.equal(metrics.composition.productPercent, 100);
assert.equal(metrics.composition.techDebtPercent, 0);

// empty roll-up → SP legs null, no divide-by-zero
const empty = rollupMetrics([]);
assert.equal(empty.storyPoint.total, null);
assert.equal(empty.completionByCount.percent, 0);
assert.equal(empty.composition.productPercent, 0);

// ── SP fallback: raw customfield_10005 wins; else weightPoint * (8/dailyRate) ──
// raw SP present → used as-is regardless of dailyRate
const rawWins = buildDescendant(
  issue({ customfield_11543: [{ value: 'ALL-High' }] as never, customfield_10005: 5 }),
  WEIGHTS,
  ROSTER,
  4, // dailyRate ignored when raw SP present
);
assert.equal(rawWins.storyPoint, 5, 'raw SP wins over fallback');
// raw SP absent, roster assignee → fallback WP * (8/dailyRate); High=8, dailyRate=8 → 8
const fallbackDefault = buildDescendant(
  issue({ customfield_11543: [{ value: 'ALL-High' }] as never, customfield_10005: undefined }),
  WEIGHTS,
  ROSTER,
);
assert.equal(fallbackDefault.storyPoint, 8, 'no raw SP → WP*(8/8)=8 at default rate');
// dailyRate=4 (junior-ish) → 8 * (8/4) = 16
const fallbackJunior = buildDescendant(
  issue({ customfield_11543: [{ value: 'ALL-High' }] as never, customfield_10005: undefined }),
  WEIGHTS,
  ROSTER,
  4,
);
assert.equal(fallbackJunior.storyPoint, 16, 'no raw SP → WP*(8/4)=16');
// non-roster → still null even with fallback available
const fallbackNonRoster = buildDescendant(
  issue({ assignee: { accountId: 'acc-other' } as never, customfield_11543: [{ value: 'ALL-High' }] as never }),
  WEIGHTS,
  ROSTER,
  4,
);
assert.equal(fallbackNonRoster.storyPoint, null, 'non-roster → null even with fallback');

// ── description passthrough (raw ADF/string, NOT flattened server-side) ───────
const adfDoc = { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'hi' }] }] };
assert.deepEqual(buildDescendant(issue({ description: adfDoc }), WEIGHTS, ROSTER).description, adfDoc, 'ADF passed through raw');
assert.equal(buildDescendant(issue({ description: undefined }), WEIGHTS, ROSTER).description, null, 'absent description → null');

// ── resolveSprint: active → last element → null (SLS-16893) ───────────────────
// (1) active state wins even when not last
assert.equal(
  resolveSprint([{ name: 'S1', state: 'closed' }, { name: 'S2', state: 'active' }, { name: 'S3', state: 'future' }]),
  'S2',
  'active sprint wins',
);
// (2) no active → LAST element (Jira appends chronologically), NOT [0]
assert.equal(
  resolveSprint([{ name: 'Old', state: 'closed' }, { name: 'Newer', state: 'closed' }]),
  'Newer',
  'no active → last element',
);
assert.equal(resolveSprint([{ name: 'Only', state: 'closed' }]), 'Only', 'single closed → that name');
// (3) empty / absent → null
assert.equal(resolveSprint([]), null, 'empty → null');
assert.equal(resolveSprint(undefined), null, 'absent → null');

// buildDescendant wires sprint + updatedAt passthrough
const withSprint = buildDescendant(
  issue({
    customfield_10007: [{ name: 'Past', state: 'closed' }, { name: 'Current', state: 'active' }] as never,
    updated: '2026-07-21T10:00:00.000+0700',
  }),
  WEIGHTS,
  ROSTER,
);
assert.equal(withSprint.sprint, 'Current');
assert.equal(withSprint.updatedAt, '2026-07-21T10:00:00.000+0700', 'updatedAt raw passthrough');
// no sprint field + no updated → null sprint, '' updatedAt
const bare = buildDescendant(issue({}), WEIGHTS, ROSTER);
assert.equal(bare.sprint, null);
assert.equal(bare.updatedAt, '', 'absent updated → empty string');

console.log('epic-explorer.metrics self-check: PASS');
