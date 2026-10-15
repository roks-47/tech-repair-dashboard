import React, { useState, useEffect } from 'react';
import { 
  X, 
  Smartphone, 
  Gamepad2, 
  Wrench, 
  DollarSign, 
  User, 
  Phone, 
  FileText, 
  Key, 
  Package, 
  CheckCircle2, 
  TrendingUp 
} from 'lucide-react';
import type { Order, DeviceType, OSStatus } from '../types';
import { formatCurrency } from '../utils/formatters';

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (orderData: any) => Promise<void>;
  orderToEdit?: Order | null;
  technicians: string[];
  activeTechnician: string;
}

const COMMON_PHONE_BRANDS = ['Apple', 'Samsung', 'Xiaomi', 'Motorola', 'Realme', 'Asus'];
const COMMON_CONSOLE_BRANDS = ['Sony', 'Microsoft', 'Nintendo', 'Valve'];

export const OrderModal: React.FC<OrderModalProps> = ({
  isOpen,
  onClose,
  onSave,
  orderToEdit,
  technicians,
  activeTechnician,
}) => {
  const [deviceType, setDeviceType] = useState<DeviceType>('celular');
  const [deviceBrand, setDeviceBrand] = useState('');
  const [deviceModel, setDeviceModel] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [defectReported, setDefectReported] = useState('');
  const [technicalReport, setTechnicalReport] = useState('');
  const [status, setStatus] = useState<OSStatus>('aguardando_orcamento');
  const [technicianName, setTechnicianName] = useState(activeTechnician);
  const [costParts, setCostParts] = useState<number>(0);
  const [totalPrice, setTotalPrice] = useState<number>(0);
  const [accessories, setAccessories] = useState('');
  const [devicePassword, setDevicePassword] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (orderToEdit) {
      setDeviceType(orderToEdit.device_type);
      setDeviceBrand(orderToEdit.device_brand);
      setDeviceModel(orderToEdit.device_model);
      setClientName(orderToEdit.client_name);
      setClientPhone(orderToEdit.client_phone);
      setDefectReported(orderToEdit.defect_reported);
      setTechnicalReport(orderToEdit.technical_report || '');
      setStatus(orderToEdit.status);
      setTechnicianName(orderToEdit.technician_name);
      setCostParts(orderToEdit.cost_parts || 0);
      setTotalPrice(orderToEdit.total_price || 0);
      setAccessories(orderToEdit.accessories || '');
      setDevicePassword(orderToEdit.device_password || '');
      setNotes(orderToEdit.notes || '');
    } else {
      // Reset form
      setDeviceType('celular');
      setDeviceBrand('');
      setDeviceModel('');
      setClientName('');
      setClientPhone('');
      setDefectReported('');
      setTechnicalReport('');
      setStatus('aguardando_orcamento');
      setTechnicianName(activeTechnician);
      setCostParts(0);
      setTotalPrice(0);
      setAccessories('');
      setDevicePassword('');
      setNotes('');
    }
  }, [orderToEdit, isOpen, activeTechnician]);

  if (!isOpen) return null;

  const profit = (totalPrice || 0) - (costParts || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !clientPhone.trim() || !deviceBrand.trim() || !deviceModel.trim()) {
      alert('Por favor, preencha o nome do cliente, telefone, marca e modelo.');
      return;
    }

    setLoading(true);
    try {
      await onSave({
        device_type: deviceType,
        device_brand: deviceBrand.trim(),
        device_model: deviceModel.trim(),
        client_name: clientName.trim(),
        client_phone: clientPhone.trim(),
        defect_reported: defectReported.trim(),
        technical_report: technicalReport.trim(),
        status,
        technician_name: technicianName,
        cost_parts: Number(costParts) || 0,
        total_price: Number(totalPrice) || 0,
        accessories: accessories.trim(),
        device_password: devicePassword.trim(),
        notes: notes.trim(),
      });
      onClose();
    } catch (err: any) {
      alert(`Erro ao salvar ordem: ${err?.message || 'Falha desconhecida'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="relative bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/60 sticky top-0 z-10 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400">
              {deviceType === 'celular' ? <Smartphone className="w-5 h-5" /> : <Gamepad2 className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {orderToEdit ? `Editar OS #${orderToEdit.os_number}` : 'Nova Ordem de Serviço'}
              </h2>
              <p className="text-xs text-slate-400">
                {orderToEdit ? 'Atualize as informações e valores' : 'Preencha os dados do aparelho e cliente'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Scrollable Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-5 space-y-5 flex-1">
          
          {/* Tipo de Aparelho Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Tipo do Dispositivo
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setDeviceType('celular')}
                className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl border text-sm font-semibold transition-all ${
                  deviceType === 'celular'
                    ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 shadow-md shadow-cyan-950/40'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <Smartphone className="w-4 h-4 text-cyan-400" />
                <span>Celular</span>
              </button>

              <button
                type="button"
                onClick={() => setDeviceType('videogame')}
                className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl border text-sm font-semibold transition-all ${
                  deviceType === 'videogame'
                    ? 'bg-fuchsia-500/20 border-fuchsia-500 text-fuchsia-300 shadow-md shadow-fuchsia-950/40'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <Gamepad2 className="w-4 h-4 text-fuchsia-400" />
                <span>Videogame</span>
              </button>

              <button
                type="button"
                onClick={() => setDeviceType('outro')}
                className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl border text-sm font-semibold transition-all ${
                  deviceType === 'outro'
                    ? 'bg-blue-500/20 border-blue-500 text-blue-300 shadow-md'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <Wrench className="w-4 h-4 text-blue-400" />
                <span>Outro</span>
              </button>
            </div>
          </div>

          {/* Quick Brand selection */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Marca & Modelo do Aparelho
              </label>
              <span className="text-[11px] text-slate-500">Sugestões rápidas</span>
            </div>
            
            <div className="flex flex-wrap gap-1.5 mb-2.5">
              {(deviceType === 'celular' ? COMMON_PHONE_BRANDS : COMMON_CONSOLE_BRANDS).map((brand) => (
                <button
                  key={brand}
                  type="button"
                  onClick={() => setDeviceBrand(brand)}
                  className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                    deviceBrand.toLowerCase() === brand.toLowerCase()
                      ? 'bg-blue-600 border-blue-500 text-white font-medium'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {brand}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <input
                  type="text"
                  placeholder="Marca (ex: Apple, Sony, Samsung)"
                  value={deviceBrand}
                  onChange={(e) => setDeviceBrand(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Modelo (ex: iPhone 13 Pro, PS5 Slim, Series X)"
                  value={deviceModel}
                  onChange={(e) => setDeviceModel(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Dados do Cliente */}
          <div className="pt-2 border-t border-slate-800">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Dados do Cliente
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  placeholder="Nome completo do cliente"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  placeholder="WhatsApp / Telefone com DDD (ex: 11988887777)"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Defeito Relatado */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Defeito Relatado pelo Cliente
            </label>
            <textarea
              rows={2}
              placeholder="Ex: Não liga após queda, tela apagada, HDMI sem sinal, controle com drift..."
              value={defectReported}
              onChange={(e) => setDefectReported(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 leading-relaxed"
              required
            />
          </div>

          {/* Acessórios & Senha do Aparelho */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-slate-400" /> Acessórios Deixados
              </label>
              <input
                type="text"
                placeholder="Ex: Capa, chip, cabo HDMI, 1 controle..."
                value={accessories}
                onChange={(e) => setAccessories(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-slate-400" /> Senha / Padrão de Desbloqueio
              </label>
              <input
                type="text"
                placeholder="Ex: 1234, 'L invertido', ou Sem Senha"
                value={devicePassword}
                onChange={(e) => setDevicePassword(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Técnico & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Técnico Responsável
              </label>
              <select
                value={technicianName}
                onChange={(e) => setTechnicianName(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                {technicians.map((tech) => (
                  <option key={tech} value={tech}>
                    {tech}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Status Atual da OS
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="aguardando_orcamento">⏳ Aguardando Orçamento</option>
                <option value="aprovado">👍 Orçamento Aprovado</option>
                <option value="em_bancada">🛠️ Na Bancada / Reparo</option>
                <option value="aguardando_peca">📦 Aguardando Peça</option>
                <option value="pronto">✅ Pronto p/ Retirada</option>
                <option value="entregue">🏁 Finalizado / Entregue</option>
                <option value="cancelado">❌ Cancelado</option>
              </select>
            </div>
          </div>

          {/* CONTROLE FINANCEIRO */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-950 to-slate-900 border border-emerald-500/30">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4" /> Controle Financeiro & Lucro
              </span>
              <div className="flex items-center gap-1 text-xs text-emerald-300 font-semibold bg-emerald-500/10 px-2.5 py-1 rounded-lg">
                <TrendingUp className="w-3.5 h-3.5" /> Lucro: {formatCurrency(profit)}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Valor Total do Serviço (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  value={totalPrice || ''}
                  onChange={(e) => setTotalPrice(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white font-semibold focus:outline-none focus:border-emerald-500"
                />
                <span className="text-[11px] text-slate-500">Valor cobrado do cliente</span>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Custo das Peças / Peça gasta (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  value={costParts || ''}
                  onChange={(e) => setCostParts(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-rose-300 font-semibold focus:outline-none focus:border-rose-500"
                />
                <span className="text-[11px] text-slate-500">Gasto com tela, CI, conectores, pasta</span>
              </div>
            </div>
          </div>

          {/* Laudo Técnico */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" /> Laudo Técnico / Procedimentos Realizados
            </label>
            <textarea
              rows={2}
              placeholder="Ex: Troca de módulo frontal original, limpeza ultrassônica, troca de pasta térmica..."
              value={technicalReport}
              onChange={(e) => setTechnicalReport(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Anotações Internas */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Anotações Internas (Somente você e seu colega veem)
            </label>
            <input
              type="text"
              placeholder="Ex: Peça encomendada no fornecedor X com previsão para quinta..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

        </form>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-slate-800 bg-slate-900/90 sticky bottom-0 z-10 backdrop-blur-md">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-colors"
          >
            Cancelar
          </button>
          
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-semibold shadow-lg shadow-indigo-600/30 disabled:opacity-50 transition-all active:scale-95"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{loading ? 'Salvando...' : orderToEdit ? 'Salvar Alterações' : 'Criar Ordem de Serviço'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
