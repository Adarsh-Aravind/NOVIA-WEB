import { useCallback, useEffect, useState } from 'react';
import { supabase } from './supabase';

interface Options {
  order?: { column: string; ascending?: boolean };
}

/**
 * Fetch every row of `table` matching `filterColumn = filterValue`, then keep it
 * live via a postgres_changes subscription. Mirrors the realtime pattern used
 * across the mobile app's hooks (useTodos, useComplaints, …).
 */
export function useTable<T>(
  table: string,
  filterColumn: string,
  filterValue: string | null,
  opts: Options = {},
) {
  const [rows, setRows] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  const orderCol = opts.order?.column;
  const orderAsc = opts.order?.ascending ?? true;

  const fetchRows = useCallback(async () => {
    if (!filterValue) return;
    let q = supabase.from(table).select('*').eq(filterColumn, filterValue);
    if (orderCol) q = q.order(orderCol, { ascending: orderAsc });
    const { data, error } = await q;
    if (error) console.error(`[${table}] fetch`, error);
    else setRows((data ?? []) as T[]);
  }, [table, filterColumn, filterValue, orderCol, orderAsc]);

  useEffect(() => {
    if (!filterValue) {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchRows().finally(() => setLoading(false));

    const channel = supabase
      .channel(`${table}-sync:${filterValue}:${Math.random().toString(36).slice(2)}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table, filter: `${filterColumn}=eq.${filterValue}` },
        () => fetchRows(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, filterColumn, filterValue]);

  return { rows, loading, refetch: fetchRows, setRows };
}
