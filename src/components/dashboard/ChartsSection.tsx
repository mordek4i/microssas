import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend 
} from 'recharts';
import { Clock, TrendingUp, Users, PieChart as PieIcon, Calendar } from 'lucide-react';

export const ChartsSection: React.FC = () => {
  const { filteredBookings, currentEstablishment, getResourceTerm } = useApp();

  // -------------------------------------------------------------
  // 1. CHART: EVOLUÇÃO DAS RESERVAS POR DIA (Semana Atual)
  // -------------------------------------------------------------
  const dayEvolutionData = useMemo(() => {
    // Dias da semana de Segunda (index 0) a Domingo (index 6)
    const dayLabels = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
    const fullLabels = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'];

    // Obter data da segunda-feira da semana atual
    const today = new Date();
    const currentDayOfWeek = today.getDay(); // 0 = Domingo, 1 = Segunda...
    const distanceToMonday = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;
    
    const monday = new Date(today);
    monday.setDate(today.getDate() + distanceToMonday);

    return dayLabels.map((shortName, idx) => {
      const dayDate = new Date(monday);
      dayDate.setDate(monday.getDate() + idx);
      const dateIso = dayDate.toISOString().split('T')[0];
      const dayFormatted = `${String(dayDate.getDate()).padStart(2, '0')}/${String(dayDate.getMonth() + 1).padStart(2, '0')}`;

      // Filtrar reservas reais deste dia para o estabelecimento atual
      const dayBookings = filteredBookings.filter(b => b.date === dateIso);
      const reservas = dayBookings.length;
      const clientes = dayBookings.reduce((sum, b) => sum + (b.pax || 1), 0);

      return {
        date: `${shortName} (${dayFormatted})`,
        label: `${fullLabels[idx]} (${dayFormatted})`,
        reservas,
        clientes
      };
    });
  }, [filteredBookings]);

  // -------------------------------------------------------------
  // 2. CHART: HORÁRIOS DE MAIOR MOVIMENTO (Pico Real)
  // -------------------------------------------------------------
  const peakHoursData = useMemo(() => {
    // Faixas horárias padrão de atendimento
    const defaultHours = [
      '09:00', '10:00', '11:00', '12:00', '13:00', '14:00',
      '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'
    ];

    // Agrupar reservas reais por hora
    const hourMap: Record<string, { reservas: number; pax: number }> = {};
    defaultHours.forEach(h => {
      hourMap[h] = { reservas: 0, pax: 0 };
    });

    filteredBookings.forEach(b => {
      const timePrefix = b.time ? b.time.substring(0, 2) + ':00' : '19:00';
      if (!hourMap[timePrefix]) {
        hourMap[timePrefix] = { reservas: 0, pax: 0 };
      }
      hourMap[timePrefix].reservas += 1;
      hourMap[timePrefix].pax += (b.pax || 1);
    });

    return Object.entries(hourMap)
      .map(([hora, val]) => ({
        hora,
        reservas: val.reservas,
        pax: val.pax
      }))
      .sort((a, b) => a.hora.localeCompare(b.hora));
  }, [filteredBookings]);

  // Encontrar o horário com mais reservas (pico real)
  const peakHourItem = useMemo(() => {
    let max = 0;
    let hour = '';
    peakHoursData.forEach(p => {
      if (p.reservas > max) {
        max = p.reservas;
        hour = p.hora;
      }
    });
    return max > 0 ? { hour, count: max } : null;
  }, [peakHoursData]);

  // -------------------------------------------------------------
  // 3. CHART: STATUS DAS RESERVAS (Confirmadas, Pendentes, etc.)
  // -------------------------------------------------------------
  const pieData = useMemo(() => {
    const statusCounts: Record<string, number> = {
      CONFIRMED: 0,
      PENDING: 0,
      IN_SERVICE: 0,
      COMPLETED: 0,
      CANCELLED: 0,
      NO_SHOW: 0
    };

    filteredBookings.forEach(b => {
      if (statusCounts[b.status] !== undefined) {
        statusCounts[b.status] += 1;
      }
    });

    const definitions = [
      { key: 'CONFIRMED', name: 'Confirmadas', color: '#10b981' },
      { key: 'PENDING', name: 'Pendentes', color: '#f59e0b' },
      { key: 'IN_SERVICE', name: 'Em Atendimento', color: '#0d9488' },
      { key: 'COMPLETED', name: 'Concluídas', color: '#0284c7' },
      { key: 'CANCELLED', name: 'Canceladas', color: '#f43f5e' },
      { key: 'NO_SHOW', name: 'Não Compareceu', color: '#94a3b8' }
    ];

    return definitions
      .map(d => ({
        name: d.name,
        value: statusCounts[d.key],
        color: d.color
      }))
      .filter(item => item.value > 0);
  }, [filteredBookings]);

  // -------------------------------------------------------------
  // 4. CHART: OCUPAÇÃO POR RECURSO (Mesas, Barbeiros, Salas, etc.)
  // -------------------------------------------------------------
  const resourceData = useMemo(() => {
    if (!currentEstablishment.resources || currentEstablishment.resources.length === 0) {
      return [];
    }

    return currentEstablishment.resources.map(res => {
      const resBookings = filteredBookings.filter(
        b => b.resourceId === res.id || b.resourceName === res.name
      );
      const count = resBookings.length;
      const pax = resBookings.reduce((sum, b) => sum + (b.pax || 1), 0);

      return {
        name: res.name.length > 16 ? res.name.substring(0, 16) + '...' : res.name,
        fullName: res.name,
        reservas: count,
        pax
      };
    });
  }, [filteredBookings, currentEstablishment.resources]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 1. Evolução das Reservas por Dia */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-2xs flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-teal-600" />
              <span>Evolução por Dia na Semana</span>
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Reservas e pessoas atendidas em cada dia
            </p>
          </div>
          <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
            Semana Atual
          </span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dayEvolutionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorReservas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0d9488" stopOpacity={0.35}/>
                  <stop offset="95%" stopColor="#0d9488" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorClientes" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0284c7" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#0284c7" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} allowDecimals={false} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#ffffff', 
                  borderColor: '#e2e8f0', 
                  borderRadius: '16px', 
                  fontSize: '11px', 
                  fontWeight: 600,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.08)' 
                }}
                labelStyle={{ fontWeight: 800, color: '#0f172a' }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Area type="monotone" dataKey="reservas" name="Reservas" stroke="#0d9488" strokeWidth={2.5} fillOpacity={1} fill="url(#colorReservas)" />
              <Area type="monotone" dataKey="clientes" name="Pessoas Atendidas" stroke="#0284c7" strokeWidth={2} fillOpacity={1} fill="url(#colorClientes)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Horários de Maior Movimento (Pico) */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-2xs flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              <span>Horários de Maior Movimento</span>
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Distribuição da demanda pelas faixas horárias</p>
          </div>

          {peakHourItem && (
            <span className="text-[10px] font-black text-amber-900 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 flex items-center gap-1">
              <span>Pico: {peakHourItem.hour}</span>
              <span>({peakHourItem.count})</span>
            </span>
          )}
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={peakHoursData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="hora" stroke="#94a3b8" fontSize={10} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} allowDecimals={false} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#ffffff', 
                  borderColor: '#e2e8f0', 
                  borderRadius: '16px', 
                  fontSize: '11px', 
                  fontWeight: 600,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.08)' 
                }}
                labelStyle={{ fontWeight: 800, color: '#0f172a' }}
              />
              <Bar dataKey="reservas" name="Reservas Agendadas" fill="#0d9488" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3. Proporção de Status */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-2xs flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-sky-600" />
              <span>Status das Reservas</span>
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Confirmadas, pendentes, concluídas e canceladas</p>
          </div>
          <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
            Total: {filteredBookings.length}
          </span>
        </div>

        <div className="h-64 w-full flex items-center justify-center">
          {pieData.length === 0 ? (
            <div className="text-center p-6 text-slate-400 text-xs space-y-1">
              <Calendar className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="font-bold text-slate-600">Nenhuma reserva neste período</p>
              <p className="text-[11px]">Os dados aparecerão assim que houver reservas cadastradas.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="#ffffff" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#ffffff', 
                    borderColor: '#e2e8f0', 
                    borderRadius: '16px', 
                    fontSize: '11px',
                    fontWeight: 600,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.08)' 
                  }}
                  formatter={(value: any, name: any) => [`${value} reservas`, name]}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} layout="horizontal" align="center" verticalAlign="bottom" />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* 4. Demanda por Recursos */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-2xs flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-600" />
              <span>Ocupação por {getResourceTerm(true)}</span>
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Volume de agendamentos em cada {getResourceTerm(false).toLowerCase()}
            </p>
          </div>
          <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
            {currentEstablishment.resources.length} {getResourceTerm(true).toLowerCase()}
          </span>
        </div>

        <div className="h-64 w-full">
          {resourceData.length === 0 ? (
            <div className="text-center p-6 text-slate-400 text-xs">
              Nenhum recurso cadastrado para este estabelecimento.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={resourceData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <XAxis type="number" stroke="#94a3b8" fontSize={10} tickLine={false} allowDecimals={false} />
                <YAxis dataKey="name" type="category" stroke="#475569" fontSize={10} tickLine={false} width={110} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#ffffff', 
                    borderColor: '#e2e8f0', 
                    borderRadius: '16px', 
                    fontSize: '11px',
                    fontWeight: 600,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.08)' 
                  }}
                  labelStyle={{ fontWeight: 800, color: '#0f172a' }}
                />
                <Bar dataKey="reservas" name="Total Reservas" fill="#8b5cf6" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
};
