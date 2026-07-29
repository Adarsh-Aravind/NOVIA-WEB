import type { CSSProperties, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

/**
 * Skeleton — a soft pulsing placeholder for content that hasn't loaded yet.
 *
 * Mirrors the mobile app's Skeleton primitive: a gentle opacity pulse rather
 * than a sweeping shimmer, so the load reads as "content is arriving" and sits
 * with NOVIA's calm glass language instead of a hard highlight sweeping across.
 * Compose several to trace the shape of the real content; stagger with `delay`
 * so a stack breathes as a soft wave.
 */
export function Skeleton({
  width = '100%',
  height = 14,
  radius = 12,
  delay = 0,
  style,
}: {
  width?: number | string;
  height?: number;
  radius?: number;
  delay?: number;
  style?: CSSProperties;
}) {
  return (
    <div
      className="skeleton"
      style={{ width, height, borderRadius: radius, animationDelay: `${delay}ms`, ...style }}
    />
  );
}

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

/**
 * Loader — the in-page loading state. A stack of card-shaped skeleton rows that
 * trace the list content about to arrive, replacing the old spinner so a page
 * load reads as "arriving", not "buffering". Mirrors the app's HubSkeleton move.
 */
export function Loader() {
  return (
    <div className="skeleton-list fade-up">
      {[0, 1, 2, 3, 4].map((i) => (
        <div className="card pad skeleton-row" key={i}>
          <Skeleton width={38} height={38} radius={12} delay={i * 90} />
          <div style={{ flex: 1 }}>
            <Skeleton width="46%" height={15} delay={i * 90} />
            <Skeleton width="72%" height={12} delay={i * 90 + 60} style={{ marginTop: 10 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * DashboardSkeleton — the launch placeholder for the home Hub, mirroring its
 * greeting, mood card, check-in card and stat grid while the couple's data
 * loads. The direct analogue of the app's HubSkeleton launch gate.
 */
export function DashboardSkeleton() {
  return (
    <div className="fade-up">
      <header style={{ marginBottom: 28 }}>
        <Skeleton width={130} height={15} />
        <Skeleton width={210} height={34} radius={12} delay={90} style={{ marginTop: 12 }} />
      </header>

      <div className="card pad-lg" style={{ marginBottom: 20 }}>
        <Skeleton width={230} height={14} />
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 16 }}>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} width={82} height={66} radius={14} delay={i * 70} />
          ))}
        </div>
      </div>

      <div className="card pad-lg" style={{ marginBottom: 20 }}>
        <Skeleton width={190} height={16} />
        <Skeleton width="70%" height={13} delay={90} style={{ marginTop: 16 }} />
      </div>

      <div className="grid grid-2">
        {[0, 1, 2, 3].map((i) => (
          <div className="card pad" key={i}>
            <Skeleton width={30} height={30} radius={10} delay={i * 80} />
            <Skeleton width={72} height={26} radius={10} delay={i * 80 + 60} style={{ marginTop: 14 }} />
            <Skeleton width="60%" height={12} delay={i * 80 + 120} style={{ marginTop: 10 }} />
          </div>
        ))}
      </div>
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
