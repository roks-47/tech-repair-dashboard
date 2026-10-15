import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Search, X, Plus, Trash2, Edit2, Save, Package, AlertTriangle, BadgeCheck } from 'lucide-react';
import {
  fetchParts,
  createPart,
  updatePart,
  deletePart,
  subscribeToParts,
  type Part,
} from '../lib/parts';
import { formatCurrency } from '../utils/formatters';

const EMPTY_FORM = { supplier: '', model: '', part: '', description: '', price: '' };

const norm = (s: string) => s.trim().toLowerCase();

export const PartsPage: React.FC = () => {
  const [parts, setParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [query, setQuery] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('all');

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const load = useCallback(async () => {
    const res = await fetchParts();
    setParts(res.parts);
    setError(res.error || null);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const unsubscribe = subscribeToParts(load);
    const onFocus = () => load();
    window.addEventListener('focus', onFocus);
    const interval = setInterval(load, 15000);
    return () => {
      unsubscribe();
      window.removeEventListener('focus', onFocus);
      clearInterval(interval);
    };
  }, [load]);

  const suppliers = useMemo(
    () => Array.from(new Set(parts.map((p) => p.supplier))).sort((a, b) => a.localeCompare(b)),
    [parts]
  );

  // Menor preço entre fornecedores para a mesma peça (modelo + peça + descrição)
  const cheapest = useMemo(() => {
    const groups = new Map<string, Part[]>();
    parts.forEach((p) => {
      const key = `${norm(p.model)}|${norm(p.part)}|${norm(p.description)}`;
      groups.set(key, [...(groups.get(key) || []), p]);
    });
    const ids = new Set<string>();
    groups.forEach((list) => {
      if (list.length < 2) return;
      const min = Math.min(...list.map((p) => p.price));
      list.filter((p) => p.price === min).forEach((p) => ids.add(p.id));
    });
    return ids;
  }, [parts]);

  const grouped = useMemo(() => {
    const q = norm(query);
    const list = parts.filter((p) => {
      if (supplierFilter !== 'all' && p.supplier !== supplierFilter) return false;
      if (!q) return true;
      return `${p.supplier} ${p.model} ${p.part} ${p.description}`.toLowerCase().includes(q);
    });
    const map = new Map<string, Part[]>();
    list.forEach((p) => map.set(p.supplier, [...(map.get(p.supplier) || []), p]));
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [parts, query, supplierFilter]);

  const totalShown = grouped.reduce((acc, [, list]) => acc + list.length, 0);

  const openNew = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, supplier: supplierFilter !== 'all' ? supplierFilter : '' });
    setShowForm(true);
  };

  const openEdit = (p: Part) => {
    setEditingId(p.id);
    setForm({
      supplier: p.supplier,
      model: p.model,
      part: p.part,
      description: p.description,
      price: String(p.price).replace('.', ','),
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    const price = Number(form.price.replace(',', '.'));
    if (!form.supplier.trim() || !form.model.trim() || !form.part.trim()) {
      setError('Preencha fornecedor, modelo e peça.');
      return;
    }
    if (!Number.isFinite(price) || price < 0) {
      setError('Informe um valor válido (ex: 189,90).');
      return;
    }
    setSaving(true);
    const input = {
      supplier: form.supplier.trim(),
      model: form.model.trim(),
      part: form.part.trim(),
      description: form.description.trim(),
      price,
    };
    const res = editingId ? await updatePart(editingId, input) : await createPart(input);
    setSaving(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    setError(null);
    await load();
    if (editingId) {
      setShowForm(false);
      setEditingId(null);
    } else {
      // mantém o fornecedor para cadastrar várias peças seguidas
      setForm({ ...EMPTY_FORM, supplier: input.supplier });
    }
  };

  const handleDelete = async (p: Part) => {
    if (!window.confirm(`Excluir "${p.model} - ${p.part}" do fornecedor ${p.supplier}?`)) return;
    const res = await deletePart(p.id);
    if (res.error) setError(res.error);
    else load();
  };

  const inputCls =
    'w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500';

  return (
    <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-7 flex-1 w-full">
      <div className="flex items-center justify-between mb-4 gap-2">
        <div className="flex items-center gap-2">
          <h2 className="text-sm sm:text-base font-bold text-slate-200">Tabela de peças por fornecedor</h2>
          <span className="text-xs text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full font-mono">
            {totalShown}
          </span>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium text-xs sm:text-sm shadow-md active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Nova peça</span>
        </button>
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

      {showForm && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 mb-5">
          <h3 className="text-sm font-bold text-white mb-3">
            {editingId ? 'Editar peça' : 'Cadastrar peça'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Fornecedor</label>
              <input
                list="suppliers-list"
                className={inputCls}
                placeholder="Ex: Fornecedor A"
                value={form.supplier}
                onChange={(e) => setForm({ ...form, supplier: e.target.value })}
              />
              <datalist id="suppliers-list">
                {suppliers.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Modelo</label>
              <input
                className={inputCls}
                placeholder="Ex: iPhone 11"
                value={form.model}
                onChange={(e) => setForm({ ...form, model: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Peça</label>
              <input
                className={inputCls}
                placeholder="Ex: Tela"
                value={form.part}
                onChange={(e) => setForm({ ...form, part: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Descrição</label>
              <input
                className={inputCls}
                placeholder="Ex: OLED, original, com aro"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Valor (R$)</label>
              <input
                inputMode="decimal"
                className={inputCls}
                placeholder="0,00"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
              }}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs sm:text-sm"
            >
              Fechar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-xs sm:text-sm font-medium"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Salvando...' : editingId ? 'Salvar alterações' : 'Salvar peça'}
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-2.5 mb-5">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Buscar por modelo, peça, descrição ou fornecedor..."
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
        <select
          value={supplierFilter}
          onChange={(e) => setSupplierFilter(e.target.value)}
          className="bg-slate-900/90 border border-slate-800 text-slate-200 text-xs sm:text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500 cursor-pointer"
        >
          <option value="all">Todos os fornecedores</option>
          {suppliers.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex flex-col items-center py-16 text-slate-400 space-y-3">
          <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm">Carregando peças...</p>
        </div>
      ) : grouped.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-10 text-center max-w-lg mx-auto my-8">
          <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-400 mb-4 mx-auto">
            <Package className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-white mb-1">Nenhuma peça cadastrada</h3>
          <p className="text-xs sm:text-sm text-slate-400">
            Clique em "Nova peça" para cadastrar o primeiro valor de um fornecedor.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {grouped.map(([supplier, list]) => (
            <section key={supplier} className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900">
                <h3 className="font-bold text-white text-sm">{supplier}</h3>
                <span className="text-[11px] text-slate-400">{list.length} peça(s)</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs sm:text-sm">
                  <thead>
                    <tr className="text-left text-[11px] uppercase tracking-wider text-slate-500">
                      <th className="px-4 py-2 font-medium">Modelo</th>
                      <th className="px-4 py-2 font-medium">Peça</th>
                      <th className="px-4 py-2 font-medium">Descrição</th>
                      <th className="px-4 py-2 font-medium text-right">Valor</th>
                      <th className="px-4 py-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {list.map((p) => (
                      <tr key={p.id} className="border-t border-slate-800/70 hover:bg-slate-800/30">
                        <td className="px-4 py-2.5 text-slate-200 font-medium whitespace-nowrap">{p.model}</td>
                        <td className="px-4 py-2.5 text-slate-300 whitespace-nowrap">{p.part}</td>
                        <td className="px-4 py-2.5 text-slate-400">{p.description || '—'}</td>
                        <td className="px-4 py-2.5 text-right whitespace-nowrap">
                          <span className="font-bold text-emerald-300">{formatCurrency(p.price)}</span>
                          {cheapest.has(p.id) && (
                            <span
                              title="Menor preço entre os fornecedores para esta peça"
                              className="inline-flex items-center gap-1 ml-2 text-[10px] text-cyan-300 bg-cyan-500/10 border border-cyan-500/30 px-1.5 py-0.5 rounded-full"
                            >
                              <BadgeCheck className="w-3 h-3" /> menor preço
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-right whitespace-nowrap">
                          <button
                            onClick={() => openEdit(p)}
                            title="Editar"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(p)}
                            title="Excluir"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </div>
      )}
    </main>
  );
};
