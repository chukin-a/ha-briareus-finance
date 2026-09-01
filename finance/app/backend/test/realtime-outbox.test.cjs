const test = require('node:test');
const assert = require('node:assert/strict');
const { RealtimeEventsService } = require('../dist/shared/realtime/realtime-events.service');
const { HomeAssistantService } = require('../dist/modules/home-assistant/home-assistant.service');

test('realtime stream emits connected, domain events, heartbeat, and cleans up', () => {
  const originalSetInterval = global.setInterval;
  const originalClearInterval = global.clearInterval;
  let callback;
  let cleared = false;
  global.setInterval = fn => { callback = fn; return 'heartbeat'; };
  global.clearInterval = id => { if (id === 'heartbeat') cleared = true; };
  try {
    const service = new RealtimeEventsService();
    const received = [];
    const subscription = service.stream().subscribe(event => received.push(event));
    assert.equal(received[0].type, 'connected');
    service.publishChanged('account', 'account-1');
    callback();
    assert.deepEqual(received.map(event => event.type), ['connected', 'account.changed', 'heartbeat']);
    assert.deepEqual(received[1].data, { id: 'account-1' });
    subscription.unsubscribe();
    assert.equal(cleared, true);
  } finally {
    global.setInterval = originalSetInterval;
    global.clearInterval = originalClearInterval;
  }
});

test('outbox flush marks successful delivery as sent', async () => {
  const event = { id: 'event-1', type: 'briareus_transaction_created', payload: '{"source":"test"}', status: 'pending', attempts: 0, nextAttemptAt: '2026-01-01T00:00:00.000Z' };
  const saved = [];
  const service = new HomeAssistantService({
    find: async () => [event],
    save: async value => { saved.push({ ...value }); return value; },
  }, { findBy: async () => [] }, { find: async () => [] });
  const originalFetch = global.fetch;
  const originalToken = process.env.SUPERVISOR_TOKEN;
  process.env.SUPERVISOR_TOKEN = 'test-token';
  global.fetch = async (url, options) => {
    assert.equal(url, 'http://supervisor/core/api/events/briareus_transaction_created');
    assert.equal(options.headers.Authorization, 'Bearer test-token');
    return new Response('{}', { status: 200 });
  };
  try {
    await service.flush();
    assert.equal(saved[0].status, 'sent');
    assert.equal(saved[0].attempts, 1);
  } finally {
    global.fetch = originalFetch;
    if (originalToken === undefined) delete process.env.SUPERVISOR_TOKEN;
    else process.env.SUPERVISOR_TOKEN = originalToken;
  }
});

test('outbox flush retries failed delivery and eventually marks it failed', async () => {
  const event = { id: 'event-2', type: 'test', payload: '{}', status: 'pending', attempts: 7, nextAttemptAt: '2026-01-01T00:00:00.000Z' };
  let saved;
  const service = new HomeAssistantService({ find: async () => [event], save: async value => { saved = value; return value; } }, { findBy: async () => [] }, { find: async () => [] });
  const originalFetch = global.fetch;
  const originalToken = process.env.SUPERVISOR_TOKEN;
  process.env.SUPERVISOR_TOKEN = 'test-token';
  global.fetch = async () => new Response('{}', { status: 503 });
  try {
    await service.flush();
    assert.equal(saved.status, 'failed');
    assert.equal(saved.attempts, 8);
  } finally {
    global.fetch = originalFetch;
    if (originalToken === undefined) delete process.env.SUPERVISOR_TOKEN;
    else process.env.SUPERVISOR_TOKEN = originalToken;
  }
});
