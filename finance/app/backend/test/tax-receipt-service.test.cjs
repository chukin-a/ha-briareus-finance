const test = require('node:test');
const assert = require('node:assert/strict');
const { TaxReceiptService } = require('../dist/modules/transactions/application/tax-receipt.service');

test('does not call DPS when the add-on flag is disabled', async () => {
  const originalFetch = global.fetch;
  let calls = 0;
  global.fetch = async () => { calls += 1; throw new Error('fetch must not be called'); };
  process.env.TAX_API_ENABLED = 'false';
  try { await assert.rejects(() => new TaxReceiptService().lookup({ id: 'receipt' }), /вимкнені/); assert.equal(calls, 0); }
  finally { global.fetch = originalFetch; }
});

test('rejects DPS lookup without a configured token', async () => {
  process.env.TAX_API_ENABLED = 'true';
  delete process.env.TAX_API_TOKEN;
  await assert.rejects(() => new TaxReceiptService().lookup({ id: 'receipt' }), /TAX_API_TOKEN is not configured/);
});

test('maps a successful DPS XML response without storing the raw XML', async () => {
  const originalFetch = global.fetch;
  global.fetch = async () => new Response(JSON.stringify({ check: '<CHECK><SELLERNAME>Магазин</SELLERNAME><ROW><NAME>Хліб</NAME><PRICE>20.00</PRICE><SUM>20.00</SUM></ROW><TOTAL>20.00</TOTAL></CHECK>' }), { status: 200 });
  process.env.TAX_API_ENABLED = 'true';
  process.env.TAX_API_TOKEN = ' test-token ';
  try {
    const result = await new TaxReceiptService().lookup({ id: 'receipt' });
    assert.equal(result.merchant, 'Магазин');
    assert.equal(result.amountMinor, 2000);
    assert.equal(result.items[0].name, 'Хліб');
    assert.equal(result.metadata.source, 'tax_register');
    assert.equal(Object.hasOwn(result.metadata, 'taxResponse'), false);
  } finally { global.fetch = originalFetch; }
});
