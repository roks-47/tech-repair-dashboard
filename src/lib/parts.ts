import { getSupabase } from './supabase';

export interface Part {
  id: string;
  supplier: string;
  model: string;
  part: string;
  description: string;
  price: number;
  updated_at: string;
}

export type PartInput = Omit<Part, 'id' | 'updated_at'>;

const TABLE = 'parts';

export async function fetchParts(): Promise<{ parts: Part[]; error?: string }> {
  const supabase = getSupabase();
  if (!supabase) return { parts: [], error: 'Supabase não configurado neste aparelho' };

  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .order('supplier', { ascending: true })
    .order('model', { ascending: true });

  if (error) {
    if (error.code === '42P01') {
      return { parts: [], error: 'A tabela "parts" ainda não existe. Rode o parts.sql no SQL Editor da Supabase.' };
    }
    return { parts: [], error: error.message };
  }
  return {
    parts: (data || []).map((p: any) => ({ ...p, price: Number(p.price) || 0 })),
  };
}

export async function createPart(input: PartInput): Promise<{ error?: string }> {
  const supabase = getSupabase();
  if (!supabase) return { error: 'Supabase não configurado neste aparelho' };
  const { error } = await supabase.from(TABLE).insert(input);
  return error ? { error: error.message } : {};
}

export async function updatePart(id: string, input: PartInput): Promise<{ error?: string }> {
  const supabase = getSupabase();
  if (!supabase) return { error: 'Supabase não configurado neste aparelho' };
  const { error } = await supabase
    .from(TABLE)
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', id);
  return error ? { error: error.message } : {};
}

export async function deletePart(id: string): Promise<{ error?: string }> {
  const supabase = getSupabase();
  if (!supabase) return { error: 'Supabase não configurado neste aparelho' };
  const { error } = await supabase.from(TABLE).delete().eq('id', id);
  return error ? { error: error.message } : {};
}

export function subscribeToParts(onChange: () => void): () => void {
  const supabase = getSupabase();
  if (!supabase) return () => {};
  const channel = supabase
    .channel('parts_changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: TABLE }, () => onChange())
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}
