import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import type { ServiceItem } from '../../types';
import { Plus, Trash2, Scissors, CheckCircle2, XCircle } from 'lucide-react';

export const ServicesConfig: React.FC = () => {
  const { currentEstablishment, updateEstablishment, getServiceTerm } = useApp();

  const [services, setServices] = useState<ServiceItem[]>(currentEstablishment.services || []);
  const [name, setName] = useState('');
  const [durationMinutes, setDurationMinutes] = useState<number>(45);
  const [price, setPrice] = useState<string>('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setServices(currentEstablishment.services || []);
  }, [currentEstablishment]);

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    const newService: ServiceItem = {
      id: `srv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim(),
      description: description.trim() || undefined,
      durationMinutes: durationMinutes || 45,
      price: price ? parseFloat(price) : undefined,
      active: true
    };

    const updated = [...services, newService];
    setServices(updated);

    try {
      await updateEstablishment({
        ...currentEstablishment,
        services: updated
      });
      setName('');
      setPrice('');
      setDescription('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveService = async (id: string) => {
    const updated = services.filter(s => s.id !== id);
    setServices(updated);
    await updateEstablishment({
      ...currentEstablishment,
      services: updated
    });
  };

  const handleToggleActive = async (id: string) => {
    const updated = services.map(s => s.id === id ? { ...s, active: !s.active } : s);
    setServices(updated);
    await updateEstablishment({
      ...currentEstablishment,
      services: updated
    });
  };

  const bType = currentEstablishment.businessType;

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-6">
        <div>
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">
            Catálogo de {getServiceTerm(true)}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            {bType === 'BARBERSHOP' && 'Configure os serviços da barbearia com tempo de atendimento e valor.'}
            {bType === 'SALON' && 'Configure os serviços do salão com tempo de atendimento e preço.'}
            {bType === 'CLINIC' && 'Cadastre os procedimentos clínicos e consultas com suas respectivas durações.'}
            {bType === 'SPA' && 'Cadastre os tratamentos relaxantes, terapias e massagens com suas respectivas durações.'}
            {bType === 'STUDIO' && 'Configure as modalidades de aulas e treinos disponíveis para os alunos.'}
            {bType === 'EVENTS' && 'Configure os formatos de locação do espaço (ex: Meia Diária, Diária Completa).'}
            {(bType === 'RESTAURANT' || bType === 'BAR' || bType === 'CAFE') && 'Configure os tipos de menu ou opções de reserva disponíveis para seus clientes.'}
            {bType === 'OTHER' && 'Configure os serviços e atendimentos do seu estabelecimento.'}
          </p>
        </div>

        {/* Add Service Form */}
        <form onSubmit={handleAddService} className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
          <h4 className="text-xs font-bold text-teal-800 uppercase tracking-wider">
            Adicionar Novo {getServiceTerm()}
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-slate-700 font-semibold mb-1">Nome do {getServiceTerm()} *</label>
              <input
                type="text"
                required
                placeholder={
                  bType === 'BARBERSHOP' ? 'Ex: Corte Degradê, Barboterapia na Toalha' :
                  bType === 'SALON' ? 'Ex: Corte Feminino, Mechas, Escova, Manicure' :
                  bType === 'CLINIC' ? 'Ex: Consulta Médica, Limpeza de Pele Profunda' :
                  bType === 'SPA' ? 'Ex: Massagem Relaxante, Terapia com Pedras Quentes' :
                  bType === 'STUDIO' ? 'Ex: Pilates em Aparelhos, Yoga Matinal, Funcional' :
                  bType === 'EVENTS' ? 'Ex: Locação Meia Diária, Diária Completa' :
                  'Ex: Atendimento Especializado, Consultoria'
                }
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-teal-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-700 font-semibold mb-1">Duração (Minutos) *</label>
              <input
                type="number"
                min={15}
                step={15}
                required
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 45)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-teal-500 font-bold"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-700 font-semibold mb-1">Valor R$ (Opcional)</label>
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

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#bde870] hover:bg-[#afdf5c] text-slate-950 font-black py-2.5 px-4 rounded-xl shadow-xs text-xs flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>Adicionar {getServiceTerm()}</span>
            </button>
          </div>
        </form>

        {/* Services List */}
        <div className="space-y-3 pt-2">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            {getServiceTerm(true)} Cadastrados ({services.length})
          </h4>

          {services.length === 0 ? (
            <div className="p-8 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
              <Scissors className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-500 font-medium">
                Nenhum {getServiceTerm().toLowerCase()} cadastrado ainda.
              </p>
              <span className="text-[11px] text-slate-400">
                Utilize o formulário acima para adicionar opções.
              </span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {services.map(srv => (
                <div
                  key={srv.id}
                  className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between space-y-2.5 ${
                    srv.active ? 'bg-white border-slate-200/90 shadow-xs' : 'bg-slate-50 border-slate-200/60 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h5 className="text-xs font-bold text-slate-900">{srv.name}</h5>
                      <span className="text-[11px] text-slate-500 font-medium block">
                        Duração: {srv.durationMinutes} min
                      </span>
                    </div>

                    <button
                      onClick={() => handleToggleActive(srv.id)}
                      title={srv.active ? 'Desativar' : 'Ativar'}
                      className="text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {srv.active ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-slate-400" />
                      )}
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                    <span className="text-xs font-black text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-100">
                      {srv.price ? `R$ ${Number(srv.price).toFixed(2)}` : 'Sem cobrança'}
                    </span>

                    <button
                      onClick={() => handleRemoveService(srv.id)}
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
