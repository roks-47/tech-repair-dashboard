import React, { useMemo, useState } from 'react';
import { Search, X, Calendar, User, Smartphone, Gamepad2, Wrench, Inbox, ShieldCheck, ShieldOff } from 'lucide-react';
import type { Order } from '../types';
import { formatCurrency, formatPhone } from '../utils/formatters';
import { getDeliveryDate, getWarranty, formatDay, WARRANTY_DAYS } from '../lib/warranty';

interface HistoryPageProps {
  orders: Order[];
  onViewDetails: (order: Order) => void;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({ orders, onViewDetails }) => {
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<'finished' | 'cancelled'>('finished');
  const [warrantyFilter, setWarrantyFilter] = useState<'all' | 'active' | 'expired'>('all');

  const countFinished = useMemo(() => orders.filter((o) => o.status === 'entregue').length, [orders]);
  const countCancelled = useMemo(() => orders.filter((o) => o.status === 'cancelado').length, [orders]);

  // Histórico = ordens finalizadas (ou canceladas, na outra aba), da mais recente para a mais antiga
  const finished = useMemo(() => {
    const wanted = tab === 'finished' ? 'entregue' : 'cancelado';
    const list = orders.filter((o) => o.status === wanted);
    list.sort((a, b) => {
      const da = getDeliveryDate(a).getTime();
      const db = getDeliveryDate(b).getTime();
      return db - da;
    });
    return list;
  }, [orders, tab]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    const byWarranty =
      tab === 'finished' && warrantyFilter !== 'all'
        ? finished.filter((o) => getWarranty(o).active === (warrantyFilter === 'active'))
        : finished;
    if (!q) return byWarranty;
    return byWarranty.filter((o) =>
      o.client_name.toLowerCase().includes(q) ||
      o.client_phone.includes(q) ||
      `${o.device_brand} ${o.device_model}`.toLowerCase().includes(q) ||
      o.os_number.toString().includes(q) ||
      (o.technical_report || '').toLowerCase().includes(q) ||
      o.defect_reported.toLowerCase().includes(q)
    );
  }, [finished, query, tab, warrantyFilter]);

  return (
    <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-7 flex-1 w-full">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-sm sm:text-base font-bold text-slate-200">
          {tab === 'finished' ? 'Histórico de serviços finalizados' : 'Ordens canceladas'}
        </h2>
        <span className="text-xs text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full font-mono">
          {filtered.length}
        </span>
      </div>

      <div className="flex bg-slate-900/90 p-1 rounded-xl border border-slate-800 w-fit mb-4">
        <button
          onClick={() => setTab('finished')}
          className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
            tab === 'finished' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          Finalizadas ({countFinished})
        </button>
        <button
          onClick={() => setTab('cancelled')}
          className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
            tab === 'cancelled' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          Canceladas ({countCancelled})
        </button>
      </div>

      {tab === 'finished' && (
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-[11px] text-slate-500">Garantia de {WARRANTY_DAYS} dias:</span>
          {([
            ['all', 'Todas'],
            ['active', 'Na garantia'],
            ['expired', 'Vencidas'],
          ] as const).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setWarrantyFilter(id)}
              className={`px-3 py-1.5 rounded-full text-[11px] sm:text-xs font-medium border transition-all ${
                warrantyFilter === id
                  ? 'bg-blue-600 border-blue-500 text-white'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

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
              : tab === 'finished'
              ? 'As ordens aparecem aqui quando o status for "Entregue / Finalizado".'
              : 'Nenhuma ordem cancelada.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((o) => {
            const service = (o.technical_report || '').trim() || o.defect_reported;
            const doneAt = getDeliveryDate(o);
            const warranty = getWarranty(o);
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
                      {tab === 'finished' ? 'Entregue em ' : 'Cancelada em '}{formatDay(doneAt)}
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

                {tab === 'finished' && (
                  <div
                    className={`mt-3 inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-lg border ${
                      warranty.active
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    {warranty.active ? <ShieldCheck className="w-3.5 h-3.5" /> : <ShieldOff className="w-3.5 h-3.5" />}
                    {warranty.active
                      ? `Na garantia até ${formatDay(warranty.end)} (${warranty.daysLeft} dia${warranty.daysLeft === 1 ? '' : 's'})`
                      : `Garantia vencida em ${formatDay(warranty.end)}`}
                    {warranty.estimated && <span className="text-slate-500 font-normal">· data estimada</span>}
                  </div>
                )}

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
