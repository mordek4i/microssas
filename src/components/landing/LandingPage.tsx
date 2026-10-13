import React, { useState, useRef, useEffect } from 'react';
import { 
  ArrowRight, 
  Calendar, 
  BarChart2, 
  QrCode, 
  Layers, 
  MessageSquare, 
  Clock, 
  Check,
  ChevronDown,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { motion, useReducedMotion, useInView, AnimatePresence } from 'motion/react';

interface LandingPageProps {
  onStartSignup: () => void;
  onOpenLogin: () => void;
  onDemoAccess: () => void;
}

// Smooth cubic bezier easing for premium SaaS motion
const easeOutExpo = [0.16, 1, 0.3, 1] as const;

// Animated Stat Counter Component
interface AnimatedStatProps {
  value: string;
  label: string;
}

const AnimatedStat: React.FC<AnimatedStatProps> = ({ value, label }) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.4 });
  const shouldReduceMotion = useReducedMotion();
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    if (!isInView || shouldReduceMotion) {
      setDisplayValue(value);
      return;
    }

    if (value.startsWith('+') && value.includes('.')) {
      // "+2.400"
      const target = 2400;
      const duration = 1200;
      const startTime = performance.now();

      const update = (now: number) => {
        const progress = Math.min((now - startTime) / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 3);
        const current = Math.floor(ease * target);
        setDisplayValue(`+${current.toLocaleString('pt-BR')}`);
        if (progress < 1) requestAnimationFrame(update);
      };
      requestAnimationFrame(update);
    } else if (value.startsWith('-') && value.endsWith('%')) {
      // "-38%"
      const target = 38;
      const duration = 1000;
      const startTime = performance.now();

      const update = (now: number) => {
        const progress = Math.min((now - startTime) / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 3);
        const current = Math.floor(ease * target);
        setDisplayValue(`-${current}%`);
        if (progress < 1) requestAnimationFrame(update);
      };
      requestAnimationFrame(update);
    } else if (value.includes('/5')) {
      // "4.9/5"
      const target = 4.9;
      const duration = 1200;
      const startTime = performance.now();

      const update = (now: number) => {
        const progress = Math.min((now - startTime) / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 3);
        const current = (ease * target).toFixed(1);
        setDisplayValue(`${current}/5`);
        if (progress < 1) requestAnimationFrame(update);
      };
      requestAnimationFrame(update);
    } else {
      setDisplayValue(value);
    }
  }, [isInView, shouldReduceMotion, value]);

  return (
    <div ref={ref} className="space-y-1">
      <div className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
        {displayValue}
      </div>
      <div className="text-xs font-semibold text-slate-500">{label}</div>
    </div>
  );
};

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartSignup,
  onOpenLogin,
  onDemoAccess
}) => {
  const shouldReduceMotion = useReducedMotion();
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  // Common motion variants configured with reduced-motion awareness
  const fadeInUp = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 20 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.55, ease: easeOutExpo } 
    }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.08,
        delayChildren: shouldReduceMotion ? 0 : 0.05
      }
    }
  };

  const buttonHoverTap = shouldReduceMotion ? {} : {
    whileHover: { scale: 1.02, y: -1 },
    whileTap: { scale: 0.98 }
  };

  const cardHover = shouldReduceMotion ? {} : {
    whileHover: { y: -4 }
  };

  // Official ReservaZen Plans
  const plans = [
    {
      id: 'mensal',
      name: 'Mensal',
      price: 'R$ 49,90',
      period: '/mês',
      periodDescription: 'Cobrança mensal recorrente',
      badge: null,
      highlight: false,
      features: [
        'Acesso completo a todas as ferramentas',
        'Página pública exclusiva de reservas',
        'Agendamentos e clientes ilimitados',
        'Lembretes e notificações automáticas',
        'Sem fidelidade, cancele quando quiser'
      ]
    },
    {
      id: 'semestral',
      name: 'Semestral',
      price: 'R$ 249,90',
      period: 'por 6 meses',
      periodDescription: 'Equivale a apenas R$ 41,65/mês',
      badge: 'Mais escolhido',
      highlight: true,
      features: [
        'Acesso completo a todas as ferramentas',
        'Página pública exclusiva de reservas',
        'Agendamentos e clientes ilimitados',
        'Lembretes e notificações automáticas',
        'Economia garantida por 6 meses'
      ]
    },
    {
      id: 'anual',
      name: 'Anual',
      price: 'R$ 399,90',
      period: 'por 12 meses',
      periodDescription: 'Equivale a apenas R$ 33,32/mês',
      badge: 'Melhor custo-benefício',
      highlight: false,
      features: [
        'Acesso completo a todas as ferramentas',
        'Página pública exclusiva de reservas',
        'Agendamentos e clientes ilimitados',
        'Lembretes e notificações automáticas',
        'Maior economia anual garantida'
      ]
    }
  ];

  // FAQ Items
  const faqItems = [
    {
      q: 'Como funciona o período de teste grátis de 3 dias?',
      a: 'Você cria sua conta em menos de 2 minutos e tem acesso irrestrito a todas as funcionalidades do ReservaZen por 3 dias completos. Não cobramos nada durante esse período.'
    },
    {
      q: 'Preciso cadastrar cartão de crédito para começar?',
      a: 'Não! O cadastro inicial é 100% livre de cartão de crédito. Você só assina um plano se gostar da plataforma ao término do seu teste.'
    },
    {
      q: 'Como meus clientes fazem as reservas?',
      a: 'Você recebe um link público exclusivo (ex: reservazen.com.br/r/seu-estabelecimento) e um QR Code pronto para impressão. O cliente acessa direto pelo celular, escolhe o horário e reserva em segundos, sem precisar baixar aplicativos.'
    },
    {
      q: 'Posso cancelar minha assinatura a qualquer momento?',
      a: 'Sim, a qualquer momento sem burocracia ou multas. Não exigimos contratos de fidelidade.'
    }
  ];

  return (
    <div className="min-h-screen bg-[#fcfdfd] text-slate-900 font-sans selection:bg-[#10b981] selection:text-white">
      {/* Navigation Header */}
      <motion.header 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: easeOutExpo }}
        className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-100 px-6 lg:px-16 py-4 flex items-center justify-between"
      >
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
          <a href="#faq" className="hover:text-emerald-700 transition-colors">Dúvidas</a>
        </nav>

        {/* Action Buttons */}
        <div className="flex items-center gap-4">
          <motion.button
            {...buttonHoverTap}
            onClick={onOpenLogin}
            className="text-xs font-extrabold text-slate-700 hover:text-slate-950 transition-colors cursor-pointer"
          >
            Entrar
          </motion.button>

          <motion.button
            {...buttonHoverTap}
            onClick={onStartSignup}
            className="bg-[#10b981] hover:bg-[#059669] text-white font-extrabold px-5 py-2.5 rounded-full text-xs transition-colors shadow-xs cursor-pointer"
          >
            Começar agora
          </motion.button>
        </div>
      </motion.header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 pt-12 lg:pt-16 pb-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left Content Column */}
        <div className="space-y-6 text-left">
          {/* Top Announcement Pill */}
          <motion.div
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: easeOutExpo }}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-extrabold"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Crie sua página de reservas em minutos — Sem complicação</span>
          </motion.div>

          {/* Main Title */}
          <motion.h1 
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.1, ease: easeOutExpo }}
            className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.12]"
          >
            Organize suas reservas e mantenha seu estabelecimento sempre <span className="text-[#10b981]">cheio.</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p 
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.2, ease: easeOutExpo }}
            className="text-sm sm:text-base text-slate-600 max-w-lg leading-relaxed font-normal"
          >
            Receba reservas 24 horas por dia, reduza horários vazios e acompanhe todos os seus agendamentos em um único painel, de forma simples e profissional.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div 
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: easeOutExpo }}
            className="flex flex-col sm:flex-row items-center gap-3 pt-2"
          >
            <motion.button
              {...buttonHoverTap}
              onClick={onStartSignup}
              className="w-full sm:w-auto bg-[#10b981] hover:bg-[#059669] text-white font-black py-3.5 px-7 rounded-full text-xs flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-shadow cursor-pointer"
            >
              <span>Criar minha conta</span>
              <ArrowRight className="w-4 h-4 stroke-[3]" />
            </motion.button>

            <motion.button
              {...buttonHoverTap}
              onClick={onDemoAccess}
              className="w-full sm:w-auto bg-white hover:bg-slate-50 text-slate-700 font-bold py-3.5 px-6 rounded-full border border-slate-200 text-xs text-center transition-colors cursor-pointer"
            >
              Ver recursos
            </motion.button>
          </motion.div>

          {/* Sub-bullet Checkmarks with subtle stagger */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.42 }}
            className="flex flex-wrap items-center gap-6 text-[11px] text-slate-500 font-semibold pt-2"
          >
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
              Sem necessidade de cartão
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
              Configuração em minutos
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
              Cancele quando quiser
            </span>
          </motion.div>
        </div>

        {/* Right Hero Preview Column with Cinematic Floating Badges */}
        <div className="relative">
          {/* Subtle Ambient Emerald Aura Glow */}
          <div className="absolute -inset-4 bg-gradient-to-tr from-emerald-500/15 via-emerald-400/5 to-teal-500/10 rounded-3xl blur-2xl -z-10 pointer-events-none" />

          <motion.div 
            initial={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.96, y: shouldReduceMotion ? 0 : 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15, ease: easeOutExpo }}
            className="relative rounded-3xl overflow-hidden shadow-2xl border border-slate-100 bg-white"
          >
            <img
              src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80"
              alt="Estabelecimento elegante"
              className="w-full h-[380px] sm:h-[440px] object-cover"
            />

            {/* Top Right Floating Badge */}
            <motion.div 
              initial={{ opacity: 0, x: shouldReduceMotion ? 0 : 25, y: shouldReduceMotion ? 0 : -10 }}
              animate={shouldReduceMotion ? { opacity: 1, x: 0, y: 0 } : { 
                opacity: 1, 
                x: 0, 
                y: [0, -6, 0]
              }}
              transition={{
                opacity: { duration: 0.6, delay: 0.45, ease: easeOutExpo },
                x: { duration: 0.6, delay: 0.45, ease: easeOutExpo },
                y: { duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 0.7 }
              }}
              className="absolute top-4 right-4 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-2xl shadow-lg border border-slate-100 flex items-center gap-2.5"
            >
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
                🎁
              </div>
              <div className="text-left">
                <span className="block text-[10px] font-extrabold text-slate-400 uppercase">Nova reserva</span>
                <span className="block text-xs font-black text-slate-900">Mesa 12 - 20:30</span>
              </div>
            </motion.div>

            {/* Bottom Left Floating Badge with Animated Progress Bar */}
            <motion.div 
              initial={{ opacity: 0, x: shouldReduceMotion ? 0 : -25, y: shouldReduceMotion ? 0 : 15 }}
              animate={shouldReduceMotion ? { opacity: 1, x: 0, y: 0 } : { 
                opacity: 1, 
                x: 0, 
                y: [0, 6, 0]
              }}
              transition={{
                opacity: { duration: 0.6, delay: 0.55, ease: easeOutExpo },
                x: { duration: 0.6, delay: 0.55, ease: easeOutExpo },
                y: { duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }
              }}
              className="absolute bottom-6 left-6 bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-lg border border-slate-100 max-w-[200px] text-left space-y-1.5"
            >
              <span className="text-[10px] font-bold text-slate-500 block">Ocupação hoje</span>
              <div className="text-xl font-black text-emerald-600">92%</div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '92%' }}
                  transition={{ duration: 1.1, delay: 0.75, ease: easeOutExpo }}
                  className="h-full bg-emerald-500 rounded-full" 
                />
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Stats Strip with Progressive Animated Numbers */}
      <section className="bg-slate-50/70 border-y border-slate-100 py-12">
        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          className="max-w-6xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center"
        >
          <motion.div variants={fadeInUp}>
            <AnimatedStat value="+2.400" label="reservas/mês" />
          </motion.div>
          <motion.div variants={fadeInUp}>
            <AnimatedStat value="-38%" label="de mesas vazias" />
          </motion.div>
          <motion.div variants={fadeInUp}>
            <AnimatedStat value="24/7" label="recebendo reservas" />
          </motion.div>
          <motion.div variants={fadeInUp}>
            <AnimatedStat value="4.9/5" label="satisfação" />
          </motion.div>
        </motion.div>
      </section>

      {/* Main Features Section ("Tudo que seu negócio precisa para gerir reservas") */}
      <section id="recursos" className="max-w-6xl mx-auto px-6 py-20 space-y-12">
        <motion.div 
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: easeOutExpo }}
          className="space-y-3 text-left"
        >
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight max-w-xl">
            Tudo que seu negócio precisa para gerir reservas
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-xl">
            Para restaurantes, bares, cafeterias, lounges, salões, espaços de eventos e muito mais.
          </p>
        </motion.div>

        {/* 6 Feature Cards Grid with Stagger & Subtle Hover Elevation */}
        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {/* Card 1 */}
          <motion.div 
            variants={fadeInUp}
            {...cardHover}
            className="group p-6 rounded-2xl bg-white border border-slate-100 shadow-2xs hover:shadow-xl hover:shadow-emerald-950/5 hover:border-emerald-200/70 transition-all text-left space-y-3 cursor-default"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold group-hover:scale-105 group-hover:bg-emerald-100 transition-all duration-200">
              <Calendar className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-extrabold text-slate-900">Reservas 24h</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Seus clientes reservam a qualquer hora, sem depender de mensagens no WhatsApp.
            </p>
          </motion.div>

          {/* Card 2 */}
          <motion.div 
            variants={fadeInUp}
            {...cardHover}
            className="group p-6 rounded-2xl bg-white border border-slate-100 shadow-2xs hover:shadow-xl hover:shadow-emerald-950/5 hover:border-emerald-200/70 transition-all text-left space-y-3 cursor-default"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold group-hover:scale-105 group-hover:bg-emerald-100 transition-all duration-200">
              <BarChart2 className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-extrabold text-slate-900">Painel completo</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Acompanhe ocupação, horários de pico e movimento diário, semanal e mensal.
            </p>
          </motion.div>

          {/* Card 3 */}
          <motion.div 
            variants={fadeInUp}
            {...cardHover}
            className="group p-6 rounded-2xl bg-white border border-slate-100 shadow-2xs hover:shadow-xl hover:shadow-emerald-950/5 hover:border-emerald-200/70 transition-all text-left space-y-3 cursor-default"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold group-hover:scale-105 group-hover:bg-emerald-100 transition-all duration-200">
              <QrCode className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-extrabold text-slate-900">QR Code próprio</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Coloque nas mesas, cardápios e fachada. O cliente escaneia e reserva na hora.
            </p>
          </motion.div>

          {/* Card 4 */}
          <motion.div 
            variants={fadeInUp}
            {...cardHover}
            className="group p-6 rounded-2xl bg-white border border-slate-100 shadow-2xs hover:shadow-xl hover:shadow-emerald-950/5 hover:border-emerald-200/70 transition-all text-left space-y-3 cursor-default"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold group-hover:scale-105 group-hover:bg-emerald-100 transition-all duration-200">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-extrabold text-slate-900">Controle de capacidade</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Nunca mais aceite reservas além da sua capacidade real de mesas ou espaços.
            </p>
          </motion.div>

          {/* Card 5 */}
          <motion.div 
            variants={fadeInUp}
            {...cardHover}
            className="group p-6 rounded-2xl bg-white border border-slate-100 shadow-2xs hover:shadow-xl hover:shadow-emerald-950/5 hover:border-emerald-200/70 transition-all text-left space-y-3 cursor-default"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold group-hover:scale-105 group-hover:bg-emerald-100 transition-all duration-200">
              <MessageSquare className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-extrabold text-slate-900">Lembretes</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Estrutura pronta para confirmações e lembretes por WhatsApp e e-mail.
            </p>
          </motion.div>

          {/* Card 6 */}
          <motion.div 
            variants={fadeInUp}
            {...cardHover}
            className="group p-6 rounded-2xl bg-white border border-slate-100 shadow-2xs hover:shadow-xl hover:shadow-emerald-950/5 hover:border-emerald-200/70 transition-all text-left space-y-3 cursor-default"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold group-hover:scale-105 group-hover:bg-emerald-100 transition-all duration-200">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-extrabold text-slate-900">Agenda visual</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Visão diária, semanal e mensal de todas as suas reservas em um só lugar.
            </p>
          </motion.div>
        </motion.div>
      </section>

      {/* Category Image Cards (Restaurantes, Cafeterias, Bares & Lounges) */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {/* Card 1: Restaurantes */}
          <motion.div 
            variants={fadeInUp}
            {...cardHover}
            className="relative rounded-3xl overflow-hidden h-64 group shadow-md cursor-pointer" 
            onClick={onStartSignup}
          >
            <img
              src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80"
              alt="Restaurantes"
              className="w-full h-full object-cover group-hover:scale-106 transition-transform duration-500 ease-out"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            <h3 className="absolute bottom-6 left-6 text-lg font-black text-white">Restaurantes</h3>
          </motion.div>

          {/* Card 2: Cafeterias */}
          <motion.div 
            variants={fadeInUp}
            {...cardHover}
            className="relative rounded-3xl overflow-hidden h-64 group shadow-md cursor-pointer" 
            onClick={onStartSignup}
          >
            <img
              src="https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80"
              alt="Cafeterias"
              className="w-full h-full object-cover group-hover:scale-106 transition-transform duration-500 ease-out"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            <h3 className="absolute bottom-6 left-6 text-lg font-black text-white">Cafeterias</h3>
          </motion.div>

          {/* Card 3: Bares & Lounges */}
          <motion.div 
            variants={fadeInUp}
            {...cardHover}
            className="relative rounded-3xl overflow-hidden h-64 group shadow-md cursor-pointer" 
            onClick={onStartSignup}
          >
            <img
              src="https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=800&q=80"
              alt="Bares & Lounges"
              className="w-full h-full object-cover group-hover:scale-106 transition-transform duration-500 ease-out"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            <h3 className="absolute bottom-6 left-6 text-lg font-black text-white">Bares & Lounges</h3>
          </motion.div>
        </motion.div>
      </section>

      {/* How it Works ("Comece em 3 passos") */}
      <section id="como-funciona" className="max-w-6xl mx-auto px-6 py-16 space-y-12 text-center">
        <motion.h2 
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: easeOutExpo }}
          className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight"
        >
          Comece em 3 passos
        </motion.h2>

        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left"
        >
          {/* Step 1 */}
          <motion.div 
            variants={fadeInUp}
            {...cardHover}
            className="group p-8 rounded-3xl bg-white border border-slate-100 shadow-2xs hover:shadow-xl hover:shadow-emerald-950/5 hover:border-emerald-200/60 transition-all space-y-4"
          >
            <span className="text-5xl font-black text-emerald-200 group-hover:text-emerald-400/80 transition-colors block">01</span>
            <h3 className="text-base font-extrabold text-slate-900">Crie sua conta</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Cadastre seu estabelecimento em poucos minutos.
            </p>
          </motion.div>

          {/* Step 2 */}
          <motion.div 
            variants={fadeInUp}
            {...cardHover}
            className="group p-8 rounded-3xl bg-white border border-slate-100 shadow-2xs hover:shadow-xl hover:shadow-emerald-950/5 hover:border-emerald-200/60 transition-all space-y-4"
          >
            <span className="text-5xl font-black text-emerald-200 group-hover:text-emerald-400/80 transition-colors block">02</span>
            <h3 className="text-base font-extrabold text-slate-900">Configure sua página</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Horários, capacidade, mesas e regras do seu jeito.
            </p>
          </motion.div>

          {/* Step 3 */}
          <motion.div 
            variants={fadeInUp}
            {...cardHover}
            className="group p-8 rounded-3xl bg-white border border-slate-100 shadow-2xs hover:shadow-xl hover:shadow-emerald-950/5 hover:border-emerald-200/60 transition-all space-y-4"
          >
            <span className="text-5xl font-black text-emerald-200 group-hover:text-emerald-400/80 transition-colors block">03</span>
            <h3 className="text-base font-extrabold text-slate-900">Compartilhe o link</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Divulgue sua página e QR Code para começar a receber reservas.
            </p>
          </motion.div>
        </motion.div>
      </section>

      {/* Plans Section ("Planos Transparentes") */}
      <section id="planos" className="max-w-6xl mx-auto px-6 py-20 space-y-12 text-center">
        <motion.div 
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: easeOutExpo }}
          className="space-y-3 max-w-xl mx-auto"
        >
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-extrabold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>3 dias de teste grátis em todos os planos</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Planos simples e transparentes
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Comece com 3 dias grátis. Escolha o plano ideal para o tamanho do seu negócio.
          </p>
        </motion.div>

        {/* Pricing Cards Grid */}
        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-left items-stretch"
        >
          {plans.map((plan) => (
            <motion.div
              key={plan.id}
              variants={fadeInUp}
              whileHover={shouldReduceMotion ? undefined : { y: -6 }}
              className={`relative rounded-3xl p-8 flex flex-col justify-between transition-shadow duration-300 ${
                plan.highlight
                  ? 'bg-gradient-to-b from-emerald-50/60 via-white to-white border-2 border-[#10b981] shadow-xl shadow-emerald-500/10'
                  : 'bg-white border border-slate-200 shadow-sm hover:shadow-md'
              }`}
            >
              {/* Highlight Badge */}
              {plan.badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 flex justify-center w-max max-w-[90%] z-10">
                  <span className="bg-[#10b981] text-white text-[10px] font-extrabold px-3.5 py-1 rounded-full shadow-sm uppercase tracking-wide whitespace-nowrap inline-flex items-center justify-center">
                    {plan.badge}
                  </span>
                </div>
              )}

              <div className="space-y-6">
                {/* Plan Header */}
                <div>
                  <h3 className="text-lg font-black text-slate-900">{plan.name}</h3>
                  <p className="text-xs text-slate-500 mt-1">{plan.periodDescription}</p>
                </div>

                {/* Price */}
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                    {plan.price}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">{plan.period}</span>
                </div>

                {/* Feature List */}
                <ul className="space-y-3 pt-2 text-xs text-slate-600 font-medium">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Button */}
              <div className="pt-8">
                <motion.button
                  {...buttonHoverTap}
                  onClick={onStartSignup}
                  className={`w-full py-3.5 px-6 rounded-full text-xs font-black transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-xs ${
                    plan.highlight
                      ? 'bg-[#10b981] hover:bg-[#059669] text-white shadow-md'
                      : 'bg-slate-900 hover:bg-slate-800 text-white'
                  }`}
                >
                  <span>Começar 3 dias grátis</span>
                  <ArrowRight className="w-3.5 h-3.5 stroke-[3]" />
                </motion.button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* FAQ Accordion Section */}
      <section id="faq" className="max-w-4xl mx-auto px-6 py-16 space-y-10">
        <motion.div 
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: easeOutExpo }}
          className="text-center space-y-2"
        >
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Perguntas frequentes
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Tire suas principais dúvidas sobre o ReservaZen.
          </p>
        </motion.div>

        <div className="space-y-3">
          {faqItems.map((item, index) => {
            const isOpen = openFaqIndex === index;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.45, delay: index * 0.05, ease: easeOutExpo }}
                className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-2xs"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                  className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/50 transition-colors"
                >
                  <span className="text-sm font-extrabold text-slate-900">
                    {item.q}
                  </span>
                  <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.25, ease: easeOutExpo }}
                    className="shrink-0 text-slate-400"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </motion.div>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: easeOutExpo }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 sm:px-6 sm:pb-6 pt-0 text-xs text-slate-500 leading-relaxed border-t border-slate-50">
                        {item.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Dark Green Bottom CTA Banner with Ambient Motion */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <motion.div 
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 25, scale: shouldReduceMotion ? 1 : 0.98 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.7, ease: easeOutExpo }}
          className="rounded-3xl bg-gradient-to-br from-[#064e3b] via-[#047857] to-[#022c22] text-white p-10 sm:p-16 text-center space-y-6 shadow-2xl relative overflow-hidden"
        >
          {/* Subtle Ambient Radial Light */}
          <div className="absolute inset-0 bg-radial from-emerald-400/10 via-transparent to-transparent pointer-events-none" />

          <div className="space-y-3 max-w-2xl mx-auto relative z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-xs font-bold">
              <span>🚀 Comece hoje mesmo</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
              Comece a receber reservas hoje mesmo
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100 font-normal">
              Monte sua página de reservas em 2 minutos e comece a receber agendamentos de forma rápida e segura.
            </p>
          </div>

          <div className="pt-2 relative z-10">
            <motion.button
              {...buttonHoverTap}
              onClick={onStartSignup}
              className="bg-[#10b981] hover:bg-[#059669] text-white font-black py-4 px-8 rounded-full text-xs inline-flex items-center gap-2 shadow-lg transition-colors cursor-pointer"
            >
              <span>Criar minha página agora</span>
              <ArrowRight className="w-4 h-4 stroke-[3]" />
            </motion.button>
          </div>
        </motion.div>
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
          <a href="#recursos" className="hover:text-emerald-600 transition-colors">Recursos</a>
          <a href="#planos" className="hover:text-emerald-600 transition-colors">Planos</a>
          <a href="#faq" className="hover:text-emerald-600 transition-colors">Dúvidas</a>
          <button onClick={onOpenLogin} className="hover:text-emerald-600 transition-colors cursor-pointer">Entrar</button>
        </div>
      </footer>
    </div>
  );
};
