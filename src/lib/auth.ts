import { supabase } from '@/lib/supabase';
import type { UserProfile } from '@/types';

const PROFILE_KEY = 'gris_user_profile';

function isBrowser() { return typeof window !== 'undefined'; }

export function getStoredProfile(): UserProfile | null {
  if (!isBrowser()) return null;
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    return raw ? JSON.parse(raw) as UserProfile : null;
  } catch { return null; }
}

export function storeProfile(p: UserProfile | null) {
  if (!isBrowser()) return;
  if (p) localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
  else localStorage.removeItem(PROFILE_KEY);
}

export async function fetchProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('atendentes')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error) return null;
  return data as UserProfile | null;
}
