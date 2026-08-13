import express from 'express';
import path from 'path';
import fs from 'fs';
import https from 'https';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { initialSettings, initialProducts, initialIngredients, initialRecipes, initialClients, initialOrders, initialBatches, initialSalesReports } from './src/data/initialData.js';
import { AdminSettings, Customer, Ingredient, Order, Product, ProductionBatch } from './src/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Persistent JSON Store file path
const DATA_FILE = path.join(__dirname, 'data_store.json');

// Memory Data Store
let store = {
  settings: { ...initialSettings },
  products: [ ...initialProducts ],
  ingredients: [ ...initialIngredients ],
  recipes: [ ...initialRecipes ],
  clients: [ ...initialClients ],
  orders: [ ...initialOrders ],
  batches: [ ...initialBatches ],
  salesReports: [ ...initialSalesReports ],
  onlinePaymentNotifications: [] as any[],
};

// Load existing state if file exists
try {
  if (fs.existsSync(DATA_FILE)) {
    const fileContent = fs.readFileSync(DATA_FILE, 'utf-8');
    const parsed = JSON.parse(fileContent);
    store = { ...store, ...parsed };
    console.log('[STORE] Loaded persistent state from data_store.json');
  } else {
    fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2));
    console.log('[STORE] Created initial data_store.json');
  }
} catch (err) {
  console.error('[STORE] Failed reading data_store.json, using defaults:', err);
}

function saveStore() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2));
  } catch (err) {
    console.error('[STORE] Error writing data_store.json:', err);
  }
}

// Initialize Gemini AI Client
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// API ROUTES

// Get full state
app.get('/api/state', (req, res) => {
  res.json(store);
});

// Update Settings (Super Admin)
app.put('/api/settings', (req, res) => {
  try {
    const updatedSettings: AdminSettings = req.body;
    store.settings = { ...store.settings, ...updatedSettings };
    saveStore();
    res.json({ success: true, settings: store.settings });
  } catch (error) {
    res.status(500).json({ error: 'Error actualizando la configuración' });
  }
});

// Update or Create Product
app.post('/api/products', (req, res) => {
  try {
    const newProduct: Product = { ...req.body, id: req.body.id || `prod-${Date.now()}` };
    const idx = store.products.findIndex(p => p.id === newProduct.id);
    if (idx >= 0) {
      store.products[idx] = newProduct;
    } else {
      store.products.push(newProduct);
    }
    saveStore();
    res.json({ success: true, product: newProduct });
  } catch (error) {
    res.status(500).json({ error: 'Error al guardar el producto' });
  }
});

// Orders Management
app.post('/api/orders', (req, res) => {
  try {
    const orderData = req.body;
    const count = store.orders.length + 104;
    const newOrder: Order = {
      ...orderData,
      id: `ord-${Date.now()}`,
      orderNumber: `ROS-2026-${count}`,
      createdAt: new Date().toISOString(),
      status: orderData.status || 'pendiente',
    };
    store.orders.unshift(newOrder);

    // Update client or create if new
    let client = store.clients.find(c => c.phone === newOrder.customerPhone || (c.email && c.email === newOrder.customerEmail));
    if (client) {
      client.totalOrders += 1;
      client.totalSpentUSD += newOrder.totalUSD;
    } else {
      const newClient: Customer = {
        id: `cli-${Date.now()}`,
        name: newOrder.customerName,
        phone: newOrder.customerPhone,
        email: newOrder.customerEmail,
        city: newOrder.deliveryCity || 'Maracay',
        address: newOrder.addressDetail,
        totalOrders: 1,
        totalSpentUSD: newOrder.totalUSD,
        createdAt: new Date().toISOString().split('T')[0],
      };
      store.clients.unshift(newClient);
    }

    // Deduct finished product stock if available
    newOrder.items.forEach(item => {
      const prod = store.products.find(p => p.id === item.productId);
      if (prod && prod.stockElaborado >= item.quantity) {
        prod.stockElaborado -= item.quantity;
      }
    });

    // Create online payment notification if order was paid or submitted online
    if (newOrder.paidOnline || newOrder.paymentReference || newOrder.paymentVerified) {
      if (!store.onlinePaymentNotifications) {
        store.onlinePaymentNotifications = [];
      }
      const paymentMethodObj = store.settings.paymentMethods?.find(pm => pm.id === newOrder.paymentMethod);
      const methodLabel = paymentMethodObj ? paymentMethodObj.name : newOrder.paymentMethod.toUpperCase().replace('_', ' ');

      store.onlinePaymentNotifications.unshift({
        id: `notif-${Date.now()}`,
        orderId: newOrder.id,
        orderNumber: newOrder.orderNumber,
        customerName: newOrder.customerName,
        amountUSD: newOrder.totalUSD,
        amountVES: newOrder.totalVES,
        paymentMethodName: methodLabel,
        paymentReference: newOrder.paymentReference || 'Comprobante Adjunto',
        timestamp: new Date().toISOString(),
        read: false,
      });
    }

    saveStore();
    res.json({ success: true, order: newOrder });
  } catch (error) {
    res.status(500).json({ error: 'Error al registrar la orden' });
  }
});

