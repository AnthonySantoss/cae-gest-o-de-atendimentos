import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { BarChart3, Users, RefreshCw, BookOpen, GraduationCap, FileText, TrendingUp } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';
import { relatoriosApi, type Kpis, type EvolucaoMensalItem, type DistribuicaoItem, type SatisfacaoItem } from '../../lib/api.js';

const COLORS = ['#818cf8', '#c084fc', '#34d399', '#fbbf24', '#f472b6', '#38bdf8'];
const CHART_STYLE = { backgroundColor: 'rgba(15,23,42,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fff' };
const AXIS_STYLE = { stroke: 'rgba(255,255,255,0.4)', fontSize: 11 };

function StatCard({ title, value, sub, icon, delay = 0 }: {
  title: string; value: string | number; sub?: string; icon: React.ReactNode; delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="glass-card rounded-2xl p-5"
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="p-2 rounded-lg bg-white/5 border border-white/10">{icon}</div>
        <p className="text-sm text-slate-300">{title}</p>
      </div>
      <h3 className="text-2xl font-bold text-white">{value ?? '—'}</h3>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </motion.div>
  );
}

export default function RelatoriosPage() {
  const [kpis, setKpis] = useState<Kpis | null>(null);
  const [mensal, setMensal] = useState<EvolucaoMensalItem[]>([]);
  const [servicos, setServicos] = useState<DistribuicaoItem[]>([]);
  const [satisfacao, setSatisfacao] = useState<SatisfacaoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState(6);

  const fetchAll = async () => {
    setLoading(true);
    await Promise.all([
      relatoriosApi.getKpis().then(r => setKpis(r.data)),
      relatoriosApi.getEvolucaoMensal(periodo).then(r => setMensal(r.data)),
      relatoriosApi.getDistribuicaoServicos().then(r => setServicos(r.data)),
      relatoriosApi.getSatisfacao().then(r => setSatisfacao(r.data)),
    ]);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, [periodo]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <BarChart3 className="text-blue-400 w-5 h-5" /> Relatórios Gerenciais
        </h2>
        <div className="flex gap-2">
          <select
            value={periodo}
            onChange={e => setPeriodo(Number(e.target.value))}
            className="glass-input rounded-xl px-3 py-2 text-sm appearance-none bg-slate-800/50 text-white border border-white/10"
          >
            <option value={3}>Últimos 3 meses</option>
            <option value={6}>Últimos 6 meses</option>
            <option value={12}>Último ano</option>
          </select>
          <button onClick={fetchAll} className="glass-button-secondary p-2.5 rounded-xl text-slate-400 hover:text-white transition-colors">
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Atendidos (mês)" value={loading ? '...' : kpis?.total_atendimentos_mes ?? 0} sub="Este mês" icon={<Users className="w-4 h-4 text-blue-400" />} delay={0} />
        <StatCard title="Em Acompanhamento" value={loading ? '...' : kpis?.atendimentos_acompanhamento ?? 0} sub="Retornos registrados" icon={<RefreshCw className="w-4 h-4 text-indigo-400" />} delay={0.05} />
        <StatCard title="Matriculados em Cursos" value={loading ? '...' : kpis?.matriculados_cursos ?? 0} sub="Encaminhamentos ativos" icon={<BookOpen className="w-4 h-4 text-purple-400" />} delay={0.1} />
        <StatCard
          title="Média de Avaliação"
          value={loading ? '...' : kpis?.media_avaliacao ? `★ ${kpis.media_avaliacao}` : '—'}
          sub="Satisfação geral"
          icon={<GraduationCap className="w-4 h-4 text-emerald-400" />}
          delay={0.15}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico de Barras: Evolução Mensal */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 glass-card rounded-2xl p-6"
          style={{ height: 340 }}
        >
          <h3 className="text-sm font-medium text-slate-300 mb-5">Evolução de Atendimentos por Tipo</h3>
          <ResponsiveContainer width="100%" height="88%">
            <BarChart data={mensal} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
              <XAxis dataKey="mes" {...AXIS_STYLE} tickLine={false} axisLine={false} />
              <YAxis {...AXIS_STYLE} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={CHART_STYLE} itemStyle={{ color: '#fff', fontSize: 13 }} />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
              <Bar dataKey="aberturas_mei" name="Abertura MEI" fill="#818cf8" radius={[4, 4, 0, 0]} />
              <Bar dataKey="consultorias"  name="Consultorias"  fill="#c084fc" radius={[4, 4, 0, 0]} />
              <Bar dataKey="credito"       name="Crédito"       fill="#34d399" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Gráfico de Pizza: Distribuição */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="glass-card rounded-2xl p-6 flex flex-col"
          style={{ height: 340 }}
        >
          <h3 className="text-sm font-medium text-slate-300 mb-2">Distribuição de Serviços</h3>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={servicos}
                  cx="50%" cy="50%"
                  innerRadius={45} outerRadius={65}
                  paddingAngle={4} dataKey="value" stroke="none"
                >
                  {servicos.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={CHART_STYLE} itemStyle={{ color: '#fff', fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 mt-2">
            {servicos.map((s, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                  <span className="text-slate-300 truncate max-w-[130px]">{s.name}</span>
                </div>
                <span className="text-white font-medium">{s.value}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Linha: NPS */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-3 glass-card rounded-2xl p-6"
          style={{ height: 280 }}
        >
          <h3 className="text-sm font-medium text-slate-300 mb-5">Índice de Satisfação Média</h3>
          <ResponsiveContainer width="100%" height="84%">
            <LineChart data={satisfacao} margin={{ top: 5, right: 20, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
              <XAxis dataKey="mes" {...AXIS_STYLE} tickLine={false} axisLine={false} />
              <YAxis domain={[3.5, 5]} {...AXIS_STYLE} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={CHART_STYLE} itemStyle={{ color: '#fff', fontSize: 13 }} formatter={(v: number) => [`★ ${v}`, 'Nota Média']} />
              <Line type="monotone" dataKey="nota" stroke="#fbbf24" strokeWidth={3} dot={{ r: 4, fill: '#fbbf24', strokeWidth: 0 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </div>
  );
}
