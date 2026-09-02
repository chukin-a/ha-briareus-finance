import { useCallback, useEffect, useState } from 'react';
import { financeApi } from './api/client';
import { BottomNav, type Page } from './components/BottomNav';
import type { CustomRange, PeriodPreset } from './components/PeriodPicker';
import type { Account, Category, Project, Transaction } from './types/finance';
import { Accounts } from './views/Accounts';
import { Analytics } from './views/Analytics';
import { Categories } from './views/Categories';
import { Dashboard } from './views/Dashboard';
import { PlanningHub } from './views/PlanningHub';
import { Payments } from './views/Payments';
import { Projects } from './views/Projects';
import { Settings } from './views/Settings';
import { Transactions } from './views/Transactions';
import { Users } from './views/Users';

export default function App() {
  const [page,setPage]=useState<Page>('dashboard'),[accounts,setAccounts]=useState<Account[]>([]),[transactions,setTransactions]=useState<Transaction[]>([]),[categories,setCategories]=useState<Category[]>([]),[projects,setProjects]=useState<Project[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState(''),[dataVersion,setDataVersion]=useState(0),[taxApiEnabled,setTaxApiEnabled]=useState(false),[period,setPeriod]=useState<PeriodPreset>('current_month'),[customRange,setCustomRange]=useState<CustomRange>({from:new Date(Date.UTC(new Date().getUTCFullYear(),new Date().getUTCMonth(),1)).toISOString().slice(0,10),to:new Date(Date.now()+86400000).toISOString().slice(0,10)});
  const load=useCallback(async(showLoading=true)=>{if(showLoading)setLoading(true);try{const [a,t,c,p]=await Promise.all([financeApi.getAccounts(),financeApi.getTransactions(period,customRange),financeApi.getCategories(),financeApi.getProjects()]);setAccounts(a);setTransactions(t);setCategories(c);setProjects(p)}catch(cause){setError(cause instanceof Error?cause.message:'Не вдалося завантажити дані')}finally{if(showLoading)setLoading(false)}},[period,customRange]);
  useEffect(()=>{void load()},[load]);
  useEffect(()=>{void financeApi.getRuntimeConfig().then(config=>setTaxApiEnabled(config.taxApiEnabled)).catch(()=>undefined)},[]);
  useEffect(()=>{
    const events = new EventSource('./api/events');
    const refresh = () => { setDataVersion(version => version + 1); void load(false); };
    events.addEventListener('transaction.created', refresh);
    events.addEventListener('transaction.updated', refresh);
    events.addEventListener('transaction.deleted', refresh);
    events.addEventListener('transfer.changed', refresh);
    events.addEventListener('budget.changed', refresh);
    events.addEventListener('recurring.changed', refresh);
    events.addEventListener('installment.changed', refresh);
    events.addEventListener('category.changed', refresh);
    events.addEventListener('account.changed', refresh);
    events.addEventListener('project.changed', refresh);
    return () => events.close();
  },[load]);
  async function deleteAccount(account:Account){if(!window.confirm(`Видалити рахунок «${account.name}»?`))return;try{await financeApi.deleteAccount(account.id);await load()}catch(cause){setError(cause instanceof Error?cause.message:'Не вдалося видалити рахунок')}}
  let content;
  if(loading) content=<main className="screen loading">Завантаження планування…</main>;
  else if(page==='dashboard') content=<Dashboard accounts={accounts} transactions={transactions} categories={categories} period={period} range={customRange} onPeriodChange={setPeriod} onRangeChange={setCustomRange} onNavigate={setPage}/>;
  else if(page==='analytics') content=<Analytics categories={categories} period={period} range={customRange} onPeriodChange={setPeriod} onRangeChange={setCustomRange}/>;
  else if(page==='payments') content=<Payments accounts={accounts} period={period} range={customRange} onPeriodChange={setPeriod} onRangeChange={setCustomRange} onChanged={()=>void load(false)}/>;
  else if(page==='accounts') content=<Accounts accounts={accounts} onDelete={deleteAccount} onCreated={()=>void load(false)}/>;
  else if(page==='transactions') content=<Transactions transactions={transactions} accounts={accounts} categories={categories} projects={projects} period={period} range={customRange} taxApiEnabled={taxApiEnabled} onPeriodChange={setPeriod} onRangeChange={setCustomRange} onChanged={()=>void load(false)}/>;
  else if(page==='budgets') content=<PlanningHub accounts={accounts} categories={categories} projects={projects} period={period} range={customRange} refreshKey={dataVersion} onBack={()=>setPage('dashboard')} onChanged={()=>void load(false)}/>;
  else if(page==='categories') content=<Categories categories={categories} onBack={()=>setPage('settings')} onChanged={()=>void load(false)}/>;
  else if(page==='projects') content=<Projects projects={projects} onBack={()=>setPage('budgets')} onChanged={()=>void load(false)}/>;
  else if(page==='users') content=<Users onBack={()=>setPage('settings')}/>;
  else content=<Settings onCategories={()=>setPage('categories')} onUsers={()=>setPage('users')}/>;
  return <div className="app" data-tax-api-enabled={taxApiEnabled}>{error&&<div className="toast" role="alert">{error}<button onClick={()=>setError('')}>×</button></div>}{content}<BottomNav page={page} onChange={setPage}/></div>;
}
