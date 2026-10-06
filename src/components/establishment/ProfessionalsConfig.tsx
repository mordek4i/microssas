import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import type { ProfessionalItem } from '../../types';
import { Plus, Trash2, User, Phone, CheckCircle2, XCircle } from 'lucide-react';

export const ProfessionalsConfig: React.FC = () => {
  const { currentEstablishment, updateEstablishment } = useApp();

  const [professionals, setProfessionals] = useState<ProfessionalItem[]>(
    currentEstablishment.professionals || []
  );

  useEffect(() => {
    setProfessionals(currentEstablishment.professionals || []);
  }, [currentEstablishment]);

  const [name, setName] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const bType = currentEstablishment.businessType;

  const roleTerm =
    bType === 'BARBERSHOP' ? 'Barbeiro' :
    bType === 'SALON' ? 'Profissional' :
    bType === 'CLINIC' ? 'Especialista' :
    bType === 'SPA' ? 'Terapeuta' :
    bType === 'STUDIO' ? 'Professor' : 'Profissional';

  const roleTermPlural =
    bType === 'BARBERSHOP' ? 'Barbeiros' :
    bType === 'SALON' ? 'Profissionais' :
    bType === 'CLINIC' ? 'Especialistas' :
    bType === 'SPA' ? 'Terapeutas' :
    bType === 'STUDIO' ? 'Professores' : 'Profissionais';

  const handleAddProfessional = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    const newProf: ProfessionalItem = {
      id: `prof-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim(),
      specialty: specialty.trim() || undefined,
      phone: phone.trim() || undefined,
      active: true
    };

    const updated = [...professionals, newProf];
    setProfessionals(updated);

    try {
      await updateEstablishment({
        ...currentEstablishment,
        professionals: updated
      });
      setName('');
      setSpecialty('');
      setPhone('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveProfessional = async (id: string) => {
    const updated = professionals.filter(p => p.id !== id);
    setProfessionals(updated);
    await updateEstablishment({
      ...currentEstablishment,
      professionals: updated
    });
  };

  const handleToggleActive = async (id: string) => {
    const updated = professionals.map(p => p.id === id ? { ...p, active: !p.active } : p);
    setProfessionals(updated);
    await updateEstablishment({
      ...currentEstablishment,
      professionals: updated
    });
  };

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-6">
        <div>
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">
            Equipe de {roleTermPlural}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Cadastre os membros da sua equipe para que os clientes possam escolher com quem desejam ser atendidos.
          </p>
        </div>

        {/* Formulário de Adicionar Profissional */}
        <form onSubmit={handleAddProfessional} className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
          <h4 className="text-xs font-bold text-teal-800 uppercase tracking-wider">
            Adicionar Novo {roleTerm}
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-slate-700 font-semibold mb-1">Nome Completo *</label>
              <input
                type="text"
                required
                placeholder={
                  bType === 'BARBERSHOP' ? 'Ex: Carlos Barbeiro' :
                  bType === 'SALON' ? 'Ex: Juliana Cabeleireira' :
                  bType === 'CLINIC' ? 'Ex: Dra. Mariana Costa' :
                  bType === 'SPA' ? 'Ex: Camila Terapeuta' :
                  bType === 'STUDIO' ? 'Ex: Prof. Roberto Yoga' : 'Ex: Nome do profissional'
                }
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-700 font-semibold mb-1">Especialidade / Cargo</label>
              <input
                type="text"
                placeholder={
                  bType === 'BARBERSHOP' ? 'Ex: Barba, Degradê & Visagismo' :
                  bType === 'SALON' ? 'Ex: Colorista / Manicure / Penteados' :
                  bType === 'CLINIC' ? 'Ex: Dermatologia / Estética' :
                  bType === 'SPA' ? 'Ex: Massoterapia / Shiatsu' :
                  bType === 'STUDIO' ? 'Ex: Instrutor de Pilates' : 'Ex: Cargo'
                }
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-700 font-semibold mb-1">Telefone / WhatsApp (Opcional)</label>
              <input
                type="text"
                placeholder="(11) 99999-9999"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
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
              <span>Adicionar à Equipe</span>
            </button>
          </div>
        </form>

        {/* Lista de Profissionais */}
        <div className="space-y-3 pt-2">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            {roleTermPlural} Cadastrados ({professionals.length})
          </h4>

          {professionals.length === 0 ? (
            <div className="p-8 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
              <User className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-500 font-medium">
                Nenhum {roleTerm.toLowerCase()} cadastrado ainda.
              </p>
              <span className="text-[11px] text-slate-400">
                Adicione os membros da equipe no formulário acima.
              </span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {professionals.map(prof => (
                <div
                  key={prof.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
                    prof.active ? 'bg-white border-slate-200/90 shadow-xs' : 'bg-slate-50 border-slate-200/60 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-800 border border-teal-200 flex items-center justify-center font-black text-xs">
                        {prof.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-slate-900">{prof.name}</h5>
                        {prof.specialty && (
                          <span className="text-[11px] text-teal-700 font-semibold block">
                            {prof.specialty}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleToggleActive(prof.id)}
                      title={prof.active ? 'Desativar' : 'Ativar'}
                      className="text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {prof.active ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-slate-400" />
                      )}
                    </button>
                  </div>

                  {prof.phone && (
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{prof.phone}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      prof.active ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {prof.active ? 'Disponível na Agenda' : 'Inativo'}
                    </span>

                    <button
                      onClick={() => handleRemoveProfessional(prof.id)}
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
