import { CalendarRange, ChevronDown } from 'lucide-react';

export type PeriodPreset = 'today' | 'current_week' | 'current_month' | 'previous_month' | 'next_month' | 'current_quarter' | 'current_year' | 'custom';
export interface CustomRange { from: string; to: string }

const labels: Record<PeriodPreset, string> = {
  today: 'Сьогодні',
  current_week: 'Поточний тиждень',
  current_month: 'Поточний місяць',
  previous_month: 'Минулий місяць',
  next_month: 'Наступний місяць',
  current_quarter: 'Поточний квартал',
  current_year: 'Поточний рік',
  custom: 'Свій період',
};

export function PeriodPicker({ value, range, onChange, onRangeChange }: {
  value: PeriodPreset;
  range?: CustomRange;
  onChange: (value: PeriodPreset) => void;
  onRangeChange?: (range: CustomRange) => void;
}) {
  return <div className="period-picker">
    <label className="period-field">
      <CalendarRange aria-hidden="true" />
      <span>Період</span>
      <span className="period-value">{labels[value]}</span>
      <select aria-label="Період" value={value} onChange={event => onChange(event.target.value as PeriodPreset)}>
        {Object.entries(labels).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
      </select>
      <ChevronDown className="period-chevron" aria-hidden="true" />
    </label>
    {value === 'custom' && range && <div className="custom-range">
      <input aria-label="Початок періоду" type="date" value={range.from} onChange={event => onRangeChange?.({ ...range, from: event.target.value })} />
      <span aria-hidden="true">—</span>
      <input aria-label="Кінець періоду" type="date" value={range.to} onChange={event => onRangeChange?.({ ...range, to: event.target.value })} />
    </div>}
  </div>;
}
