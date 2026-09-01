const key = 'briareus:last-transaction-account';

export function getLastTransactionAccount(fallback = ''): string {
  try { return localStorage.getItem(key) || fallback; } catch { return fallback; }
}

export function rememberTransactionAccount(accountId: string): void {
  if (!accountId) return;
  try { localStorage.setItem(key, accountId); } catch { /* storage is optional */ }
}
