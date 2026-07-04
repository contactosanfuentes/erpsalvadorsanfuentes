// ============================================================
// db.js — Cliente Supabase (singleton)
// Todas las consultas del ERP pasan por este cliente único.
// ============================================================
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';

let _client = null;

export function getClient() {
  if (_client) return _client;
  if (!window.supabase) throw new Error('SDK de Supabase no cargado');
  _client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: true, autoRefreshToken: true },
  });
  return _client;
}

// Helper genérico: lanza el error de Supabase en vez de silenciarlo
export async function q(promise) {
  const { data, error } = await promise;
  if (error) throw error;
  return data;
}
