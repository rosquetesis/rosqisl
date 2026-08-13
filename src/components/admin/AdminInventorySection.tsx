import React, { useState } from 'react';
import { Package, Plus, Flame, CheckCircle2, AlertCircle, Clock, Eye, EyeOff, Edit3, PlusCircle, Sparkles, Check, X, Image as ImageIcon, Upload } from 'lucide-react';
import { Product, ProductionBatch } from '../../types';

interface AdminInventorySectionProps {
  products: Product[];
  batches: ProductionBatch[];
  onRegisterBatch: (productId: string, unitsProduced: number, notes?: string) => Promise<void>;
  onUpdateProductStock: (productId: string, newStock: number) => Promise<void>;
  onSaveProduct?: (product: Product) => Promise<void>;
  onToggleProductPublished?: (productId: string, isPublished: boolean) => Promise<void>;
}

export const AdminInventorySection: React.FC<AdminInventorySectionProps> = ({
  products,
  batches,
  onRegisterBatch,
  onUpdateProductStock,
  onSaveProduct,
  onToggleProductPublished,
}) => {
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || '');
  const [unitsToMake, setUnitsToMake] = useState<number>(20);
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Visibility Filter state
  const [filterVisibility, setFilterVisibility] = useState<'todos' | 'publicados' | 'despublicados'>('todos');

  // Product Edit Modal state
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isNewProductModalOpen, setIsNewProductModalOpen] = useState(false);

  // Form state for creating/editing product
  const [productForm, setProductForm] = useState<Partial<Product>>({
    name: '',
    description: '',
    priceUSD: 4.00,
    unitType: 'Docena (12 u.)',
    category: 'tradicional',
    stockElaborado: 20,
    image: '/src/assets/images/rosquetes_glaseados_islenos_1786561725949.jpg',
    isPublished: true,
  });

  const handleBatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || unitsToMake <= 0) return;

    setIsSubmitting(true);
    setSuccessMessage('');
    try {
      await onRegisterBatch(selectedProductId, unitsToMake, notes);
      setSuccessMessage('¡Lote horneado registrado con éxito! El inventario listo fue actualizado.');
      setNotes('');
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTogglePublish = async (prod: Product) => {
    const nextPublishedState = !(prod.isPublished !== false);
    if (onToggleProductPublished) {
      await onToggleProductPublished(prod.id, nextPublishedState);
    } else if (onSaveProduct) {
      await onSaveProduct({ ...prod, isPublished: nextPublishedState });
    }
    setSuccessMessage(`Producto "${prod.name}" ${nextPublishedState ? 'PUBLICADO en la tienda' : 'DESPUBLICADO (oculto en la tienda)'}.`);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleOpenEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    setProductForm({ ...prod });
    setIsNewProductModalOpen(true);
  };

  const handleOpenCreateProduct = () => {
    setEditingProduct(null);
    setProductForm({
      id: `prod-${Date.now()}`,
      name: '',
      description: '',
      priceUSD: 4.50,
      unitType: 'Docena (12 u.)',
      category: 'tradicional',
      stockElaborado: 20,
      image: '/src/assets/images/rosquetes_glaseados_islenos_1786561725949.jpg',
      isPublished: true,
    });
    setIsNewProductModalOpen(true);
  };

  const handleSaveProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name || !productForm.priceUSD) return;

    const fullProduct: Product = {
      id: productForm.id || `prod-${Date.now()}`,
      name: productForm.name,
      description: productForm.description || '',
      priceUSD: Number(productForm.priceUSD),
      unitType: productForm.unitType || 'Docena (12 u.)',
      category: (productForm.category as any) || 'tradicional',
      stockElaborado: Number(productForm.stockElaborado || 0),
      image: productForm.image || '/src/assets/images/rosquetes_glaseados_islenos_1786561725949.jpg',
      isPublished: productForm.isPublished ?? true,
    };

    if (onSaveProduct) {
      await onSaveProduct(fullProduct);
    }

    setIsNewProductModalOpen(false);
    setSuccessMessage(`¡Producto "${fullProduct.name}" guardado exitosamente!`);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  // Filtered list according to tab filter
  const publishedCount = products.filter(p => p.isPublished !== false).length;
  const unpublishedCount = products.filter(p => p.isPublished === false).length;

  const filteredProducts = products.filter(p => {
    if (filterVisibility === 'publicados') return p.isPublished !== false;
    if (filterVisibility === 'despublicados') return p.isPublished === false;
    return true;
  });

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Top Banner Notice */}
      {successMessage && (
        <div className="bg-emerald-100 border border-emerald-300 text-emerald-950 p-4 rounded-2xl flex items-center gap-3 text-xs font-bold animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* 1. PUBLICACIÓN Y GESTIÓN DE PRODUCTOS DEL CATÁLOGO */}
      <div className="bg-white p-6 rounded-3xl border border-[#E5DED4] shadow-md space-y-6">
        <div className="border-b border-[#EFECE6] pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-[#3E2E22] uppercase tracking-widest bg-[#F4EFEA] px-2.5 py-0.5 rounded-md border border-[#E5DED4]">
              Publicación y Catálogo
            </span>
            <h3 className="font-serif text-xl font-bold text-[#3E2E22] mt-1 flex items-center gap-2">
              <Package className="w-5 h-5 text-[#D97706]" />
              <span>Gestión de Productos (Publicar y Despublicar)</span>
            </h3>
            <p className="text-xs text-[#78604E] mt-0.5">
              Haz clic en el interruptor de cada producto para **Publicarlo** o **Despublicarlo (Ocultarlo)** instantáneamente en la tienda pública.
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenCreateProduct}
            className="flex items-center gap-2 bg-[#D97706] hover:bg-[#B45309] text-white px-4 py-2.5 rounded-xl text-xs font-extrabold shadow-md transition-all cursor-pointer self-start md:self-auto"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Crear Nuevo Producto</span>
          </button>
        </div>

        {/* Filter Tabs (Todos, Publicados, Despublicados) */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setFilterVisibility('todos')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterVisibility === 'todos'
                ? 'bg-[#3E2E22] text-white shadow-sm'
                : 'bg-[#F4EFEA] text-[#3E2E22] hover:bg-[#EFECE6] border border-[#E5DED4]'
            }`}
          >
            Todos ({products.length})
          </button>

          <button
            type="button"
            onClick={() => setFilterVisibility('publicados')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              filterVisibility === 'publicados'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'bg-emerald-50 text-emerald-900 border border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            <Eye className="w-3.5 h-3.5 text-emerald-600" />
            <span>Publicados en Tienda ({publishedCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setFilterVisibility('despublicados')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              filterVisibility === 'despublicados'
                ? 'bg-amber-800 text-white shadow-sm'
                : 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100'
            }`}
          >
            <EyeOff className="w-3.5 h-3.5 text-amber-600" />
            <span>Despublicados / Ocultos ({unpublishedCount})</span>
          </button>
        </div>

        {/* Products Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProducts.map(prod => {
            const isPub = prod.isPublished !== false;

            return (
              <div
                key={prod.id}
                className={`bg-[#FDFBF7] p-4 rounded-2xl border-2 transition-all flex flex-col justify-between space-y-4 ${
                  isPub
                    ? 'border-[#E5DED4] hover:border-[#D97706]'
                    : 'border-amber-300/80 bg-amber-50/30'
                }`}
              >
                {/* Header with image, badge and edit */}
                <div className="space-y-3">
                  <div className="relative h-36 rounded-xl overflow-hidden bg-[#EFECE6] border border-[#E5DED4]">
                    <img
                      src={prod.image}
                      alt={prod.name}
                      className={`w-full h-full object-cover transition-all ${
                        !isPub ? 'grayscale opacity-60' : ''
                      }`}
                    />

                    {/* Status Badge */}
                    <div className="absolute top-2 left-2">
                      {isPub ? (
                        <span className="bg-emerald-600 text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-lg shadow-md flex items-center gap-1">
                          <Eye className="w-3 h-3" /> Publicado
                        </span>
                      ) : (
                        <span className="bg-amber-800 text-amber-100 text-[10px] font-black uppercase px-2.5 py-1 rounded-lg shadow-md flex items-center gap-1">
                          <EyeOff className="w-3 h-3" /> Oculto (Despublicado)
                        </span>
                      )}
                    </div>

                    {/* Edit button */}
                    <button
                      type="button"
                      onClick={() => handleOpenEditProduct(prod)}
                      className="absolute top-2 right-2 bg-white/90 hover:bg-white text-[#3E2E22] p-1.5 rounded-lg shadow-md transition-all cursor-pointer"
                      title="Editar detalles del producto"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Title and price */}
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-serif font-bold text-sm text-[#3E2E22] leading-tight">
                        {prod.name}
                      </h4>
                      <span className="text-sm font-black font-mono text-[#D97706]">
                        ${prod.priceUSD.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#78604E] line-clamp-2 mt-1">
                      {prod.description}
                    </p>
                    <span className="inline-block mt-1 text-[10px] font-mono text-[#78604E] bg-[#EFECE6] px-2 py-0.5 rounded-md">
                      {prod.unitType}
                    </span>
                  </div>
                </div>

                {/* Bottom Controls: Switch Publish & Update Stock */}
                <div className="pt-3 border-t border-[#E5DED4] space-y-2">
                  {/* Publicar / Despublicar Toggle Switch */}
                  <div className="flex items-center justify-between bg-white p-2 rounded-xl border border-[#E5DED4]">
                    <span className="text-[11px] font-bold text-[#3E2E22] flex items-center gap-1">
                      {isPub ? <Eye className="w-3.5 h-3.5 text-emerald-600" /> : <EyeOff className="w-3.5 h-3.5 text-amber-600" />}
                      <span>Visibilidad en Tienda:</span>
                    </span>

                    <button
                      type="button"
                      onClick={() => handleTogglePublish(prod)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        isPub ? 'bg-emerald-600' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          isPub ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Stock Input */}
                  <div className="flex items-center justify-between text-xs font-bold text-[#78604E]">
                    <span>Stock Disponible:</span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        value={prod.stockElaborado}
                        onChange={e => onUpdateProductStock(prod.id, parseInt(e.target.value) || 0)}
                        className="w-16 bg-white border border-[#E5DED4] rounded-lg px-2 py-1 text-xs font-bold text-center font-mono text-[#3E2E22]"
                      />
                      <span className="text-[#3E2E22]">u.</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. CONTROL DE HORNEADO Y BATCHES */}
      <div className="bg-white p-6 rounded-3xl border border-[#E5DED4] shadow-md space-y-5">
        <div className="border-b border-[#EFECE6] pb-3 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-[#3E2E22] uppercase tracking-widest bg-[#F4EFEA] px-2.5 py-0.5 rounded-md border border-[#E5DED4]">
              Control de Horneado
            </span>
            <h3 className="font-serif text-xl font-bold text-[#3E2E22] mt-1">
              Registrar Nuevo Lote de Producto Elaborado
            </h3>
          </div>
          <Flame className="w-6 h-6 text-[#D97706] animate-pulse" />
        </div>

        <form onSubmit={handleBatchSubmit} className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
          <div className="sm:col-span-5">
            <label className="block text-xs font-bold text-[#3E2E22] mb-1">Seleccionar Presentación de Rosquetes</label>
            <select
              value={selectedProductId}
              onChange={e => setSelectedProductId(e.target.value)}
              className="w-full bg-[#FDFBF7] border border-[#E5DED4] rounded-xl p-2.5 text-xs font-bold text-[#3E2E22]"
            >
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.unitType}) — Stock: {p.stockElaborado} u.
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-3">
            <label className="block text-xs font-bold text-[#3E2E22] mb-1">Cantidad Horneada (Unidades)</label>
            <input
              type="number"
              min="1"
              value={unitsToMake}
              onChange={e => setUnitsToMake(parseInt(e.target.value) || 1)}
              className="w-full bg-[#FDFBF7] border border-[#E5DED4] rounded-xl px-3 py-2.5 text-xs font-black text-[#3E2E22]"
            />
          </div>

          <div className="sm:col-span-4">
            <label className="block text-xs font-bold text-[#3E2E22] mb-1">Notas del Lote / Calidad</label>
            <input
              type="text"
              placeholder="Ej: Glaseado de limón con anís dulce recién molido"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full bg-[#FDFBF7] border border-[#E5DED4] rounded-xl px-3 py-2.5 text-xs font-medium text-[#3E2E22]"
            />
          </div>

          <div className="sm:col-span-12 text-right">
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#3E2E22] hover:bg-[#5D4636] text-[#FDFBF7] font-bold px-6 py-2.5 rounded-xl text-xs flex items-center gap-2 ml-auto shadow-md transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#D97706]" />
              <span>{isSubmitting ? 'Procesando Lote...' : 'Registrar Horneado e Incrementar Inventario'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* 3. HISTORIAL DE LOTES HORNEADOS */}
      <div className="bg-white rounded-3xl border border-[#E5DED4] shadow-md overflow-hidden p-6 space-y-4">
        <h3 className="font-serif text-xl font-bold text-[#3E2E22] border-b border-[#EFECE6] pb-3">
          Historial de Lotes Horneados
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#3E2E22]">
            <thead>
              <tr className="bg-[#3E2E22] text-[#FDFBF7] font-bold uppercase text-[10px]">
                <th className="p-3">N° Lote</th>
                <th className="p-3">Fecha</th>
                <th className="p-3">Producto</th>
                <th className="p-3">Unidades Elaboradas</th>
                <th className="p-3">Costo Est. Materia Prima</th>
                <th className="p-3">Notas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5DED4] font-medium">
              {batches.length === 0 ? (
                <tr><td colSpan={6} className="p-4 text-center text-[#78604E]">Sin lotes registrados</td></tr>
              ) : (
                batches.map(bat => (
                  <tr key={bat.id} className="hover:bg-[#FDFBF7]">
                    <td className="p-3 font-mono font-bold text-[#3E2E22]">{bat.batchNumber}</td>
                    <td className="p-3">{bat.date}</td>
                    <td className="p-3 font-bold">{bat.productName}</td>
                    <td className="p-3 font-mono font-bold text-[#3E2E22]">{bat.unitsProduced} u.</td>
                    <td className="p-3 font-mono">${bat.costTotalUSD.toFixed(2)} USD</td>
                    <td className="p-3 text-[#78604E]">{bat.notes || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE / EDIT PRODUCT MODAL */}
      {isNewProductModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-xl w-full rounded-3xl p-6 shadow-2xl border border-[#E5DED4] space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#EFECE6] pb-3">
              <h3 className="font-serif text-lg font-bold text-[#3E2E22] flex items-center gap-2">
                <Package className="w-5 h-5 text-[#D97706]" />
                <span>{editingProduct ? 'Editar Producto del Catálogo' : 'Crear Nuevo Producto'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsNewProductModalOpen(false)}
                className="p-1 hover:bg-[#F4EFEA] rounded-full text-[#3E2E22]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProductSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#3E2E22] mb-1">Nombre del Producto *</label>
                <input
                  type="text"
                  required
                  value={productForm.name || ''}
                  onChange={e => setProductForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ej: Rosquetes Glaseados Especiales"
                  className="w-full bg-[#FDFBF7] border border-[#E5DED4] rounded-xl px-3 py-2 text-xs font-bold text-[#3E2E22]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#3E2E22] mb-1">Descripción</label>
                <textarea
                  rows={3}
                  value={productForm.description || ''}
                  onChange={e => setProductForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descripción artesanal del producto para los clientes..."
                  className="w-full bg-[#FDFBF7] border border-[#E5DED4] rounded-xl p-3 text-xs text-[#3E2E22]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#3E2E22] mb-1">Precio ($ USD) *</label>
                  <input
                    type="number"
                    step="0.10"
                    required
                    value={productForm.priceUSD || ''}
                    onChange={e => setProductForm(prev => ({ ...prev, priceUSD: parseFloat(e.target.value) || 0 }))}
                    className="w-full bg-[#FDFBF7] border border-[#E5DED4] rounded-xl px-3 py-2 text-xs font-bold text-[#3E2E22]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#3E2E22] mb-1">Unidad / Presentación</label>
                  <input
                    type="text"
                    value={productForm.unitType || ''}
                    onChange={e => setProductForm(prev => ({ ...prev, unitType: e.target.value }))}
                    placeholder="Docena (12 u.)"
                    className="w-full bg-[#FDFBF7] border border-[#E5DED4] rounded-xl px-3 py-2 text-xs text-[#3E2E22]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#3E2E22] mb-1">Categoría</label>
                  <select
                    value={productForm.category || 'tradicional'}
                    onChange={e => setProductForm(prev => ({ ...prev, category: e.target.value as any }))}
                    className="w-full bg-[#FDFBF7] border border-[#E5DED4] rounded-xl p-2 text-xs font-bold text-[#3E2E22]"
                  >
                    <option value="tradicional">Tradicional</option>
                    <option value="mini">Mini Rosqueticos</option>
                    <option value="regalo">Caja Regalo</option>
                    <option value="especial">Especial</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#3E2E22] mb-1">Stock Inicial Elaborado</label>
                  <input
                    type="number"
                    value={productForm.stockElaborado || 0}
                    onChange={e => setProductForm(prev => ({ ...prev, stockElaborado: parseInt(e.target.value) || 0 }))}
                    className="w-full bg-[#FDFBF7] border border-[#E5DED4] rounded-xl px-3 py-2 text-xs font-mono font-bold text-[#3E2E22]"
                  />
                </div>
              </div>

              {/* Imagen del Producto con Carga de Archivo, Galería y URL */}
              <div className="space-y-2 bg-[#FDFBF7] p-3.5 rounded-2xl border border-[#E5DED4]">
                <label className="block text-xs font-bold text-[#3E2E22] flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-[#D97706]" />
                    <span>Imagen del Producto</span>
                  </span>
                  <span className="text-[10px] text-[#78604E] font-normal">Sube desde tu dispositivo o elige de la galería</span>
                </label>

                {/* Previsualización de Imagen Actual */}
                {productForm.image && (
                  <div className="relative h-28 rounded-xl overflow-hidden border border-[#E5DED4] bg-white group">
                    <img
                      src={productForm.image}
                      alt="Vista previa del producto"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <span className="text-white text-[10px] font-bold bg-black/60 px-2 py-1 rounded-md">
                        Imagen Seleccionada
                      </span>
                    </div>
                  </div>
                )}

                {/* Botón de Cargar Archivo Local desde Dispositivo */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <label className="flex items-center justify-center gap-2 bg-white hover:bg-[#F4EFEA] text-[#3E2E22] border-2 border-dashed border-[#D97706] hover:border-[#B45309] p-2.5 rounded-xl text-xs font-bold cursor-pointer transition-all shadow-xs text-center">
                    <Upload className="w-4 h-4 text-[#D97706]" />
                    <span>Subir de tu Equipo</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            if (reader.result) {
                              setProductForm(prev => ({ ...prev, image: reader.result as string }));
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>

                  <div className="text-[10px] text-[#78604E] flex items-center p-2 bg-white/70 rounded-xl border border-[#E5DED4]">
                    <span>Formatos aceptados: JPG, PNG, WEBP. Convertido en tiempo real para vista previa instantánea.</span>
                  </div>
                </div>

                {/* Galería de Galletas / Preset Images */}
                <div className="pt-2 border-t border-[#E5DED4]/60">
                  <span className="text-[11px] font-bold text-[#3E2E22] block mb-1.5">
                    O selecciona una foto de la Galería de la Casa:
                  </span>
                  <div className="grid grid-cols-5 gap-1.5">
                    {[
                      { label: 'Glaseado Isleño', url: '/src/assets/images/rosquetes_glaseados_islenos_1786561725949.jpg' },
                      { label: 'Limón & Anís', url: '/src/assets/images/rosquetes_limon_anis_islenos_1786561735636.jpg' },
                      { label: 'Bolsa Mini', url: '/src/assets/images/rosqueticos_mini_bolsa_1786561744404.jpg' },
                      { label: 'Caja Regalo', url: '/src/assets/images/rosquetes_caja_regalo_1786561754538.jpg' },
                      { label: 'Logo Marca', url: '/src/assets/images/rosqueticos_logo_brand_1786561715713.jpg' },
                    ].map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setProductForm(prev => ({ ...prev, image: preset.url }))}
                        className={`relative h-12 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                          productForm.image === preset.url ? 'border-[#D97706] ring-2 ring-[#D97706]/30 scale-105' : 'border-[#E5DED4] opacity-70 hover:opacity-100'
                        }`}
                        title={preset.label}
                      >
                        <img src={preset.url} alt={preset.label} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* URL Directa opcional */}
                <div className="pt-1">
                  <details className="text-[11px] text-[#78604E]">
                    <summary className="cursor-pointer font-bold hover:text-[#3E2E22]">O escribir una URL directa de imagen web...</summary>
                    <input
                      type="text"
                      value={productForm.image || ''}
                      onChange={e => setProductForm(prev => ({ ...prev, image: e.target.value }))}
                      placeholder="https://ejemplo.com/imagen.jpg"
                      className="w-full mt-1.5 bg-white border border-[#E5DED4] rounded-xl px-3 py-1.5 text-xs font-mono text-[#3E2E22]"
                    />
                  </details>
                </div>
              </div>

              {/* Publication status checkbox toggle */}
              <div className="bg-[#FDFBF7] p-3 rounded-2xl border border-[#E5DED4] flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-[#3E2E22] block">Estado de Publicación</span>
                  <span className="text-[11px] text-[#78604E]">
                    {productForm.isPublished ? 'El producto estará visible en la tienda pública' : 'El producto estará oculto para los clientes'}
                  </span>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={productForm.isPublished ?? true}
                    onChange={e => setProductForm(prev => ({ ...prev, isPublished: e.target.checked }))}
                    className="w-4 h-4 accent-[#D97706] rounded cursor-pointer"
                  />
                  <span className="text-xs font-bold text-[#3E2E22]">
                    {productForm.isPublished ? 'Publicado' : 'Despublicado'}
                  </span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewProductModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#3E2E22] bg-[#F4EFEA] hover:bg-[#EFECE6]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-extrabold text-white bg-[#D97706] hover:bg-[#B45309] shadow-md"
                >
                  Guardar Producto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
