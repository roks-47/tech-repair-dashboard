import type { Order } from '../types';

// Prazo de garantia da loja, em dias (igual ao termo impresso na OS)
export const WARRANTY_DAYS = 90;

const DAY_MS = 24 * 60 * 60 * 1000;

/** Data de entrega. Usa delivered_at; se não existir, cai para a última alteração (estimativa). */
export function getDeliveryDate(order: Order): Date {
  const raw = (order as any).delivered_at || (order as any).updated_at || order.created_at;
  return new Date(raw);
}

export function getWarranty(order: Order) {
  const start = getDeliveryDate(order);
  const end = new Date(start.getTime() + WARRANTY_DAYS * DAY_MS);
  const daysLeft = Math.ceil((end.getTime() - Date.now()) / DAY_MS);
  return {
    start,
    end,
    daysLeft,
    active: daysLeft >= 0,
    estimated: !(order as any).delivered_at,
  };
}

export const formatDay = (d: Date) => d.toLocaleDateString('pt-BR');
