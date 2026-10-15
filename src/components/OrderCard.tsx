import React from 'react';
import { 
  Smartphone, 
  Gamepad2, 
  Wrench, 
  MessageCircle, 
  User, 
  Calendar, 
  ChevronRight,
  TrendingUp,
  Tag,
  Edit2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import type { Order, OSStatus } from '../types';
import { 
  formatCurrency, 
  formatShortDate, 
  formatPhone, 
  getStatusBadge, 
  generateWhatsAppMessage, 
  createWhatsAppUrl 
} from '../utils/formatters';

interface OrderCardProps {
  order: Order;
  shopName: string;
  onUpdateStatus: (id: string, newStatus: OSStatus) => void;
  onViewDetails: (order: Order) => void;
  onEdit: (order: Order) => void;
}

export const OrderCard: React.FC<OrderCardProps> = ({
  order,
  shopName,
  onUpdateStatus,
  onViewDetails,
  onEdit,
}) => {
  const statusBadge = getStatusBadge(order.status);
  const profit = (order.total_price || 0) - (order.cost_parts || 0);

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    e.stopPropagation();
    const newStatus = e.target.value as OSStatus;
    onUpdateStatus(order.id, newStatus);

    if (newStatus === 'pronto') {
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
        });
      } catch (err) {
        // Safe fallback
      }
    }
  };

  const handleWhatsAppClick = (e: React.MouseEvent) => {
    e.stopPropagation();
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

  const isCelular = order.device_type === 'celular';
  const isVideogame = order.device_type === 'videogame';

  return (
    <div 
      onClick={() => onViewDetails(order)}
      className="group bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-4 sm:p-5 transition-all shadow-md hover:shadow-xl cursor-pointer relative flex flex-col justify-between"
    >
      
      {/* Top Header: Device Type Badge, OS#, Date */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          
          <div className="flex items-center gap-2 flex-wrap">
            {/* Device Type Badge */}
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${
              isCelular 
                ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30' 
                : isVideogame 
                ? 'bg-fuchsia-500/10 text-fuchsia-300 border-fuchsia-500/30'
                : 'bg-slate-800 text-slate-300 border-slate-700'
            }`}>
              {isCelular && <Smartphone className="w-3.5 h-3.5" />}
              {isVideogame && <Gamepad2 className="w-3.5 h-3.5" />}
              {!isCelular && !isVideogame && <Wrench className="w-3.5 h-3.5" />}
              <span className="capitalize">{order.device_type}</span>
            </span>

            {/* OS Number */}
            <span className="text-xs font-mono font-bold text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-md">
              OS #{order.os_number}
            </span>
          </div>

          {/* Date */}
          <div className="flex items-center gap-1 text-[11px] text-slate-500">
            <Calendar className="w-3 h-3" />
            <span>{formatShortDate(order.created_at)}</span>
          </div>

        </div>

        {/* Device Brand & Model */}
        <div className="mb-2">
          <h2 className="text-base sm:text-lg font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-1">
            {order.device_brand} {order.device_model}
          </h2>
          <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
            <span className="text-slate-500 font-medium">Defeito: </span>
            {order.defect_reported}
          </p>
        </div>

        {/* Client info & technician */}
        <div className="flex items-center justify-between text-xs text-slate-400 mb-3 pt-2 border-t border-slate-800/80">
          <div className="flex items-center gap-1.5 truncate mr-2">
            <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span className="font-medium text-slate-300 truncate">{order.client_name}</span>
            <span className="text-slate-500 text-[11px] hidden sm:inline">
              ({formatPhone(order.client_phone)})
            </span>
          </div>

          <div className="flex items-center gap-1 bg-slate-800/60 text-slate-300 text-[11px] px-2 py-0.5 rounded shrink-0">
            <Tag className="w-3 h-3 text-slate-400" />
            <span>{order.technician_name}</span>
          </div>
        </div>

        {/* Financial info: Cost, Price, Profit */}
        <div className="bg-slate-950/60 rounded-xl p-2.5 mb-3 border border-slate-800/60 grid grid-cols-3 gap-1 text-center">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">Preço Cobrado</div>
            <div className="text-xs sm:text-sm font-bold text-slate-200">
              {formatCurrency(order.total_price)}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">Peças</div>
            <div className="text-xs sm:text-sm font-semibold text-rose-400">
              {formatCurrency(order.cost_parts)}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-emerald-400 font-medium flex items-center justify-center gap-0.5">
              <TrendingUp className="w-2.5 h-2.5" /> Lucro
            </div>
            <div className="text-xs sm:text-sm font-bold text-emerald-300">
              {formatCurrency(profit)}
            </div>
          </div>
        </div>
      </div>

      {/* Card Footer: Quick Status Changer & Actions */}
      <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
        
        {/* Status Dropdown */}
        <div className="relative flex-1">
          <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold ${statusBadge.bg} ${statusBadge.border} ${statusBadge.text}`}>
            <span className={`w-2 h-2 rounded-full ${statusBadge.dot}`} />
            <select
              value={order.status}
              onChange={handleStatusChange}
              className="bg-transparent text-xs font-semibold focus:outline-none cursor-pointer w-full"
            >
              <option value="aguardando_orcamento" className="bg-slate-900 text-slate-200">Aguardando Orçamento</option>
              <option value="aprovado" className="bg-slate-900 text-slate-200">Aprovado</option>
              <option value="em_bancada" className="bg-slate-900 text-slate-200">Na Bancada</option>
              <option value="aguardando_peca" className="bg-slate-900 text-slate-200">Aguardando Peça</option>
              <option value="pronto" className="bg-slate-900 text-slate-200">Pronto p/ Retirada</option>
              <option value="entregue" className="bg-slate-900 text-slate-200">Entregue / Finalizado</option>
              <option value="cancelado" className="bg-slate-900 text-slate-200">Cancelado</option>
            </select>
          </div>
        </div>

        {/* WhatsApp Button */}
        <button
          onClick={handleWhatsAppClick}
          title="Notificar cliente via WhatsApp"
          className="flex items-center justify-center p-2 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 transition-all hover:scale-105 active:scale-95 shrink-0"
        >
          <MessageCircle className="w-4 h-4 fill-emerald-400/20" />
        </button>

        {/* Quick Edit */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(order);
          }}
          title="Editar OS"
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all shrink-0"
        >
          <Edit2 className="w-4 h-4" />
        </button>

        {/* View Details Icon */}
        <button
          onClick={() => onViewDetails(order)}
          title="Ver detalhes completos e imprimir OS"
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all shrink-0"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

      </div>

    </div>
  );
};
