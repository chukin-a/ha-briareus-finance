import { BadRequestException } from '@nestjs/common';

export type PeriodPreset = 'today' | 'current_week' | 'current_month' | 'previous_month' | 'next_month' | 'current_quarter' | 'current_year' | 'custom';
export interface DatePeriod { from: string; to: string }

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
export function assertLocalDate(value: string, field: string) {
  if (!DATE_PATTERN.test(value) || Number.isNaN(Date.parse(`${value}T00:00:00Z`))) throw new BadRequestException(`${field} must be YYYY-MM-DD`);
  return value;
}
export function localDateFromIso(iso: string, timezone = process.env.TZ || 'Europe/Kyiv') {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) throw new BadRequestException('occurredAt must be a valid ISO timestamp');
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
  const pick = (type: string) => parts.find(part => part.type === type)?.value;
  return `${pick('year')}-${pick('month')}-${pick('day')}`;
}
export function resolvePeriod(input: { preset?: PeriodPreset; from?: string; to?: string }, now = new Date(), timezone = process.env.TZ || 'Europe/Kyiv'): DatePeriod {
  if (input.from || input.to) {
    if (input.preset || !input.from || !input.to) throw new BadRequestException('Use either preset or both from and to');
    const from = assertLocalDate(input.from, 'from'); const to = assertLocalDate(input.to, 'to');
    if (from >= to) throw new BadRequestException('from must be before to'); return { from, to };
  }
  const preset = input.preset || 'current_month';
  if (preset === 'custom') throw new BadRequestException('custom period requires from and to');
  const current = localDateFromIso(now.toISOString(), timezone); const [year, month, day] = current.split('-').map(Number);
  const utc = new Date(Date.UTC(year, month - 1, day)); const date = (d: Date) => d.toISOString().slice(0, 10); const addDays = (d: Date, days: number) => new Date(d.getTime() + days * 86400000);
  if (preset === 'today') return { from: current, to: date(addDays(utc, 1)) };
  if (preset === 'current_week') { const offset = (utc.getUTCDay() + 6) % 7; const start = addDays(utc, -offset); return { from: date(start), to: date(addDays(start, 7)) }; }
  if (preset === 'current_month') return { from: date(new Date(Date.UTC(year, month - 1, 1))), to: date(new Date(Date.UTC(year, month, 1))) };
  if (preset === 'previous_month') return { from: date(new Date(Date.UTC(year, month - 2, 1))), to: date(new Date(Date.UTC(year, month - 1, 1))) };
  if (preset === 'next_month') return { from: date(new Date(Date.UTC(year, month, 1))), to: date(new Date(Date.UTC(year, month + 1, 1))) };
  if (preset === 'current_quarter') { const startMonth = Math.floor((month - 1) / 3) * 3; return { from: date(new Date(Date.UTC(year, startMonth, 1))), to: date(new Date(Date.UTC(year, startMonth + 3, 1))) }; }
  return { from: `${year}-01-01`, to: `${year + 1}-01-01` };
}
