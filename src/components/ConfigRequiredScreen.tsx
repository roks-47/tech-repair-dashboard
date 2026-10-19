import React, { useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import { saveSupabaseConfig } from '../lib/supabase';

/**
 * Exibida quando o site não encontra a URL e a chave da Supabase.
 * O sistema NÃO abre sem a conexão com a nuvem (e sem login).
 */
export const ConfigRequiredScreen: React.FC = () => {
  const [url, setUrl] = useState('');
  const [key, setKey] = useState('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || !key.trim()) return;
    saveSupabaseConfig(url, key);
    window.location.reload();
  };

  const inputCls =
    'w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500';

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <form onSubmit={handleSave} className="w-full max-w-sm">
        <div className="flex flex-col items-center text-center mb-5">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mb-4">
            <ShieldAlert className="w-8 h-8 text-amber-400" />
          </div>
          <h1 className="text-xl font-bold text-white">Conexão necessária</h1>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            O sistema só abre conectado à Supabase e com login. A URL e a chave não foram encontradas
            neste site. Peça ao responsável para conferir as variáveis{' '}
            <span className="font-mono text-slate-300">VITE_SUPABASE_URL</span> e{' '}
            <span className="font-mono text-slate-300">VITE_SUPABASE_ANON_KEY</span> na Vercel.
          </p>
        </div>

        <details className="text-xs text-slate-400">
          <summary className="cursor-pointer hover:text-slate-200 mb-3">
            Configurar manualmente neste aparelho
          </summary>
          <div className="space-y-2">
            <input
              className={inputCls}
              placeholder="https://seu-projeto.supabase.co"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <input
              className={inputCls}
              placeholder="Chave anon / public"
              value={key}
              onChange={(e) => setKey(e.target.value)}
            />
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium"
            >
              Salvar e recarregar
            </button>
            <p className="text-[11px] text-slate-500">
              Use somente a chave <b>anon/public</b>. Nunca cole a chave service_role.
            </p>
          </div>
        </details>
      </form>
    </div>
  );
};
