const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const request = require('supertest');

test('planning API covers budgets, recurring payments, installments, payments, and analytics', async () => {
  const db = `/private/tmp/ha-finance-planning-${process.pid}.sqlite`;
  process.env.DB_PATH = db;
  process.env.TZ = 'Europe/Kyiv';
  const { NestFactory } = require('@nestjs/core');
  const { ValidationPipe } = require('@nestjs/common');
  const { AppModule } = require('../dist/app.module');
  const app = await NestFactory.create(AppModule, { logger: false });
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  await app.init();
  const http = request(app.getHttpAdapter().getInstance());
  try {
    const card = (await http.post('/api/accounts').send({ name: 'Credit', type: 'credit_card', currency: 'UAH', creditLimitMinor: 200000 }).expect(201)).body;
    const parent = (await http.post('/api/categories').send({ name: 'Їжа', type: 'expense' }).expect(201)).body;
    const child = (await http.post('/api/categories').send({ name: 'Кафе', type: 'expense', parentId: parent.id }).expect(201)).body;
    const project = (await http.post('/api/projects').send({ name: 'Відпустка', plannedAmountMinor: 50000 }).expect(201)).body;

    const budget = (await http.post('/api/budgets').send({ name: 'Їжа вересень', categoryId: parent.id, projectId: project.id, periodStart: '2026-09-01', periodEnd: '2026-10-01', plannedAmountMinor: 30000, currency: 'UAH' }).expect(201)).body;
    await http.post('/api/transactions').send({ accountId: card.id, type: 'expense', amountMinor: 12500, categoryId: child.id, projectId: project.id, occurredOn: '2026-09-05' }).expect(201);
    const progress = (await http.get(`/api/budgets/${budget.id}/progress`).expect(200)).body;
    assert.equal(progress.spentMinor, 12500);
    assert.equal((await http.get('/api/analytics?from=2026-09-01&to=2026-10-01').expect(200)).body.expenses[0].amountMinor, 12500);

    const recurring = (await http.post('/api/recurring').send({ description: 'Без рахунку', type: 'expense', amountMinor: 7000, currency: 'UAH', frequency: 'monthly', startDate: '2026-09-15', categoryId: child.id }).expect(201)).body;
    const occurrence = (await http.get('/api/recurring/occurrences').expect(200)).body.find(item => item.ruleId === recurring.id);
    await http.post(`/api/recurring/occurrences/${occurrence.id}/confirm`).send({ accountId: card.id, amountMinor: 6500 }).expect(201);
    const recurringTransaction = (await http.get('/api/transactions?from=2026-09-01&to=2026-10-01').expect(200)).body.items.find(item => item.description === 'Без рахунку');
    assert.equal(recurringTransaction.amountMinor, 6500);
    assert.equal(recurringTransaction.categoryId, child.id);

    const installment = (await http.post('/api/installments').send({ accountId: card.id, name: 'Телефон', totalAmountMinor: 100000, installmentCount: 2, firstDueDate: '2026-09-20', interestMode: 'flat', monthlyRateBps: 100 }).expect(201)).body;
    assert.deepEqual(installment.obligations.map(item => item.amountMinor), [51000, 51000]);
    const payments = (await http.get('/api/payments?from=2026-09-01&to=2026-10-01').expect(200)).body;
    assert.equal(payments.items.some(item => item.kind === 'installment' && item.accountId === card.id), true);
    await http.patch(`/api/installments/${installment.id}`).send({ name: 'Телефон оновлено', totalAmountMinor: 120000, installmentCount: 2, firstDueDate: '2026-09-20', interestMode: 'flat', monthlyRateBps: 100, accountId: card.id }).expect(200);
    await http.delete(`/api/installments/${installment.id}`).expect(200);
  } finally {
    await app.close();
    fs.rmSync(db, { force: true });
  }
});
