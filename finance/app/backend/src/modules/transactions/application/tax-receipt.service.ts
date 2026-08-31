import { BadRequestException, Injectable } from '@nestjs/common';
import { parseTaxReceiptXml } from './tax-receipt-parser';

const currency = () => (process.env.CURRENCY || 'UAH').toUpperCase();

@Injectable()
export class TaxReceiptService {
  async lookup(input: Record<string, unknown>) {
    const id = typeof input.id === 'string' ? input.id.trim() : '';
    const token = process.env.TAX_API_TOKEN;
    if (!id) throw new BadRequestException('Receipt id is required');
    if (!token) throw new BadRequestException('TAX_API_TOKEN is not configured');

    const params = new URLSearchParams({ id, type: '1', token });
    const response = await fetch(`https://cabinet.tax.gov.ua/ws/api_public/rro/chkAll?${params}`);
    if (!response.ok) {
      const body = await response.text().catch(() => '');
      let message = '';
      try { message = String((JSON.parse(body) as { resultText?: unknown }).resultText || ''); } catch { /* response was not JSON */ }
      throw new BadRequestException(message || `ДПС не повернула фіскальний чек (HTTP ${response.status})`);
    }

    const payload = await response.json() as Record<string, unknown>;
    if (payload.resultCode && payload.resultCode !== '0' && payload.resultCode !== 0) {
      throw new BadRequestException(String(payload.resultText || 'ДПС не повернула фіскальний чек'));
    }
    const parsed = parseTaxReceiptXml(typeof payload.check === 'string' ? payload.check : '');
    return {
      id,
      merchant: parsed.merchant,
      occurredOn: parsed.occurredOn,
      amountMinor: parsed.amountMinor,
      currency: currency(),
      description: parsed.merchant,
      tags: ['чек', 'фіскальний'],
      items: parsed.items,
      metadata: {
        source: 'tax_register',
        qr: { id, url: input.url || null },
        items: parsed.items,
      },
    };
  }
}
