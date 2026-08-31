import type { AccountType, GracePeriodRule } from '../domain/account';

export interface CreateAccountCommand {
  name: string;
  type: AccountType;
  currency?: string;
  creditLimitMinor?: number;
  gracePeriodRule?: GracePeriodRule;
  gracePeriodDay?: number;
}
