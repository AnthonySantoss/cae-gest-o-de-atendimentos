import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { GraduationCap, Calendar, MapPin, Users, ChevronRight, X, Loader2 } from 'lucide-react';
import { cursosApi, empreendedoresApi, type Curso, type Empreendedor } from '../../lib/api.js';
import { cn } from '../../lib/utils.js';
import { Modal } from '../dashboard/DashboardPage.js';

const TIPO_COLORS: Record<string, string> = {
  'Curso':     'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'Workshop':  'bg-purple-500/10 text-purple-400 border-purple-500/20',
  'Mentoria':  'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  'Palestra':  'bg-amber-500/10 text-amber-400 border-amber-500/20',
};

export default function EncaminhamentosPage() {
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedCurso, setSelectedCurso] = useState<Curso | null>(null);
  const [buscaEmp, setBuscaEmp] = useState('');
  const [empreendedoresBusca, setEmpreendedoresBusca] = useState<Empreendedor[]>([]);
  const [empSelecionado, setEmpSelecionado] = useState<Empreendedor | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    cursosApi.listCursos().then(r => setCursos(r.data)).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (buscaEmp.length < 2) { setEmpreendedoresBusca([]); return; }
    const t = setTimeout(async () => {
      try {
        const res = await empreendedoresApi.list({ search: buscaEmp, per_page: 5 });
        setEmpreendedoresBusca(res.data);
      } catch (e) { console.error(e); }
    }, 300);
    return () => clearTimeout(t);
  }, [buscaEmp]);

  const handleEncaminhar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!empSelecionado || !selectedCurso) return;
    setSubmitting(true);
    try {
      await cursosApi.encaminhar({
        empreendedor_id: empSelecionado.id,
        curso_id: selectedCurso.id,
        tipo: selectedCurso.tipo ?? undefined,
      });
      const r = await cursosApi.listCursos();
      setCursos(r.data);
      closeModal();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao encaminhar');
    } finally {
      setSubmitting(false);
    }
  };

  const closeModal = () => {
    setSelectedCurso(null);
    setBuscaEmp('');
    setEmpSelecionado(null);
  };

  const formatDate = (d: string | null) => {
    if (!d) return 'A definir';
    return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <GraduationCap className="text-pink-400 w-5 h-5" /> Cursos e Mentorias
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="glass-panel rounded-2xl p-5 animate-pulse h-40" />
          ))
        ) : (
          cursos.map((curso, idx) => {
            const pct = curso.vagas_total > 0
              ? Math.round(((curso.vagas_total - curso.vagas_disponiveis) / curso.vagas_total) * 100)
              : 0;

            return (
              <motion.div
                key={curso.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.07 }}
                className="glass-panel rounded-2xl p-5 hover:bg-white/5 transition-colors group border-l-4 border-l-pink-500/60"
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-bold text-white text-sm pr-4">{curso.titulo}</h3>
                  <span className={cn('text-xs px-2 py-0.5 rounded-full border font-medium whitespace-nowrap', TIPO_COLORS[curso.tipo ?? ''] ?? 'bg-white/10 text-slate-300 border-white/10')}>
                    {curso.tipo ?? 'Outro'}
                  </span>
                </div>

                {curso.descricao && (
                  <p className="text-xs text-slate-400 mb-4 line-clamp-2">{curso.descricao}</p>
                )}

                <div className="flex flex-wrap gap-3 text-xs text-slate-400 mb-4">
                  {curso.data_inicio && (
                    <span className="flex items-center gap-1.5">
                      <Calendar size={11} className="text-pink-400" /> {formatDate(curso.data_inicio)}
                    </span>
                  )}
                  {curso.local && (
                    <span className="flex items-center gap-1.5">
                      <MapPin size={11} className="text-pink-400" /> {curso.local}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <Users size={11} className="text-pink-400" />
                    {curso.vagas_disponiveis} de {curso.vagas_total} vagas
                  </span>
                </div>

                {/* Barra de ocupação */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-slate-400">Ocupação</span>
                    <span className={cn('font-medium', pct >= 80 ? 'text-red-400' : 'text-emerald-400')}>{pct}%</span>
                  </div>
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      className={cn('h-full rounded-full', pct >= 80 ? 'bg-red-500' : 'bg-pink-500')}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ delay: idx * 0.07 + 0.3, duration: 0.6 }}
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className={cn('text-sm font-medium', curso.vagas_disponiveis > 0 ? 'text-emerald-400' : 'text-red-400')}>
                    {curso.vagas_disponiveis > 0 ? `${curso.vagas_disponiveis} vagas disponíveis` : 'Sem vagas'}
                  </span>
                  <button 
                    onClick={() => setSelectedCurso(curso)}
                    disabled={curso.vagas_disponiveis <= 0}
                    className="text-xs flex items-center gap-1 text-pink-400 hover:text-pink-300 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Encaminhar <ChevronRight size={13} />
                  </button>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      <Modal isOpen={!!selectedCurso} onClose={closeModal} title="Novo Encaminhamento">
        {selectedCurso && (
          <form onSubmit={handleEncaminhar} className="space-y-4">
            <div className="glass-panel p-4 rounded-xl mb-4 border-l-4 border-l-pink-500">
              <h3 className="font-bold text-white text-sm mb-1">{selectedCurso.titulo}</h3>
              <p className="text-xs text-slate-400">
                {selectedCurso.vagas_disponiveis} vagas disponíveis no momento.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-2">Selecione o Empreendedor *</label>
              {empSelecionado ? (
                <div className="glass-panel rounded-xl px-4 py-3 flex items-center justify-between">
                  <span className="text-sm text-white">{empSelecionado.nome}</span>
                  <button type="button" onClick={() => { setEmpSelecionado(null); setBuscaEmp(''); }} className="text-slate-400 hover:text-white transition-colors">
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <input
                    type="text"
                    value={buscaEmp}
                    onChange={e => setBuscaEmp(e.target.value)}
                    placeholder="Buscar por nome ou CPF/CNPJ..."
                    className="w-full glass-input rounded-xl px-4 py-3 text-sm"
                  />
                  {empreendedoresBusca.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 glass-popover rounded-xl border border-white/10 z-10 overflow-hidden shadow-xl">
                      {empreendedoresBusca.map(e => (
                        <button
                          key={e.id}
                          type="button"
                          onClick={() => { setEmpSelecionado(e); setBuscaEmp(''); setEmpreendedoresBusca([]); }}
                          className="w-full text-left px-4 py-3 hover:bg-white/5 text-sm text-white flex items-center justify-between transition-colors"
                        >
                          <span className="truncate pr-2">{e.nome}</span>
                          <span className="text-xs text-slate-400 font-mono shrink-0">{e.cpf_cnpj}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-white/10 mt-6">
              <button type="button" onClick={closeModal} className="px-4 py-2 rounded-lg glass-button-secondary text-sm transition-colors">
                Cancelar
              </button>
              <button 
                type="submit" 
                disabled={!empSelecionado || submitting} 
                className="px-4 py-2 rounded-lg bg-pink-500/20 text-pink-300 border border-pink-500/30 text-sm font-medium disabled:opacity-50 flex items-center gap-2 transition-colors hover:bg-pink-500/30"
              >
                {submitting ? <Loader2 size={14} className="animate-spin" /> : null}
                Confirmar
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
