const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const request = require('supertest');

test('creates, updates, filters, and deletes categorized transactions', async () => {
  const db = `/private/tmp/ha-finance-transactions-${process.pid}.sqlite`;
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
    const account = (await http.post('/api/accounts').send({ name: 'Основний', type: 'debit_card', currency: 'UAH' }).expect(201)).body;
    const parent = (await http.post('/api/categories').send({ name: 'Продукти', type: 'expense' }).expect(201)).body;
    const child = (await http.post('/api/categories').send({ name: 'Молочне', type: 'expense', parentId: parent.id }).expect(201)).body;
    const project = (await http.post('/api/projects').send({ name: 'Ремонт', plannedAmountMinor: 100000 }).expect(201)).body;
    const created = (await http.post('/api/transactions').send({ accountId: account.id, type: 'expense', amountMinor: 2500, occurredOn: '2026-08-31', categoryId: child.id, projectId: project.id, tags: ['чек'], metadata: { source: 'test' } }).expect(201)).body;
    assert.equal(created.categoryId, child.id);
    assert.deepEqual(JSON.parse(created.tagsJson), ['чек']);
    assert.deepEqual(JSON.parse(created.metadataJson), { source: 'test' });
    const updated = (await http.patch(`/api/transactions/${created.id}`).send({ amountMinor: 3000, description: 'Оновлено', tags: ['оновлено'] }).expect(200)).body;
    assert.equal(updated.amountMinor, 3000);
    assert.equal(updated.description, 'Оновлено');
    const listed = (await http.get('/api/transactions?from=2026-08-01&to=2026-09-01').expect(200)).body;
    assert.equal(listed.total, 1);
    assert.equal(listed.items[0].amountMinor, 3000);
    const deleted = (await http.delete(`/api/transactions/${created.id}`).expect(200)).body;
    assert.equal(deleted.deleted, true);
    assert.equal((await http.get('/api/transactions?from=2026-08-01&to=2026-09-01').expect(200)).body.total, 0);
  } finally {
    await app.close();
    fs.rmSync(db, { force: true });
  }
});
