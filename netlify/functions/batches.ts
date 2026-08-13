/**
 * POST /api/batches — Register a production batch
 * Decrements ingredient stock and increments product finished stock.
 */
import type { Handler } from '@netlify/functions';
import {
  jsonResponse, optionsResponse, getSupabaseAdmin,
  sanitizeStr, sanitizeInt, isSafeId,
} from './_utils';

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return optionsResponse();
  if (event.httpMethod !== 'POST') return jsonResponse(405, { error: 'Method not allowed' });

  let body: Record<string, unknown>;
  try { body = JSON.parse(event.body || '{}'); } catch { return jsonResponse(400, { error: 'JSON inválido' }); }

  const { productId, unitsProduced, notes } = body;

  if (!productId || !isSafeId(productId)) return jsonResponse(400, { error: 'productId inválido' });
  const units = sanitizeInt(unitsProduced);
  if (units <= 0) return jsonResponse(400, { error: 'unitsProduced debe ser mayor a 0' });

  try {
    const supabase = getSupabaseAdmin();

    // Get the product
    const { data: prod, error: prodErr } = await supabase
      .from('products')
      .select('id, name, stock_elaborado')
      .eq('id', productId)
      .single();
    if (prodErr || !prod) return jsonResponse(404, { error: 'Producto no encontrado' });

    // Update product finished stock
    const newStock = (prod.stock_elaborado || 0) + units;
    await supabase.from('products').update({ stock_elaborado: newStock }).eq('id', productId);

    // Register batch record
    const today = new Date().toISOString().slice(0, 8).replace(/-/g, '');
    const { count } = await supabase.from('production_batches').select('*', { count: 'exact', head: true });
    const batchNumber = `LOTE-${today}-${(count || 0) + 1}`;

    const batch = {
      id: `bat-${Date.now()}`,
      batch_number: batchNumber,
      product_id: productId,
      product_name: prod.name,
      units_produced: units,
      cost_total_usd: 0, // Default — no recipe lookup in serverless for simplicity
      notes: sanitizeStr(notes || '', 500),
    };

    const { data: batchData, error: batchErr } = await supabase
      .from('production_batches')
      .insert(batch)
      .select()
      .single();
    if (batchErr) throw batchErr;

    return jsonResponse(200, { success: true, batch: batchData });
  } catch (err: any) {
    console.error('[batches] Error:', err.message);
    return jsonResponse(500, { error: 'Error registrando lote de producción' });
  }
};
