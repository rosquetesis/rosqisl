/**
 * GET /api/payments/notifications
 * Returns recent unread payment notifications from Supabase orders.
 */
import type { Handler } from '@netlify/functions';
import { jsonResponse, optionsResponse, getSupabaseAdmin } from './_utils';

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return optionsResponse();
  if (event.httpMethod !== 'GET') return jsonResponse(405, { error: 'Method not allowed' });

  try {
    const supabase = getSupabaseAdmin();
    // Get recent paid orders as notifications
    const { data: orders, error } = await supabase
      .from('orders')
      .select('id, order_number, customer_name, total_usd, total_ves, payment_method, payment_reference, created_at, payment_verified')
      .eq('paid_online', true)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;

    const notifications = (orders || []).map(o => ({
      id: `notif-${o.id}`,
      orderId: o.id,
      orderNumber: o.order_number,
      customerName: o.customer_name,
      amountUSD: o.total_usd,
      amountVES: o.total_ves,
      paymentMethodName: o.payment_method,
      paymentReference: o.payment_reference || 'Comprobante Adjunto',
      timestamp: o.created_at,
      read: Boolean(o.payment_verified),
    }));

    return jsonResponse(200, notifications);
  } catch (err: any) {
    console.error('[payments-notifications] Error:', err.message);
    return jsonResponse(500, { error: 'Error obteniendo notificaciones' });
  }
};
