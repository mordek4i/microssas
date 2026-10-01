import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import type { ResourceItem } from '../../types';
import { Plus, Trash2 } from 'lucide-react';

export const ResourcesConfig: React.FC = () => {
  const { currentEstablishment, updateEstablishment, getResourceTerm } = useApp();

  const [resources, setResources] = useState<ResourceItem[]>(currentEstablishment.resources);
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [capacity, setCapacity] = useState<number>(4);

  const handleAddResource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    const newResource: ResourceItem = {
      id: `res-${Math.random().toString(36).substring(2, 7)}`,
      name,
      type: type || 'Geral',
      capacity: capacity || undefined,
      active: true
    };

    const updatedResources = [...resources, newResource];
    setResources(updatedResources);
    updateEstablishment({
      ...currentEstablishment,
      resources: updatedResources
    });

    setName('');
    setType('');
  };

  const handleRemoveResource = (id: string) => {
    const updatedResources = resources.filter(r => r.id !== id);
    setResources(updatedResources);
    updateEstablishment({
      ...currentEstablishment,
      resources: updatedResources
    });
  };

  const handleToggleActive = (id: string) => {
    const updatedResources = resources.map(r => r.id === id ? { ...r, active: !r.active } : r);
    setResources(updatedResources);
    updateEstablishment({
      ...currentEstablishment,
      resources: updatedResources
    });
  };

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-6">
        <div>
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">
            Gerenciar {getResourceTerm(true)} do Estabelecimento
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Cadastre as mesas, profissionais, salas ou espaços disponíveis no seu estabelecimento para controle de disponibilidade.
          </p>
        </div>

        {/* Add Resource Form */}
        <form onSubmit={handleAddResource} className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
          <h4 className="text-xs font-bold text-teal-800 uppercase tracking-wider">Adicionar Novo {getResourceTerm()}</h4>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-slate-700 font-semibold mb-1">Nome do {getResourceTerm()} *</label>
              <input
                type="text"
                required
                placeholder={
                  currentEstablishment.businessType === 'RESTAURANT' ? 'Ex: Mesa 07 Varanda' :
                  currentEstablishment.businessType === 'SALON' ? 'Ex: Lucas Cabeleireiro' :
                  currentEstablishment.businessType === 'CLINIC' ? 'Ex: Sala Estética 02' : 'Ex: Espaço Principal'
                }
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-700 font-semibold mb-1">Categoria / Setor</label>
              <input
                type="text"
                placeholder="Ex: Salão, Varanda, VIP, Master"
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-700 font-semibold mb-1">Capacidade (Lugares/Pessoas)</label>
              <input
                type="number"
                min={1}
                value={capacity}
                onChange={(e) => setCapacity(parseInt(e.target.value) || 1)}
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
              <span>Adicionar {getResourceTerm()}</span>
            </button>
          </div>
        </form>

        {/* Existing Resources List */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            {getResourceTerm(true)} Cadastrados ({resources.length})
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {resources.map(res => (
              <div
                key={res.id}
                className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
                  res.active ? 'bg-slate-50/60 border-slate-200' : 'bg-slate-50/20 border-slate-100 opacity-60'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h5 className="text-xs font-bold text-slate-900">{res.name}</h5>
                    <span className="text-[10px] bg-white border border-slate-200 text-slate-600 px-2 py-0.5 rounded font-semibold">
                      {res.type || 'Geral'}
                    </span>
                  </div>
                  {res.capacity && (
                    <p className="text-[11px] text-slate-500 mt-0.5">Capacidade: {res.capacity} lugares</p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleActive(res.id)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                      res.active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {res.active ? 'Ativo' : 'Inativo'}
                  </button>

                  <button
                    onClick={() => handleRemoveResource(res.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
