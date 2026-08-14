import React from 'react';
import { ShoppingBag, Sparkles, CheckCircle2, HeartHandshake, ShieldCheck, Truck } from 'lucide-react';
import { AdminSettings } from '../types';

interface HeroSectionProps {
  onExploreProducts: () => void;
  exchangeRateVES: number;
  settings?: AdminSettings;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onExploreProducts,
  exchangeRateVES,
  settings,
}) => {
  const heroImage = settings?.heroImageUrl || '/images/rosquetes_hero_1786559273650.jpg';
  const badgeText = settings?.heroBadgeText || 'Presentación Estrella';
  const starTitle = settings?.heroStarTitle || 'Docena Tradicional Glaseada';
  const starPriceUSD = settings?.heroStarPriceUSD ?? 4.50;

  return (
    <div className="relative overflow-hidden bg-[#3E2E22] text-[#FDFBF7] pt-8 pb-12 px-4 sm:px-6 lg:px-8 border-b border-[#5D4636]">
      {/* Background Decorative Radial Gradient */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-[#D97706]/10 blur-3xl rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
        {/* Text Column */}
        <div className="lg:col-span-7 space-y-6 text-left">
          <div className="inline-flex items-center gap-2 bg-[#4A3728] border border-[#5D4636] px-3.5 py-1.5 rounded-full text-xs font-semibold text-[#FEF3C7]">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Receta Canaria Auténtica con Toque Aragüeño</span>
          </div>

          <h2 className="font-serif text-3xl sm:text-5xl font-extrabold tracking-tight text-[#FDFBF7] leading-tight">
            Ricos <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-200 to-amber-400">Rosquetes Isleños</span> y Rosqueticos de Aragua
          </h2>

          <p className="text-[#EFECE6]/90 text-base sm:text-lg max-w-2xl font-sans leading-relaxed">
            Rosqueticos isleños, hechos a mano en Turmero.<br />
            Anís dulce, ralladura cítrica y un glaseado que brilla sin empalagar. Receta de origen canario, cocinados con calma en el corazón de Aragua. Cada rosquetico guarda ese punto exacto entre lo crujiente del borde y la miga tierna que se deshace al morderlo.
          </p>

          {/* Value Highlights */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs sm:text-sm text-[#EFECE6]/90 font-medium">
            <div className="flex items-center gap-2 bg-[#4A3728]/70 p-2.5 rounded-xl border border-[#5D4636]">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Horneado Diario Fresco</span>
            </div>
            <div className="flex items-center gap-2 bg-[#4A3728]/70 p-2.5 rounded-xl border border-[#5D4636]">
              <Truck className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Delivery en Aragua</span>
            </div>
            <div className="flex items-center gap-2 bg-[#4A3728]/70 p-2.5 rounded-xl border border-[#5D4636] col-span-2 sm:col-span-1">
              <HeartHandshake className="w-4 h-4 text-amber-300 shrink-0" />
              <span>Pago Móvil / Divisas</span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              onClick={onExploreProducts}
              id="hero-order-now-btn"
              className="flex items-center gap-2.5 bg-[#D97706] hover:bg-[#B45309] text-white font-extrabold px-6 py-3.5 rounded-2xl transition-all shadow-xl active:scale-95 text-sm sm:text-base cursor-pointer"
            >
              <ShoppingBag className="w-5 h-5" />
              <span>Hacer Pedido Ahora</span>
            </button>

            <a
              href="#catalogo"
              className="text-xs sm:text-sm text-[#FEF3C7] hover:text-white font-semibold underline underline-offset-4 decoration-[#D97706] transition-colors"
            >
              Ver menú de presentaciones →
            </a>
          </div>
        </div>

        {/* Hero Image Frame */}
        <div className="lg:col-span-5 relative">
          <div className="relative mx-auto max-w-md lg:max-w-none rounded-3xl overflow-hidden shadow-2xl border-2 border-[#5D4636] group">
            <img
              src={heroImage || '/images/rosquetes_hero_1786559273650.jpg'}
              alt={starTitle}
              className="w-full h-80 sm:h-96 object-cover transform group-hover:scale-105 transition-transform duration-700"
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/images/rosquetes_hero_1786559273650.jpg';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#3E2E22]/90 via-transparent to-transparent flex flex-col justify-end p-6">
              <div className="bg-[#3E2E22]/90 backdrop-blur-md p-3.5 rounded-2xl border border-[#5D4636] flex items-center justify-between">
                <div>
                  <p className="text-xs text-[#FEF3C7] font-semibold uppercase tracking-wider">{badgeText}</p>
                  <p className="text-sm font-serif font-bold text-[#FDFBF7]">{starTitle}</p>
                </div>
                <div className="text-right">
                  <p className="text-base font-extrabold text-amber-400">${starPriceUSD.toFixed(2)} USD</p>
                  <p className="text-[11px] font-mono text-[#EFECE6]">{(starPriceUSD * exchangeRateVES).toFixed(2)} Bs.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
