import React from 'react';
import { Printer, X, CheckCircle2, MapPin, Phone } from 'lucide-react';
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
            ¡Gracias por preferir la tradición artesanal de Rosquetes Canarios Don Rosquetico!
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
            onClick={() => window.print()}
            className="px-5 py-2 bg-[#3E2E22] text-[#FDFBF7] font-bold rounded-xl text-xs flex items-center gap-1.5 hover:bg-[#5D4636] cursor-pointer"
          >
            <Printer className="w-4 h-4 text-[#D97706]" /> Imprimir Comprobante
          </button>
        </div>
      </div>
    </div>
  );
};
