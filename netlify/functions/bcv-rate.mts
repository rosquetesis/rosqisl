/**
 * GET /api/bcv-rate  — Fetches official USD→VES rate
 * Tries: 1) Direct BCV scraping  2) ve.dolarapi.com  3) open.er-api.com
 * No auth required (public rate).
 * Response is cached by Netlify CDN for 15 min (set in netlify.toml).
 */
import type { Handler } from '@netlify/functions';
import https from 'https';
import { jsonResponse, optionsResponse, getSupabaseAdmin, parseBCVRate } from './_utils.mjs';

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return optionsResponse();
  if (event.httpMethod !== 'GET') return jsonResponse(405, { error: 'Method not allowed' });

  try {
    const result = await fetchBCVRate();

    // Auto-save to Supabase if requested
    if (event.queryStringParameters?.autoSave === 'true') {
      try {
        const supabase = getSupabaseAdmin();
        await supabase
          .from('store_settings')
          .update({
            exchange_rate_ves: result.rate,
            last_bcv_sync_date: new Date().toISOString(),
          })
          .eq('id', 'main');
      } catch (saveErr) {
        console.warn('[bcv-rate] Could not auto-save to Supabase:', saveErr);
      }
    }

    return jsonResponse(200, { success: true, ...result });
  } catch (err: any) {
    return jsonResponse(500, {
      success: false,
      error: err.message || 'No se pudo obtener la tasa del BCV',
    });
  }
};

// ─── BCV Fetching Chain ───────────────────────────────────────────────────────

async function fetchBCVRate(): Promise<{
  rate: number;
  source: string;
  date: string;
  allCurrencies?: Record<string, number>;
}> {
  // 1️⃣ Direct HTML scraping from bcv.org.ve
  try {
    const html = await fetchHtml('https://www.bcv.org.ve', 7000);
    const allCurrencies: Record<string, number> = {};
    const currList = [
      { code: 'USD' }, { code: 'EUR' }, { code: 'RUB' }, { code: 'CNY' }, { code: 'TRY' },
    ];
    for (const { code } of currList) {
      const regex = new RegExp(
        `<span>\\s*${code}\\s*<\\/span>[\\s\\S]*?<strong[^>]*>\\s*([0-9.,]+)\\s*<\\/strong>`,
        'i'
      );
      const m = html.match(regex);
      if (m?.[1]) {
        const val = parseBCVRate(m[1]);
        if (val > 0) allCurrencies[code] = val;
      }
    }
    const dateMatch = html.match(/Fecha Valor:[\s\S]*?<span[^>]*>\s*([^<]+)\s*<\/span>/i);
    const fechaValor = dateMatch?.[1]?.trim() ?? new Date().toLocaleDateString('es-VE');
    if (allCurrencies['USD']) {
      return { rate: allCurrencies['USD'], source: 'www.bcv.org.ve (Oficial)', date: fechaValor, allCurrencies };
    }
  } catch (e: any) {
    console.warn('[BCV] Direct scrape failed:', e.message);
  }

  // 2️⃣ ve.dolarapi.com (BCV official mirror)
  try {
    const res = await fetch('https://ve.dolarapi.com/v1/dolares/oficial', {
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      const data: any = await res.json();
      const raw = String(data.promedio || data.monto || '');
      const val = parseBCVRate(raw);
      if (val > 0) {
        return {
          rate: val,
          source: 'Banco Central de Venezuela (vía DolarAPI)',
          date: data.fechaActualizacion
            ? new Date(data.fechaActualizacion).toLocaleDateString('es-VE')
            : new Date().toLocaleDateString('es-VE'),
          allCurrencies: { USD: val },
        };
      }
    }
  } catch (e: any) {
    console.warn('[BCV] DolarAPI failed:', e.message);
  }

  // 3️⃣ open.er-api.com (free, no key required)
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD', {
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      const data: any = await res.json();
      const rate = data?.rates?.VES;
      if (rate && typeof rate === 'number' && rate > 1) {
        const rounded = Math.round(rate * 100) / 100;
        return {
          rate: rounded,
          source: 'Banco Central de Venezuela (vía Open Exchange Rates)',
          date: data.time_last_update_utc
            ? new Date(data.time_last_update_utc).toLocaleDateString('es-VE')
            : new Date().toLocaleDateString('es-VE'),
          allCurrencies: { USD: rounded },
        };
      }
    }
  } catch (e: any) {
    console.warn('[BCV] Open.er-api failed:', e.message);
  }

  throw new Error('No se pudo obtener la tasa oficial del BCV automáticamente. Ingrésala manualmente.');
}

function fetchHtml(url: string, timeoutMs: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const req = https.get(
      url,
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0 Safari/537.36',
          Accept: 'text/html',
        },
        rejectUnauthorized: false,
        timeout: timeoutMs,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => resolve(data));
      }
    );
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout connecting to BCV')); });
  });
}