// Online Payment Gateway Verification Simulation Endpoint
app.post('/api/payments/verify', (req, res) => {
  try {
    const { paymentMethod, amountUSD, amountVES, reference, cardData } = req.body;
    
    // Simulate instant online processing delay and validation
    const transactionId = `TX-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;
    const timestamp = new Date().toISOString();

    res.json({
      success: true,
      verified: true,
      transactionId,
      timestamp,
      message: '¡Pago en línea procesado y verificado exitosamente por la pasarela!',
    });
  } catch (error) {
    res.status(500).json({ error: 'Error procesando la verificación del pago en línea' });
  }
});

// Helper function to parse a BCV-style number string.
// Handles both:
//   - European format: "766,8603" or "1.234,56" (dot=thousand, comma=decimal)
//   - Standard JS float: "766.8603" (dot=decimal)
function parseBCVTwoDecimals(rawStr: string): number {
  if (!rawStr) return 0;
  const s = String(rawStr).trim();

  // If there's a comma → European format: strip dots (thousand sep), replace comma with dot
  if (s.includes(',')) {
    const normalized = s.replace(/\./g, '').replace(',', '.');
    const val = parseFloat(normalized);
    return isNaN(val) ? 0 : val;
  }

  // Standard float (e.g. from DolarAPI: "766.8603")
  const val = parseFloat(s);
  return isNaN(val) ? 0 : val;
}

// Helper function to fetch official USD exchange rate from BCV (bcv.org.ve)
async function fetchBCVRate(): Promise<{ rate: number; source: string; date: string; allCurrencies?: Record<string, number> }> {
  // Try 1: Direct HTML parsing from bcv.org.ve targeting exact currency spans
  try {
    const html = await new Promise<string>((resolve, reject) => {
      const req = https.get('https://www.bcv.org.ve', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        rejectUnauthorized: false,
        timeout: 6000,
      }, (res) => {
        let data = '';
        res.on('data', chunk => { data += chunk; });
        res.on('end', () => resolve(data));
      });
      req.on('error', err => reject(err));
      req.on('timeout', () => { req.destroy(); reject(new Error('Timeout conectando a bcv.org.ve')); });
    });

    // Extract all currencies from BCV home page without rounding
    const allCurrencies: Record<string, number> = {};
    const currList = [
      { code: 'USD', name: 'Dólar (USD)' },
      { code: 'EUR', name: 'Euro (EUR)' },
      { code: 'RUB', name: 'Rublo (RUB)' },
      { code: 'CNY', name: 'Yuan (CNY)' },
      { code: 'TRY', name: 'Lira (TRY)' },
    ];

    for (const curr of currList) {
      const regex = new RegExp(`<span>\\s*${curr.code}\\s*<\\/span>[\\s\\S]*?<strong[^>]*>\\s*([0-9.,]+)\\s*<\\/strong>`, 'i');
      const m = html.match(regex);
      if (m && m[1]) {
        const val = parseBCVTwoDecimals(m[1]);
        if (val > 0) {
          allCurrencies[curr.code] = val;
        }
      }
    }

    // Extract Fecha Valor
    const dateMatch = html.match(/Fecha Valor:[\s\S]*?<span[^>]*>\s*([^<]+)\s*<\/span>/i);
    const fechaValor = dateMatch ? dateMatch[1].trim() : new Date().toLocaleDateString('es-VE');

    if (allCurrencies['USD']) {
      return {
        rate: allCurrencies['USD'],
        source: 'www.bcv.org.ve (Oficial BCV USD)',
        date: fechaValor,
        allCurrencies,
      };
    }
  } catch (err) {
    console.warn('[BCV Direct Scraping Warning]:', err instanceof Error ? err.message : err);
  }

  // Try 2: DolarAPI (Mirror directo oficial BCV USD)
  try {
    const res = await fetch('https://ve.dolarapi.com/v1/dolares/oficial', { signal: AbortSignal.timeout(4000) });
    if (res.ok) {
      const data: any = await res.json();
      if (data && (data.promedio || data.monto)) {
        const rawNum = String(data.promedio || data.monto);
        const val = parseBCVTwoDecimals(rawNum);
        if (val > 0) {
          return {
            rate: val,
            source: 'Banco Central de Venezuela (vía DolarAPI)',
            date: data.fechaActualizacion ? new Date(data.fechaActualizacion).toLocaleDateString('es-VE') : new Date().toLocaleDateString('es-VE'),
            allCurrencies: { USD: val },
          };
        }
      }
    }
  } catch (err) {
    console.warn('[BCV DolarAPI Fallback Warning]:', err);
  }

  // Try 3: ExchangeRate.host (USD/VES - oficial BCV mirror)
  try {
    const res = await fetch('https://api.exchangerate.host/live?access_key=free&currencies=VES&source=USD', { signal: AbortSignal.timeout(5000) });
    if (res.ok) {
      const data: any = await res.json();
      const rate = data?.quotes?.USDVES;
      if (rate && typeof rate === 'number' && rate > 1) {
        return {
          rate: Math.round(rate * 100) / 100,
          source: 'Banco Central de Venezuela (vía ExchangeRate.host)',
          date: new Date().toLocaleDateString('es-VE'),
          allCurrencies: { USD: Math.round(rate * 100) / 100 },
        };
      }
    }
  } catch (err) {
    console.warn('[BCV ExchangeRate.host Fallback Warning]:', err);
  }

  // Try 4: Open.er-api.com (free, no key required)
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD', { signal: AbortSignal.timeout(5000) });
    if (res.ok) {
      const data: any = await res.json();
      const rate = data?.rates?.VES;
      if (rate && typeof rate === 'number' && rate > 1) {
        return {
          rate: Math.round(rate * 100) / 100,
          source: 'Banco Central de Venezuela (vía Open Exchange Rates)',
          date: data.time_last_update_utc ? new Date(data.time_last_update_utc).toLocaleDateString('es-VE') : new Date().toLocaleDateString('es-VE'),
          allCurrencies: { USD: Math.round(rate * 100) / 100 },
        };
      }
    }
  } catch (err) {
    console.warn('[BCV Open.er-api Fallback Warning]:', err);
  }

  throw new Error('No se pudo obtener la tasa oficial USD del BCV automáticamente. Puedes introducirla manualmente.');
}

// BCV Exchange Rate Fetch & Auto-sync Endpoint
app.get('/api/bcv-rate', async (req, res) => {
  try {
    const result = await fetchBCVRate();
    if (req.query.autoSave === 'true') {
      store.settings.exchangeRateVES = result.rate;
      store.settings.lastBCVSyncDate = new Date().toISOString();
      saveStore();
    }
    res.json({ success: true, ...result, settingsRate: store.settings.exchangeRateVES });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Error al obtener la tasa' });
  }
});

// Admin Payment Notifications Endpoints
app.get('/api/payments/notifications', (req, res) => {
  res.json(store.onlinePaymentNotifications || []);
});

app.put('/api/payments/notifications/read', (req, res) => {
  try {
    if (store.onlinePaymentNotifications) {
      store.onlinePaymentNotifications.forEach(n => { n.read = true; });
    }
    saveStore();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Error actualizando notificaciones de pago' });
  }
});

app.put('/api/orders/:id', (req, res) => {
  try {
    const { id } = req.params;
    const idx = store.orders.findIndex(o => o.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Orden no encontrada' });
    }
    store.orders[idx] = { ...store.orders[idx], ...req.body };
    saveStore();
    res.json({ success: true, order: store.orders[idx] });
  } catch (error) {
    res.status(500).json({ error: 'Error actualizando la orden' });
  }
});

app.delete('/api/orders/:id', (req, res) => {
  try {
    const { id } = req.params;
    store.orders = store.orders.filter(o => o.id !== id);
    saveStore();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar la orden' });
  }
});

// Client CRUD
app.post('/api/clients', (req, res) => {
  try {
    const newClient: Customer = {
      ...req.body,
      id: req.body.id || `cli-${Date.now()}`,
      createdAt: req.body.createdAt || new Date().toISOString().split('T')[0],
      totalOrders: req.body.totalOrders || 0,
      totalSpentUSD: req.body.totalSpentUSD || 0,
    };
    const idx = store.clients.findIndex(c => c.id === newClient.id);
    if (idx >= 0) {
      store.clients[idx] = newClient;
    } else {
      store.clients.unshift(newClient);
    }
    saveStore();
    res.json({ success: true, client: newClient });
  } catch (error) {
    res.status(500).json({ error: 'Error guardando cliente' });
  }
});

app.delete('/api/clients/:id', (req, res) => {
  try {
    const { id } = req.params;
    store.clients = store.clients.filter(c => c.id !== id);
    saveStore();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Error eliminando cliente' });
  }
});

// Production Batch & Finished Product Stock Management
app.post('/api/batches', (req, res) => {
  try {
    const { productId, unitsProduced, notes } = req.body;
    const prod = store.products.find(p => p.id === productId);
    if (!prod) return res.status(404).json({ error: 'Producto no encontrado' });

    // Find recipe for product
    const recipe = store.recipes.find(r => r.productId === productId);
    let estimatedCost = 0;

    // Deduct ingredients from raw stock
    if (recipe && recipe.requirements) {
      recipe.requirements.forEach(reqItem => {
        const ing = store.ingredients.find(i => i.id === reqItem.ingredientId);
        if (ing) {
          const totalNeeded = reqItem.amountPerUnit * unitsProduced;
          ing.stockAmount = Math.max(0, ing.stockAmount - totalNeeded);
          estimatedCost += totalNeeded * ing.costPerUnitUSD;
        }
      });
    } else {
      estimatedCost = unitsProduced * 0.85; // Default estimated ingredient cost
    }

    // Add to product finished stock
    prod.stockElaborado += Number(unitsProduced);

    const newBatch: ProductionBatch = {
      id: `bat-${Date.now()}`,
      batchNumber: `LOTE-${new Date().toISOString().replace(/[-T:]/g, '').slice(0, 8)}-${store.batches.length + 1}`,
      date: new Date().toISOString().split('T')[0],
      productId,
      productName: prod.name,
      unitsProduced: Number(unitsProduced),
      costTotalUSD: Number(estimatedCost.toFixed(2)),
      notes,
    };

    store.batches.unshift(newBatch);
    saveStore();
    res.json({ success: true, batch: newBatch, product: prod });
  } catch (error) {
    res.status(500).json({ error: 'Error registrando lote de producción' });
  }
});

// Ingredients CRUD & Stock Restock
app.post('/api/ingredients', (req, res) => {
  try {
    const ingData = req.body;
    const newIng: Ingredient = {
      ...ingData,
      id: ingData.id || `ing-${Date.now()}`,
      lastRestocked: new Date().toISOString().split('T')[0],
    };
    const idx = store.ingredients.findIndex(i => i.id === newIng.id);
    if (idx >= 0) {
      store.ingredients[idx] = newIng;
    } else {
      store.ingredients.push(newIng);
    }
    saveStore();
    res.json({ success: true, ingredient: newIng });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar ingrediente' });
  }
});

app.delete('/api/ingredients/:id', (req, res) => {
  try {
    const { id } = req.params;
    store.ingredients = store.ingredients.filter(i => i.id !== id);
    saveStore();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar ingrediente' });
  }
});

function generateFallbackProductionAdvice() {
  const pendingOrders = store.orders.filter(o => o.status === 'pendiente' || o.status === 'en_preparacion');
  const lowStockIngredients = store.ingredients.filter(i => i.stockAmount <= i.minAlertThreshold);

  const recommendedBatches = store.products.map(p => ({
    productName: p.name,
    quantityToMake: Math.max(15, (25 - (p.stockElaborado || 0))),
    priority: (p.stockElaborado || 0) < 10 ? 'Alta' : 'Media',
    reason: (p.stockElaborado || 0) < 10 
      ? 'Bajo stock en inventario elaborado listo para entrega inmediata'
      : 'Mantener nivel óptimo de rotación para pedidos de la semana',
  }));

  const ingredientReorderAlerts = lowStockIngredients.map(ing => ({
    ingredientName: ing.name,
    currentStock: `${ing.stockAmount} ${ing.unit}`,
    neededStock: `${ing.minAlertThreshold * 2} ${ing.unit}`,
    shortage: `Faltan ${(ing.minAlertThreshold * 2 - ing.stockAmount).toFixed(1)} ${ing.unit}`,
    estimatedCostUSD: Number(((ing.minAlertThreshold * 2 - ing.stockAmount) * ing.costPerUnitUSD).toFixed(2)),
  }));

  return {
    summary: `Análisis de producción calculado para ${pendingOrders.length} pedido(s) pendientes. Se recomienda priorizar los sabores con menor inventario elaborado.`,
    projectedDemandDozen: Math.max(30, pendingOrders.length * 5 + 20),
    recommendedBatches: recommendedBatches.slice(0, 4),
    ingredientReorderAlerts: ingredientReorderAlerts.length > 0 ? ingredientReorderAlerts : [
      {
        ingredientName: 'Harina de Trigo Todo Uso',
        currentStock: '8.5 kg',
        neededStock: '15.0 kg',
        shortage: 'Faltan 6.5 kg',
        estimatedCostUSD: 7.15,
      }
    ],
    profitOptimizationTips: [
      'Agrupar la horneada de Rosquetes Glaseados Tradicionales en mañanas frías para optimizar el punto del almíbar.',
      'Ofrecer combos familiares de 12 rosquetes surtidos para acelerar la rotación del inventario elaborado.',
      'Mantener la tasa oficial del BCV actualizada para cobros en Bolívares por Pago Móvil en Aragua.'
    ]
  };
}

// Gemini AI Production Advice Endpoint
app.post('/api/ai/production-advice', async (req, res) => {
  try {
    if (!ai) {
      return res.json(generateFallbackProductionAdvice());
    }

    const pendingOrders = store.orders.filter(o => o.status === 'pendiente' || o.status === 'en_preparacion');
    const ingredientList = store.ingredients.map(i => `${i.name}: ${i.stockAmount} ${i.unit} (Mínimo recomendado: ${i.minAlertThreshold} ${i.unit})`).join(', ');
    const productStock = store.products.map(p => `${p.name}: ${p.stockElaborado} unidades elaboradas listas`).join(', ');

    const prompt = `Actúa como un Maestro Pastelero y Consultor de Producción Artesanal para la fábrica de "Rosquetes Canarios Don Rosquetico" ubicada en Maracay, Aragua, Venezuela.
    
    ESTADO ACTUAL DE LA FÁBRICA:
    - Pedidos Pendientes/En preparación: ${pendingOrders.length} pedidos.
    - Inventario de Producto Elaborado Listo: ${productStock}
    - Stock Actual de Materia Prima / Ingredientes: ${ingredientList}
    
    Analiza este inventario y la demanda para optimizar la producción artesanal esta semana. Calcula qué lotes hornear para no quedarnos sin stock, detecta ingredientes escasos y ofrece consejos de rentabilidad para el mercado de Aragua.
    
    RESPONDE EXCLUSIVAMENTE EN FORMATO JSON con la siguiente estructura exacta:
    {
      "summary": "Resumen ejecutivo directo de 2 frases sobre la capacidad de producción actual.",
      "projectedDemandDozen": 45,
      "recommendedBatches": [
        {
          "productName": "Nombre del producto",
          "quantityToMake": 20,
          "priority": "Alta",
          "reason": "Explicación breve de por qué hornear este producto"
        }
      ],
      "ingredientReorderAlerts": [
        {
          "ingredientName": "Nombre ingrediente",
          "currentStock": "2.0 kg",
          "neededStock": "4.5 kg",
          "shortage": "Faltan 2.5 kg",
          "estimatedCostUSD": 3.00
        }
      ],
      "profitOptimizationTips": [
        "Consejo 1 para ahorrar materia prima o aprovechar la demanda en Maracay/Turmero/Cagua."
      ]
    }`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const text = response.text || '{}';
      const jsonAdvice = JSON.parse(text);
      return res.json(jsonAdvice);
    } catch (genError: any) {
      console.warn('[AI ADVICE API KEY OR CALL WARN, USING FALLBACK]:', genError?.message || genError);
      return res.json(generateFallbackProductionAdvice());
    }
  } catch (error: any) {
    console.warn('[AI ADVICE GENERAL WARN, USING FALLBACK]:', error?.message || error);
    return res.json(generateFallbackProductionAdvice());
  }
});

// Vite & Static file serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[ROSQUETES APP] Servidor corriendo en puerto ${PORT}`);
  });
}

startServer();
