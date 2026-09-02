export function ProgressBar({ value, warningPercent = 80, className = '' }: { value: number; warningPercent?: number; className?: string }) {
  const percentage = Number.isFinite(value) ? value : 0;
  const tone = percentage >= 100 ? 'over' : percentage >= warningPercent ? 'warning' : 'normal';
  const width = Math.min(100, Math.max(0, percentage));

  return <div className={`progress-bar ${tone} ${className}`.trim()} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(percentage)}>
    <span style={{ width: `${width}%` }} />
  </div>;
}
