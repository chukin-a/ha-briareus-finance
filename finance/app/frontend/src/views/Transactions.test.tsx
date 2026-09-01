import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Transactions } from './Transactions';

vi.mock('../api/client', () => ({ financeApi: { updateTransaction: vi.fn(), deleteTransaction: vi.fn(), createTransaction: vi.fn(), createTransfer: vi.fn(), lookupTaxReceipt: vi.fn() } }));
vi.mock('../components/QrScanner', () => ({ QrScanner: () => <div /> }));

const account = { id: 'card', ownerId: 'owner', name: 'Картка', type: 'debit_card' as const, currency: 'UAH', balanceMinor: 0, creditLimitMinor: null, gracePeriodRule: null, gracePeriodDay: null };

describe('Transactions details', () => {
  it('shows receipt positions and hides DPS refresh when the flag is disabled', () => {
    render(<Transactions transactions={[{
      id: 'tx-1', accountId: 'card', relatedAccountId: null, type: 'expense', amountMinor: 12300, currency: 'UAH', description: 'Магазин', occurredAt: '2026-08-31T12:00:00.000Z', categoryId: null,
      metadata: { qr: { id: 'receipt-1', url: 'https://tax.example/check' }, taxRegister: { items: [{ name: 'Хліб', quantity: 2, priceMinor: 3000, amountMinor: 6000, vatMinor: 1000 }] } },
    }]} accounts={[account]} categories={[]} projects={[]} period="current_month" range={{ from: '2026-09-01', to: '2026-10-01' }} taxApiEnabled={false} onPeriodChange={vi.fn()} onRangeChange={vi.fn()} onChanged={vi.fn()} />);
    fireEvent.click(screen.getByText('Магазин'));
    expect(screen.getByText('Позиції чека')).toBeInTheDocument();
    expect(screen.getByText('Хліб · 2 шт.')).toBeInTheDocument();
    expect(screen.getByText('Ціна: 30,00 ₴ · ПДВ: 10,00 ₴')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Оновити дані чека' })).not.toBeInTheDocument();
  });
});
