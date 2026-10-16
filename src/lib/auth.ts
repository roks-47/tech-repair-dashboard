import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { getSupabase } from './supabase';

export async function signInWithPassword(
  email: string,
  password: string
): Promise<{ error?: string }> {
  const supabase = getSupabase();
  if (!supabase) return { error: 'Supabase não configurado neste aparelho.' };

  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error) {
    if (/invalid login credentials/i.test(error.message)) {
      return { error: 'E-mail ou senha incorretos.' };
    }
    if (/email not confirmed/i.test(error.message)) {
      return { error: 'Este usuário ainda não foi confirmado no painel da Supabase.' };
    }
    return { error: error.message };
  }
  return {};
}

export function useAuthSession() {
  const supabase = getSupabase();
  const [session, setSession] = useState<Session | null>(null);
  const [checking, setChecking] = useState<boolean>(!!supabase);

  useEffect(() => {
    if (!supabase) {
      setChecking(false);
      return;
    }
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setChecking(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    cloudEnabled: !!supabase,
    session,
    checking,
    signOut: async () => {
      await supabase?.auth.signOut();
    },
  };
}
