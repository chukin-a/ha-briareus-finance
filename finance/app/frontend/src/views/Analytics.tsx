import { useEffect, useMemo, useState } from 'react';
import { ChartPie } from 'lucide-react';
import { financeApi } from '../api/client';
import { PeriodPicker, type CustomRange, type PeriodPreset } from '../components/PeriodPicker';
import { money } from '../lib/money';
import type { Category } from '../types/finance';

type AnalyticsData = Awaited<ReturnType<typeof financeApi.getAnalytics>>;
export function Analytics({ categories, period, range, onPeriodChange, onRangeChange }: { categories:Category[];period:PeriodPreset;range:CustomRange;onPeriodChange:(period:PeriodPreset)=>void;onRangeChange:(range:CustomRange)=>void }) {
  const [data,setData]=useState<AnalyticsData|null>(null),[error,setError]=useState('');
  useEffect(()=>{setError('');void financeApi.getAnalytics(period,range).then(setData).catch(cause=>setError(cause instanceof Error?cause.message:'Не вдалося завантажити аналітику'))},[period,range]);
  const currencies=useMemo(()=>[...new Set([...(data?.income||[]),...(data?.expenses||[]),...(data?.net||[])].map(row=>row.currency))],[data]);
  const trendCurrency=currencies[0]||'UAH';
  const daily=useMemo(()=>data?.trend.filter(row=>row.currency===trendCurrency)||[],[data,trendCurrency]);
  const dailyMax=Math.max(1,...daily.flatMap(row=>[row.incomeMinor,row.expenseMinor]));
  return <main className="screen analytics-screen"><header className="screen-header"><div><span className="eyebrow">ФІНАНСОВИЙ ОГЛЯД</span><h1>Аналітика</h1></div><div className="round-action"><ChartPie/></div></header><div className="period"><PeriodPicker value={period} range={range} onChange={onPeriodChange} onRangeChange={onRangeChange}/></div>{error&&<div className="category-error">{error}</div>}{!data?<p className="empty">Завантаження…</p>:<>
    <div className="analytics-totals">{currencies.map(currency=><article key={currency}><span>{currency}</span><div><small>Прибутки</small><strong className="income">{money(data.income.find(row=>row.currency===currency)?.amountMinor||0,currency)}</strong></div><div><small>Витрати</small><strong>{money(data.expenses.find(row=>row.currency===currency)?.amountMinor||0,currency)}</strong></div><div><small>Результат</small><strong>{money(data.net.find(row=>row.currency===currency)?.amountMinor||0,currency)}</strong></div></article>)}</div>{!currencies.length&&<div className="empty-state">За цей період немає операцій.</div>}
    <section className="section-title"><h2>Динаміка {trendCurrency}</h2></section><div className="analytics-trend">{daily.map(row=><div key={`${row.date}:${row.currency}`}><span title={`Прибутки: ${money(row.incomeMinor,row.currency)}`} style={{height:`${Math.max(2,row.incomeMinor/dailyMax*100)}%`}}/><i title={`Витрати: ${money(row.expenseMinor,row.currency)}`} style={{height:`${Math.max(2,row.expenseMinor/dailyMax*100)}%`}}/><time>{row.date.slice(5)}</time></div>)}</div>
    <section className="section-title"><h2>Витрати за категоріями</h2></section><div className="analytics-categories">{data.byCategory.map(row=>{const total=data.expenses.find(item=>item.currency===row.currency)?.amountMinor||1,category=categories.find(item=>item.id===row.categoryId);return <article key={`${row.currency}:${row.categoryId}`}><div><strong>{category?.name||'Без категорії'}</strong><span>{money(row.amountMinor,row.currency)}</span></div><progress max="100" value={row.amountMinor/total*100}/></article>})}</div>
    <section className="section-title"><h2>Найбільші витрати</h2></section><div className="analytics-largest">{data.largestExpenses.map(item=><article key={item.id}><div><strong>{item.description||categories.find(category=>category.id===item.categoryId)?.name||'Витрата'}</strong><small>{item.occurredOn}</small></div><b>{money(item.amountMinor,item.currency)}</b></article>)}</div>
  </>}</main>;
}
