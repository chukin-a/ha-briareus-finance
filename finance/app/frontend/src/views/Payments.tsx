import { useEffect, useMemo, useState } from 'react';
import { CalendarClock, Check, CircleAlert, CreditCard, RefreshCw, X } from 'lucide-react';
import { financeApi } from '../api/client';
import { PeriodPicker, type CustomRange, type PeriodPreset } from '../components/PeriodPicker';
import { money, parseMinor } from '../lib/money';
import type { Account, PaymentItem, PaymentsReport } from '../types/finance';
import { Dialog } from '../components/Dialog';

type PaymentFilter = 'all' | PaymentItem['kind'];

const filterLabels: Record<PaymentFilter, string> = {
  all: 'Усі',
  recurring: 'Заплановані',
  installment: 'Розстрочки',
  credit_card: 'Кредитки',
};

function PaymentIcon({ kind }: { kind: PaymentItem['kind'] }) {
  if (kind === 'installment') return <CircleAlert />;
  if (kind === 'credit_card') return <CreditCard />;
  return <CalendarClock />;
}

function kindLabel(kind: PaymentItem['kind']) {
  if (kind === 'installment') return 'Розстрочка';
  if (kind === 'credit_card') return 'Кредитна картка';
  return 'Запланований платіж';
}

export function Payments({ accounts, period, range, onPeriodChange, onRangeChange, onChanged }: { accounts:Account[]; period: PeriodPreset; range: CustomRange; onPeriodChange:(period:PeriodPreset)=>void; onRangeChange:(range:CustomRange)=>void; onChanged:()=>void }) {
  const [report,setReport]=useState<PaymentsReport|null>(null),[filter,setFilter]=useState<PaymentFilter>('all'),[error,setError]=useState(''),[busy,setBusy]=useState(''),[confirming,setConfirming]=useState<PaymentItem|null>(null),[accountId,setAccountId]=useState(''),[paymentAmount,setPaymentAmount]=useState('');
  async function load() {
    try {
      setError('');
      setReport(await financeApi.getPayments(period, range));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Не вдалося завантажити платежі');
    }
  }
  useEffect(()=>{void load()},[period,range]);
  const payments = useMemo(()=>filter==='all' ? report?.items || [] : (report?.items || []).filter(payment => payment.kind === filter),[report,filter]);
  async function run(id: string, action: () => Promise<unknown>) {
    try {
      setBusy(id);
      await action();
      await load();
      onChanged();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Не вдалося оновити платіж');
    } finally {
      setBusy('');
    }
  }
  return <main className="screen payments-screen">
    <header className="screen-header"><div><span className="eyebrow">КАЛЕНДАР ЗОБОВʼЯЗАНЬ</span><h1>Платежі</h1></div><button className="round-action" aria-label="Оновити" onClick={()=>void load()}><RefreshCw /></button></header>
    <div className="period"><PeriodPicker value={period} range={range} onChange={onPeriodChange} onRangeChange={onRangeChange}/></div>
    {error&&<div className="category-error">{error}</div>}
    <div className="payment-total-strip">{(report?.totals||[]).map(total=><article key={total.currency}><span>{total.currency}</span><strong>{money(total.amountMinor,total.currency)}</strong></article>)}{!report?.totals.length&&<article><span>За період</span><strong>{money(0)}</strong></article>}</div>
    <div className="category-tabs payment-tabs">{(Object.keys(filterLabels) as PaymentFilter[]).map(value=><button key={value} className={filter===value?'active':''} onClick={()=>setFilter(value)}>{filterLabels[value]}</button>)}</div>
    <div className="payments-list">
      {!report&&<div className="empty-state">Завантаження платежів…</div>}
      {report&&payments.length===0&&<div className="empty-state">У вибраному періоді платежів немає.</div>}
      {payments.map(payment=><article key={payment.id} className={payment.kind}>
        <div className="payment-date"><strong>{payment.dueDate.slice(8,10)}</strong><span>{payment.dueDate.slice(5,7)}</span></div>
        <div className="payment-icon"><PaymentIcon kind={payment.kind}/></div>
        <div className="payment-copy"><strong>{payment.title}</strong><span>{kindLabel(payment.kind)} · {payment.accountName}</span></div>
        <b>{money(payment.amountMinor,payment.currency)}</b>
        <div className="payment-actions">
          {payment.action==='confirm_or_skip'&&<button disabled={busy===payment.id} onClick={()=>{setConfirming(payment);setAccountId(payment.accountId || accounts[0]?.id || '');setPaymentAmount(String(payment.amountMinor / 100).replace('.', ','));}}><Check size={15}/>Підтвердити</button>}
          {payment.action==='confirm_or_skip'&&<button disabled={busy===payment.id} onClick={()=>void run(payment.id, async()=>financeApi.skipOccurrence(payment.sourceId))}><X size={15}/>Пропустити</button>}
          {payment.action==='pay'&&<button disabled={busy===payment.id} onClick={()=>void run(payment.id, async()=>financeApi.payObligation(payment.sourceId))}><Check size={15}/>Оплатити</button>}
          {payment.action==='manual'&&<span>{payment.status === 'overdue' ? 'Пільговий період втрачено' : 'Оплатити вручну'}</span>}
        </div>
      </article>)}
    </div>
    {confirming&&<Dialog title="Сплатити регулярну операцію" onClose={()=>setConfirming(null)}><label>Сума<input inputMode="decimal" value={paymentAmount} onChange={event=>setPaymentAmount(event.target.value)} /></label><label>Рахунок<select value={accountId} onChange={event=>setAccountId(event.target.value)}><option value="">Оберіть рахунок</option>{accounts.map(account=><option key={account.id} value={account.id}>{account.name}</option>)}</select></label><button className="primary" disabled={!accountId||!Number.isInteger(parseMinor(paymentAmount))||parseMinor(paymentAmount)<=0||busy===confirming.id} onClick={()=>void run(confirming.id,async()=>{await financeApi.confirmOccurrence(confirming.sourceId,accountId,parseMinor(paymentAmount));setConfirming(null);})}>Підтвердити платіж</button></Dialog>}
  </main>;
}
