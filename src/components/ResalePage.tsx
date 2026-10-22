import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Search, X, Plus, Trash2, Edit2, Save, Smartphone, AlertTriangle,
  Eye, EyeOff, CheckCircle2, TrendingUp, Package, Wallet,
} from 'lucide-react';
import {
  fetchResalePhones, createResalePhone, updateResalePhone, deleteResalePhone,
  subscribeToResale, totalCost, phoneProfit, isValidCpf, isValidImei,
  maskCpfInput, hideCpf, onlyDigits, todayLocal, formatIsoDate,
  type ResalePhone, type ResaleInput,
} from '../lib/resale';
import { formatCurrency } from '../utils/formatters';

type FormState = {
  brand: string; model: string; imei: string;
  purchase_price: string; parts_cost: string; parts_notes: string; resale_price: string;
  status: 'estoque' | 'vendido';
  seller_name: string; seller_cpf: string; seller_rg: string; seller_phone: string; seller_address: string;
  purchase_date: string; sold_date: string; notes: string;
};

const emptyForm = (): FormState => ({
  brand: '', model: '', imei: '',
  purchase_price: '', parts_cost: '', parts_notes: '', resale_price: '',
  status: 'estoque',
  seller_name: '', seller_cpf: '', seller_rg: '', seller_phone: '', seller_address: '',
  purchase_date: todayLocal(), sold_date: '', notes: '',
});

