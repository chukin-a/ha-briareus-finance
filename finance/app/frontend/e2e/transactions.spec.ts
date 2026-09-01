import { expect, test } from '@playwright/test';

const account = {
  id: 'account-1', ownerId: 'owner-1', name: 'Основний', type: 'debit_card', currency: 'UAH',
  balanceMinor: 100000, creditLimitMinor: null, gracePeriodRule: null, gracePeriodDay: null,
};
const category = { id: 'food', name: 'Продукти', type: 'expense', parentId: null, icon: 'shopping', color: '#ffc35b', sortOrder: 1 };

test.beforeEach(async ({ page }) => {
  const transactions: unknown[] = [];
  await page.route('http://127.0.0.1:4173/api/**', async route => {
    const url = new URL(route.request().url());
    const path = url.pathname.replace(/^.*\/api\//, '');
    if (route.request().method() === 'POST' && path === 'transactions') {
      const created = { id: 'tx-new', accountId: account.id, type: 'expense', amountMinor: 12500, currency: 'UAH', description: 'Кава', occurredAt: '2026-09-01T12:00:00.000Z', categoryId: null, relatedAccountId: null };
      transactions.push(created);
      await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(created) });
      return;
    }
    const responses: Record<string, unknown> = {
      accounts: [account], categories: [category], projects: [],
      'config': { currency: 'UAH', timezone: 'Europe/Kyiv', taxApiEnabled: false },
      'transactions': { items: transactions }, budgets: [], 'recurring/occurrences': [], recurring: [], installments: [],
    };
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(responses[path] ?? {}) });
  });
});

test('creates a transaction from the transactions screen', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Транзакції' }).click();
  await page.getByRole('button', { name: 'Додати транзакцію' }).click();
  await page.getByLabel('Сума').fill('125,00');
  await page.getByLabel('Опис').fill('Кава');
  await page.getByRole('button', { name: 'Зберегти' }).click();
  await expect(page.getByText('Кава')).toBeVisible();
});

test('keeps the selected account in local storage for the next operation', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Транзакції' }).click();
  await page.getByRole('button', { name: 'Додати транзакцію' }).click();
  await page.getByLabel('Рахунок').selectOption('account-1');
  await page.getByLabel('Сума').fill('1,00');
  await page.getByRole('button', { name: 'Зберегти' }).click();
  await expect.poll(() => page.evaluate(() => localStorage.getItem('briareus:last-transaction-account'))).toBe('account-1');
});
