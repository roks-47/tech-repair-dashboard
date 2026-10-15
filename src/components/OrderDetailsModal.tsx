import React from 'react';
import { 
  X, 
  Smartphone, 
  Gamepad2, 
  Wrench, 
  MessageCircle, 
  Printer, 
  Edit, 
  Trash2, 
  User, 
  Phone, 
  Package, 
  Key 
} from 'lucide-react';
import type { Order } from '../types';
import { 
  formatCurrency, 
  formatDate, 
  formatPhone, 
  getStatusBadge, 
  generateWhatsAppMessage, 
  createWhatsAppUrl 
} from '../utils/formatters';

interface OrderDetailsModalProps {
  order: Order | null;
  shopName: string;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (order: Order) => void;
  onDelete: (id: string) => void;
}

export const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
  order,
  shopName,
  isOpen,
  onClose,
  onEdit,
  onDelete,
}) => {
  if (!isOpen || !order) return null;

  const statusBadge = getStatusBadge(order.status);
  const profit = (order.total_price || 0) - (order.cost_parts || 0);

  const handleWhatsApp = () => {
    const message = generateWhatsAppMessage(
      order.status,
      order.client_name,
      `${order.device_brand} ${order.device_model}`,
      order.os_number,
      order.total_price,
      shopName
    );
    const url = createWhatsAppUrl(order.client_phone, message);
    window.open(url, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDelete = () => {
    if (confirm(`Tem certeza que deseja excluir a OS #${order.os_number} de ${order.client_name}?`)) {
      onDelete(order.id);
      onClose();
    }
  };

  const isCelular = order.device_type === 'celular';
  const isVideogame = order.device_type === 'videogame';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      
      {/* Container - Printable styles included */}
      <div className="relative bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden print:border-none print:shadow-none print:w-full print:max-w-none print:bg-white print:text-black">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/70 backdrop-blur-md print:hidden">
          <div className="flex items-center gap-3">
            <span className="text-sm font-mono font-bold bg-blue-600/20 text-blue-400 px-2.5 py-1 rounded-lg border border-blue-500/30">
              OS #{order.os_number}
            </span>
            <span className={`px-2.5 py-1 rounded-lg border text-xs font-semibold ${statusBadge.bg} ${statusBadge.border} ${statusBadge.text}`}>
              {statusBadge.label}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              title="Imprimir Comprovante / Recibo"
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
          <div className="mt-2 text-sm font-bold">ORDEM DE SERVIÇO Nº #{order.os_number}</div>
        </div>

        {/* Modal Content */}
        <div className="overflow-y-auto p-5 sm:p-6 space-y-6 flex-1 print:p-2 print:space-y-4">
          
          {/* Device & Client Main Card */}
          <div className="bg-slate-950/60 p-4 sm:p-5 rounded-2xl border border-slate-800/80 print:bg-white print:border-gray-300">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-xl bg-slate-800 text-slate-200 print:hidden">
                {isCelular && <Smartphone className="w-6 h-6 text-cyan-400" />}
                {isVideogame && <Gamepad2 className="w-6 h-6 text-fuchsia-400" />}
                {!isCelular && !isVideogame && <Wrench className="w-6 h-6 text-blue-400" />}
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-extrabold text-white print:text-black">
                  {order.device_brand} {order.device_model}
                </h2>
                <div className="text-xs text-slate-400 capitalize flex items-center gap-2 mt-0.5 print:text-gray-600">
                  <span>Tipo: {order.device_type}</span>
                  <span>•</span>
                  <span>Técnico: {order.technician_name}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 pt-3 border-t border-slate-800/60 print:border-gray-200">
              <div className="flex items-center gap-2 text-sm text-slate-300 print:text-black">
                <User className="w-4 h-4 text-slate-400 shrink-0 print:hidden" />
                <span className="text-slate-500 text-xs uppercase print:text-gray-600">Cliente:</span>
                <span className="font-semibold">{order.client_name}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-300 print:text-black">
                <Phone className="w-4 h-4 text-slate-400 shrink-0 print:hidden" />
                <span className="text-slate-500 text-xs uppercase print:text-gray-600">WhatsApp/Tel:</span>
                <span className="font-semibold">{formatPhone(order.client_phone)}</span>
              </div>
            </div>
          </div>

          {/* Defect & Diagnostics */}
          <div className="space-y-3">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 print:text-gray-600">
                Defeito Reclamado
              </span>
              <p className="mt-1 text-sm text-slate-200 bg-slate-800/40 p-3 rounded-xl border border-slate-800/60 leading-relaxed print:bg-gray-50 print:text-black print:border-gray-200">
                {order.defect_reported}
              </p>
            </div>

            {order.technical_report && (
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 print:text-gray-600">
                  Laudo Técnico & Procedimentos
                </span>
                <p className="mt-1 text-sm text-slate-200 bg-slate-800/40 p-3 rounded-xl border border-slate-800/60 leading-relaxed print:bg-gray-50 print:text-black print:border-gray-200">
                  {order.technical_report}
                </p>
              </div>
            )}
          </div>

          {/* Accessories & Unlock Code */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-slate-800/30 p-3 rounded-xl border border-slate-800/60 print:border-gray-200 print:bg-gray-50">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 print:text-gray-600 mb-1">
                <Package className="w-3.5 h-3.5 text-slate-400 print:hidden" /> Acessórios Deixados
              </div>
              <div className="text-sm text-slate-200 print:text-black font-medium">
                {order.accessories || 'Nenhum acessório registrado'}
              </div>
            </div>

            <div className="bg-slate-800/30 p-3 rounded-xl border border-slate-800/60 print:border-gray-200 print:bg-gray-50">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 print:text-gray-600 mb-1">
                <Key className="w-3.5 h-3.5 text-slate-400 print:hidden" /> Senha / Desbloqueio
              </div>
              <div className="text-sm font-mono text-amber-300 print:text-black font-medium">
                {order.device_password || 'Não informada / Sem senha'}
              </div>
            </div>
          </div>

          {/* Internal Notes */}
          {order.notes && (
            <div className="print:hidden">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Anotações Internas da Bancada
              </span>
              <p className="mt-1 text-xs text-slate-300 bg-slate-800/20 p-2.5 rounded-xl border border-slate-800/60 italic">
                {order.notes}
              </p>
            </div>
          )}

          {/* Financial Breakdown */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-950 to-slate-900 border border-emerald-500/30 print:bg-white print:border-gray-300">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 print:text-black flex items-center gap-1.5 mb-3">
              Resumo de Valores & Lucro
            </span>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-xs text-slate-400 print:text-gray-600">Valor Cobrado</div>
                <div className="text-base sm:text-lg font-bold text-white print:text-black">
                  {formatCurrency(order.total_price)}
                </div>
              </div>
              <div className="print:hidden">
                <div className="text-xs text-slate-400">Custo Peças</div>
                <div className="text-base sm:text-lg font-semibold text-rose-400">
                  {formatCurrency(order.cost_parts)}
                </div>
              </div>
              <div className="print:hidden">
                <div className="text-xs text-emerald-400 font-medium">Lucro Líquido</div>
                <div className="text-base sm:text-lg font-bold text-emerald-300">
                  {formatCurrency(profit)}
                </div>
              </div>
            </div>
          </div>

          {/* Timestamps */}
          <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-800 print:border-gray-200 print:text-gray-600">
            <div>Entrada: {formatDate(order.created_at)}</div>
            <div>Atualizado: {formatDate(order.updated_at)}</div>
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

        {/* Modal Actions Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-t border-slate-800 bg-slate-900/90 backdrop-blur-md print:hidden">
          
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
              onClick={() => {
                onClose();
                onEdit(order);
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-md shadow-blue-600/20 transition-all active:scale-95"
            >
              <Edit className="w-4 h-4" />
              <span>Editar OS</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
