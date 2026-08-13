/**
 * GET /api/state
 * Returns full store state from Supabase.
 * Public read - no auth required (products/settings are public).
 */
import type { Handler } from '@netlify/functions';
import { jsonResponse, optionsResponse, getSupabaseAdmin } from './_utils';

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return optionsResponse();
  if (event.httpMethod !== 'GET') return jsonResponse(405, { error: 'Method not allowed' });

  try {
    const supabase = getSupabaseAdmin();

    const [
      { data: settings },
      { data: products },
      { data: ingredients },
      { data: clients },
      { data: orders },
      { data: batches },
    ] = await Promise.all([
      supabase.from('store_settings').select('*').eq('id', 'main').single(),
      supabase.from('products').select('*').order('created_at'),
      supabase.from('ingredients').select('*').order('name'),
      supabase.from('customers').select('*').order('created_at', { ascending: false }),
      supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(200),
      supabase.from('production_batches').select('*').order('created_at', { ascending: false }).limit(100),
    ]);

    // Map snake_case DB columns to camelCase for the frontend
    const mappedSettings = settings ? mapSettings(settings) : null;
    const mappedProducts = (products || []).map(mapProduct);
    const mappedIngredients = (ingredients || []).map(mapIngredient);
    const mappedClients = (clients || []).map(mapClient);
    const mappedOrders = (orders || []).map(mapOrder);
    const mappedBatches = (batches || []).map(mapBatch);

    return jsonResponse(200, {
      settings: mappedSettings,
      products: mappedProducts,
      ingredients: mappedIngredients,
      clients: mappedClients,
      orders: mappedOrders,
      batches: mappedBatches,
      recipes: [],
      salesReports: [],
      onlinePaymentNotifications: [],
    });
  } catch (err: any) {
    console.error('[state] Error:', err.message);
    return jsonResponse(500, { error: 'Error al obtener el estado' });
  }
};

// ─── DB → Frontend mappers ────────────────────────────────────────────────────

function mapSettings(s: any) {
  return {
    storeName: s.store_name,
    storeBadge: s.store_badge,
    storeTagline: s.store_tagline,
    storeLogoType: s.store_logo_type,
    storeLogoValue: s.store_logo_value,
    storeAddress: s.store_address,
    exchangeRateVES: s.exchange_rate_ves,
    dispatchMode: s.dispatch_mode,
    whatsappNumber: s.whatsapp_number,
    emailRecipient: s.email_recipient,
    whatsappMessageTemplate: s.whatsapp_message_template,
    pagoMovilBank: s.pago_movil_bank,
    pagoMovilRif: s.pago_movil_rif,
    pagoMovilPhone: s.pago_movil_phone,
    pagoMovilOwner: s.pago_movil_owner,
    zelleEmail: s.zelle_email || '',
    zelleOwner: s.zelle_owner || '',
    onlinePaymentsEnabled: s.online_payments_enabled ?? true,
    autoVerifyOnlinePayments: s.auto_verify_online_payments ?? true,
    paymentMethods: s.payment_methods || [],
    deliveryZones: s.delivery_zones || [],
    adminUsername: s.admin_username || 'admin',
    adminPassword: '', // Never send password to client
    lastBCVSyncDate: s.last_bcv_sync_date,
    autoSyncBCVRate: s.auto_sync_bcv_rate ?? true,
    heroImageUrl: s.hero_image_url || '/src/assets/images/rosquetes_hero_1786559273650.jpg',
    heroBadgeText: s.hero_badge_text || 'Presentación Estrella',
    heroStarTitle: s.hero_star_title || 'Docena Tradicional Glaseada',
    heroStarPriceUSD: s.hero_star_price_usd ?? 4.50,
    featureCards: s.feature_cards || [],
  };
}

function mapProduct(p: any) {
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    priceUSD: p.price_usd,
    unitType: p.unit_type,
    image: p.image,
    stockElaborado: p.stock_elaborado,
    category: p.category,
    featured: p.featured,
  };
}

function mapIngredient(i: any) {
  return {
    id: i.id,
    name: i.name,
    category: i.category,
    stockAmount: i.stock_amount,
    unit: i.unit,
    minAlertThreshold: i.min_alert_threshold,
    costPerUnitUSD: i.cost_per_unit_usd,
    lastRestocked: i.last_restocked,
  };
}

function mapClient(c: any) {
  return {
    id: c.id,
    name: c.name,
    phone: c.phone,
    email: c.email,
    city: c.city,
    address: c.address,
    totalOrders: c.total_orders,
    totalSpentUSD: c.total_spent_usd,
    createdAt: c.created_at,
    notes: c.notes,
  };
}

function mapOrder(o: any) {
  return {
    id: o.id,
    orderNumber: o.order_number,
    customerName: o.customer_name,
    customerPhone: o.customer_phone,
    customerEmail: o.customer_email,
    deliveryZone: o.delivery_zone,
    deliveryCity: o.delivery_city,
    addressDetail: o.address_detail,
    deliveryFeeUSD: o.delivery_fee_usd,
    items: o.items || [],
    totalUSD: o.total_usd,
    exchangeRateVES: o.exchange_rate_ves,
    totalVES: o.total_ves,
    paymentMethod: o.payment_method,
    paymentReference: o.payment_reference,
    paymentVerified: o.payment_verified,
    paidOnline: o.paid_online,
    status: o.status,
    notes: o.notes,
    createdAt: o.created_at,
  };
}

function mapBatch(b: any) {
  return {
    id: b.id,
    batchNumber: b.batch_number,
    productId: b.product_id,
    productName: b.product_name,
    unitsProduced: b.units_produced,
    costTotalUSD: b.cost_total_usd,
    notes: b.notes,
    date: b.created_at,
  };
}
