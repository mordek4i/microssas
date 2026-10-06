import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import type { Establishment } from '../../types';
import { 
  Save, 
  Utensils, 
  Wine, 
  Coffee, 
  Scissors, 
  Sparkles, 
  Stethoscope, 
  Dumbbell, 
  PartyPopper, 
  Briefcase 
} from 'lucide-react';

export const CategoryRulesConfig: React.FC = () => {
  const { currentEstablishment, updateEstablishment } = useApp();

  const [form, setForm] = useState<Establishment>(currentEstablishment);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setForm(currentEstablishment);
  }, [currentEstablishment]);

  const handleCapacityChange = (field: string, value: any) => {
    setForm(prev => ({
      ...prev,
      capacitySettings: {
        ...prev.capacitySettings,
        [field]: value
      }
    }));
  };

  const handleCategorySettingChange = (field: string, value: any) => {
    setForm(prev => ({
      ...prev,
      categorySettings: {
        ...prev.categorySettings,
        [field]: value
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateEstablishment(form);
    } finally {
      setIsSaving(false);
    }
  };

  const bType = form.businessType;
  const cat = form.categorySettings || {};

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-6">
        
        {/* Header Dinâmico */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
              {bType === 'RESTAURANT' && <Utensils className="w-5 h-5" />}
              {bType === 'BAR' && <Wine className="w-5 h-5 text-amber-600" />}
              {bType === 'CAFE' && <Coffee className="w-5 h-5 text-orange-600" />}
              {bType === 'BARBERSHOP' && <Scissors className="w-5 h-5 text-sky-600" />}
              {bType === 'SALON' && <Sparkles className="w-5 h-5 text-rose-600" />}
              {bType === 'CLINIC' && <Stethoscope className="w-5 h-5 text-teal-600" />}
              {bType === 'SPA' && <Sparkles className="w-5 h-5 text-cyan-600" />}
              {bType === 'STUDIO' && <Dumbbell className="w-5 h-5 text-purple-600" />}
              {bType === 'EVENTS' && <PartyPopper className="w-5 h-5 text-indigo-600" />}
              {bType === 'OTHER' && <Briefcase className="w-5 h-5 text-slate-600" />}
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                {(bType === 'RESTAURANT' || bType === 'BAR' || bType === 'CAFE') && 'Regras do Salão, Mesas & Capacidade'}
                {bType === 'BARBERSHOP' && 'Regras da Barbearia & Agenda dos Barbeiros'}
                {bType === 'SALON' && 'Regras do Salão de Beleza & Procedimentos'}
                {bType === 'CLINIC' && 'Regras da Clínica & Protocolos de Preparo'}
                {bType === 'SPA' && 'Regras do Spa, Massagens & Terapias'}
                {bType === 'STUDIO' && 'Regras de Turmas & Capacidade das Aulas'}
                {bType === 'EVENTS' && 'Regras de Locação & Capacidade do Espaço'}
                {bType === 'OTHER' && 'Regras Gerais de Agendamento'}
              </h3>
              <p className="text-xs text-slate-500">
                Parâmetros operacionais exclusivos para {
                  bType === 'RESTAURANT' ? 'restaurantes' :
                  bType === 'BAR' ? 'bares e pubs' :
                  bType === 'CAFE' ? 'cafeterias e bistrôs' :
                  bType === 'BARBERSHOP' ? 'barbearias' :
                  bType === 'SALON' ? 'salões de beleza' :
                  bType === 'CLINIC' ? 'clínicas' :
                  bType === 'SPA' ? 'spas e terapeutas' :
                  bType === 'STUDIO' ? 'studios e fitness' :
                  bType === 'EVENTS' ? 'espaços de eventos' : 'serviços gerais'
                }.
              </p>
            </div>
          </div>

          <span className="text-[11px] font-extrabold px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            {bType}
          </span>
        </div>

        {/* 1. RESTAURANTE / BAR / CAFETERIA */}
        {(bType === 'RESTAURANT' || bType === 'BAR' || bType === 'CAFE') && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs text-slate-700 font-semibold mb-1">Capacidade Total do Salão *</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={cat.total_capacity || (bType === 'BAR' ? 60 : (bType === 'CAFE' ? 30 : 40))}
                  onChange={(e) => handleCategorySettingChange('total_capacity', parseInt(e.target.value) || 1)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-teal-500 font-bold"
                />
                <span className="text-[10px] text-slate-400">Total de pessoas simultâneas</span>
              </div>

              <div>
                <label className="block text-xs text-slate-700 font-semibold mb-1">Duração da Reserva (Min) *</label>
                <input
                  type="number"
                  min={15}
                  step={15}
                  required
                  value={form.capacitySettings.avgDurationMinutes}
                  onChange={(e) => handleCapacityChange('avgDurationMinutes', parseInt(e.target.value) || 60)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-teal-500 font-bold"
                />
                <span className="text-[10px] text-slate-400">Giro médio da mesa ({bType === 'BAR' ? 'ex: 120 min' : 'ex: 90 min'})</span>
              </div>

              <div>
                <label className="block text-xs text-slate-700 font-semibold mb-1">Tamanho Mínimo do Grupo</label>
                <input
                  type="number"
                  min={1}
                  value={cat.min_group_size || 1}
                  onChange={(e) => handleCategorySettingChange('min_group_size', parseInt(e.target.value) || 1)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-teal-500"
                />
                <span className="text-[10px] text-slate-400">Mínimo de pessoas por reserva</span>
              </div>

              <div>
                <label className="block text-xs text-slate-700 font-semibold mb-1">Tamanho Máximo do Grupo *</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={cat.max_group_size || form.capacitySettings.maxPaxPerBooking || 8}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 8;
                    handleCategorySettingChange('max_group_size', val);
                    handleCapacityChange('maxPaxPerBooking', val);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-teal-500 font-bold"
                />
                <span className="text-[10px] text-slate-400">Grupos maiores sob consulta</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs text-slate-700 font-semibold mb-1">Tolerância de Atraso (Minutos)</label>
                <input
                  type="number"
                  min={0}
                  value={form.capacitySettings.toleranceMinutes}
                  onChange={(e) => handleCapacityChange('toleranceMinutes', parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-teal-500"
                />
                <span className="text-[10px] text-slate-400">Tempo antes de liberar a mesa reservada</span>
              </div>

              <div>
                <label className="block text-xs text-slate-700 font-semibold mb-1">Antecedência Mínima (Horas)</label>
                <input
                  type="number"
                  min={0}
                  value={form.capacitySettings.minAdvanceHours}
                  onChange={(e) => handleCapacityChange('minAdvanceHours', parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-teal-500"
                />
                <span className="text-[10px] text-slate-400">Antecedência para reservas online</span>
              </div>
            </div>
          </div>
        )}

        {/* 2. BARBEARIA */}
        {bType === 'BARBERSHOP' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-slate-700 font-semibold mb-1">Duração Média Padrão (Min) *</label>
                <input
                  type="number"
                  min={15}
                  step={5}
                  required
                  value={form.capacitySettings.avgDurationMinutes || 40}
                  onChange={(e) => handleCapacityChange('avgDurationMinutes', parseInt(e.target.value) || 40)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-teal-500 font-bold"
                />
                <span className="text-[10px] text-slate-400">Tempo médio de corte / acabamento</span>
              </div>

              <div>
                <label className="block text-xs text-slate-700 font-semibold mb-1">Intervalo entre Cortes (Min) *</label>
                <input
                  type="number"
                  min={0}
                  step={5}
                  value={cat.buffer_between_appointments_minutes ?? 10}
                  onChange={(e) => handleCategorySettingChange('buffer_between_appointments_minutes', parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-teal-500 font-bold"
                />
                <span className="text-[10px] text-slate-400">Tempo de higienização de bancada e lâmina</span>
              </div>

              <div>
                <label className="block text-xs text-slate-700 font-semibold mb-1">Tolerância de Atraso (Minutos)</label>
                <input
                  type="number"
                  min={0}
                  value={form.capacitySettings.toleranceMinutes}
                  onChange={(e) => handleCapacityChange('toleranceMinutes', parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-teal-500"
                />
                <span className="text-[10px] text-slate-400">Tolerância para comparecimento</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/80 cursor-pointer">
                <input
                  type="checkbox"
                  checked={cat.allow_combo_hair_beard ?? true}
                  onChange={(e) => handleCategorySettingChange('allow_combo_hair_beard', e.target.checked)}
                  className="w-4 h-4 accent-sky-600 rounded"
                />
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Permitir Combo Corte + Barba Consecutivo</span>
                  <span className="text-[10px] text-slate-500">Soma os tempos dos dois serviços na mesma cadeira com o mesmo barbeiro.</span>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/80 cursor-pointer">
                <input
                  type="checkbox"
                  checked={cat.allow_choose_barber ?? true}
                  onChange={(e) => handleCategorySettingChange('allow_choose_barber', e.target.checked)}
                  className="w-4 h-4 accent-sky-600 rounded"
                />
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Cliente Escolhe o Barbeiro</span>
                  <span className="text-[10px] text-slate-500">Permite ao cliente selecionar o profissional favorito no agendamento.</span>
                </div>
              </label>
            </div>

            <div className="p-3.5 bg-sky-50/70 rounded-xl border border-sky-200 text-xs text-sky-900 space-y-1">
              <span className="font-bold text-sky-950 block">💈 Operação de Barbearia:</span>
              <p>Os agendamentos são organizados por <strong>Barbeiro</strong> e <strong>Cadeira</strong>. Não há mesas cadastradas, garantindo que cada profissional tenha sua própria agenda independente.</p>
            </div>
          </div>
        )}

        {/* 3. SALÃO DE BELEZA */}
        {bType === 'SALON' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-slate-700 font-semibold mb-1">Duração Média Padrão (Min) *</label>
                <input
                  type="number"
                  min={15}
                  step={15}
                  required
                  value={form.capacitySettings.avgDurationMinutes || 60}
                  onChange={(e) => handleCapacityChange('avgDurationMinutes', parseInt(e.target.value) || 60)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-teal-500 font-bold"
                />
                <span className="text-[10px] text-slate-400">Duração para procedimentos sem tempo fixo</span>
              </div>

              <div>
                <label className="block text-xs text-slate-700 font-semibold mb-1">Intervalo entre Atendimentos (Min) *</label>
                <input
                  type="number"
                  min={0}
                  step={5}
                  value={cat.buffer_between_appointments_minutes ?? 15}
                  onChange={(e) => handleCategorySettingChange('buffer_between_appointments_minutes', parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-teal-500 font-bold"
                />
                <span className="text-[10px] text-slate-400">Intervalo para higienização e organização de bancada</span>
              </div>

              <div>
                <label className="block text-xs text-slate-700 font-semibold mb-1">Tolerância de Atraso (Minutos)</label>
                <input
                  type="number"
                  min={0}
                  value={form.capacitySettings.toleranceMinutes}
                  onChange={(e) => handleCapacityChange('toleranceMinutes', parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-teal-500"
                />
                <span className="text-[10px] text-slate-400">Tolerância para comparecimento</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/80 cursor-pointer">
                <input
                  type="checkbox"
                  checked={cat.allow_chemical_processing_pause ?? true}
                  onChange={(e) => handleCategorySettingChange('allow_chemical_processing_pause', e.target.checked)}
                  className="w-4 h-4 accent-rose-600 rounded"
                />
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Pausa para Ação Química / Coloração</span>
                  <span className="text-[10px] text-slate-500">Permite encaixe durante o tempo de pausa e ação de produtos.</span>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/80 cursor-pointer">
                <input
                  type="checkbox"
                  checked={cat.allow_simultaneous_specialists ?? true}
                  onChange={(e) => handleCategorySettingChange('allow_simultaneous_specialists', e.target.checked)}
                  className="w-4 h-4 accent-rose-600 rounded"
                />
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Serviços Casados com Vários Especialistas</span>
                  <span className="text-[10px] text-slate-500">Ex: Agendar Cabelo com Cabeleireira e Unhas com Manicure em sequência.</span>
                </div>
              </label>
            </div>

            <div className="p-3.5 bg-rose-50/70 rounded-xl border border-rose-200 text-xs text-rose-900 space-y-1">
              <span className="font-bold text-rose-950 block">💅 Operação de Salão de Beleza:</span>
              <p>Os agendamentos são distribuídos entre os <strong>Especialistas</strong> (Cabeleireiros, Manicures, Estilistas). Sem mesas físicas, cada profissional tem sua própria taxa de ocupação.</p>
            </div>
          </div>
        )}

        {/* 4. CLÍNICA */}
        {bType === 'CLINIC' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-slate-700 font-semibold mb-1">Duração Padrão da Consulta (Min) *</label>
                <input
                  type="number"
                  min={15}
                  step={15}
                  required
                  value={form.capacitySettings.avgDurationMinutes || 60}
                  onChange={(e) => handleCapacityChange('avgDurationMinutes', parseInt(e.target.value) || 60)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-teal-500 font-bold"
                />
                <span className="text-[10px] text-slate-400">Duração média de cada atendimento</span>
              </div>

              <div>
                <label className="block text-xs text-slate-700 font-semibold mb-1">Preparo & Higienização do Consultório (Min) *</label>
                <input
                  type="number"
                  min={0}
                  step={5}
                  value={cat.buffer_between_appointments_minutes ?? 15}
                  onChange={(e) => handleCategorySettingChange('buffer_between_appointments_minutes', parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-teal-500 font-bold"
                />
                <span className="text-[10px] text-slate-400">Tempo para desinfecção da sala</span>
              </div>

              <div>
                <label className="block text-xs text-slate-700 font-semibold mb-1">Antecedência Mínima (Horas)</label>
                <input
                  type="number"
                  min={0}
                  value={form.capacitySettings.minAdvanceHours}
                  onChange={(e) => handleCapacityChange('minAdvanceHours', parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-teal-500"
                />
                <span className="text-[10px] text-slate-400">Mínimo de antecedência para agendar</span>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 text-xs text-slate-600 space-y-1">
              <span className="font-bold text-slate-900 block">🏥 Gestão Clínica:</span>
              <p>Gerencie seus <strong>Especialistas</strong> na aba de profissionais e seus <strong>Consultórios</strong> na aba de salas para evitar conflito de ambiente.</p>
            </div>
          </div>
        )}

        {/* 5. SPA & TERAPIAS */}
        {bType === 'SPA' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-slate-700 font-semibold mb-1">Duração da Sessão / Terapia (Min) *</label>
                <input
                  type="number"
                  min={30}
                  step={15}
                  required
                  value={form.capacitySettings.avgDurationMinutes || 60}
                  onChange={(e) => handleCapacityChange('avgDurationMinutes', parseInt(e.target.value) || 60)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-teal-500 font-bold"
                />
                <span className="text-[10px] text-slate-400">Tempo de massagem / relaxamento</span>
              </div>

              <div>
                <label className="block text-xs text-slate-700 font-semibold mb-1">Ambientação & Troca de Sala (Min) *</label>
                <input
                  type="number"
                  min={5}
                  step={5}
                  value={cat.buffer_between_appointments_minutes ?? 20}
                  onChange={(e) => handleCategorySettingChange('buffer_between_appointments_minutes', parseInt(e.target.value) || 5)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-teal-500 font-bold"
                />
                <span className="text-[10px] text-slate-400">Troca de lençóis, óleos e climatização</span>
              </div>

              <div>
                <label className="block text-xs text-slate-700 font-semibold mb-1">Antecedência Mínima (Horas)</label>
                <input
                  type="number"
                  min={1}
                  value={form.capacitySettings.minAdvanceHours || 2}
                  onChange={(e) => handleCapacityChange('minAdvanceHours', parseInt(e.target.value) || 1)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-teal-500"
                />
                <span className="text-[10px] text-slate-400">Mínimo para preparar o espaço zen</span>
              </div>
            </div>
          </div>
        )}

        {/* 6. STUDIO */}
        {bType === 'STUDIO' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-slate-700 font-semibold mb-1">Capacidade Máxima por Turma *</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={cat.max_students_per_class || 15}
                  onChange={(e) => handleCategorySettingChange('max_students_per_class', parseInt(e.target.value) || 1)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-teal-500 font-bold"
                />
                <span className="text-[10px] text-slate-400">Limite de alunos por aula/turma</span>
              </div>

              <div>
                <label className="block text-xs text-slate-700 font-semibold mb-1">Duração da Aula (Minutos) *</label>
                <input
                  type="number"
                  min={15}
                  step={15}
                  required
                  value={form.capacitySettings.avgDurationMinutes}
                  onChange={(e) => handleCapacityChange('avgDurationMinutes', parseInt(e.target.value) || 60)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-teal-500 font-bold"
                />
                <span className="text-[10px] text-slate-400">Tempo de duração das sessões</span>
              </div>

              <div>
                <label className="block text-xs text-slate-700 font-semibold mb-1">Tolerância para Início (Minutos)</label>
                <input
                  type="number"
                  min={0}
                  value={form.capacitySettings.toleranceMinutes}
                  onChange={(e) => handleCapacityChange('toleranceMinutes', parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-teal-500"
                />
                <span className="text-[10px] text-slate-400">Tolerância para entrada na sala</span>
              </div>
            </div>
          </div>
        )}

        {/* 7. ESPAÇO DE EVENTOS */}
        {bType === 'EVENTS' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-slate-700 font-semibold mb-1">Capacidade Total de Convidados *</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={cat.max_guests || 150}
                  onChange={(e) => handleCategorySettingChange('max_guests', parseInt(e.target.value) || 1)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-teal-500 font-bold"
                />
                <span className="text-[10px] text-slate-400">Limite de público do estabelecimento</span>
              </div>

              <div>
                <label className="block text-xs text-slate-700 font-semibold mb-1">Duração Mínima de Locação (Horas) *</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={cat.min_event_hours || 4}
                  onChange={(e) => {
                    const hrs = parseInt(e.target.value) || 1;
                    handleCategorySettingChange('min_event_hours', hrs);
                    handleCapacityChange('avgDurationMinutes', hrs * 60);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-teal-500 font-bold"
                />
                <span className="text-[10px] text-slate-400">Mínimo de tempo para reserva</span>
              </div>

              <div>
                <label className="block text-xs text-slate-700 font-semibold mb-1">Antecedência Mínima (Horas) *</label>
                <input
                  type="number"
                  min={1}
                  value={form.capacitySettings.minAdvanceHours}
                  onChange={(e) => handleCapacityChange('minAdvanceHours', parseInt(e.target.value) || 1)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-teal-500"
                />
                <span className="text-[10px] text-slate-400">Prazo de antecedência para reservas</span>
              </div>
            </div>
          </div>
        )}

        {/* 8. OUTROS SERVIÇOS */}
        {bType === 'OTHER' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-slate-700 font-semibold mb-1">Duração Média (Minutos) *</label>
                <input
                  type="number"
                  min={15}
                  step={15}
                  required
                  value={form.capacitySettings.avgDurationMinutes || 60}
                  onChange={(e) => handleCapacityChange('avgDurationMinutes', parseInt(e.target.value) || 60)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-teal-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-700 font-semibold mb-1">Intervalo entre Atendimentos (Min)</label>
                <input
                  type="number"
                  min={0}
                  step={5}
                  value={cat.buffer_between_appointments_minutes ?? 10}
                  onChange={(e) => handleCategorySettingChange('buffer_between_appointments_minutes', parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-700 font-semibold mb-1">Antecedência Mínima (Horas)</label>
                <input
                  type="number"
                  min={0}
                  value={form.capacitySettings.minAdvanceHours || 2}
                  onChange={(e) => handleCapacityChange('minAdvanceHours', parseInt(e.target.value) || 1)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Confirmação e Política comum */}
        <div className="pt-4 border-t border-slate-100 space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.capacitySettings.autoConfirm}
              onChange={(e) => handleCapacityChange('autoConfirm', e.target.checked)}
              className="w-4 h-4 accent-teal-600 rounded"
            />
            <div>
              <span className="text-xs font-bold text-slate-900 block">Confirmação Automática de Agendamento</span>
              <span className="text-[11px] text-slate-500">Se ativo, reservas feitas pelo cliente são confirmadas instantaneamente. Se desativado, ficam pendentes da sua aprovação manual.</span>
            </div>
          </label>

          <div>
            <label className="block text-xs text-slate-700 font-semibold mb-1">Política de Cancelamento</label>
            <input
              type="text"
              value={form.cancellationPolicy}
              onChange={(e) => setForm(prev => ({ ...prev, cancellationPolicy: e.target.value }))}
              placeholder="Ex: Cancelamento gratuito até 2 horas antes do horário marcado."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-teal-500"
            />
          </div>
        </div>

      </div>

      {/* Botão de Salvar */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSaving}
          className="bg-[#bde870] hover:bg-[#afdf5c] text-slate-950 font-black py-3 px-6 rounded-xl shadow-sm text-xs flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? 'Salvando no Supabase...' : 'Salvar Opções de Reserva'}</span>
        </button>
      </div>
    </form>
  );
};
