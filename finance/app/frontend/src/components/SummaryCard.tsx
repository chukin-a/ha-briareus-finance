import { CircleAlert, Pencil } from 'lucide-react';
import { money } from '../lib/money';

export function SummaryCard({ income, expenses, periodBalance, balance, creditDebt, availableCredit }: { income: number; expenses: number; periodBalance: number; balance: number; creditDebt: number; availableCredit: number }) {
  return <section className="summary-card">
    <div><span><CircleAlert /> Прибутки</span><strong className="accent">{money(income)}</strong></div>
    <div><span><CircleAlert /> Витрати</span><strong>{money(expenses)}</strong></div>
    <div><span><CircleAlert /> Баланс за період</span><strong className="accent">{periodBalance >= 0 ? '+' : '−'} {money(Math.abs(periodBalance))}</strong></div>
    <div><span><Pencil /> Баланс зараз</span><strong>{balance < 0 ? '− ' : ''}{money(Math.abs(balance))}</strong></div>
    <div><span><CircleAlert /> Борг за кредитами</span><strong>{money(creditDebt)}</strong></div>
    <div><span><CircleAlert /> Вільний кредитний ліміт</span><strong>{money(availableCredit)}</strong></div>
  </section>;
}
