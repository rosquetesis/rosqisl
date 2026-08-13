import React, { useState } from 'react';
import { ShieldCheck, Lock, User, X, Eye, EyeOff } from 'lucide-react';
import { AdminSettings } from '../types';

interface AdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessLogin: () => void;
  settings?: AdminSettings;
}

export const AdminAuthModal: React.FC<AdminAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccessLogin,
  settings,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const validUsername = settings?.adminUsername || 'admin';
  const validPassword = settings?.adminPassword || 'admin2026';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUser = username.trim().toLowerCase();
    const expectedUser = validUsername.trim().toLowerCase();
    const isUserMatch = cleanUser === expectedUser;
    const isPassMatch = password === validPassword;
    if (isUserMatch && isPassMatch) {
      onSuccessLogin();
      onClose();
    } else {
      setError('Credenciales incorrectas. Verifica tu usuario y contraseña.');
    }
  };



  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#3E2E22] text-[#FDFBF7] rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-[#5D4636] animate-in zoom-in-95 duration-200">
        <div className="p-6 relative border-b border-[#5D4636] text-center">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-[#5D4636] text-[#FEF3C7] hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="w-14 h-14 rounded-2xl bg-[#D97706]/20 text-amber-400 flex items-center justify-center mx-auto mb-3 border border-[#D97706]/30">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h3 className="font-serif text-2xl font-bold text-[#FDFBF7]">
            Panel de Administración
          </h3>
          <p className="text-xs text-[#EFECE6]/80 mt-1">
            Gestión de Inventario, Pedidos, Clientes y Configuración
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-rose-950/80 border border-rose-800 text-rose-200 p-3 rounded-xl text-xs flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-[#FEF3C7] mb-1 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-amber-400" />
              <span>Usuario Administrador</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ej: admin"
              value={username}
              onChange={e => { setUsername(e.target.value); setError(''); }}
              className="w-full bg-[#4A3728] border border-[#5D4636] rounded-xl px-4 py-2.5 text-sm text-[#FDFBF7] placeholder-[#FEF3C7]/50 focus:ring-2 focus:ring-[#D97706] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#FEF3C7] mb-1 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>Contraseña / PIN de Acceso</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Introduce tu contraseña"
                value={password}
                onChange={e => { setPassword(e.target.value); setError(''); }}
                className="w-full bg-[#4A3728] border border-[#5D4636] rounded-xl pl-4 pr-10 py-2.5 text-sm text-[#FDFBF7] placeholder-[#FEF3C7]/50 focus:ring-2 focus:ring-[#D97706] focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#FEF3C7]/70 hover:text-white p-1"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-[#D97706] hover:bg-[#B45309] text-white font-extrabold py-3 rounded-xl text-sm shadow-md transition-all cursor-pointer mt-2"
          >
            Iniciar Sesión
          </button>


        </form>
      </div>
    </div>
  );
};
