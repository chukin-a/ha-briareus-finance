export function money(amountMinor: number, currency = 'UAH') {
  return `${(amountMinor / 100).toLocaleString('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₴`;
}

export function parseMinor(value: string, allowNegative = false) {
  const normalized = value.trim().replace(/[\s\u00A0\u202F]/g, '').replace(',', '.');
  const match = /^(-?)(\d+)(?:\.(\d{0,2}))?$/.exec(normalized);
  if (!match || (match[1] === '-' && !allowNegative)) return Number.NaN;

  const minor = Number(match[2]) * 100 + Number((match[3] || '').padEnd(2, '0'));
  if (!Number.isSafeInteger(minor)) return Number.NaN;
  return match[1] === '-' ? -minor : minor;
}

export function shortDate(date: string) {
  return new Intl.DateTimeFormat('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(date));
}
