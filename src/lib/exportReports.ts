import * as XLSX from 'xlsx';
import { Order, Customer, Product, Ingredient, AdminSettings } from '../types';

export interface ExportReportData {
  orders: Order[];
  clients: Customer[];
  products: Product[];
  ingredients: Ingredient[];
  settings: AdminSettings;
}

/**
 * Generates and downloads a complete Excel Workbook (.xlsx)
 * containing multiple formatted sheets:
 * 1. Resumen Ejecutivo
 * 2. Reporte de Ventas y Pedidos
 * 3. Catálogo e Inventario de Productos
 * 4. Directorio de Clientes
 * 5. Materia Prima e Insumos
 */
export function exportToExcel(data: ExportReportData, reportTitle: string = 'Reporte_General_Rosquetes_Canarios') {
  const { orders = [], clients = [], products = [], ingredients = [], settings } = data;
  const exchangeRate = settings?.exchangeRateVES || 68.50;
  const wb = XLSX.utils.book_new();

  // 1. RESUMEN EJECUTIVO
  const totalSalesUSD = orders.reduce((sum, o) => sum + (o.totalUSD || 0), 0);
  const totalOrdersCount = orders.length;
  const completedOrdersCount = orders.filter(o => o.status === 'entregado').length;
  const pendingOrdersCount = orders.filter(o => o.status === 'pendiente' || o.status === 'en_preparacion' || o.status === 'confirmado').length;
  const totalClientsCount = clients.length;
  const totalProductsCount = products.length;

  const summaryRows = [
    ['REPORTE EJECUTIVO Y FINANCIERO - ' + (settings?.storeName || 'Rosquetes Canarios')],
    ['Fecha de Generación:', new Date().toLocaleString('es-VE')],
    ['Tasa de Cambio BCV Usada:', `${exchangeRate} Bs./USD`],
    [''],
    ['MÉTRICA CLAVE', 'VALOR (USD)', 'VALOR ESTIMADO (BS)'],
    ['Ventas Totales Registradas', totalSalesUSD, totalSalesUSD * exchangeRate],
    ['Total de Pedidos Procesados', totalOrdersCount, '-'],
    ['Pedidos Entregados / Completados', completedOrdersCount, '-'],
    ['Pedidos Pendientes / En Proceso', pendingOrdersCount, '-'],
    ['Total de Clientes Registrados', totalClientsCount, '-'],
    ['Variedades de Productos en Catálogo', totalProductsCount, '-'],
    ['Variedades de Materia Prima en Stock', ingredients.length, '-'],
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
  wsSummary['!cols'] = [{ wch: 38 }, { wch: 22 }, { wch: 25 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumen Ejecutivo');

  // 2. REPORTE DE VENTAS / PEDIDOS
  if (orders.length > 0) {
    const salesRows = orders.map(order => {
      const itemsDetail = order.items ? order.items.map(i => `${i.quantity}x ${i.productName || 'Producto'}`).join(', ') : 'N/A';
      return {
        'Nº Pedido': order.orderNumber,
        'Fecha y Hora': order.createdAt ? new Date(order.createdAt).toLocaleString('es-VE') : '',
        'Cliente': order.customerName,
        'Teléfono': order.customerPhone,
        'Correo': order.customerEmail || 'N/A',
        'Ciudad': order.deliveryCity,
        'Zona Delivery': order.deliveryZone || 'N/A',
        'Dirección': order.addressDetail || 'N/A',
        'Productos': itemsDetail,
        'Método de Pago': order.paymentMethod || 'Manual',
        'Ref. Transacción': order.paymentReference || 'N/A',
        'Verificación Pago': order.paymentVerified ? 'SÍ (VERIFICADO)' : 'PENDIENTE',
        'Estado': (order.status || '').toUpperCase(),
        'Total ($ USD)': order.totalUSD,
        'Total (Bs.)': order.totalVES || (order.totalUSD * exchangeRate),
        'Canal Despacho': order.dispatchMethodUsed ? order.dispatchMethodUsed.toUpperCase() : 'N/A',
        'Notas': order.notes || '',
      };
    });

    const wsSales = XLSX.utils.json_to_sheet(salesRows);
    wsSales['!cols'] = [
      { wch: 16 }, { wch: 20 }, { wch: 22 }, { wch: 16 }, { wch: 24 },
      { wch: 16 }, { wch: 20 }, { wch: 30 }, { wch: 35 }, { wch: 20 },
      { wch: 18 }, { wch: 20 }, { wch: 14 }, { wch: 14 }, { wch: 16 },
      { wch: 15 }, { wch: 25 }
    ];
    XLSX.utils.book_append_sheet(wb, wsSales, 'Ventas y Pedidos');
  }

  // 3. DIRECTORIO DE CLIENTES
  if (clients.length > 0) {
    const clientRows = clients.map(client => ({
      'ID Cliente': client.id,
      'Nombre y Apellido': client.name,
      'Teléfono': client.phone,
      'Correo Electrónico': client.email || 'N/A',
      'Ciudad / Municipio': client.city,
      'Dirección de Entrega': client.address || 'N/A',
      'Total Pedidos Realizados': client.totalOrders,
      'Gasto Total ($ USD)': client.totalSpentUSD,
      'Gasto Total (Bs.)': client.totalSpentUSD * exchangeRate,
      'Fecha de Registro': client.createdAt,
    }));

    const wsClients = XLSX.utils.json_to_sheet(clientRows);
    wsClients['!cols'] = [
      { wch: 15 }, { wch: 25 }, { wch: 16 }, { wch: 26 }, { wch: 18 },
      { wch: 30 }, { wch: 22 }, { wch: 18 }, { wch: 18 }, { wch: 16 }
    ];
    XLSX.utils.book_append_sheet(wb, wsClients, 'Directorio Clientes');
  }

  // 4. CATÁLOGO E INVENTARIO DE PRODUCTOS
  if (products.length > 0) {
    const productRows = products.map(prod => ({
      'ID Producto': prod.id,
      'Nombre del Producto': prod.name,
      'Categoría': (prod.category || '').toUpperCase(),
      'Tipo de Unidad': prod.unitType,
      'Precio ($ USD)': prod.priceUSD,
      'Precio Estimado (Bs.)': prod.priceUSD * exchangeRate,
      'Stock Elaborado': prod.stockElaborado,
      'Destacado': prod.featured ? 'SÍ' : 'NO',
      'Publicado': prod.isPublished !== false ? 'SÍ' : 'NO',
      'Descripción': prod.description || '',
    }));

    const wsProducts = XLSX.utils.json_to_sheet(productRows);
    wsProducts['!cols'] = [
      { wch: 14 }, { wch: 28 }, { wch: 16 }, { wch: 14 }, { wch: 15 },
      { wch: 20 }, { wch: 16 }, { wch: 12 }, { wch: 12 }, { wch: 40 }
    ];
    XLSX.utils.book_append_sheet(wb, wsProducts, 'Inventario Productos');
  }

  // 5. MATERIA PRIMA E INSUMOS
  if (ingredients.length > 0) {
    const ingredientRows = ingredients.map(ing => {
      const stock = ing.stockAmount || 0;
      const minThreshold = ing.minAlertThreshold || 0;
      const costUnit = ing.costPerUnitUSD || 0;
      return {
        'ID Insumo': ing.id,
        'Nombre del Insumo': ing.name,
        'Categoría': (ing.category || '').toUpperCase(),
        'Stock Actual': stock,
        'Stock Mínimo Alerta': minThreshold,
        'Unidad de Medida': ing.unit,
        'Costo por Unidad ($ USD)': costUnit,
        'Costo Total Insumo ($ USD)': stock * costUnit,
        'Último Reabastecimiento': ing.lastRestocked || 'N/A',
        'Alerta Stock': stock <= minThreshold ? 'CRÍTICO' : 'NORMAL',
      };
    });

    const wsIngredients = XLSX.utils.json_to_sheet(ingredientRows);
    wsIngredients['!cols'] = [
      { wch: 14 }, { wch: 26 }, { wch: 16 }, { wch: 14 }, { wch: 16 },
      { wch: 16 }, { wch: 22 }, { wch: 22 }, { wch: 20 }, { wch: 14 }
    ];
    XLSX.utils.book_append_sheet(wb, wsIngredients, 'Materia Prima');
  }

  // Save Excel file
  const fileName = `${reportTitle}_${new Date().toISOString().slice(0,10)}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

/**
 * Generates an executive Rich Text / Formatted Printable HTML Report
 * opens in a clean window for printing or saving as PDF
 */
export function openPrintableReport(data: ExportReportData) {
  const { orders = [], clients = [], products = [], ingredients = [], settings } = data;
  const exchangeRate = settings?.exchangeRateVES || 68.50;
  const totalSalesUSD = orders.reduce((sum, o) => sum + (o.totalUSD || 0), 0);

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Por favor permite ventanas emergentes en tu navegador para abrir el reporte imprimible.');
    return;
  }

  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Informe Ejecutivo - ${settings?.storeName || 'Rosquetes Canarios'}</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1f2937; margin: 0; padding: 24px; background: #fff; }
        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #D97706; padding-bottom: 16px; margin-bottom: 24px; }
        .brand { font-size: 24px; font-weight: 800; color: #3E2E22; }
        .meta { font-size: 12px; color: #4b5563; text-align: right; }
        .section-title { font-size: 15px; font-weight: 700; color: #3E2E22; border-bottom: 2px solid #E5DED4; padding-bottom: 6px; margin-top: 28px; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
        .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
        .card { background: #FDFBF7; border: 1px solid #E5DED4; border-radius: 8px; padding: 12px; text-align: center; }
        .card-label { font-size: 11px; color: #78604E; text-transform: uppercase; font-weight: 600; }
        .card-val { font-size: 20px; font-weight: 800; color: #B45309; margin-top: 4px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px; }
        th { background: #3E2E22; color: #FDFBF7; text-align: left; padding: 8px 10px; font-weight: 600; }
        td { padding: 8px 10px; border-bottom: 1px solid #E5DED4; }
        tr:nth-child(even) { background: #FDFBF7; }
        .badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 700; text-transform: uppercase; }
        .badge-delivered { background: #dcfce7; color: #166534; }
        .badge-pending { background: #fef3c7; color: #92400e; }
        .badge-critical { background: #fee2e2; color: #991b1b; }
        .footer-note { text-align: center; margin-top: 40px; font-size: 11px; color: #9ca3af; border-top: 1px solid #E5DED4; padding-top: 12px; }
        @media print {
          body { padding: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="no-print" style="margin-bottom: 16px; text-align: right;">
        <button onclick="window.print()" style="background: #D97706; color: white; border: none; padding: 10px 20px; font-weight: bold; border-radius: 6px; cursor: pointer;">🖨️ Imprimir / Guardar como PDF</button>
      </div>

      <div class="header">
        <div>
          <div class="brand">🍩 ${settings?.storeName || 'Rosquetes Canarios'}</div>
          <div style="font-size: 13px; color: #D97706; font-weight: 600;">${settings?.storeTagline || 'El Auténtico Sabor de la Tradición Canaria'}</div>
        </div>
        <div class="meta">
          <strong>INFORME EJECUTIVO GENERAL</strong><br>
          Generado el: ${new Date().toLocaleString('es-VE')}<br>
          Tasa Oficial BCV: <strong>${exchangeRate.toFixed(2)} Bs./USD</strong>
        </div>
      </div>

      <div class="section-title">📊 Resumen Métricas Clave</div>
      <div class="grid">
        <div class="card">
          <div class="card-label">Ventas Totales</div>
          <div class="card-val">$${totalSalesUSD.toFixed(2)}</div>
          <div style="font-size: 10px; color: #6b7280;">${(totalSalesUSD * exchangeRate).toFixed(2)} Bs.</div>
        </div>
        <div class="card">
          <div class="card-label">Total Pedidos</div>
          <div class="card-val">${orders.length}</div>
          <div style="font-size: 10px; color: #6b7280;">${orders.filter(o => o.status === 'entregado').length} entregados</div>
        </div>
        <div class="card">
          <div class="card-label">Directorio Clientes</div>
          <div class="card-val">${clients.length}</div>
          <div style="font-size: 10px; color: #6b7280;">Clientes registrados</div>
        </div>
        <div class="card">
          <div class="card-label">Variedad Productos</div>
          <div class="card-val">${products.length}</div>
          <div style="font-size: 10px; color: #6b7280;">${products.filter(p => p.isPublished !== false).length} publicados</div>
        </div>
      </div>

      ${orders.length > 0 ? `
      <div class="section-title">📦 ÚLTIMOS PEDIDOS REGISTRADOS</div>
      <table>
        <thead>
          <tr>
            <th>Nº Orden</th>
            <th>Fecha</th>
            <th>Cliente</th>
            <th>Ciudad</th>
            <th>Monto ($)</th>
            <th>Monto (Bs.)</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          ${orders.slice(0, 15).map(o => `
            <tr>
              <td><strong>${o.orderNumber}</strong></td>
              <td>${o.createdAt ? new Date(o.createdAt).toLocaleDateString('es-VE') : ''}</td>
              <td>${o.customerName}</td>
              <td>${o.deliveryCity}</td>
              <td><strong>$${o.totalUSD.toFixed(2)}</strong></td>
              <td>${(o.totalVES || o.totalUSD * exchangeRate).toFixed(2)} Bs.</td>
              <td>
                <span class="badge ${o.status === 'entregado' ? 'badge-delivered' : 'badge-pending'}">
                  ${o.status}
                </span>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      ` : ''}

      ${clients.length > 0 ? `
      <div class="section-title">👥 DIRECTORIO DE CLIENTES</div>
      <table>
        <thead>
          <tr>
            <th>Cliente</th>
            <th>Teléfono</th>
            <th>Ciudad</th>
            <th>Pedidos Realizados</th>
            <th>Gasto Total ($ USD)</th>
          </tr>
        </thead>
        <tbody>
          ${clients.slice(0, 10).map(c => `
            <tr>
              <td><strong>${c.name}</strong></td>
              <td>${c.phone}</td>
              <td>${c.city}</td>
              <td>${c.totalOrders} pedidos</td>
              <td><strong>$${c.totalSpentUSD.toFixed(2)} USD</strong></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      ` : ''}

      ${products.length > 0 ? `
      <div class="section-title">🏭 INVENTARIO DE PRODUCTOS</div>
      <table>
        <thead>
          <tr>
            <th>Producto</th>
            <th>Categoría</th>
            <th>Unidad</th>
            <th>Precio ($)</th>
            <th>Stock Elaborado</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          ${products.map(p => `
            <tr>
              <td><strong>${p.name}</strong></td>
              <td>${(p.category || '').toUpperCase()}</td>
              <td>${p.unitType}</td>
              <td>$${p.priceUSD.toFixed(2)}</td>
              <td>${p.stockElaborado} uds</td>
              <td><span class="badge ${p.isPublished !== false ? 'badge-delivered' : 'badge-critical'}">${p.isPublished !== false ? 'Publicado' : 'Oculto'}</span></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      ` : ''}

      <div class="footer-note">
        ${settings?.storeName || 'Rosquetes Canarios'} — Reporte oficial generado para fines administrativos y auditoría interna.
      </div>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}
