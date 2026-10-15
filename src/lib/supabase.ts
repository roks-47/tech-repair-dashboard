import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Cache client instance
let cachedClient: SupabaseClient | null = null;
let lastUsedConfig = '';

export function getSupabaseConfig(): { url: string; key: string } {
  const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

  const localUrl = localStorage.getItem('techfix_supabase_url') || '';
  const localKey = localStorage.getItem('techfix_supabase_anon_key') || '';

  const url = (localUrl || envUrl).trim();
  const key = (localKey || envKey).trim();

  return { url, key };
}

export function saveSupabaseConfig(url: string, key: string) {
  if (url) {
    localStorage.setItem('techfix_supabase_url', url.trim());
  } else {
    localStorage.removeItem('techfix_supabase_url');
  }

  if (key) {
    localStorage.setItem('techfix_supabase_anon_key', key.trim());
  } else {
    localStorage.removeItem('techfix_supabase_anon_key');
  }

  cachedClient = null;
}

export function getSupabase(): SupabaseClient | null {
  const { url, key } = getSupabaseConfig();
  if (!url || !key) return null;

  const configSignature = `${url}:${key}`;
  if (cachedClient && lastUsedConfig === configSignature) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(url, key, {
      auth: {
        persistSession: false,
      },
    });
    lastUsedConfig = configSignature;
    return cachedClient;
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    return null;
  }
}

export async function testSupabaseConnection(url: string, key: string): Promise<{ success: boolean; message: string }> {
  try {
    const testClient = createClient(url.trim(), key.trim());
    const { error } = await testClient.from('orders').select('count', { count: 'exact', head: true });
    
    if (error) {
      if (error.code === '42P01') {
        return {
          success: false,
          message: 'Conectou ao Supabase, mas a tabela "orders" ainda não existe! Execute o script SQL no editor do Supabase.',
        };
      }
      return { success: false, message: `Erro: ${error.message}` };
    }

    return { success: true, message: 'Conexão estabelecida com sucesso! Banco online e sincronizado.' };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Erro ao conectar ao Supabase' };
  }
}
