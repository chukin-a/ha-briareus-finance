import type { ReactNode } from 'react';
import { X } from 'lucide-react';

export function Dialog({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return <div className="modal" role="presentation" onMouseDown={event => event.target === event.currentTarget && onClose()}>
    <section role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" className="modal-close" aria-label="Закрити" onClick={onClose}><X /></button>
      <h2>{title}</h2>
      {children}
    </section>
  </div>;
}
