import React, { useState } from 'react';
import { Save, Send, Mail, DollarSign, MapPin, CreditCard, ShieldCheck, Plus, Trash2, CheckCircle2, Store, Image as ImageIcon, Sparkles, Upload, Eye, RefreshCw, Globe, Sparkle } from 'lucide-react';
import { AdminSettings, CustomPaymentMethod, DeliveryZone, FeatureCard } from '../../types';
import { PaymentMethodsManager } from './PaymentMethodsManager';
import { compressImageFile } from '../../lib/imageCompressor';

interface AdminSettingsSectionProps {
  settings: AdminSettings;
  onSaveSettings: (updated: AdminSettings) => Promise<void>;
}

const defaultFeatureCards: FeatureCard[] = [
  {
    id: 'card-1',
    icon: '🍋',
    title: 'Ingredientes Naturales',
    description: 'Infusión artesanal de anís dulce, ralladura de limones frescos criollos de Aragua y miel pura. Sin conservantes artificiales.',
  },
  {
    id: 'card-2',
    icon: '🔥',
    title: 'Horneado Diario en Maracay',
    description: 'Nuestros maestros pasteleros hornean diariamente en lotes reducidos para garantizar la textura crocante y el baño de glaseado perfecto.',
  },
  {
    id: 'card-3',
    icon: '🚚',
    title: 'Despacho Directo & Pago Fácil',
    description: 'Entregas rápidas en Maracay, Turmero, Cagua, El Limón y La Victoria. Paga cómodamente con Pago Móvil, Zelle o Efectivo.',
  },
];

