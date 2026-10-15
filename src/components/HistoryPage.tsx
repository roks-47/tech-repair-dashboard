import React, { useMemo, useState } from 'react';
import { Search, X, Calendar, User, Smartphone, Gamepad2, Wrench, Inbox } from 'lucide-react';
import type { Order } from '../types';
import { formatCurrency, formatShortDate, formatPhone } from '../utils/formatters';

interface HistoryPageProps {
  orders: Order[];
  onViewDetails: (order: Order) => void;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({ orders, onViewDetails }) => {
  const [query, setQuery] = useState('');

  // Histórico = ordens já entregues/finalizadas, da mais recente para a mais antiga
  const finished = useMemo(() => {
    const list = orders.filter((o) => o.status === 'entregue');
    list.sort((a, b) => {
      const da = new Date((a as any).updated_at || a.created_at).getTime();
      const db = new Date((b as any).updated_at || b.created_at).getTime();
      return db - da;
    });
    return list;
  }, [orders]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return finished;
    return finished.filter((o) =>
      o.client_name.toLowerCase().includes(q) ||
      o.client_phone.includes(q) ||
      `${o.device_brand} ${o.device_model}`.toLowerCase().includes(q) ||
      o.os_number.toString().includes(q) ||
      (o.technical_report || '').toLowerCase().includes(q) ||
      o.defect_reported.toLowerCase().includes(q)
    );
  }, [finished, query]);

  return (
    <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-7 flex-1 w-full">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-sm sm:text-base font-bold text-slate-200">Histórico de serviços finalizados</h2>
        <span className="text-xs text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full font-mono">
          {filtered.length}
        </span>
      </div>

      <div className="relative mb-5">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          placeholder="Buscar por cliente, telefone, aparelho, serviço ou OS #..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-10 pr-9 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-10 text-center max-w-lg mx-auto my-8">
          <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-400 mb-4 mx-auto">
            <Inbox className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-white mb-1">Nenhum serviço no histórico</h3>
          <p className="text-xs sm:text-sm text-slate-400">
            {query
              ? 'Nenhum resultado para essa busca.'
              : 'As ordens aparecem aqui quando o status for "Entregue / Finalizado".'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((o) => {
            const service = (o.technical_report || '').trim() || o.defect_reported;
            const doneAt = (o as any).updated_at || o.created_at;
            return (
              <div
                key={o.id}
                onClick={() => onViewDetails(o)}
                className="bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 cursor-pointer transition-all"
              >
                <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <User className="w-4 h-4 text-slate-500 shrink-0" />
                    <span className="font-bold text-white truncate">{o.client_name}</span>
                    <span className="text-[11px] text-slate-500 hidden sm:inline">
                      ({formatPhone(o.client_phone)})
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatShortDate(doneAt)}
                    </span>
                    <span className="font-mono font-bold bg-slate-800/80 px-2 py-0.5 rounded-md">
                      OS #{o.os_number}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-300 mb-1">
                  {o.device_type === 'celular' ? (
                    <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
                  ) : o.device_type === 'videogame' ? (
                    <Gamepad2 className="w-3.5 h-3.5 text-fuchsia-400" />
                  ) : (
                    <Wrench className="w-3.5 h-3.5 text-slate-400" />
                  )}
                  <span className="font-medium">{o.device_brand} {o.device_model}</span>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">
                  <span className="text-slate-500 font-medium">Serviço: </span>
                  {service}
                </p>

                <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
                  <span>Técnico: {o.technician_name}</span>
                  <span className="font-bold text-emerald-300 text-xs">{formatCurrency(o.total_price)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
};
