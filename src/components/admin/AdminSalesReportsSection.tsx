import React, { useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, AreaChart, Area, Legend } from 'recharts';
import { Sparkles, TrendingUp, DollarSign, Package, AlertTriangle, Lightbulb, RefreshCw, Cpu, FileSpreadsheet, Printer } from 'lucide-react';
import { AIProductionAdvice, MonthlySalesData, AdminSettings, Customer, Ingredient, Order, Product } from '../../types';
import { exportToExcel, openPrintableReport } from '../../lib/exportReports';

interface AdminSalesReportsSectionProps {
  salesReports: MonthlySalesData[];
  exchangeRateVES: number;
  orders?: Order[];
  clients?: Customer[];
  products?: Product[];
  ingredients?: Ingredient[];
  settings?: AdminSettings;
}

export const AdminSalesReportsSection: React.FC<AdminSalesReportsSectionProps> = ({
  salesReports,
  exchangeRateVES,
  orders = [],
  clients = [],
  products = [],
  ingredients = [],
  settings = { storeName: 'Rosquetes Canarios', storeTagline: '', exchangeRateVES: 68.50, whatsappNumber: '' } as unknown as AdminSettings,
}) => {
  const [aiAdvice, setAiAdvice] = useState<AIProductionAdvice | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [aiError, setAiError] = useState('');

  const fetchAiProductionAdvice = async () => {
    setIsLoadingAi(true);
    setAiError('');
    try {
      const res = await fetch('/api/ai/production-advice', { method: 'POST' });
      if (!res.ok) {
        throw new Error('Error al consultar el Asistente de IA');
      }
      const data = await res.json();
      setAiAdvice(data);
    } catch (err: any) {
      setAiError(err.message || 'Error cargando informe de IA');
    } finally {
      setIsLoadingAi(false);
    }
  };

  const chartData = salesReports.map(sr => ({
    name: sr.month,
    USD: sr.totalRevenueUSD,
    Docenas: sr.docenasSold,
    Pedidos: sr.totalOrdersCount,
  }));

  const totalUSDAccum = salesReports.reduce((sum, r) => sum + r.totalRevenueUSD, 0);
  const totalDocenasAccum = salesReports.reduce((sum, r) => sum + r.docenasSold, 0);

  return (
    <div className="space-y-8">
      {/* AI Production Assistant Header Banner */}
      <div className="bg-[#3E2E22] p-6 rounded-3xl border border-[#5D4636] shadow-xl text-[#FDFBF7] relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 bg-[#5D4636] border border-[#78604E] px-3 py-1 rounded-full text-xs font-bold text-[#FEF3C7]">
              <Sparkles className="w-4 h-4 text-[#D97706]" />
              Asistente Inteligente de Producción Artesanal (Gemini AI)
            </span>
            <h3 className="font-serif text-2xl font-bold text-[#FDFBF7]">
              Optimización de Hornada & Control de Insumos
            </h3>
            <p className="text-xs text-[#EFECE6] max-w-2xl leading-relaxed">
              Analiza las tendencias de ventas en Aragua, calcula la materia prima requerida y genera recomendaciones automáticas para maximizar la rentabilidad y evitar el desperdicio.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => exportToExcel({ orders, clients, products, ingredients, settings })}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-4 py-3 rounded-2xl text-xs shadow-lg transition-all active:scale-95 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
              <span>Exportar Excel</span>
            </button>

            <button
              onClick={() => openPrintableReport({ orders, clients, products, ingredients, settings })}
              className="flex items-center gap-1.5 bg-[#B45309] hover:bg-[#92400e] text-white font-extrabold px-4 py-3 rounded-2xl text-xs shadow-lg transition-all active:scale-95 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-amber-200" />
              <span>Informe PDF</span>
            </button>

            <button
              onClick={fetchAiProductionAdvice}
              disabled={isLoadingAi}
              className="flex items-center gap-2 bg-[#D97706] hover:bg-[#B45309] text-white font-extrabold px-5 py-3 rounded-2xl text-xs shadow-xl transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <Cpu className="w-4 h-4 text-white" />
              <span>{isLoadingAi ? 'Analizando...' : 'Informe IA'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* AI Analysis Output Display */}
      {aiError && (
        <div className="bg-rose-100 border border-rose-300 text-rose-950 p-4 rounded-2xl text-xs font-bold">
          ⚠️ {aiError}
        </div>
      )}

      {aiAdvice && (
        <div className="bg-[#F4EFEA] border-2 border-[#E5DED4] p-6 rounded-3xl space-y-6 animate-in fade-in">
          <div className="flex items-center gap-2 border-b border-[#E5DED4] pb-3">
            <Sparkles className="w-5 h-5 text-[#D97706]" />
            <h4 className="font-serif font-bold text-lg text-[#3E2E22]">
              Diagnóstico de Producción Artesanal Sugerido
            </h4>
          </div>

          <p className="text-xs font-semibold text-[#3E2E22] bg-white p-3.5 rounded-xl border border-[#E5DED4]">
            {aiAdvice.summary}
          </p>

          {/* Recommended Batches */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-[#E5DED4] space-y-3">
              <h5 className="font-bold text-xs text-[#3E2E22] uppercase border-b border-[#EFECE6] pb-2 flex items-center justify-between">
                <span>Lotes Recomendados a Hornear</span>
                <Package className="w-4 h-4 text-[#D97706]" />
              </h5>
              <div className="space-y-2">
                {aiAdvice.recommendedBatches.map((batch, idx) => (
                  <div key={idx} className="bg-[#FDFBF7] border border-[#E5DED4] p-2.5 rounded-xl text-xs flex items-center justify-between">
                    <div>
                      <p className="font-bold text-[#3E2E22]">{batch.productName}</p>
                      <p className="text-[11px] text-[#78604E]">{batch.reason}</p>
                    </div>
                    <span className="font-mono font-extrabold text-[#3E2E22] bg-[#F4EFEA] border border-[#E5DED4] px-2 py-1 rounded-lg">
                      {batch.quantityToMake} u.
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Ingredient Shortage Alerts */}
            <div className="bg-white p-4 rounded-2xl border border-[#E5DED4] space-y-3">
              <h5 className="font-bold text-xs text-[#3E2E22] uppercase border-b border-[#EFECE6] pb-2 flex items-center justify-between">
                <span>Ingredientes Requeridos / Escasos</span>
                <AlertTriangle className="w-4 h-4 text-rose-600" />
              </h5>
              <div className="space-y-2">
                {aiAdvice.ingredientReorderAlerts.length === 0 ? (
                  <p className="text-xs text-emerald-800 font-bold">✓ Tienes stock suficiente de materia prima.</p>
                ) : (
                  aiAdvice.ingredientReorderAlerts.map((alert, idx) => (
                    <div key={idx} className="bg-rose-50 p-2.5 rounded-xl text-xs flex items-center justify-between border border-rose-200">
                      <div>
                        <p className="font-bold text-rose-950">{alert.ingredientName}</p>
                        <p className="text-[11px] text-rose-800">Actual: {alert.currentStock} → Requerido: {alert.neededStock}</p>
                      </div>
                      <span className="font-mono font-bold text-rose-900 bg-rose-200 px-2 py-1 rounded-lg text-[11px]">
                        {alert.shortage} (${alert.estimatedCostUSD.toFixed(2)})
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Profit Tips */}
          <div className="bg-white p-4 rounded-2xl border border-[#E5DED4] space-y-2">
            <h5 className="font-bold text-xs text-[#3E2E22] uppercase flex items-center gap-1.5">
              <Lightbulb className="w-4 h-4 text-[#D97706]" /> Tips de Rentabilidad para Aragua
            </h5>
            <ul className="list-disc list-inside text-xs text-[#78604E] space-y-1">
              {aiAdvice.profitOptimizationTips.map((tip, idx) => (
                <li key={idx}>{tip}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Monthly Sales Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-3xl border border-[#E5DED4] shadow-sm space-y-1">
          <span className="text-xs font-bold text-[#78604E] uppercase">Ingresos Acumulados</span>
          <p className="text-3xl font-extrabold text-[#3E2E22] font-serif">${totalUSDAccum.toFixed(2)} USD</p>
          <p className="text-xs font-mono font-bold text-[#78604E]">
            ({(totalUSDAccum * exchangeRateVES).toFixed(2)} Bs.)
          </p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-[#E5DED4] shadow-sm space-y-1">
          <span className="text-xs font-bold text-[#78604E] uppercase">Docenas Vendidas</span>
          <p className="text-3xl font-extrabold text-[#3E2E22] font-serif">{totalDocenasAccum} docenas</p>
          <p className="text-xs text-[#78604E]">Aproximadamente {totalDocenasAccum * 12} rosquetes elaborados</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-[#E5DED4] shadow-sm space-y-1">
          <span className="text-xs font-bold text-[#78604E] uppercase">Municipio Principal</span>
          <p className="text-3xl font-extrabold text-[#3E2E22] font-serif">Maracay</p>
          <p className="text-xs text-[#78604E]">Seguido por Turmero y El Limón</p>
        </div>
      </div>

      {/* Monthly Sales Recharts Graph */}
      <div className="bg-white p-6 rounded-3xl border border-[#E5DED4] shadow-md space-y-6">
        <div className="flex items-center justify-between border-b border-[#EFECE6] pb-3">
          <div>
            <h3 className="font-serif text-xl font-bold text-[#3E2E22]">
              Evolución Mensual de Ventas ($ USD)
            </h3>
            <p className="text-xs text-[#78604E]">Comportamiento del mercado durante los últimos meses en Aragua</p>
          </div>
          <TrendingUp className="w-5 h-5 text-[#D97706]" />
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5DED4" />
              <XAxis dataKey="name" stroke="#3E2E22" fontSize={11} fontWeight="bold" />
              <YAxis stroke="#3E2E22" fontSize={11} />
              <Tooltip
                contentStyle={{ backgroundColor: '#FDFBF7', borderColor: '#E5DED4', borderRadius: '12px', fontSize: '12px', color: '#3E2E22' }}
              />
              <Legend />
              <Bar dataKey="USD" fill="#3E2E22" radius={[8, 8, 0, 0]} name="Ingresos ($ USD)" />
              <Bar dataKey="Docenas" fill="#D97706" radius={[8, 8, 0, 0]} name="Docenas Vendidas" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Demand Distribution by Municipality in Aragua */}
      <div className="bg-white p-6 rounded-3xl border border-[#E5DED4] shadow-md space-y-4">
        <h3 className="font-serif text-xl font-bold text-[#3E2E22] border-b border-[#EFECE6] pb-3">
          Distribución Geográfica de Pedidos en Aragua
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-semibold">
          <div className="bg-[#FDFBF7] p-4 rounded-2xl border border-[#E5DED4] space-y-1">
            <span className="text-[#78604E] font-bold block">1. Maracay (Base Aragua / Delicias / Centro)</span>
            <span className="text-xl font-extrabold text-[#3E2E22] font-mono">54% de las ventas</span>
            <p className="text-[11px] text-[#78604E]">Mayor demanda de Cajas Regalo y Docenas Glaseadas</p>
          </div>

          <div className="bg-[#FDFBF7] p-4 rounded-2xl border border-[#E5DED4] space-y-1">
            <span className="text-[#78604E] font-bold block">2. Turmero & Cagua</span>
            <span className="text-xl font-extrabold text-[#3E2E22] font-mono">28% de las ventas</span>
            <p className="text-[11px] text-[#78604E]">Alta preferencia en pedidos familiares del fin de semana</p>
          </div>

          <div className="bg-[#FDFBF7] p-4 rounded-2xl border border-[#E5DED4] space-y-1">
            <span className="text-[#78604E] font-bold block">3. El Limón & La Victoria</span>
            <span className="text-xl font-extrabold text-[#3E2E22] font-mono">18% de las ventas</span>
            <p className="text-[11px] text-[#78604E]">Puntos de reventa en panaderías y dulcerías locales</p>
          </div>
        </div>
      </div>
    </div>
  );
};
