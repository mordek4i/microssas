import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Search, 
  User, 
  Phone, 
  Calendar, 
  Star,
  MessageCircle,
  Users,
  Award,
  TrendingUp
} from 'lucide-react';

interface ClientsListProps {
  onOpenClientDetail: (clientId: string) => void;
}

export const ClientsList: React.FC<ClientsListProps> = ({ onOpenClientDetail }) => {
  const { clients, currentEstablishment } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterVipOnly, setFilterVipOnly] = useState(false);

  const estClients = clients.filter(c => c.establishmentId === currentEstablishment.id);

  const filteredClients = estClients.filter(c => {
    const matchesSearch = 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesVip = !filterVipOnly || c.isVip;

    return matchesSearch && matchesVip;
  });

  const totalVips = estClients.filter(c => c.isVip).length;
  const totalBookingsSum = estClients.reduce((sum, c) => sum + c.totalBookings, 0);

  const getWhatsAppLink = (phone: string, name: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const fullPhone = cleanPhone.length <= 11 ? `55${cleanPhone}` : cleanPhone;
    const msg = encodeURIComponent(`Olá ${name}! Tudo bem? Entramos em contato a partir do ${currentEstablishment.name}. Como podemos te ajudar hoje?`);
    return `https://wa.me/${fullPhone}?text=${msg}`;
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in-up">
      {/* Category Subtitle & Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-[11px] font-extrabold text-teal-700 uppercase tracking-widest block flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" />
            CADASTRO & HISTÓRICO DE CLIENTES
          </span>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mt-1">
            Clientes<span className="text-[#0d9488]">.</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Fidelize sua base de clientes com atendimento personalizado e organização.
          </p>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Pesquisar por nome, telefone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-slate-200/90 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-500 shadow-2xs transition-all"
            />
          </div>

          <label className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-xl border border-slate-200/90 text-xs font-bold text-slate-700 cursor-pointer select-none shadow-2xs hover:border-amber-300 transition-colors">
            <input
              type="checkbox"
              checked={filterVipOnly}
              onChange={(e) => setFilterVipOnly(e.target.checked)}
              className="accent-teal-600 rounded"
            />
            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span>Apenas VIP ({totalVips})</span>
          </label>
        </div>
      </div>

      {/* CRM Overview Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase">Base de Clientes</span>
            <div className="text-lg font-black text-slate-900">{estClients.length} cadastrados</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase">Clientes VIP</span>
            <div className="text-lg font-black text-slate-900">{totalVips} clientes com destaque</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase">Total Atendimentos</span>
            <div className="text-lg font-black text-slate-900">{totalBookingsSum} agendamentos no histórico</div>
          </div>
        </div>
      </div>

      {/* Grid of Clients */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClients.length === 0 ? (
          <div className="col-span-full p-16 text-center rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
            <User className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-900">Nenhum cliente encontrado</h4>
            <p className="text-xs text-slate-500 mt-1">Os clientes serão adicionados automaticamente à medida que realizarem reservas.</p>
          </div>
        ) : (
          filteredClients.map(client => (
            <div
              key={client.id}
              onClick={() => onOpenClientDetail(client.id)}
              className="p-5 rounded-2xl bg-white border border-slate-200/80 hover:border-teal-400 cursor-pointer transition-all space-y-4 shadow-2xs hover:shadow-xs group relative overflow-hidden"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-teal-50 border border-teal-200/80 flex items-center justify-center font-black text-teal-800 group-hover:scale-105 transition-transform text-sm shadow-2xs">
                    {client.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 group-hover:text-teal-700 transition-colors flex items-center gap-1.5">
                      <span>{client.name}</span>
                      {client.isVip && (
                        <span className="inline-flex items-center gap-0.5 bg-amber-100 text-amber-900 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full border border-amber-200">
                          <Star className="w-3 h-3 text-amber-600 fill-amber-500" />
                          VIP
                        </span>
                      )}
                    </h4>
                    <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5 font-medium">
                      <Phone className="w-3 h-3 text-slate-400" />
                      {client.phone}
                    </p>
                  </div>
                </div>

                <a
                  href={getWhatsAppLink(client.phone, client.name)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors shadow-2xs"
                  title="Abrir conversa no WhatsApp"
                >
                  <MessageCircle className="w-4 h-4" />
                </a>
              </div>

              {/* Stats Bar */}
              <div className="grid grid-cols-4 gap-1.5 p-2 rounded-xl bg-slate-50 border border-slate-100 text-center text-xs">
                <div>
                  <span className="block text-[10px] font-bold text-slate-400">Total</span>
                  <span className="font-extrabold text-slate-900 text-sm">{client.totalBookings}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-400">Concluídas</span>
                  <span className="font-extrabold text-emerald-600 text-sm">{client.completedBookings}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-400">Canceladas</span>
                  <span className="font-extrabold text-rose-600 text-sm">{client.cancelledBookings}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-400">No-Show</span>
                  <span className="font-extrabold text-slate-600 text-sm">{client.noShowBookings}</span>
                </div>
              </div>

              {/* Footer info */}
              <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
                <span className="flex items-center gap-1 text-[11px]">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  Última reserva: <strong className="text-slate-700 font-semibold">{client.lastBookingDate ? client.lastBookingDate : 'Nenhuma'}</strong>
                </span>

                <span className="text-[11px] font-bold text-teal-700 group-hover:underline">Ver Histórico →</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-4 border-t border-slate-200/60">
        <span>ReservaZen © 2026</span>
        <span>Sua rotina com mais tranquilidade.</span>
      </div>
    </div>
  );
};

