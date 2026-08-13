import React, { useState } from 'react';
import { Package, Plus, AlertTriangle, RefreshCw, DollarSign, Calculator, Trash2 } from 'lucide-react';
import { Ingredient, ProductRecipe } from '../../types';

interface AdminIngredientsSectionProps {
  ingredients: Ingredient[];
  recipes: ProductRecipe[];
  onSaveIngredient: (ingredient: Ingredient) => Promise<void>;
  onDeleteIngredient: (id: string) => Promise<void>;
}

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

      {/* Recipe Costing Calculator Breakdown */}
      <div className="bg-white p-6 rounded-3xl border border-[#E5DED4] shadow-md space-y-4">
        <div className="flex items-center gap-2 border-b border-[#EFECE6] pb-3">
          <Calculator className="w-5 h-5 text-[#D97706]" />
          <h3 className="font-serif text-xl font-bold text-[#3E2E22]">
            Calculadora de Costo de Receta y Margen de Ganancia
          </h3>
        </div>

        <div className="bg-[#FDFBF7] p-4 rounded-2xl border border-[#E5DED4] space-y-3">
          <p className="text-xs text-[#3E2E22] font-medium">
            <strong>Ejemplo: Docena Tradicional Glaseada</strong> — Cálculo estimado de materia prima requerida por cada docena horneada:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-white p-2.5 rounded-xl border border-[#E5DED4]">
              <span className="text-[#78604E] font-bold block">Harina de Trigo</span>
              <span className="font-mono text-[#3E2E22]">350g → $0.42 USD</span>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-[#E5DED4]">
              <span className="text-[#78604E] font-bold block">Azúcar & Anís Dulce</span>
              <span className="font-mono text-[#3E2E22]">200g + 20g → $0.35 USD</span>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-[#E5DED4]">
              <span className="text-[#78604E] font-bold block">Huevos & Aceite/Limón</span>
              <span className="font-mono text-[#3E2E22]">2 u. + 80ml → $0.38 USD</span>
            </div>
            <div className="bg-[#3E2E22] text-[#FDFBF7] p-2.5 rounded-xl font-bold">
              <span className="text-[#FEF3C7] text-[10px] uppercase block">Costo Total Receta</span>
              <span className="font-mono text-base">$1.15 USD / docena</span>
            </div>
          </div>
          <p className="text-[11px] text-emerald-800 font-bold">
            💡 Precio de Venta: $4.50 USD → Margen de Ganancia Bruta por Docena: ~74.4% ($3.35 USD)
          </p>
        </div>
      </div>

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
