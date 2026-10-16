import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Cache client instance
let cachedClient: SupabaseClient | null = null;
let lastUsedConfig = '';

/**
 * Normaliza a URL do Supabase para o formato correto https://<project-id>.supabase.co
 * Corrige automaticamente quando o usuário cola o link do painel (dashboard/project/...)
 */
export function normalizeSupabaseUrl(inputUrl: string): string {
  let url = (inputUrl || '').trim();
  if (!url) return '';

  // Se o usuário colou o link do painel do Supabase
  // Ex: https://supabase.com/dashboard/project/wdppbyttpwjllggfrwes ou similar
  const dashboardMatch = url.match(/dashboard\/project\/([a-z0-9_-]+)/i);
  if (dashboardMatch && dashboardMatch[1]) {
    return `https://${dashboardMatch[1]}.supabase.co`;
  }

  // Se veio com /rest/v1 ou caminhos extras, pega somente o protocolo e host
  try {
    const withProto = url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;
    const parsed = new URL(withProto);
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return url.replace(/\/+$/, '');
  }
}

export function getSupabaseConfig(): { url: string; key: string } {
  const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

  const localUrl = localStorage.getItem('techfix_supabase_url') || '';
  const localKey = localStorage.getItem('techfix_supabase_anon_key') || '';

  const rawUrl = (localUrl || envUrl).trim();
  const url = normalizeSupabaseUrl(rawUrl);
  const key = (localKey || envKey).trim();

  return { url, key };
}

export function saveSupabaseConfig(url: string, key: string) {
  const cleanUrl = normalizeSupabaseUrl(url);
  const cleanKey = (key || '').trim();

  if (cleanUrl) {
    localStorage.setItem('techfix_supabase_url', cleanUrl);
  } else {
    localStorage.removeItem('techfix_supabase_url');
  }

  if (cleanKey) {
    localStorage.setItem('techfix_supabase_anon_key', cleanKey);
  } else {
    localStorage.removeItem('techfix_supabase_anon_key');
  }

  cachedClient = null;
  lastUsedConfig = '';
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
        persistSession: true,
        autoRefreshToken: true,
      },
    });
    lastUsedConfig = configSignature;
    return cachedClient;
  } catch (err) {
    console.error('Falha ao inicializar cliente Supabase:', err);
    return null;
  }
}

export async function testSupabaseConnection(rawUrl: string, rawKey: string): Promise<{ success: boolean; message: string; normalizedUrl: string }> {
  const url = normalizeSupabaseUrl(rawUrl);
  const key = rawKey.trim();

  if (!url || !key) {
    return { success: false, message: 'URL ou Chave Anon não preenchidos.', normalizedUrl: url };
  }

  try {
    const testClient = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
    const { error } = await testClient.from('orders').select('count', { count: 'exact', head: true });
    
    if (error) {
      if (error.code === '42P01') {
        return {
          success: false,
          normalizedUrl: url,
          message: 'Conectou ao Supabase, mas a tabela "orders" ainda não existe! Clique no botão abaixo para copiar o Script SQL e execute no "SQL Editor" do Supabase.',
        };
      }
      if (error.code === 'PGRST125') {
        return {
          success: false,
          normalizedUrl: url,
          message: 'Caminho inválido na URL do Supabase. Certifique-se de usar https://<seu-projeto>.supabase.co',
        };
      }
      return { success: false, normalizedUrl: url, message: `Erro: ${error.message} (Código: ${error.code})` };
    }

    return { success: true, normalizedUrl: url, message: 'Conexão estabelecida com sucesso! Banco online e sincronizado.' };
  } catch (err: any) {
    return { success: false, normalizedUrl: url, message: err?.message || 'Erro ao conectar ao Supabase' };
  }
}
