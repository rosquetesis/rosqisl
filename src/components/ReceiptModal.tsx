import React from 'react';
import { Printer, X } from 'lucide-react';
import { AdminSettings, Order } from '../types';

interface ReceiptModalProps {
  order: Order | null;
  onClose: () => void;
  settings: AdminSettings;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  order,
  onClose,
  settings,
}) => {
  if (!order) return null;

  const handlePrint = () => {
    const el = document.getElementById('printable-receipt');
    if (!el) return;

    const win = window.open('', '_blank', 'width=600,height=800');
    if (!win) return;

    win.document.write(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Comprobante ${order.orderNumber}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 12px; color: #3E2E22; padding: 24px; background: #fff; }
    h2 { font-size: 18px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; }
    .center { text-align: center; }
    .muted { color: #78604E; }
    .italic { font-style: italic; }
    .mono { font-family: monospace; }
    .bold { font-weight: bold; }
    .section { background: #FDFBF7; border: 1px solid #E5DED4; border-radius: 8px; padding: 10px 12px; margin: 10px 0; }
    .header { border-bottom: 1px solid #E5DED4; padding-bottom: 12px; margin-bottom: 12px; }
    table { width: 100%; border-collapse: collapse; margin: 10px 0; }
    th, td { border: 1px solid #E5DED4; padding: 6px 8px; }
    th { background: #F4EFEA; font-weight: bold; text-transform: uppercase; font-size: 10px; }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .totals { background: #FDFBF7; border: 1px solid #E5DED4; border-radius: 8px; padding: 10px 12px; text-align: right; }
    .total-final { font-size: 15px; color: #D97706; font-weight: 900; }
    .payment { background: #FFFBEA; border: 1px solid #FDE68A; border-radius: 8px; padding: 10px 12px; margin: 10px 0; font-size: 11px; }
    .footer { text-align: center; font-style: italic; color: #78604E; font-size: 10px; margin-top: 14px; }
    .order-num { font-family: monospace; font-weight: bold; font-size: 13px; }
  </style>
</head>
<body>
  <div class="header center">
    <div style="font-size:32px; margin-bottom:4px;">${settings.storeLogoType !== 'image' ? (settings.storeLogoValue || '🍩') : '🍩'}</div>
    <h2>${settings.storeName}</h2>
    ${settings.storeBadge ? `<p style="color:#D97706;font-size:11px;font-weight:bold;text-transform:uppercase;letter-spacing:1px;">${settings.storeBadge}</p>` : ''}
    <p class="muted italic" style="font-size:11px;">${settings.storeTagline || ''}</p>
    <p class="muted" style="font-size:10px;">${settings.storeAddress || ''}</p>
    <p class="order-num" style="margin-top:8px;">NOTA DE ENTREGA N°: ${order.orderNumber}</p>
    <p class="muted" style="font-size:10px;">Fecha: ${new Date(order.createdAt).toLocaleString('es-VE')}</p>
  </div>

  <div class="section">
    <p><strong>Cliente:</strong> ${order.customerName}</p>
    <p><strong>Teléfono / WhatsApp:</strong> ${order.customerPhone}</p>
    <p><strong>Zona de Entrega (Aragua):</strong> ${order.deliveryZone} (${order.deliveryCity})</p>
    <p><strong>Dirección:</strong> ${order.addressDetail}</p>
    ${order.notes ? `<p><strong>Notas:</strong> ${order.notes}</p>` : ''}
  </div>

  <table>
    <thead>
      <tr>
        <th>Producto</th>
        <th class="text-center">Cant.</th>
        <th class="text-right">Precio P/U</th>
        <th class="text-right">Subtotal</th>
      </tr>
    </thead>
    <tbody>
      ${order.items.map(item => `
      <tr>
        <td>${item.productName} (${item.unitType})</td>
        <td class="text-center mono bold">${item.quantity}</td>
        <td class="text-right mono">$${item.unitPriceUSD.toFixed(2)}</td>
        <td class="text-right mono bold">$${item.subtotalUSD.toFixed(2)}</td>
      </tr>`).join('')}
    </tbody>
  </table>

  <div class="totals">
    <p>Subtotal Productos: $${(order.totalUSD - order.deliveryFeeUSD).toFixed(2)} USD</p>
    <p>Costo Delivery (${order.deliveryZone}): $${order.deliveryFeeUSD.toFixed(2)} USD</p>
    <div style="border-top:1px solid #E5DED4;margin-top:8px;padding-top:8px;display:flex;justify-content:space-between;align-items:flex-start;">
      <span class="bold" style="font-size:13px;">TOTAL A PAGAR:</span>
      <div>
        <p class="total-final">$${order.totalUSD.toFixed(2)} USD</p>
        <p class="muted mono" style="font-size:10px;">(${order.totalVES.toFixed(2)} Bs. @ Tasa ${order.exchangeRateVES.toFixed(2)})</p>
      </div>
    </div>
  </div>

  <div class="payment">
    <p><strong>Método de Pago:</strong> ${order.paymentMethod.toUpperCase().replace('_', ' ')}</p>
    ${order.paymentReference ? `<p><strong>Ref. Pago:</strong> #${order.paymentReference}</p>` : ''}
    <p><strong>Estado del Pago:</strong> ${order.paymentVerified ? '✓ Verificado' : 'Pendiente de verificación'}</p>
  </div>

  <div class="footer">¡Gracias por preferir la tradición artesanal de Rosquetes Isleños!</div>

  <script>window.onload = () => { window.print(); window.onafterprint = () => window.close(); };<\/script>
</body>
</html>`);
    win.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-[#E5DED4] text-[#3E2E22] p-6 space-y-6">
        {/* Printable Section */}
        <div id="printable-receipt" className="space-y-4 font-sans text-xs">
          {/* Header */}
          <div className="text-center border-b border-[#E5DED4] pb-4 space-y-1">
            <div className="flex justify-center mb-1">
              {settings.storeLogoType === 'image' && settings.storeLogoValue ? (
                <img
                  src={settings.storeLogoValue}
                  alt={settings.storeName}
                  className="w-12 h-12 rounded-full object-cover border border-[#E5DED4]"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="text-3xl">{settings.storeLogoValue || '🍩'}</div>
              )}
            </div>
            <h2 className="font-serif font-extrabold text-xl text-[#3E2E22] uppercase tracking-tight">
              {settings.storeName}
            </h2>
            {settings.storeBadge && (
              <p className="text-[11px] font-bold text-[#D97706] uppercase tracking-wider">{settings.storeBadge}</p>
            )}
            <p className="text-[11px] text-[#78604E] italic">{settings.storeTagline}</p>
            <p className="text-[10px] text-[#78604E]">{settings.storeAddress}</p>
            <div className="pt-2 font-mono font-bold text-[#3E2E22] text-sm">
              NOTA DE ENTREGA N°: {order.orderNumber}
            </div>
            <p className="text-[10px] text-[#78604E]">
              Fecha: {new Date(order.createdAt).toLocaleString('es-VE')}
            </p>
          </div>

          {/* Customer Info */}
          <div className="bg-[#FDFBF7] p-3.5 rounded-2xl border border-[#E5DED4] space-y-1">
            <p><strong>Cliente:</strong> {order.customerName}</p>
            <p><strong>Teléfono / WhatsApp:</strong> {order.customerPhone}</p>
            <p><strong>Zona de Entrega (Aragua):</strong> {order.deliveryZone} ({order.deliveryCity})</p>
            <p><strong>Dirección:</strong> {order.addressDetail}</p>
            {order.notes && <p><strong>Notas:</strong> {order.notes}</p>}
          </div>

          {/* Items Table */}
          <table className="w-full text-left border-collapse border border-[#E5DED4]">
            <thead>
              <tr className="bg-[#F4EFEA] text-[#3E2E22] font-bold uppercase text-[10px]">
                <th className="p-2 border border-[#E5DED4]">Producto</th>
                <th className="p-2 border border-[#E5DED4] text-center">Cant.</th>
                <th className="p-2 border border-[#E5DED4] text-right">Precio P/U</th>
                <th className="p-2 border border-[#E5DED4] text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, idx) => (
                <tr key={idx} className="border-b border-[#E5DED4] font-medium">
                  <td className="p-2 border border-[#E5DED4]">{item.productName} ({item.unitType})</td>
                  <td className="p-2 border border-[#E5DED4] text-center font-mono font-bold">{item.quantity}</td>
                  <td className="p-2 border border-[#E5DED4] text-right font-mono">${item.unitPriceUSD.toFixed(2)}</td>
                  <td className="p-2 border border-[#E5DED4] text-right font-mono font-bold">${item.subtotalUSD.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="space-y-1.5 text-right font-bold text-xs bg-[#FDFBF7] p-3 rounded-xl border border-[#E5DED4]">
            <p>Subtotal Productos: ${(order.totalUSD - order.deliveryFeeUSD).toFixed(2)} USD</p>
            <p>Costo Delivery ({order.deliveryZone}): ${order.deliveryFeeUSD.toFixed(2)} USD</p>
            <div className="pt-2 border-t border-[#E5DED4] text-sm font-serif text-[#3E2E22] flex justify-between">
              <span>TOTAL A PAGAR:</span>
              <div className="text-right">
                <span className="text-base text-[#D97706] font-extrabold">${order.totalUSD.toFixed(2)} USD</span>
                <span className="block text-xs font-mono font-normal text-[#78604E]">
                  ({order.totalVES.toFixed(2)} Bs. @ Tasa {order.exchangeRateVES.toFixed(2)})
                </span>
              </div>
            </div>
          </div>

          {/* Payment Method Details */}
          <div className="bg-[#FEF3C7]/60 p-3 rounded-xl text-[11px] space-y-0.5 border border-[#FDE68A]">
            <p><strong>Método de Pago:</strong> {order.paymentMethod.toUpperCase().replace('_', ' ')}</p>
            {order.paymentReference && <p><strong>Ref. Pago:</strong> #{order.paymentReference}</p>}
            <p><strong>Estado del Pago:</strong> {order.paymentVerified ? '✓ Verificado' : 'Pendiente de verificación'}</p>
          </div>

          <div className="text-center text-[10px] text-[#78604E] italic pt-2">
            ¡Gracias por preferir la tradición artesanal de Rosquetes Isleños!
          </div>
        </div>

        {/* Modal Buttons */}
        <div className="flex justify-end gap-2 pt-2 border-t border-[#E5DED4]">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#F4EFEA] text-[#3E2E22] font-bold rounded-xl text-xs hover:bg-[#EFECE6]"
          >
            Cerrar
          </button>
          <button
            onClick={handlePrint}
            className="px-5 py-2 bg-[#3E2E22] text-[#FDFBF7] font-bold rounded-xl text-xs flex items-center gap-1.5 hover:bg-[#5D4636] cursor-pointer"
          >
            <Printer className="w-4 h-4 text-[#D97706]" /> Imprimir Comprobante
          </button>
        </div>
      </div>
    </div>
  );
};

