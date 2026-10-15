export type DeviceType = 'celular' | 'videogame' | 'outro';

export type OSStatus = 
  | 'aguardando_orcamento'
  | 'aprovado'
  | 'em_bancada'
  | 'aguardando_peca'
  | 'pronto'
  | 'entregue'
  | 'cancelado';

export interface Order {
  id: string;
  os_number: number;
  client_name: string;
  client_phone: string;
  device_type: DeviceType;
  device_brand: string;
  device_model: string;
  defect_reported: string;
  technical_report?: string;
  status: OSStatus;
  technician_name: string;
  cost_parts: number;
  total_price: number;
  accessories?: string;
  device_password?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ShopSettings {
  shop_name: string;
  technicians: string[];
  active_technician: string;
  pin_code: string;
  pin_required: boolean;
  supabase_url?: string;
  supabase_anon_key?: string;
}

export interface FinancialSummary {
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  activeOrdersCount: number;
  readyOrdersCount: number;
  cellPhonesCount: number;
  videogamesCount: number;
}
