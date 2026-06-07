import { useMemo } from 'react';
import { makeSalonArtwork } from '../utils/visuals';

function formatCurrency(value) {
  return new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency: 'TWD',
    maximumFractionDigits: 0,
  }).format(value ?? 0);
}

export function SectionHeader({ eyebrow, title, description, align = 'left' }) {
  return (
    <div className={`section-header section-header--${align}`}>
      {eyebrow ? <p className="section-eyebrow">{eyebrow}</p> : null}
      <h2>{title}</h2>
      {description ? <p className="section-description">{description}</p> : null}
    </div>
  );
}

export function StatCard({ label, value, hint, accent = 'gold' }) {
  return (
    <article className={`stat-card stat-card--${accent}`}>
      <p>{label}</p>
      <strong>{value}</strong>
      {hint ? <span>{hint}</span> : null}
    </article>
  );
}

export function StatusBadge({ status }) {
  const classes = {
    待確認: 'status-badge status-badge--pending',
    已確認: 'status-badge status-badge--confirmed',
    已完成: 'status-badge status-badge--completed',
    已取消: 'status-badge status-badge--cancelled',
  };

  return <span className={classes[status] ?? 'status-badge'}>{status}</span>;
}

export function EmptyState({ title, description, action }) {
  return (
    <div className="empty-state">
      <h3>{title}</h3>
      {description ? <p>{description}</p> : null}
      {action}
    </div>
  );
}

export function LoadingScreen({ label = '資料載入中...' }) {
  return (
    <div className="loading-screen">
      <div className="loading-orb" />
      <p>{label}</p>
    </div>
  );
}

export function FeaturePill({ children }) {
  return <span className="feature-pill">{children}</span>;
}

export function ArtworkPanel({ title, description, label, tone = 'gold', className = '' }) {
  const backgroundImage = useMemo(() => makeSalonArtwork(tone), [tone]);

  return (
    <article className={`artwork-panel ${className}`.trim()}>
      <div className="artwork-panel__art" style={{ backgroundImage: `url("${backgroundImage}")` }} aria-hidden="true" />
      <div className="artwork-panel__content">
        {label ? <span className="artwork-panel__label">{label}</span> : null}
        <h3>{title}</h3>
        {description ? <p>{description}</p> : null}
      </div>
    </article>
  );
}

export { formatCurrency };
