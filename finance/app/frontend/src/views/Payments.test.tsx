import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Payments } from './Payments';
import { financeApi } from '../api/client';

vi.mock('../api/client', () => ({
  financeApi: {
    getPayments: vi.fn(),
    confirmOccurrence: vi.fn(),
    skipOccurrence: vi.fn(),
  },
}));

const account = { id: 'card', ownerId: 'owner', name: 'Картка', type: 'debit_card' as const, currency: 'UAH', balanceMinor: 0, creditLimitMinor: null, gracePeriodRule: null, gracePeriodDay: null };
const props = { accounts: [account], period: 'current_month' as const, range: { from: '2026-09-01', to: '2026-10-01' }, onPeriodChange: vi.fn(), onRangeChange: vi.fn(), onChanged: vi.fn() };

describe('Payments', () => {
  it('allows choosing the account and correcting a recurring payment amount', async () => {
    vi.mocked(financeApi.getPayments).mockResolvedValue({ period: { from: '2026-09-01', to: '2026-10-01' }, items: [{ id: 'payment-1', sourceId: 'occ-1', kind: 'recurring', status: 'pending', dueDate: '2026-09-15', title: 'Оренда', accountId: null, accountName: 'Рахунок', amountMinor: 7000, currency: 'UAH', action: 'confirm_or_skip' }], totals: [{ currency: 'UAH', amountMinor: 7000 }] });
    vi.mocked(financeApi.confirmOccurrence).mockResolvedValue({} as never);
    render(<Payments {...props} />);
    await screen.findByText('Оренда');
    fireEvent.click(screen.getByRole('button', { name: /Підтвердити/ }));
    fireEvent.change(screen.getByLabelText('Сума'), { target: { value: '65,00' } });
    fireEvent.click(screen.getByRole('button', { name: 'Підтвердити платіж' }));
    await waitFor(() => expect(financeApi.confirmOccurrence).toHaveBeenCalledWith('occ-1', 'card', 6500));
  });
});
