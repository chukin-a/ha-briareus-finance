import { ChevronRight, Coins, FolderTree, Globe2, Settings as SettingsIcon, Users } from 'lucide-react';

export function Settings({ onCategories, onUsers }: { onCategories: () => void; onUsers: () => void }) {
  return <main className="screen"><header className="screen-header"><div><span className="eyebrow">BRIAREUS FINANCE</span><h1>Налаштування</h1></div><div className="round-action"><SettingsIcon /></div></header><section className="settings-list"><button onClick={onUsers}><Users /><span>Користувачі</span><ChevronRight /></button><button onClick={onCategories}><FolderTree /><span>Категорії транзакцій</span><ChevronRight /></button><button><Coins /><span>Валюта</span><b>UAH</b><ChevronRight /></button><button><Globe2 /><span>Часовий пояс</span><b>Europe/Kyiv</b><ChevronRight /></button></section></main>;
}
