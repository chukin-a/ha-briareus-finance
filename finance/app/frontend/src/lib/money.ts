export function money(amountMinor: number, currency = 'UAH') {
  return `${(amountMinor / 100).toLocaleString('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₴`;
}

export function shortDate(date: string) {
  return new Intl.DateTimeFormat('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(date));
}
