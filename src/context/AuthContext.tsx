import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Profile } from '../lib/types';

interface AuthState {
  session: Session | null;
  loading: boolean;
  profile: Profile | null;
  partnerProfile: Profile | null;
  coupleId: string | null;
  userId: string | null;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string, displayName: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  pairPartner: (partnerUserId: string) => Promise<string | null>;
  unpairPartner: () => Promise<string | null>;
  updateDisplayName: (name: string) => Promise<void>;
  refetch: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [partnerProfile, setPartnerProfile] = useState<Profile | null>(null);
  const [coupleId, setCoupleId] = useState<string | null>(null);

  const bootstrap = useCallback(async (userId: string) => {
    setLoading(true);
    try {
      const { data: myProfile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !myProfile) {
        console.warn('Profile not ready yet', error);
        setLoading(false);
        return;
      }

      setProfile(myProfile);
      setCoupleId(myProfile.couple_id);

      if (myProfile.couple_id) {
        const { data: partner } = await supabase
          .from('profiles')
          .select('*')
          .eq('couple_id', myProfile.couple_id)
          .neq('id', userId)
          .maybeSingle();
        setPartnerProfile(partner ?? null);
      } else {
        setPartnerProfile(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setProfile(null);
    setPartnerProfile(null);
    setCoupleId(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) bootstrap(session.user.id);
      else setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) bootstrap(session.user.id);
      else reset();
    });

    return () => subscription.unsubscribe();
  }, [bootstrap, reset]);

  // Live-update when the partner links (their write flips our couple_id).
  useEffect(() => {
    if (!session) return;
    const ch = supabase
      .channel(`profile-self:${session.user.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${session.user.id}` },
        () => bootstrap(session.user.id),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [session, bootstrap]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error?.message ?? null;
  };

  const signUp = async (email: string, password: string, displayName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    });
    return error?.message ?? null;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    reset();
  };

  const pairPartner = async (partnerUserId: string) => {
    const { error } = await supabase.rpc('pair_with_partner', { partner_uuid: partnerUserId });
    if (error) return error.message;
    if (session) await bootstrap(session.user.id);
    return null;
  };

  const unpairPartner = async () => {
    const { error } = await supabase.rpc('unpair');
    if (error) return error.message;
    if (session) await bootstrap(session.user.id);
    return null;
  };

  const updateDisplayName = async (name: string) => {
    if (!session) return;
    const { error } = await supabase
      .from('profiles')
      .update({ display_name: name, updated_at: new Date().toISOString() })
      .eq('id', session.user.id);
    if (!error && profile) setProfile({ ...profile, display_name: name });
  };

  const value: AuthState = {
    session,
    loading,
    profile,
    partnerProfile,
    coupleId,
    userId: session?.user.id ?? null,
    signIn,
    signUp,
    signOut,
    pairPartner,
    unpairPartner,
    updateDisplayName,
    refetch: async () => {
      if (session) await bootstrap(session.user.id);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
