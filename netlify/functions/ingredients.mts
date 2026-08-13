/**
 * POST   /api/ingredients     — Create or update an ingredient
 * DELETE /api/ingredients/:id — Delete an ingredient
 */
import type { Handler } from '@netlify/functions';
import {
  jsonResponse, optionsResponse, getSupabaseAdmin,
  sanitizeStr, sanitizeNum, isSafeId,
} from './_utils.mjs';

const VALID_CATEGORIES = ['harina', 'azucar', 'especias', 'liquidos', 'empaque', 'otros'];
const VALID_UNITS = ['kg', 'g', 'litros', 'ml', 'unidades', 'sacos', 'cartones', 'cajas', 'mallas'];

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return optionsResponse();

  const method = event.httpMethod;
  const pathParts = (event.path || '').split('/').filter(Boolean);
  const ingId = pathParts[pathParts.length - 1] !== 'ingredients' ? pathParts[pathParts.length - 1] : undefined;

  if (method === 'POST') return upsertIngredient(event.body);
  if (method === 'DELETE' && ingId) return deleteIngredient(ingId);

  return jsonResponse(405, { error: 'Method not allowed' });
};

async function upsertIngredient(rawBody: string | null) {
  let body: Record<string, unknown>;
  try { body = JSON.parse(rawBody || '{}'); } catch { return jsonResponse(400, { error: 'JSON inválido' }); }

  if (!body.name) return jsonResponse(400, { error: 'Nombre del ingrediente requerido' });

  const category = sanitizeStr(body.category || 'otros', 50);
  if (!VALID_CATEGORIES.includes(category)) return jsonResponse(400, { error: 'Categoría inválida' });

  const unit = sanitizeStr(body.unit || 'kg', 20);
  if (!VALID_UNITS.includes(unit)) return jsonResponse(400, { error: 'Unidad inválida' });

  const ingredient = {
    id: sanitizeStr(body.id || `ing-${Date.now()}`, 100),
    name: sanitizeStr(body.name, 200),
    category,
    stock_amount: sanitizeNum(body.stockAmount),
    unit,
    min_alert_threshold: sanitizeNum(body.minAlertThreshold),
    cost_per_unit_usd: sanitizeNum(body.costPerUnitUSD),
    last_restocked: new Date().toISOString(),
  };

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('ingredients')
      .upsert(ingredient, { onConflict: 'id' })
      .select()
      .single();
    if (error) throw error;
    return jsonResponse(200, { success: true, ingredient: data });
  } catch (err: any) {
    console.error('[ingredients] Upsert error:', err.message);
    return jsonResponse(500, { error: 'Error guardando el ingrediente' });
  }
}

async function deleteIngredient(id: string) {
  if (!isSafeId(id)) return jsonResponse(400, { error: 'ID inválido' });
  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from('ingredients').delete().eq('id', id);
    if (error) throw error;
    return jsonResponse(200, { success: true });
  } catch (err: any) {
    console.error('[ingredients] Delete error:', err.message);
    return jsonResponse(500, { error: 'Error eliminando el ingrediente' });
  }
}
