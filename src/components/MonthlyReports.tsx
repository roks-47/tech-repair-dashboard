import React, { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, Download, TrendingUp, Wrench, Smartphone } from 'lucide-react';
import type { Order } from '../types';
import { formatCurrency } from '../utils/formatters';
import { getDeliveryDate, formatDay } from '../lib/warranty';
import { fetchResalePhones, phoneProfit, totalCost, formatIsoDate, type ResalePhone } from '../lib/resale';

interface MonthlyReportsProps {
  orders: Order[];
  onViewDetails: (order: Order) => void;
}

interface MonthReport {
  key: string; // YYYY-MM
  orders: Order[];
  sold: ResalePhone[];
}

const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

const monthLabel = (key: string) => {
  const [y, m] = key.split('-').map(Number);
  const text = new Date(y, m - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  return text.charAt(0).toUpperCase() + text.slice(1);
};

const money = (n: number) => n.toFixed(2).replace('.', ',');
const csvCell = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;

const orderProfit = (o: Order) => (o.total_price || 0) - (o.cost_parts || 0);

export const MonthlyReports: React.FC<MonthlyReportsProps> = ({ orders, onViewDetails }) => {
  const [phones, setPhones] = useState<ResalePhone[]>([]);
  const currentKey = monthKey(new Date());
  const [open, setOpen] = useState<string[]>([currentKey]);

  // Revendas entram no resumo se a tabela existir; se não existir, segue só com reparos
  useEffect(() => {
    let active = true;
    fetchResalePhones().then((res) => {
      if (active) setPhones(res.phones);
    });
    return () => {
      active = false;
    };
  }, []);

  const reports = useMemo(() => {
    const map = new Map<string, MonthReport>();
    const ensure = (key: string) => {
      if (!map.has(key)) map.set(key, { key, orders: [], sold: [] });
      return map.get(key)!;
    };
    orders
      .filter((o) => o.status === 'entregue')
      .forEach((o) => ensure(monthKey(getDeliveryDate(o))).orders.push(o));
    phones
      .filter((p) => p.status === 'vendido')
      .forEach((p) => {
        const key = (p.sold_date || p.updated_at || '').slice(0, 7);
        if (key) ensure(key).sold.push(p);
      });
    ensure(currentKey);
    return Array.from(map.values()).sort((a, b) => b.key.localeCompare(a.key));
  }, [orders, phones, currentKey]);

  const toggle = (key: string) =>
    setOpen((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));

  const downloadCsv = (r: MonthReport) => {
    const rows: (string | number)[][] = [
      ['Tipo', 'Data', 'Referência', 'Cliente', 'Descrição', 'Faturamento', 'Custo', 'Lucro'],
    ];
    r.orders.forEach((o) =>
      rows.push([
        'Reparo',
        formatDay(getDeliveryDate(o)),
        `OS #${o.os_number}`,
        o.client_name,
        `${o.device_brand} ${o.device_model} - ${(o.technical_report || '').trim() || o.defect_reported}`,
        money(o.total_price || 0),
        money(o.cost_parts || 0),
        money(orderProfit(o)),
      ])
    );
    r.sold.forEach((p) =>
      rows.push([
        'Revenda',
        formatIsoDate(p.sold_date),
        p.imei,
        '',
        `${p.brand} ${p.model}`,
        money(p.resale_price),
        money(totalCost(p)),
        money(phoneProfit(p)),
      ])
    );
    const csv = '\uFEFF' + rows.map((row) => row.map(csvCell).join(';')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-${r.key}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {reports.map((r) => {
        const revenue = r.orders.reduce((a, o) => a + (o.total_price || 0), 0);
        const partsCost = r.orders.reduce((a, o) => a + (o.cost_parts || 0), 0);
        const repairProfit = revenue - partsCost;
        const resaleProfit = r.sold.reduce((a, p) => a + phoneProfit(p), 0);
        const totalProfit = repairProfit + resaleProfit;
        const isOpen = open.includes(r.key);

        return (
          <section key={r.key} className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-slate-800">
              <button onClick={() => toggle(r.key)} className="flex items-center gap-2 text-left flex-1 min-w-0">
                {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                <h3 className="font-bold text-white text-sm sm:text-base">{monthLabel(r.key)}</h3>
                {r.key === currentKey && (
                  <span className="text-[10px] text-cyan-300 bg-cyan-500/10 border border-cyan-500/30 px-2 py-0.5 rounded-full">mês atual</span>
                )}
              </button>
              <button
                onClick={() => downloadCsv(r)}
                title="Baixar relatório do mês (planilha CSV)"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
              >
                <Download className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Baixar CSV</span>
              </button>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-4">
              <div className="col-span-2 lg:col-span-1 bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/30 rounded-xl p-3">
                <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-emerald-400">
                  Lucro do mês <TrendingUp className="w-4 h-4" />
                </div>
                <div className={`text-2xl font-extrabold ${totalProfit >= 0 ? 'text-emerald-300' : 'text-rose-400'}`}>
                  {formatCurrency(totalProfit)}
                </div>
                {r.sold.length > 0 && (
                  <div className="text-[11px] text-slate-500">
                    reparos {formatCurrency(repairProfit)} + revendas {formatCurrency(resaleProfit)}
                  </div>
                )}
              </div>
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3">
                <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-slate-400">
                  Reparos <Wrench className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="text-xl font-bold text-slate-100">{r.orders.length}</div>
              </div>
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3">
                <div className="text-[11px] uppercase tracking-wider text-slate-400">Faturamento</div>
                <div className="text-xl font-bold text-slate-100">{formatCurrency(revenue)}</div>
                <div className="text-[11px] text-rose-400">peças -{formatCurrency(partsCost)}</div>
              </div>
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3">
                <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-slate-400">
                  Revendas <Smartphone className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="text-xl font-bold text-slate-100">{r.sold.length}</div>
                <div className="text-[11px] text-slate-500">lucro {formatCurrency(resaleProfit)}</div>
              </div>
            </div>

            {isOpen && (
              <div className="px-4 pb-4 space-y-1.5">
                {r.orders.length === 0 && r.sold.length === 0 && (
                  <p className="text-xs text-slate-500">Nenhum serviço finalizado neste mês.</p>
                )}
                {r.orders
                  .slice()
                  .sort((a, b) => getDeliveryDate(b).getTime() - getDeliveryDate(a).getTime())
                  .map((o) => (
                    <div
                      key={o.id}
                      onClick={() => onViewDetails(o)}
                      className="flex items-center justify-between gap-3 bg-slate-950/50 hover:bg-slate-950 border border-slate-800/70 rounded-xl px-3 py-2 cursor-pointer"
                    >
                      <div className="min-w-0">
                        <div className="text-xs text-slate-200 font-medium truncate">
                          {o.client_name} · {o.device_brand} {o.device_model}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">
                          {formatDay(getDeliveryDate(o))} · OS #{o.os_number} · {(o.technical_report || '').trim() || o.defect_reported}
                        </div>
                      </div>
                      <span className="text-xs font-bold text-emerald-300 shrink-0">{formatCurrency(orderProfit(o))}</span>
                    </div>
                  ))}
                {r.sold.map((p) => (
                  <div key={p.id} className="flex items-center justify-between gap-3 bg-cyan-950/20 border border-cyan-500/20 rounded-xl px-3 py-2">
                    <div className="min-w-0">
                      <div className="text-xs text-slate-200 font-medium truncate">Revenda · {p.brand} {p.model}</div>
                      <div className="text-[11px] text-slate-500">Vendido em {formatIsoDate(p.sold_date)}</div>
                    </div>
                    <span className="text-xs font-bold text-emerald-300 shrink-0">{formatCurrency(phoneProfit(p))}</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
};
