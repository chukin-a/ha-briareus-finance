import { UserRound } from 'lucide-react';

export function AuthorLabel({ ownerId, ownerName, className = '' }: { ownerId?: string | null; ownerName?: string | null; className?: string }) {
  const author = ownerName?.trim() || ownerId?.trim() || 'Невідомий автор';
  return <span className={`author-label${className ? ` ${className}` : ''}`} title={author} aria-label={`Автор: ${author}`}><UserRound aria-hidden="true" />{author}</span>;
}
