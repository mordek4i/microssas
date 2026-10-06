import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import type { BusinessType, Establishment } from '../../types';
import { Save, Store, Clock, ShieldCheck } from 'lucide-react';

export const ProfileConfig: React.FC = () => {
  const { currentEstablishment, updateEstablishment } = useApp();

  const [form, setForm] = useState<Establishment>(currentEstablishment);

  const dayNames = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];

  const handleChange = (field: keyof Establishment, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleHourChange = (dayIndex: number, field: string, value: any) => {
    setForm(prev => ({
      ...prev,
      businessHours: {
        ...prev.businessHours,
        [dayIndex]: {
          ...prev.businessHours[dayIndex],
          [field]: value
        }
      }
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateEstablishment(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 1. Informações Básicas */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Store className="w-4 h-4 text-teal-600" />
          <span>Informações do Estabelecimento</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-slate-700 font-semibold mb-1">Nome do Estabelecimento *</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-700 font-semibold mb-1">Tipo de Negócio *</label>
            <select
              value={form.businessType}
              onChange={(e) => handleChange('businessType', e.target.value as BusinessType)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-teal-500 font-medium"
            >
              <option value="RESTAURANT">Restaurante</option>
              <option value="BAR">Bar / Pub</option>
              <option value="CAFE">Cafeteria / Bistrô</option>
              <option value="BARBERSHOP">Barbearia</option>
              <option value="SALON">Salão de Beleza</option>
              <option value="CLINIC">Clínica Médica / Odonto / Estética</option>
              <option value="SPA">Spa & Terapias</option>
              <option value="STUDIO">Studio / Fitness / Pilates</option>
              <option value="EVENTS">Espaço de Eventos</option>
              <option value="OTHER">Outros Serviços com Agendamento</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-slate-700 font-semibold mb-1">Slogan / Frase Curta</label>
            <input
              type="text"
              value={form.tagline}
              onChange={(e) => handleChange('tagline', e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-700 font-semibold mb-1">Identificador Público (URL Slug)</label>
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs">
              <span className="text-slate-400 font-medium">/r/</span>
              <input
                type="text"
                value={form.slug}
                onChange={(e) => handleChange('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                className="bg-transparent text-teal-700 font-bold focus:outline-none flex-1"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs text-slate-700 font-semibold mb-1">Descrição Completa</label>
          <textarea
            rows={3}
            value={form.description}
            onChange={(e) => handleChange('description', e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-teal-500"
          />
        </div>

        {/* Imagens */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
          <div>
            <label className="block text-xs text-slate-700 font-semibold mb-1">URL da Logomarca (Logo)</label>
            <input
              type="url"
              value={form.logoUrl}
              onChange={(e) => handleChange('logoUrl', e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-700 font-semibold mb-1">URL da Capa / Foto Principal</label>
            <input
              type="url"
              value={form.coverUrl}
              onChange={(e) => handleChange('coverUrl', e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-teal-500"
            />
          </div>
        </div>

        {/* Contatos */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
          <div>
            <label className="block text-xs text-slate-700 font-semibold mb-1">WhatsApp de Reservas *</label>
            <input
              type="text"
              value={form.whatsapp}
              onChange={(e) => handleChange('whatsapp', e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-700 font-semibold mb-1">Endereço Completo</label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => handleChange('address', e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-700 font-semibold mb-1">Cidade / Estado</label>
            <input
              type="text"
              value={form.cityState}
              onChange={(e) => handleChange('cityState', e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-teal-500"
            />
          </div>
        </div>
      </div>

      {/* 2. Horários de Funcionamento */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-500" />
          <span>Horários e Dias de Funcionamento</span>
        </h3>

        <div className="space-y-2">
          {[0, 1, 2, 3, 4, 5, 6].map(dayIndex => {
            const hour = form.businessHours[dayIndex] || { active: true, open: '12:00', close: '22:00' };

            return (
              <div key={dayIndex} className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-xs">
                <div className="flex items-center gap-3 w-40 shrink-0">
                  <input
                    type="checkbox"
                    checked={hour.active}
                    onChange={(e) => handleHourChange(dayIndex, 'active', e.target.checked)}
                    className="accent-teal-600 rounded"
                  />
                  <span className={`font-bold ${hour.active ? 'text-slate-900' : 'text-slate-400 line-through'}`}>
                    {dayNames[dayIndex]}
                  </span>
                </div>

                {hour.active ? (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-500">Abertura:</span>
                    <input
                      type="time"
                      value={hour.open}
                      onChange={(e) => handleHourChange(dayIndex, 'open', e.target.value)}
                      className="bg-white border border-slate-200 rounded px-2 py-1 text-slate-800 text-xs font-semibold"
                    />
                    <span className="text-slate-500">até</span>
                    <input
                      type="time"
                      value={hour.close}
                      onChange={(e) => handleHourChange(dayIndex, 'close', e.target.value)}
                      className="bg-white border border-slate-200 rounded px-2 py-1 text-slate-800 text-xs font-semibold"
                    />
                  </div>
                ) : (
                  <span className="text-xs text-rose-500 font-medium">Fechado</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Informação sobre regras da categoria */}
      <div className="p-4 rounded-xl bg-teal-50/60 border border-teal-200/80 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-4 h-4 text-teal-700 shrink-0" />
          <span className="text-teal-950 font-medium">
            Regras específicas de capacidade e atendimento podem ser ajustadas na aba <strong>Regras da Categoria</strong>.
          </span>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          className="bg-[#bde870] hover:bg-[#afdf5c] text-slate-950 font-black py-3 px-6 rounded-xl shadow-sm text-xs flex items-center gap-2 transition-all active:scale-95"
        >
          <Save className="w-4 h-4" />
          <span>Salvar Perfil & Horários</span>
        </button>
      </div>
    </form>
  );
};
