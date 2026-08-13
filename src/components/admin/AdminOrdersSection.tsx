import React, { useState } from 'react';
import { Search, Filter, Printer, Trash2, Eye, CheckCircle2, Clock, Plus, X, Phone } from 'lucide-react';
import { Order, OrderStatus } from '../../types';

interface AdminOrdersSectionProps {
  orders: Order[];
  onUpdateOrderStatus: (orderId: string, status: OrderStatus, paymentVerified?: boolean) => Promise<void>;
  onDeleteOrder: (orderId: string) => Promise<void>;
  onSelectOrderForReceipt: (order: Order) => void;
}

export const AdminOrdersSection: React.FC<AdminOrdersSectionProps> = ({
  orders,
  onUpdateOrderStatus,
  onDeleteOrder,
  onSelectOrderForReceipt,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<Order | null>(null);

  const filteredOrders = orders.filter(ord => {
    const matchesSearch =
      ord.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ord.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ord.customerPhone.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ord.deliveryZone.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'todos' || ord.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    await onUpdateOrderStatus(orderId, newStatus);
  };

  const handleVerifyPayment = async (order: Order) => {
    await onUpdateOrderStatus(order.id, order.status, !order.paymentVerified);
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="bg-white p-6 rounded-3xl border border-[#E5DED4] shadow-md space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#EFECE6] pb-4">
          <div>
            <h3 className="font-serif text-xl font-bold text-[#3E2E22]">Gestión de Pedidos Realizados</h3>
            <p className="text-xs text-[#78604E]">Administra los pedidos solicitados por los clientes en Aragua</p>
          </div>
          <span className="bg-[#F4EFEA] text-[#3E2E22] border border-[#E5DED4] px-3 py-1 rounded-full text-xs font-bold font-mono">
            Total Registrados: {orders.length}
          </span>
        </div>

        {/* Search & Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-8 relative">
            <Search className="w-4 h-4 text-[#D97706] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por N° pedido, cliente, teléfono o zona..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-[#FDFBF7] border border-[#E5DED4] rounded-xl pl-9 pr-4 py-2 text-xs font-medium text-[#3E2E22] focus:ring-2 focus:ring-[#D97706] focus:outline-none"
            />
          </div>

          <div className="sm:col-span-4 flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#78604E] shrink-0" />
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full bg-[#FDFBF7] border border-[#E5DED4] rounded-xl p-2 text-xs font-bold text-[#3E2E22]"
            >
              <option value="todos">Todos los Estados</option>
              <option value="pendiente">Pendientes</option>
              <option value="confirmado">Confirmados</option>
              <option value="en_preparacion">En Preparación</option>
              <option value="listo">Listos para Entrega</option>
              <option value="entregado">Entregados</option>
              <option value="cancelado">Cancelados</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders — card view on mobile, table on md+ */}
      <div className="bg-white rounded-3xl border border-[#E5DED4] shadow-md overflow-hidden">

        {/* Mobile card list (hidden on md+) */}
        <div className="md:hidden divide-y divide-[#E5DED4]">
          {filteredOrders.length === 0 ? (
            <p className="p-8 text-center text-[#78604E] text-xs">No se encontraron pedidos.</p>
          ) : filteredOrders.map(order => (
            <div key={order.id} className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono font-bold text-[#3E2E22] text-xs block">{order.orderNumber}</span>
                  <span className="text-[10px] text-[#78604E]">
                    {new Date(order.createdAt).toLocaleString('es-VE', { dateStyle: 'short', timeStyle: 'short' })}
                  </span>
                </div>
                <select
                  value={order.status}
                  onChange={e => handleStatusChange(order.id, e.target.value as OrderStatus)}
                  className={`text-[11px] font-extrabold px-2.5 py-1 rounded-xl border focus:outline-none cursor-pointer ${
                    order.status === 'pendiente' ? 'bg-[#FEF3C7] text-[#4A3728] border-[#FDE68A]' :
                    order.status === 'en_preparacion' ? 'bg-blue-100 text-blue-900 border-blue-300' :
                    order.status === 'listo' ? 'bg-emerald-100 text-emerald-900 border-emerald-300' :
                    order.status === 'entregado' ? 'bg-purple-100 text-purple-900 border-purple-300' : 'bg-rose-100 text-rose-900 border-rose-300'
                  }`}
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="confirmado">Confirmado</option>
                  <option value="en_preparacion">En Preparación</option>
                  <option value="listo">Listo</option>
                  <option value="entregado">Entregado</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </div>

              <div className="flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-[#3E2E22]">{order.customerName}</p>
                  <p className="font-mono text-[10px] text-[#78604E]">{order.customerPhone}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-[#3E2E22] font-mono">${order.totalUSD.toFixed(2)} USD</p>
                  <p className="text-[10px] text-[#78604E]">{order.deliveryZone}</p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <button
                  onClick={() => handleVerifyPayment(order)}
                  className={`text-[10px] font-extrabold px-2.5 py-1 rounded-lg border cursor-pointer ${
                    order.paymentVerified
                      ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                      : 'bg-[#FEF3C7] text-[#4A3728] border-[#FDE68A]'
                  }`}
                >
                  {order.paymentVerified ? '✓ Pago Verificado' : '⏳ Verificar Pago'}
                </button>

                <div className="flex items-center gap-1">
                  <button onClick={() => setSelectedOrderDetails(order)} className="p-1.5 text-[#78604E] hover:bg-[#F4EFEA] rounded-lg cursor-pointer" title="Ver Detalles">
                    <Eye className="w-4 h-4" />
                  </button>
                  <button onClick={() => onSelectOrderForReceipt(order)} className="p-1.5 text-[#78604E] hover:bg-[#F4EFEA] rounded-lg cursor-pointer" title="Imprimir">
                    <Printer className="w-4 h-4" />
                  </button>
                  <button onClick={() => onDeleteOrder(order.id)} className="p-1.5 text-rose-600 hover:bg-rose-100 rounded-lg cursor-pointer" title="Eliminar">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop table (hidden on mobile) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs text-[#3E2E22]">
            <thead>
              <tr className="bg-[#3E2E22] text-[#FDFBF7] font-bold uppercase text-[10px] tracking-wider">
                <th className="p-3.5">N° Pedido / Fecha</th>
                <th className="p-3.5">Cliente</th>
                <th className="p-3.5">Zona Despacho</th>
                <th className="p-3.5">Total USD (Bs.)</th>
                <th className="p-3.5">Método / Pago</th>
                <th className="p-3.5">Estado</th>
                <th className="p-3.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5DED4]">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-[#78604E]">
                    No se encontraron pedidos con los criterios seleccionados.
                  </td>
                </tr>
              ) : (
                filteredOrders.map(order => (
                  <tr key={order.id} className="hover:bg-[#FDFBF7] transition-colors">
                    <td className="p-3.5">
                      <span className="font-mono font-bold text-[#3E2E22] block">{order.orderNumber}</span>
                      <span className="text-[10px] text-[#78604E]">
                        {new Date(order.createdAt).toLocaleString('es-VE', { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                    </td>

                    <td className="p-3.5">
                      <div className="font-bold text-[#3E2E22]">{order.customerName}</div>
                      <div className="text-[10px] text-[#78604E] font-mono">{order.customerPhone}</div>
                    </td>

                    <td className="p-3.5 max-w-[150px] truncate" title={order.addressDetail}>
                      <span className="font-semibold block">{order.deliveryZone}</span>
                      <span className="text-[10px] text-[#78604E] truncate block">{order.addressDetail}</span>
                    </td>

                    <td className="p-3.5 font-mono">
                      <span className="font-bold text-[#3E2E22] text-sm block">${order.totalUSD.toFixed(2)} USD</span>
                      <span className="text-[10px] text-[#78604E] block">{order.totalVES.toFixed(2)} Bs.</span>
                    </td>

                    <td className="p-3.5">
                      <span className="uppercase font-bold text-[10px] block">{order.paymentMethod.replace('_', ' ')}</span>
                      {order.paymentReference && (
                        <span className="text-[10px] font-mono text-[#78604E] block">Ref: #{order.paymentReference}</span>
                      )}
                      <button
                        onClick={() => handleVerifyPayment(order)}
                        className={`mt-1 text-[9px] font-extrabold px-2 py-0.5 rounded-md border cursor-pointer ${
                          order.paymentVerified
                            ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                            : 'bg-[#FEF3C7] text-[#4A3728] border border-[#FDE68A]'
                        }`}
                      >
                        {order.paymentVerified ? '✓ Pago Verificado' : '⏳ Verificar Pago'}
                      </button>
                    </td>

                    <td className="p-3.5">
                      <select
                        value={order.status}
                        onChange={e => handleStatusChange(order.id, e.target.value as OrderStatus)}
                        className={`text-[11px] font-extrabold px-2.5 py-1 rounded-xl border focus:outline-none cursor-pointer ${
                          order.status === 'pendiente' ? 'bg-[#FEF3C7] text-[#4A3728] border-[#FDE68A]' :
                          order.status === 'en_preparacion' ? 'bg-blue-100 text-blue-900 border-blue-300' :
                          order.status === 'listo' ? 'bg-emerald-100 text-emerald-900 border-emerald-300' :
                          order.status === 'entregado' ? 'bg-purple-100 text-purple-900 border-purple-300' : 'bg-rose-100 text-rose-900 border-rose-300'
                        }`}
                      >
                        <option value="pendiente">Pendiente</option>
                        <option value="confirmado">Confirmado</option>
                        <option value="en_preparacion">En Preparación</option>
                        <option value="listo">Listo</option>
                        <option value="entregado">Entregado</option>
                        <option value="cancelado">Cancelado</option>
                      </select>
                    </td>

                    <td className="p-3.5 text-right space-x-1">
                      <button
                        onClick={() => setSelectedOrderDetails(order)}
                        className="p-1.5 text-[#78604E] hover:bg-[#F4EFEA] hover:text-[#3E2E22] rounded-lg transition-colors cursor-pointer"
                        title="Ver Detalles"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => onSelectOrderForReceipt(order)}
                        className="p-1.5 text-[#78604E] hover:bg-[#F4EFEA] hover:text-[#3E2E22] rounded-lg transition-colors cursor-pointer"
                        title="Imprimir Comprobante"
                      >
                        <Printer className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => onDeleteOrder(order.id)}
                        className="p-1.5 text-rose-600 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
                        title="Eliminar Pedido"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Details Modal */}
      {selectedOrderDetails && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FDFBF7] rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-[#E5DED4] p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E5DED4] pb-3">
              <h4 className="font-serif font-bold text-lg text-[#3E2E22]">
                Detalle del Pedido #{selectedOrderDetails.orderNumber}
              </h4>
              <button
                onClick={() => setSelectedOrderDetails(null)}
                className="p-1.5 rounded-full hover:bg-[#EFECE6] text-[#78604E]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs text-[#3E2E22]">
              <p><strong>Cliente:</strong> {selectedOrderDetails.customerName}</p>
              <p><strong>Teléfono:</strong> {selectedOrderDetails.customerPhone}</p>
              {selectedOrderDetails.customerEmail && <p><strong>Correo:</strong> {selectedOrderDetails.customerEmail}</p>}
              <p><strong>Zona de Entrega:</strong> {selectedOrderDetails.deliveryZone}</p>
              <p><strong>Dirección:</strong> {selectedOrderDetails.addressDetail}</p>
              {selectedOrderDetails.notes && <p><strong>Notas:</strong> {selectedOrderDetails.notes}</p>}
            </div>

            {/* Payment Details Box */}
            <div className="bg-[#FEF3C7]/60 p-3 rounded-2xl border border-[#FDE68A] space-y-1.5 text-xs text-[#3E2E22]">
              <p className="font-bold uppercase text-[11px] border-b border-[#FDE68A] pb-1 flex items-center justify-between">
                <span>Información de Pago</span>
                {selectedOrderDetails.paidOnline && (
                  <span className="text-[10px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-md">
                    PAGO EN LÍNEA
                  </span>
                )}
              </p>
              <p><strong>Método:</strong> {selectedOrderDetails.paymentMethod.toUpperCase()}</p>
              {selectedOrderDetails.paymentReference && <p><strong>Referencia / Comprobante:</strong> #{selectedOrderDetails.paymentReference}</p>}
              {selectedOrderDetails.paymentDetails?.payerName && <p><strong>Titular Pagador:</strong> {selectedOrderDetails.paymentDetails.payerName}</p>}
              {selectedOrderDetails.paymentDetails?.bankOrigin && <p><strong>Banco Origen:</strong> {selectedOrderDetails.paymentDetails.bankOrigin}</p>}
              {selectedOrderDetails.paymentDetails?.onlineGatewayTxId && <p><strong>ID Pasarela Online:</strong> {selectedOrderDetails.paymentDetails.onlineGatewayTxId}</p>}
              <p>
                <strong>Estado de Verificación:</strong>{' '}
                <span className={selectedOrderDetails.paymentVerified ? 'text-emerald-700 font-extrabold' : 'text-amber-800 font-bold'}>
                  {selectedOrderDetails.paymentVerified ? '✓ Pago Verificado' : '⏳ Pendiente por Confirmar'}
                </span>
              </p>
            </div>

            <div className="bg-white p-3 rounded-2xl border border-[#E5DED4] space-y-2">
              <p className="text-xs font-bold text-[#3E2E22] uppercase border-b border-[#EFECE6] pb-1">Productos:</p>
              {selectedOrderDetails.items.map((it, i) => (
                <div key={i} className="flex justify-between text-xs text-[#3E2E22]">
                  <span>{it.quantity}x {it.productName}</span>
                  <span className="font-mono font-bold">${it.subtotalUSD.toFixed(2)} USD</span>
                </div>
              ))}
              <div className="pt-2 border-t border-[#EFECE6] flex justify-between font-bold text-sm text-[#3E2E22]">
                <span>Total:</span>
                <span>${selectedOrderDetails.totalUSD.toFixed(2)} USD ({selectedOrderDetails.totalVES.toFixed(2)} Bs.)</span>
              </div>
            </div>

            <button
              onClick={() => {
                onSelectOrderForReceipt(selectedOrderDetails);
                setSelectedOrderDetails(null);
              }}
              className="w-full bg-[#3E2E22] hover:bg-[#5D4636] text-[#FDFBF7] font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <Printer className="w-4 h-4 text-[#D97706]" /> Imprimir Comprobante de Entrega
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
