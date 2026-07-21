import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { PageHeader, EmptyState, Loader } from '../components/ui';
import { formatDate } from '../lib/format';
import type { AppUpdate } from '../types';

export function Updates() {
  const [updates, setUpdates] = useState<AppUpdate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('app_updates')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setUpdates((data ?? []) as AppUpdate[]);
        setLoading(false);
      });
  }, []);

  return (
    <div className="fade-up">
      <PageHeader title="What's New" subtitle="NOVIA changelog & announcements" />
      {loading ? (
        <Loader />
      ) : updates.length === 0 ? (
        <EmptyState icon={<Sparkles size={40} />} title="No updates yet" />
      ) : (
        <div className="stack" style={{ gap: 16 }}>
          {updates.map((u) => (
            <div key={u.id} className="card pad-lg">
              <div className="row" style={{ gap: 10, marginBottom: 8 }}>
                <span className="pill" style={{ background: 'var(--glass-accent)', color: 'var(--cream)' }}>
                  v{u.version}
                </span>
                <span className="faint" style={{ fontSize: 12.5 }}>
                  {formatDate(u.created_at)}
                </span>
              </div>
              <div className="display" style={{ fontSize: 20, marginBottom: 6 }}>
                {u.title}
              </div>
              {u.body && (
                <p className="muted" style={{ fontSize: 14.5, lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>
                  {u.body}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
