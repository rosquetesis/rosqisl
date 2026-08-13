/**
 * GET /api/health — Diagnostic endpoint
 * Tests Supabase connectivity and returns env var status (without exposing values).
 */
import type { Handler } from '@netlify/functions';
import { jsonResponse, optionsResponse, getSupabaseAdmin } from './_utils';

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return optionsResponse();
  if (event.httpMethod !== 'GET') return jsonResponse(405, { error: 'Method not allowed' });

  const diagnostics: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    env: {
      VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL ? '✅ Configurada' : '❌ Falta',
      VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY ? '✅ Configurada' : '❌ Falta',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Configurada' : '❌ Falta',
      GEMINI_API_KEY: process.env.GEMINI_API_KEY ? '✅ Configurada' : '⚠️ Opcional (no configurada)',
    },
  };

  // Test Supabase connection
  try {
    const supabase = getSupabaseAdmin();
    
    // Test 1: Can we read store_settings?
    const { data: settings, error: settingsErr } = await supabase
      .from('store_settings')
      .select('id, store_name, exchange_rate_ves, admin_username')
      .eq('id', 'main')
      .single();

    if (settingsErr) {
      diagnostics.supabase = {
        connected: false,
        error: settingsErr.message,
        hint: settingsErr.hint || 'Verifica que las tablas existan ejecutando schema.sql en Supabase SQL Editor',
        code: settingsErr.code,
      };
    } else {
      diagnostics.supabase = {
        connected: true,
        storeName: settings?.store_name || 'N/A',
        exchangeRate: settings?.exchange_rate_ves || 'N/A',
        hasAdminUsername: settings?.admin_username ? true : false,
        message: '¡Conexión exitosa con Supabase!',
      };

      // Test 2: Can we write? (update timestamp)
      const { error: writeErr } = await supabase
        .from('store_settings')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', 'main');

      diagnostics.supabase_write = writeErr
        ? { success: false, error: writeErr.message, hint: 'Verifica SUPABASE_SERVICE_ROLE_KEY' }
        : { success: true, message: '¡Escritura exitosa!' };
    }

    // Test 3: Check tables exist
    const tables = ['products', 'customers', 'orders', 'ingredients', 'production_batches'];
    const tableChecks: Record<string, unknown> = {};
    for (const table of tables) {
      const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
      tableChecks[table] = error
        ? { exists: false, error: error.message }
        : { exists: true, rowCount: count };
    }
    diagnostics.tables = tableChecks;

  } catch (err: any) {
    diagnostics.supabase = {
      connected: false,
      error: err.message,
      hint: 'Verifica que VITE_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY estén configuradas en Netlify',
    };
  }

  return jsonResponse(200, diagnostics);
};
