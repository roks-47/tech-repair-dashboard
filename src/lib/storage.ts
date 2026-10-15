import type { Order, ShopSettings } from '../types';
import { getSupabase } from './supabase';

const LOCAL_STORAGE_ORDERS_KEY = 'techfix_orders_data_v1';
const LOCAL_STORAGE_SETTINGS_KEY = 'techfix_settings_v1';

export const INITIAL_MOCK_ORDERS: Order[] = [
  {
    id: 'mock-1',
    os_number: 1001,
    client_name: 'Carlos Ferreira',
    client_phone: '11987654321',
    device_type: 'celular',
    device_brand: 'Apple',
    device_model: 'iPhone 13 Pro',
    defect_reported: 'Tela trincada após queda e toque fantasma na lateral',
    technical_report: 'Troca de frontal OLED Premium e limpeza do sensor Face ID',
    status: 'em_bancada',
    technician_name: 'Técnico 1',
    cost_parts: 280.00,
    total_price: 580.00,
    accessories: 'Capa transparente + Gaveta de chip',
    device_password: '1234 (senha padrão)',
    notes: 'Cliente solicitou entrega até às 17h.',
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'mock-2',
    os_number: 1002,
    client_name: 'Rodrigo Alves',
    client_phone: '11912345678',
    device_type: 'videogame',
    device_brand: 'Sony',
    device_model: 'PlayStation 5 Slim',
    defect_reported: 'Desligando sozinho após 20 minutos de jogo e aquecendo excessivamente',
    technical_report: '',
    status: 'aguardando_peca',
    technician_name: 'Técnico 2',
    cost_parts: 45.00,
    total_price: 250.00,
    accessories: 'Console avulso, sem cabos nem controle',
    notes: 'Aguardando chegada do metal líquido e thermal pads novos.',
    created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'mock-3',
    os_number: 1003,
    client_name: 'Mariana Lima',
    client_phone: '11998877665',
    device_type: 'celular',
    device_brand: 'Samsung',
    device_model: 'Galaxy S23',
    defect_reported: 'Bateria drenando rápido e conector Tipo-C com mau contato',
    technical_report: 'Substituição da bateria original e desoxidação da sub-placa de carga.',
    status: 'pronto',
    technician_name: 'Técnico 1',
    cost_parts: 110.00,
    total_price: 320.00,
    accessories: 'Película de gel aplicada',
    notes: 'Cliente avisada pelo WhatsApp que está pronto para retirada.',
    created_at: new Date(Date.now() - 3600000 * 72).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'mock-4',
    os_number: 1004,
    client_name: 'Felipe Santos',
    client_phone: '11977778888',
    device_type: 'videogame',
    device_brand: 'Microsoft',
    device_model: 'Xbox Series S',
    defect_reported: 'Sem imagem na TV (HDMI não dá sinal, luz branca no console)',
    technical_report: 'Troca do CI retimer HDMI e conector HDMI reforçado',
    status: 'aguardando_orcamento',
    technician_name: 'Técnico 2',
    cost_parts: 70.00,
    total_price: 350.00,
    accessories: 'Cabo de força incluído',
    notes: 'Aparelho nunca foi aberto antes (lacres intactos).',
    created_at: new Date(Date.now() - 3600000 * 6).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'mock-5',
    os_number: 1005,
    client_name: 'Beatriz Rocha',
    client_phone: '11965432190',
    device_type: 'videogame',
    device_brand: 'Nintendo',
    device_model: 'Switch OLED',
    defect_reported: 'Drift severo nos analógicos dos dois Joy-Cons',
    technical_report: 'Instalação de analógicos Hall Effect magnéticos (anti-drift).',
    status: 'entregue',
    technician_name: 'Técnico 1',
    cost_parts: 60.00,
    total_price: 190.00,
    accessories: '2 Joy-Cons + Strap',
    notes: 'Garantia de 90 dias.',
    created_at: new Date(Date.now() - 3600000 * 120).toISOString(),
    updated_at: new Date().toISOString(),
  }
];

