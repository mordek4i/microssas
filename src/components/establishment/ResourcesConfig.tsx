import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import type { ResourceItem, ResourceType } from '../../types';
import { Plus, Trash2, Layers, CheckCircle2, XCircle } from 'lucide-react';

export const ResourcesConfig: React.FC = () => {
  const { currentEstablishment, updateEstablishment } = useApp();

  const [resources, setResources] = useState<ResourceItem[]>(currentEstablishment.resources || []);
  const [name, setName] = useState('');
  const [sector, setSector] = useState('');
  const [capacity, setCapacity] = useState<number>(4);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setResources(currentEstablishment.resources || []);
  }, [currentEstablishment]);

  const bType = currentEstablishment.businessType;
  const defaultResourceType: ResourceType =
    (bType === 'RESTAURANT' || bType === 'BAR' || bType === 'CAFE') ? 'TABLE' :
    (bType === 'CLINIC' || bType === 'SPA') ? 'ROOM' :
    (bType === 'EVENTS' || bType === 'STUDIO') ? 'SPACE' : 'GENERAL';

  const itemTerm =
    (bType === 'RESTAURANT' || bType === 'BAR' || bType === 'CAFE') ? 'Mesa' :
    bType === 'EVENTS' ? 'Espaço' : 'Recurso';

  const itemsTermPlural =
    (bType === 'RESTAURANT' || bType === 'BAR' || bType === 'CAFE') ? 'Mesas' :
    bType === 'EVENTS' ? 'Espaços' : 'Recursos';

  const handleAddResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    const newResource: ResourceItem = {
      id: `res-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim(),
      type: sector.trim() || (bType === 'RESTAURANT' ? 'Salão' : bType === 'EVENTS' ? 'Área Principal' : 'Principal'),
      resourceType: defaultResourceType,
      capacity: capacity ? Number(capacity) : undefined,
      active: true
    };

    const updated = [...resources, newResource];
    setResources(updated);

    try {
      await updateEstablishment({
        ...currentEstablishment,
        resources: updated
      });
      setName('');
      setSector('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveResource = async (id: string) => {
    const updated = resources.filter(r => r.id !== id);
    setResources(updated);
    await updateEstablishment({
      ...currentEstablishment,
      resources: updated
    });
  };

  const handleToggleActive = async (id: string) => {
    const updated = resources.map(r => r.id === id ? { ...r, active: !r.active } : r);
    setResources(updated);
    await updateEstablishment({
      ...currentEstablishment,
      resources: updated
    });
  };

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-6">
        <div>
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">
            Gerenciar {itemsTermPlural}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            {bType === 'RESTAURANT' && 'Cadastre as mesas e áreas do restaurante (Salão, Varanda, VIP) para controle de disponibilidade e lotação.'}
            {bType === 'BAR' && 'Cadastre as mesas, bistrôs e áreas do bar para controle de lotação.'}
            {bType === 'CAFE' && 'Cadastre as mesas da cafeteria para controle de disponibilidade.'}
            {bType === 'EVENTS' && 'Cadastre os ambientes e salões locáveis com a respectiva capacidade máxima de convidados.'}
          </p>
        </div>

        {/* Add Resource Form */}
        <form onSubmit={handleAddResource} className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
          <h4 className="text-xs font-bold text-teal-800 uppercase tracking-wider">
            Adicionar {itemTerm}
          </h4>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-slate-700 font-semibold mb-1">Identificação / Nome *</label>
              <input
                type="text"
                required
                placeholder={
                  (bType === 'RESTAURANT' || bType === 'BAR' || bType === 'CAFE') ? 'Ex: Mesa 01, Mesa Varanda 04' :
                  bType === 'EVENTS' ? 'Ex: Salão Nobre, Área Verde, Espaço Gourmet' : 'Ex: Recurso 01'
                }
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-teal-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-700 font-semibold mb-1">
                {(bType === 'RESTAURANT' || bType === 'BAR' || bType === 'CAFE') ? 'Setor / Salão' : 'Setor / Área'}
              </label>
              <input
                type="text"
                placeholder={
                  (bType === 'RESTAURANT' || bType === 'BAR' || bType === 'CAFE') ? 'Ex: Salão Interno, Varanda, VIP' :
                  bType === 'EVENTS' ? 'Ex: Salão Principal, Mezanino, Área Externa' : 'Ex: Principal, Anexo'
                }
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-700 font-semibold mb-1">
                {(bType === 'RESTAURANT' || bType === 'BAR' || bType === 'CAFE') ? 'Lugares na Mesa' :
                 bType === 'EVENTS' ? 'Capacidade Máx (Convidados)' : 'Capacidade'}
              </label>
              <input
                type="number"
                min={1}
                value={capacity}
                onChange={(e) => setCapacity(parseInt(e.target.value) || 1)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-teal-500 font-bold"
              />
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#bde870] hover:bg-[#afdf5c] text-slate-950 font-black py-2.5 px-4 rounded-xl shadow-xs text-xs flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>Adicionar {itemTerm}</span>
            </button>
          </div>
        </form>

        {/* Resources List */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {itemsTermPlural} Cadastrados ({resources.length})
            </h4>
            {(bType === 'RESTAURANT' || bType === 'BAR' || bType === 'CAFE') && (
              <span className="text-xs font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200">
                Total de Lugares: {resources.reduce((acc, r) => acc + (r.capacity || 0), 0)}
              </span>
            )}
            {bType === 'EVENTS' && (
              <span className="text-xs font-bold text-indigo-800 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200">
                Capacidade Total do Local: {resources.reduce((acc, r) => acc + (r.capacity || 0), 0)} convidados
              </span>
            )}
          </div>

          {resources.length === 0 ? (
            <div className="p-8 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
              <Layers className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-500 font-medium">
                Nenhum {itemTerm.toLowerCase()} cadastrado ainda.
              </p>
              <span className="text-[11px] text-slate-400">
                Utilize o formulário acima para adicionar.
              </span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {resources.map(res => (
                <div
                  key={res.id}
                  className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between space-y-2.5 ${
                    res.active ? 'bg-white border-slate-200/90 shadow-xs' : 'bg-slate-50 border-slate-200/60 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h5 className="text-xs font-bold text-slate-900">{res.name}</h5>
                      <span className="text-[11px] text-slate-400 font-medium block">
                        {res.type || 'Geral'}
                      </span>
                    </div>

                    <button
                      onClick={() => handleToggleActive(res.id)}
                      title={res.active ? 'Desativar' : 'Ativar'}
                      className="text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {res.active ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-slate-400" />
                      )}
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                    <span className="text-[11px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-100">
                      {res.capacity ? `${res.capacity} ${bType === 'RESTAURANT' ? 'lugares' : bType === 'EVENTS' ? 'convidados' : 'vagas'}` : 'Indefinido'}
                    </span>

                    <button
                      onClick={() => handleRemoveResource(res.id)}
                      className="text-slate-400 hover:text-rose-600 p-1 rounded-lg transition-colors"
                      title="Excluir"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
