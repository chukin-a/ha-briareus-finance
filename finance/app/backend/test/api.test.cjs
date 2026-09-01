const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const request = require('supertest');

test('finance API keeps transfers atomic and imports idempotent', async () => {
  const db = `/private/tmp/ha-finance-api-${process.pid}.sqlite`;
  const data = `/private/tmp/ha-finance-api-data-${process.pid}`;
  process.env.DB_PATH = db;
  process.env.DATA_DIR = data;
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
    const source = (await http.post('/api/accounts').send({ name: 'Source', type: 'debit_card', currency: 'UAH', initialBalanceMinor: 10000 }).expect(201)).body;
    const target = (await http.post('/api/accounts').send({ name: 'Target', type: 'debit_card', currency: 'UAH' }).expect(201)).body;
    await http.post('/api/transfers').send({ sourceAccountId: source.id, targetAccountId: target.id, sourceAmountMinor: 2500 }).expect(201);
    const accounts = (await http.get('/api/accounts').expect(200)).body;
    assert.equal(accounts.find(a => a.id === source.id).balanceMinor, 7500);
    assert.equal(accounts.find(a => a.id === target.id).balanceMinor, 2500);
    await http.post('/api/transactions').send({ accountId: source.id, type: 'expense', amountMinor: 1200, occurredOn: '2026-08-28' }).expect(201);
    const budget = (await http.post('/api/budgets').send({ name: 'August', plannedAmountMinor: 5000, currency: 'UAH', periodStart: '2026-08-01', periodEnd: '2026-09-01' }).expect(201)).body;
    assert.equal((await http.get(`/api/budgets/${budget.id}/progress`).expect(200)).body.spentMinor, 1200);
    const payload = { accountId: source.id, currency: 'UAH', format: 'csv', content: 'date,description,amount,type,id\n2026-08-27,Lunch,10.00,expense,row-1' };
    const first = (await http.post('/api/imports/preview').set('Idempotency-Key', 'same-import').send(payload).expect(201)).body;
    await http.post(`/api/imports/${first.id}/confirm`).expect(201);
    const second = (await http.post('/api/imports/preview').set('Idempotency-Key', 'same-import').send(payload).expect(201)).body;
    assert.equal(second.id, first.id);
    assert.equal((await http.get('/api/transactions?from=2026-08-01&to=2026-09-01').expect(200)).body.total, 2);
  } finally {
    await app.close();
    fs.rmSync(db, { force: true });
    fs.rmSync(data, { recursive: true, force: true });
  }
});
