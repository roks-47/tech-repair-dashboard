import { getSupabase } from './supabase';

export interface SharedSettings {
  shop_name: string;
  technicians: string[];
}

const TABLE = 'shop_settings';

/** Lê o nome da loja e os técnicos do Supabase. Retorna null se não houver nuvem ou linha. */
export async function fetchSharedSettings(): Promise<SharedSettings | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from(TABLE)
    .select('shop_name, technicians')
    .eq('id', 1)
    .maybeSingle();

  if (error) {
    console.error('Erro ao ler configurações compartilhadas:', error.message);
    return null;
  }
  if (!data) return null;

  return {
    shop_name: data.shop_name,
    technicians: Array.isArray(data.technicians) ? data.technicians : [],
  };
}

/** Grava o nome da loja e os técnicos no Supabase (uma única linha, id = 1). */
export async function saveSharedSettings(
  settings: SharedSettings
): Promise<{ error?: string }> {
  const supabase = getSupabase();
  if (!supabase) return { error: 'Supabase não configurado neste aparelho' };

  const { error } = await supabase.from(TABLE).upsert({
    id: 1,
    shop_name: settings.shop_name,
    technicians: settings.technicians,
    updated_at: new Date().toISOString(),
  });

  return error ? { error: error.message } : {};
}

/** Avisa quando outro aparelho altera as configurações. Retorna função para cancelar. */
export function subscribeToSharedSettings(onChange: () => void): () => void {
  const supabase = getSupabase();
  if (!supabase) return () => {};

  const channel = supabase
    .channel('shop_settings_changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: TABLE },
      () => onChange()
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
