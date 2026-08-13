import React, { useState } from 'react';
import { Plus, Minus, Check, AlertTriangle, Sparkles, ShoppingBag } from 'lucide-react';
import { Product } from '../types';

interface ProductCatalogProps {
  products: Product[];
  exchangeRateVES: number;
  onAddToCart: (product: Product, quantity: number) => void;
}

export const ProductCatalog: React.FC<ProductCatalogProps> = ({
  products,
  exchangeRateVES,
  onAddToCart,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [addedItemIds, setAddedItemIds] = useState<Record<string, boolean>>({});

  const categories = [
    { id: 'todos', label: 'Todos los Rosquetes' },
    { id: 'tradicional', label: 'Tradicionales (Docenas)' },
    { id: 'mini', label: 'Mini Rosqueticos (Bolsas)' },
    { id: 'regalo', label: 'Cajas Regalo' },
    { id: 'especial', label: 'Ediciones Especiales' },
  ];

  // Filter only published products for the store catalog
  const publishedProducts = products.filter(p => p.isPublished !== false);

  const filteredProducts = selectedCategory === 'todos'
    ? publishedProducts
    : publishedProducts.filter(p => p.category === selectedCategory);

  const handleQuantityChange = (productId: string, delta: number) => {
    setQuantities(prev => {
      const current = prev[productId] || 1;
      const updated = Math.max(1, current + delta);
      return { ...prev, [productId]: updated };
    });
  };

  const handleAdd = (product: Product) => {
    const qty = quantities[product.id] || 1;
    onAddToCart(product, qty);
    setAddedItemIds(prev => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setAddedItemIds(prev => ({ ...prev, [product.id]: false }));
    }, 1500);
  };

  return (
    <section id="catalogo" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#E5DED4] pb-6">
        <div>
          <span className="text-xs font-semibold text-[#D97706] uppercase tracking-widest bg-[#FEF3C7] px-3 py-1 rounded-full border border-[#FDE68A]">
            Menú de Productos
          </span>
          <h2 className="font-serif text-3xl font-extrabold text-[#3E2E22] mt-2">
            Nuestra Selección Artesanal de Rosquetes
          </h2>
          <p className="text-[#78604E] text-sm mt-1">
            Selecciona la presentación que prefieras. Envíos directos en Maracay y todo el estado Aragua.
          </p>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 bg-[#F4EFEA] p-1.5 rounded-2xl border border-[#E5DED4]">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedCategory === cat.id
                  ? 'bg-[#4A3728] text-[#FDFBF7] shadow-sm'
                  : 'text-[#4A3728] hover:bg-[#EFECE6]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Product Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredProducts.map(product => {
          const qty = quantities[product.id] || 1;
          const isJustAdded = addedItemIds[product.id];
          const isLowStock = product.stockElaborado > 0 && product.stockElaborado < 10;
          const isOutOfStock = product.stockElaborado <= 0;

          return (
            <div
              key={product.id}
              className="group bg-white rounded-3xl overflow-hidden border border-[#E5DED4] shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between"
            >
              {/* Image Header */}
              <div className="relative h-56 overflow-hidden bg-[#F4EFEA]">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />

                {/* Badge Category & Unit */}
                <div className="absolute top-3 left-3 flex flex-wrap gap-2">
                  <span className="bg-[#3E2E22]/85 backdrop-blur-md text-[#FEF3C7] text-xs font-bold px-2.5 py-1 rounded-full border border-[#5D4636]">
                    {product.unitType}
                  </span>
                  {product.featured && (
                    <span className="bg-[#D97706] text-white text-xs font-black px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                      <Sparkles className="w-3 h-3" /> Favorito
                    </span>
                  )}
                </div>

                {/* Stock Tag */}
                <div className="absolute bottom-3 right-3">
                  {isOutOfStock ? (
                    <span className="bg-rose-900/90 text-rose-100 text-xs font-bold px-2.5 py-1 rounded-lg border border-rose-700 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Horneando Lote
                    </span>
                  ) : isLowStock ? (
                    <span className="bg-[#4A3728]/90 text-[#FEF3C7] text-xs font-bold px-2.5 py-1 rounded-lg border border-[#5D4636] flex items-center gap-1">
                      ¡Quedan {product.stockElaborado} u.!
                    </span>
                  ) : (
                    <span className="bg-emerald-950/80 text-emerald-300 text-xs font-bold px-2.5 py-1 rounded-lg border border-emerald-700/60 backdrop-blur-sm">
                      Disponibles: {product.stockElaborado} u.
                    </span>
                  )}
                </div>
              </div>

              {/* Card Body */}
              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <h3 className="font-serif text-xl font-bold text-[#3E2E22] leading-snug">
                    {product.name}
                  </h3>
                  <p className="text-[#78604E] text-xs sm:text-sm leading-relaxed line-clamp-3">
                    {product.description}
                  </p>
                </div>

                {/* Price Display */}
                <div className="pt-2 border-t border-[#EFECE6] flex items-baseline justify-between">
                  <div>
                    <span className="text-xs text-[#D97706] uppercase font-bold tracking-wider block">Precio</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-[#3E2E22]">
                        ${product.priceUSD.toFixed(2)} <span className="text-xs font-sans text-[#78604E]">USD</span>
                      </span>
                      <span className="text-xs font-mono font-bold text-[#8C735D]">
                        ({(product.priceUSD * exchangeRateVES).toFixed(2)} Bs.)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quantity + Add to Cart Actions */}
                <div className="flex items-center gap-3 pt-2">
                  <div className="flex items-center bg-[#F4EFEA] rounded-xl border border-[#E5DED4] p-1">
                    <button
                      onClick={() => handleQuantityChange(product.id, -1)}
                      className="w-7 h-7 rounded-lg bg-white hover:bg-[#EFECE6] text-[#3E2E22] flex items-center justify-center font-bold text-sm shadow-xs transition-colors"
                      title="Disminuir"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-8 text-center font-bold text-[#3E2E22] text-sm">
                      {qty}
                    </span>
                    <button
                      onClick={() => handleQuantityChange(product.id, 1)}
                      className="w-7 h-7 rounded-lg bg-white hover:bg-[#EFECE6] text-[#3E2E22] flex items-center justify-center font-bold text-sm shadow-xs transition-colors"
                      title="Aumentar"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    onClick={() => handleAdd(product)}
                    disabled={isOutOfStock}
                    id={`add-to-cart-${product.id}`}
                    className={`flex-1 flex items-center justify-center gap-2 font-extrabold py-2.5 px-4 rounded-xl text-sm transition-all shadow-md active:scale-95 ${
                      isOutOfStock
                        ? 'bg-[#E5DED4] text-[#8C735D] cursor-not-allowed shadow-none'
                        : isJustAdded
                        ? 'bg-emerald-600 text-white'
                        : 'bg-[#D97706] hover:bg-[#B45309] text-white hover:shadow-lg'
                    }`}
                  >
                    {isJustAdded ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>¡Agregado!</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-4 h-4 text-[#FEF3C7]" />
                        <span>Añadir al Pedido</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
