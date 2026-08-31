export type AccountType = 'debit_card' | 'credit_card';
export type GracePeriodRule = 'next_month_end' | 'next_month_day';

export interface Account {
  id: string;
  ownerId: string;
  name: string;
  type: AccountType;
  currency: string;
  creditLimitMinor: number | null;
  gracePeriodRule: GracePeriodRule | null;
  gracePeriodDay: number | null;
}
