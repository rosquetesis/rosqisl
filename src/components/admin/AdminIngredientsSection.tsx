import React, { useState } from 'react';
import { Package, Plus, AlertTriangle, DollarSign, Calculator, Trash2, TrendingUp, ChevronDown, X } from 'lucide-react';
import { Ingredient, ProductRecipe } from '../../types';

interface AdminIngredientsSectionProps {
  ingredients: Ingredient[];
  recipes: ProductRecipe[];
  onSaveIngredient: (ingredient: Ingredient) => Promise<void>;
  onDeleteIngredient: (id: string) => Promise<void>;
}

// ─── Recipe Cost Calculator ─────────────────────────────────────────────────
interface RecipeRow {
  ingredientId: string;
  amount: number;
}

const RecipeCostCalculator: React.FC<{ ingredients: Ingredient[] }> = ({ ingredients }) => {
  const [recipeName, setRecipeName] = useState('Docena Tradicional Glaseada');
  const [sellingPriceUSD, setSellingPriceUSD] = useState(4.50);
  const [rows, setRows] = useState<RecipeRow[]>([{ ingredientId: '', amount: 0 }]);

  const addRow = () => setRows(prev => [...prev, { ingredientId: '', amount: 0 }]);
  const removeRow = (idx: number) => setRows(prev => prev.filter((_, i) => i !== idx));
  const updateRow = (idx: number, field: keyof RecipeRow, value: string | number) =>
    setRows(prev => prev.map((r, i) => i === idx ? { ...r, [field]: value } : r));

  // Calculate totals from real ingredient prices
  const lineItems = rows
    .filter(r => r.ingredientId && r.amount > 0)
    .map(r => {
      const ing = ingredients.find(i => i.id === r.ingredientId);
      if (!ing) return null;
      const lineCost = ing.costPerUnitUSD * r.amount;
      return { ing, amount: r.amount, lineCost };
    })
    .filter(Boolean) as { ing: Ingredient; amount: number; lineCost: number }[];

  const totalCostUSD = lineItems.reduce((sum, l) => sum + l.lineCost, 0);
  const profitUSD = sellingPriceUSD - totalCostUSD;
  const marginPct = sellingPriceUSD > 0 ? (profitUSD / sellingPriceUSD) * 100 : 0;
  const isViable = profitUSD > 0;

  return (
    <div className="bg-white p-6 rounded-3xl border border-[#E5DED4] shadow-md space-y-5">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-[#EFECE6] pb-3">
        <Calculator className="w-5 h-5 text-[#D97706]" />
        <h3 className="font-serif text-xl font-bold text-[#3E2E22]">
          Calculadora de Costo de Receta y Margen de Ganancia
        </h3>
      </div>

      {ingredients.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 font-semibold">
          ⚠️ Agrega ingredientes con su costo unitario para usar la calculadora.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Recipe name */}
        <div>
          <label className="block text-xs font-bold text-[#3E2E22] mb-1">Nombre de la Receta / Producto</label>
          <input
            type="text"
            value={recipeName}
            onChange={e => setRecipeName(e.target.value)}
            placeholder="Ej: Docena Tradicional Glaseada"
            className="w-full bg-[#FDFBF7] border border-[#E5DED4] rounded-xl px-3.5 py-2.5 text-xs font-bold text-[#3E2E22] focus:ring-2 focus:ring-[#D97706] focus:outline-none"
          />
        </div>

        {/* Selling price */}
        <div>
          <label className="block text-xs font-bold text-[#3E2E22] mb-1">Precio de Venta al Público (USD)</label>
          <div className="flex items-center border border-[#E5DED4] bg-[#FDFBF7] rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-[#D97706]">
            <span className="px-3 text-xs font-bold text-[#D97706]">$</span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={sellingPriceUSD}
              onChange={e => setSellingPriceUSD(parseFloat(e.target.value) || 0)}
              className="flex-1 bg-transparent py-2.5 pr-3.5 text-xs font-bold text-[#3E2E22] focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Ingredient rows */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-[#3E2E22] uppercase tracking-wider">Ingredientes de la Receta</label>
          <button
            type="button"
            onClick={addRow}
            className="flex items-center gap-1 text-xs font-bold text-[#D97706] hover:text-[#B45309] transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Agregar Ingrediente
          </button>
        </div>

        {/* Column headers */}
        <div className="grid grid-cols-12 gap-2 px-1 text-[10px] font-bold text-[#78604E] uppercase tracking-wider">
          <span className="col-span-5">Ingrediente</span>
          <span className="col-span-3">Cantidad</span>
          <span className="col-span-3 text-right">Costo</span>
          <span className="col-span-1" />
        </div>

        {rows.map((row, idx) => {
          const ing = ingredients.find(i => i.id === row.ingredientId);
          const lineCost = ing ? ing.costPerUnitUSD * row.amount : 0;
          return (
            <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-[#FDFBF7] p-2 rounded-xl border border-[#E5DED4]">
              {/* Ingredient selector */}
              <div className="col-span-5">
                <select
                  value={row.ingredientId}
                  onChange={e => updateRow(idx, 'ingredientId', e.target.value)}
                  className="w-full bg-white border border-[#E5DED4] rounded-lg px-2 py-1.5 text-xs font-bold text-[#3E2E22] focus:ring-1 focus:ring-[#D97706] focus:outline-none cursor-pointer"
                >
                  <option value="">-- Seleccionar --</option>
                  {ingredients.map(i => (
                    <option key={i.id} value={i.id}>
                      {i.name} (${i.costPerUnitUSD.toFixed(2)}/{i.unit})
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount */}
              <div className="col-span-3 flex items-center gap-1">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={row.amount || ''}
                  onChange={e => updateRow(idx, 'amount', parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  className="w-full bg-white border border-[#E5DED4] rounded-lg px-2 py-1.5 text-xs font-bold text-[#3E2E22] focus:ring-1 focus:ring-[#D97706] focus:outline-none"
                />
                {ing && <span className="text-[10px] text-[#78604E] shrink-0">{ing.unit}</span>}
              </div>

              {/* Line cost */}
              <div className="col-span-3 text-right">
                <span className="font-mono font-bold text-xs text-[#3E2E22]">
                  {row.ingredientId && row.amount > 0 ? `$${lineCost.toFixed(4)}` : '—'}
                </span>
              </div>

              {/* Remove */}
              <div className="col-span-1 flex justify-end">
                <button
                  type="button"
                  onClick={() => removeRow(idx)}
                  disabled={rows.length === 1}
                  className="p-1 text-rose-500 hover:text-rose-700 disabled:opacity-30 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Results panel */}
      {lineItems.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-[#EFECE6]">
          {/* Cost breakdown */}
          <div className="sm:col-span-2 bg-[#FDFBF7] p-4 rounded-2xl border border-[#E5DED4] space-y-2">
            <h4 className="text-xs font-bold text-[#3E2E22] uppercase tracking-wider border-b border-[#EFECE6] pb-1.5">
              Desglose de Costos · {recipeName || 'Receta'}
            </h4>
            <div className="space-y-1.5">
              {lineItems.map(({ ing, amount, lineCost }) => (
                <div key={ing.id} className="flex items-center justify-between text-xs">
                  <span className="text-[#3E2E22] font-medium">
                    {ing.name} — <span className="font-mono text-[#78604E]">{amount} {ing.unit} × ${ing.costPerUnitUSD.toFixed(4)}</span>
                  </span>
                  <span className="font-mono font-bold text-[#3E2E22]">${lineCost.toFixed(4)}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between text-xs border-t border-[#E5DED4] pt-2 font-extrabold text-[#3E2E22]">
              <span>Costo Total de Materia Prima</span>
              <span className="font-mono text-base">${totalCostUSD.toFixed(4)} USD</span>
            </div>
          </div>

          {/* Summary KPIs */}
          <div className="space-y-3">
            <div className="bg-[#3E2E22] text-[#FDFBF7] p-4 rounded-2xl space-y-0.5">
              <span className="text-[10px] text-[#FEF3C7]/70 uppercase tracking-wider block">Precio de Venta</span>
              <span className="font-mono font-black text-xl text-amber-400">${sellingPriceUSD.toFixed(2)} USD</span>
            </div>

            <div className={`p-4 rounded-2xl space-y-0.5 ${
              isViable ? 'bg-emerald-50 border border-emerald-200' : 'bg-rose-50 border border-rose-200'
            }`}>
              <span className="text-[10px] font-bold uppercase tracking-wider block text-[#3E2E22]">Ganancia Bruta</span>
              <span className={`font-mono font-black text-xl ${
                isViable ? 'text-emerald-700' : 'text-rose-700'
              }`}>
                {isViable ? '+' : ''}{profitUSD.toFixed(2)} USD
              </span>
            </div>

            <div className={`p-4 rounded-2xl space-y-1 ${
              marginPct >= 50 ? 'bg-emerald-100 border border-emerald-300' :
              marginPct >= 20 ? 'bg-amber-50 border border-amber-200' :
              'bg-rose-50 border border-rose-200'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#3E2E22]">Margen de Ganancia</span>
                <TrendingUp className={`w-4 h-4 ${
                  marginPct >= 50 ? 'text-emerald-600' : marginPct >= 20 ? 'text-amber-600' : 'text-rose-600'
                }`} />
              </div>
              <span className={`font-mono font-black text-2xl ${
                marginPct >= 50 ? 'text-emerald-700' : marginPct >= 20 ? 'text-amber-700' : 'text-rose-700'
              }`}>
                {marginPct.toFixed(1)}%
              </span>
              <p className="text-[10px] text-[#78604E]">
                {marginPct >= 60 ? '✅ Margen excelente' :
                 marginPct >= 40 ? '✅ Margen saludable' :
                 marginPct >= 20 ? '⚠️ Margen ajustado' :
                 isViable ? '⚠️ Margen muy bajo, revisa costos' :
                 '❌ Precio no cubre los costos'}
              </p>
            </div>
          </div>
        </div>
      )}

      {lineItems.length === 0 && ingredients.length > 0 && (
        <div className="text-center text-xs text-[#78604E] py-4">
          Selecciona al menos un ingrediente con cantidad para ver el cálculo.
        </div>
      )}
    </div>
  );
};
// ────────────────────────────────────────────────────────────────────────────

export const AdminIngredientsSection: React.FC<AdminIngredientsSectionProps> = ({
  ingredients,
  recipes,
  onSaveIngredient,
  onDeleteIngredient,
}) => {
  const [selectedIngredient, setSelectedIngredient] = useState<Partial<Ingredient>>({
    name: '',
    category: 'harina',
    stockAmount: 10,
    unit: 'kg',
    minAlertThreshold: 2,
    costPerUnitUSD: 1.00,
  });
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenAdd = () => {
    setSelectedIngredient({
      name: '',
      category: 'harina',
      stockAmount: 10,
      unit: 'kg',
      minAlertThreshold: 2,
      costPerUnitUSD: 1.00,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (ing: Ingredient) => {
    setSelectedIngredient(ing);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIngredient.name) return;
    await onSaveIngredient(selectedIngredient as Ingredient);
    setIsModalOpen(false);
  };

  const handleQuickRestock = async (ing: Ingredient, amountToAdd: number) => {
    const updated = {
      ...ing,
      stockAmount: ing.stockAmount + amountToAdd,
      lastRestocked: new Date().toISOString().split('T')[0],
    };
    await onSaveIngredient(updated);
  };

  return (
    <div className="space-y-8">
      {/* Header & Controls */}
      <div className="bg-white p-6 rounded-3xl border border-[#E5DED4] shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="font-serif text-xl font-bold text-[#3E2E22]">Control de Ingredientes y Materia Prima</h3>
          <p className="text-xs text-[#78604E]">
            Monitorea el inventario de harina, azúcar, anís, limones y empaques para optimizar las compras artesanales.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-2 bg-[#3E2E22] hover:bg-[#5D4636] text-[#FDFBF7] font-bold px-4 py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4 text-[#D97706]" /> Agregar Ingrediente / Materia Prima
        </button>
      </div>

      {/* Ingredient Stock Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {ingredients.map(ing => {
          const isLow = ing.stockAmount <= ing.minAlertThreshold;

          return (
            <div
              key={ing.id}
              className={`p-4 rounded-3xl border flex flex-col justify-between space-y-3 shadow-xs transition-all ${
                isLow ? 'bg-rose-50/80 border-rose-300' : 'bg-white border-[#E5DED4]'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#3E2E22] bg-[#F4EFEA] border border-[#E5DED4] px-2 py-0.5 rounded-md">
                    {ing.category}
                  </span>
                  <h4 className="font-serif font-bold text-[#3E2E22] text-sm mt-1">{ing.name}</h4>
                </div>
                {isLow && (
                  <span className="p-1 rounded-full bg-rose-100 text-rose-700" title="Stock por debajo del mínimo">
                    <AlertTriangle className="w-4 h-4" />
                  </span>
                )}
              </div>

              <div>
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-[#78604E]">Disponible:</span>
                  <span className={`text-2xl font-black font-mono ${isLow ? 'text-rose-800' : 'text-[#3E2E22]'}`}>
                    {ing.stockAmount.toFixed(1)} <span className="text-xs font-normal text-[#78604E]">{ing.unit}</span>
                  </span>
                </div>
                <div className="flex justify-between text-[11px] text-[#78604E] mt-1">
                  <span>Mínimo alerta: {ing.minAlertThreshold} {ing.unit}</span>
                  <span>Costo: ${ing.costPerUnitUSD.toFixed(2)} / {ing.unit}</span>
                </div>
              </div>

              {/* Quick Restock Buttons */}
              <div className="pt-2 border-t border-[#EFECE6] flex items-center justify-between gap-2">
                <button
                  onClick={() => handleQuickRestock(ing, 5)}
                  className="flex-1 bg-[#F4EFEA] hover:bg-[#EFECE6] text-[#3E2E22] border border-[#E5DED4] font-bold py-1 text-[11px] rounded-lg transition-colors cursor-pointer"
                >
                  +5 {ing.unit}
                </button>
                <button
                  onClick={() => handleQuickRestock(ing, 10)}
                  className="flex-1 bg-[#3E2E22] hover:bg-[#5D4636] text-[#FDFBF7] font-bold py-1 text-[11px] rounded-lg transition-colors cursor-pointer"
                >
                  +10 {ing.unit}
                </button>
                <button
                  onClick={() => handleOpenEdit(ing)}
                  className="p-1 text-[#78604E] hover:text-[#3E2E22] font-bold text-xs"
                  title="Editar Ingrediente"
                >
                  ✎
                </button>
                <button
                  onClick={() => onDeleteIngredient(ing.id)}
                  className="p-1 text-rose-600 hover:text-rose-800 font-bold text-xs"
                  title="Eliminar Ingrediente"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recipe Costing Calculator — Fully Interactive */}
      <RecipeCostCalculator ingredients={ingredients} />

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FDFBF7] rounded-3xl max-w-md w-full p-6 space-y-4 border border-[#E5DED4] shadow-2xl">
            <h4 className="font-serif font-bold text-lg text-[#3E2E22]">
              {selectedIngredient.id ? 'Editar Ingrediente' : 'Agregar Nuevo Ingrediente'}
            </h4>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs text-[#3E2E22]">
              <div>
                <label className="block font-bold mb-1">Nombre del Ingrediente *</label>
                <input
                  type="text"
                  required
                  value={selectedIngredient.name}
                  onChange={e => setSelectedIngredient({ ...selectedIngredient, name: e.target.value })}
                  className="w-full bg-white border border-[#E5DED4] rounded-xl p-2.5 font-medium text-[#3E2E22]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold mb-1">Categoría</label>
                  <select
                    value={selectedIngredient.category}
                    onChange={e => setSelectedIngredient({ ...selectedIngredient, category: e.target.value as any })}
                    className="w-full bg-white border border-[#E5DED4] rounded-xl p-2.5 font-medium text-[#3E2E22]"
                  >
                    <option value="harina">Harina</option>
                    <option value="azucar">Azúcar</option>
                    <option value="especias">Especias / Anís</option>
                    <option value="liquidos">Líquidos / Huevos</option>
                    <option value="empaque">Empaques</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold mb-1">Unidad de Medida</label>
                  <input
                    type="text"
                    value={selectedIngredient.unit}
                    onChange={e => setSelectedIngredient({ ...selectedIngredient, unit: e.target.value })}
                    placeholder="kg, litros, unidades..."
                    className="w-full bg-white border border-[#E5DED4] rounded-xl p-2.5 font-medium text-[#3E2E22]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold mb-1">Cantidad en Stock</label>
                  <input
                    type="number"
                    step="0.1"
                    value={selectedIngredient.stockAmount}
                    onChange={e => setSelectedIngredient({ ...selectedIngredient, stockAmount: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-white border border-[#E5DED4] rounded-xl p-2.5 font-bold text-[#3E2E22]"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1">Umbral Mínimo Alerta</label>
                  <input
                    type="number"
                    step="0.1"
                    value={selectedIngredient.minAlertThreshold}
                    onChange={e => setSelectedIngredient({ ...selectedIngredient, minAlertThreshold: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-white border border-[#E5DED4] rounded-xl p-2.5 font-bold text-[#3E2E22]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">Costo Unitario en USD ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={selectedIngredient.costPerUnitUSD}
                  onChange={e => setSelectedIngredient({ ...selectedIngredient, costPerUnitUSD: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-white border border-[#E5DED4] rounded-xl p-2.5 font-bold text-[#3E2E22]"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-[#F4EFEA] text-[#3E2E22] border border-[#E5DED4] font-bold py-2.5 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#3E2E22] text-[#FDFBF7] font-bold py-2.5 rounded-xl hover:bg-[#5D4636] cursor-pointer"
                >
                  Guardar Ingrediente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
