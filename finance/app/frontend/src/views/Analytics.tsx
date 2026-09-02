import { useEffect, useMemo, useState } from 'react';
import { ChartPie } from 'lucide-react';
import { financeApi } from '../api/client';
import { PeriodPicker, type CustomRange, type PeriodPreset } from '../components/PeriodPicker';
import { money } from '../lib/money';
import type { Account, Category } from '../types/finance';
import { AnalyticsCategory } from './AnalyticsCategory';
import { TransactionList } from '../components/TransactionList';
import type { Transaction } from '../types/finance';

type AnalyticsData = Awaited<ReturnType<typeof financeApi.getAnalytics>>;
function piePath(start: number, end: number, radius = 100, center = 110) {
  const toPoint = (angle: number) => { const radians = (angle - 90) * Math.PI / 180; return { x: center + radius * Math.cos(radians), y: center + radius * Math.sin(radians) }; };
  if (end - start >= 359.999) {
    const top = toPoint(0); const bottom = toPoint(180);
    return `M ${center} ${center} L ${top.x} ${top.y} A ${radius} ${radius} 0 1 1 ${bottom.x} ${bottom.y} A ${radius} ${radius} 0 1 1 ${top.x} ${top.y} Z`;
  }
  const from = toPoint(start); const to = toPoint(end); const large = end - start > 180 ? 1 : 0;
  return `M ${center} ${center} L ${from.x} ${from.y} A ${radius} ${radius} 0 ${large} 1 ${to.x} ${to.y} Z`;
}
export function Analytics({ accounts, categories, period, range, onPeriodChange, onRangeChange }: { accounts:Account[];categories:Category[];period:PeriodPreset;range:CustomRange;onPeriodChange:(period:PeriodPreset)=>void;onRangeChange:(range:CustomRange)=>void }) {
  const [data,setData]=useState<AnalyticsData|null>(null),[error,setError]=useState(''),[drillCategory,setDrillCategory]=useState<string|null>(null),[chartTab,setChartTab]=useState<'expense'|'income'>('expense');
  useEffect(()=>{setError('');void financeApi.getAnalytics(period,range,drillCategory||undefined).then(setData).catch(cause=>setError(cause instanceof Error?cause.message:'Не вдалося завантажити аналітику'))},[period,range,drillCategory]);
  useEffect(()=>{setDrillCategory(null)},[period,range]);
  const currencies=useMemo(()=>[...new Set([...(data?.income||[]),...(data?.expenses||[]),...(data?.net||[])].map(row=>row.currency))],[data]);
  const trendCurrency=currencies[0]||'UAH';
  const daily=useMemo(()=>data?.trend.filter(row=>row.currency===trendCurrency)||[],[data,trendCurrency]);
  const trendRows=useMemo(()=>{if(daily.length<=31)return daily;const monthly=new Map<string,{date:string;currency:string;incomeMinor:number;expenseMinor:number}>();for(const row of daily){const date=row.date.slice(0,7);const current=monthly.get(date)||{date,currency:row.currency,incomeMinor:0,expenseMinor:0};current.incomeMinor+=row.incomeMinor;current.expenseMinor+=row.expenseMinor;monthly.set(date,current);}return [...monthly.values()];},[daily]);
  const dailyMax=Math.max(1,...trendRows.flatMap(row=>[row.incomeMinor,row.expenseMinor]));
  const chartCurrency=(chartTab==='expense'?data?.expenses[0]?.currency:data?.income[0]?.currency)||trendCurrency;
  const chartRows=((chartTab==='expense'?data?.byCategory:data?.incomeByCategory)||[]).filter(row=>row.currency===chartCurrency);
  const chartTotal=chartRows.reduce((sum,row)=>sum+row.amountMinor,0);
  const categoryName=(id:string|null)=>id==='uncategorized'?'Без категорії':id==='direct'?'Прямі витрати':categories.find(category=>category.id===id)?.name||'Витрати';
  const largestTransactions=(data?.largestExpenses||[]).map(item=>({...item,type:'expense' as const,relatedAccountId:null,occurredAt:`${item.occurredOn}T12:00:00.000Z`})) as Transaction[];
  const colors=['#ffc35b','#ff7650','#8eb8ff','#b78cff','#73d6ae','#f18ac4'];
  if (drillCategory && data) {
    return <AnalyticsCategory data={data} categoryId={drillCategory} type={chartTab} accounts={accounts} categories={categories} onBack={()=>setDrillCategory(null)} />;
  }
  let chartOffset=0;
  return <main className="screen analytics-screen"><header className="screen-header"><div><span className="eyebrow">ФІНАНСОВИЙ ОГЛЯД</span><h1>Аналітика</h1></div><div className="round-action"><ChartPie/></div></header><div className="period"><PeriodPicker value={period} range={range} onChange={onPeriodChange} onRangeChange={onRangeChange}/></div>{error&&<div className="category-error">{error}</div>}{!data?<p className="empty">Завантаження…</p>:<>
    <div className="analytics-totals">{currencies.map(currency=><article key={currency}><span>{currency}</span><div><small>Прибутки</small><strong className="income">{money(data.income.find(row=>row.currency===currency)?.amountMinor||0,currency)}</strong></div><div><small>Витрати</small><strong>{money(data.expenses.find(row=>row.currency===currency)?.amountMinor||0,currency)}</strong></div><div><small>Результат</small><strong>{money(data.net.find(row=>row.currency===currency)?.amountMinor||0,currency)}</strong></div></article>)}</div>{!currencies.length&&<div className="empty-state">За цей період немає операцій.</div>}
    <section className="section-title"><h2>Динаміка {trendCurrency}</h2></section><div className="analytics-trend">{trendRows.map(row=><div key={`${row.date}:${row.currency}`}><span title={`Прибутки: ${money(row.incomeMinor,row.currency)}`} style={{height:`${Math.max(2,row.incomeMinor/dailyMax*100)}%`}}/><i title={`Витрати: ${money(row.expenseMinor,row.currency)}`} style={{height:`${Math.max(2,row.expenseMinor/dailyMax*100)}%`}}/><time>{row.date.slice(5)}</time></div>)}</div>
    <section className="section-title"><h2>{chartTab==='expense'?'Витрати за категоріями':'Прибутки за категоріями'}</h2></section><div className="analytics-category-tabs"><button className={chartTab==='expense'?'active':''} onClick={()=>setChartTab('expense')}>Витрати за категоріями</button><button className={chartTab==='income'?'active':''} onClick={()=>setChartTab('income')}>Прибутки за категоріями</button></div><div className="analytics-category-chart"><div className="analytics-pie"><svg viewBox="0 0 220 220" role="img" aria-label="Розподіл категорій">{chartRows.map((row,index)=>{const start=chartTotal?chartOffset/chartTotal*360:0;chartOffset+=row.amountMinor;const end=chartTotal?chartOffset/chartTotal*360:360;const canDrill=row.categoryId!=='uncategorized';return <path key={`${row.currency}:${row.categoryId}`} d={piePath(start,end)} fill={colors[index%colors.length]} className={canDrill?'clickable':''} onClick={()=>canDrill&&setDrillCategory(row.categoryId)} onKeyDown={event=>{if(canDrill&&(event.key==='Enter'||event.key===' '))setDrillCategory(row.categoryId)}} role={canDrill?'button':undefined} tabIndex={canDrill?0:-1}/>})}</svg><div><strong>{money(chartTotal,chartCurrency)}</strong><small>{chartTab==='expense'?'Усього витрат':'Усього прибутків'}</small></div></div><div className="analytics-legend">{chartRows.map((row,index)=><button key={`${row.currency}:${row.categoryId}`} onClick={()=>row.categoryId!=='uncategorized'&&setDrillCategory(row.categoryId)} disabled={row.categoryId==='uncategorized'}><i style={{background:colors[index%colors.length]}}/><span>{categoryName(row.categoryId)}</span><b>{money(row.amountMinor,row.currency)}</b></button>)}</div></div>
    <section className="section-title"><h2>Найбільші витрати</h2></section><TransactionList transactions={largestTransactions} accounts={accounts} categories={categories} limit={10}/>
  </>}</main>;
}
