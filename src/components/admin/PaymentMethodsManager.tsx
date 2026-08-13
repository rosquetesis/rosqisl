import React, { useState } from 'react';
import {
  Smartphone,
  Zap,
  CreditCard,
  DollarSign,
  Building,
  Wallet,
  QrCode,
  Check,
  X,
  Plus,
  Trash2,
  Edit3,
  Power,
  ShieldCheck,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';
import { CustomPaymentMethod } from '../../types';

interface PaymentMethodsManagerProps {
  paymentMethods: CustomPaymentMethod[];
  onlinePaymentsEnabled: boolean;
  autoVerifyOnlinePayments: boolean;
  onToggleOnlinePayments: (enabled: boolean) => void;
  onToggleAutoVerify: (enabled: boolean) => void;
  onUpdatePaymentMethods: (updatedMethods: CustomPaymentMethod[]) => void;
}

export const PaymentMethodsManager: React.FC<PaymentMethodsManagerProps> = ({
  paymentMethods,
  onlinePaymentsEnabled,
  autoVerifyOnlinePayments,
  onToggleOnlinePayments,
  onToggleAutoVerify,
  onUpdatePaymentMethods,
}) => {
  const [editingMethod, setEditingMethod] = useState<CustomPaymentMethod | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Helper to render method icon
  const renderIcon = (iconName: string, className: string = 'w-5 h-5') => {
    switch (iconName) {
      case 'smartphone':
        return <Smartphone className={className} />;
      case 'zap':
        return <Zap className={className} />;
      case 'credit-card':
        return <CreditCard className={className} />;
      case 'dollar-sign':
        return <DollarSign className={className} />;
      case 'building':
        return <Building className={className} />;
      case 'qr-code':
        return <QrCode className={className} />;
      case 'wallet':
      default:
        return <Wallet className={className} />;
    }
  };

  const handleToggleMethodEnabled = (id: string) => {
    const updated = paymentMethods.map(m =>
      m.id === id ? { ...m, enabled: !m.enabled } : m
    );
    onUpdatePaymentMethods(updated);
  };

  const handleDeleteMethod = (id: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar este método de pago?')) {
      const updated = paymentMethods.filter(m => m.id !== id);
      onUpdatePaymentMethods(updated);
    }
  };

  const handleSaveMethodForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMethod) return;

    if (isAddingNew) {
      onUpdatePaymentMethods([...paymentMethods, editingMethod]);
    } else {
      const updated = paymentMethods.map(m =>
        m.id === editingMethod.id ? editingMethod : m
      );
      onUpdatePaymentMethods(updated);
    }

    setEditingMethod(null);
    setIsAddingNew(false);
  };

  const handleStartAddNew = () => {
    const newMethod: CustomPaymentMethod = {
      id: `method-${Date.now()}`,
      name: 'Nuevo Método de Pago',
      iconName: 'wallet',
      currency: 'USD',
      enabled: true,
      badgeText: 'Disponible',
      description: 'Paga de forma rápida y directa.',
      instructions: 'Sigue las instrucciones en pantalla e ingresa tu número de referencia.',
      requiresReference: true,
      supportsOnlineVerification: true,
    };
    setEditingMethod(newMethod);
    setIsAddingNew(true);
  };

  return (
    <div className="space-y-6">
      {/* Global Master Switch */}
      <div className="bg-[#3E2E22] text-[#FDFBF7] p-6 rounded-3xl border border-[#5D4636] shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#5D4636] pb-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-xl ${
                onlinePaymentsEnabled
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
              }`}
            >
              <Power className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-xl font-bold text-[#FDFBF7]">
                  Sistema de Pago Online Directo
                </h3>
                <span
                  className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                    onlinePaymentsEnabled
                      ? 'bg-emerald-900/80 text-emerald-300 border-emerald-600'
                      : 'bg-rose-900/80 text-rose-300 border-rose-600'
                  }`}
                >
                  {onlinePaymentsEnabled ? 'SISTEMA ACTIVO' : 'SISTEMA DESACTIVADO'}
                </span>
              </div>
              <p className="text-xs text-[#EFECE6]/80 mt-0.5">
                Permite a los clientes procesar y confirmar sus pagos directamente en la página web con reporte automático.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onToggleOnlinePayments(!onlinePaymentsEnabled)}
            className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all shadow-md cursor-pointer flex items-center gap-2 ${
              onlinePaymentsEnabled
                ? 'bg-rose-600 hover:bg-rose-700 text-white'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            <Power className="w-4 h-4" />
            <span>{onlinePaymentsEnabled ? 'Desactivar Pago Online' : 'Habilitar Pago Online'}</span>
          </button>
        </div>

        {/* Sub-toggle: Auto Verification */}
        <div className="flex items-center justify-between bg-[#4A3728]/80 p-3.5 rounded-2xl border border-[#5D4636]">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <p className="text-xs font-bold text-[#FDFBF7]">
                Verificación y Aprobación Automática Inmediata
              </p>
              <p className="text-[11px] text-[#FEF3C7]/80">
                Marca los pedidos pagados en línea como "Pago Verificado" automáticamente al ingresar la referencia o tarjeta.
              </p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={autoVerifyOnlinePayments}
              onChange={e => onToggleAutoVerify(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
          </label>
        </div>
      </div>

      {/* Payment Methods List Header */}
      <div className="bg-white p-6 rounded-3xl border border-[#E5DED4] shadow-md space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EFECE6] pb-4">
          <div>
            <h3 className="font-serif text-lg font-bold text-[#3E2E22] flex items-center gap-2">
              <span>Métodos de Pago Individuales Habilitados ({paymentMethods.filter(m => m.enabled).length}/{paymentMethods.length})</span>
            </h3>
            <p className="text-xs text-[#78604E]">
              Habilita o deshabilita individualmente los métodos de pago, edita sus datos bancarios/instrucciones o agrega nuevas opciones (ej: Zinli, Binance, PayPal).
            </p>
          </div>

          <button
            type="button"
            onClick={handleStartAddNew}
            className="flex items-center gap-1.5 bg-[#D97706] hover:bg-[#B45309] text-white font-extrabold px-4 py-2.5 rounded-xl text-xs shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Agregar Nuevo Método
          </button>
        </div>

        {/* List Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {paymentMethods.map(method => (
            <div
              key={method.id}
              className={`p-4 rounded-2xl border-2 transition-all space-y-3 relative ${
                method.enabled
                  ? 'bg-white border-[#E5DED4] shadow-xs hover:border-[#D97706]'
                  : 'bg-[#F9F7F3] border-gray-200 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2.5 rounded-xl border ${method.enabled ? 'bg-[#3E2E22] text-[#FDFBF7] border-[#3E2E22]' : 'bg-gray-200 text-gray-500 border-gray-300'}`}>
                    {renderIcon(method.iconName, 'w-5 h-5')}
                  </div>
                  <div>
                    <h4 className="font-serif font-bold text-sm text-[#3E2E22] flex items-center gap-2">
                      <span>{method.name}</span>
                      <span className="text-[10px] font-mono font-bold uppercase bg-[#F4EFEA] text-[#4A3728] px-2 py-0.5 rounded-md border border-[#E5DED4]">
                        {method.currency}
                      </span>
                    </h4>
                    {method.badgeText && (
                      <span className="text-[10px] text-[#D97706] font-bold block">
                        • {method.badgeText}
                      </span>
                    )}
                  </div>
                </div>

                {/* Individual Enable/Disable Switch */}
                <label className="relative inline-flex items-center cursor-pointer shrink-0" title="Activar/Desactivar Método">
                  <input
                    type="checkbox"
                    checked={method.enabled}
                    onChange={() => handleToggleMethodEnabled(method.id)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#D97706]"></div>
                </label>
              </div>

              <p className="text-xs text-[#78604E] line-clamp-2 leading-relaxed">
                {method.description}
              </p>

              {/* Data Summary Pill */}
              <div className="bg-[#FDFBF7] p-2.5 rounded-xl border border-[#E5DED4] text-[11px] space-y-1">
                {method.bankOrPlatformName && (
                  <p className="text-[#3E2E22]"><strong>Banco/Plataforma:</strong> {method.bankOrPlatformName}</p>
                )}
                {method.accountHolder && (
                  <p className="text-[#3E2E22]"><strong>Titular:</strong> {method.accountHolder}</p>
                )}
                {method.accountNumberOrRif && (
                  <p className="text-[#3E2E22]"><strong>RIF/Cédula/Cuenta:</strong> {method.accountNumberOrRif}</p>
                )}
                {method.phoneNumber && (
                  <p className="text-[#3E2E22]"><strong>Teléfono Pago Móvil:</strong> {method.phoneNumber}</p>
                )}
                {method.emailOrPayId && (
                  <p className="text-[#3E2E22]"><strong>Correo / Pay ID:</strong> {method.emailOrPayId}</p>
                )}
              </div>

              {/* Card Footer Actions */}
              <div className="pt-2 border-t border-[#EFECE6] flex items-center justify-between text-xs">
                <span className="text-[10px] text-[#78604E] font-medium">
                  {method.requiresReference ? '🔑 Requiere N° de Referencia' : '⚡ No requiere referencia'}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingMethod(method);
                      setIsAddingNew(false);
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#F4EFEA] hover:bg-[#EFECE6] text-[#3E2E22] font-bold text-xs border border-[#E5DED4] transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-[#D97706]" /> Editar
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteMethod(method.id)}
                    className="p-1 text-rose-600 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
                    title="Eliminar método"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add / Edit Payment Method Modal */}
      {editingMethod && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#FDFBF7] rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-[#E5DED4] space-y-5 animate-in fade-in zoom-in-95 duration-200 my-8">
            <div className="flex items-center justify-between border-b border-[#E5DED4] pb-3">
              <h4 className="font-serif font-bold text-lg text-[#3E2E22] flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-[#D97706]" />
                <span>{isAddingNew ? 'Agregar Nuevo Método de Pago' : `Editar: ${editingMethod.name}`}</span>
              </h4>
              <button
                type="button"
                onClick={() => {
                  setEditingMethod(null);
                  setIsAddingNew(false);
                }}
                className="p-1 rounded-full hover:bg-[#EFECE6] text-[#78604E]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMethodForm} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#3E2E22] mb-1">Nombre del Método de Pago *</label>
                  <input
                    type="text"
                    required
                    value={editingMethod.name}
                    onChange={e => setEditingMethod({ ...editingMethod, name: e.target.value })}
                    placeholder="Ej: Zinli Wallet, Reserve, PayPal"
                    className="w-full bg-white border border-[#E5DED4] rounded-xl px-3 py-2 text-xs font-bold text-[#3E2E22]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#3E2E22] mb-1">Ícono Visual</label>
                  <select
                    value={editingMethod.iconName}
                    onChange={e => setEditingMethod({ ...editingMethod, iconName: e.target.value as any })}
                    className="w-full bg-white border border-[#E5DED4] rounded-xl px-3 py-2 text-xs font-bold text-[#3E2E22]"
                  >
                    <option value="smartphone">📱 Teléfono / Pago Móvil (smartphone)</option>
                    <option value="zap">⚡ Rayo / Zelle (zap)</option>
                    <option value="credit-card">💳 Tarjeta / Pasarela (credit-card)</option>
                    <option value="qr-code">🏁 QR / Binance (qr-code)</option>
                    <option value="wallet">👛 Billetera / Zinli (wallet)</option>
                    <option value="dollar-sign">💵 Billete Divisas (dollar-sign)</option>
                    <option value="building">🏦 Banco / Efectivo VES (building)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#3E2E22] mb-1">Moneda</label>
                  <select
                    value={editingMethod.currency}
                    onChange={e => setEditingMethod({ ...editingMethod, currency: e.target.value as any })}
                    className="w-full bg-white border border-[#E5DED4] rounded-xl px-3 py-2 text-xs font-bold text-[#3E2E22]"
                  >
                    <option value="USD">USD ($ Dólares)</option>
                    <option value="VES">VES (Bs. Bolívares)</option>
                    <option value="AMBOS">AMBOS (USD & Bs.)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#3E2E22] mb-1">Insignia / Badge Destacado</label>
                  <input
                    type="text"
                    value={editingMethod.badgeText || ''}
                    onChange={e => setEditingMethod({ ...editingMethod, badgeText: e.target.value })}
                    placeholder="Ej: Verificación Inmediata, 0% Comisión"
                    className="w-full bg-white border border-[#E5DED4] rounded-xl px-3 py-2 text-xs font-medium text-[#3E2E22]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#3E2E22] mb-1">Estado Inicial</label>
                  <select
                    value={editingMethod.enabled ? 'true' : 'false'}
                    onChange={e => setEditingMethod({ ...editingMethod, enabled: e.target.value === 'true' })}
                    className="w-full bg-white border border-[#E5DED4] rounded-xl px-3 py-2 text-xs font-bold text-[#3E2E22]"
                  >
                    <option value="true">Habilitado (Activo)</option>
                    <option value="false">Deshabilitado (Oculto)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#3E2E22] mb-1">Descripción Breve *</label>
                <input
                  type="text"
                  required
                  value={editingMethod.description}
                  onChange={e => setEditingMethod({ ...editingMethod, description: e.target.value })}
                  placeholder="Descripción rápida mostrada al cliente en la tienda"
                  className="w-full bg-white border border-[#E5DED4] rounded-xl px-3 py-2 text-xs font-medium text-[#3E2E22]"
                />
              </div>

              {/* Specific Payment Gateway Account Details */}
              <div className="bg-[#F4EFEA] p-4 rounded-2xl border border-[#E5DED4] space-y-3">
                <p className="text-xs font-bold text-[#3E2E22] uppercase border-b border-[#E5DED4] pb-1">
                  Datos de Cuenta para Depósito / Transferencia
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[#4A3728] mb-1">Nombre Banco / Plataforma</label>
                    <input
                      type="text"
                      value={editingMethod.bankOrPlatformName || ''}
                      onChange={e => setEditingMethod({ ...editingMethod, bankOrPlatformName: e.target.value })}
                      placeholder="Ej: Banco Provincial, Zelle, Binance Pay"
                      className="w-full bg-white border border-[#E5DED4] rounded-lg px-2.5 py-1.5 text-xs text-[#3E2E22]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#4A3728] mb-1">Nombre del Titular</label>
                    <input
                      type="text"
                      value={editingMethod.accountHolder || ''}
                      onChange={e => setEditingMethod({ ...editingMethod, accountHolder: e.target.value })}
                      placeholder="Ej: Rosquetes Canarios C.A."
                      className="w-full bg-white border border-[#E5DED4] rounded-lg px-2.5 py-1.5 text-xs text-[#3E2E22]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[#4A3728] mb-1">RIF / Cédula / N° Cuenta</label>
                    <input
                      type="text"
                      value={editingMethod.accountNumberOrRif || ''}
                      onChange={e => setEditingMethod({ ...editingMethod, accountNumberOrRif: e.target.value })}
                      placeholder="Ej: J-501234567"
                      className="w-full bg-white border border-[#E5DED4] rounded-lg px-2.5 py-1.5 text-xs text-[#3E2E22]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#4A3728] mb-1">Teléfono (Pago Móvil)</label>
                    <input
                      type="text"
                      value={editingMethod.phoneNumber || ''}
                      onChange={e => setEditingMethod({ ...editingMethod, phoneNumber: e.target.value })}
                      placeholder="Ej: 0412-5558822"
                      className="w-full bg-white border border-[#E5DED4] rounded-lg px-2.5 py-1.5 text-xs text-[#3E2E22]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#4A3728] mb-1">Correo / Binance Pay ID</label>
                    <input
                      type="text"
                      value={editingMethod.emailOrPayId || ''}
                      onChange={e => setEditingMethod({ ...editingMethod, emailOrPayId: e.target.value })}
                      placeholder="Ej: pagos@rosquetes.com / 289410398"
                      className="w-full bg-white border border-[#E5DED4] rounded-lg px-2.5 py-1.5 text-xs text-[#3E2E22]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#4A3728] mb-1">Instrucciones Paso a Paso para el Cliente</label>
                  <textarea
                    rows={2}
                    value={editingMethod.instructions || ''}
                    onChange={e => setEditingMethod({ ...editingMethod, instructions: e.target.value })}
                    placeholder="Instrucciones paso a paso mostradas durante el checkout..."
                    className="w-full bg-white border border-[#E5DED4] rounded-lg p-2 text-xs font-mono text-[#3E2E22]"
                  />
                </div>
              </div>

              {/* Requirement Toggles */}
              <div className="flex flex-wrap items-center gap-4 bg-white p-3 rounded-xl border border-[#E5DED4] text-xs">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingMethod.requiresReference}
                    onChange={e => setEditingMethod({ ...editingMethod, requiresReference: e.target.checked })}
                    className="rounded text-[#D97706]"
                  />
                  <span className="font-bold text-[#3E2E22]">Requiere N° de Referencia obligatoria</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingMethod.supportsOnlineVerification}
                    onChange={e => setEditingMethod({ ...editingMethod, supportsOnlineVerification: e.target.checked })}
                    className="rounded text-[#D97706]"
                  />
                  <span className="font-bold text-[#3E2E22]">Soporta Verificación en Línea</span>
                </label>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E5DED4]">
                <button
                  type="button"
                  onClick={() => {
                    setEditingMethod(null);
                    setIsAddingNew(false);
                  }}
                  className="px-4 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-[#D97706] hover:bg-[#B45309] text-white font-extrabold text-xs shadow-md transition-all cursor-pointer"
                >
                  {isAddingNew ? 'Guardar Nuevo Método' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
