import React, { useState } from 'react';
import { Search, Plus, Trash2, Edit3, User, MapPin, Phone, Mail, ShoppingBag, X } from 'lucide-react';
import { Customer } from '../../types';

interface AdminClientsSectionProps {
  clients: Customer[];
  onAddClient: (client: Partial<Customer>) => Promise<void>;
  onDeleteClient: (clientId: string) => Promise<void>;
}

export const AdminClientsSection: React.FC<AdminClientsSectionProps> = ({
  clients,
  onAddClient,
  onDeleteClient,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Partial<Customer>>({
    name: '',
    phone: '',
    email: '',
    city: 'Maracay',
    address: '',
    notes: '',
  });

  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleOpenAdd = () => {
    setEditingClient({ name: '', phone: '', email: '', city: 'Maracay', address: '', notes: '' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (client: Customer) => {
    setEditingClient(client);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient.name || !editingClient.phone) return;
    await onAddClient(editingClient);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="bg-white p-6 rounded-3xl border border-[#E5DED4] shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="font-serif text-xl font-bold text-[#3E2E22]">CRUD y Gestión de Clientes</h3>
          <p className="text-xs text-[#78604E]">Directorio de clientes en Aragua y su historial de compras</p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-2 bg-[#3E2E22] hover:bg-[#5D4636] text-[#FDFBF7] font-bold px-4 py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4 text-[#D97706]" /> Registrar Nuevo Cliente
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#E5DED4] shadow-xs relative">
        <Search className="w-4 h-4 text-[#D97706] absolute left-7 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Buscar cliente por nombre, teléfono, correo o ciudad en Aragua..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full bg-[#FDFBF7] border border-[#E5DED4] rounded-xl pl-9 pr-4 py-2 text-xs font-medium text-[#3E2E22] focus:ring-2 focus:ring-[#D97706] focus:outline-none"
        />
      </div>

      {/* Clients — card view on mobile, table on md+ */}
      <div className="bg-white rounded-3xl border border-[#E5DED4] shadow-md overflow-hidden">

        {/* Mobile cards */}
        <div className="md:hidden divide-y divide-[#E5DED4]">
          {filteredClients.length === 0 ? (
            <p className="p-8 text-center text-[#78604E] text-xs">No se encontraron clientes registrados.</p>
          ) : filteredClients.map(client => (
            <div key={client.id} className="p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-bold text-[#3E2E22] text-xs flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-[#D97706]" />{client.name}
                  </p>
                  <p className="font-mono text-[10px] text-[#78604E]">{client.phone}</p>
                  <p className="text-[10px] text-[#78604E]">{client.email || 'Sin correo'}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => handleOpenEdit(client)} className="p-1.5 text-[#78604E] hover:bg-[#F4EFEA] rounded-lg cursor-pointer"><Edit3 className="w-4 h-4" /></button>
                  <button onClick={() => onDeleteClient(client.id)} className="p-1.5 text-rose-600 hover:bg-rose-100 rounded-lg cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold bg-[#F4EFEA] text-[#3E2E22] border border-[#E5DED4] px-2 py-0.5 rounded-md text-[10px]">{client.city}</span>
                <span className="font-mono font-bold text-[#3E2E22]">${client.totalSpentUSD.toFixed(2)} USD · {client.totalOrders} pedidos</span>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs text-[#3E2E22]">
            <thead>
              <tr className="bg-[#3E2E22] text-[#FDFBF7] font-bold uppercase text-[10px]">
                <th className="p-3.5">Cliente</th>
                <th className="p-3.5">Contacto</th>
                <th className="p-3.5">Ciudad / Dirección (Aragua)</th>
                <th className="p-3.5">Pedidos Totales</th>
                <th className="p-3.5">Monto Gastado (USD)</th>
                <th className="p-3.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5DED4] font-medium">
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-[#78604E]">
                    No se encontraron clientes registrados.
                  </td>
                </tr>
              ) : (
                filteredClients.map(client => (
                  <tr key={client.id} className="hover:bg-[#FDFBF7] transition-colors">
                    <td className="p-3.5">
                      <div className="font-bold text-[#3E2E22] flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-[#D97706]" />
                        <span>{client.name}</span>
                      </div>
                      <span className="text-[10px] text-[#78604E] font-mono">Registrado: {client.createdAt}</span>
                    </td>

                    <td className="p-3.5">
                      <div className="font-mono font-bold text-[#3E2E22]">{client.phone}</div>
                      <div className="text-[10px] text-[#78604E]">{client.email || 'Sin correo'}</div>
                    </td>

                    <td className="p-3.5 max-w-[200px] truncate">
                      <span className="font-bold bg-[#F4EFEA] text-[#3E2E22] border border-[#E5DED4] px-2 py-0.5 rounded-md text-[10px]">
                        {client.city}
                      </span>
                      <p className="text-[10px] text-[#78604E] truncate mt-0.5">{client.address}</p>
                    </td>

                    <td className="p-3.5 font-bold font-mono text-center">
                      {client.totalOrders}
                    </td>

                    <td className="p-3.5 font-mono font-bold text-[#3E2E22]">
                      ${client.totalSpentUSD.toFixed(2)} USD
                    </td>

                    <td className="p-3.5 text-right space-x-1">
                      <button
                        onClick={() => handleOpenEdit(client)}
                        className="p-1.5 text-[#78604E] hover:bg-[#F4EFEA] hover:text-[#3E2E22] rounded-lg transition-colors cursor-pointer"
                        title="Editar Cliente"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteClient(client.id)}
                        className="p-1.5 text-rose-600 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
                        title="Eliminar Cliente"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Client Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FDFBF7] rounded-3xl max-w-md w-full p-6 space-y-4 border border-[#E5DED4] shadow-2xl">
            <div className="flex justify-between items-center border-b border-[#E5DED4] pb-3">
              <h4 className="font-serif font-bold text-lg text-[#3E2E22]">
                {editingClient.id ? 'Editar Cliente' : 'Registrar Nuevo Cliente'}
              </h4>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-[#78604E] hover:text-[#3E2E22]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs text-[#3E2E22]">
              <div>
                <label className="block font-bold mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  value={editingClient.name}
                  onChange={e => setEditingClient({ ...editingClient, name: e.target.value })}
                  className="w-full bg-white border border-[#E5DED4] rounded-xl p-2.5 font-medium text-[#3E2E22]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold mb-1">Teléfono (WhatsApp) *</label>
                  <input
                    type="tel"
                    required
                    value={editingClient.phone}
                    onChange={e => setEditingClient({ ...editingClient, phone: e.target.value })}
                    className="w-full bg-white border border-[#E5DED4] rounded-xl p-2.5 font-medium text-[#3E2E22]"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Ciudad en Aragua</label>
                  <input
                    type="text"
                    value={editingClient.city}
                    onChange={e => setEditingClient({ ...editingClient, city: e.target.value })}
                    placeholder="Maracay, Turmero..."
                    className="w-full bg-white border border-[#E5DED4] rounded-xl p-2.5 font-medium text-[#3E2E22]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  value={editingClient.email || ''}
                  onChange={e => setEditingClient({ ...editingClient, email: e.target.value })}
                  className="w-full bg-white border border-[#E5DED4] rounded-xl p-2.5 font-medium text-[#3E2E22]"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Dirección de Despacho</label>
                <textarea
                  rows={2}
                  value={editingClient.address || ''}
                  onChange={e => setEditingClient({ ...editingClient, address: e.target.value })}
                  className="w-full bg-white border border-[#E5DED4] rounded-xl p-2.5 font-medium text-[#3E2E22]"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Notas o Preferencias de Presentación</label>
                <input
                  type="text"
                  value={editingClient.notes || ''}
                  onChange={e => setEditingClient({ ...editingClient, notes: e.target.value })}
                  placeholder="Ej: Prefiere rosqueticos integrales"
                  className="w-full bg-white border border-[#E5DED4] rounded-xl p-2.5 font-medium text-[#3E2E22]"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#3E2E22] text-[#FDFBF7] font-bold py-3 rounded-xl hover:bg-[#5D4636] transition-colors cursor-pointer"
              >
                Guardar Datos de Cliente
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
