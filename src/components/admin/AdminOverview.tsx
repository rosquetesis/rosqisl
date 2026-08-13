import React from 'react';
import { ShoppingBag, Package, AlertTriangle, Send, Mail, DollarSign, TrendingUp, Users, CheckCircle2, Clock, FileSpreadsheet, Printer, Download, FileText } from 'lucide-react';
import { AdminSettings, Customer, Ingredient, Order, Product } from '../../types';
import { exportToExcel, openPrintableReport } from '../../lib/exportReports';

interface AdminOverviewProps {
  settings: AdminSettings;
  orders: Order[];
  products: Product[];
  ingredients: Ingredient[];
  clients: Customer[];
  onToggleDispatchMode: (mode: 'whatsapp' | 'email' | 'both') => void;
  onNavigateTab: (tab: string) => void;
}

export const AdminOverview: React.FC<AdminOverviewProps> = ({
  settings,
  orders,
  products,
  ingredients,
  clients,
  onToggleDispatchMode,
  onNavigateTab,
}) => {
  const pendingOrders = orders.filter(o => o.status === 'pendiente');
  const activeOrders = orders.filter(o => o.status === 'en_preparacion' || o.status === 'listo');
  const lowIngredients = ingredients.filter(i => i.stockAmount <= i.minAlertThreshold);
  const totalRevenueUSD = orders.reduce((sum, o) => sum + (o.status !== 'cancelado' ? o.totalUSD : 0), 0);
  const totalElaboratedStock = products.reduce((sum, p) => sum + p.stockElaborado, 0);

  return (
    <div className="space-y-8">
      {/* Dispatch Control Banner (Core Requirement) */}
      <div className="bg-[#3E2E22] p-6 rounded-3xl border border-[#5D4636] shadow-lg text-[#FDFBF7]">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              Canal Activo de Recepción de Pedidos
            </span>
            <h3 className="font-serif text-2xl font-bold text-[#FDFBF7]">
              Recepción por: <span className="text-[#FEF3C7] font-extrabold">{settings.dispatchMode === 'email' ? 'Correo Electrónico' : settings.dispatchMode === 'whatsapp' ? 'WhatsApp' : 'Dual (WhatsApp + Correo)'}</span>
            </h3>
            <p className="text-xs text-[#EFECE6]/90 max-w-xl">
              Los clientes enviarán sus pedidos directamente a{' '}
              {settings.dispatchMode === 'email' ? (
                <strong>Correo ({settings.emailRecipient})</strong>
              ) : settings.dispatchMode === 'whatsapp' ? (
                <strong>WhatsApp (+{settings.whatsappNumber})</strong>
              ) : (
                <strong>WhatsApp (+{settings.whatsappNumber}) y Correo ({settings.emailRecipient})</strong>
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onToggleDispatchMode('whatsapp')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
                settings.dispatchMode === 'whatsapp'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-[#4A3728] text-[#FEF3C7] border border-[#5D4636] hover:bg-[#5D4636]'
              }`}
            >
              <Send className="w-4 h-4" /> WhatsApp
            </button>
            <button
              onClick={() => onToggleDispatchMode('email')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
                settings.dispatchMode === 'email'
                  ? 'bg-[#D97706] text-white shadow-md'
                  : 'bg-[#4A3728] text-[#FEF3C7] border border-[#5D4636] hover:bg-[#5D4636]'
              }`}
            >
              <Mail className="w-4 h-4" /> Correo
            </button>
            <button
              onClick={() => onToggleDispatchMode('both')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
                settings.dispatchMode === 'both'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-[#4A3728] text-[#FEF3C7] border border-[#5D4636] hover:bg-[#5D4636]'
              }`}
            >
              ⚡ Ambos
            </button>
          </div>
        </div>
      </div>

      {/* Export Reports Banner Card */}
      <div className="bg-gradient-to-r from-emerald-900 via-[#3E2E22] to-[#4A3728] p-6 rounded-3xl border border-emerald-800/50 shadow-xl text-white">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1">
            <span className="text-xs font-extrabold text-emerald-300 uppercase tracking-widest flex items-center gap-1.5">
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              Centro de Exportación de Informes y Datos
            </span>
            <h3 className="font-serif text-xl font-bold text-white">
              Exportar Reportes de Ventas, Clientes y Productos
            </h3>
            <p className="text-xs text-emerald-100/90 max-w-xl">
              Descarga un libro de Excel (.xlsx) formateado con pestañas independientes o genera un informe en texto enriquecido listo para imprimir / PDF.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => exportToExcel({ orders, clients, products, ingredients, settings })}
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold px-5 py-3 rounded-2xl text-xs flex items-center gap-2 shadow-lg transition-all active:scale-95 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-100" />
              <span>Exportar Libro Excel (.xlsx)</span>
            </button>

            <button
              onClick={() => openPrintableReport({ orders, clients, products, ingredients, settings })}
              className="bg-amber-600 hover:bg-amber-700 text-white font-extrabold px-5 py-3 rounded-2xl text-xs flex items-center gap-2 shadow-lg transition-all active:scale-95 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-amber-100" />
              <span>Informe Imprimible / PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Pending Orders */}
        <div
          onClick={() => onNavigateTab('pedidos')}
          className="bg-white p-5 rounded-3xl border border-[#E5DED4] shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#78604E] uppercase tracking-wider">Pedidos Pendientes</span>
            <div className="w-10 h-10 rounded-2xl bg-[#F4EFEA] text-[#3E2E22] flex items-center justify-center group-hover:scale-110 transition-transform">
              <Clock className="w-5 h-5 text-[#D97706]" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-[#3E2E22] font-serif">{pendingOrders.length}</span>
            <span className="text-xs font-semibold text-[#D97706]">Atender ahora →</span>
          </div>
        </div>

        {/* Finished Stock Ready */}
        <div
          onClick={() => onNavigateTab('inventario')}
          className="bg-white p-5 rounded-3xl border border-[#E5DED4] shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#78604E] uppercase tracking-wider">Rosquetes Listos</span>
            <div className="w-10 h-10 rounded-2xl bg-[#F4EFEA] text-[#3E2E22] flex items-center justify-center group-hover:scale-110 transition-transform">
              <Package className="w-5 h-5 text-[#D97706]" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-[#3E2E22] font-serif">{totalElaboratedStock} u.</span>
            <span className="text-xs font-semibold text-[#D97706]">Ver lotes →</span>
          </div>
        </div>

        {/* Low Ingredient Alerts */}
        <div
          onClick={() => onNavigateTab('ingredientes')}
          className={`p-5 rounded-3xl border shadow-xs hover:shadow-md transition-all cursor-pointer group ${
            lowIngredients.length > 0 ? 'bg-rose-50/50 border-rose-300' : 'bg-white border-[#E5DED4]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#78604E] uppercase tracking-wider">Alertas Ingredientes</span>
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform ${
              lowIngredients.length > 0 ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
            }`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-[#3E2E22] font-serif">
              {lowIngredients.length} <span className="text-xs text-[#78604E] font-sans font-normal">escasos</span>
            </span>
            <span className="text-xs font-semibold text-[#D97706]">Revisar stock →</span>
          </div>
        </div>

        {/* Total Revenue */}
        <div
          onClick={() => onNavigateTab('reportes')}
          className="bg-white p-5 rounded-3xl border border-[#E5DED4] shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#78604E] uppercase tracking-wider">Ventas Totales</span>
            <div className="w-10 h-10 rounded-2xl bg-[#F4EFEA] text-[#3E2E22] flex items-center justify-center group-hover:scale-110 transition-transform">
              <TrendingUp className="w-5 h-5 text-[#D97706]" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-[#3E2E22] font-serif">${totalRevenueUSD.toFixed(2)} USD</span>
            <span className="text-xs font-semibold text-[#D97706]">Informes →</span>
          </div>
        </div>
      </div>

      {/* Quick Recent Orders Table Preview */}
      <div className="bg-white p-6 rounded-3xl border border-[#E5DED4] shadow-md space-y-4">
        <div className="flex items-center justify-between border-b border-[#EFECE6] pb-4">
          <div>
            <h4 className="font-serif text-lg font-bold text-[#3E2E22]">Últimos Pedidos Registrados</h4>
            <p className="text-xs text-[#78604E]">Visualiza los pedidos entrantes desde WhatsApp o la web</p>
          </div>
          <button
            onClick={() => onNavigateTab('pedidos')}
            className="text-xs font-bold text-[#3E2E22] hover:text-[#D97706] bg-[#F4EFEA] px-3 py-1.5 rounded-xl transition-colors border border-[#E5DED4]"
          >
            Ver todos ({orders.length}) →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#3E2E22]">
            <thead>
              <tr className="bg-[#F4EFEA] text-[#78604E] font-bold uppercase text-[10px] border-b border-[#E5DED4]">
                <th className="p-3">N° Pedido</th>
                <th className="p-3">Cliente</th>
                <th className="p-3">Zona (Aragua)</th>
                <th className="p-3">Monto</th>
                <th className="p-3">Método Pago</th>
                <th className="p-3">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5DED4] font-medium">
              {orders.slice(0, 5).map(ord => (
                <tr key={ord.id} className="hover:bg-[#FDFBF7] transition-colors">
                  <td className="p-3 font-mono font-bold text-[#3E2E22]">{ord.orderNumber}</td>
                  <td className="p-3">
                    <div className="font-bold">{ord.customerName}</div>
                    <div className="text-[10px] text-[#78604E]">{ord.customerPhone}</div>
                  </td>
                  <td className="p-3">{ord.deliveryZone}</td>
                  <td className="p-3 font-mono font-bold">${ord.totalUSD.toFixed(2)} USD</td>
                  <td className="p-3 uppercase text-[10px]">{ord.paymentMethod.replace('_', ' ')}</td>
                  <td className="p-3">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                      ord.status === 'pendiente' ? 'bg-[#FEF3C7] text-[#4A3728] border border-[#FDE68A]' :
                      ord.status === 'en_preparacion' ? 'bg-blue-100 text-blue-900 border border-blue-300' :
                      ord.status === 'listo' ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' :
                      ord.status === 'entregado' ? 'bg-purple-100 text-purple-900 border border-purple-300' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {ord.status.replace('_', ' ')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
