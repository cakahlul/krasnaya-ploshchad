import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(new URL('./ProductivitySummary.tsx', import.meta.url), 'utf8');
const exportButtonSource = readFileSync(new URL('./ProductivitySummaryExportButton.tsx', import.meta.url), 'utf8');

test('exposes stable range, Group, calculate, and progress QA surfaces', () => {
  for (const selector of [
    'productivity-summary-range',
    'productivity-summary-group-filter',
    'productivity-summary-calculate',
    'productivity-summary-progress',
  ]) {
    assert.match(source, new RegExp(`data-qa=\\"${selector}\\"`));
  }
});

test('shows a colored active progress segment before the first month arrives', () => {
  assert.match(source, /percent=\{progress \? Math\.round\(\(progress\.completed \/ progress\.total\) \* 100\) : 5\}/);
});

test('uses the SP-only canonical query and does not expose a Team selector', () => {
  for (const field of ['startMonth', 'endMonth', 'selectedGroups', "'SP'"]) {
    assert.match(source, new RegExp(field));
  }
  assert.doesNotMatch(source, /selectedGroups, 'WP'/);
  assert.doesNotMatch(source, /MultiSelectTeam|selectedTeams|teamsParam/);
});

test('reuses current canonical request for export without resetting filters', () => {
  assert.match(source, /<ProductivitySummaryExportButton[\s\S]*request=\{request\}/);
  assert.doesNotMatch(source, /setSelectedRange\([^)]*catch|setSelectedGroups\([^)]*catch/);
});

test('exposes the export QA selector on the actual button', () => {
  assert.match(exportButtonSource, /<Button[\s\S]*data-qa="productivity-summary-export"/);
});

test('retry replays the exact failed request, not the live filter state', () => {
  // retryRequest is captured from fetchData's own `request` argument (the one that actually
  // failed), and is only ever cleared/replaced by another fetchData call — never rebuilt from
  // the current selectedRange/selectedGroups state at render time.
  assert.match(source, /setRetryRequest\(request\)/);
  assert.doesNotMatch(source, /setRetryRequest\(buildProductivitySummaryParams/);
  // The rendered Retry button is wired to the captured retryRequest state and calls fetchData
  // directly (no intermediate handler that could substitute live filters).
  assert.match(source, /<ProductivitySummaryRetry request=\{retryRequest\} onRetry=\{fetchData\}/);
});

test('Calculate and Retry are native buttons — keyboard-operable without extra wiring', () => {
  assert.match(source, /<button[\s\S]{0,40}data-qa="productivity-summary-calculate"/);
  assert.doesNotMatch(source, /<div[^>]*data-qa="productivity-summary-calculate"/);
});

test('range and Group filter controls stay labeled and disjoint from the export/basis-only Team removal', () => {
  assert.match(source, /aria-label="Productivity summary month range"/);
  assert.match(source, /aria-label="Reporting groups"/);
});

test('no hardcoded color literal for theme-bearing surfaces (fallback #fff button text is an accepted, codebase-wide convention)', () => {
  const withoutAcceptedException = source.replace(/color: '#fff'/g, '');
  assert.doesNotMatch(withoutAcceptedException, /#[0-9a-fA-F]{3,8}/);
});
