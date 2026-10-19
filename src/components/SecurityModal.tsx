import React, { useCallback, useEffect, useState } from 'react';
import { X, ShieldCheck, ShieldOff } from 'lucide-react';
import { getSupabase } from '../lib/supabase';

interface SecurityModalProps {
  onClose: () => void;
  forced?: boolean;
  onDone?: () => void;
  onSignOut?: () => void;
}

interface EnrollData {
  factorId: string;
  qr: string;
  secret: string;
}

export const SecurityModal: React.FC<SecurityModalProps> = ({ onClose, forced, onDone, onSignOut }) => {
  const [loading, setLoading] = useState(true);
  const [activeFactorId, setActiveFactorId] = useState<string | null>(null);
  const [enroll, setEnroll] = useState<EnrollData | null>(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase) {
      setLoading(false);
      return;
    }
    const { data, error: listError } = await supabase.auth.mfa.listFactors();
    if (listError) setError(listError.message);
    setActiveFactorId(data?.totp?.[0]?.id ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const startEnroll = async () => {
    const supabase = getSupabase();
    if (!supabase) return;
    setBusy(true);
    setError(null);
    setMessage(null);

    // Limpa tentativas anteriores que não foram concluídas
    const { data: list } = await supabase.auth.mfa.listFactors();
    for (const f of list?.all ?? []) {
      if (f.status === 'unverified') {
        await supabase.auth.mfa.unenroll({ factorId: f.id });
      }
    }

    const { data, error: enrollError } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
      friendlyName: `Celular ${Date.now()}`,
    });
    setBusy(false);
    if (enrollError || !data) {
      setError(
        enrollError?.message ||
          'Não foi possível iniciar. Confira se o MFA (TOTP) está ativado em Authentication na Supabase.'
      );
      return;
    }
    setEnroll({ factorId: data.id, qr: data.totp.qr_code, secret: data.totp.secret });
  };

  const confirmEnroll = async () => {
    const supabase = getSupabase();
    if (!supabase || !enroll) return;
    if (code.length !== 6) {
      setError('Digite os 6 dígitos do aplicativo.');
      return;
    }
    setBusy(true);
    setError(null);
    const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
      factorId: enroll.factorId,
      code,
    });
    setBusy(false);
    if (verifyError) {
      setError('Código incorreto. Confira o código mais recente do aplicativo.');
      setCode('');
      return;
    }
    setEnroll(null);
    setCode('');
    setMessage('Verificação em duas etapas ativada! No próximo login será pedido o código.');
    refresh();
    onDone?.();
  };

  const disable = async () => {
    const supabase = getSupabase();
    if (!supabase || !activeFactorId) return;
    if (!window.confirm('Desativar a verificação em duas etapas desta conta?')) return;
    setBusy(true);
    setError(null);
    const { error: unenrollError } = await supabase.auth.mfa.unenroll({ factorId: activeFactorId });
    setBusy(false);
    if (unenrollError) {
      setError(unenrollError.message);
      return;
    }
    setMessage('Verificação em duas etapas desativada.');
    refresh();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" /> Segurança da conta
          </h2>
          {!forced && (
            <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {forced && (
          <p className="text-xs text-amber-200 bg-amber-950/40 border border-amber-500/30 rounded-lg px-3 py-2 mb-3">
            Por segurança dos dados dos clientes, a verificação em duas etapas é obrigatória.
            Ative agora para continuar.
          </p>
        )}

        {error && (
          <p className="text-xs text-rose-400 bg-rose-950/40 border border-rose-500/30 rounded-lg px-3 py-2 mb-3">
            {error}
          </p>
        )}
        {message && (
          <p className="text-xs text-emerald-300 bg-emerald-950/40 border border-emerald-500/30 rounded-lg px-3 py-2 mb-3">
            {message}
          </p>
        )}

        {loading ? (
          <p className="text-sm text-slate-400">Carregando...</p>
        ) : enroll ? (
          <div className="space-y-3">
            <p className="text-xs text-slate-300">
              1. Abra o aplicativo autenticador (Google Authenticator, Microsoft Authenticator, Authy)
              e escaneie o QR code.
            </p>
            <div className="bg-white rounded-xl p-3 w-fit mx-auto">
              <img src={enroll.qr} alt="QR code do autenticador" className="w-44 h-44" />
            </div>
            <p className="text-[11px] text-slate-500 text-center break-all">
              Sem câmera? Digite esta chave no aplicativo:{' '}
              <span className="font-mono text-slate-300">{enroll.secret}</span>
            </p>
            <p className="text-xs text-slate-300">2. Digite o código de 6 dígitos que aparece no aplicativo:</p>
            <input
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              className="w-full text-center tracking-[0.5em] text-xl font-mono bg-slate-950 border border-slate-800 rounded-xl py-2.5 text-slate-100 placeholder-slate-700 focus:outline-none focus:border-blue-500"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setEnroll(null);
                  setCode('');
                  setError(null);
                }}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={confirmEnroll}
                disabled={busy}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-sm font-medium"
              >
                {busy ? 'Verificando...' : 'Ativar'}
              </button>
            </div>
          </div>
        ) : activeFactorId ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-emerald-300">
              <ShieldCheck className="w-4 h-4" /> Verificação em duas etapas ativada
            </div>
            <p className="text-xs text-slate-400">
              Ao entrar, além da senha será pedido o código do aplicativo autenticador.
            </p>
            <button
              onClick={disable}
              disabled={busy}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-rose-900/60 text-slate-300 hover:text-rose-200 text-sm disabled:opacity-60"
            >
              Desativar
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-amber-300">
              <ShieldOff className="w-4 h-4" /> Verificação em duas etapas desativada
            </div>
            <p className="text-xs text-slate-400">
              Recomendado: mesmo que alguém descubra sua senha, não consegue entrar sem o código do seu celular.
            </p>
            <button
              onClick={startEnroll}
              disabled={busy}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-sm font-medium"
            >
              {busy ? 'Preparando...' : 'Ativar verificação em duas etapas'}
            </button>
          </div>
        )}

        {forced && onSignOut && (
          <button onClick={onSignOut} className="mt-4 text-xs text-slate-500 hover:text-slate-300">
            Sair
          </button>
        )}
      </div>
    </div>
  );
};
