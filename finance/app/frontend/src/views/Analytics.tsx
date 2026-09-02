import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ChartPie } from 'lucide-react';
import { financeApi } from '../api/client';
import { PeriodPicker, type CustomRange, type PeriodPreset } from '../components/PeriodPicker';
import { money } from '../lib/money';
import type { Category } from '../types/finance';

type AnalyticsData = Awaited<ReturnType<typeof financeApi.getAnalytics>>;
export function Analytics({ categories, period, range, onPeriodChange, onRangeChange }: { categories:Category[];period:PeriodPreset;range:CustomRange;onPeriodChange:(period:PeriodPreset)=>void;onRangeChange:(range:CustomRange)=>void }) {
  const [data,setData]=useState<AnalyticsData|null>(null),[error,setError]=useState(''),[drillCategory,setDrillCategory]=useState<string|null>(null);
  useEffect(()=>{setError('');void financeApi.getAnalytics(period,range,drillCategory||undefined).then(setData).catch(cause=>setError(cause instanceof Error?cause.message:'Не вдалося завантажити аналітику'))},[period,range,drillCategory]);
  useEffect(()=>{setDrillCategory(null)},[period,range]);
  const currencies=useMemo(()=>[...new Set([...(data?.income||[]),...(data?.expenses||[]),...(data?.net||[])].map(row=>row.currency))],[data]);
  const trendCurrency=currencies[0]||'UAH';
  const daily=useMemo(()=>data?.trend.filter(row=>row.currency===trendCurrency)||[],[data,trendCurrency]);
  const dailyMax=Math.max(1,...daily.flatMap(row=>[row.incomeMinor,row.expenseMinor]));
  const chartCurrency=data?.expenses[0]?.currency||trendCurrency;
  const chartRows=(data?.byCategory||[]).filter(row=>row.currency===chartCurrency);
  const chartTotal=chartRows.reduce((sum,row)=>sum+row.amountMinor,0);
  const categoryName=(id:string|null)=>id==='uncategorized'?'Без категорії':id==='direct'?'Прямі витрати':categories.find(category=>category.id===id)?.name||'Витрати';
  const colors=['#ffc35b','#ff7650','#8eb8ff','#b78cff','#73d6ae','#f18ac4'];
  const chartGradient=chartRows.length?`conic-gradient(${chartRows.reduce<{parts:string[];offset:number}>((result,row,index)=>{const start=result.offset/chartTotal*100;result.parts.push(`${colors[index%colors.length]} ${start}% ${(result.offset+row.amountMinor)/chartTotal*100}%`);result.offset+=row.amountMinor;return result},{parts:[],offset:0}).parts.join(', ')})`:'conic-gradient(#38342d 0 100%)';
  return <main className="screen analytics-screen"><header className="screen-header"><div><span className="eyebrow">ФІНАНСОВИЙ ОГЛЯД</span><h1>Аналітика</h1></div><div className="round-action"><ChartPie/></div></header><div className="period"><PeriodPicker value={period} range={range} onChange={onPeriodChange} onRangeChange={onRangeChange}/></div>{error&&<div className="category-error">{error}</div>}{!data?<p className="empty">Завантаження…</p>:<>
    <div className="analytics-totals">{currencies.map(currency=><article key={currency}><span>{currency}</span><div><small>Прибутки</small><strong className="income">{money(data.income.find(row=>row.currency===currency)?.amountMinor||0,currency)}</strong></div><div><small>Витрати</small><strong>{money(data.expenses.find(row=>row.currency===currency)?.amountMinor||0,currency)}</strong></div><div><small>Результат</small><strong>{money(data.net.find(row=>row.currency===currency)?.amountMinor||0,currency)}</strong></div></article>)}</div>{!currencies.length&&<div className="empty-state">За цей період немає операцій.</div>}
    <section className="section-title"><h2>Динаміка {trendCurrency}</h2></section><div className="analytics-trend">{daily.map(row=><div key={`${row.date}:${row.currency}`}><span title={`Прибутки: ${money(row.incomeMinor,row.currency)}`} style={{height:`${Math.max(2,row.incomeMinor/dailyMax*100)}%`}}/><i title={`Витрати: ${money(row.expenseMinor,row.currency)}`} style={{height:`${Math.max(2,row.expenseMinor/dailyMax*100)}%`}}/><time>{row.date.slice(5)}</time></div>)}</div>
    <section className="section-title"><h2>{drillCategory?categoryName(drillCategory):'Витрати за root-категоріями'}</h2>{drillCategory&&<button onClick={()=>setDrillCategory(null)}><ArrowLeft size={16}/> Назад</button>}</section><div className="analytics-category-chart"><div className="analytics-pie" style={{background:chartGradient}} aria-label="Розподіл витрат"><div><strong>{money(chartTotal,chartCurrency)}</strong><small>{drillCategory?'У категорії':'Усього витрат'}</small></div></div><div className="analytics-legend">{chartRows.map((row,index)=><button key={`${row.currency}:${row.categoryId}`} onClick={()=>!drillCategory&&row.categoryId!=='uncategorized'&&setDrillCategory(row.categoryId)} disabled={!!drillCategory||row.categoryId==='uncategorized'}><i style={{background:colors[index%colors.length]}}/><span>{categoryName(row.categoryId)}</span><b>{money(row.amountMinor,row.currency)}</b></button>)}</div></div>
    <div className="analytics-largest">{(data.categoryTransactions||[]).sort((a,b)=>b.amountMinor-a.amountMinor).map(item=><article key={item.id}><div><strong>{item.description||categoryName(item.categoryId)}</strong><small>{item.occurredOn} · {categoryName(item.categoryId)}</small></div><b>{money(item.amountMinor,item.currency)}</b></article>)}</div>
    <section className="section-title"><h2>Найбільші витрати</h2></section><div className="analytics-largest">{data.largestExpenses.map(item=><article key={item.id}><div><strong>{item.description||categories.find(category=>category.id===item.categoryId)?.name||'Витрата'}</strong><small>{item.occurredOn}</small></div><b>{money(item.amountMinor,item.currency)}</b></article>)}</div>
  </>}</main>;
}
