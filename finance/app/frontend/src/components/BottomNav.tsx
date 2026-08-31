import { CalendarClock, ChartNoAxesCombined, ChartPie, List, Settings, Target, WalletCards } from 'lucide-react';

export type Page = 'dashboard' | 'analytics' | 'payments' | 'accounts' | 'transactions' | 'budgets' | 'settings' | 'categories' | 'projects' | 'users';

const items = [
  { id: 'dashboard', label: 'Огляд', Icon: ChartNoAxesCombined },
  { id: 'analytics', label: 'Аналітика', Icon: ChartPie },
  { id: 'payments', label: 'Платежі', Icon: CalendarClock },
  { id: 'transactions', label: 'Транзакції', Icon: List },
  { id: 'budgets', label: 'Бюджети', Icon: Target },
  { id: 'accounts', label: 'Рахунки', Icon: WalletCards },
  { id: 'settings', label: 'Налаштування', Icon: Settings },
] as const;

export function BottomNav({ page, onChange }: { page: Page; onChange: (page: Page) => void }) {
  return <nav className="bottom-nav">{items.map(({ id, label, Icon }) => <button key={id} className={page === id ? 'active' : ''} onClick={() => onChange(id)}><Icon /><span>{label}</span></button>)}</nav>;
}
