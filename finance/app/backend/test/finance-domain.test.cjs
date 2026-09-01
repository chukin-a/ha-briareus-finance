const test = require('node:test');
const assert = require('node:assert/strict');
const { FinanceService } = require('../dist/modules/finance/application/finance.service');
const { ExtendedFinanceService } = require('../dist/modules/planning/extended-finance.service');

const repo = (overrides = {}) => ({
  create: value => value,
  save: async value => value,
  find: async () => [],
  findBy: async () => [],
  findOneBy: async () => null,
  count: async () => 0,
  delete: async () => ({ affected: 1 }),
  ...overrides,
});
const owner = { id: 'owner-1', name: 'Owner', isAdmin: false };
const realtime = { publish: async () => {}, publishChanged: async () => {} };

function financeService(overrides = {}) {
  return new FinanceService(
    repo(overrides.accounts), repo(overrides.categories), repo(overrides.projects), repo(overrides.transactions),
    repo(overrides.users), repo(overrides.budgets), repo(overrides.recurring), repo(overrides.occurrences),
    repo(overrides.installmentPlans), repo(overrides.obligations), realtime,
  );
}

function extendedService(overrides = {}) {
  return new ExtendedFinanceService(
    repo(overrides.budgets), repo(overrides.budgetPeriods), repo(overrides.transactions), repo(overrides.rules),
    repo(overrides.occurrences), repo(overrides.plans), repo(overrides.obligations), repo(overrides.creditTerms),
    repo(overrides.batches), repo(overrides.rows), repo(overrides.settings), repo(overrides.outbox),
    repo(overrides.categories), repo(overrides.accounts), realtime,
  );
}

test('installment schedule includes monthly flat interest in every payment', async () => {
  const obligations = repo({ create: value => value, save: async value => value });
  const service = financeService({
    accounts: repo({ findOneBy: async () => ({ id: 'card', type: 'credit_card' }) }),
    installmentPlans: repo({ create: value => value, save: async value => value }),
    obligations,
  });
  const plan = await service.createInstallment({ accountId: 'card', name: 'Phone', totalAmountMinor: 100000, installmentCount: 2, firstDueDate: '2026-09-15', interestMode: 'flat', monthlyRateBps: 100 }, owner);
  assert.deepEqual(plan.obligations.map(row => [row.amountMinor, row.principalMinor, row.interestMinor, row.dueDate]), [
    [51000, 50000, 1000, '2026-09-15'],
    [51000, 50000, 1000, '2026-10-15'],
  ]);
});

test('declining installment interest is calculated from remaining principal', async () => {
  const service = financeService({
    accounts: repo({ findOneBy: async () => ({ id: 'card', type: 'credit_card' }) }),
    installmentPlans: repo({ create: value => value, save: async value => value }),
    obligations: repo({ create: value => value, save: async value => value }),
  });
  const plan = await service.createInstallment({ accountId: 'card', name: 'Laptop', totalAmountMinor: 100000, installmentCount: 2, firstDueDate: '2026-09-30', interestMode: 'declining', monthlyRateBps: 100 }, owner);
  assert.deepEqual(plan.obligations.map(row => row.interestMinor), [1000, 500]);
  assert.equal(plan.obligations[1].dueDate, '2026-10-30');
});

test('regular occurrence without a default account requires an account at payment time and preserves category', async () => {
  const transactions = [];
  const occurrence = { id: 'occ-1', ruleId: 'rule-1', dueDate: '2026-09-15', status: 'pending', amountMinor: 10000, description: null };
  const service = extendedService({
    occurrences: repo({ findOneBy: async () => occurrence, save: async value => value }),
    rules: repo({ findOneBy: async () => ({ id: 'rule-1', accountId: null, type: 'expense', amountMinor: 10000, currency: 'UAH', categoryId: 'cat-1', projectId: 'project-1', description: 'Rent' }) }),
    accounts: repo({ findOneBy: async ({ id }) => id === 'card' ? { id, archived: false } : null }),
    transactions: repo({ save: async value => { transactions.push(value); return value; } }),
    outbox: repo({ save: async value => value }),
  });
  await assert.rejects(() => service.confirmOccurrence('occ-1', owner), /Choose an account/);
  await service.confirmOccurrenceWithAmount('occ-1', owner, 'card', 12500);
  assert.equal(transactions[0].accountId, 'card');
  assert.equal(transactions[0].amountMinor, 12500);
  assert.equal(transactions[0].categoryId, 'cat-1');
});

test('budget progress includes descendants of selected parent category but excludes other branches', async () => {
  const budget = { id: 'budget-1', ownerId: owner.id, categoryId: 'food', projectId: null, currency: 'UAH', periodStart: '2026-09-01', periodEnd: '2026-10-01', plannedAmountMinor: 100000 };
  const service = extendedService({
    budgets: repo({ findOneBy: async () => budget }),
    categories: repo({ find: async () => [
      { id: 'food', parentId: null }, { id: 'groceries', parentId: 'food' }, { id: 'other', parentId: null },
    ] }),
    transactions: repo({ find: async () => [
      { type: 'expense', currency: 'UAH', categoryId: 'groceries', projectId: null, occurredOn: '2026-09-05', amountMinor: 2500 },
      { type: 'expense', currency: 'UAH', categoryId: 'other', projectId: null, occurredOn: '2026-09-05', amountMinor: 9000 },
      { type: 'expense', currency: 'UAH', categoryId: 'food', projectId: null, occurredOn: '2026-10-01', amountMinor: 1000 },
    ] }),
  });
  assert.equal((await service.budgetProgress('budget-1')).spentMinor, 2500);
});

test('non-owner cannot update a transaction', async () => {
  const service = financeService({ transactions: repo({ findOneBy: async () => ({ id: 'tx-1', ownerId: 'another' }) }) });
  await assert.rejects(() => service.updateTransaction('tx-1', { description: 'Nope' }, owner), /Only the transaction owner/);
});
