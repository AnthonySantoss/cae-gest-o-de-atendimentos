import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users, Clock, CheckCircle2, TrendingUp, Briefcase,
  UserCircle, History, ArrowRight, RefreshCw, Plus,
  Phone, FileText, X, Loader2, Star, ChevronRight
} from 'lucide-react';
import {
  AreaChart, Area, ResponsiveContainer, Tooltip
} from 'recharts';
import { atendimentosApi, relatoriosApi, empreendedoresApi, type FilaItem, type HistoricoItem, type Kpis, type EvolucaoSemanalItem } from '../../lib/api.js';
import { cn } from '../../lib/utils.js';
import { useAuth } from '../../lib/auth.js';
import toast from 'react-hot-toast';

const STATUS_MAP = {
  aguardando:     { label: 'Aguardando',    cls: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  em_atendimento: { label: 'Em Atendimento',cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  atrasado:       { label: 'Atrasado',      cls: 'bg-red-500/10 text-red-400 border-red-500/20' },
  concluido:      { label: 'Concluído',     cls: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
  cancelado:      { label: 'Cancelado',     cls: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
};

function SkeletonCard() {
  return (
    <div className="glass-card rounded-2xl p-5 animate-pulse">
      <div className="h-4 bg-white/5 rounded w-24 mb-3" />
      <div className="h-8 bg-white/5 rounded w-16 mb-2" />
      <div className="h-3 bg-white/5 rounded w-20" />
    </div>
  );
}

export default function DashboardPage({
  onNavigate, onNovoAtendimento, refreshCounter
}: {
  onNavigate: (tab: string) => void;
  onNovoAtendimento: () => void;
  refreshCounter?: number;
}) {
  const { user } = useAuth();
  const [fila, setFila] = useState<FilaItem[]>([]);
  const [historico, setHistorico] = useState<HistoricoItem[]>([]);
  const [kpis, setKpis] = useState<Kpis | null>(null);
  const [semanalData, setSemanalData] = useState<EvolucaoSemanalItem[]>([]);
  const [loadingFila, setLoadingFila] = useState(true);
  const [loadingKpis, setLoadingKpis] = useState(true);
  const [selectedItem, setSelectedItem] = useState<FilaItem | null>(null);

  const fetchFila = useCallback(async () => {
    try {
      const res = await atendimentosApi.getFila();
      setFila(res.data);
    } catch (e) { console.error(e); }
    finally { setLoadingFila(false); }
  }, []);

  useEffect(() => {
    fetchFila();
    relatoriosApi.getKpis().then(r => setKpis(r.data)).finally(() => setLoadingKpis(false));
    atendimentosApi.getHistorico({ per_page: 5 }).then(r => setHistorico(r.data));
    relatoriosApi.getEvolucaoSemanal().then(r => setSemanalData(r.data));
  }, [fetchFila]);

  useEffect(() => {
    if (refreshCounter) fetchFila();
  }, [refreshCounter, fetchFila]);

  const handleChamar = async (id: number) => {
    try {
      await atendimentosApi.updateStatus(id, 'em_atendimento', user?.id);
      setFila(prev => prev.map(f => f.id === id ? { ...f, status: 'em_atendimento' } : f));
      setSelectedItem(null);
      toast.success('Atendimento iniciado!');
    } catch (e) {
      toast.error('Erro ao iniciar atendimento.');
    }
  };

  const handleFinalizar = async (id: number) => {
    try {
      await atendimentosApi.updateStatus(id, 'concluido');
      setFila(prev => prev.filter(f => f.id !== id));
      setSelectedItem(null);
      toast.success('Atendimento finalizado com sucesso!');
    } catch (e) {
      toast.error('Erro ao finalizar atendimento.');
    }
  };



  const timeInQueue = (criado_em: string) => {
    const diff = Date.now() - new Date(criado_em).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins} min`;
    return `${Math.floor(mins/60)}h ${mins % 60}min`;
  };

  return (
    <>
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {loadingKpis ? (
          Array.from({length: 4}).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <KpiCard
              title="Atendimentos no Mês"
              value={kpis?.total_atendimentos_mes?.toLocaleString('pt-BR') ?? '—'}
              icon={<Users className="w-5 h-5 text-indigo-400" />}
              delay={0}
            />
            <KpiCard
              title="Serviço Mais Solicitado"
              value={kpis?.servico_mais_solicitado ?? '—'}
              subtitle="este mês"
              icon={<Briefcase className="w-5 h-5 text-purple-400" />}
              delay={0.05}
            />
            <KpiCard
              title="Consultor Destaque"
              value={kpis?.consultor_destaque ?? '—'}
              subtitle="este mês"
              icon={<UserCircle className="w-5 h-5 text-emerald-400" />}
              delay={0.1}
            />
            <div className="glass-card rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden group">
              <div className="relative z-10">
                <p className="text-sm font-medium text-slate-400 mb-1">Evolução Semanal</p>
                <div className="flex items-end gap-2">
                  <h3 className="text-2xl font-bold text-white">
                    {semanalData.reduce((s, d) => s + d.atendimentos, 0)}
                  </h3>
                  <span className="text-xs font-medium text-emerald-400 mb-1 flex items-center">
                    <TrendingUp size={12} className="mr-0.5" /> semana
                  </span>
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-20 opacity-60 group-hover:opacity-100 transition-opacity">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={semanalData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorAtt" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#818cf8" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="atendimentos" stroke="#818cf8" strokeWidth={2} fillOpacity={1} fill="url(#colorAtt)" />
                    <Tooltip contentStyle={{ backgroundColor: 'rgba(15,23,42,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: 12 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Fila do Dia */}
        <div className="lg:col-span-1 glass-card rounded-2xl p-6 flex flex-col" style={{ minHeight: '480px' }}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-400" /> Fila de Hoje
            </h2>
            <div className="flex items-center gap-2">
              <button onClick={fetchFila} className="p-1.5 rounded-lg glass-button-secondary text-slate-400 hover:text-white transition-colors">
                <RefreshCw size={14} />
              </button>
              <span className="bg-indigo-500/20 text-indigo-300 text-xs font-semibold px-2.5 py-1 rounded-full border border-indigo-500/30">
                {fila.length} na fila
              </span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-1 space-y-3">
            {loadingFila ? (
              Array.from({length: 3}).map((_, i) => (
                <div key={i} className="glass-panel rounded-xl p-4 animate-pulse">
                  <div className="h-4 bg-white/5 rounded w-32 mb-2" />
                  <div className="h-3 bg-white/5 rounded w-24" />
                </div>
              ))
            ) : fila.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 py-8">
                <CheckCircle2 size={48} className="mb-3 opacity-20" />
                <p className="text-sm">Fila vazia no momento.</p>
                <button onClick={onNovoAtendimento} className="mt-4 glass-button rounded-lg px-4 py-2 text-xs text-white">
                  + Adicionar à Fila
                </button>
              </div>
            ) : (
              <AnimatePresence>
                {fila.map((item, idx) => {
                  const st = STATUS_MAP[item.status] ?? STATUS_MAP.aguardando;
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20, height: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="glass-panel rounded-xl p-4 hover:bg-white/5 transition-colors cursor-pointer group"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-white group-hover:text-indigo-300 transition-colors truncate pr-2 text-sm">
                          {item.empreendedor_nome}
                        </h4>
                        <span className={cn('text-xs font-medium px-2 py-0.5 rounded-md border whitespace-nowrap', st.cls)}>
                          {item.status === 'aguardando' || item.status === 'atrasado'
                            ? timeInQueue(item.criado_em)
                            : st.label}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 truncate mb-3">{item.servico_nome}</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedItem(item)}
                          className="flex-1 glass-button-secondary text-xs py-1.5 rounded-lg text-slate-300 hover:text-white transition-colors"
                        >
                          Detalhes
                        </button>
                        {item.status === 'em_atendimento' ? (
                          <button
                            onClick={() => handleFinalizar(item.id)}
                            className="flex-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs py-1.5 rounded-lg transition-colors"
                          >
                            Finalizar
                          </button>
                        ) : (
                          <button
                            onClick={() => handleChamar(item.id)}
                            className="flex-1 glass-button text-xs py-1.5 rounded-lg text-white"
                          >
                            Chamar
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
          </div>
        </div>

        {/* Histórico Recente */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-6 flex flex-col" style={{ minHeight: '480px' }}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <History className="w-5 h-5 text-purple-400" /> Últimos Atendimentos
            </h2>
            <button onClick={() => onNavigate('historico')} className="text-sm text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 transition-colors">
              Ver todos <ArrowRight size={16} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {historico.length === 0 ? (
              <div className="text-center text-slate-400 py-8 text-sm">Nenhum atendimento recente.</div>
            ) : (
              historico.map((h, idx) => (
                <motion.div
                  key={h.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.06 }}
                  className="glass-panel p-4 rounded-xl flex items-center justify-between hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                      <FileText size={15} className="text-indigo-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        #{h.id} — {h.servico_nome}
                      </p>
                      <p className="text-xs text-slate-400 truncate">
                        {h.empreendedor_nome}
                        {h.consultor_nome && ` • ${h.consultor_nome}`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <p className="text-xs text-slate-400">
                      {new Date(h.criado_em).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                    </p>
                    {h.avaliacao && (
                      <span className="text-xs text-yellow-400 flex items-center justify-end gap-0.5 mt-0.5">
                        <Star size={10} fill="currentColor" /> {h.avaliacao}
                      </span>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modal: Detalhes do item da fila */}
      <Modal isOpen={!!selectedItem} onClose={() => setSelectedItem(null)} title="Detalhes do Atendimento">
        {selectedItem && (
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                <UserCircle size={28} className="text-indigo-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">{selectedItem.empreendedor_nome}</h3>
                <p className="text-sm text-indigo-300">{selectedItem.servico_nome}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {selectedItem.cpf_cnpj && (
                <div className="glass-panel p-3 rounded-xl">
                  <p className="text-xs text-slate-400 mb-1 flex items-center gap-1"><FileText size={11} /> CPF/CNPJ</p>
                  <p className="text-sm font-medium text-white">{selectedItem.cpf_cnpj}</p>
                </div>
              )}
              {selectedItem.telefone && (
                <div className="glass-panel p-3 rounded-xl">
                  <p className="text-xs text-slate-400 mb-1 flex items-center gap-1"><Phone size={11} /> Telefone</p>
                  <p className="text-sm font-medium text-white">{selectedItem.telefone}</p>
                </div>
              )}
              <div className="glass-panel p-3 rounded-xl">
                <p className="text-xs text-slate-400 mb-1 flex items-center gap-1"><Clock size={11} /> Na Fila</p>
                <p className="text-sm font-medium text-white">{timeInQueue(selectedItem.criado_em)}</p>
              </div>
              <div className="glass-panel p-3 rounded-xl">
                <p className="text-xs text-slate-400 mb-1">Status</p>
                <span className={cn('text-xs font-medium px-2 py-0.5 rounded-md border inline-block', STATUS_MAP[selectedItem.status]?.cls)}>
                  {STATUS_MAP[selectedItem.status]?.label}
                </span>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2 border-t border-white/10">
              <button onClick={() => setSelectedItem(null)} className="px-4 py-2 rounded-lg glass-button-secondary text-sm font-medium">Fechar</button>
              {selectedItem.status !== 'em_atendimento' ? (
                <button onClick={() => handleChamar(selectedItem.id)} className="px-4 py-2 rounded-lg glass-button text-sm font-medium text-white">
                  Chamar Agora
                </button>
              ) : (
                <button onClick={() => handleFinalizar(selectedItem.id)} className="px-4 py-2 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-sm font-medium">
                  Finalizar
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>


    </>
  );
}

function KpiCard({ title, value, trend, trendUp, subtitle, icon, delay = 0 }: {
  title: string; value: string; trend?: string; trendUp?: boolean;
  subtitle?: string; icon: React.ReactNode; delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="glass-card rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden group"
    >
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-2 rounded-lg bg-white/5 border border-white/10 backdrop-blur-md">{icon}</div>
          <p className="text-sm font-medium text-slate-300">{title}</p>
        </div>
        <div className="flex items-end gap-3 mt-2">
          <h3 className="text-2xl font-bold text-white tracking-tight leading-none">{value}</h3>
          {trend && (
            <span className={cn('text-xs font-medium mb-0.5 flex items-center px-1.5 py-0.5 rounded-md border',
              trendUp ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' : 'text-red-400 bg-red-400/10 border-red-400/20'
            )}>
              {trendUp && <TrendingUp size={11} className="mr-0.5" />} {trend}
            </span>
          )}
        </div>
        {subtitle && <p className="text-xs text-slate-400 mt-1.5">{subtitle}</p>}
      </div>
    </motion.div>
  );
}

function Modal({ isOpen, onClose, title, children }: {
  isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode;
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 16 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="glass-card w-full max-w-lg rounded-2xl relative z-10 shadow-2xl border border-white/20"
          >
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <h2 className="text-lg font-bold text-white">{title}</h2>
              <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10">
                <X size={18} />
              </button>
            </div>
            <div className="p-5">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export { Modal };
