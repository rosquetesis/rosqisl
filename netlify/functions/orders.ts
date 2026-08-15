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

    // Await the customer upsert so the serverless function doesn't kill it prematurely
    const customer = await upsertCustomer(supabase, newOrder).catch(err => {
      console.warn('[orders] Failed to upsert customer', err);
      return null;
    });

    // Send email notification (fire-and-forget, don't fail order if email fails)
    sendOrderEmail(newOrder).catch(err => {
      console.warn('[orders] Email notification failed:', err?.message || err);
    });

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

    const mappedCustomer = customer ? {
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      city: customer.city,
      address: customer.address,
      totalOrders: customer.total_orders,
      totalSpentUSD: customer.total_spent_usd,
      createdAt: customer.created_at,
      notes: customer.notes,
    } : null;

    return jsonResponse(200, { success: true, order: mappedOrder, customer: mappedCustomer });
  } catch (err: any) {
    console.error('[orders] Create error:', err.message);
    return jsonResponse(500, { error: 'Error al registrar la orden' });
  }
}

// ─── Send Order Email via Mailgun ─────────────────────────────────────────────
async function sendOrderEmail(order: any) {
  const apiKey  = process.env.MAILGUN_API_KEY;
  const domain  = process.env.MAILGUN_DOMAIN;
  const toEmail = process.env.MAILGUN_RECIPIENT;

  if (!apiKey || !domain || !toEmail) {
    console.warn('[orders] Mailgun env vars not set, skipping email.');
    return;
  }

  const itemsList = (order.items as any[])
    .map(i => `• ${i.productName} x${i.quantity} — $${Number(i.subtotalUSD).toFixed(2)} USD`)
    .join('\n');

  const paymentLabel: Record<string, string> = {
    pago_movil: 'Pago Móvil',
    zelle: 'Zelle',
    efectivo: 'Efectivo',
    binance: 'Binance / USDT',
  };

  const textBody = `
🧁 NUEVO PEDIDO — Rosquetes Isleños
=====================================
N° Pedido  : ${order.order_number}
Cliente    : ${order.customer_name}
Teléfono   : ${order.customer_phone}
Ciudad     : ${order.delivery_city}
Zona       : ${order.delivery_zone}
Dirección  : ${order.address_detail}

Productos:
${itemsList}

Envío      : $${Number(order.delivery_fee_usd).toFixed(2)} USD
TOTAL      : $${Number(order.total_usd).toFixed(2)} USD  |  ${Number(order.total_ves).toFixed(2)} Bs.

Método de Pago : ${paymentLabel[order.payment_method] || order.payment_method}
Referencia     : ${order.payment_reference || 'Sin referencia'}
${order.notes ? `\nNotas: ${order.notes}` : ''}
=====================================`.trim();

  const htmlBody = `
<div style="font-family:sans-serif;max-width:600px;margin:auto;border:1px solid #E5DED4;border-radius:12px;overflow:hidden;">
  <div style="background:#3E2E22;color:#FEF3C7;padding:20px 24px;">
    <h2 style="margin:0;font-size:20px;">🧁 Nuevo Pedido — Rosquetes Isleños</h2>
    <p style="margin:6px 0 0;font-size:13px;opacity:.8;">N° ${order.order_number}</p>
  </div>
  <div style="padding:20px 24px;background:#FDFBF7;">
    <table style="width:100%;border-collapse:collapse;font-size:13px;">
      <tr><td style="padding:4px 0;color:#78604E;width:120px;">Cliente</td><td style="font-weight:bold;color:#3E2E22;">${order.customer_name}</td></tr>
      <tr><td style="padding:4px 0;color:#78604E;">Teléfono</td><td style="color:#3E2E22;">${order.customer_phone}</td></tr>
      <tr><td style="padding:4px 0;color:#78604E;">Ciudad</td><td style="color:#3E2E22;">${order.delivery_city}</td></tr>
      <tr><td style="padding:4px 0;color:#78604E;">Zona</td><td style="color:#3E2E22;">${order.delivery_zone}</td></tr>
      <tr><td style="padding:4px 0;color:#78604E;">Dirección</td><td style="color:#3E2E22;">${order.address_detail}</td></tr>
    </table>
    <hr style="border:none;border-top:1px solid #E5DED4;margin:16px 0;" />
    <h3 style="margin:0 0 10px;font-size:14px;color:#3E2E22;">Productos</h3>
    <table style="width:100%;border-collapse:collapse;font-size:13px;">
      ${(order.items as any[]).map(i => `
      <tr>
        <td style="padding:5px 0;color:#3E2E22;">${i.productName}</td>
        <td style="text-align:center;color:#78604E;">x${i.quantity}</td>
        <td style="text-align:right;font-weight:bold;color:#3E2E22;">$${Number(i.subtotalUSD).toFixed(2)}</td>
      </tr>`).join('')}
      <tr style="border-top:1px solid #E5DED4;">
        <td colspan="2" style="padding-top:8px;color:#78604E;font-size:12px;">Costo de Envío</td>
        <td style="text-align:right;padding-top:8px;color:#3E2E22;">$${Number(order.delivery_fee_usd).toFixed(2)}</td>
      </tr>
      <tr>
        <td colspan="2" style="padding-top:4px;font-weight:bold;color:#3E2E22;">TOTAL</td>
        <td style="text-align:right;font-size:16px;font-weight:bold;color:#D97706;">$${Number(order.total_usd).toFixed(2)} USD</td>
      </tr>
    </table>
    <hr style="border:none;border-top:1px solid #E5DED4;margin:16px 0;" />
    <p style="font-size:13px;color:#3E2E22;margin:0;">
      <strong>Pago:</strong> ${paymentLabel[order.payment_method] || order.payment_method}<br/>
      <strong>Referencia:</strong> ${order.payment_reference || 'Sin referencia'}
    </p>
    ${order.notes ? `<p style="margin:10px 0 0;font-size:13px;color:#78604E;"><strong>Notas:</strong> ${order.notes}</p>` : ''}
  </div>
</div>`;

  const formData = new URLSearchParams();
  formData.append('from', `Rosquetes Isleños <mailgun@${domain}>`);
  formData.append('to', toEmail);
  formData.append('subject', `🧁 Pedido ${order.order_number} — ${order.customer_name}`);
  formData.append('text', textBody);
  formData.append('html', htmlBody);

  const res = await fetch(`https://api.mailgun.net/v3/${domain}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`api:${apiKey}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData.toString(),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Mailgun ${res.status}: ${txt}`);
  }
  console.log('[orders] Email sent OK for', order.order_number);
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
    .select('*')
    .eq('phone', order.customer_phone)
    .single();

  if (existing) {
    const { data: updatedCustomer } = await supabase.from('customers').update({
      total_orders: (existing.total_orders || 0) + 1,
      total_spent_usd: parseFloat(((existing.total_spent_usd || 0) + order.total_usd).toFixed(2)),
    }).eq('id', existing.id).select().single();
    return updatedCustomer;
  } else {
    const { data: newCustomer } = await supabase.from('customers').insert({
      id: `cli-${Date.now()}`,
      name: order.customer_name,
      phone: order.customer_phone,
      email: order.customer_email,
      city: order.delivery_city || 'Maracay',
      address: order.address_detail,
      total_orders: 1,
      total_spent_usd: order.total_usd,
    }).select().single();
    return newCustomer;
  }
}
