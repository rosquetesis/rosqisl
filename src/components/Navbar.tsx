import React from 'react';
import { ShoppingBag, ShieldCheck, MapPin, DollarSign, Sparkles } from 'lucide-react';
import { AdminSettings } from '../types';

interface NavbarProps {
  cartCount: number;
  onOpenCart: () => void;
  onOpenAdmin: () => void;
  settings: AdminSettings;
  isAdminLoggedIn: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  cartCount,
  onOpenCart,
  onOpenAdmin,
  settings,
  isAdminLoggedIn,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#3E2E22]/95 backdrop-blur-md border-b border-[#5D4636] text-[#FDFBF7] shadow-lg">
      {/* Top Banner for Market Location */}
      <div className="bg-[#4A3728] py-1.5 px-4 text-xs font-medium text-[#EFECE6] border-b border-[#5D4636]">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Despacho directo en <strong>Aragua, Venezuela</strong>: Maracay, Turmero, Cagua, El Limón, La Victoria</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="bg-[#3E2E22] px-2 py-0.5 rounded-full border border-[#5D4636] text-[11px] font-mono text-[#FEF3C7]">
              Tasa Oficial: 1 USD = {settings.exchangeRateVES.toFixed(2)} Bs.
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-[#FEF3C7]">
              <Sparkles className="w-3 h-3 text-amber-400" />
              Sabor Tradicional Canario
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#D97706] to-[#F59E0B] flex items-center justify-center text-[#3E2E22] font-black text-xl shadow-md border-2 border-[#FEF3C7] overflow-hidden shrink-0">
            {settings.storeLogoType === 'image' && settings.storeLogoValue ? (
              <img
                src={settings.storeLogoValue}
                alt={settings.storeName}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span>{settings.storeLogoValue || '🍩'}</span>
            )}
          </div>
          <div>
            <h1 className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-[#FDFBF7] flex flex-wrap items-center gap-2">
              <span>{settings.storeName || 'Rosquetes Canarios'}</span>
              {settings.storeBadge && (
                <span className="text-xs bg-[#D97706]/20 text-[#FEF3C7] font-sans font-normal px-2 py-0.5 rounded-md border border-[#D97706]/40">
                  {settings.storeBadge}
                </span>
              )}
            </h1>
            <p className="text-xs text-[#EFECE6]/80 font-sans hidden sm:block">
              {settings.storeTagline}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Dispatch Mode Badge Preview */}
          <div className="hidden lg:flex items-center gap-1.5 text-xs bg-[#4A3728] border border-[#5D4636] px-2.5 py-1 rounded-full text-[#EFECE6]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Pedidos por: <strong className="text-[#FDFBF7]">{settings.dispatchMode === 'email' ? 'Correo' : settings.dispatchMode === 'whatsapp' ? 'WhatsApp' : 'WhatsApp / Correo'}</strong></span>
          </div>

          {/* Admin Switcher Button */}
          <button
            onClick={onOpenAdmin}
            id="admin-panel-btn"
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 shadow-sm ${
              isAdminLoggedIn
                ? 'bg-[#D97706] text-white hover:bg-[#B45309] font-bold ring-2 ring-[#FEF3C7]'
                : 'bg-[#4A3728] hover:bg-[#5D4636] text-[#EFECE6] border border-[#5D4636]'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-amber-300" />
            <span>{isAdminLoggedIn ? 'Panel Super Admin' : 'Acceso Admin'}</span>
          </button>

          {/* Cart Button */}
          <button
            onClick={onOpenCart}
            id="shopping-cart-btn"
            className="relative flex items-center gap-2 bg-[#D97706] hover:bg-[#B45309] text-white font-bold px-4 py-2 rounded-xl transition-all shadow-md active:scale-95"
          >
            <ShoppingBag className="w-5 h-5" />
            <span className="hidden sm:inline text-sm">Ver Pedido</span>
            {cartCount > 0 && (
              <span className="bg-[#3E2E22] text-[#FEF3C7] text-xs font-extrabold w-5 h-5 rounded-full flex items-center justify-center border border-[#D97706] animate-bounce">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
