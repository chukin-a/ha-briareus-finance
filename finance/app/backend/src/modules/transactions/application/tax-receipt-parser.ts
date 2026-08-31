export type TaxReceiptItem = { name: string; quantity: number | null; priceMinor: number | null; amountMinor: number | null; vatMinor: number | null };

const value = (xml: string, names: string[]) => {
  for (const name of names) {
    const match = xml.match(new RegExp(`<[^>]*${name}[^>]*>([\\s\\S]*?)</[^>]*${name}>`, 'i'));
    if (match?.[1]) return match[1].replace(/<!\[CDATA\[|\]\]>/g, '').replace(/<[^>]+>/g, '').trim();
  }
  return null;
};
const minor = (input: string | null) => { if (!input) return null; const normalized = input.replace(/\s/g, '').replace(',', '.').replace(/[^\d.-]/g, ''); return /^\d+(\.\d{1,2})?$/.test(normalized) ? Math.round(Number(normalized) * 100) : null; };

export function parseTaxReceiptXml(input: string): { merchant: string | null; occurredOn: string | null; amountMinor: number | null; items: TaxReceiptItem[] } {
  const xml = input.trim().startsWith('<') ? input : Buffer.from(input, 'base64').toString('utf8');
  const merchant = value(xml, ['SELLERNAME', 'SELLER', 'TRADEPOINTNAME', 'NAME']);
  const dateRaw = value(xml, ['ORDERDATE', 'CHECKDATE', 'DATE', 'DATETIME']);
  const dateMatch = dateRaw?.match(/(20\d{2})[-./]?(\d{2})[-./]?(\d{2})/);
  const occurredOn = dateMatch ? `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}` : null;
  const blocks = [...xml.matchAll(/<(?:ROW|CHECKROW|ITEM|POSITION)\b[^>]*>([\s\S]*?)<\/(?:ROW|CHECKROW|ITEM|POSITION)>/gi)].map(match => match[1]);
  const items = blocks.map(block => ({ name: value(block, ['ITEMNAME', 'PRODUCTNAME', 'DESCRIPTION', 'NAME']) || 'Позиція', quantity: Number(value(block, ['QUANTITY', 'AMOUNT', 'COUNT']) || '') || null, priceMinor: minor(value(block, ['PRICE', 'UNITPRICE'])), amountMinor: minor(value(block, ['COST', 'SUM', 'TOTAL'])), vatMinor: minor(value(block, ['VAT', 'VATAMOUNT'])) })).filter(item => item.amountMinor !== null || item.priceMinor !== null);
  const total = minor(value(xml, ['TOTAL', 'TOTALSUM', 'PAYMENTTOTAL', 'SUMTOTAL', 'CHECKTOTAL'])) || items.reduce((sum, item) => sum + (item.amountMinor || 0), 0) || null;
  return { merchant, occurredOn, amountMinor: total, items };
}
