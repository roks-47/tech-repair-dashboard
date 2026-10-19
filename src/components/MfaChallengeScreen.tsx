import React, { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { getSupabase } from '../lib/supabase';

interface MfaChallengeScreenProps {
  onVerified: () => void;
  onSignOut: () => void;
}

export const MfaChallengeScreen: React.FC<MfaChallengeScreenProps> = ({ onVerified, onSignOut }) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = getSupabase();
    if (!supabase) return;
    if (code.length !== 6) {
      setError('Digite os 6 dígitos do aplicativo.');
      return;
    }
    setLoading(true);
    setError(null);

    const { data: factors, error: listError } = await supabase.auth.mfa.listFactors();
    const factor = factors?.totp?.[0];
    if (listError || !factor) {
      setLoading(false);
      setError(listError?.message || 'Nenhum autenticador encontrado para este usuário.');
      return;
    }

    const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
      factorId: factor.id,
      code,
    });
    setLoading(false);
    if (verifyError) {
      setError('Código incorreto ou expirado. Tente o código mais recente.');
      setCode('');
      return;
    }
    onVerified();
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-xl shadow-indigo-600/30 mb-4 mx-auto">
          <ShieldCheck className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-xl font-bold text-white">Verificação em duas etapas</h1>
        <p className="text-xs text-slate-400 mt-1 mb-6">
          Digite o código de 6 dígitos do seu aplicativo autenticador
        </p>

        <input
          autoFocus
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
          placeholder="000000"
          className="w-full text-center tracking-[0.5em] text-2xl font-mono bg-slate-900 border border-slate-800 rounded-xl py-3 text-slate-100 placeholder-slate-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />

        {error && (
          <p className="text-xs text-rose-400 bg-rose-950/40 border border-rose-500/30 rounded-lg px-3 py-2 mt-3">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-4 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-60 text-white font-medium text-sm"
        >
          {loading ? 'Verificando...' : 'Confirmar'}
        </button>
        <button
          type="button"
          onClick={onSignOut}
          className="mt-3 text-xs text-slate-500 hover:text-slate-300"
        >
          Sair e entrar com outro usuário
        </button>
      </form>
    </div>
  );
};
