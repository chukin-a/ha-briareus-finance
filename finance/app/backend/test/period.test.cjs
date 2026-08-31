const test = require('node:test');
const assert = require('node:assert/strict');
const { resolvePeriod, localDateFromIso } = require('../dist/shared/domain/period');

test('uses half-open current month boundaries', () => {
  assert.deepEqual(resolvePeriod({ preset: 'current_month' }, new Date('2026-08-28T12:00:00Z'), 'Europe/Kyiv'), { from: '2026-08-01', to: '2026-09-01' });
});
test('resolves previous month across year boundary', () => {
  assert.deepEqual(resolvePeriod({ preset: 'previous_month' }, new Date('2026-01-15T12:00:00Z'), 'Europe/Kyiv'), { from: '2025-12-01', to: '2026-01-01' });
});
test('starts a week on Monday', () => {
  assert.deepEqual(resolvePeriod({ preset: 'current_week' }, new Date('2026-08-30T12:00:00Z'), 'Europe/Kyiv'), { from: '2026-08-24', to: '2026-08-31' });
});
test('derives local financial date without browser timezone', () => {
  assert.equal(localDateFromIso('2026-08-28T22:30:00Z', 'Europe/Kyiv'), '2026-08-29');
});
test('rejects incomplete custom range', () => {
  assert.throws(() => resolvePeriod({ from: '2026-08-01' }), /both from and to/);
});
