/**
 * POST /api/orders         — Create new order
 * PUT  /api/orders/:id     — Update order status
 * DELETE /api/orders/:id   — Delete order
 */
import type { Handler } from '@netlify/functions';
import {
  jsonResponse, optionsResponse, getSupabaseAdmin,
  sanitizeStr, sanitizeNum, isSafeId,
} from './_utils';

const VALID_STATUSES = ['pendiente', 'confirmado', 'en_preparacion', 'listo', 'entregado', 'cancelado'];

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return optionsResponse();

  const method = event.httpMethod;
  // Extract optional :id from path  /api/orders/ord-123
  const pathParts = (event.path || '').split('/').filter(Boolean);
  const orderId = pathParts[pathParts.length - 1] !== 'orders' ? pathParts[pathParts.length - 1] : undefined;

  if (method === 'POST') return createOrder(event.body);
  if (method === 'PUT' && orderId) return updateOrder(orderId, event.body);
  if (method === 'DELETE' && orderId) return deleteOrder(orderId);

  return jsonResponse(405, { error: 'Method not allowed' });
};

// ─── Create Order ─────────────────────────────────────────────────────────────
async function createOrder(rawBody: string | null) {
  let body: Record<string, unknown>;
  try { body = JSON.parse(rawBody || '{}'); } catch { return jsonResponse(400, { error: 'JSON inválido' }); }

  // Validate required fields
  const requiredStr = ['customerName', 'customerPhone', 'deliveryZone', 'deliveryCity', 'addressDetail', 'paymentMethod'];
  for (const field of requiredStr) {
    if (!body[field] || typeof body[field] !== 'string') {
      return jsonResponse(400, { error: `Campo requerido faltante: ${field}` });
    }
  }

  if (!Array.isArray(body.items) || body.items.length === 0) {
    return jsonResponse(400, { error: 'El pedido debe tener al menos un producto' });
  }

  const supabase = getSupabaseAdmin();

  // Count existing orders for sequential order number
  const { count } = await supabase.from('orders').select('*', { count: 'exact', head: true });
  const orderNum = `ROS-${new Date().getFullYear()}-${(count || 0) + 104}`;

  const newOrder = {
    id: `ord-${Date.now()}`,
    order_number: orderNum,
    customer_name: sanitizeStr(body.customerName, 200),
    customer_phone: sanitizeStr(body.customerPhone, 30),
    customer_email: sanitizeStr(body.customerEmail || '', 200),
    delivery_zone: sanitizeStr(body.deliveryZone, 100),
    delivery_city: sanitizeStr(body.deliveryCity, 100),
    address_detail: sanitizeStr(body.addressDetail, 500),
    delivery_fee_usd: sanitizeNum(body.deliveryFeeUSD),
    items: (body.items as any[]).map(item => ({
      productId: sanitizeStr(item.productId, 100),
      productName: sanitizeStr(item.productName, 200),
      unitType: sanitizeStr(item.unitType || 'Unidad', 50),
      quantity: Math.max(1, Math.floor(sanitizeNum(item.quantity))),
      unitPriceUSD: sanitizeNum(item.unitPriceUSD || item.priceUSD),
      subtotalUSD: sanitizeNum(item.subtotalUSD),
    })),
    total_usd: sanitizeNum(body.totalUSD),
    exchange_rate_ves: sanitizeNum(body.exchangeRateVES),
    total_ves: sanitizeNum(body.totalVES),
    payment_method: sanitizeStr(body.paymentMethod, 50),
    payment_reference: sanitizeStr(body.paymentReference || '', 100),
    payment_verified: Boolean(body.paymentVerified),
    paid_online: Boolean(body.paidOnline),
    status: 'pendiente',
    notes: sanitizeStr(body.notes || '', 1000),
    dispatch_method_used: sanitizeStr(body.dispatchMethodUsed || 'whatsapp', 20),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  try {
    const { data, error } = await supabase.from('orders').insert(newOrder).select().single();
    if (error) throw error;

    // Upsert customer (fire-and-forget, non-critical)
    upsertCustomer(supabase, newOrder).catch(console.warn);

    // Map snake_case to camelCase so the frontend doesn't crash (White Screen of Death)
    const mappedOrder = {
      id: data.id,
      orderNumber: data.order_number,
      customerName: data.customer_name,
      customerPhone: data.customer_phone,
      customerEmail: data.customer_email,
      deliveryZone: data.delivery_zone,
      deliveryCity: data.delivery_city,
      addressDetail: data.address_detail,
      deliveryFeeUSD: data.delivery_fee_usd,
      items: data.items || [],
      totalUSD: data.total_usd,
      exchangeRateVES: data.exchange_rate_ves,
      totalVES: data.total_ves,
      paymentMethod: data.payment_method,
      paymentReference: data.payment_reference,
      paymentVerified: data.payment_verified,
      paidOnline: data.paid_online,
      status: data.status,
      notes: data.notes,
      createdAt: data.created_at,
    };

    return jsonResponse(200, { success: true, order: mappedOrder });
  } catch (err: any) {
    console.error('[orders] Create error:', err.message);
    return jsonResponse(500, { error: 'Error al registrar la orden' });
  }
}

// ─── Update Order ─────────────────────────────────────────────────────────────
async function updateOrder(id: string, rawBody: string | null) {
  if (!isSafeId(id)) return jsonResponse(400, { error: 'ID inválido' });

  let body: Record<string, unknown>;
  try { body = JSON.parse(rawBody || '{}'); } catch { return jsonResponse(400, { error: 'JSON inválido' }); }

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if ('status' in body) {
    const s = String(body.status);
    if (!VALID_STATUSES.includes(s)) return jsonResponse(400, { error: 'Estado inválido' });
    update['status'] = s;
  }
  if ('paymentVerified' in body) update['payment_verified'] = Boolean(body.paymentVerified);
  if ('notes' in body) update['notes'] = sanitizeStr(body.notes, 1000);
  if ('paymentReference' in body) update['payment_reference'] = sanitizeStr(body.paymentReference, 100);

  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from('orders').update(update).eq('id', id);
    if (error) throw error;
    return jsonResponse(200, { success: true });
  } catch (err: any) {
    console.error('[orders] Update error:', err.message);
    return jsonResponse(500, { error: 'Error actualizando la orden' });
  }
}

// ─── Delete Order ─────────────────────────────────────────────────────────────
async function deleteOrder(id: string) {
  if (!isSafeId(id)) return jsonResponse(400, { error: 'ID inválido' });
  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from('orders').delete().eq('id', id);
    if (error) throw error;
    return jsonResponse(200, { success: true });
  } catch (err: any) {
    console.error('[orders] Delete error:', err.message);
    return jsonResponse(500, { error: 'Error eliminando la orden' });
  }
}

// ─── Upsert Customer ──────────────────────────────────────────────────────────
async function upsertCustomer(supabase: any, order: any) {
  const { data: existing } = await supabase
    .from('customers')
    .select('id, total_orders, total_spent_usd')
    .eq('phone', order.customer_phone)
    .single();

  if (existing) {
    await supabase.from('customers').update({
      total_orders: (existing.total_orders || 0) + 1,
      total_spent_usd: parseFloat(((existing.total_spent_usd || 0) + order.total_usd).toFixed(2)),
    }).eq('id', existing.id);
  } else {
    await supabase.from('customers').insert({
      id: `cli-${Date.now()}`,
      name: order.customer_name,
      phone: order.customer_phone,
      email: order.customer_email,
      city: order.delivery_city || 'Maracay',
      address: order.address_detail,
      total_orders: 1,
      total_spent_usd: order.total_usd,
    });
  }
}
