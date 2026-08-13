/**
 * POST /api/payments/verify — Simulate payment verification
 */
import type { Handler } from '@netlify/functions';
import { jsonResponse, optionsResponse, sanitizeStr, sanitizeNum } from './_utils';

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return optionsResponse();
  if (event.httpMethod !== 'POST') return jsonResponse(405, { error: 'Method not allowed' });

  let body: Record<string, unknown>;
  try { body = JSON.parse(event.body || '{}'); } catch { return jsonResponse(400, { error: 'JSON inválido' }); }

  const paymentMethod = sanitizeStr(body.paymentMethod || '', 50);
  const amountUSD = sanitizeNum(body.amountUSD);

  if (!paymentMethod) return jsonResponse(400, { error: 'Método de pago requerido' });
  if (amountUSD <= 0) return jsonResponse(400, { error: 'Monto inválido' });

  const transactionId = `TX-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;

  return jsonResponse(200, {
    success: true,
    verified: true,
    transactionId,
    timestamp: new Date().toISOString(),
    message: '¡Pago procesado y verificado exitosamente!',
  });
};
