/**
 * POST /api/products  — Create or update a product
 */
import type { Handler } from '@netlify/functions';
import { jsonResponse, optionsResponse, getSupabaseAdmin, sanitizeStr, sanitizeNum, sanitizeInt, sanitizeImage } from './_utils';

const VALID_CATEGORIES = ['tradicional', 'mini', 'regalo', 'especial'];

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return optionsResponse();
  if (event.httpMethod !== 'POST') return jsonResponse(405, { error: 'Method not allowed' });

  let body: Record<string, unknown>;
  try { body = JSON.parse(event.body || '{}'); } catch { return jsonResponse(400, { error: 'JSON inválido' }); }

  if (!body.name || typeof body.name !== 'string') {
    return jsonResponse(400, { error: 'El nombre del producto es requerido' });
  }

  const category = sanitizeStr(body.category || 'tradicional', 50);
  if (!VALID_CATEGORIES.includes(category)) {
    return jsonResponse(400, { error: 'Categoría de producto inválida' });
  }

  const product = {
    id: sanitizeStr(body.id || `prod-${Date.now()}`, 100),
    name: sanitizeStr(body.name, 200),
    description: sanitizeStr(body.description || '', 1000),
    price_usd: sanitizeNum(body.priceUSD),
    unit_type: sanitizeStr(body.unitType || 'Unidad', 100),
    image: sanitizeImage(body.image || ''),
    stock_elaborado: sanitizeInt(body.stockElaborado),
    category,
    featured: Boolean(body.featured),
    is_published: body.isPublished !== undefined ? Boolean(body.isPublished) : true,
    updated_at: new Date().toISOString(),
  };

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('products')
      .upsert(product, { onConflict: 'id' })
      .select()
      .single();
    if (error) throw error;
    return jsonResponse(200, { success: true, product: data });
  } catch (err: any) {
    console.error('[products] Error:', err.message);
    return jsonResponse(500, { error: err.message || 'Error guardando el producto' });
  }
};