export const AdminSettingsSection: React.FC<AdminSettingsSectionProps> = ({
  settings,
  onSaveSettings,
}) => {
  const [formState, setFormState] = useState<AdminSettings>({
    ...settings,
    adminUsername: settings.adminUsername || 'admin',
    adminPassword: settings.adminPassword || 'admin2026',
    heroImageUrl: settings.heroImageUrl || '/src/assets/images/rosquetes_hero_1786559273650.jpg',
    heroBadgeText: settings.heroBadgeText || 'Presentación Estrella',
    heroStarTitle: settings.heroStarTitle || 'Docena Tradicional Glaseada',
    heroStarPriceUSD: settings.heroStarPriceUSD ?? 4.50,
    featureCards: settings.featureCards && settings.featureCards.length > 0 ? settings.featureCards : defaultFeatureCards,
  });
  const [confirmPassword, setConfirmPassword] = useState(settings.adminPassword || 'admin2026');
  const [passwordMismatchError, setPasswordMismatchError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isSyncingBCV, setIsSyncingBCV] = useState(false);
  const [bcvStatusMsg, setBcvStatusMsg] = useState('');
  const [bcvCurrencies, setBcvCurrencies] = useState<Record<string, number> | null>(null);

  const handleHeroImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImageFile(file, 1000, 0.75);
        setFormState(prev => ({
          ...prev,
          heroImageUrl: compressed,
        }));
      } catch (err) {
        console.error('Error compressing hero image', err);
      }
    }
  };

  const handleSyncBCV = async () => {
    setIsSyncingBCV(true);
    setBcvStatusMsg('');
    try {
      const res = await fetch('/api/bcv-rate?autoSave=true');
      const data = await res.json();
      if (data.success && data.rate) {
        setFormState(prev => ({
          ...prev,
          exchangeRateVES: data.rate,
          lastBCVSyncDate: new Date().toISOString(),
        }));
        if (data.allCurrencies) {
          setBcvCurrencies(data.allCurrencies);
        }
        setBcvStatusMsg(`¡Tasa de ${data.rate} Bs/USD obtenida directamente de ${data.source}! (Fecha: ${data.date})`);
      } else {
        setBcvStatusMsg(`Atención: ${data.error || 'No se pudo obtener la tasa de bcv.org.ve. Puedes introducirla manualmente.'}`);
      }
    } catch (err) {
      setBcvStatusMsg('No se pudo conectar con el servicio del BCV. Puedes introducir la tasa manualmente.');
    } finally {
      setIsSyncingBCV(false);
      setTimeout(() => setBcvStatusMsg(''), 10000);
    }
  };

  const presetEmojis = ['🍩', '🥖', '🌾', '👑', '☕', '🧁', '🥐', '⭐', '🍪', '🥨'];
  const presetImages = [
    { label: 'Logo Insignia Rosqueticos Isleños', url: '/src/assets/images/rosqueticos_logo_brand_1786561715713.jpg' },
    { label: 'Rosqueticos Glaseados Isleños', url: '/src/assets/images/rosquetes_glaseados_islenos_1786561725949.jpg' },
    { label: 'Rosqueticos Limón & Anís', url: '/src/assets/images/rosquetes_limon_anis_islenos_1786561735636.jpg' },
    { label: 'Bolsa Mini Rosqueticos', url: '/src/assets/images/rosqueticos_mini_bolsa_1786561744404.jpg' },
    { label: 'Caja Regalo Rosqueticos', url: '/src/assets/images/rosquetes_caja_regalo_1786561754538.jpg' },
  ];

  const handleChange = (field: keyof AdminSettings, value: any) => {
    setFormState(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImageFile(file, 600, 0.8);
        handleChange('storeLogoType', 'image');
        handleChange('storeLogoValue', compressed);
      } catch (err) {
        console.error('Error compressing logo', err);
      }
    }
  };

  const handleZoneChange = (id: string, field: keyof DeliveryZone, value: any) => {
    setFormState(prev => ({
      ...prev,
      deliveryZones: prev.deliveryZones.map(z => z.id === id ? { ...z, [field]: value } : z),
    }));
  };

  const handleAddZone = () => {
    const newZone: DeliveryZone = {
      id: `zone-${Date.now()}`,
      name: 'Nueva Zona de Aragua',
      city: 'Maracay',
      feeUSD: 2.00,
      estimatedTime: '45 min',
    };
    setFormState(prev => ({
      ...prev,
      deliveryZones: [...prev.deliveryZones, newZone],
    }));
  };

  const handleDeleteZone = (id: string) => {
    setFormState(prev => ({
      ...prev,
      deliveryZones: prev.deliveryZones.filter(z => z.id !== id),
    }));
  };

  const handleFeatureCardChange = (id: string, field: keyof FeatureCard, value: string) => {
    setFormState(prev => ({
      ...prev,
      featureCards: (prev.featureCards || []).map(c => c.id === id ? { ...c, [field]: value } : c),
    }));
  };

  const handleAddFeatureCard = () => {
    const newCard: FeatureCard = {
      id: `card-${Date.now()}`,
      icon: '✨',
      title: 'Nuevo Destacado',
      description: 'Escribe aquí la descripción promocional o informativa del proceso.',
    };
    setFormState(prev => ({
      ...prev,
      featureCards: [...(prev.featureCards || []), newCard],
    }));
  };

  const handleDeleteFeatureCard = (id: string) => {
    setFormState(prev => ({
      ...prev,
      featureCards: (prev.featureCards || []).filter(c => c.id !== id),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formState.adminPassword && formState.adminPassword !== confirmPassword) {
      setPasswordMismatchError('Las contraseñas ingresadas no coinciden. Por favor verifícalas antes de guardar.');
      return;
    }
    setPasswordMismatchError('');
    setIsSaving(true);
    setSuccessMessage('');
    try {
      await onSaveSettings(formState);
      setSuccessMessage('¡Configuración de Identidad de Marca, Imagen Hero y Credenciales guardada exitosamente!');
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-5xl">
      {successMessage && (
        <div className="bg-emerald-100 border border-emerald-300 text-emerald-950 p-4 rounded-2xl flex items-center gap-2 text-sm font-bold animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* 1. BRAND IDENTITY & LOGO MANAGEMENT SECTION */}
      <div className="bg-white p-6 rounded-3xl border border-[#E5DED4] shadow-md space-y-6">
        <div className="border-b border-[#EFECE6] pb-3 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-[#3E2E22] uppercase tracking-widest bg-[#F4EFEA] px-2.5 py-0.5 rounded-md border border-[#E5DED4]">
              Identidad de la Marca
            </span>
            <h3 className="font-serif text-xl font-bold text-[#3E2E22] mt-1 flex items-center gap-2">
              <Store className="w-5 h-5 text-[#D97706]" />
              <span>Edición del Nombre del Negocio y Logotipo</span>
            </h3>
          </div>
          <Sparkles className="w-6 h-6 text-[#D97706]" />
        </div>

        {/* Store Name, Badge, Tagline & Address Form */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#3E2E22] mb-1">
              Nombre Oficial del Negocio *
            </label>
            <input
              type="text"
              required
              value={formState.storeName}
              onChange={e => handleChange('storeName', e.target.value)}
              placeholder="Ej: Rosquetes Canarios"
              className="w-full bg-[#FDFBF7] border border-[#E5DED4] rounded-xl px-3.5 py-2.5 text-xs font-bold text-[#3E2E22] focus:ring-2 focus:ring-[#D97706] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#3E2E22] mb-1">
              Insignia / Distintivo Secundario (Opcional)
            </label>
            <input
              type="text"
              value={formState.storeBadge || ''}
              onChange={e => handleChange('storeBadge', e.target.value)}
              placeholder="Ej: Don Rosquetico, Desde 2020"
              className="w-full bg-[#FDFBF7] border border-[#E5DED4] rounded-xl px-3.5 py-2.5 text-xs font-bold text-[#3E2E22] focus:ring-2 focus:ring-[#D97706] focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-[#3E2E22] mb-1">
              Slogan / Subtítulo Promocional
            </label>
            <input
              type="text"
              value={formState.storeTagline}
              onChange={e => handleChange('storeTagline', e.target.value)}
              placeholder="Ej: Tradición Artesanal Canario-Aragüeña en Maracay y todo Aragua"
              className="w-full bg-[#FDFBF7] border border-[#E5DED4] rounded-xl px-3.5 py-2.5 text-xs font-medium text-[#3E2E22] focus:ring-2 focus:ring-[#D97706] focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-[#3E2E22] mb-1">
              Dirección Física / Fábrica o Taller
            </label>
            <input
              type="text"
              value={formState.storeAddress}
              onChange={e => handleChange('storeAddress', e.target.value)}
              placeholder="Ej: Calle San Miguel, Local #4, Sector Base Aragua, Maracay, Edo. Aragua"
              className="w-full bg-[#FDFBF7] border border-[#E5DED4] rounded-xl px-3.5 py-2.5 text-xs font-medium text-[#3E2E22] focus:ring-2 focus:ring-[#D97706] focus:outline-none"
            />
          </div>
        </div>

        {/* LOGO CONFIGURATION & EDITOR */}
        <div className="bg-[#FDFBF7] p-5 rounded-2xl border border-[#E5DED4] space-y-4">
          <h4 className="text-xs font-bold text-[#3E2E22] uppercase tracking-wider border-b border-[#EFECE6] pb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4 text-[#D97706]" />
              <span>Configuración y Estilo del Logotipo</span>
            </span>
            <span className="text-[11px] text-[#78604E] font-normal">
              Vista previa automática en la Barra de Navegación y Recibos
            </span>
          </h4>

          {/* Logo Type Selector */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => {
                handleChange('storeLogoType', 'emoji');
                if (!formState.storeLogoValue || formState.storeLogoValue.startsWith('http') || formState.storeLogoValue.startsWith('data:')) {
                  handleChange('storeLogoValue', '🍩');
                }
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                formState.storeLogoType !== 'image'
                  ? 'bg-[#3E2E22] text-[#FDFBF7] shadow-sm'
                  : 'bg-white text-[#3E2E22] border border-[#E5DED4] hover:border-[#D97706]'
              }`}
            >
              <span>🍩 Ícono / Emoji Artesanal</span>
            </button>

            <button
              type="button"
              onClick={() => handleChange('storeLogoType', 'image')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                formState.storeLogoType === 'image'
                  ? 'bg-[#3E2E22] text-[#FDFBF7] shadow-sm'
                  : 'bg-white text-[#3E2E22] border border-[#E5DED4] hover:border-[#D97706]'
              }`}
            >
              <ImageIcon className="w-4 h-4 text-[#D97706]" />
              <span>🖼️ Imagen / Logotipo Personalizado</span>
            </button>
          </div>

          {/* Emoji Selection Grid */}
          {formState.storeLogoType !== 'image' ? (
            <div className="space-y-3 bg-white p-4 rounded-xl border border-[#E5DED4]">
              <label className="block text-xs font-bold text-[#3E2E22]">Selecciona un Emoji de la Lista o Escribe uno Personalizado:</label>
              <div className="flex flex-wrap gap-2">
                {presetEmojis.map(emoji => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => handleChange('storeLogoValue', emoji)}
                    className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all cursor-pointer ${
                      formState.storeLogoValue === emoji
                        ? 'bg-[#D97706] text-white shadow-md ring-2 ring-[#FEF3C7] scale-110'
                        : 'bg-[#F4EFEA] hover:bg-[#EFECE6] border border-[#E5DED4]'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
              <div className="pt-2">
                <label className="block text-[11px] font-bold text-[#4A3728] mb-1">Escribir Emoji / Carácter Personalizado:</label>
                <input
                  type="text"
                  maxLength={4}
                  value={formState.storeLogoValue || '🍩'}
                  onChange={e => handleChange('storeLogoValue', e.target.value)}
                  className="w-32 bg-[#FDFBF7] border border-[#E5DED4] rounded-lg px-3 py-1.5 text-sm font-bold text-center text-[#3E2E22]"
                />
              </div>
            </div>
          ) : (
            /* Custom Image Logo Controls */
            <div className="space-y-4 bg-white p-4 rounded-xl border border-[#E5DED4]">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-[#3E2E22]">
                  URL de Imagen de Logotipo (o Sube una Imagen desde tu Dispositivo)
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="url"
                    value={formState.storeLogoValue || ''}
                    onChange={e => handleChange('storeLogoValue', e.target.value)}
                    placeholder="https://ejemplo.com/milogotipo.png"
                    className="flex-1 bg-[#FDFBF7] border border-[#E5DED4] rounded-xl px-3 py-2 text-xs font-mono text-[#3E2E22]"
                  />
                  <label className="flex items-center justify-center gap-1.5 bg-[#D97706] hover:bg-[#B45309] text-white px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all shrink-0">
                    <Upload className="w-4 h-4" />
                    <span>Cargar Imagen</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUploadLogo}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Preset Image Suggestions */}
              <div>
                <label className="block text-[11px] font-bold text-[#4A3728] mb-1.5">Imágenes Predeterminadas Disponibles:</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {presetImages.map((imgItem, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleChange('storeLogoValue', imgItem.url)}
                      className={`p-2 rounded-xl border flex items-center gap-2 text-left transition-all cursor-pointer ${
                        formState.storeLogoValue === imgItem.url
                          ? 'border-[#D97706] bg-[#FEF3C7]/40 ring-2 ring-[#D97706]/30'
                          : 'border-[#E5DED4] hover:border-[#D97706] bg-[#FDFBF7]'
                      }`}
                    >
                      <img src={imgItem.url} alt={imgItem.label} className="w-8 h-8 rounded-lg object-cover" />
                      <span className="text-[11px] font-bold text-[#3E2E22] truncate">{imgItem.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Real-time Header & Receipt Brand Identity Live Preview Card */}
          <div className="pt-2">
            <label className="block text-xs font-bold text-[#3E2E22] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-[#D97706]" />
              <span>Vista Previa en Tiempo Real de la Identidad:</span>
            </label>

            <div className="bg-[#3E2E22] p-4 rounded-2xl text-[#FDFBF7] flex items-center gap-3 border-2 border-[#D97706] shadow-lg">
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#D97706] to-[#F59E0B] flex items-center justify-center text-[#3E2E22] font-black text-2xl border-2 border-[#FEF3C7] overflow-hidden shrink-0 shadow-md">
                {formState.storeLogoType === 'image' && formState.storeLogoValue ? (
                  <img
                    src={formState.storeLogoValue}
                    alt="Logo Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{formState.storeLogoValue || '🍩'}</span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-serif font-bold text-lg text-[#FDFBF7] truncate">
                    {formState.storeName || 'Nombre de la Empresa'}
                  </h4>
                  {formState.storeBadge && (
                    <span className="text-[10px] bg-[#D97706]/30 text-[#FEF3C7] font-sans px-2 py-0.5 rounded-md border border-[#D97706]/50">
                      {formState.storeBadge}
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#EFECE6]/80 truncate">
                  {formState.storeTagline || 'Slogan del negocio'}
                </p>
                <p className="text-[10px] font-mono text-[#FEF3C7]/70 truncate">
                  📍 {formState.storeAddress || 'Dirección de la fábrica'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Order Dispatch Channel Config */}
      <div className="bg-white p-6 rounded-3xl border border-[#E5DED4] shadow-md space-y-5">
        <div className="border-b border-[#EFECE6] pb-3 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-[#3E2E22] uppercase tracking-widest bg-[#F4EFEA] px-2.5 py-0.5 rounded-md border border-[#E5DED4]">
              Canal Principal de Recepción de Pedidos
            </span>
            <h3 className="font-serif text-xl font-bold text-[#3E2E22] mt-1">
              Selección de Recepción de Pedidos (WhatsApp / Correo)
            </h3>
          </div>
          <ShieldCheck className="w-6 h-6 text-[#D97706]" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <label
            onClick={() => handleChange('dispatchMode', 'whatsapp')}
            className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between space-y-2 ${
              formState.dispatchMode === 'whatsapp'
                ? 'border-emerald-500 bg-emerald-50/50 shadow-md ring-2 ring-emerald-200'
                : 'border-[#E5DED4] hover:border-[#D97706] bg-[#FDFBF7]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-[#3E2E22] flex items-center gap-1.5">
                <Send className="w-4 h-4 text-emerald-600" /> Enviar a WhatsApp
              </span>
              <input
                type="radio"
                name="dispatchMode"
                checked={formState.dispatchMode === 'whatsapp'}
                onChange={() => handleChange('dispatchMode', 'whatsapp')}
              />
            </div>
            <p className="text-xs text-[#78604E]">
              Redirige al cliente con el mensaje pre-armado a tu WhatsApp de ventas.
            </p>
          </label>

          <label
            onClick={() => handleChange('dispatchMode', 'email')}
            className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between space-y-2 ${
              formState.dispatchMode === 'email'
                ? 'border-[#D97706] bg-[#FEF3C7]/40 shadow-md ring-2 ring-[#FDE68A]'
                : 'border-[#E5DED4] hover:border-[#D97706] bg-[#FDFBF7]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-[#3E2E22] flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-[#D97706]" /> Enviar a Correo
              </span>
              <input
                type="radio"
                name="dispatchMode"
                checked={formState.dispatchMode === 'email'}
                onChange={() => handleChange('dispatchMode', 'email')}
              />
            </div>
            <p className="text-xs text-[#78604E]">
              Envía la solicitud de pedido al correo oficial de recepción de la fábrica.
            </p>
          </label>

          <label
            onClick={() => handleChange('dispatchMode', 'both')}
            className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between space-y-2 ${
              formState.dispatchMode === 'both'
                ? 'border-indigo-500 bg-indigo-50/50 shadow-md ring-2 ring-indigo-200'
                : 'border-[#E5DED4] hover:border-[#D97706] bg-[#FDFBF7]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-[#3E2E22] flex items-center gap-1.5">
                ⚡ Modo Dual (Ambos)
              </span>
              <input
                type="radio"
                name="dispatchMode"
                checked={formState.dispatchMode === 'both'}
                onChange={() => handleChange('dispatchMode', 'both')}
              />
            </div>
            <p className="text-xs text-[#78604E]">
              Guarda el pedido por correo e inicia automáticamente el chat de WhatsApp.
            </p>
          </label>
        </div>

        {/* Inputs for Phone and Email */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="block text-xs font-bold text-[#3E2E22] mb-1">
              Número de WhatsApp Recepción (Código País 58 + Teléfono)
            </label>
            <input
              type="text"
              value={formState.whatsappNumber}
              onChange={e => handleChange('whatsappNumber', e.target.value)}
              placeholder="584125558822"
              className="w-full bg-[#FDFBF7] border border-[#E5DED4] rounded-xl px-3.5 py-2.5 text-xs font-bold text-[#3E2E22] focus:ring-2 focus:ring-[#D97706] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#3E2E22] mb-1">
              Correo Electrónico Oficial Recepción
            </label>
            <input
              type="email"
              value={formState.emailRecipient}
              onChange={e => handleChange('emailRecipient', e.target.value)}
              placeholder="pedidos.rosquetes@gmail.com"
              className="w-full bg-[#FDFBF7] border border-[#E5DED4] rounded-xl px-3.5 py-2.5 text-xs font-bold text-[#3E2E22] focus:ring-2 focus:ring-[#D97706] focus:outline-none"
            />
          </div>
        </div>

        {/* Custom WhatsApp Template Textarea */}
        <div>
          <label className="block text-xs font-bold text-[#3E2E22] mb-1">
            Plantilla de Mensaje de WhatsApp (Variables: {'{ORDER_NUMBER}'}, {'{CUSTOMER_NAME}'}, {'{TOTAL_USD}'}, {'{TOTAL_VES}'}, etc.)
          </label>
          <textarea
            rows={5}
            value={formState.whatsappMessageTemplate}
            onChange={e => handleChange('whatsappMessageTemplate', e.target.value)}
            className="w-full bg-[#FDFBF7] border border-[#E5DED4] rounded-xl p-3 text-xs font-mono text-[#3E2E22] focus:ring-2 focus:ring-[#D97706] focus:outline-none"
          />
        </div>
      </div>

      {/* 3. Advanced Online Payment System & Custom Payment Methods Manager */}
      <PaymentMethodsManager
        paymentMethods={formState.paymentMethods || []}
        onlinePaymentsEnabled={formState.onlinePaymentsEnabled ?? true}
        autoVerifyOnlinePayments={formState.autoVerifyOnlinePayments ?? true}
        onToggleOnlinePayments={enabled => handleChange('onlinePaymentsEnabled', enabled)}
        onToggleAutoVerify={enabled => handleChange('autoVerifyOnlinePayments', enabled)}
        onUpdatePaymentMethods={methods => handleChange('paymentMethods', methods)}
      />

      {/* 4. Tasa de Cambio & Pago Móvil Aragua */}
      <div className="bg-white p-6 rounded-3xl border border-[#E5DED4] shadow-md space-y-5">
        <h3 className="font-serif text-xl font-bold text-[#3E2E22] border-b border-[#EFECE6] pb-3 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-[#D97706]" />
            <span>Tasa de Cambio Oficial (BCV) y Datos de Pago Móvil</span>
          </span>
          <CreditCard className="w-5 h-5 text-[#D97706]" />
        </h3>

        {/* BCV Automatic Rate Fetching & Manual Input Box */}
        <div className="bg-[#FDFBF7] p-4 rounded-2xl border border-[#E5DED4] space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-[#3E2E22] flex items-center gap-1">
                <Globe className="w-3.5 h-3.5 text-emerald-600" />
                <span>Sincronización BCV (bcv.org.ve)</span>
              </span>
              <p className="text-[11px] text-[#78604E] mt-0.5">
                Obtiene la tasa oficial directo de la web del Banco Central de Venezuela (<code className="bg-[#EFECE6] px-1 rounded">class="view-tipo-de-cambio-oficial-del-bcv"</code>). También puedes cambiarla manualmente.
              </p>
            </div>

            <button
              type="button"
              onClick={handleSyncBCV}
              disabled={isSyncingBCV}
              className="flex items-center gap-2 bg-[#D97706] hover:bg-[#B45309] text-white px-4 py-2.5 rounded-xl text-xs font-extrabold shadow-md transition-all cursor-pointer shrink-0 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncingBCV ? 'animate-spin' : ''}`} />
              <span>{isSyncingBCV ? 'Conectando a bcv.org.ve...' : 'Sincronizar Tasa BCV Ahora'}</span>
            </button>
          </div>

          {bcvStatusMsg && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-950 p-2.5 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{bcvStatusMsg}</span>
            </div>
          )}

          {bcvCurrencies && (
            <div className="bg-white p-2.5 rounded-xl border border-[#E5DED4] space-y-1">
              <span className="text-[10px] font-bold text-[#78604E] block uppercase tracking-wider">
                Resumen de Tasas Oficiales Publicadas en bcv.org.ve:
              </span>
              <div className="flex flex-wrap gap-2 text-xs font-mono">
                {Object.entries(bcvCurrencies).map(([code, val]) => (
                  <span
                    key={code}
                    className={`px-2.5 py-1 rounded-lg border font-bold flex items-center gap-1 ${
                      code === 'USD'
                        ? 'bg-[#D97706]/10 border-[#D97706] text-[#B45309] ring-1 ring-[#D97706]/20'
                        : 'bg-[#FDFBF7] border-[#E5DED4] text-[#3E2E22]'
                    }`}
                  >
                    <span>{code}:</span>
                    <span className="font-extrabold">{Number(val).toFixed(2)} Bs.</span>
                    {code === 'USD' && <span className="text-[9px] bg-[#D97706] text-white px-1 rounded font-sans">USD Selección</span>}
                  </span>
                ))}
              </div>
            </div>
          )}

          {formState.lastBCVSyncDate && (
            <p className="text-[10px] text-[#78604E] font-mono">
              Última sincronización con BCV: {new Date(formState.lastBCVSyncDate).toLocaleString('es-VE')}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#3E2E22] mb-1 flex items-center justify-between">
              <span>Tasa de Cambio (1 USD = Bs.) *</span>
              <span className="text-[10px] text-[#D97706] font-normal">Editable Manualmente</span>
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={formState.exchangeRateVES}
              onChange={e => handleChange('exchangeRateVES', parseFloat(e.target.value) || 0)}
              className="w-full bg-white border-2 border-[#D97706] rounded-xl px-3.5 py-2.5 text-sm font-black text-[#3E2E22] focus:ring-2 focus:ring-[#D97706] focus:outline-none shadow-xs font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#3E2E22] mb-1">Banco Pago Móvil</label>
            <input
              type="text"
              value={formState.pagoMovilBank}
              onChange={e => handleChange('pagoMovilBank', e.target.value)}
              className="w-full bg-[#FDFBF7] border border-[#E5DED4] rounded-xl px-3.5 py-2.5 text-xs font-bold text-[#3E2E22] focus:ring-2 focus:ring-[#D97706] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#3E2E22] mb-1">RIF / Cédula</label>
            <input
              type="text"
              value={formState.pagoMovilRif}
              onChange={e => handleChange('pagoMovilRif', e.target.value)}
              className="w-full bg-[#FDFBF7] border border-[#E5DED4] rounded-xl px-3.5 py-2.5 text-xs font-bold text-[#3E2E22] focus:ring-2 focus:ring-[#D97706] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#3E2E22] mb-1">Teléfono Pago Móvil</label>
            <input
              type="text"
              value={formState.pagoMovilPhone}
              onChange={e => handleChange('pagoMovilPhone', e.target.value)}
              className="w-full bg-[#FDFBF7] border border-[#E5DED4] rounded-xl px-3.5 py-2.5 text-xs font-bold text-[#3E2E22] focus:ring-2 focus:ring-[#D97706] focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* 5. Delivery Zones in Aragua */}
      <div className="bg-white p-6 rounded-3xl border border-[#E5DED4] shadow-md space-y-4">
        <div className="flex items-center justify-between border-b border-[#EFECE6] pb-3">
          <div>
            <h3 className="font-serif text-xl font-bold text-[#3E2E22]">Zonas de Despacho & Tarifas (Aragua)</h3>
            <p className="text-xs text-[#78604E]">Administra municipios y tarifas de envío en Maracay, Turmero, Cagua, etc.</p>
          </div>
          <button
            type="button"
            onClick={handleAddZone}
            className="flex items-center gap-1.5 bg-[#3E2E22] text-[#FDFBF7] hover:bg-[#5D4636] text-xs font-bold px-3 py-2 rounded-xl transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#D97706]" /> Agregar Zona
          </button>
        </div>

        <div className="space-y-3">
          {formState.deliveryZones.map(zone => (
            <div key={zone.id} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center bg-[#FDFBF7] p-3 rounded-2xl border border-[#E5DED4]">
              <div className="sm:col-span-4">
                <input
                  type="text"
                  value={zone.name}
                  onChange={e => handleZoneChange(zone.id, 'name', e.target.value)}
                  placeholder="Nombre de la zona"
                  className="w-full bg-white border border-[#E5DED4] rounded-lg px-2.5 py-1.5 text-xs font-bold text-[#3E2E22]"
                />
              </div>

              <div className="sm:col-span-3">
                <input
                  type="text"
                  value={zone.city}
                  onChange={e => handleZoneChange(zone.id, 'city', e.target.value)}
                  placeholder="Ciudad / Municipio"
                  className="w-full bg-white border border-[#E5DED4] rounded-lg px-2.5 py-1.5 text-xs text-[#3E2E22]"
                />
              </div>

              <div className="sm:col-span-2">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-bold text-[#3E2E22]">$</span>
                  <input
                    type="number"
                    step="0.50"
                    value={zone.feeUSD}
                    onChange={e => handleZoneChange(zone.id, 'feeUSD', parseFloat(e.target.value) || 0)}
                    className="w-full bg-white border border-[#E5DED4] rounded-lg px-2 py-1.5 text-xs font-mono font-bold text-[#3E2E22]"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <input
                  type="text"
                  value={zone.estimatedTime}
                  onChange={e => handleZoneChange(zone.id, 'estimatedTime', e.target.value)}
                  placeholder="Ej: 30 min"
                  className="w-full bg-white border border-[#E5DED4] rounded-lg px-2.5 py-1.5 text-xs text-[#3E2E22]"
                />
              </div>

              <div className="sm:col-span-1 text-right">
                <button
                  type="button"
                  onClick={() => handleDeleteZone(zone.id)}
                  className="p-1.5 text-rose-600 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
                  title="Eliminar Zona"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 6. Process / Highlights Cards Grid Editor */}
      <div className="bg-white p-6 rounded-3xl border border-[#E5DED4] shadow-md space-y-4">
        <div className="flex items-center justify-between border-b border-[#EFECE6] pb-3">
          <div>
            <h3 className="font-serif text-xl font-bold text-[#3E2E22] flex items-center gap-2">
              <Sparkle className="w-5 h-5 text-[#D97706]" />
              <span>Bloques Destacados al Final de la Página (Grids Informáticos)</span>
            </h3>
            <p className="text-xs text-[#78604E]">Personaliza los títulos, descripciones e íconos de las tarjetas informativas (ej: Ingredientes Naturales, Horneado Diario, Despacho Directo).</p>
          </div>
          <button
            type="button"
            onClick={handleAddFeatureCard}
            className="flex items-center gap-1.5 bg-[#3E2E22] text-[#FDFBF7] hover:bg-[#5D4636] text-xs font-bold px-3 py-2 rounded-xl transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#D97706]" /> Agregar Bloque
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(formState.featureCards || []).map((card, index) => (
            <div key={card.id} className="bg-[#FDFBF7] p-4 rounded-2xl border border-[#E5DED4] space-y-3 relative group">
              <div className="flex items-center justify-between border-b border-[#E5DED4] pb-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#D97706]">
                  Bloque #{index + 1}
                </span>
                <button
                  type="button"
                  onClick={() => handleDeleteFeatureCard(card.id)}
                  className="p-1 text-rose-600 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
                  title="Eliminar Bloque"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#3E2E22] mb-1">Emoji / Ícono</label>
                <input
                  type="text"
                  value={card.icon}
                  onChange={e => handleFeatureCardChange(card.id, 'icon', e.target.value)}
                  placeholder="Ej: 🍋, 🔥, 🚚"
                  className="w-full bg-white border border-[#E5DED4] rounded-lg px-2.5 py-1.5 text-base font-bold text-center text-[#3E2E22]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#3E2E22] mb-1">Título del Bloque *</label>
                <input
                  type="text"
                  required
                  value={card.title}
                  onChange={e => handleFeatureCardChange(card.id, 'title', e.target.value)}
                  placeholder="Ej: Ingredientes Naturales"
                  className="w-full bg-white border border-[#E5DED4] rounded-lg px-2.5 py-1.5 text-xs font-bold text-[#3E2E22]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#3E2E22] mb-1">Descripción Informativa *</label>
                <textarea
                  rows={3}
                  required
                  value={card.description}
                  onChange={e => handleFeatureCardChange(card.id, 'description', e.target.value)}
                  placeholder="Escribe aquí los detalles que verán los clientes..."
                  className="w-full bg-white border border-[#E5DED4] rounded-lg p-2 text-xs text-[#3E2E22] leading-relaxed resize-none"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 7. Edición de Imagen Principal (Hero Section) & Presentación Estrella */}
      <div className="bg-white p-6 rounded-3xl border border-[#E5DED4] shadow-md space-y-4">
        <div className="border-b border-[#EFECE6] pb-3">
          <span className="text-[11px] font-bold text-[#3E2E22] uppercase tracking-widest bg-[#F4EFEA] px-2.5 py-0.5 rounded-md border border-[#E5DED4]">
            Banner de Inicio / Hero Section
          </span>
          <h3 className="font-serif text-xl font-bold text-[#3E2E22] mt-1 flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-[#D97706]" />
            <span>Imagen Principal del Sitio ("Presentación Estrella")</span>
          </h3>
          <p className="text-xs text-[#78604E] mt-0.5">
            Cambia la imagen destacada que aparece al entrar a la página y personaliza la tarjeta del producto estrella.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          {/* Live Preview Column */}
          <div className="md:col-span-5 space-y-2">
            <label className="block text-xs font-bold text-[#3E2E22]">Vista Previa de la Tarjeta</label>
            <div className="relative rounded-2xl overflow-hidden shadow-lg border-2 border-[#5D4636] bg-[#3E2E22] group">
              <img
                src={formState.heroImageUrl || '/src/assets/images/rosquetes_hero_1786559273650.jpg'}
                alt="Vista previa hero"
                className="w-full h-56 object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/src/assets/images/rosquetes_hero_1786559273650.jpg';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#3E2E22]/90 via-transparent to-transparent flex flex-col justify-end p-4">
                <div className="bg-[#3E2E22]/90 backdrop-blur-md p-3 rounded-xl border border-[#5D4636] flex items-center justify-between text-white">
                  <div>
                    <p className="text-[10px] text-[#FEF3C7] font-semibold uppercase tracking-wider">
                      {formState.heroBadgeText || 'Presentación Estrella'}
                    </p>
                    <p className="text-xs font-serif font-bold text-[#FDFBF7]">
                      {formState.heroStarTitle || 'Docena Tradicional Glaseada'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-extrabold text-amber-400">
                      ${(formState.heroStarPriceUSD ?? 4.50).toFixed(2)} USD
                    </p>
                    <p className="text-[10px] font-mono text-[#EFECE6]">
                      {((formState.heroStarPriceUSD ?? 4.50) * formState.exchangeRateVES).toFixed(2)} Bs.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Controls Column */}
          <div className="md:col-span-7 space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#3E2E22] mb-1">
                Cargar nueva imagen desde tu equipo (JPG / PNG / WEBP)
              </label>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 bg-[#F4EFEA] hover:bg-[#EAE2D8] text-[#3E2E22] text-xs font-bold px-4 py-2.5 rounded-xl border border-[#E5DED4] transition-colors cursor-pointer">
                  <Upload className="w-4 h-4 text-[#D97706]" />
                  <span>Seleccionar Imagen Local</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleHeroImageUpload}
                    className="hidden"
                  />
                </label>
                {formState.heroImageUrl && formState.heroImageUrl !== '/src/assets/images/rosquetes_hero_1786559273650.jpg' && (
                  <button
                    type="button"
                    onClick={() => setFormState(prev => ({ ...prev, heroImageUrl: '/src/assets/images/rosquetes_hero_1786559273650.jpg' }))}
                    className="text-xs text-rose-600 hover:text-rose-800 font-semibold underline cursor-pointer"
                  >
                    Restaurar imagen original
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#3E2E22] mb-1">
                O introduce URL de imagen web
              </label>
              <input
                type="text"
                value={formState.heroImageUrl || ''}
                onChange={e => setFormState(prev => ({ ...prev, heroImageUrl: e.target.value }))}
                placeholder="https://... o /src/assets/..."
                className="w-full bg-[#FDFBF7] border border-[#E5DED4] rounded-xl px-3 py-2 text-xs text-[#3E2E22] font-mono"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-[#EFECE6]">
              <div>
                <label className="block text-[11px] font-bold text-[#3E2E22] mb-1">Insignia Superior</label>
                <input
                  type="text"
                  value={formState.heroBadgeText || ''}
                  onChange={e => setFormState(prev => ({ ...prev, heroBadgeText: e.target.value }))}
                  placeholder="Ej: Presentación Estrella"
                  className="w-full bg-[#FDFBF7] border border-[#E5DED4] rounded-xl px-3 py-2 text-xs font-semibold text-[#3E2E22]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#3E2E22] mb-1">Nombre del Producto Destacado</label>
                <input
                  type="text"
                  value={formState.heroStarTitle || ''}
                  onChange={e => setFormState(prev => ({ ...prev, heroStarTitle: e.target.value }))}
                  placeholder="Ej: Docena Tradicional Glaseada"
                  className="w-full bg-[#FDFBF7] border border-[#E5DED4] rounded-xl px-3 py-2 text-xs font-semibold text-[#3E2E22]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#3E2E22] mb-1">Precio Promocional (USD)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formState.heroStarPriceUSD ?? 4.50}
                  onChange={e => setFormState(prev => ({ ...prev, heroStarPriceUSD: parseFloat(e.target.value) || 0 }))}
                  className="w-full bg-[#FDFBF7] border border-[#E5DED4] rounded-xl px-3 py-2 text-xs font-bold text-[#3E2E22]"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 8. Edición de Credenciales del Administrador */}
      <div className="bg-white p-6 rounded-3xl border border-[#E5DED4] shadow-md space-y-4">
        <div className="border-b border-[#EFECE6] pb-3">
          <span className="text-[11px] font-bold text-rose-700 uppercase tracking-widest bg-rose-50 px-2.5 py-0.5 rounded-md border border-rose-200">
            Seguridad & Credenciales de Acceso
          </span>
          <h3 className="font-serif text-xl font-bold text-[#3E2E22] mt-1 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-rose-600" />
            <span>Cambiar Usuario y Contraseña de Administrador</span>
          </h3>
          <p className="text-xs text-[#78604E] mt-0.5">
            Personaliza el usuario y la clave requeridos para ingresar al Panel de Administración de la plataforma.
          </p>
        </div>

        {passwordMismatchError && (
          <div className="bg-rose-50 border border-rose-300 text-rose-800 p-3 rounded-xl text-xs font-semibold">
            ⚠️ {passwordMismatchError}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#3E2E22] mb-1">Usuario de Administración *</label>
            <input
              type="text"
              required
              value={formState.adminUsername || 'admin'}
              onChange={e => {
                setPasswordMismatchError('');
                setFormState(prev => ({ ...prev, adminUsername: e.target.value }));
              }}
              placeholder="Ej: admin, donrosquete, gerencia"
              className="w-full bg-[#FDFBF7] border border-[#E5DED4] rounded-xl px-3 py-2 text-xs font-bold text-[#3E2E22] focus:ring-2 focus:ring-[#D97706]"
            />
            <p className="text-[10px] text-[#78604E] mt-1">Nombre de usuario para iniciar sesión.</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#3E2E22] mb-1">Nueva Contraseña / PIN *</label>
            <input
              type="password"
              required
              value={formState.adminPassword || 'admin2026'}
              onChange={e => {
                setPasswordMismatchError('');
                setFormState(prev => ({ ...prev, adminPassword: e.target.value }));
              }}
              placeholder="Introduce la nueva clave"
              className="w-full bg-[#FDFBF7] border border-[#E5DED4] rounded-xl px-3 py-2 text-xs font-bold text-[#3E2E22] focus:ring-2 focus:ring-[#D97706]"
            />
            <p className="text-[10px] text-[#78604E] mt-1">Clave de acceso para la cuenta.</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#3E2E22] mb-1">Confirmar Nueva Contraseña *</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={e => {
                setPasswordMismatchError('');
                setConfirmPassword(e.target.value);
              }}
              placeholder="Repite la contraseña"
              className={`w-full bg-[#FDFBF7] border rounded-xl px-3 py-2 text-xs font-bold text-[#3E2E22] focus:ring-2 focus:ring-[#D97706] ${
                confirmPassword && confirmPassword !== (formState.adminPassword || 'admin2026')
                  ? 'border-rose-400 bg-rose-50'
                  : 'border-[#E5DED4]'
              }`}
            />
            <p className="text-[10px] text-[#78604E] mt-1">
              {confirmPassword && confirmPassword === (formState.adminPassword || 'admin2026')
                ? '✅ Las contraseñas coinciden'
                : 'Debe ser idéntica a la nueva contraseña.'}
            </p>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end pt-4">
        <button
          type="submit"
          disabled={isSaving}
          className="flex items-center gap-2 bg-[#D97706] hover:bg-[#B45309] text-white font-extrabold px-8 py-3.5 rounded-2xl text-sm shadow-xl transition-all cursor-pointer active:scale-95 disabled:opacity-50"
        >
          <Save className="w-5 h-5" />
          <span>{isSaving ? 'Guardando Cambios...' : 'Guardar Configuración Super Admin'}</span>
        </button>
      </div>
    </form>
  );
};
