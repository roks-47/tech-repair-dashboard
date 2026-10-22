import { getSupabase } from './supabase';

export type ResaleStatus = 'estoque' | 'vendido';

export interface ResalePhone {
  id: string;
  brand: string;
  model: string;
  imei: string;
  purchase_price: number;
  parts_cost: number;
  parts_notes: string;
  resale_price: number;
  status: ResaleStatus;
  seller_name: string;
  seller_cpf: string;
  seller_rg: string;
  seller_phone: string;
  seller_address: string;
  purchase_date: string; // YYYY-MM-DD
  sold_date: string | null; // YYYY-MM-DD
  notes: string;
  created_at: string;
  updated_at: string;
}

export type ResaleInput = Omit<ResalePhone, 'id' | 'created_at' | 'updated_at'>;

const TABLE = 'resale_phones';

// ---------- cálculos ----------
export const totalCost = (p: ResalePhone | ResaleInput) => (p.purchase_price || 0) + (p.parts_cost || 0);
export const phoneProfit = (p: ResalePhone | ResaleInput) => (p.resale_price || 0) - totalCost(p);

// ---------- validações / formatação ----------
export const onlyDigits = (s: string) => (s || '').replace(/\D/g, '');

export function isValidCpf(raw: string): boolean {
  const c = onlyDigits(raw);
  if (c.length !== 11 || /^(\d)\1{10}$/.test(c)) return false;
  const calc = (len: number) => {
    let sum = 0;
    for (let i = 0; i < len; i++) sum += Number(c[i]) * (len + 1 - i);
    const r = (sum * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return calc(9) === Number(c[9]) && calc(10) === Number(c[10]);
}

export function maskCpfInput(raw: string): string {
  const c = onlyDigits(raw).slice(0, 11);
  let out = c.slice(0, 3);
  if (c.length > 3) out += '.' + c.slice(3, 6);
  if (c.length > 6) out += '.' + c.slice(6, 9);
  if (c.length > 9) out += '-' + c.slice(9, 11);
  return out;
}

export function hideCpf(raw: string): string {
  const c = onlyDigits(raw);
  return c.length === 11 ? `•••.•••.•••-${c.slice(9)}` : '•••••••••••';
}

export function isValidImei(raw: string): boolean {
  const d = onlyDigits(raw);
  if (d.length === 14 || d.length === 16) return true;
  if (d.length !== 15) return false;
  let sum = 0;
  for (let i = 0; i < 15; i++) {
    let n = Number(d[14 - i]);
    if (i % 2 === 1) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
  }
  return sum % 10 === 0;
}

export const todayLocal = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const formatIsoDate = (iso: string | null) =>
  iso ? iso.slice(0, 10).split('-').reverse().join('/') : '—';

// ---------- acesso ao banco ----------
export async function fetchResalePhones(): Promise<{ phones: ResalePhone[]; error?: string }> {
  const supabase = getSupabase();
  if (!supabase) return { phones: [], error: 'Supabase não configurado neste aparelho' };

  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    if (error.code === '42P01' || error.code === 'PGRST205') {
      return { phones: [], error: 'A tabela "resale_phones" ainda não existe. Rode o resale.sql no SQL Editor da Supabase.' };
    }
    return { phones: [], error: error.message };
  }
  return {
    phones: (data || []).map((p: any) => ({
      ...p,
      purchase_price: Number(p.purchase_price) || 0,
      parts_cost: Number(p.parts_cost) || 0,
      resale_price: Number(p.resale_price) || 0,
    })),
  };
}

export async function createResalePhone(input: ResaleInput): Promise<{ error?: string }> {
  const supabase = getSupabase();
  if (!supabase) return { error: 'Supabase não configurado neste aparelho' };
  const { error } = await supabase.from(TABLE).insert(input);
  return error ? { error: error.message } : {};
}

export async function updateResalePhone(
  id: string,
  input: Partial<ResaleInput>
): Promise<{ error?: string }> {
  const supabase = getSupabase();
  if (!supabase) return { error: 'Supabase não configurado neste aparelho' };
  const { error } = await supabase
    .from(TABLE)
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', id);
  return error ? { error: error.message } : {};
}

export async function deleteResalePhone(id: string): Promise<{ error?: string }> {
  const supabase = getSupabase();
  if (!supabase) return { error: 'Supabase não configurado neste aparelho' };
  const { error } = await supabase.from(TABLE).delete().eq('id', id);
  return error ? { error: error.message } : {};
}

export function subscribeToResale(onChange: () => void): () => void {
  const supabase = getSupabase();
  if (!supabase) return () => {};
  const channel = supabase
    .channel('resale_changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: TABLE }, () => onChange())
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}
