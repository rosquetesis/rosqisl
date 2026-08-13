import React, { useState, useEffect } from 'react';
import { initialSettings, initialProducts, initialIngredients, initialRecipes, initialClients, initialOrders, initialBatches, initialSalesReports } from './data/initialData';
import { AdminSettings, CartItem, Customer, Ingredient, MonthlySalesData, Order, OrderStatus, Product, ProductionBatch, ProductRecipe } from './types';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { ProductCatalog } from './components/ProductCatalog';
import { CartDrawer } from './components/CartDrawer';
import { OrderConfirmationModal } from './components/OrderConfirmationModal';
import { AdminAuthModal } from './components/AdminAuthModal';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { ReceiptModal } from './components/ReceiptModal';
import { Heart, MapPin, Phone, ShieldCheck, Sparkles, Send, Mail } from 'lucide-react';

export default function App() {
  const [settings, setSettings] = useState<AdminSettings>(initialSettings);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [ingredients, setIngredients] = useState<Ingredient[]>(initialIngredients);
  const [recipes, setRecipes] = useState<ProductRecipe[]>(initialRecipes);
  const [clients, setClients] = useState<Customer[]>(initialClients);
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [batches, setBatches] = useState<ProductionBatch[]>(initialBatches);
  const [salesReports, setSalesReports] = useState<MonthlySalesData[]>(initialSalesReports);

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAdminAuthOpen, setIsAdminAuthOpen] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [currentView, setCurrentView] = useState<'store' | 'admin'>('store');

  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);

  // Fetch State from Server
  const fetchState = async () => {
    try {
      const res = await fetch('/api/state');
      if (res.ok) {
        const data = await res.json();
        if (data.settings) setSettings(data.settings);
        if (data.products) setProducts(data.products);
        if (data.ingredients) setIngredients(data.ingredients);
        if (data.recipes) setRecipes(data.recipes);
        if (data.clients) setClients(data.clients);
        if (data.orders) setOrders(data.orders);
        if (data.batches) setBatches(data.batches);
        if (data.salesReports) setSalesReports(data.salesReports);
      }
    } catch (err) {
      console.warn('Backend API endpoint not available yet or local offline fallback used', err);
    }
  };

  useEffect(() => {
    fetchState();
  }, []);

  // Cart Management
  const handleAddToCart = (product: Product, quantity: number) => {
    setCartItems(prev => {
      const existingIdx = prev.findIndex(item => item.product.id === product.id);
      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx].quantity += quantity;
        return updated;
      }
      return [...prev, { product, quantity }];
    });
    setIsCartOpen(true);
  };

  const handleUpdateCartQuantity = (productId: string, delta: number) => {
    setCartItems(prev =>
      prev
        .map(item => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const handleRemoveCartItem = (productId: string) => {
    setCartItems(prev => prev.filter(item => item.product.id !== productId));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  // Super Admin Action Handlers
  const handleSaveSettings = async (updatedSettings: AdminSettings) => {
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSettings),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error ${res.status}`);
      }
      setSettings(updatedSettings);
    } catch (err: any) {
      console.error('Failed syncing settings', err);
      alert('Error guardando la configuración: ' + err.message);
      throw err;
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: OrderStatus, paymentVerified?: boolean) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, paymentVerified }),
      });
      if (!res.ok) throw new Error('Error al actualizar el estado del pedido');
      
      setOrders(prev =>
        prev.map(o => {
          if (o.id === orderId) {
            return {
              ...o,
              status,
              paymentVerified: paymentVerified !== undefined ? paymentVerified : o.paymentVerified,
            };
          }
          return o;
        })
      );
    } catch (err: any) {
      console.error('Failed updating order', err);
      alert(err.message);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar el pedido');
      setOrders(prev => prev.filter(o => o.id !== orderId));
    } catch (err: any) {
      console.error('Failed deleting order', err);
      alert(err.message);
    }
  };

  const handleRegisterBatch = async (productId: string, unitsProduced: number, notes?: string) => {
    try {
      const res = await fetch('/api/batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, unitsProduced, notes }),
      });
      if (!res.ok) throw new Error('Error al registrar lote');
      await fetchState();
    } catch (err: any) {
      console.error('Error registering batch', err);
      alert(err.message);
    }
  };

  const handleUpdateProductStock = async (productId: string, newStock: number) => {
    const prod = products.find(p => p.id === productId);
    if (!prod) return;
    
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...prod, stockElaborado: newStock }),
      });
      if (!res.ok) throw new Error('Error al actualizar stock');
      
      setProducts(prev =>
        prev.map(p => p.id === productId ? { ...p, stockElaborado: newStock } : p)
      );
    } catch (err: any) {
      console.error('Error updating product stock', err);
      alert(err.message);
    }
  };

  const handleSaveProduct = async (product: Product) => {
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Error al guardar el producto');
      }

      setProducts(prev => {
        const idx = prev.findIndex(p => p.id === product.id);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = product;
          return updated;
        }
        return [...prev, product];
      });
    } catch (err: any) {
      console.error('Error saving product', err);
      alert(err.message);
      throw err;
    }
  };

  const handleToggleProductPublished = async (productId: string, isPublished: boolean) => {
    const prod = products.find(p => p.id === productId);
    if (!prod) return;

    try {
      const updatedProduct = { ...prod, isPublished };
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedProduct),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Error al actualizar visibilidad');
      }

      setProducts(prev =>
        prev.map(p => p.id === productId ? updatedProduct : p)
      );
    } catch (err: any) {
      console.error('Error toggling product publish status', err);
      alert('Error: ' + err.message);
    }
  };

  const handleAddClient = async (clientData: Partial<Customer>) => {
    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clientData),
      });
      if (!res.ok) throw new Error('Error al añadir cliente');
      await fetchState();
    } catch (err: any) {
      console.error('Error adding client', err);
      alert(err.message);
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    try {
      const res = await fetch(`/api/clients/${clientId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar cliente');
      setClients(prev => prev.filter(c => c.id !== clientId));
    } catch (err: any) {
      console.error('Error deleting client', err);
      alert(err.message);
    }
  };

  const handleSaveIngredient = async (ing: Ingredient) => {
    try {
      const res = await fetch('/api/ingredients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ing),
      });
      if (!res.ok) throw new Error('Error al guardar ingrediente');
      await fetchState();
    } catch (err: any) {
      console.error('Error saving ingredient', err);
      alert(err.message);
    }
  };

  const handleDeleteIngredient = async (id: string) => {
    try {
      const res = await fetch(`/api/ingredients/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar ingrediente');
      setIngredients(prev => prev.filter(i => i.id !== id));
    } catch (err: any) {
      console.error('Error deleting ingredient', err);
      alert(err.message);
    }
  };

  const totalCartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#4A3728] font-sans antialiased flex flex-col justify-between">
      {currentView === 'admin' && isAdminLoggedIn ? (
        <AdminDashboard
          settings={settings}
          orders={orders}
          products={products}
          ingredients={ingredients}
          recipes={recipes}
          clients={clients}
          batches={batches}
          salesReports={salesReports}
          onSaveSettings={handleSaveSettings}
          onUpdateOrderStatus={handleUpdateOrderStatus}
          onDeleteOrder={handleDeleteOrder}
          onRegisterBatch={handleRegisterBatch}
          onUpdateProductStock={handleUpdateProductStock}
          onSaveProduct={handleSaveProduct}
          onToggleProductPublished={handleToggleProductPublished}
          onAddClient={handleAddClient}
          onDeleteClient={handleDeleteClient}
          onSaveIngredient={handleSaveIngredient}
          onDeleteIngredient={handleDeleteIngredient}
          onSelectOrderForReceipt={order => setReceiptOrder(order)}
          onLogout={() => {
            setIsAdminLoggedIn(false);
            setCurrentView('store');
          }}
          onBackToStore={() => setCurrentView('store')}
        />
      ) : (
        <>
          {/* Main Storefront Navigation */}
          <Navbar
            cartCount={totalCartCount}
            onOpenCart={() => setIsCartOpen(true)}
            onOpenAdmin={() => {
              if (isAdminLoggedIn) {
                setCurrentView('admin');
              } else {
                setIsAdminAuthOpen(true);
              }
            }}
            settings={settings}
            isAdminLoggedIn={isAdminLoggedIn}
          />

          {/* Main Content Area */}
          <main className="flex-1">
            <HeroSection
              onExploreProducts={() => {
                const catalogEl = document.getElementById('catalogo');
                if (catalogEl) catalogEl.scrollIntoView({ behavior: 'smooth' });
              }}
              exchangeRateVES={settings.exchangeRateVES}
              settings={settings}
            />

            {/* Product Menu */}
            <ProductCatalog
              products={products}
              exchangeRateVES={settings.exchangeRateVES}
              onAddToCart={handleAddToCart}
            />

            {/* Artisan Process Highlights Section */}
            {(settings.featureCards && settings.featureCards.length > 0) && (
              <section className="bg-[#3E2E22] text-[#FDFBF7] py-16 px-4 sm:px-6 lg:px-8 border-t border-[#5D4636]">
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
                  {settings.featureCards.map((card) => (
                    <div key={card.id} className="bg-[#4A3728]/70 p-6 rounded-3xl border border-[#5D4636] space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-[#D97706]/20 text-[#FEF3C7] flex items-center justify-center font-bold text-xl border border-[#D97706]/30">
                        {card.icon || '✨'}
                      </div>
                      <h3 className="font-serif text-lg font-bold text-[#FDFBF7]">{card.title}</h3>
                      <p className="text-xs text-[#EFECE6]/80 leading-relaxed font-sans">
                        {card.description}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </main>

          {/* Footer */}
          <footer className="bg-[#3E2E22] text-[#EFECE6]/80 border-t border-[#5D4636] py-8 px-4 sm:px-6 lg:px-8 text-xs">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#D97706] text-white font-bold flex items-center justify-center">
                  🍩
                </div>
                <div>
                  <p className="font-serif font-bold text-[#FDFBF7]">{settings.storeName}</p>
                  <p className="text-[11px] text-[#FEF3C7]">{settings.storeAddress}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-center">
                <span>WhatsApp: +{settings.whatsappNumber}</span>
                <span>•</span>
                <span>Correo: {settings.emailRecipient}</span>
              </div>

              <div className="text-[#FEF3C7] text-[11px]">
                Tradición Canaria y Aragüeña © 2026
              </div>
            </div>
          </footer>
        </>
      )}

      {/* Slide-over Shopping Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={handleClearCart}
        settings={settings}
        onOrderSubmitted={(newOrder, updatedCustomer) => {
          setConfirmedOrder(newOrder);
          setOrders(prev => [newOrder, ...prev]);
          if (updatedCustomer) {
            setClients(prev => {
              const idx = prev.findIndex(c => c.id === updatedCustomer.id);
              if (idx >= 0) {
                const newClients = [...prev];
                newClients[idx] = updatedCustomer;
                return newClients;
              }
              return [updatedCustomer, ...prev];
            });
          }
        }}
      />

      {/* Order Confirmation Modal */}
      <OrderConfirmationModal
        order={confirmedOrder}
        onClose={() => setConfirmedOrder(null)}
        settings={settings}
      />

      {/* Super Admin Login Modal */}
      <AdminAuthModal
        isOpen={isAdminAuthOpen}
        onClose={() => setIsAdminAuthOpen(false)}
        onSuccessLogin={() => {
          setIsAdminLoggedIn(true);
          setCurrentView('admin');
        }}
        settings={settings}
      />

      {/* Printable Order Receipt Modal */}
      <ReceiptModal
        order={receiptOrder}
        onClose={() => setReceiptOrder(null)}
        settings={settings}
      />
    </div>
  );
}
