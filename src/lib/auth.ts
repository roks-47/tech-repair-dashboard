import { useEffect, useRef, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { getSupabase } from './supabase';

// Exige 2FA de todos os usuários: quem ainda não ativou é obrigado a ativar antes de entrar
export const REQUIRE_MFA = true;

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
  const [needsMfa, setNeedsMfa] = useState(false);
  const [needsEnroll, setNeedsEnroll] = useState(false);
  const [aalFailed, setAalFailed] = useState(false);
  const [aalReady, setAalReady] = useState(true);
  const hadSession = useRef(false);

  // Confere se o usuário tem 2FA ativo e ainda não digitou o código nesta sessão
  const checkAal = async () => {
    if (!supabase) {
      setAalReady(true);
      return;
    }
    const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (error || !data) {
      // Se não deu para verificar, NÃO libera o sistema
      setAalFailed(true);
      setAalReady(true);
      return;
    }
    setAalFailed(false);
    setNeedsMfa(data.nextLevel === 'aal2' && data.currentLevel !== 'aal2');
    setNeedsEnroll(data.nextLevel === 'aal1');
    setAalReady(true);
  };

  useEffect(() => {
    if (!supabase) {
      setChecking(false);
      return;
    }
    let active = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      setSession(data.session);
      hadSession.current = !!data.session;
      if (data.session) await checkAal();
      if (active) setChecking(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (!newSession) {
        hadSession.current = false;
        setNeedsMfa(false);
        setNeedsEnroll(false);
        setAalFailed(false);
        setAalReady(true);
        return;
      }
      if (!hadSession.current) {
        hadSession.current = true;
        setAalReady(false);
      }
      // não chamar a Supabase direto dentro deste callback
      setTimeout(() => {
        checkAal();
      }, 0);
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
    needsMfa,
    needsEnroll,
    aalFailed,
    aalReady,
    recheckAal: checkAal,
    signOut: async () => {
      await supabase?.auth.signOut();
    },
  };
}

/**
 * Desconecta automaticamente após X minutos sem uso (mouse, teclado, toque ou rolagem).
 * Também confere ao voltar para a aba/aparelho, caso o celular tenha ficado bloqueado.
 */
export function useIdleSignOut(enabled: boolean, onIdle: () => void, minutes = 30) {
  const lastActivity = useRef<number>(Date.now());
  const onIdleRef = useRef(onIdle);
  onIdleRef.current = onIdle;

  useEffect(() => {
    if (!enabled) return;
    const limit = minutes * 60 * 1000;
    lastActivity.current = Date.now();

    const markActive = () => {
      lastActivity.current = Date.now();
    };
    const check = () => {
      if (Date.now() - lastActivity.current >= limit) {
        onIdleRef.current();
      }
    };
    const onVisible = () => {
      if (document.visibilityState === 'visible') check();
    };

    const events = ['mousemove', 'keydown', 'click', 'touchstart', 'scroll'];
    events.forEach((e) => window.addEventListener(e, markActive, { passive: true }));
    document.addEventListener('visibilitychange', onVisible);
    const interval = setInterval(check, 30000);

    return () => {
      events.forEach((e) => window.removeEventListener(e, markActive));
      document.removeEventListener('visibilitychange', onVisible);
      clearInterval(interval);
    };
  }, [enabled, minutes]);
}
