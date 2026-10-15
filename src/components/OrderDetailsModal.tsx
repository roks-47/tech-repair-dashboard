import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Smartphone, 
  Gamepad2, 
  Wrench, 
  MessageCircle, 
  Printer, 
  Trash2, 
  User, 
  Phone, 
  Package, 
  Key, 
  Check, 
  Clock, 
  TrendingUp,
  FileText,
  DollarSign,
  UserCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';
import type { Order, OSStatus } from '../types';
import { 
  formatCurrency, 
  formatDate, 
  getStatusBadge, 
  generateWhatsAppMessage, 
  createWhatsAppUrl 
} from '../utils/formatters';

interface OrderDetailsModalProps {
  order: Order | null;
  shopName: string;
  technicians: string[];
  isOpen: boolean;
  onClose: () => void;
  onAutoSave: (id: string, updates: Partial<Order>) => Promise<Order>;
  onDelete: (id: string) => void;
}

export const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
  order,
  shopName,
  technicians,
  isOpen,
  onClose,
  onAutoSave,
  onDelete,
}) => {
  const [formData, setFormData] = useState<Order | null>(order);
  const [saveState, setSaveState] = useState<'saved' | 'saving' | 'error'>('saved');
  const [lastSavedTime, setLastSavedTime] = useState<string>('');
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setFormData(order);
    if (order) {
      setSaveState('saved');
    }
  }, [order]);

  if (!isOpen || !formData || !order) return null;

  const statusBadge = getStatusBadge(formData.status);
  const profit = (formData.total_price || 0) - (formData.cost_parts || 0);

  // Trigger autosave with debounce for text inputs, or immediately for selects
  const triggerAutoSave = (updates: Partial<Order>, immediate = false) => {
    setSaveState('saving');
    
    // Update local state immediately for snappy UI
    setFormData((prev) => (prev ? { ...prev, ...updates } : null));

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    const performSave = async () => {
      try {
        await onAutoSave(order.id, updates);
        setSaveState('saved');
        const now = new Date();
        setLastSavedTime(
          now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        );
      } catch (err) {
        setSaveState('error');
      }
    };

    if (immediate) {
      performSave();
    } else {
      debounceTimerRef.current = setTimeout(performSave, 500);
    }
  };

  const handleStatusChange = (newStatus: OSStatus) => {
    triggerAutoSave({ status: newStatus }, true);
    if (newStatus === 'pronto') {
      try {
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
      } catch {}
    }
  };

  const handleWhatsApp = () => {
    const message = generateWhatsAppMessage(
      formData.status,
      formData.client_name,
      `${formData.device_brand} ${formData.device_model}`,
      formData.os_number,
      formData.total_price,
      shopName
    );
    const url = createWhatsAppUrl(formData.client_phone, message);
    window.open(url, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDelete = () => {
    if (confirm(`Tem certeza que deseja excluir permanentemente a OS #${formData.os_number}?`)) {
      onDelete(formData.id);
      onClose();
    }
  };

  const isCelular = formData.device_type === 'celular';
  const isVideogame = formData.device_type === 'videogame';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      
      {/* Container Principal */}
      <div className="relative bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden print:border-none print:shadow-none print:w-full print:max-w-none print:bg-white print:text-black">
        
        {/* Modal Header com Indicador de Auto-Save */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-20 print:hidden">
          
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-xs sm:text-sm font-mono font-bold bg-blue-600/20 text-blue-400 px-2.5 py-1 rounded-lg border border-blue-500/30">
              OS #{formData.os_number}
            </span>

            {/* Quick Status Selector */}
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold ${statusBadge.bg} ${statusBadge.border} ${statusBadge.text}`}>
              <span className={`w-2 h-2 rounded-full ${statusBadge.dot}`} />
              <select
                value={formData.status}
                onChange={(e) => handleStatusChange(e.target.value as OSStatus)}
                className="bg-transparent text-xs font-semibold focus:outline-none cursor-pointer"
              >
                <option value="aguardando_orcamento" className="bg-slate-900 text-slate-200">Aguardando Orçamento</option>
                <option value="aprovado" className="bg-slate-900 text-slate-200">Orçamento Aprovado</option>
                <option value="em_bancada" className="bg-slate-900 text-slate-200">Na Bancada / Reparo</option>
                <option value="aguardando_peca" className="bg-slate-900 text-slate-200">Aguardando Peça</option>
                <option value="pronto" className="bg-slate-900 text-slate-200">Pronto p/ Retirada</option>
                <option value="entregue" className="bg-slate-900 text-slate-200">Entregue / Finalizado</option>
                <option value="cancelado" className="bg-slate-900 text-slate-200">Cancelado</option>
              </select>
            </div>

            {/* Auto-save Status Pill */}
            <div className="hidden sm:flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded-full border transition-all">
              {saveState === 'saving' && (
                <span className="text-amber-400 bg-amber-500/10 border-amber-500/20 px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                  <Clock className="w-3 h-3 animate-spin" /> Salvando alterações...
                </span>
              )}
              {saveState === 'saved' && (
                <span className="text-emerald-400 bg-emerald-500/10 border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Check className="w-3 h-3 stroke-[2.5]" /> Salvo automaticamente {lastSavedTime ? `às ${lastSavedTime}` : ''}
                </span>
              )}
              {saveState === 'error' && (
                <span className="text-rose-400 bg-rose-500/10 border-rose-500/20 px-2 py-0.5 rounded-full">
                  ⚠️ Erro ao salvar
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePrint}
              title="Imprimir Comprovante da Bancada"
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            >
              <Printer className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINT ONLY HEADER */}
        <div className="hidden print:block p-4 border-b border-gray-300 text-center">
          <h1 className="text-xl font-bold uppercase">{shopName}</h1>
          <p className="text-xs text-gray-600">Comprovante de Ordem de Serviço • Assistência Técnica</p>
          <div className="mt-2 text-sm font-bold">ORDEM DE SERVIÇO Nº #{formData.os_number}</div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto p-4 sm:p-6 space-y-5 flex-1 print:p-2 print:space-y-4">
          
          {/* Aparelho & Cliente */}
          <div className="bg-slate-950/70 p-4 sm:p-5 rounded-2xl border border-slate-800/80">
            
            {/* Aparelho Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 shrink-0 print:hidden">
                  {isCelular && <Smartphone className="w-6 h-6 text-cyan-400" />}
                  {isVideogame && <Gamepad2 className="w-6 h-6 text-fuchsia-400" />}
                  {!isCelular && !isVideogame && <Wrench className="w-6 h-6 text-blue-400" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={formData.device_brand}
                      onChange={(e) => triggerAutoSave({ device_brand: e.target.value })}
                      placeholder="Marca"
                      className="bg-transparent font-bold text-white text-base sm:text-lg focus:outline-none focus:bg-slate-900/60 px-1 rounded border-b border-transparent focus:border-blue-500 w-28 sm:w-36"
                    />
                    <input
                      type="text"
                      value={formData.device_model}
                      onChange={(e) => triggerAutoSave({ device_model: e.target.value })}
                      placeholder="Modelo (ex: iPhone 13, PS5)"
                      className="bg-transparent font-extrabold text-white text-base sm:text-lg focus:outline-none focus:bg-slate-900/60 px-1 rounded border-b border-transparent focus:border-blue-500 flex-1"
                    />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                    <span className="capitalize">{formData.device_type}</span>
                    <span>•</span>
                    <span className="text-slate-500">Clique nos textos para editar diretamente</span>
                  </div>
                </div>
              </div>

              {/* Técnico Responsável Selector */}
              <div className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 self-start sm:self-auto">
                <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-xs text-slate-400">Técnico:</span>
                <select
                  value={formData.technician_name}
                  onChange={(e) => triggerAutoSave({ technician_name: e.target.value }, true)}
                  className="bg-transparent text-xs font-semibold text-slate-200 focus:outline-none cursor-pointer pr-1"
                >
                  {technicians.map((tech) => (
                    <option key={tech} value={tech} className="bg-slate-900 text-slate-200">
                      {tech}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Cliente & Telefone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-800/80">
              <div className="flex items-center gap-2 text-sm text-slate-200">
                <User className="w-4 h-4 text-slate-500 shrink-0" />
                <span className="text-slate-500 text-xs uppercase">Cliente:</span>
                <input
                  type="text"
                  value={formData.client_name}
                  onChange={(e) => triggerAutoSave({ client_name: e.target.value })}
                  className="bg-transparent font-semibold text-slate-100 focus:outline-none focus:bg-slate-900/60 px-1.5 py-0.5 rounded border border-transparent focus:border-blue-500 flex-1"
                />
              </div>

              <div className="flex items-center gap-2 text-sm text-slate-200">
                <Phone className="w-4 h-4 text-slate-500 shrink-0" />
                <span className="text-slate-500 text-xs uppercase">Tel/WhatsApp:</span>
                <input
                  type="text"
                  value={formData.client_phone}
                  onChange={(e) => triggerAutoSave({ client_phone: e.target.value })}
                  placeholder="(DDD) 99999-9999"
                  className="bg-transparent font-semibold text-slate-100 focus:outline-none focus:bg-slate-900/60 px-1.5 py-0.5 rounded border border-transparent focus:border-blue-500 flex-1 font-mono text-xs sm:text-sm"
                />
              </div>
            </div>

          </div>

          {/* CONTROLE FINANCEIRO & VALORES COM AUTOSAVE */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-950 to-slate-900 border border-emerald-500/30">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4" /> Valores & Lucro em Tempo Real
              </span>
              <div className="flex items-center gap-1 text-xs text-emerald-300 font-bold bg-emerald-500/10 px-3 py-1 rounded-xl border border-emerald-500/20">
                <TrendingUp className="w-3.5 h-3.5" /> Lucro: {formatCurrency(profit)}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Valor Total do Serviço (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.total_price || ''}
                  onChange={(e) => triggerAutoSave({ total_price: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-sm font-bold text-white focus:outline-none focus:border-emerald-500"
                />
                <span className="text-[11px] text-slate-500">Valor cobrado do cliente</span>
              </div>

              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Custo das Peças Compradas (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.cost_parts || ''}
                  onChange={(e) => triggerAutoSave({ cost_parts: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-sm font-bold text-rose-300 focus:outline-none focus:border-rose-500"
                />
                <span className="text-[11px] text-slate-500">Telas, conectores, CI, pasta térmica</span>
              </div>
            </div>
          </div>

          {/* Defeito Relatado (Auto-Save) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
              Defeito Reclamado pelo Cliente
            </label>
            <textarea
              rows={2}
              value={formData.defect_reported}
              onChange={(e) => triggerAutoSave({ defect_reported: e.target.value })}
              className="w-full bg-slate-800/50 border border-slate-700/80 rounded-xl p-3 text-sm text-slate-100 focus:outline-none focus:border-blue-500 leading-relaxed transition-all"
              placeholder="Descreva o defeito relatado..."
            />
          </div>

          {/* Laudo Técnico / Procedimentos (Auto-Save) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-blue-400" /> Laudo Técnico / Procedimentos Realizados
            </label>
            <textarea
              rows={2}
              value={formData.technical_report || ''}
              onChange={(e) => triggerAutoSave({ technical_report: e.target.value })}
              className="w-full bg-slate-800/50 border border-slate-700/80 rounded-xl p-3 text-sm text-slate-100 focus:outline-none focus:border-blue-500 leading-relaxed transition-all"
              placeholder="Ex: Troca de tela OLED, desoxidação da placa, troca de analógico Hall Effect..."
            />
          </div>

          {/* Acessórios & Senha do Aparelho (Auto-Save) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-slate-800/30 p-3 rounded-xl border border-slate-800">
              <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-slate-400" /> Acessórios Deixados
              </label>
              <input
                type="text"
                value={formData.accessories || ''}
                onChange={(e) => triggerAutoSave({ accessories: e.target.value })}
                placeholder="Ex: Capa, chip, cabo HDMI, 1 controle..."
                className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="bg-slate-800/30 p-3 rounded-xl border border-slate-800">
              <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-slate-400" /> Senha / Desbloqueio
              </label>
              <input
                type="text"
                value={formData.device_password || ''}
                onChange={(e) => triggerAutoSave({ device_password: e.target.value })}
                placeholder="Ex: 1234 ou Padrão em L"
                className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs font-mono text-amber-300 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Anotações Internas (Auto-Save) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
              Anotações Internas da Bancada (Visível apenas para vocês)
            </label>
            <input
              type="text"
              value={formData.notes || ''}
              onChange={(e) => triggerAutoSave({ notes: e.target.value })}
              placeholder="Ex: Peça encomendada com fornecedor X, entrega até sexta..."
              className="w-full bg-slate-800/30 border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs text-slate-300 italic focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Datas */}
          <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-800">
            <div>Entrada: {formatDate(formData.created_at)}</div>
            <div>Última alteração: {formatDate(formData.updated_at)}</div>
          </div>

          {/* PRINT ONLY TERMS & SIGNATURE */}
          <div className="hidden print:block pt-6 mt-6 border-t border-gray-300 text-xs text-gray-600 space-y-4">
            <p>
              * Declaro que retirei/deixei o aparelho acima especificado nas condições descritas neste documento. Garantia de 90 dias sobre as peças e serviços realizados conforme Art. 26 do CDC.
            </p>
            <div className="pt-8 flex justify-between">
              <div className="text-center w-52 border-t border-black pt-1">Assinatura do Cliente</div>
              <div className="text-center w-52 border-t border-black pt-1">Assinatura do Técnico</div>
            </div>
          </div>

        </div>

        {/* Modal Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-t border-slate-800 bg-slate-900/90 backdrop-blur-md print:hidden">
          
          <button
            type="button"
            onClick={handleDelete}
            className="flex items-center gap-1.5 px-3 py-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl text-xs font-semibold transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Excluir OS</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleWhatsApp}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs sm:text-sm font-semibold transition-all hover:scale-105 active:scale-95"
            >
              <MessageCircle className="w-4 h-4 fill-emerald-400/20" />
              <span>Avisar no WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-md shadow-blue-600/20 transition-all active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>Concluir</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
