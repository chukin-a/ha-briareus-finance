import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SummaryCard } from './SummaryCard';

describe('SummaryCard', () => {
  it('keeps credit debt separate from current cash balance', () => {
    render(<SummaryCard income={0} expenses={5000} periodBalance={-5000} balance={10000} creditDebt={56235} availableCredit={143764} />);
    expect(screen.getByText('100,00 ₴')).toBeInTheDocument();
    expect(screen.getByText('562,35 ₴')).toBeInTheDocument();
    expect(screen.getByText('1 437,64 ₴')).toBeInTheDocument();
  });
});
