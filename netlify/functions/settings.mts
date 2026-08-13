/**
 * PUT /api/settings
 * Updates store settings in Supabase.
 * Whitelist-only fields — no arbitrary data accepted.
 * Admin-password change allowed but never returned to client.
 */
import type { Handler } from '@netlify/functions';
import { jsonResponse, optionsResponse, getSupabaseAdmin, sanitizeStr, sanitizeNum } from './_utils.mjs';

const ALLOWED_SETTINGS_KEYS = [
  'store_name', 'store_badge', 'store_tagline', 'store_logo_type', 'store_logo_value',
  'store_address', 'exchange_rate_ves', 'dispatch_mode', 'whatsapp_number',
  'email_recipient', 'whatsapp_message_template', 'pago_movil_bank',
  'pago_movil_rif', 'pago_movil_phone', 'pago_movil_owner',
  'online_payments_enabled', 'auto_verify_online_payments',
  'payment_methods', 'delivery_zones', 'admin_username', 'admin_password',
  'last_bcv_sync_date', 'auto_sync_bcv_rate',
];

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return optionsResponse();
  if (event.httpMethod !== 'PUT') return jsonResponse(405, { error: 'Method not allowed' });

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return jsonResponse(400, { error: 'JSON inválido' });
  }

  // Map frontend camelCase to DB snake_case, sanitizing each value
  const update: Record<string, unknown> = {};

  const strMap: Record<string, string> = {
    storeName: 'store_name', storeBadge: 'store_badge', storeTagline: 'store_tagline',
    storeLogoType: 'store_logo_type', storeLogoValue: 'store_logo_value',
    storeAddress: 'store_address', dispatchMode: 'dispatch_mode',
    whatsappNumber: 'whatsapp_number', emailRecipient: 'email_recipient',
    whatsappMessageTemplate: 'whatsapp_message_template',
    pagoMovilBank: 'pago_movil_bank', pagoMovilRif: 'pago_movil_rif',
    pagoMovilPhone: 'pago_movil_phone', pagoMovilOwner: 'pago_movil_owner',
    adminUsername: 'admin_username', adminPassword: 'admin_password',
    lastBCVSyncDate: 'last_bcv_sync_date',
  };

  for (const [front, db] of Object.entries(strMap)) {
    if (front in body && body[front] !== undefined) {
      update[db] = sanitizeStr(body[front], front === 'storeLogoValue' ? 2000 : 500);
    }
  }

  if ('exchangeRateVES' in body) update['exchange_rate_ves'] = sanitizeNum(body.exchangeRateVES);
  if ('onlinePaymentsEnabled' in body) update['online_payments_enabled'] = Boolean(body.onlinePaymentsEnabled);
  if ('autoVerifyOnlinePayments' in body) update['auto_verify_online_payments'] = Boolean(body.autoVerifyOnlinePayments);
  if ('autoSyncBCVRate' in body) update['auto_sync_bcv_rate'] = Boolean(body.autoSyncBCVRate);

  // JSONB arrays — validate they are arrays before saving
  if ('paymentMethods' in body && Array.isArray(body.paymentMethods)) {
    update['payment_methods'] = body.paymentMethods;
  }
  if ('deliveryZones' in body && Array.isArray(body.deliveryZones)) {
    update['delivery_zones'] = body.deliveryZones;
  }

  if (Object.keys(update).length === 0) {
    return jsonResponse(400, { error: 'No hay campos válidos para actualizar' });
  }

  update['updated_at'] = new Date().toISOString();

  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from('store_settings')
      .update(update)
      .eq('id', 'main');

    if (error) throw error;
    return jsonResponse(200, { success: true });
  } catch (err: any) {
    console.error('[settings] Error:', err.message);
    return jsonResponse(500, { error: 'Error actualizando la configuración' });
  }
};
