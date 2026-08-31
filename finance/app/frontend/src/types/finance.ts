export type AccountType = 'debit_card' | 'credit_card' | 'cash' | 'bank_account';
export type TransactionType = 'income' | 'expense' | 'transfer';

export interface Account {
  id: string; ownerId: string; name: string; type: AccountType; currency: string;
  balanceMinor: number; creditLimitMinor: number | null;
  initialBalanceMinor?:number; archived?:boolean;
  gracePeriodRule: 'next_month_end' | 'next_month_day' | null; gracePeriodDay: number | null;
}

export interface Transaction {
  id: string; accountId: string; relatedAccountId: string | null; type: TransactionType;
  amountMinor: number; currency: string; description: string | null; occurredAt: string; categoryId: string | null; projectId?: string | null; receiptId?: string | null; tags?: string[]; metadata?: Record<string, unknown>; metadataJson?: string | null; tagsJson?: string | null;
}

export interface Category { id: string; name: string; type: 'income' | 'expense'; parentId: string | null; icon: string; color: string; sortOrder: number; archived?: boolean; }
export interface Project { id: string; name: string; plannedAmountMinor: number; currency: string; spentMinor?:number; remainingMinor?:number; percentage?:number; status?: 'active' | 'completed' | 'archived'; endOn?: string | null; }

export interface User { id: string; name: string; createdAt?: string; lastSeenAt?: string | null; blocked?: boolean; current?: boolean; }
export interface Budget { id: string; name: string; categoryId: string | null; projectId: string | null; periodStart: string; periodEnd: string; plannedAmountMinor: number; currency: string; active?: boolean; cadence: 'monthly' | 'quarterly' | 'custom'; rolloverEnabled: boolean; warningPercent: number; }
export interface BudgetProgress extends Budget { spentMinor: number; remainingMinor: number; percentage: number; exceeded: boolean; }
export interface RecurringRule { id:string; accountId:string|null; type:'income'|'expense'; amountMinor:number; currency:string; frequency:string; dayOfMonth?:number|null; startDate:string; endDate?:string|null; categoryId?:string|null; projectId?:string|null; description:string|null; active:boolean; }
export interface RecurringOccurrence { id:string; ruleId:string; dueDate:string; status:string; amountMinor:number|null; description:string|null; }
export interface InstallmentObligation { id:string; sequenceNumber:number; dueDate:string; amountMinor:number; principalMinor:number; interestMinor:number; status:string; }
export interface InstallmentPlan { id:string; accountId:string; name:string; totalAmountMinor:number; installmentCount:number; firstDueDate:string; feeMinor?:number; frequency?:string; currency:string; status:string; interestMode:'none'|'flat'|'declining'; monthlyRateBps:number; obligations:InstallmentObligation[]; }
export interface ReceiptDraft { id:string; status:string; fileName:string; merchant:string|null; occurredOn:string|null; amountMinor:number|null; currency:string|null; accountId:string|null; categoryId?:string|null; projectId?:string|null; description?:string|null; transactionId?:string|null; }
export interface CreditTerms { accountId:string; statementDay:number; paymentDay:number|null; graceRule:'next_month_end'|'next_month_day'|'fixed_days'; fixedDays:number|null; warningDays:number; }
export interface CreditSummary { accountId:string; debtMinor:number; deadlineOn:string; risk:'normal'|'approaching'|'due'|'overdue'; }
export interface PaymentItem { id:string; sourceId:string; kind:'recurring'|'installment'|'credit_card'; status:string; dueDate:string; title:string; accountId:string|null; accountName:string; amountMinor:number; currency:string; action:'confirm_or_skip'|'pay'|'manual'; }
export interface PaymentsReport { period:{from:string;to:string}; items:PaymentItem[]; totals:{currency:string;amountMinor:number}[]; }
export interface ImportRow { id:string; rowNumber:number; occurredOn:string|null; amountMinor:number|null; type:string|null; description:string|null; status:'new'|'duplicate'|'invalid'|'imported'; error:string|null; }
export interface ImportReport { id:string; accountId:string; format:'csv'|'ofx'; currency:string; status:'preview'|'imported'|'cancelled'; rows:ImportRow[]; }
export interface AppSettings { currency?:string; timezone?:string; sensorsEnabled?:boolean; warningDays?:number; }
export interface RuntimeConfig { currency:string; timezone:string; taxApiEnabled:boolean; }
