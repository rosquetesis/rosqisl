import React, { useState } from 'react';
import {
  X,
  Trash2,
  Plus,
  Minus,
  Send,
  MapPin,
  CreditCard,
  ShoppingBag,
  ShieldCheck,
  Phone,
  Mail,
  CheckCircle2,
  Smartphone,
  Zap,
  QrCode,
  Wallet,
  DollarSign,
  Building,
  Lock,
  Sparkles,
  Check,
  AlertCircle,
} from 'lucide-react';
import { AdminSettings, CartItem, DeliveryZone, PaymentMethodType, CustomPaymentMethod } from '../types';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  settings: AdminSettings;
  onOrderSubmitted: (orderData: any, customerData?: any) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  settings,
  onOrderSubmitted,
}) => {
  const [selectedZoneId, setSelectedZoneId] = useState<string>(settings.deliveryZones[0]?.id || 'zone-1');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [addressDetail, setAddressDetail] = useState('');
  
  // Available Payment Methods Filtered by Enabled State
  const activeMethods = (settings.paymentMethods && settings.paymentMethods.length > 0)
    ? settings.paymentMethods.filter(m => m.enabled)
    : [];

  const initialMethodId = activeMethods.length > 0 ? activeMethods[0].id : 'pago_movil';
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>(initialMethodId);
  const [paymentReference, setPaymentReference] = useState('');
  const [bankOrigin, setBankOrigin] = useState('');
  const [payerName, setPayerName] = useState('');
  const [notes, setNotes] = useState('');

  // Online Card Gateway Fields
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardHolder, setCardHolder] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifyingOnline, setIsVerifyingOnline] = useState(false);
  const [onlineVerifiedTx, setOnlineVerifiedTx] = useState<{ txId: string; timestamp: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const selectedZone = settings.deliveryZones.find(z => z.id === selectedZoneId) || settings.deliveryZones[0];
  const deliveryFeeUSD = selectedZone ? selectedZone.feeUSD : 0;

  const itemsSubtotalUSD = cartItems.reduce((acc, item) => acc + (item.product.priceUSD * item.quantity), 0);
  const totalUSD = itemsSubtotalUSD + deliveryFeeUSD;
  const totalVES = totalUSD * settings.exchangeRateVES;

  const selectedMethodObj = activeMethods.find(m => m.id === paymentMethod);
  const isOnlineSystemActive = settings.onlinePaymentsEnabled ?? true;

  // Icon selector helper
  const renderMethodIcon = (iconName?: string) => {
    switch (iconName) {
      case 'smartphone':
        return <Smartphone className="w-4 h-4 text-[#D97706]" />;
      case 'zap':
        return <Zap className="w-4 h-4 text-amber-500" />;
      case 'credit-card':
        return <CreditCard className="w-4 h-4 text-emerald-600" />;
      case 'qr-code':
        return <QrCode className="w-4 h-4 text-amber-600" />;
      case 'wallet':
        return <Wallet className="w-4 h-4 text-indigo-600" />;
      case 'dollar-sign':
        return <DollarSign className="w-4 h-4 text-emerald-600" />;
      case 'building':
        return <Building className="w-4 h-4 text-amber-700" />;
      default:
        return <CreditCard className="w-4 h-4 text-[#D97706]" />;
    }
  };

  const handleVerifyOnlineGateway = async () => {
    setIsVerifyingOnline(true);
    setErrorMessage('');

    try {
      // Direct call to online gateway verification API
      const res = await fetch('/api/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentMethod,
          amountUSD: totalUSD,
          amountVES: totalVES,
          reference: paymentReference,
          cardData: paymentMethod === 'tarjeta_pasarela' ? { cardHolder, cardNumber: cardNumber.slice(-4) } : undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setOnlineVerifiedTx({
          txId: data.transactionId,
          timestamp: data.timestamp,
        });
      } else {
        throw new Error('Error al verificar la transacción en la pasarela.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error procesando el pago en línea.');
    } finally {
      setIsVerifyingOnline(false);
    }
  };

  const handleSubmitOrder = async (e?: React.FormEvent, preferredChannel?: 'whatsapp' | 'email') => {
    if (e) e.preventDefault();
    if (cartItems.length === 0) {
      setErrorMessage('Tu pedido está vacío. Añade algunos rosquetes antes de enviar.');
      return;
    }
    if (!customerName.trim() || !customerPhone.trim() || !addressDetail.trim()) {
      setErrorMessage('Por favor completa tu Nombre, Teléfono y Dirección de entrega en Aragua.');
      return;
    }

    if (isOnlineSystemActive && selectedMethodObj?.requiresReference && !paymentReference.trim() && !onlineVerifiedTx) {
      setErrorMessage(`Por favor ingresa el N° de referencia para el pago con ${selectedMethodObj.name}.`);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    const formattedItems = cartItems.map(item => ({
      productId: item.product.id,
      productName: item.product.name,
      unitType: item.product.unitType,
      quantity: item.quantity,
      unitPriceUSD: item.product.priceUSD,
      subtotalUSD: item.product.priceUSD * item.quantity,
    }));

    const isAutoVerified = isOnlineSystemActive && (settings.autoVerifyOnlinePayments || !!onlineVerifiedTx);
    const actualChannel = preferredChannel || (settings.dispatchMode === 'email' ? 'email' : 'whatsapp');

    const orderPayload = {
      customerName,
      customerPhone,
      customerEmail: customerEmail.trim() || undefined,
      deliveryZone: selectedZone.name,
      deliveryCity: selectedZone.city,
      addressDetail,
      deliveryFeeUSD,
      items: formattedItems,
      totalUSD,
      exchangeRateVES: settings.exchangeRateVES,
      totalVES,
      paymentMethod,
      paymentReference: onlineVerifiedTx?.txId || paymentReference.trim() || undefined,
      paymentVerified: isAutoVerified,
      paidOnline: isOnlineSystemActive,
      paymentDetails: {
        bankOrigin: bankOrigin.trim() || undefined,
        payerName: payerName.trim() || cardHolder.trim() || undefined,
        paymentTimestamp: new Date().toISOString(),
        onlineGatewayTxId: onlineVerifiedTx?.txId,
      },
      notes: notes.trim() || undefined,
      dispatchMethodUsed: settings.dispatchMode === 'both' ? (preferredChannel || 'both') : settings.dispatchMode,
    };

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload),
      });

      if (!response.ok) {
        throw new Error('No se pudo procesar la orden en el servidor');
      }

      const data = await response.json();
      const savedOrder = data.order;
      const savedCustomer = data.customer;

      // Handle WhatsApp redirection if channel is whatsapp or mode is whatsapp/both
      const shouldLaunchWA = actualChannel === 'whatsapp' || settings.dispatchMode === 'whatsapp' || (settings.dispatchMode === 'both' && preferredChannel !== 'email');

      if (shouldLaunchWA) {
        const itemsText = cartItems
          .map(i => `• ${i.quantity}x ${i.product.name} (${i.product.unitType}) - $${(i.product.priceUSD * i.quantity).toFixed(2)}`)
          .join('\n');

        let message = settings.whatsappMessageTemplate
          .replace('{ORDER_NUMBER}', savedOrder.orderNumber)
          .replace('{CUSTOMER_NAME}', customerName)
          .replace('{CUSTOMER_PHONE}', customerPhone)
          .replace('{DELIVERY_ZONE}', selectedZone.name)
          .replace('{DELIVERY_CITY}', selectedZone.city)
          .replace('{ADDRESS}', addressDetail)
          .replace('{ORDER_ITEMS}', itemsText)
          .replace('{SUBTOTAL_USD}', itemsSubtotalUSD.toFixed(2))
          .replace('{DELIVERY_FEE_USD}', deliveryFeeUSD.toFixed(2))
          .replace('{TOTAL_USD}', totalUSD.toFixed(2))
          .replace('{TOTAL_VES}', totalVES.toFixed(2))
          .replace('{EXCHANGE_RATE}', settings.exchangeRateVES.toFixed(2))
          .replace('{PAYMENT_METHOD}', selectedMethodObj ? selectedMethodObj.name : paymentMethod.toUpperCase())
          .replace('{PAYMENT_REF}', savedOrder.paymentReference || 'Pago verificado online');

        const encodedMsg = encodeURIComponent(message);
        const waUrl = `https://wa.me/${settings.whatsappNumber}?text=${encodedMsg}`;

        // Trigger WhatsApp
        window.open(waUrl, '_blank');
      }

      onOrderSubmitted(savedOrder, savedCustomer);
      onClearCart();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Ocurrió un error guardando el pedido');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-lg bg-[#FDFBF7] h-full flex flex-col justify-between shadow-2xl overflow-hidden border-l border-[#E5DED4] animate-in slide-in-from-right duration-300">
        {/* Drawer Header */}
        <div className="bg-[#3E2E22] text-[#FDFBF7] p-4 sm:p-5 flex items-center justify-between border-b border-[#5D4636]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#D97706] text-white flex items-center justify-center font-bold">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-[#FDFBF7]">
                Tu Pedido de Rosquetes
              </h3>
              <p className="text-xs text-[#FEF3C7]">
                {cartItems.length} {cartItems.length === 1 ? 'producto' : 'productos'} en el carrito
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[#5D4636] text-[#FEF3C7] hover:text-white transition-colors"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-6">
          {errorMessage && (
            <div className="bg-rose-100 border border-rose-300 text-rose-900 p-3 rounded-xl text-xs font-semibold">
              ⚠️ {errorMessage}
            </div>
          )}

          {cartItems.length === 0 ? (
            <div className="text-center py-16 space-y-4">
              <div className="w-16 h-16 rounded-full bg-[#F4EFEA] text-[#4A3728] flex items-center justify-center mx-auto text-2xl border border-[#E5DED4]">
                🍩
              </div>
              <p className="font-serif font-bold text-[#3E2E22] text-lg">Tu carrito está vacío</p>
              <p className="text-xs text-[#78604E] max-w-xs mx-auto">
                Explora el catálogo de rosquetes canarios y añade tus presentaciones favoritas.
              </p>
            </div>
          ) : (
            <>
              {/* Order Items List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-[#E5DED4] pb-2">
                  <span className="text-xs font-bold text-[#3E2E22] uppercase">Resumen de Productos</span>
                  <button
                    onClick={onClearCart}
                    className="text-xs text-rose-700 hover:text-rose-900 font-semibold flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Vaciar
                  </button>
                </div>

                <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                  {cartItems.map(item => (
                    <div
                      key={item.product.id}
                      className="bg-white p-3 rounded-2xl border border-[#E5DED4] shadow-xs flex items-center justify-between gap-3"
                    >
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-12 h-12 rounded-xl object-cover shrink-0"
                        referrerPolicy="no-referrer"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-serif font-bold text-xs text-[#3E2E22] truncate">
                          {item.product.name}
                        </h4>
                        <p className="text-[11px] text-[#78604E] font-mono">
                          ${item.product.priceUSD.toFixed(2)} c/u
                        </p>
                      </div>

                      <div className="flex items-center gap-1 bg-[#F4EFEA] rounded-lg p-1 border border-[#E5DED4]">
                        <button
                          onClick={() => onUpdateQuantity(item.product.id, -1)}
                          className="w-5 h-5 rounded bg-white hover:bg-[#EFECE6] text-[#3E2E22] font-bold text-xs flex items-center justify-center"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-5 text-center text-xs font-extrabold text-[#3E2E22]">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => onUpdateQuantity(item.product.id, 1)}
                          className="w-5 h-5 rounded bg-white hover:bg-[#EFECE6] text-[#3E2E22] font-bold text-xs flex items-center justify-center"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        onClick={() => onRemoveItem(item.product.id)}
                        className="p-1 text-amber-600 hover:text-rose-600 transition-colors"
                        title="Eliminar"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delivery Zone Selector in Aragua */}
              <div className="bg-white p-4 rounded-2xl border border-[#E5DED4] space-y-3">
                <label className="block text-xs font-bold text-[#3E2E22] flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-[#D97706]" />
                  <span>Zona de Despacho en Aragua</span>
                </label>
                <select
                  value={selectedZoneId}
                  onChange={e => setSelectedZoneId(e.target.value)}
                  className="w-full bg-[#FDFBF7] border border-[#E5DED4] rounded-xl p-2.5 text-xs font-semibold text-[#3E2E22] focus:outline-none focus:ring-2 focus:ring-[#D97706]"
                >
                  {settings.deliveryZones.map(zone => (
                    <option key={zone.id} value={zone.id}>
                      {zone.name} ({zone.city}) — {zone.feeUSD === 0 ? 'Gratis' : `$${zone.feeUSD.toFixed(2)} USD`}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-[#78604E] italic">
                  Tiempo estimado de entrega: {selectedZone.estimatedTime}
                </p>
              </div>

              {/* Customer Contact Information Form */}
              <form onSubmit={handleSubmitOrder} className="space-y-4">
                <div className="bg-white p-4 rounded-2xl border border-[#E5DED4] space-y-3">
                  <h4 className="text-xs font-bold text-[#3E2E22] uppercase border-b border-[#EFECE6] pb-2">
                    Datos del Cliente
                  </h4>

                  <div>
                    <label className="block text-[11px] font-bold text-[#4A3728] mb-1">Nombre Completo *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: María Alejandra Pérez"
                      value={customerName}
                      onChange={e => setCustomerName(e.target.value)}
                      className="w-full bg-[#FDFBF7] border border-[#E5DED4] rounded-xl px-3 py-2 text-xs font-medium text-[#3E2E22] focus:ring-2 focus:ring-[#D97706] focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-[#4A3728] mb-1">Teléfono (WhatsApp) *</label>
                      <input
                        type="tel"
                        required
                        placeholder="0412-1234567"
                        value={customerPhone}
                        onChange={e => setCustomerPhone(e.target.value)}
                        className="w-full bg-[#FDFBF7] border border-[#E5DED4] rounded-xl px-3 py-2 text-xs font-medium text-[#3E2E22] focus:ring-2 focus:ring-[#D97706] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#4A3728] mb-1">Correo (Opcional)</label>
                      <input
                        type="email"
                        placeholder="cliente@gmail.com"
                        value={customerEmail}
                        onChange={e => setCustomerEmail(e.target.value)}
                        className="w-full bg-[#FDFBF7] border border-[#E5DED4] rounded-xl px-3 py-2 text-xs font-medium text-[#3E2E22] focus:ring-2 focus:ring-[#D97706] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#4A3728] mb-1">Dirección Exacta de Entrega *</label>
                    <textarea
                      required
                      rows={2}
                      placeholder="Ej: Urb. Base Aragua, Res. Los Apamates, Apto 3B, punto de referencia..."
                      value={addressDetail}
                      onChange={e => setAddressDetail(e.target.value)}
                      className="w-full bg-[#FDFBF7] border border-[#E5DED4] rounded-xl px-3 py-2 text-xs font-medium text-[#3E2E22] focus:ring-2 focus:ring-[#D97706] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Payment Method Section tailored for Venezuela */}
                <div className="bg-white p-4 rounded-2xl border border-[#E5DED4] space-y-3">
                  <div className="border-b border-[#EFECE6] pb-2 flex items-center justify-between">
                    <h4 className="text-xs font-bold text-[#3E2E22] uppercase flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4 text-[#D97706]" />
                      <span>Método de Pago Online / Directo</span>
                    </h4>
                    {isOnlineSystemActive && (
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1">
                        <Lock className="w-3 h-3 text-emerald-600" /> Pasarela Segura 24/7
                      </span>
                    )}
                  </div>

                  {/* Payment Methods Choice Buttons */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {activeMethods.map(m => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          setPaymentMethod(m.id);
                          setOnlineVerifiedTx(null);
                        }}
                        className={`p-2.5 rounded-xl border text-left transition-all flex items-center justify-between gap-2 cursor-pointer ${
                          paymentMethod === m.id
                            ? 'bg-[#3E2E22] text-[#FDFBF7] border-[#3E2E22] font-bold shadow-xs'
                            : 'bg-[#FDFBF7] text-[#4A3728] border-[#E5DED4] font-medium hover:border-[#D97706]'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {renderMethodIcon(m.iconName)}
                          <span className="truncate">{m.name}</span>
                        </div>
                        <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border shrink-0 ${
                          paymentMethod === m.id
                            ? 'bg-amber-500/30 text-amber-300 border-amber-400/50'
                            : 'bg-[#EFECE6] text-[#4A3728] border-[#E5DED4]'
                        }`}>
                          {m.currency}
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Selected Payment Method Instructions and Account Details */}
                  {selectedMethodObj && (
                    <div className="bg-[#FEF3C7]/60 p-3.5 rounded-xl text-xs space-y-2 border border-[#FDE68A] animate-in fade-in">
                      <div className="flex items-center justify-between border-b border-[#FDE68A] pb-1.5">
                        <p className="font-bold text-[#3E2E22] text-[11px] uppercase tracking-wider flex items-center gap-1">
                          {renderMethodIcon(selectedMethodObj.iconName)}
                          <span>Datos para procesar {selectedMethodObj.name}:</span>
                        </p>
                        {selectedMethodObj.badgeText && (
                          <span className="text-[10px] font-bold bg-[#D97706] text-white px-2 py-0.5 rounded-md">
                            {selectedMethodObj.badgeText}
                          </span>
                        )}
                      </div>

                      {selectedMethodObj.bankOrPlatformName && (
                        <p className="text-[#4A3728]"><strong>Banco/Plataforma:</strong> {selectedMethodObj.bankOrPlatformName}</p>
                      )}
                      {selectedMethodObj.accountHolder && (
                        <p className="text-[#4A3728]"><strong>Titular de Cuenta:</strong> {selectedMethodObj.accountHolder}</p>
                      )}
                      {selectedMethodObj.accountNumberOrRif && (
                        <p className="text-[#4A3728]"><strong>RIF/Cédula/N° Cuenta:</strong> {selectedMethodObj.accountNumberOrRif}</p>
                      )}
                      {selectedMethodObj.phoneNumber && (
                        <p className="text-[#4A3728]"><strong>Teléfono Pago Móvil:</strong> {selectedMethodObj.phoneNumber}</p>
                      )}
                      {selectedMethodObj.emailOrPayId && (
                        <p className="text-[#4A3728]"><strong>Correo / Pay ID:</strong> {selectedMethodObj.emailOrPayId}</p>
                      )}

                      {selectedMethodObj.instructions && (
                        <div className="bg-white/80 p-2.5 rounded-lg border border-[#FDE68A] text-[11px] text-[#3E2E22] leading-relaxed whitespace-pre-line font-medium">
                          {selectedMethodObj.instructions}
                        </div>
                      )}

                      {/* Online Credit/Debit Card Direct Gateway Form */}
                      {paymentMethod === 'tarjeta_pasarela' ? (
                        <div className="pt-2 border-t border-[#FDE68A] space-y-2">
                          <p className="text-[11px] font-bold text-[#3E2E22] uppercase flex items-center gap-1">
                            <Lock className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Formulario Encriptado de Tarjeta Deb/Crédito:</span>
                          </p>

                          <div className="space-y-2 bg-white p-3 rounded-xl border border-[#E5DED4]">
                            <div>
                              <label className="block text-[10px] font-bold text-[#4A3728] mb-0.5">Nombre en la Tarjeta</label>
                              <input
                                type="text"
                                placeholder="Ej: MARIA PEREZ"
                                value={cardHolder}
                                onChange={e => setCardHolder(e.target.value.toUpperCase())}
                                className="w-full bg-[#FDFBF7] border border-[#E5DED4] rounded-lg px-2.5 py-1.5 text-xs font-bold text-[#3E2E22]"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-[#4A3728] mb-0.5">Número de Tarjeta (16 dígitos)</label>
                              <input
                                type="text"
                                maxLength={19}
                                placeholder="4500 0000 0000 0000"
                                value={cardNumber}
                                onChange={e => setCardNumber(e.target.value)}
                                className="w-full bg-[#FDFBF7] border border-[#E5DED4] rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-[#3E2E22]"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[10px] font-bold text-[#4A3728] mb-0.5">Vencimiento (MM/AA)</label>
                                <input
                                  type="text"
                                  placeholder="12/28"
                                  value={cardExpiry}
                                  onChange={e => setCardExpiry(e.target.value)}
                                  className="w-full bg-[#FDFBF7] border border-[#E5DED4] rounded-lg px-2.5 py-1.5 text-xs font-mono text-[#3E2E22]"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-[#4A3728] mb-0.5">CVC / CVV</label>
                                <input
                                  type="password"
                                  maxLength={4}
                                  placeholder="123"
                                  value={cardCvv}
                                  onChange={e => setCardCvv(e.target.value)}
                                  className="w-full bg-[#FDFBF7] border border-[#E5DED4] rounded-lg px-2.5 py-1.5 text-xs font-mono text-[#3E2E22]"
                                />
                              </div>
                            </div>

                            {!onlineVerifiedTx ? (
                              <button
                                type="button"
                                onClick={handleVerifyOnlineGateway}
                                disabled={isVerifyingOnline || !cardNumber || !cardHolder}
                                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                              >
                                {isVerifyingOnline ? (
                                  <span>Verificando con Pasarela...</span>
                                ) : (
                                  <>
                                    <ShieldCheck className="w-4 h-4" />
                                    <span>Verificar y Procesar Pago Online en Línea</span>
                                  </>
                                )}
                              </button>
                            ) : (
                              <div className="p-2.5 bg-emerald-50 border border-emerald-300 rounded-lg text-emerald-900 text-xs font-bold flex items-center gap-2">
                                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                                <div>
                                  <p>¡Tarjeta Aprobada Exitosamente!</p>
                                  <p className="text-[10px] font-mono text-emerald-700">N° Transacción: {onlineVerifiedTx.txId}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        /* Reference Number Input for Pago Móvil / Zelle / Binance / Zinli */
                        selectedMethodObj.requiresReference && (
                          <div className="pt-2 border-t border-[#FDE68A] space-y-2">
                            <div>
                              <label className="block text-[11px] font-bold text-[#3E2E22] mb-1">
                                N° de Referencia / Comprobante de Transacción *
                              </label>
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  required
                                  placeholder="Ej: 84920159 / Hash"
                                  value={paymentReference}
                                  onChange={e => setPaymentReference(e.target.value)}
                                  className="flex-1 bg-white border border-[#E5DED4] rounded-lg px-2.5 py-1.5 text-xs font-bold text-[#3E2E22]"
                                />
                                {isOnlineSystemActive && (
                                  <button
                                    type="button"
                                    onClick={handleVerifyOnlineGateway}
                                    disabled={isVerifyingOnline || !paymentReference.trim()}
                                    className="bg-[#D97706] hover:bg-[#B45309] text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer disabled:opacity-50 flex items-center gap-1"
                                  >
                                    {isVerifyingOnline ? 'Verificando...' : 'Verificar Online'}
                                  </button>
                                )}
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[10px] font-bold text-[#4A3728] mb-0.5">Banco Emisor / Origen (Opcional)</label>
                                <input
                                  type="text"
                                  placeholder="Ej: Banesco, Mercantil"
                                  value={bankOrigin}
                                  onChange={e => setBankOrigin(e.target.value)}
                                  className="w-full bg-white border border-[#E5DED4] rounded-lg px-2.5 py-1 text-xs text-[#3E2E22]"
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold text-[#4A3728] mb-0.5">Nombre del Pagador (Opcional)</label>
                                <input
                                  type="text"
                                  placeholder="Ej: Juan Pérez"
                                  value={payerName}
                                  onChange={e => setPayerName(e.target.value)}
                                  className="w-full bg-white border border-[#E5DED4] rounded-lg px-2.5 py-1 text-xs text-[#3E2E22]"
                                />
                              </div>
                            </div>

                            {onlineVerifiedTx && (
                              <div className="p-2 bg-emerald-100 border border-emerald-300 rounded-lg text-emerald-900 text-[11px] font-bold flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                <span>¡Referencia Validada Online en Tiempo Real! (ID: {onlineVerifiedTx.txId})</span>
                              </div>
                            )}
                          </div>
                        )
                      )}
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-bold text-[#4A3728] mb-1">Notas o Instrucciones Especiales</label>
                    <input
                      type="text"
                      placeholder="Ej: Entregar después de las 3pm, llamar al llegar..."
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      className="w-full bg-[#FDFBF7] border border-[#E5DED4] rounded-xl px-3 py-2 text-xs font-medium text-[#3E2E22] focus:ring-2 focus:ring-[#D97706] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Total Summary Footer inside Drawer */}
                <div className="bg-[#3E2E22] text-[#FDFBF7] p-4 rounded-2xl space-y-2 border border-[#5D4636]">
                  <div className="flex justify-between text-xs text-[#EFECE6]">
                    <span>Subtotal Productos:</span>
                    <span>${itemsSubtotalUSD.toFixed(2)} USD</span>
                  </div>
                  <div className="flex justify-between text-xs text-[#EFECE6]">
                    <span>Delivery ({selectedZone.name}):</span>
                    <span>${deliveryFeeUSD.toFixed(2)} USD</span>
                  </div>
                  <div className="pt-2 border-t border-[#5D4636] flex items-baseline justify-between">
                    <div>
                      <span className="text-xs text-[#FEF3C7] font-bold uppercase">Total a Pagar</span>
                      <p className="text-2xl font-extrabold text-amber-400 font-serif">${totalUSD.toFixed(2)} USD</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-amber-400 font-mono block">@ Tasa {settings.exchangeRateVES.toFixed(2)} Bs.</span>
                      <span className="text-base font-extrabold text-[#FEF3C7] font-mono">{totalVES.toFixed(2)} Bs.</span>
                    </div>
                  </div>

                  {/* Mode Indicator & Action Button(s) */}
                  <div className="pt-2 space-y-2">
                    {settings.dispatchMode === 'both' ? (
                      <div className="space-y-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={(e) => handleSubmitOrder(e, 'whatsapp')}
                            disabled={isSubmitting}
                            id="submit-order-wa-btn"
                            className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3 px-3 rounded-xl text-xs sm:text-sm shadow-xl transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                          >
                            <Send className="w-4 h-4 text-white shrink-0" />
                            <span>Enviar por WhatsApp</span>
                          </button>

                          <button
                            type="button"
                            onClick={(e) => handleSubmitOrder(e, 'email')}
                            disabled={isSubmitting}
                            id="submit-order-email-btn"
                            className="w-full flex items-center justify-center gap-2 bg-[#D97706] hover:bg-[#B45309] text-white font-extrabold py-3 px-3 rounded-xl text-xs sm:text-sm shadow-xl transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                          >
                            <Mail className="w-4 h-4 text-white shrink-0" />
                            <span>Enviar por Correo</span>
                          </button>
                        </div>
                        <p className="text-[10px] text-center text-[#FEF3C7]">
                          ⚡ <strong>Modo Dual Activo:</strong> Puedes enviar tu pedido directamente por <strong>WhatsApp</strong> ({settings.whatsappNumber}) o por <strong>Correo</strong> ({settings.emailRecipient}).
                        </p>
                      </div>
                    ) : (
                      <div>
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          id="submit-order-btn"
                          className={`w-full flex items-center justify-center gap-2 text-white font-extrabold py-3 rounded-xl text-sm shadow-xl transition-all active:scale-95 cursor-pointer disabled:opacity-50 ${
                            settings.dispatchMode === 'whatsapp'
                              ? 'bg-emerald-600 hover:bg-emerald-700'
                              : 'bg-[#D97706] hover:bg-[#B45309]'
                          }`}
                        >
                          {isSubmitting ? (
                            <span>Procesando Pedido...</span>
                          ) : settings.dispatchMode === 'email' ? (
                            <>
                              <Mail className="w-4 h-4 text-white" />
                              <span>Enviar Pedido por Correo Electrónico</span>
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4 text-white" />
                              <span>Enviar Pedido por WhatsApp</span>
                            </>
                          )}
                        </button>
                        <p className="text-[10px] text-center text-[#FEF3C7] mt-1.5">
                          {settings.dispatchMode === 'email'
                            ? `El pedido será enviado directamente al correo oficial: ${settings.emailRecipient}`
                            : `Serás redirigido a WhatsApp (${settings.whatsappNumber}) con el mensaje formateado.`}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