export const DEFAULT_SETTINGS: ShopSettings = {
  shop_name: 'TechFix Reparos & Games',
  technicians: ['Técnico 1', 'Técnico 2'],
  active_technician: 'Técnico 1',
  pin_code: '1234',
  pin_required: false,
};

// Helper: sincroniza dados com o servidor local (compartilhado entre PC e celular)
async function syncToServerApi(endpoint: string, data: any): Promise<boolean> {
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function fetchFromServerApi<T>(endpoint: string): Promise<T | null> {
  try {
    const res = await fetch(endpoint);
    if (!res.ok) return null;
    const data = await res.json();
    return data;
  } catch {
    return null;
  }
}

// Salva ordens localmente (tanto no localStorage quanto no servidor da rede local)
async function persistLocalOrders(orders: Order[]): Promise<void> {
  try {
    localStorage.setItem(LOCAL_STORAGE_ORDERS_KEY, JSON.stringify(orders));
  } catch (e) {
    console.error('Falha ao gravar localStorage:', e);
  }
  // Envia em segundo plano para o arquivo orders.json no PC
  syncToServerApi('/api/orders', orders);
}

export function getSettings(): ShopSettings {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_SETTINGS_KEY);
    if (raw) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    }
  } catch {
    // fallback
  }
  return DEFAULT_SETTINGS;
}

export function saveSettings(settings: ShopSettings) {
  try {
    localStorage.setItem(LOCAL_STORAGE_SETTINGS_KEY, JSON.stringify(settings));
    syncToServerApi('/api/settings', settings);
  } catch (e) {
    console.error('Falha ao salvar configurações:', e);
  }
}

export async function fetchOrders(): Promise<{ orders: Order[]; isCloud: boolean }> {
  const supabase = getSupabase();

  // 1. Tenta buscar do Supabase se configurado
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('os_number', { ascending: false });

      if (error) {
        console.warn('Erro ao buscar do Supabase (recorrendo ao banco local/disco):', error);
      } else if (data) {
        const mapped: Order[] = data.map((d: any) => ({
          ...d,
          cost_parts: Number(d.cost_parts || 0),
          total_price: Number(d.total_price || 0),
          os_number: Number(d.os_number || 0),
        }));
        // Salva cache local
        await persistLocalOrders(mapped);
        return { orders: mapped, isCloud: true };
      }
    } catch (e) {
      console.error('Falha de rede Supabase:', e);
    }
  }

  // 2. Se não está em nuvem ou deu erro no Supabase, busca do servidor compartilhado local (disco)
  const serverOrders = await fetchFromServerApi<Order[]>('/api/orders');
  if (Array.isArray(serverOrders) && serverOrders.length > 0) {
    try {
      localStorage.setItem(LOCAL_STORAGE_ORDERS_KEY, JSON.stringify(serverOrders));
    } catch {}
    return { orders: serverOrders, isCloud: false };
  }

  // 3. Fallback para localStorage
  try {
    const local = localStorage.getItem(LOCAL_STORAGE_ORDERS_KEY);
    if (local) {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return { orders: parsed, isCloud: false };
      }
    }
  } catch (e) {
    console.error('Falha ao ler localStorage:', e);
  }

  // 4. Primeira execução: inicializa dados modelo
  try {
    localStorage.setItem(LOCAL_STORAGE_ORDERS_KEY, JSON.stringify(INITIAL_MOCK_ORDERS));
    syncToServerApi('/api/orders', INITIAL_MOCK_ORDERS);
  } catch {}
  return { orders: INITIAL_MOCK_ORDERS, isCloud: false };
}

