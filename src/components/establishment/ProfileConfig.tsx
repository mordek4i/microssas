import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import type { BusinessType, Establishment } from '../../types';
import {
  Save,
  Store,
  Clock,
  ShieldCheck,
  Sparkles,
  Upload,
  Trash2,
  Camera,
  Image as ImageIcon,
  Loader2,
  AlertCircle
} from 'lucide-react';

export const ProfileConfig: React.FC = () => {
  const {
    currentEstablishment,
    updateEstablishment,
    uploadEstablishmentImage,
    removeEstablishmentImage
  } = useApp();

  const [form, setForm] = useState<Establishment>(currentEstablishment);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [coverError, setCoverError] = useState<string | null>(null);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setForm(prev => ({
      ...prev,
      logoUrl: currentEstablishment.logoUrl,
      coverUrl: currentEstablishment.coverUrl
    }));
  }, [currentEstablishment.logoUrl, currentEstablishment.coverUrl]);

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

  const handleLogoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoError(null);

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      setLogoError('Formato inválido. Use JPG, PNG ou WEBP.');
      e.target.value = '';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setLogoError('A imagem deve ter no máximo 5MB.');
      e.target.value = '';
      return;
    }

    setUploadingLogo(true);
    try {
      const url = await uploadEstablishmentImage(file, 'logo');
      setForm(prev => ({ ...prev, logoUrl: url }));
    } catch (err: any) {
      setLogoError(err?.message || 'Erro ao enviar a logomarca. Tente novamente.');
    } finally {
      setUploadingLogo(false);
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  };

  const handleRemoveLogo = async () => {
    if (uploadingLogo) return;
    if (!window.confirm('Deseja realmente remover a logomarca?')) return;
    setLogoError(null);
    setUploadingLogo(true);
    try {
      await removeEstablishmentImage('logo');
      setForm(prev => ({ ...prev, logoUrl: '' }));
    } catch (err: any) {
      setLogoError(err?.message || 'Erro ao remover a logomarca.');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleCoverSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverError(null);

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      setCoverError('Formato inválido. Use JPG, PNG ou WEBP.');
      e.target.value = '';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setCoverError('A imagem deve ter no máximo 5MB.');
      e.target.value = '';
      return;
    }

    setUploadingCover(true);
    try {
      const url = await uploadEstablishmentImage(file, 'cover');
      setForm(prev => ({ ...prev, coverUrl: url }));
    } catch (err: any) {
      setCoverError(err?.message || 'Erro ao enviar a foto de capa. Tente novamente.');
    } finally {
      setUploadingCover(false);
      if (coverInputRef.current) coverInputRef.current.value = '';
    }
  };

  const handleRemoveCover = async () => {
    if (uploadingCover) return;
    if (!window.confirm('Deseja realmente remover a foto de capa?')) return;
    setCoverError(null);
    setUploadingCover(true);
    try {
      await removeEstablishmentImage('cover');
      setForm(prev => ({ ...prev, coverUrl: '' }));
    } catch (err: any) {
      setCoverError(err?.message || 'Erro ao remover a foto de capa.');
    } finally {
      setUploadingCover(false);
    }
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

      {/* 2. Identidade do Estabelecimento (Logo & Capa) */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-sm space-y-5">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-teal-600" />
            <span>Identidade do Estabelecimento</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Personalize a aparência do seu estabelecimento na página pública de reservas. Formatos JPG, PNG ou WEBP até 5MB.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card Gerenciamento de Logo */}
          <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800">Logomarca (Logo)</label>
              <span className="text-[10px] font-medium text-slate-400">Recomendado: 400x400px (1:1)</span>
            </div>

            <div className="flex items-center gap-4">
              {/* Preview do Logo */}
              <div className="relative w-24 h-24 rounded-2xl border-2 border-dashed border-slate-300 bg-white flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                {form.logoUrl ? (
                  <img
                    src={form.logoUrl}
                    alt="Logo do estabelecimento"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="text-center p-2">
                    <Camera className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                    <span className="text-[10px] text-slate-400 font-medium leading-none block">Sem logo</span>
                  </div>
                )}

                {uploadingLogo && (
                  <div className="absolute inset-0 bg-white/80 backdrop-blur-xs flex flex-col items-center justify-center">
                    <Loader2 className="w-5 h-5 text-teal-600 animate-spin" />
                    <span className="text-[9px] font-bold text-teal-800 mt-1">Enviando...</span>
                  </div>
                )}
              </div>

              {/* Ações do Logo */}
              <div className="flex-1 space-y-2">
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={handleLogoSelect}
                  disabled={uploadingLogo}
                />

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={uploadingLogo}
                    onClick={() => logoInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-xs flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5 text-teal-600" />
                    <span>{form.logoUrl ? 'Substituir logo' : 'Adicionar logo'}</span>
                  </button>

                  {form.logoUrl && (
                    <button
                      type="button"
                      disabled={uploadingLogo}
                      onClick={handleRemoveLogo}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/80 flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remover</span>
                    </button>
                  )}
                </div>

                {logoError && (
                  <p className="text-[11px] text-rose-600 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{logoError}</span>
                  </p>
                )}

                <p className="text-[11px] text-slate-500">
                  Aparece no cabeçalho do seu perfil e na confirmação das reservas.
                </p>
              </div>
            </div>
          </div>

          {/* Card Gerenciamento de Foto de Capa */}
          <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800">Foto de Capa (Banner)</label>
              <span className="text-[10px] font-medium text-slate-400">Recomendado: 1200x400px (16:9 ou banner)</span>
            </div>

            <div className="space-y-3">
              {/* Preview da Capa */}
              <div className="relative w-full h-28 rounded-xl border-2 border-dashed border-slate-300 bg-white flex items-center justify-center overflow-hidden shadow-xs">
                {form.coverUrl ? (
                  <img
                    src={form.coverUrl}
                    alt="Foto de capa do estabelecimento"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="text-center p-2">
                    <ImageIcon className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                    <span className="text-[10px] text-slate-400 font-medium">Nenhuma foto de capa definida</span>
                  </div>
                )}

                {uploadingCover && (
                  <div className="absolute inset-0 bg-white/80 backdrop-blur-xs flex flex-col items-center justify-center">
                    <Loader2 className="w-6 h-6 text-teal-600 animate-spin" />
                    <span className="text-[10px] font-bold text-teal-800 mt-1">Enviando capa...</span>
                  </div>
                )}
              </div>

              {/* Ações da Capa */}
              <div className="flex items-center justify-between gap-2">
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={handleCoverSelect}
                  disabled={uploadingCover}
                />

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={uploadingCover}
                    onClick={() => coverInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-xs flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5 text-teal-600" />
                    <span>{form.coverUrl ? 'Substituir capa' : 'Adicionar foto de capa'}</span>
                  </button>

                  {form.coverUrl && (
                    <button
                      type="button"
                      disabled={uploadingCover}
                      onClick={handleRemoveCover}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/80 flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remover</span>
                    </button>
                  )}
                </div>
              </div>

              {coverError && (
                <p className="text-[11px] text-rose-600 font-medium flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{coverError}</span>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Horários de Funcionamento */}
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
