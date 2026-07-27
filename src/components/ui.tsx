import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export function EmptyState({ icon, title, hint }: { icon?: ReactNode; title: string; hint?: string }) {
  return (
    <div className="empty fade-up">
      {icon && <div style={{ opacity: 0.4, marginBottom: 12 }}>{icon}</div>}
      <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: 16 }}>{title}</div>
      {hint && <div style={{ marginTop: 6, fontSize: 14 }}>{hint}</div>}
    </div>
  );
}

export function Splash() {
  return (
    <div className="splash">
      <img className="splash-cat" src="/cat2.png" alt="NOVIA" />
      <div className="spinner" style={{ marginTop: 28 }} />
    </div>
  );
}

export function Loader({ label }: { label?: string }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 14,
        padding: '80px 0',
        color: 'var(--text-muted)',
      }}
    >
      <div className="spinner" />
      {label && <span style={{ fontSize: 14 }}>{label}</span>}
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <header className="page-header">
      <div>
        <h1 className="display" style={{ fontSize: 30, letterSpacing: '-0.02em' }}>
          {title}
        </h1>
        {subtitle && (
          <p className="muted" style={{ marginTop: 4, fontSize: 14 }}>
            {subtitle}
          </p>
        )}
      </div>
      {action}
    </header>
  );
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { key: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="segmented">
      {options.map((o) => (
        <button
          key={o.key}
          className={`segmented-item ${value === o.key ? 'active' : ''}`}
          onClick={() => onChange(o.key)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function StatCard({
  to,
  icon,
  label,
  value,
  hint,
  tone = 'default',
  accent,
}: {
  to: string;
  icon: ReactNode;
  label: string;
  value: string;
  hint?: string;
  tone?: 'default' | 'danger' | 'warning';
  accent?: string;
}) {
  const color =
    accent ??
    (tone === 'danger' ? 'var(--danger)' : tone === 'warning' ? 'var(--warning)' : 'var(--accent)');
  return (
    <Link to={to} className="card pad">
      <div className="spread" style={{ marginBottom: 12 }}>
        <span style={{ color }}>{icon}</span>
        <ArrowRight size={16} className="faint" />
      </div>
      <div className="stat-number" style={{ color, fontSize: 28 }}>
        {value}
      </div>
      <div className="muted" style={{ fontSize: 13, marginTop: 4, fontWeight: 600 }}>
        {label}
      </div>
      {hint && (
        <div className="faint" style={{ fontSize: 12.5, marginTop: 2 }}>
          {hint}
        </div>
      )}
    </Link>
  );
}
