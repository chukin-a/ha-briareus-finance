import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';

export function TransactionFab({ onClick }: { onClick: () => void }) {
  const [bottom, setBottom] = useState<number>();
  useEffect(() => {
    const update = () => {
      const navigation = document.querySelector<HTMLElement>('.bottom-nav');
      if (navigation) setBottom(window.innerHeight - navigation.getBoundingClientRect().top + 8);
    };
    update();
    const navigation = document.querySelector<HTMLElement>('.bottom-nav');
    const observer = navigation ? new ResizeObserver(update) : null;
    if (observer && navigation) observer.observe(navigation);
    window.addEventListener('resize', update);
    return () => { observer?.disconnect(); window.removeEventListener('resize', update); };
  }, []);
  return <button className="transaction-fab" style={bottom === undefined ? undefined : { bottom }} aria-label="Нова транзакція" onClick={onClick}><Plus size={24} /></button>;
}
