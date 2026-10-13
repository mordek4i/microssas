import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  User, 
  Mail, 
  ShieldCheck, 
  LogOut 
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { currentUser, logout } = useApp();

  return (
    <div className="space-y-6 pb-12 max-w-4xl">
      {/* Header */}
      <div>
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">
          MINHA CONTA
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
          Configurações da Conta<span className="text-[#0d9488]">.</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Gerencie suas informações de acesso e credenciais do ReservaZen.
        </p>
      </div>

      {/* 1. DADOS DO PERFIL & CONTA */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
          <div className="w-10 h-10 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 tracking-tight">
              Perfil do Usuário
            </h3>
            <p className="text-xs text-slate-500">
              Dados cadastrados e credenciais de acesso
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Nome Completo
            </span>
            <span className="text-sm font-bold text-slate-900 block">
              {currentUser?.name || 'Não informado'}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              E-mail de Acesso
            </span>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="text-sm font-bold text-slate-900 truncate">
                {currentUser?.email || 'contato@reservazen.com.br'}
              </span>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/70 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="text-emerald-900 font-semibold">
              Conta autenticada e protegida com segurança
            </span>
          </div>
          <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100/80 px-2.5 py-0.5 rounded-full">
            Ativa
          </span>
        </div>
      </div>

      {/* 2. SEGURANÇA & SESSÃO */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-black text-slate-900">
            Encerrar Sessão
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Desconectar sua conta com segurança deste dispositivo.
          </p>
        </div>

        <button
          type="button"
          onClick={logout}
          className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 transition-colors cursor-pointer w-fit"
        >
          <LogOut className="w-4 h-4" />
          <span>Sair da Conta</span>
        </button>
      </div>
    </div>
  );
};
