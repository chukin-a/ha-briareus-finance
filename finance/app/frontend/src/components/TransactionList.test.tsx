import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TransactionList } from './TransactionList';

const account = (id: string, name: string) => ({ id, ownerId: 'owner', name, type: 'debit_card' as const, currency: 'UAH', balanceMinor: 0, creditLimitMinor: null, gracePeriodRule: null, gracePeriodDay: null });

describe('TransactionList', () => {
  it('shows transfer source and destination without a category icon', () => {
    render(<TransactionList accounts={[account('from', 'Тестовий рахунок 1'), account('to', 'Тестовий рахунок 2')]} categories={[]} transactions={[{
      id: 'transfer', accountId: 'from', relatedAccountId: 'to', type: 'transfer', amountMinor: 10000, currency: 'UAH', description: null, occurredAt: '2026-09-01T12:00:00.000Z', categoryId: null,
    }]} />);
    expect(screen.getByText('Переказ')).toBeInTheDocument();
    expect(screen.getByText('Тестовий рахунок 1 → Тестовий рахунок 2')).toBeInTheDocument();
  });
});
