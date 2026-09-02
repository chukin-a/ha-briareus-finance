import { useEffect, useState } from 'react';
import { ArrowRight, CalendarClock, CircleAlert, Folder, Target } from 'lucide-react';
import type { Account, BudgetProgress, Category, InstallmentPlan, RecurringOccurrence, RecurringRule, Transaction } from '../types/finance';
import type { Page } from '../components/BottomNav';
import { SummaryCard } from '../components/SummaryCard';
import { TransactionList } from '../components/TransactionList';
import { PeriodPicker, type CustomRange, type PeriodPreset } from '../components/PeriodPicker';
import { financeApi } from '../api/client';
import { money } from '../lib/money';
import { TransactionFab } from '../components/TransactionFab';
import { ProgressBar } from '../components/ProgressBar';
import { AuthorLabel } from '../components/AuthorLabel';

function selectedDateRange(period: PeriodPreset, custom: CustomRange) {
  if (period === 'custom') return custom;
  const current = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Kyiv', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  const [year, month, day] = current.split('-').map(Number);
  const utc = new Date(Date.UTC(year, month - 1, day));
  const date = (value: Date) => value.toISOString().slice(0, 10);
  const addDays = (value: Date, days: number) => new Date(value.getTime() + days * 86_400_000);
  if (period === 'today') return { from: current, to: date(addDays(utc, 1)) };
  if (period === 'current_week') { const start = addDays(utc, -((utc.getUTCDay() + 6) % 7)); return { from: date(start), to: date(addDays(start, 7)) }; }
  if (period === 'current_month') return { from: date(new Date(Date.UTC(year, month - 1, 1))), to: date(new Date(Date.UTC(year, month, 1))) };
  if (period === 'previous_month') return { from: date(new Date(Date.UTC(year, month - 2, 1))), to: date(new Date(Date.UTC(year, month - 1, 1))) };
  if (period === 'next_month') return { from: date(new Date(Date.UTC(year, month, 1))), to: date(new Date(Date.UTC(year, month + 1, 1))) };
  if (period === 'current_quarter') { const startMonth = Math.floor((month - 1) / 3) * 3; return { from: date(new Date(Date.UTC(year, startMonth, 1))), to: date(new Date(Date.UTC(year, startMonth + 3, 1))) }; }
  return { from: `${year}-01-01`, to: `${year + 1}-01-01` };
}

function creditPaymentsFor(account: Account, transactions: Transaction[]) {
  if (!account.gracePeriodRule) return [];
  const charges = new Map<string, number>();
  transactions.filter(tx => tx.accountId === account.id && tx.type === 'expense').forEach(tx => {
    const month = (tx.occurredOn || tx.occurredAt.slice(0, 10)).slice(0, 7);
    charges.set(month, (charges.get(month) || 0) + tx.amountMinor);
  });
  transactions.filter(tx => tx.accountId === account.id && tx.type === 'income').sort((a, b) => (a.occurredOn || a.occurredAt).localeCompare(b.occurredOn || b.occurredAt)).forEach(payment => {
    let remaining = payment.amountMinor;
    for (const month of [...charges.keys()].sort()) {
      const open = charges.get(month) || 0;
      const applied = Math.min(open, remaining);
      charges.set(month, open - applied);
      remaining -= applied;
      if (!remaining) break;
    }
  });
  return [...charges.entries()].filter(([, amountMinor]) => amountMinor > 0).map(([month, amountMinor]) => {
    const [year, monthNumber] = month.split('-').map(Number);
    const nextMonth = new Date(Date.UTC(year, monthNumber, 1));
    const dueDate = account.gracePeriodRule === 'next_month_end'
      ? new Date(Date.UTC(nextMonth.getUTCFullYear(), nextMonth.getUTCMonth() + 1, 0)).toISOString().slice(0, 10)
      : new Date(Date.UTC(nextMonth.getUTCFullYear(), nextMonth.getUTCMonth(), Math.min(account.gracePeriodDay || 1, new Date(Date.UTC(nextMonth.getUTCFullYear(), nextMonth.getUTCMonth() + 1, 0)).getUTCDate()))).toISOString().slice(0, 10);
    return { id: `${account.id}:${month}`, dueDate, title: account.name, amountMinor, currency: account.currency };
  });
}

