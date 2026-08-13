/**
 * POST   /api/clients     — Create or update a client
 * DELETE /api/clients/:id — Delete a client
 */
import type { Handler } from '@netlify/functions';
import {
  jsonResponse, optionsResponse, getSupabaseAdmin,
  sanitizeStr, sanitizeNum, sanitizeInt, isSafeId,
} from './_utils.mjs';

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return optionsResponse();

  const method = event.httpMethod;
  const pathParts = (event.path || '').split('/').filter(Boolean);
  const clientId = pathParts[pathParts.length - 1] !== 'clients' ? pathParts[pathParts.length - 1] : undefined;

  if (method === 'POST') return upsertClient(event.body);
  if (method === 'DELETE' && clientId) return deleteClient(clientId);

  return jsonResponse(405, { error: 'Method not allowed' });
};

async function upsertClient(rawBody: string | null) {
  let body: Record<string, unknown>;
  try { body = JSON.parse(rawBody || '{}'); } catch { return jsonResponse(400, { error: 'JSON inválido' }); }

  if (!body.name || !body.phone) {
    return jsonResponse(400, { error: 'Nombre y teléfono son requeridos' });
  }

  const client = {
    id: sanitizeStr(body.id || `cli-${Date.now()}`, 100),
    name: sanitizeStr(body.name, 200),
    phone: sanitizeStr(body.phone, 30),
    email: sanitizeStr(body.email || '', 200),
    city: sanitizeStr(body.city || 'Maracay', 100),
    address: sanitizeStr(body.address || '', 500),
    total_orders: sanitizeInt(body.totalOrders),
    total_spent_usd: sanitizeNum(body.totalSpentUSD),
    notes: sanitizeStr(body.notes || '', 1000),
  };

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('customers')
      .upsert(client, { onConflict: 'id' })
      .select()
      .single();
    if (error) throw error;
    return jsonResponse(200, { success: true, client: data });
  } catch (err: any) {
    console.error('[clients] Upsert error:', err.message);
    return jsonResponse(500, { error: 'Error guardando el cliente' });
  }
}

async function deleteClient(id: string) {
  if (!isSafeId(id)) return jsonResponse(400, { error: 'ID inválido' });
  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from('customers').delete().eq('id', id);
    if (error) throw error;
    return jsonResponse(200, { success: true });
  } catch (err: any) {
    console.error('[clients] Delete error:', err.message);
    return jsonResponse(500, { error: 'Error eliminando el cliente' });
  }
}