export async function createOrder(
  orderData: Omit<Order, 'id' | 'os_number' | 'created_at' | 'updated_at'>
): Promise<{ order: Order; cloudSynced: boolean; cloudError?: string }> {
  const supabase = getSupabase();
  const now = new Date().toISOString();
  let cloudSynced = false;
  let cloudError: string | undefined;

  // Busca lista atual para gerar novo número de OS
  const { orders } = await fetchOrders();
  const nextOsNumber = orders.length > 0 
    ? Math.max(...orders.map(o => Number(o.os_number) || 1000)) + 1 
    : 1001;

  let newOrder: Order = {
    ...orderData,
    id: 'local-' + Date.now(),
    os_number: nextOsNumber,
    created_at: now,
    updated_at: now,
  };

  // Se o Supabase estiver configurado, tenta salvar na nuvem
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .insert([{
          ...orderData,
          created_at: now,
          updated_at: now,
        }])
        .select()
        .single();

      if (!error && data) {
        newOrder = {
          ...data,
          cost_parts: Number(data.cost_parts || 0),
          total_price: Number(data.total_price || 0),
          os_number: Number(data.os_number || nextOsNumber),
        };
        cloudSynced = true;
      } else if (error) {
        cloudError = error.message;
        console.warn('Erro ao inserir no Supabase (salvo localmente no disco):', error);
      }
    } catch (e: any) {
      cloudError = e.message;
      console.error('Exceção ao inserir no Supabase:', e);
    }
  }

  // SEMPRE persiste localmente e no arquivo compartilhado do PC
  const updatedOrders = [newOrder, ...orders.filter(o => o.id !== newOrder.id)];
  await persistLocalOrders(updatedOrders);

  return { order: newOrder, cloudSynced, cloudError };
}

export async function updateOrder(
  id: string, 
  updates: Partial<Order>
): Promise<{ order: Order; cloudSynced: boolean; cloudError?: string }> {
  const supabase = getSupabase();
  const now = new Date().toISOString();
  let cloudSynced = false;
  let cloudError: string | undefined;

  // 1. Atualiza na lista local e no disco primeiro para NUNCA perder os dados
  const { orders } = await fetchOrders();
  let updatedOrder: Order | null = null;
  const nextList = orders.map(o => {
    if (o.id === id) {
      updatedOrder = { 
        ...o, 
        ...updates, 
        updated_at: now 
      };
      return updatedOrder;
    }
    return o;
  });

  if (!updatedOrder) {
    // Se não encontrou, cria a ordem com as alterações
    updatedOrder = {
      id,
      os_number: 1000,
      client_name: 'Cliente',
      client_phone: '',
      device_type: 'outro',
      device_brand: '',
      device_model: '',
      defect_reported: '',
      status: 'aguardando_orcamento',
      technician_name: 'Técnico',
      cost_parts: 0,
      total_price: 0,
      created_at: now,
      updated_at: now,
      ...updates,
    } as Order;
    nextList.unshift(updatedOrder);
  }

  await persistLocalOrders(nextList);

  // 2. Se o Supabase estiver configurado, tenta atualizar na nuvem
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .update({
          ...updates,
          updated_at: now,
        })
        .eq('id', id)
        .select()
        .single();

      if (!error && data) {
        cloudSynced = true;
      } else if (error) {
        cloudError = error.message;
        console.warn('Erro ao atualizar no Supabase (alteração gravada localmente):', error);
      }
    } catch (e: any) {
      cloudError = e.message;
      console.error('Falha de conexão Supabase ao atualizar:', e);
    }
  }

  return { order: updatedOrder, cloudSynced, cloudError };
}

export async function deleteOrder(id: string): Promise<boolean> {
  const supabase = getSupabase();

  if (supabase) {
    try {
      await supabase.from('orders').delete().eq('id', id);
    } catch (e) {
      console.warn('Falha ao deletar no Supabase:', e);
    }
  }

  const { orders } = await fetchOrders();
  const filtered = orders.filter(o => o.id !== id);
  await persistLocalOrders(filtered);
  return true;
}

export function subscribeToRealtimeOrders(onUpdate: () => void) {
  const supabase = getSupabase();
  if (!supabase) return () => {};

  try {
    const channel = supabase
      .channel('public:orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        onUpdate();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  } catch (e) {
    console.error('Erro ao configurar canal realtime:', e);
    return () => {};
  }
}
