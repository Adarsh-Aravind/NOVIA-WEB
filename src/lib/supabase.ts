import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!url || !anonKey) {
  console.error(
    'Missing Supabase env vars — copy .env.example to .env.local and set VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY.',
  );
}

/**
 * Shared Supabase client. The browser is the trusted device here (session in
 * localStorage), unlike the RN app's secure keystore — but RLS on the server
 * enforces identical access control for both clients.
 */
export const supabase = createClient(url, anonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: { eventsPerSecond: 10 },
  },
});
