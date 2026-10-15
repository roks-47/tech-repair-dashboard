import React from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  Wrench, 
  PackageCheck, 
  Layers 
} from 'lucide-react';
import type { Order } from '../types';
import { formatCurrency } from '../utils/formatters';

interface FinancialMetricsProps {
  orders: Order[];
}

export const FinancialMetrics: React.FC<FinancialMetricsProps> = ({ orders }) => {
  // Compute metrics
  const totalRevenue = orders.reduce((acc, curr) => {
    // Only count non-cancelled
    if (curr.status !== 'cancelado') {
      return acc + (curr.total_price || 0);
    }
    return acc;
  }, 0);

  const totalCost = orders.reduce((acc, curr) => {
    if (curr.status !== 'cancelado') {
      return acc + (curr.cost_parts || 0);
    }
    return acc;
  }, 0);

  const totalProfit = totalRevenue - totalCost;

  const activeOrders = orders.filter(
    (o) => o.status !== 'entregue' && o.status !== 'cancelado'
  ).length;

  const readyOrders = orders.filter((o) => o.status === 'pronto').length;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
      
      {/* Lucro Líquido */}
      <div className="col-span-2 sm:col-span-1 bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/30 rounded-2xl p-4 sm:p-5 relative overflow-hidden shadow-lg shadow-emerald-950/20">
        <div className="absolute -right-3 -bottom-3 w-20 h-20 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
            Lucro Líquido
          </span>
          <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-extrabold text-emerald-300 tracking-tight">
          {formatCurrency(totalProfit)}
        </div>
        <p className="text-[11px] text-slate-400 mt-1">
          Receita menos custo de peças
        </p>
      </div>

      {/* Faturamento Total & Custo Peças */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 relative overflow-hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Faturamento Total
          </span>
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
        <div className="text-xl sm:text-2xl font-bold text-slate-100">
          {formatCurrency(totalRevenue)}
        </div>
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/80 text-[11px]">
          <span className="text-slate-400">Peças compradas:</span>
          <span className="font-semibold text-rose-400">-{formatCurrency(totalCost)}</span>
        </div>
      </div>

      {/* Ordens em Andamento */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 relative overflow-hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Na Bancada / Ativas
          </span>
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
            <Wrench className="w-4 h-4" />
          </div>
        </div>
        <div className="text-xl sm:text-2xl font-bold text-slate-100">
          {activeOrders} <span className="text-xs font-normal text-slate-400">aparelhos</span>
        </div>
        <div className="flex items-center gap-1.5 mt-2 text-[11px] text-slate-400">
          <Layers className="w-3.5 h-3.5 text-indigo-400" />
          <span>Aguardando ou em manutenção</span>
        </div>
      </div>

      {/* Prontos para Retirada */}
      <div className={`rounded-2xl p-4 sm:p-5 border transition-all ${
        readyOrders > 0 
          ? "bg-slate-900/90 border-cyan-500/40 shadow-lg shadow-cyan-950/30" 
          : "bg-slate-900/80 border-slate-800"
      }`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
            Prontos p/ Retirar
          </span>
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
            <PackageCheck className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-xl sm:text-2xl font-bold text-slate-100">
            {readyOrders}
          </span>
          {readyOrders > 0 && (
            <span className="text-[11px] font-medium text-cyan-400 bg-cyan-500/20 px-2 py-0.5 rounded-full animate-pulse">
              Avisar clientes via WhatsApp
            </span>
          )}
        </div>
        <p className="text-[11px] text-slate-400 mt-1">
          Aguardando cliente vir buscar
        </p>
      </div>

    </div>
  );
};
