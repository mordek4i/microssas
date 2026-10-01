import React from 'react';
import { 
  ArrowRight, 
  Calendar, 
  BarChart2, 
  QrCode, 
  Layers, 
  MessageSquare, 
  Clock, 
  Check
} from 'lucide-react';

interface LandingPageProps {
  onStartSignup: () => void;
  onOpenLogin: () => void;
  onDemoAccess: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartSignup,
  onOpenLogin,
  onDemoAccess
}) => {
  return (
    <div className="min-h-screen bg-[#fcfdfd] text-slate-900 font-sans selection:bg-[#10b981] selection:text-white">
      {/* Navigation Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 px-6 lg:px-16 py-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <img
            src="/reservazen-logo-tight.png"
            alt="ReservaZen Logo"
            className="h-14 sm:h-16 w-auto object-contain"
          />
        </div>

        {/* Center Nav Links */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-600">
          <a href="#recursos" className="hover:text-emerald-700 transition-colors">Recursos</a>
          <a href="#como-funciona" className="hover:text-emerald-700 transition-colors">Como funciona</a>
          <a href="#planos" className="hover:text-emerald-700 transition-colors">Planos</a>
        </nav>

        {/* Action Buttons */}
        <div className="flex items-center gap-4">
          <button
            onClick={onOpenLogin}
            className="text-xs font-extrabold text-slate-700 hover:text-slate-950 transition-colors cursor-pointer"
          >
            Entrar
          </button>

          <button
            onClick={onStartSignup}
            className="bg-[#10b981] hover:bg-[#059669] text-white font-extrabold px-5 py-2.5 rounded-full text-xs transition-all shadow-xs active:scale-95 cursor-pointer"
          >
            Começar 7 dias grátis
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 pt-12 lg:pt-16 pb-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left Content Column */}
        <div className="space-y-6 text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-extrabold">
            <span className="text-emerald-600">🎉</span>
            <span>7 dias de teste grátis — Sem cartão de crédito</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.12]">
            Organize suas reservas e mantenha seu estabelecimento sempre <span className="text-[#10b981]">cheio.</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-600 max-w-lg leading-relaxed font-normal">
            Receba reservas 24 horas por dia, reduza horários vazios e acompanhe todos os seus agendamentos em um único painel. Experimente 7 dias grátis sem compromisso.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <button
              onClick={onStartSignup}
              className="w-full sm:w-auto bg-[#10b981] hover:bg-[#059669] text-white font-black py-3.5 px-7 rounded-full text-xs flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer"
            >
              <span>Começar 7 dias grátis</span>
              <ArrowRight className="w-4 h-4 stroke-[3]" />
            </button>

            <button
              onClick={onDemoAccess}
              className="w-full sm:w-auto bg-white hover:bg-slate-50 text-slate-700 font-bold py-3.5 px-6 rounded-full border border-slate-200 text-xs text-center transition-colors cursor-pointer"
            >
              Ver recursos
            </button>
          </div>

          {/* Sub-bullet Checkmarks */}
          <div className="flex flex-wrap items-center gap-6 text-[11px] text-slate-500 font-semibold pt-2">
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
              7 dias grátis sem cartão
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
              Configuração em minutos
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
              Cancele quando quiser
            </span>
          </div>
        </div>

        {/* Right Hero Image Column with Badges */}
        <div className="relative">
          <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-slate-100">
            <img
              src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80"
              alt="Estabelecimento elegante"
              className="w-full h-[380px] sm:h-[440px] object-cover"
            />

            {/* Top Right Floating Badge */}
            <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-2xl shadow-lg border border-slate-100 flex items-center gap-2.5 animate-fade-in-up">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                🎁
              </div>
              <div className="text-left">
                <span className="block text-[10px] font-extrabold text-slate-400 uppercase">Nova reserva</span>
                <span className="block text-xs font-black text-slate-900">Mesa 12 - 20:30</span>
              </div>
            </div>

            {/* Bottom Left Floating Badge */}
            <div className="absolute bottom-6 left-6 bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-lg border border-slate-100 max-w-[200px] text-left space-y-1.5 animate-fade-in-up">
              <span className="text-[10px] font-bold text-slate-500 block">Ocupação hoje</span>
              <div className="text-xl font-black text-emerald-600">92%</div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full w-[92%]" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Strip */}
      <section className="bg-slate-50/70 border-y border-slate-100 py-12">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-3xl sm:text-4xl font-black text-slate-900">+2.400</div>
            <div className="text-xs font-semibold text-slate-500 mt-1">reservas/mês</div>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-black text-slate-900">-38%</div>
            <div className="text-xs font-semibold text-slate-500 mt-1">de mesas vazias</div>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-black text-slate-900">24/7</div>
            <div className="text-xs font-semibold text-slate-500 mt-1">recebendo reservas</div>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-black text-slate-900">4.9/5</div>
            <div className="text-xs font-semibold text-slate-500 mt-1">satisfação</div>
          </div>
        </div>
      </section>

      {/* Main Features Section ("Tudo que seu negócio precisa para gerir reservas") */}
      <section id="recursos" className="max-w-6xl mx-auto px-6 py-20 space-y-12">
        <div className="space-y-3 text-left">
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight max-w-xl">
            Tudo que seu negócio precisa para gerir reservas
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-xl">
            Para restaurantes, bares, cafeterias, lounges, salões, espaços de eventos e muito mais.
          </p>
        </div>

        {/* 6 Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="p-6 rounded-2xl bg-white border border-slate-100 shadow-2xs hover:shadow-xs transition-shadow space-y-3 text-left">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Calendar className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-extrabold text-slate-900">Reservas 24h</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Seus clientes reservam a qualquer hora, sem depender de mensagens no WhatsApp.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-6 rounded-2xl bg-white border border-slate-100 shadow-2xs hover:shadow-xs transition-shadow space-y-3 text-left">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <BarChart2 className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-extrabold text-slate-900">Painel completo</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Acompanhe ocupação, horários de pico e movimento diário, semanal e mensal.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-6 rounded-2xl bg-white border border-slate-100 shadow-2xs hover:shadow-xs transition-shadow space-y-3 text-left">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <QrCode className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-extrabold text-slate-900">QR Code próprio</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Coloque nas mesas, cardápios e fachada. O cliente escaneia e reserva na hora.
            </p>
          </div>

          {/* Card 4 */}
          <div className="p-6 rounded-2xl bg-white border border-slate-100 shadow-2xs hover:shadow-xs transition-shadow space-y-3 text-left">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-extrabold text-slate-900">Controle de capacidade</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Nunca mais aceite reservas além da sua capacidade real de mesas ou espaços.
            </p>
          </div>

          {/* Card 5 */}
          <div className="p-6 rounded-2xl bg-white border border-slate-100 shadow-2xs hover:shadow-xs transition-shadow space-y-3 text-left">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <MessageSquare className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-extrabold text-slate-900">Lembretes</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Estrutura pronta para confirmações e lembretes por WhatsApp e e-mail.
            </p>
          </div>

          {/* Card 6 */}
          <div className="p-6 rounded-2xl bg-white border border-slate-100 shadow-2xs hover:shadow-xs transition-shadow space-y-3 text-left">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-extrabold text-slate-900">Agenda visual</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Visão diária, semanal e mensal de todas as suas reservas em um só lugar.
            </p>
          </div>
        </div>
      </section>

      {/* Category Image Cards (Restaurantes, Cafeterias, Bares & Lounges) */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Restaurantes */}
          <div className="relative rounded-3xl overflow-hidden h-64 group shadow-md cursor-pointer" onClick={onStartSignup}>
            <img
              src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80"
              alt="Restaurantes"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            <h3 className="absolute bottom-6 left-6 text-lg font-black text-white">Restaurantes</h3>
          </div>

          {/* Card 2: Cafeterias */}
          <div className="relative rounded-3xl overflow-hidden h-64 group shadow-md cursor-pointer" onClick={onStartSignup}>
            <img
              src="https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80"
              alt="Cafeterias"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            <h3 className="absolute bottom-6 left-6 text-lg font-black text-white">Cafeterias</h3>
          </div>

          {/* Card 3: Bares & Lounges */}
          <div className="relative rounded-3xl overflow-hidden h-64 group shadow-md cursor-pointer" onClick={onStartSignup}>
            <img
              src="https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=800&q=80"
              alt="Bares & Lounges"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            <h3 className="absolute bottom-6 left-6 text-lg font-black text-white">Bares & Lounges</h3>
          </div>
        </div>
      </section>

      {/* How it Works ("Comece em 3 passos") */}
      <section id="como-funciona" className="max-w-6xl mx-auto px-6 py-16 space-y-12 text-center">
        <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Comece em 3 passos
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          {/* Step 1 */}
          <div className="p-8 rounded-3xl bg-white border border-slate-100 shadow-2xs space-y-4">
            <span className="text-5xl font-black text-emerald-200 block">01</span>
            <h3 className="text-base font-extrabold text-slate-900">Crie sua conta</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Cadastre seu estabelecimento em poucos minutos.
            </p>
          </div>

          {/* Step 2 */}
          <div className="p-8 rounded-3xl bg-white border border-slate-100 shadow-2xs space-y-4">
            <span className="text-5xl font-black text-emerald-200 block">02</span>
            <h3 className="text-base font-extrabold text-slate-900">Configure sua página</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Horários, capacidade, mesas e regras do seu jeito.
            </p>
          </div>

          {/* Step 3 */}
          <div className="p-8 rounded-3xl bg-white border border-slate-100 shadow-2xs space-y-4">
            <span className="text-5xl font-black text-emerald-200 block">03</span>
            <h3 className="text-base font-extrabold text-slate-900">Compartilhe o link</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Divulgue sua página e QR Code para começar a receber reservas.
            </p>
          </div>
        </div>
      </section>

      {/* Dark Green Bottom CTA Banner */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="rounded-3xl bg-linear-to-br from-[#064e3b] via-[#047857] to-[#022c22] text-white p-10 sm:p-16 text-center space-y-6 shadow-2xl relative overflow-hidden">
          <div className="space-y-3 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-xs font-bold">
              <span>🎁 Experimente por 7 dias grátis</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
              Comece seu teste grátis hoje mesmo
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100 font-normal">
              Monte sua página de reservas em 2 minutos e comece a receber agendamentos. Sem cobrança nos primeiros 7 dias.
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={onStartSignup}
              className="bg-[#10b981] hover:bg-[#059669] text-white font-black py-4 px-8 rounded-full text-xs inline-flex items-center gap-2 shadow-lg transition-all active:scale-95 cursor-pointer"
            >
              <span>Começar meus 7 dias grátis</span>
              <ArrowRight className="w-4 h-4 stroke-[3]" />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 bg-white py-8 px-6 lg:px-16 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
        <div className="flex items-center gap-3">
          <img
            src="/reservazen-logo-tight.png"
            alt="ReservaZen Logo"
            className="h-10 sm:h-12 w-auto object-contain"
          />
        </div>
        <div>
          © 2026 ReservaZen. Todos os direitos reservados.
        </div>
        <div className="flex items-center gap-4 text-slate-600 font-semibold">
          <a href="#recursos" className="hover:text-emerald-600">Recursos</a>
          <button onClick={onOpenLogin} className="hover:text-emerald-600 cursor-pointer">Entrar</button>
        </div>
      </footer>
    </div>
  );
};
