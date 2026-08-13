import React, { useState } from 'react';
import { LayoutDashboard, Settings, ShoppingBag, Package, Users, Cookie, BarChart3, LogOut, ArrowLeft, ShieldCheck, FileSpreadsheet, Printer, Cpu } from 'lucide-react';
import { AdminSettings, Customer, Ingredient, MonthlySalesData, Order, OrderStatus, Product, ProductionBatch, ProductRecipe } from '../../types';
import { AdminOverview } from './AdminOverview';
import { AdminSettingsSection } from './AdminSettingsSection';
import { AdminOrdersSection } from './AdminOrdersSection';
import { AdminInventorySection } from './AdminInventorySection';
import { AdminClientsSection } from './AdminClientsSection';
import { AdminIngredientsSection } from './AdminIngredientsSection';
import { AdminSalesReportsSection } from './AdminSalesReportsSection';
import { exportToExcel, openPrintableReport } from '../../lib/exportReports';

interface AdminDashboardProps {
  settings: AdminSettings;
  orders: Order[];
  products: Product[];
  ingredients: Ingredient[];
  recipes: ProductRecipe[];
  clients: Customer[];
  batches: ProductionBatch[];
  salesReports: MonthlySalesData[];
  onSaveSettings: (updated: AdminSettings) => Promise<void>;
  onUpdateOrderStatus: (orderId: string, status: OrderStatus, paymentVerified?: boolean) => Promise<void>;
  onDeleteOrder: (orderId: string) => Promise<void>;
  onRegisterBatch: (productId: string, unitsProduced: number, notes?: string) => Promise<void>;
  onUpdateProductStock: (productId: string, newStock: number) => Promise<void>;
  onSaveProduct?: (product: Product) => Promise<void>;
  onToggleProductPublished?: (productId: string, isPublished: boolean) => Promise<void>;
  onAddClient: (client: Partial<Customer>) => Promise<void>;
  onDeleteClient: (clientId: string) => Promise<void>;
  onSaveIngredient: (ingredient: Ingredient) => Promise<void>;
  onDeleteIngredient: (id: string) => Promise<void>;
  onSelectOrderForReceipt: (order: Order) => void;
  onLogout: () => void;
  onBackToStore: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  settings,
  orders,
  products,
  ingredients,
  recipes,
  clients,
  batches,
  salesReports,
  onSaveSettings,
  onUpdateOrderStatus,
  onDeleteOrder,
  onRegisterBatch,
  onUpdateProductStock,
  onSaveProduct,
  onToggleProductPublished,
  onAddClient,
  onDeleteClient,
  onSaveIngredient,
  onDeleteIngredient,
  onSelectOrderForReceipt,
  onLogout,
  onBackToStore,
}) => {
  const [activeTab, setActiveTab] = useState<string>('overview');

  const navItems = [
    { id: 'overview', label: 'Resumen', shortLabel: 'Resumen', icon: LayoutDashboard },
    { id: 'settings', label: 'Configuración', shortLabel: 'Config.', icon: Settings },
    { id: 'pedidos', label: 'Pedidos', shortLabel: 'Pedidos', icon: ShoppingBag, badge: orders.filter(o => o.status === 'pendiente').length },
    { id: 'inventario', label: 'Inventario', shortLabel: 'Inventario', icon: Package },
    { id: 'clientes', label: 'Clientes', shortLabel: 'Clientes', icon: Users },
    { id: 'ingredientes', label: 'Ingredientes', shortLabel: 'Ingredientes', icon: Cookie },
    { id: 'reportes', label: 'Informes', shortLabel: 'Informes', icon: BarChart3 },
  ];

  const handleToggleDispatchMode = async (mode: 'whatsapp' | 'email' | 'both') => {
    await onSaveSettings({ ...settings, dispatchMode: mode });
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col">
      {/* Top Admin Header */}
      <div className="bg-[#3E2E22] text-[#FDFBF7] border-b border-[#5D4636] px-4 sm:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4 shadow-md">
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={onBackToStore}
            className="flex items-center gap-1.5 bg-[#4A3728] hover:bg-[#5D4636] text-[#FEF3C7] px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Volver a la Tienda
          </button>
          <div className="hidden sm:block h-5 w-px bg-[#5D4636]" />
          <h2 className="font-serif font-bold text-lg text-[#FDFBF7] flex items-center gap-2">
            Panel Super Admin <ShieldCheck className="w-4 h-4 text-amber-400" />
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto mt-2 sm:mt-0 justify-end">
          {/* Quick AI Toggle Control in Header */}
          {false && (
            <button
              type="button"
              onClick={() => onSaveSettings({ ...settings, enableAIReports: !(settings.enableAIReports !== false) })}
              id="header-toggle-ai-btn"
              title="Activar o Desactivar la función de Informes con Inteligencia Artificial"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-sm active:scale-95 border ${
                settings.enableAIReports !== false
                  ? 'bg-amber-500/20 text-amber-200 border-amber-500/50 hover:bg-amber-500/30'
                  : 'bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700'
              }`}
            >
              <Cpu className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">{settings.enableAIReports !== false ? 'IA: Activa' : 'IA: Inactiva'}</span>
            </button>
          )}

          {/* Quick Export Actions in Header */}
          <button
            onClick={() => exportToExcel({ orders, clients, products, ingredients, settings })}
            id="header-export-excel-btn"
            title="Exportar Libro Excel (.xlsx) completo"
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-sm active:scale-95"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
            <span className="hidden md:inline">Exportar Excel</span>
          </button>

          <button
            onClick={() => openPrintableReport({ orders, clients, products, ingredients, settings })}
            id="header-export-pdf-btn"
            title="Generar e Imprimir Informe Ejecutivo en PDF / Texto Enriquecido"
            className="flex items-center gap-1.5 bg-[#D97706] hover:bg-[#B45309] text-white px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-sm active:scale-95"
          >
            <Printer className="w-4 h-4 text-amber-200" />
            <span className="hidden md:inline">Informe PDF</span>
          </button>

          <div className="hidden sm:block h-5 w-px bg-[#5D4636]" />

          <span className="hidden lg:inline-block text-xs font-mono bg-[#4A3728] px-2.5 py-1 rounded-full border border-[#5D4636] text-[#FEF3C7]">
            Aragua • WhatsApp: +{settings.whatsappNumber}
          </span>
          <button
            onClick={onLogout}
            className="flex items-center gap-1 bg-rose-950 hover:bg-rose-900 text-rose-200 border border-rose-800 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" /> Salir
          </button>
        </div>
      </div>

      {/* Main Container with Tab Navigation */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Navigation Tabs Bar — horizontally scrollable on mobile */}
        <div className="overflow-x-auto -mx-1 px-1 pb-1">
          <div className="flex items-center gap-1.5 bg-[#F4EFEA] p-1.5 rounded-2xl border border-[#E5DED4] shadow-xs min-w-max">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-[#3E2E22] text-[#FDFBF7] shadow-md'
                      : 'text-[#3E2E22] hover:bg-[#EFECE6]'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="bg-[#D97706] text-white font-black text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content Panels */}
        <div className="pt-2">
          {activeTab === 'overview' && (
            <AdminOverview
              settings={settings}
              onUpdateSettings={onSaveSettings}
              orders={orders}
              products={products}
              ingredients={ingredients}
              clients={clients}
              onToggleDispatchMode={handleToggleDispatchMode}
              onNavigateTab={tab => setActiveTab(tab)}
            />
          )}

          {activeTab === 'settings' && (
            <AdminSettingsSection
              settings={settings}
              onSaveSettings={onSaveSettings}
            />
          )}

          {activeTab === 'pedidos' && (
            <AdminOrdersSection
              orders={orders}
              onUpdateOrderStatus={onUpdateOrderStatus}
              onDeleteOrder={onDeleteOrder}
              onSelectOrderForReceipt={onSelectOrderForReceipt}
            />
          )}

          {activeTab === 'inventario' && (
            <AdminInventorySection
              products={products}
              batches={batches}
              onRegisterBatch={onRegisterBatch}
              onUpdateProductStock={onUpdateProductStock}
              onSaveProduct={onSaveProduct}
              onToggleProductPublished={onToggleProductPublished}
            />
          )}

          {activeTab === 'clientes' && (
            <AdminClientsSection
              clients={clients}
              onAddClient={onAddClient}
              onDeleteClient={onDeleteClient}
            />
          )}

          {activeTab === 'ingredientes' && (
            <AdminIngredientsSection
              ingredients={ingredients}
              recipes={recipes}
              onSaveIngredient={onSaveIngredient}
              onDeleteIngredient={onDeleteIngredient}
            />
          )}

          {activeTab === 'reportes' && (
            <AdminSalesReportsSection
              salesReports={salesReports}
              exchangeRateVES={settings.exchangeRateVES}
              orders={orders}
              clients={clients}
              products={products}
              ingredients={ingredients}
              settings={settings}
              onUpdateSettings={onSaveSettings}
            />
          )}
        </div>
      </div>
    </div>
  );
};
