import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import type { ServiceItem } from '../../types';
import { Plus, Trash2 } from 'lucide-react';

export const ServicesConfig: React.FC = () => {
  const { currentEstablishment, updateEstablishment, getServiceTerm } = useApp();

  const [services, setServices] = useState<ServiceItem[]>(currentEstablishment.services);
  const [name, setName] = useState('');
  const [durationMinutes, setDurationMinutes] = useState<number>(45);
  const [price, setPrice] = useState<string>('');

  const handleAddService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    const newService: ServiceItem = {
      id: `srv-${Math.random().toString(36).substring(2, 7)}`,
      name,
      durationMinutes: durationMinutes || 45,
      price: price ? parseFloat(price) : undefined,
      active: true
    };

    const updated = [...services, newService];
    setServices(updated);
    updateEstablishment({
      ...currentEstablishment,
      services: updated
    });

    setName('');
    setPrice('');
  };

  const handleRemoveService = (id: string) => {
    const updated = services.filter(s => s.id !== id);
    setServices(updated);
    updateEstablishment({
      ...currentEstablishment,
      services: updated
    });
  };

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-6">
        <div>
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">
            Catálogo de {getServiceTerm(true)}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Configure as opções de reserva ou serviços que seus clientes podem escolher ao agendar online.
          </p>
        </div>

        {/* Add Service Form */}
        <form onSubmit={handleAddService} className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
          <h4 className="text-xs font-bold text-teal-800 uppercase tracking-wider">Adicionar Novo {getServiceTerm()}</h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-slate-700 font-semibold mb-1">Nome do {getServiceTerm()} *</label>
              <input
                type="text"
                required
                placeholder="Ex: Corte de Cabelo Masculino, Limpeza Facial"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-700 font-semibold mb-1">Duração Média (Minutos) *</label>
              <input
                type="number"
                min={15}
                step={15}
                required
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 45)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-700 font-semibold mb-1">Valor R$ (opcional)</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="bg-[#bde870] hover:bg-[#afdf5c] text-slate-950 font-bold py-2 px-4 rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Adicionar {getServiceTerm()}</span>
            </button>
          </div>
        </form>

        {/* Existing List */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            {getServiceTerm(true)} Cadastrados ({services.length})
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {services.map(srv => (
              <div
                key={srv.id}
                className="p-4 rounded-xl bg-slate-50/60 border border-slate-200 flex items-center justify-between"
              >
                <div>
                  <h5 className="text-xs font-bold text-slate-900">{srv.name}</h5>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Duração: {srv.durationMinutes} min {srv.price ? `• R$ ${srv.price.toFixed(2)}` : ''}
                  </p>
                </div>

                <button
                  onClick={() => handleRemoveService(srv.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