export function Dashboard({ accounts, transactions, categories, projects, period, range, onPeriodChange, onRangeChange, onNavigate, onCreateTransaction, onOpenBudget, onOpenProject }: { accounts: Account[]; transactions: Transaction[]; categories: Category[]; projects: import('../types/finance').Project[]; period: PeriodPreset; range: CustomRange; onPeriodChange: (period: PeriodPreset) => void; onRangeChange: (range: CustomRange) => void; onNavigate:(page:Page)=>void; onCreateTransaction:()=>void; onOpenBudget:(id:string)=>void; onOpenProject:(id:string)=>void }) {
  const [budgets,setBudgets]=useState<BudgetProgress[]>([]),[occurrences,setOccurrences]=useState<RecurringOccurrence[]>([]),[plans,setPlans]=useState<InstallmentPlan[]>([]),[rules,setRules]=useState<RecurringRule[]>([]),[creditPayments,setCreditPayments]=useState<Awaited<ReturnType<typeof financeApi.getCreditPayments>>>([]);
  useEffect(()=>{void Promise.all([financeApi.getBudgets(period, range),financeApi.getOccurrences(),financeApi.getInstallments(),financeApi.getRecurring(),financeApi.getCreditPayments()]).then(([b,o,p,r,c])=>{setBudgets(b);setOccurrences(o);setPlans(p);setRules(r);setCreditPayments(c)}).catch(()=>undefined)},[transactions, period, range]);
  const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amountMinor, 0);
  const expenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amountMinor, 0);
  const cashBalance = accounts.filter(a=>a.currency==='UAH'&&a.type!=='credit_card').reduce((sum, account) => sum + account.balanceMinor, 0);
  const creditDebt = accounts.filter(a=>a.currency==='UAH'&&a.type==='credit_card'&&a.creditLimitMinor!==null).reduce((sum, account) => sum + Math.max(0, account.creditLimitMinor! - account.balanceMinor), 0);
  const availableCredit = accounts.filter(a=>a.currency==='UAH'&&a.type==='credit_card').reduce((sum, account) => sum + Math.max(0, account.balanceMinor), 0);
  const paymentRange = selectedDateRange(period, range);
  const upcomingPayments = [
    ...occurrences.filter(item => item.status === 'pending').map(item => { const rule = rules.find(candidate => candidate.id === item.ruleId); const rawTitle = item.description || rule?.description || 'Регулярна операція'; return { id: `recurring:${item.id}`, kind: 'recurring' as const, dueDate: item.dueDate, title: rawTitle === item.dueDate ? 'Регулярна операція' : rawTitle, amountMinor: item.amountMinor ?? rule?.amountMinor ?? 0, currency: rule?.currency || 'UAH', ownerId: rule?.ownerId, ownerName: rule?.ownerName }; }),
    ...plans.flatMap(plan => (plan.obligations || []).filter(item => item.status !== 'paid').map(item => ({
      id: `installment:${item.id}`,
      kind: 'installment' as const,
      dueDate: item.dueDate,
      title: plan.name,
      amountMinor: item.amountMinor,
      currency: plan.currency,
      ownerId: plan.ownerId,
      ownerName: plan.ownerName,
    }))),
  ].filter(item => item.dueDate >= paymentRange.from && item.dueDate < paymentRange.to)
    .sort((left, right) => left.dueDate.localeCompare(right.dueDate));
  return <main className="screen dashboard"><header className="screen-header"><div><span className="eyebrow">BRIAREUS FINANCE</span></div></header>
    <div className="period dashboard-period"><PeriodPicker value={period} range={range} onChange={onPeriodChange} onRangeChange={onRangeChange} /></div><SummaryCard income={income} expenses={expenses} periodBalance={income-expenses} balance={cashBalance} creditDebt={creditDebt} availableCredit={availableCredit} />
    <section className="section-title"><h2>Планування</h2><button onClick={()=>onNavigate('budgets')}>Усі <ArrowRight size={16}/></button></section>
    <div className="dashboard-budgets">{budgets.length===0&&projects.length===0?<button className="budget-empty" onClick={()=>onNavigate('budgets')}><Target/><span><strong>Створіть перший бюджет</strong><small>Контролюйте ліміти за категоріями та проєктами</small></span></button>:budgets.slice(0,3).map(b=><article key={b.id} className={b.percentage>=100?'over':b.percentage>=b.warningPercent?'warning':''} role="button" tabIndex={0} onClick={()=>onOpenBudget(b.id)} onKeyDown={event=>{if(event.key==='Enter'||event.key===' ')onOpenBudget(b.id)}}><div><strong><Target size={16}/> {b.name}</strong><span>{b.percentage}%</span></div><div className="budget-progress"><span style={{width:`${Math.min(100,Math.max(0,b.percentage))}%`,background:b.percentage>=100?'#ff6b57':b.percentage>=b.warningPercent?'#ffc35b':'#8b857b'}}/></div><small>{money(b.spentMinor,b.currency)} з {money(b.plannedAmountMinor,b.currency)}</small><AuthorLabel ownerId={b.ownerId} ownerName={b.ownerName}/></article>)}</div>
    <div className="dashboard-projects dashboard-budgets">{projects.length===0?<button className="budget-empty" onClick={()=>onNavigate('budgets')}><Folder/><span><strong>Створіть перший проєкт</strong><small>Плануйте великі витрати окремо</small></span></button>:projects.slice(0,3).map(project=><article key={project.id} role="button" tabIndex={0} onClick={()=>onOpenProject(project.id)} onKeyDown={event=>{if(event.key==='Enter'||event.key===' ')onOpenProject(project.id)}}><div><strong><Folder size={16}/> {project.name}</strong><span>{project.percentage||0}%</span></div><ProgressBar value={project.percentage||0}/><small>{money(project.spentMinor||0,project.currency)} з {money(project.plannedAmountMinor,project.currency)}</small><AuthorLabel ownerId={project.ownerId} ownerName={project.ownerName}/></article>)}</div>
    {creditPayments.length>0&&<><section className="section-title"><h2>Погашення кредитних карток</h2></section><div className="upcoming">{creditPayments.map(payment=>{const account=accounts.find(item=>item.id===payment.accountId);return <article key={payment.id}><CircleAlert/><span><strong>{payment.title}</strong><small>{payment.status === 'overdue' ? `${money(payment.amountMinor,payment.currency)} для погашення. Пільговий період втрачено` : `Сплатити ${money(payment.amountMinor,payment.currency)} до ${payment.dueDate}, щоб зберегти пільговий період`}</small><AuthorLabel ownerId={account?.ownerId} ownerName={account?.ownerName}/></span></article>})}</div></>}
    {upcomingPayments.length>0&&<><section className="section-title"><h2>Платежі за період</h2><button onClick={()=>onNavigate('budgets')}>Календар</button></section><div className="upcoming">{upcomingPayments.map(payment=><article key={payment.id}>{payment.kind==='installment'?<CircleAlert/>:<CalendarClock/>}<span><strong>{payment.title}</strong><small>{payment.dueDate}{payment.amountMinor?` · ${money(payment.amountMinor,payment.currency)}`:''}</small><AuthorLabel ownerId={payment.ownerId} ownerName={payment.ownerName}/></span></article>)}</div></>}
    <section className="section-title"><h2>Останні транзакції</h2><button onClick={()=>onNavigate('transactions')}>Усі</button></section><TransactionList transactions={transactions} accounts={accounts} categories={categories} /><TransactionFab onClick={onCreateTransaction}/>
  </main>;
}
