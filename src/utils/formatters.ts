import type { OSStatus, DeviceType } from '../types';

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value || 0);
}

export function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return dateStr;
  }
}

export function formatShortDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
    }).format(d);
  } catch {
    return dateStr;
  }
}

export function cleanPhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

export function formatPhone(phone: string): string {
  const digits = cleanPhone(phone);
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  } else if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return phone;
}

export function getStatusBadge(status: OSStatus): {
  label: string;
  bg: string;
  border: string;
  text: string;
  dot: string;
} {
  switch (status) {
    case 'aguardando_orcamento':
      return {
        label: 'Aguardando Orçamento',
        bg: 'bg-amber-500/10',
        border: 'border-amber-500/30',
        text: 'text-amber-400',
        dot: 'bg-amber-400',
      };
    case 'aprovado':
      return {
        label: 'Orçamento Aprovado',
        bg: 'bg-sky-500/10',
        border: 'border-sky-500/30',
        text: 'text-sky-400',
        dot: 'bg-sky-400',
      };
    case 'em_bancada':
      return {
        label: 'Na Bancada / Reparo',
        bg: 'bg-purple-500/10',
        border: 'border-purple-500/30',
        text: 'text-purple-400',
        dot: 'bg-purple-400',
      };
    case 'aguardando_peca':
      return {
        label: 'Aguardando Peça',
        bg: 'bg-orange-500/10',
        border: 'border-orange-500/30',
        text: 'text-orange-400',
        dot: 'bg-orange-400',
      };
    case 'pronto':
      return {
        label: 'Pronto p/ Retirada',
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/30',
        text: 'text-emerald-400',
        dot: 'bg-emerald-400',
      };
    case 'entregue':
      return {
        label: 'Finalizado / Entregue',
        bg: 'bg-slate-700/30',
        border: 'border-slate-600/30',
        text: 'text-slate-400',
        dot: 'bg-slate-400',
      };
    case 'cancelado':
      return {
        label: 'Cancelado',
        bg: 'bg-rose-500/10',
        border: 'border-rose-500/30',
        text: 'text-rose-400',
        dot: 'bg-rose-400',
      };
  }
}

export function getDeviceBadge(type: DeviceType): {
  label: string;
  iconName: string;
  color: string;
  bg: string;
} {
  switch (type) {
    case 'celular':
      return {
        label: 'Celular',
        iconName: 'Smartphone',
        color: 'text-cyan-400',
        bg: 'bg-cyan-500/10 border-cyan-500/30',
      };
    case 'videogame':
      return {
        label: 'Videogame',
        iconName: 'Gamepad2',
        color: 'text-fuchsia-400',
        bg: 'bg-fuchsia-500/10 border-fuchsia-500/30',
      };
    default:
      return {
        label: 'Outro',
        iconName: 'Wrench',
        color: 'text-slate-300',
        bg: 'bg-slate-700/20 border-slate-600/30',
      };
  }
}

export function generateWhatsAppMessage(
  status: OSStatus,
  clientName: string,
  deviceModel: string,
  osNumber: number,
  totalPrice: number,
  shopName: string
): string {
  const firstName = clientName.split(' ')[0] || clientName;
  const priceFormatted = formatCurrency(totalPrice);

  switch (status) {
    case 'pronto':
      return `Olá, ${firstName}! Tudo bem? 🛠️\nPassando para avisar que o seu *${deviceModel}* (OS #${osNumber}) já está *PRONTO* para retirada aqui na *${shopName}*!\n\n💰 Valor total: *${priceFormatted}*\nFicamos no aguardo da sua visita!`;
    case 'aprovado':
      return `Olá, ${firstName}! 🔧\nConfirmando que o orçamento do seu *${deviceModel}* (OS #${osNumber}) foi aprovado. Já iniciamos o procedimento de bancada!\n\nQualquer novidade avisamos por aqui.`;
    case 'aguardando_orcamento':
      return `Olá, ${firstName}! Tudo bem? 🔍\nFinalizamos a análise do seu *${deviceModel}* (OS #${osNumber}) na *${shopName}*.\n\nO valor do conserto fica em *${priceFormatted}*.\nPodemos aprovar o início do reparo?`;
    case 'aguardando_peca':
      return `Olá, ${firstName}! 📦\nAtualização sobre seu *${deviceModel}* (OS #${osNumber}): a peça necessária para o reparo já foi encomendada. Assim que chegar e for instalada, te avisamos!`;
    case 'entregue':
      return `Olá, ${firstName}! Muito obrigado pela confiança em consertar seu *${deviceModel}* na *${shopName}*. Conte sempre conosco!`;
    default:
      return `Olá, ${firstName}! Atualização sobre sua Ordem de Serviço #${osNumber} (${deviceModel}) na *${shopName}*.`;
  }
}

export function createWhatsAppUrl(
  phone: string,
  message: string
): string {
  const digits = cleanPhone(phone);
  // Default to Brazil DDI (+55) if not present
  const fullPhone = digits.length <= 11 ? `55${digits}` : digits;
  return `https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`;
}
