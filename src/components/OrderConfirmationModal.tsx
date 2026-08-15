import React from 'react';
import { CheckCircle2, X, Send, Printer, ShoppingBag, MapPin, Phone } from 'lucide-react';
import { AdminSettings, Order } from '../types';

interface OrderConfirmationModalProps {
  order: Order | null;
  onClose: () => void;
  settings: AdminSettings;
}

export const OrderConfirmationModal: React.FC<OrderConfirmationModalProps> = ({
  order,
  onClose,
  settings,
}) => {
  if (!order) return null;

  const handleOpenWhatsApp = () => {
    const itemsText = order.items
      .map(i => `• ${i.quantity}x ${i.productName} (${i.unitType}) - $${i.subtotalUSD.toFixed(2)}`)
      .join('\n');

    let message = settings.whatsappMessageTemplate
      .replace('{ORDER_NUMBER}', order.orderNumber)
      .replace('{CUSTOMER_NAME}', order.customerName)
      .replace('{CUSTOMER_PHONE}', order.customerPhone)
      .replace('{DELIVERY_ZONE}', order.deliveryZone)
      .replace('{DELIVERY_CITY}', order.deliveryCity)
      .replace('{ADDRESS}', order.addressDetail)
      .replace('{ORDER_ITEMS}', itemsText)
      .replace('{SUBTOTAL_USD}', (order.totalUSD - order.deliveryFeeUSD).toFixed(2))
      .replace('{DELIVERY_FEE_USD}', order.deliveryFeeUSD.toFixed(2))
      .replace('{TOTAL_USD}', order.totalUSD.toFixed(2))
      .replace('{TOTAL_VES}', order.totalVES.toFixed(2))
      .replace('{EXCHANGE_RATE}', order.exchangeRateVES.toFixed(2))
      .replace('{PAYMENT_METHOD}', order.paymentMethod.toUpperCase().replace('_', ' '))
      .replace('{PAYMENT_REF}', order.paymentReference || 'Sin referencia');

    const waUrl = `https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
  };

  const handlePrint = () => {
    const win = window.open('', '_blank', 'width=600,height=700');
    if (!win) return;
    const itemsRows = order.items.map(i =>
      `<tr><td>${i.quantity}x ${i.productName} (${i.unitType})</td><td style="text-align:right;font-family:monospace;font-weight:bold;">$${i.subtotalUSD.toFixed(2)} USD</td></tr>`
    ).join('');
    win.document.write(`<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"/><title>Comprobante ${order.orderNumber}</title>
<style>
  body{font-family:Arial,sans-serif;font-size:13px;color:#3E2E22;padding:28px;background:#fff;max-width:480px;margin:auto}
  h2{font-size:19px;font-weight:900;text-transform:uppercase;text-align:center;margin:0}
  .center{text-align:center} .muted{color:#78604E} .mono{font-family:monospace}
  .section{background:#FDFBF7;border:1px solid #E5DED4;border-radius:8px;padding:10px 14px;margin:12px 0}
  table{width:100%;border-collapse:collapse;margin:8px 0}
  td{padding:5px 2px;border-bottom:1px solid #E5DED4}
  .total{font-size:16px;color:#D97706;font-weight:900}
  .badge{color:#D97706;font-size:11px;font-weight:bold;text-transform:uppercase;letter-spacing:1px}
  hr{border:none;border-top:1px solid #E5DED4;margin:12px 0}
</style></head>
<body>
  <div class="center">
    <div style="font-size:36px">🍩</div>
    <h2>${settings.storeName}</h2>
    <p class="badge">${settings.storeBadge || ''}</p>
    <p class="muted" style="font-style:italic;font-size:11px">${settings.storeTagline || ''}</p>
    <p style="font-family:monospace;font-weight:bold;margin-top:8px">Comprobante N°: ${order.orderNumber}</p>
    <p class="muted" style="font-size:10px">Fecha: ${new Date(order.createdAt).toLocaleString('es-VE')}</p>
  </div>
  <hr/>
  <div class="section">
    <p><strong>Cliente:</strong> ${order.customerName}</p>
    <p><strong>Teléfono:</strong> ${order.customerPhone}</p>
    <p><strong>Zona:</strong> ${order.deliveryZone} (${order.deliveryCity})</p>
    <p><strong>Dirección:</strong> ${order.addressDetail}</p>
  </div>
  <div class="section">
    <table>${itemsRows}</table>
    <hr/>
    <div style="display:flex;justify-content:space-between;align-items:center;">
      <strong>TOTAL A PAGAR:</strong>
      <div style="text-align:right">
        <p class="total">$${order.totalUSD.toFixed(2)} USD</p>
        <p class="muted mono" style="font-size:10px">(${order.totalVES.toFixed(2)} Bs.)</p>
      </div>
    </div>
  </div>
  <div class="section" style="background:#FFFBEA;border-color:#FDE68A;font-size:11px">
    <p><strong>Pago:</strong> ${order.paymentMethod.toUpperCase().replace('_',' ')}</p>
    ${order.paymentReference ? `<p><strong>Ref:</strong> #${order.paymentReference}</p>` : ''}
  </div>
  <p class="center muted" style="font-style:italic;font-size:10px;margin-top:14px">¡Gracias por preferir Rosquetes Isleños!</p>
  <script>window.onload=()=>{window.print();window.onafterprint=()=>window.close();}<\/script>
</body></html>`);
    win.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#FDFBF7] rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-[#E5DED4] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-[#3E2E22] text-[#FDFBF7] p-6 text-center relative border-b border-[#5D4636]">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-[#5D4636] text-[#FEF3C7] hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-3 border border-emerald-500/40">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h3 className="font-serif text-2xl font-bold text-[#FDFBF7]">
            ¡Pedido Registrado con Éxito!
          </h3>
          <p className="text-xs text-[#FEF3C7] mt-1">
            N° de Pedido: <strong className="text-white font-mono text-sm">{order.orderNumber}</strong>
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 text-[#3E2E22]">
          <div className="bg-white p-4 rounded-2xl border border-[#E5DED4] space-y-2 text-xs">
            <div className="flex justify-between font-semibold">
              <span className="text-[#78604E]">Cliente:</span>
              <span className="font-bold">{order.customerName}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span className="text-[#78604E]">Teléfono:</span>
              <span className="font-bold">{order.customerPhone}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span className="text-[#78604E]">Zona de Despacho:</span>
              <span className="font-bold">{order.deliveryZone}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span className="text-[#78604E]">Dirección:</span>
              <span className="text-right max-w-[200px] font-medium">{order.addressDetail}</span>
            </div>
          </div>

          {/* Items Summary */}
          <div className="bg-[#F4EFEA] p-4 rounded-2xl border border-[#E5DED4] space-y-2">
            <p className="text-xs font-bold text-[#3E2E22] uppercase border-b border-[#E5DED4] pb-1">
              Detalle de Rosquetes Solicitados
            </p>
            {order.items.map((item, idx) => (
              <div key={idx} className="flex justify-between text-xs py-0.5">
                <span>{item.quantity}x {item.productName} ({item.unitType})</span>
                <span className="font-bold font-mono">${item.subtotalUSD.toFixed(2)} USD</span>
              </div>
            ))}
            <div className="pt-2 border-t border-[#E5DED4] flex justify-between items-baseline font-bold text-sm text-[#3E2E22]">
              <span>Total Final:</span>
              <div className="text-right">
                <span className="text-[#D97706] font-serif text-base">${order.totalUSD.toFixed(2)} USD</span>
                <span className="block text-[11px] font-mono text-[#78604E] font-normal">
                  ({order.totalVES.toFixed(2)} Bs.)
                </span>
              </div>
            </div>
          </div>

          <div className="text-xs text-[#4A3728] bg-[#FEF3C7]/80 p-3 rounded-xl border border-[#FDE68A]">
            📌 <strong>Próximo Paso:</strong> Si envías tu pedido por WhatsApp, nuestro equipo en Maracay revisará la disponibilidad de stock y te confirmará la hora exacta de salida del delivery.
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-2">
            <button
              onClick={handleOpenWhatsApp}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-3 rounded-xl text-sm shadow-md transition-all cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Abrir WhatsApp para Confirmar ({settings.whatsappNumber})</span>
            </button>

            <button
              onClick={handlePrint}
              className="w-full flex items-center justify-center gap-2 bg-[#F4EFEA] hover:bg-[#EFECE6] text-[#3E2E22] border border-[#E5DED4] font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4 text-[#D97706]" />
              <span>Imprimir / Guardar Comprobante</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