const toNumber = (v: string) => {
  const n = Number((v || '0').replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : NaN;
};
// aceita "1500", "1500,50" e "1.500,50"; se vier "1500.50" (ponto decimal) também entende
const parseMoney = (v: string) => {
  const s = (v || '').trim();
  if (!s) return 0;
  if (/^\d+\.\d{1,2}$/.test(s)) return Number(s);
  return toNumber(s);
};

const moneyStr = (n: number) => (n ? String(n).replace('.', ',') : '');

export const ResalePage: React.FC = () => {
  const [phones, setPhones] = useState<ResalePhone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [tab, setTab] = useState<'estoque' | 'vendido' | 'todos'>('estoque');
  const [query, setQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [revealed, setRevealed] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    const res = await fetchResalePhones();
    setPhones(res.phones);
    setError(res.error || null);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const unsub = subscribeToResale(load);
    const onFocus = () => load();
    window.addEventListener('focus', onFocus);
    return () => {
      unsub();
      window.removeEventListener('focus', onFocus);
    };
  }, [load]);

  const stats = useMemo(() => {
    const stock = phones.filter((p) => p.status === 'estoque');
    const sold = phones.filter((p) => p.status === 'vendido');
    return {
      stockCount: stock.length,
      stockInvested: stock.reduce((a, p) => a + totalCost(p), 0),
      stockExpected: stock.reduce((a, p) => a + phoneProfit(p), 0),
      soldCount: sold.length,
      soldProfit: sold.reduce((a, p) => a + phoneProfit(p), 0),
    };
  }, [phones]);

  const list = useMemo(() => {
    const q = query.toLowerCase().trim();
    const qDigits = onlyDigits(query);
    return phones.filter((p) => {
      if (tab !== 'todos' && p.status !== tab) return false;
      if (!q) return true;
      return (
        `${p.brand} ${p.model}`.toLowerCase().includes(q) ||
        p.seller_name.toLowerCase().includes(q) ||
        (qDigits.length >= 4 && (p.imei.includes(qDigits) || onlyDigits(p.seller_cpf).includes(qDigits)))
      );
    });
  }, [phones, tab, query]);

  const openNew = () => {
    setEditingId(null);
    setForm(emptyForm());
    setError(null);
    setShowForm(true);
  };

  const openEdit = (p: ResalePhone) => {
    setEditingId(p.id);
    setForm({
      brand: p.brand, model: p.model, imei: p.imei,
      purchase_price: moneyStr(p.purchase_price), parts_cost: moneyStr(p.parts_cost),
      parts_notes: p.parts_notes, resale_price: moneyStr(p.resale_price),
      status: p.status,
      seller_name: p.seller_name, seller_cpf: maskCpfInput(p.seller_cpf), seller_rg: p.seller_rg,
      seller_phone: p.seller_phone, seller_address: p.seller_address,
      purchase_date: p.purchase_date, sold_date: p.sold_date || '', notes: p.notes,
    });
    setError(null);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSave = async () => {
    if (!form.model.trim()) return setError('Informe o modelo do aparelho.');
    if (!form.seller_name.trim()) return setError('Informe o nome do antigo dono.');
    if (!isValidCpf(form.seller_cpf)) return setError('CPF do antigo dono inválido. Confira os números.');
    if (!isValidImei(form.imei)) {
      return setError('IMEI inválido. Digite os 15 dígitos (disque *#06# no aparelho para ver).');
    }

    const purchase = parseMoney(form.purchase_price);
    const parts = parseMoney(form.parts_cost);
    const resale = parseMoney(form.resale_price);
    if ([purchase, parts, resale].some((n) => !Number.isFinite(n) || n < 0)) {
      return setError('Confira os valores em dinheiro (ex: 850,00).');
    }

    const imei = onlyDigits(form.imei);
    const dup = phones.find((p) => p.imei === imei && p.id !== editingId);
    if (dup && !window.confirm(`Este IMEI já está cadastrado (${dup.brand} ${dup.model}, ${formatIsoDate(dup.purchase_date)}). Cadastrar mesmo assim?`)) {
      return;
    }

    const input: ResaleInput = {
      brand: form.brand.trim(),
      model: form.model.trim(),
      imei,
      purchase_price: purchase,
      parts_cost: parts,
      parts_notes: form.parts_notes.trim(),
      resale_price: resale,
      status: form.status,
      seller_name: form.seller_name.trim(),
      seller_cpf: onlyDigits(form.seller_cpf),
      seller_rg: form.seller_rg.trim(),
      seller_phone: form.seller_phone.trim(),
      seller_address: form.seller_address.trim(),
      purchase_date: form.purchase_date || todayLocal(),
      sold_date: form.status === 'vendido' ? form.sold_date || todayLocal() : null,
      notes: form.notes.trim(),
    };

    setSaving(true);
    const res = editingId ? await updateResalePhone(editingId, input) : await createResalePhone(input);
    setSaving(false);
    if (res.error) return setError(res.error);

    setError(null);
    setShowForm(false);
    setEditingId(null);
    load();
  };

  const markSold = async (p: ResalePhone) => {
    const answer = window.prompt('Preço final da venda (R$):', moneyStr(p.resale_price));
    if (answer === null) return;
    const price = parseMoney(answer);
    if (!Number.isFinite(price) || price < 0) return setError('Valor de venda inválido.');
    const res = await updateResalePhone(p.id, {
      status: 'vendido',
      resale_price: price,
      sold_date: todayLocal(),
    });
    if (res.error) setError(res.error);
    else load();
  };

  const handleDelete = async (p: ResalePhone) => {
    if (!window.confirm(`Excluir ${p.brand} ${p.model}? Os dados do antigo dono também serão apagados.`)) return;
    const res = await deleteResalePhone(p.id);
    if (res.error) setError(res.error);
    else load();
  };

  const toggleReveal = (id: string) =>
    setRevealed((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const inputCls =
    'w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500';
  const labelCls = 'block text-[11px] text-slate-400 mb-1';
  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const formTotal = parseMoney(form.purchase_price) + parseMoney(form.parts_cost);
  const formProfit = parseMoney(form.resale_price) - formTotal;

  return (
    <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-7 flex-1 w-full">
      <div className="flex items-center justify-between mb-4 gap-2">
        <h2 className="text-sm sm:text-base font-bold text-slate-200">Revenda de celulares</h2>
        <button
          onClick={openNew}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium text-xs sm:text-sm shadow-md active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Novo aparelho</span>
        </button>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-slate-400 mb-1">
            Em estoque <Package className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-xl font-bold text-slate-100">{stats.stockCount}</div>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-slate-400 mb-1">
            Investido no estoque <Wallet className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-bold text-slate-100">{formatCurrency(stats.stockInvested)}</div>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-slate-400 mb-1">
            Lucro previsto <TrendingUp className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-xl font-bold text-cyan-300">{formatCurrency(stats.stockExpected)}</div>
        </div>
        <div className="bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/30 rounded-2xl p-4">
          <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-emerald-400 mb-1">
            Lucro realizado <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="text-xl font-bold text-emerald-300">{formatCurrency(stats.soldProfit)}</div>
          <div className="text-[11px] text-slate-500">{stats.soldCount} vendido(s)</div>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 bg-amber-950/60 border border-amber-500/40 text-amber-200 text-xs rounded-xl p-3 mb-4">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Formulário */}
      {showForm && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 mb-5 space-y-4">
          <h3 className="text-sm font-bold text-white">{editingId ? 'Editar aparelho' : 'Cadastrar aparelho'}</h3>

          <div>
            <div className="text-[11px] uppercase tracking-wider text-cyan-300 mb-2">Aparelho</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div><label className={labelCls}>Marca</label>
                <input className={inputCls} placeholder="Ex: Apple" value={form.brand} onChange={set('brand')} /></div>
              <div><label className={labelCls}>Modelo *</label>
                <input className={inputCls} placeholder="Ex: iPhone 11 128GB" value={form.model} onChange={set('model')} /></div>
              <div><label className={labelCls}>IMEI * (*#06#)</label>
                <input inputMode="numeric" className={inputCls} placeholder="15 dígitos" value={form.imei}
                  onChange={(e) => setForm((f) => ({ ...f, imei: onlyDigits(e.target.value).slice(0, 16) }))} /></div>
            </div>
          </div>

          <div>
            <div className="text-[11px] uppercase tracking-wider text-cyan-300 mb-2">Valores</div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div><label className={labelCls}>Pago no aparelho (R$)</label>
                <input inputMode="decimal" className={inputCls} placeholder="0,00" value={form.purchase_price} onChange={set('purchase_price')} /></div>
              <div><label className={labelCls}>Gasto em peças (R$)</label>
                <input inputMode="decimal" className={inputCls} placeholder="0,00" value={form.parts_cost} onChange={set('parts_cost')} /></div>
              <div><label className={labelCls}>Preço de revenda (R$)</label>
                <input inputMode="decimal" className={inputCls} placeholder="0,00" value={form.resale_price} onChange={set('resale_price')} /></div>
              <div className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2">
                <div className="text-[11px] text-slate-400">Total gasto / lucro</div>
                <div className="text-xs text-slate-300">{formatCurrency(formTotal)}</div>
                <div className={`text-sm font-bold ${formProfit >= 0 ? 'text-emerald-300' : 'text-rose-400'}`}>{formatCurrency(formProfit)}</div>
              </div>
            </div>
            <div className="mt-3">
              <label className={labelCls}>Peças trocadas (descrição)</label>
              <input className={inputCls} placeholder="Ex: tela, bateria" value={form.parts_notes} onChange={set('parts_notes')} />
            </div>
          </div>

          <div>
            <div className="text-[11px] uppercase tracking-wider text-cyan-300 mb-2">Antigo dono (comprovação de origem)</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="lg:col-span-2"><label className={labelCls}>Nome completo *</label>
                <input className={inputCls} value={form.seller_name} onChange={set('seller_name')} /></div>
              <div><label className={labelCls}>CPF *</label>
                <input inputMode="numeric" className={inputCls} placeholder="000.000.000-00" value={form.seller_cpf}
                  onChange={(e) => setForm((f) => ({ ...f, seller_cpf: maskCpfInput(e.target.value) }))} /></div>
              <div><label className={labelCls}>RG</label>
                <input className={inputCls} value={form.seller_rg} onChange={set('seller_rg')} /></div>
              <div><label className={labelCls}>Telefone</label>
                <input className={inputCls} value={form.seller_phone} onChange={set('seller_phone')} /></div>
              <div className="lg:col-span-3"><label className={labelCls}>Endereço</label>
                <input className={inputCls} value={form.seller_address} onChange={set('seller_address')} /></div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div><label className={labelCls}>Data da compra</label>
              <input type="date" className={inputCls} value={form.purchase_date} onChange={set('purchase_date')} /></div>
            <div><label className={labelCls}>Situação</label>
              <select className={inputCls} value={form.status} onChange={set('status')}>
                <option value="estoque">Em estoque</option>
                <option value="vendido">Vendido</option>
              </select></div>
            {form.status === 'vendido' && (
              <div><label className={labelCls}>Data da venda</label>
                <input type="date" className={inputCls} value={form.sold_date} onChange={set('sold_date')} /></div>
            )}
          </div>

          <div><label className={labelCls}>Observações</label>
            <textarea rows={2} className={inputCls} value={form.notes} onChange={set('notes')} /></div>

          <div className="flex justify-end gap-2">
            <button onClick={() => { setShowForm(false); setEditingId(null); }}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs sm:text-sm">Fechar</button>
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-xs sm:text-sm font-medium">
              <Save className="w-4 h-4" />{saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-2.5 mb-5">
        <div className="flex bg-slate-900/90 p-1 rounded-xl border border-slate-800 w-fit">
          {([['estoque', 'Em estoque'], ['vendido', 'Vendidos'], ['todos', 'Todos']] as const).map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                tab === id ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'}`}>
              {label}
            </button>
          ))}
        </div>
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input type="text" placeholder="Buscar por modelo, IMEI, nome ou CPF do antigo dono..."
            value={query} onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-10 pr-9 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500" />
          {query && (
            <button onClick={() => setQuery('')} className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : list.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-10 text-center max-w-lg mx-auto my-8">
          <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-400 mb-4 mx-auto">
            <Smartphone className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-white mb-1">Nenhum aparelho aqui</h3>
          <p className="text-xs sm:text-sm text-slate-400">Clique em "Novo aparelho" para cadastrar uma compra para revenda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {list.map((p) => {
            const profit = phoneProfit(p);
            const show = revealed.has(p.id);
            return (
              <div key={p.id} className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <h3 className="font-bold text-white truncate">{p.brand} {p.model}</h3>
                    <div className="text-[11px] font-mono text-slate-400">IMEI {p.imei || '—'}</div>
                  </div>
                  <span className={`shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-lg border ${
                    p.status === 'vendido'
                      ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                      : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30'}`}>
                    {p.status === 'vendido' ? `Vendido ${formatIsoDate(p.sold_date)}` : 'Em estoque'}
                  </span>
                </div>

                <div className="bg-slate-950/60 rounded-xl p-2.5 mb-3 border border-slate-800/60 grid grid-cols-4 gap-1 text-center">
                  <div><div className="text-[10px] uppercase text-slate-500">Aparelho</div>
                    <div className="text-xs font-semibold text-slate-200">{formatCurrency(p.purchase_price)}</div></div>
                  <div><div className="text-[10px] uppercase text-slate-500">Peças</div>
                    <div className="text-xs font-semibold text-rose-400">{formatCurrency(p.parts_cost)}</div></div>
                  <div><div className="text-[10px] uppercase text-slate-500">Revenda</div>
                    <div className="text-xs font-semibold text-slate-200">{formatCurrency(p.resale_price)}</div></div>
                  <div><div className="text-[10px] uppercase text-emerald-400">Lucro</div>
                    <div className={`text-xs font-bold ${profit >= 0 ? 'text-emerald-300' : 'text-rose-400'}`}>{formatCurrency(profit)}</div></div>
                </div>
                {p.parts_notes && <p className="text-[11px] text-slate-400 mb-2">Peças: {p.parts_notes}</p>}

                <div className="text-[11px] text-slate-400 border-t border-slate-800/80 pt-2 space-y-0.5">
                  <div className="text-slate-500 uppercase tracking-wider text-[10px]">Antigo dono · comprado em {formatIsoDate(p.purchase_date)}</div>
                  <div className="text-slate-200 font-medium">{p.seller_name}</div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono">CPF {show ? maskCpfInput(p.seller_cpf) : hideCpf(p.seller_cpf)}</span>
                    <button onClick={() => toggleReveal(p.id)} title={show ? 'Ocultar CPF' : 'Mostrar CPF'}
                      className="text-slate-500 hover:text-slate-200">
                      {show ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  {show && p.seller_rg && <div>RG {p.seller_rg}</div>}
                  {show && p.seller_phone && <div>Tel. {p.seller_phone}</div>}
                  {show && p.seller_address && <div>{p.seller_address}</div>}
                </div>
                {p.notes && <p className="text-[11px] text-slate-500 mt-2">Obs.: {p.notes}</p>}

                <div className="flex items-center justify-end gap-2 mt-3 pt-2 border-t border-slate-800">
                  {p.status === 'estoque' && (
                    <button onClick={() => markSold(p)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Marcar vendido
                    </button>
                  )}
                  <button onClick={() => openEdit(p)} title="Editar"
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(p)} title="Excluir"
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-rose-400"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
};
