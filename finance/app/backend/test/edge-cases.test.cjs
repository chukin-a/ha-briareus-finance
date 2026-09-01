const test = require('node:test');
const assert = require('node:assert/strict');
const { FinanceService } = require('../dist/modules/finance/application/finance.service');
const { ExtendedFinanceService } = require('../dist/modules/planning/extended-finance.service');

const repo = (overrides = {}) => ({
  create: value => value, save: async value => value, find: async () => [], findBy: async () => [],
  findOneBy: async () => null, count: async () => 0, delete: async () => ({ affected: 1 }), ...overrides,
});
const owner = { id: 'owner-1', name: 'Owner', isAdmin: false };
const realtime = { publish: async () => {}, publishChanged: async () => {} };

test('account archive and restore preserve ownership while delete rejects accounts with transactions', async () => {
  const account = { id: 'account-1', ownerId: owner.id, name: 'Card', archived: false };
  const service = new FinanceService(
    repo({ findOneBy: async () => account }), repo(), repo(), repo({ count: async () => 1 }), repo(), repo(), repo(), repo(), repo(), repo(), realtime,
  );
  await service.archiveAccount(account.id, owner);
  assert.equal(account.archived, true);
  await service.restoreAccount(account.id, owner);
  assert.equal(account.archived, false);
  await assert.rejects(() => service.deleteAccount(account.id, owner), /archive it instead/);
});

test('category deletion protects children and transactions, and self-parenting is rejected', async () => {
  const category = { id: 'parent', type: 'expense', name: 'Parent', parentId: null };
  const service = new FinanceService(
    repo(), repo({ findOneBy: async () => category, count: async () => 1 }), repo(), repo({ count: async () => 0 }), repo(), repo(), repo(), repo(), repo(), repo(), realtime,
  );
  await assert.rejects(() => service.deleteCategory('parent'), /Delete child categories first/);
  const cycleService = new FinanceService(
    repo(), repo({ findOneBy: async () => category }), repo(), repo(), repo(), repo(), repo(), repo(), repo(), repo(), realtime,
  );
  await assert.rejects(() => cycleService.updateCategory('parent', { name: 'Parent', parentId: 'parent' }), /Invalid category/);
});

test('credit terms validate the grace rule and preserve configured payment settings', async () => {
  const saved = [];
  const dependencies = Array.from({ length: 14 }, () => repo());
  dependencies[7] = repo({ save: async value => { saved.push(value); return value; } });
  const service = new ExtendedFinanceService(...dependencies, realtime);
  await assert.rejects(() => service.saveCreditTerms('card', { statementDay: 0, graceRule: 'fixed_days' }), /Invalid credit terms/);
  const terms = await service.saveCreditTerms('card', { statementDay: 15, paymentDay: 20, graceRule: 'fixed_days', fixedDays: 25, warningDays: 3 });
  assert.equal(terms.paymentDay, 20);
  assert.equal(terms.fixedDays, 25);
  assert.equal(saved.length, 1);
});

test('monthly budget rollover closes the current period and carries remaining amount when enabled', async () => {
  const budget = { id: 'budget-1', ownerId: owner.id, categoryId: null, projectId: null, currency: 'UAH', periodStart: '2026-09-01', periodEnd: '2026-10-01', plannedAmountMinor: 10000, cadence: 'monthly', rolloverEnabled: true };
  const currentPeriod = { id: 'period-1', budgetId: budget.id, startOn: budget.periodStart, status: 'open' };
  const periods = [];
  const service = new ExtendedFinanceService(
    repo({ findOneBy: async () => budget, save: async value => value }),
    repo({ findOneBy: async () => currentPeriod, save: async value => { periods.push(value); return value; } }),
    repo({ find: async () => [{ type: 'expense', currency: 'UAH', occurredOn: '2026-09-05', amountMinor: 2500 }] }),
    repo(), repo(), repo(), repo(), repo(), repo(), repo(), repo(), repo(), repo(), repo(), realtime,
  );
  const result = await service.rolloverBudget(budget.id);
  assert.equal(currentPeriod.status, 'closed');
  assert.equal(budget.periodStart, '2026-10-01');
  assert.equal(periods[1].rolloverMinor, 7500);
  assert.equal(result.periodStart, '2026-10-01');
});
