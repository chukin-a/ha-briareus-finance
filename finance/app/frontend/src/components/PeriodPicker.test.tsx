import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PeriodPicker } from './PeriodPicker';

describe('PeriodPicker', () => {
  it('renders next month and reports a selected period', () => {
    const onChange = vi.fn();
    render(<PeriodPicker value="current_month" onChange={onChange} />);
    expect(screen.getByRole('option', { name: 'Поточний місяць' })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Період'), { target: { value: 'next_month' } });
    expect(onChange).toHaveBeenCalledWith('next_month');
  });

  it('shows and updates custom date range', () => {
    const onRangeChange = vi.fn();
    render(<PeriodPicker value="custom" range={{ from: '2026-09-01', to: '2026-10-01' }} onChange={() => {}} onRangeChange={onRangeChange} />);
    fireEvent.change(screen.getByLabelText('Початок періоду'), { target: { value: '2026-09-02' } });
    expect(onRangeChange).toHaveBeenCalledWith({ from: '2026-09-02', to: '2026-10-01' });
  });
});
