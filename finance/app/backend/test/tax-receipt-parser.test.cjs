const test = require('node:test');
const assert = require('node:assert/strict');
const { parseTaxReceiptXml } = require('../dist/modules/transactions/application/tax-receipt-parser');

test('parses DPS receipt XML items and totals', () => {
  const result = parseTaxReceiptXml(`
    <CHECK>
      <CHECKHEAD><SELLERNAME>ТОВ Магазин</SELLERNAME><CHECKDATE>2026-08-31</CHECKDATE></CHECKHEAD>
      <CHECKBODY>
        <ROW><NAME>Молоко</NAME><QUANTITY>2</QUANTITY><PRICE>25.50</PRICE><SUM>51.00</SUM><VAT>8.50</VAT></ROW>
        <ROW><NAME>Хліб</NAME><QUANTITY>1</QUANTITY><PRICE>30.00</PRICE><SUM>30.00</SUM></ROW>
        <TOTAL>81.00</TOTAL>
      </CHECKBODY>
    </CHECK>`);
  assert.equal(result.merchant, 'ТОВ Магазин');
  assert.equal(result.occurredOn, '2026-08-31');
  assert.equal(result.amountMinor, 8100);
  assert.deepEqual(result.items, [
    { name: 'Молоко', quantity: 2, priceMinor: 2550, amountMinor: 5100, vatMinor: 850 },
    { name: 'Хліб', quantity: 1, priceMinor: 3000, amountMinor: 3000, vatMinor: null },
  ]);
});

test('parses namespaced and base64 encoded DPS XML', () => {
  const xml = '<r:CHECK><r:ROW><r:PRODUCTNAME>Кава</r:PRODUCTNAME><r:QTY>1</r:QTY><r:PRICEONE>42,50</r:PRICEONE><r:AMOUNTTOTAL>42,50</r:AMOUNTTOTAL></r:ROW></r:CHECK>';
  const result = parseTaxReceiptXml(Buffer.from(xml).toString('base64'));
  assert.deepEqual(result.items, [{ name: 'Кава', quantity: 1, priceMinor: 4250, amountMinor: 4250, vatMinor: null }]);
  assert.equal(result.amountMinor, 4250);
});
