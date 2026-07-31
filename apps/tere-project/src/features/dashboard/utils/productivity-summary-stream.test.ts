import assert from 'node:assert/strict';
import test from 'node:test';
import { createNdjsonParser, type SummaryStreamEvent } from './productivity-summary-stream';

function collect(chunks: string[]) {
  const events: SummaryStreamEvent[] = [];
  const parser = createNdjsonParser(event => events.push(event));
  for (const chunk of chunks) parser.push(chunk);
  parser.flush();
  return events;
}

const point = (month: string) =>
  JSON.stringify({
    type: 'point',
    completed: 1,
    total: 2,
    point: { month, source: 'archive', metricBasis: 'SP' },
  });

test('emits one event per complete line', () => {
  const events = collect([`${point('2025-01')}\n${point('2025-02')}\n`]);
  assert.equal(events.length, 2);
  assert.deepEqual(events.map(event => (event.type === 'point' ? event.point.month : null)), ['2025-01', '2025-02']);
});

test('holds a line split across chunks until it is complete', () => {
  const line = point('2025-01');
  const events = collect([line.slice(0, 12), line.slice(12, 30), `${line.slice(30)}\n`]);
  assert.equal(events.length, 1);
  assert.equal(events[0].type === 'point' && events[0].point.month, '2025-01');
});

test('emits a trailing line that never got its newline', () => {
  const events = collect([`${point('2025-01')}\n`, point('2025-02')]);
  assert.equal(events.length, 2);
});

test('ignores blank lines instead of throwing on them', () => {
  const events = collect([`\n${point('2025-01')}\n\n`]);
  assert.equal(events.length, 1);
});

test('a chunk boundary landing exactly on the newline loses nothing', () => {
  const events = collect([point('2025-01'), '\n', point('2025-02'), '\n']);
  assert.equal(events.length, 2);
});
