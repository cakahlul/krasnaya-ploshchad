import assert from 'node:assert/strict';
import test from 'node:test';
import { handleProductivitySummaryGet } from './productivity-summary-http';
import type { RangeAggregationPorts } from './productivity-summary-range.service';

const ports: RangeAggregationPorts = {
  loadMonth: async () => ({
    source: 'live', appliedRules: [],
    members: [
      { id: 'a', name: 'A', group: 'Loan', board: 'L1', spTotal: 8, wpTotal: 5, workingDays: 1 },
      { id: 'b', name: 'B', group: 'Loan', board: 'L1', spTotal: 4, wpTotal: 3, workingDays: 1 },
    ],
  }),
  loadBugCount: async () => 2,
};

const request = (query: string) => new Request(`http://localhost/api/report/productivity-summary?${query}`);

test('keeps the legacy month/year/teams path unchanged', async () => {
  let received: unknown;
  const response = await handleProductivitySummaryGet(request('month=2&year=2026&teams=ABC%2CDEF'), { isLead: true, fullName: 'Lead' }, {
    generateLegacy: async (...args) => {
      received = args;
      return { summary: { marker: 'legacy' }, details: [] } as never;
    },
    rangePorts: ports,
  });
  assert.equal(response.status, 200);
  assert.deepEqual(received, [2, 2026, ['ABC', 'DEF']]);
  assert.deepEqual(await response.json(), { summary: { marker: 'legacy' }, details: [] });
});

test('validates canonical-only fields at the HTTP boundary', async () => {
  const deps = { generateLegacy: async () => ({}) as never, rangePorts: ports };
  const missingGroups = await handleProductivitySummaryGet(request('startMonth=2026-01&endMonth=2026-02&metricBasis=SP'), { isLead: true, fullName: 'Lead' }, deps);
  assert.equal(missingGroups.status, 200);

  const legacyTeams = await handleProductivitySummaryGet(request('startMonth=2026-01&endMonth=2026-02&groups=Loan&metricBasis=SP&teams=ABC'), { isLead: true, fullName: 'Lead' }, deps);
  assert.equal(legacyTeams.status, 400);
  assert.deepEqual(await legacyTeams.json(), { message: 'teams cannot be used with canonical range parameters' });

  const invalidGroup = await handleProductivitySummaryGet(request('startMonth=2026-01&endMonth=2026-02&groups=TeamA&metricBasis=SP'), { isLead: true, fullName: 'Lead' }, deps);
  assert.equal(invalidGroup.status, 400);
  assert.deepEqual(await invalidGroup.json(), { message: 'groups must contain only Loan, Transaction, User, or Ungrouped' });

  const invalidBasis = await handleProductivitySummaryGet(request('startMonth=2026-01&endMonth=2026-02&groups=Loan&metricBasis=Hours'), { isLead: true, fullName: 'Lead' }, deps);
  assert.equal(invalidBasis.status, 400);
  assert.deepEqual(await invalidBasis.json(), { message: 'metricBasis must be SP or WP' });
});

test('defaults omitted groups to all configured groups and metricBasis to WP', async () => {
  const calls: Array<{ groups: string[] }> = [];
  const defaultPorts: RangeAggregationPorts = {
    loadMonth: async (_month, groups) => {
      calls.push({ groups });
      return { source: 'live', appliedRules: [], members: [] };
    },
    loadBugCount: async () => 0,
  };
  const response = await handleProductivitySummaryGet(request('startMonth=2026-01&endMonth=2026-01'), { isLead: true, fullName: 'Lead' }, { generateLegacy: async () => ({}) as never, rangePorts: defaultPorts });
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.deepEqual(body.selectedGroups, ['Loan', 'Transaction', 'User', 'Ungrouped']);
  assert.equal(body.metricBasis, 'WP');
  assert.deepEqual(calls[0].groups, ['Loan', 'Transaction', 'User', 'Ungrouped']);
});

test('rejects requested WP when archive data forces SP', async () => {
  const archivePorts: RangeAggregationPorts = {
    loadMonth: async month => ({ source: month === '2025-12' ? 'archive' : 'live', appliedRules: [], members: [] }),
    loadBugCount: async () => 0,
  };
  const response = await handleProductivitySummaryGet(request('startMonth=2025-12&endMonth=2026-01&groups=Loan&metricBasis=WP'), { isLead: true, fullName: 'Lead' }, { generateLegacy: async () => ({}) as never, rangePorts: archivePorts });
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { message: 'metricBasis WP is unavailable for archive or mixed ranges' });
});

test('aggregates before member filtering and exposes chart only to leads', async () => {
  const deps = { generateLegacy: async () => ({}) as never, rangePorts: ports };
  const memberResponse = await handleProductivitySummaryGet(request('startMonth=2026-01&endMonth=2026-01&groups=Loan&metricBasis=SP'), { isLead: false, fullName: 'A' }, deps);
  const member = await memberResponse.json();
  assert.equal(member.summary.activeMembers, 2);
  assert.deepEqual(member.details.map((item: { name: string }) => item.name), ['A']);
  assert.equal('chart' in member, false);

  const leadResponse = await handleProductivitySummaryGet(request('startMonth=2026-01&endMonth=2026-01&groups=Loan&metricBasis=SP'), { isLead: true, fullName: 'Lead' }, deps);
  const lead = await leadResponse.json();
  assert.equal(lead.details.length, 2);
  assert.equal(lead.chart.length, 1);

  const unknownResponse = await handleProductivitySummaryGet(request('startMonth=2026-01&endMonth=2026-01&groups=Loan&metricBasis=SP'), undefined, deps);
  const unknown = await unknownResponse.json();
  assert.equal('chart' in unknown, false);
  assert.deepEqual(unknown.details, []);
});
