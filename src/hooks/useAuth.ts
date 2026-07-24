import { useEffect, useState, useCallback } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { getStoredProfile, storeProfile, fetchProfile } from '@/lib/auth';
import type { UserProfile } from '@/types';

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    session: null, user: null, profile: getStoredProfile(), loading: true,
  });

  const refreshProfile = useCallback(async (userId: string) => {
    const p = await fetchProfile(userId);
    storeProfile(p);
    setState(s => ({ ...s, profile: p }));
    return p;
  }, []);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setState(s => ({ ...s, session, user: session?.user ?? null, loading: false }));
      if (session?.user) {
        refreshProfile(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        if (!mounted) return;
        setState(s => ({
          ...s,
          session,
          user: session?.user ?? null,
          loading: false,
          profile: session?.user ? s.profile : null,
        }));
        if (session?.user) {
          await refreshProfile(session.user.id);
        } else {
          storeProfile(null);
        }
      })();
    });

    return () => { mounted = false; subscription.unsubscribe(); };
  }, [refreshProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error };
    if (data.user) {
      const p = await fetchProfile(data.user.id);
      storeProfile(p);
      setState(s => ({ ...s, session: data.session, user: data.user, profile: p }));
    }
    return { error: null };
  }, []);

  const signUp = useCallback(async (email: string, password: string, nome: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nome } },
    });
    if (error) return { error };
    if (data.user) {
      const p = await fetchProfile(data.user.id);
      if (p) {
        storeProfile(p);
        setState(s => ({ ...s, session: data.session, user: data.user, profile: p }));
      }
    }
    return { error: null };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    storeProfile(null);
    setState({ session: null, user: null, profile: null, loading: false });
  }, []);

  return { ...state, signIn, signUp, signOut, refreshProfile };
}
