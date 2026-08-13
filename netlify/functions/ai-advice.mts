/**
 * POST /api/ai/production-advice
 * Uses Gemini API to generate production planning advice.
 * GEMINI_API_KEY is server-side only — never exposed to the browser.
 */
import type { Handler } from '@netlify/functions';
import { jsonResponse, optionsResponse, getSupabaseAdmin } from './_utils.mjs';

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return optionsResponse();
  if (event.httpMethod !== 'POST') return jsonResponse(405, { error: 'Method not allowed' });

  try {
    const supabase = getSupabaseAdmin();

    const [
      { data: products },
      { data: ingredients },
      { data: orders },
    ] = await Promise.all([
      supabase.from('products').select('name, stock_elaborado'),
      supabase.from('ingredients').select('name, stock_amount, unit, min_alert_threshold'),
      supabase.from('orders').select('status').in('status', ['pendiente', 'en_preparacion']),
    ]);

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return jsonResponse(200, generateFallback(products, ingredients, orders));

    const ingredientList = (ingredients || [])
      .map((i: any) => `${i.name}: ${i.stock_amount} ${i.unit} (mín: ${i.min_alert_threshold})`)
      .join(', ');
    const productStock = (products || [])
      .map((p: any) => `${p.name}: ${p.stock_elaborado} u. listas`)
      .join(', ');
    const pendingCount = (orders || []).length;

    const prompt = `Actúa como Consultor de Producción Artesanal para "Rosquetes Canarios" en Turmero, Aragua, Venezuela.
    Pedidos Pendientes: ${pendingCount}. Stock elaborado: ${productStock}. Ingredientes: ${ingredientList}.
    RESPONDE SOLO EN JSON con exactamente esta estructura:
    {"summary":"string","projectedDemandDozen":number,"recommendedBatches":[{"productName":"string","quantityToMake":number,"priority":"Alta|Media","reason":"string"}],"ingredientReorderAlerts":[{"ingredientName":"string","currentStock":"string","neededStock":"string","shortage":"string","estimatedCostUSD":number}],"profitOptimizationTips":["string"]}`;

    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json' },
          }),
          signal: AbortSignal.timeout(15000),
        }
      );
      if (res.ok) {
        const data: any = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
        return jsonResponse(200, JSON.parse(text));
      }
    } catch (aiErr) {
      console.warn('[ai-advice] Gemini call failed, using fallback');
    }

    return jsonResponse(200, generateFallback(products, ingredients, orders));
  } catch (err: any) {
    console.error('[ai-advice] Error:', err.message);
    return jsonResponse(500, { error: 'Error generando consejo de producción' });
  }
};

function generateFallback(products: any, ingredients: any, orders: any) {
  const pendingCount = (orders || []).length;
  const lowStock = (ingredients || []).filter((i: any) => i.stock_amount <= i.min_alert_threshold);
  return {
    summary: `${pendingCount} pedido(s) pendiente(s). Se recomienda revisar inventario elaborado.`,
    projectedDemandDozen: Math.max(30, pendingCount * 5 + 20),
    recommendedBatches: (products || []).slice(0, 3).map((p: any) => ({
      productName: p.name,
      quantityToMake: Math.max(15, 25 - (p.stock_elaborado || 0)),
      priority: (p.stock_elaborado || 0) < 10 ? 'Alta' : 'Media',
      reason: 'Mantener nivel óptimo de stock para la semana',
    })),
    ingredientReorderAlerts: lowStock.slice(0, 3).map((i: any) => ({
      ingredientName: i.name,
      currentStock: `${i.stock_amount} ${i.unit}`,
      neededStock: `${i.min_alert_threshold * 2} ${i.unit}`,
      shortage: `Faltan ${(i.min_alert_threshold * 2 - i.stock_amount).toFixed(1)} ${i.unit}`,
      estimatedCostUSD: 0,
    })),
    profitOptimizationTips: [
      'Mantener la tasa BCV actualizada para cobros exactos en Bolívares.',
      'Agrupar entregas por zona para reducir costos de despacho en Aragua.',
    ],
  };
}
