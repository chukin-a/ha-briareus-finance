const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const request = require('supertest');

test('user access and ownership rules protect finance data', async () => {
  const db = `/private/tmp/ha-finance-security-${process.pid}.sqlite`;
  process.env.DB_PATH = db;
  const { NestFactory } = require('@nestjs/core');
  const { ValidationPipe } = require('@nestjs/common');
  const { AppModule } = require('../dist/app.module');
  const app = await NestFactory.create(AppModule, { logger: false });
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  await app.init();
  const http = request(app.getHttpAdapter().getInstance());
  const first = { 'x-remote-user-id': 'user-1', 'x-remote-user-display-name': 'First' };
  const second = { 'x-remote-user-id': 'user-2', 'x-remote-user-display-name': 'Second' };
  try {
    const account = (await http.post('/api/accounts').set(first).send({ name: 'First account', type: 'debit_card', currency: 'UAH' }).expect(201)).body;
    const users = (await http.get('/api/users').set(first).expect(200)).body;
    const secondUser = users.find(user => user.id === 'user-2') || (await http.get('/api/me').set(second).expect(200)).body;
    assert.equal(secondUser.id, 'user-2');
    await http.patch('/api/users/user-2/access').set(first).send({ blocked: true }).expect(200);
    await http.get('/api/me').set(second).expect(403);
    await http.patch(`/api/accounts/${account.id}`).set(second).send({ name: 'Hijack' }).expect(403);
  } finally {
    await app.close();
    fs.rmSync(db, { force: true });
  }
});
