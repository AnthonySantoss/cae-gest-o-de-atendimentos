import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { History, FileText, X, Star, ChevronDown } from 'lucide-react';
import { atendimentosApi, type HistoricoItem, type Empreendedor } from '../../lib/api.js';
import { cn } from '../../lib/utils.js';

const STATUS_COLORS: Record<string, string> = {
  concluido: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  cancelado:  'bg-red-500/10 text-red-400 border-red-500/20',
};

export default function HistoricoPage({
  selectedEmp,
  onClearFilter,
}: {
  selectedEmp: Empreendedor | null;
  onClearFilter: () => void;
}) {
  const [items, setItems] = useState<HistoricoItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPage(1);
    setError(null);
    let cancelled = false;

    const doFetch = async () => {
      setLoading(true);
      try {
        const res = await atendimentosApi.getHistorico({
          empreendedor_id: selectedEmp?.id,
          page: 1,
          per_page: 15,
        });
        if (!cancelled) {
          setItems(res.data);
          setTotal(res.total);
        }
      } catch (e) {
        console.error('[HistoricoPage] Erro ao buscar histórico:', e);
        if (!cancelled) setError('Não foi possível carregar o histórico. Verifique a conexão com o servidor.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    doFetch();
    return () => { cancelled = true; };
  }, [selectedEmp]);

  const fetchPage = async (p: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await atendimentosApi.getHistorico({
        empreendedor_id: selectedEmp?.id,
        page: p,
        per_page: 15,
      });
      setItems(res.data);
      setTotal(res.total);
      setPage(p);
    } catch (e) {
      console.error('[HistoricoPage] Erro ao paginar:', e);
      setError('Erro ao carregar página. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <History className="text-purple-400 w-5 h-5" />
            {selectedEmp ? `Histórico: ${selectedEmp.nome}` : 'Histórico Geral'}
          </h2>
          <p className="text-slate-400 text-sm mt-0.5">{total} atendimentos</p>
        </div>
        {selectedEmp && (
          <button onClick={onClearFilter} className="glass-button-secondary px-3 py-1.5 rounded-xl text-xs flex items-center gap-2 text-slate-300">
            <X size={13} /> Limpar filtro
          </button>
        )}
      </div>

      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="glass-panel rounded-xl p-4 animate-pulse h-16" />
          ))
        ) : items.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <FileText size={40} className="mx-auto mb-3 opacity-20" />
            <p className="text-sm">Nenhum atendimento encontrado.</p>
          </div>
        ) : (
          <AnimatePresence>
            {items.map((h, idx) => (
              <motion.div
                key={h.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                className="glass-panel rounded-xl overflow-hidden"
              >
                <button
                  className="w-full text-left px-5 py-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                  onClick={() => setExpandedId(expandedId === h.id ? null : h.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                      <FileText size={15} className="text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">
                        #{h.id} — {h.servico_nome}
                      </p>
                      <p className="text-xs text-slate-400">
                        {h.empreendedor_nome}
                        {h.consultor_nome && ` • ${h.consultor_nome}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    {h.avaliacao && (
                      <span className="text-xs text-yellow-400 flex items-center gap-0.5 font-medium">
                        <Star size={11} fill="currentColor" /> {h.avaliacao}
                      </span>
                    )}
                    <span className={cn('text-xs px-2 py-0.5 rounded-full border font-medium', STATUS_COLORS[h.status] ?? 'bg-slate-500/10 text-slate-400 border-slate-500/20')}>
                      {h.status === 'concluido' ? 'Concluído' : 'Cancelado'}
                    </span>
                    <p className="text-xs text-slate-400 hidden md:block">{formatDate(h.criado_em)}</p>
                    <motion.div animate={{ rotate: expandedId === h.id ? 180 : 0 }}>
                      <ChevronDown size={14} className="text-slate-400" />
                    </motion.div>
                  </div>
                </button>

                <AnimatePresence>
                  {expandedId === h.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-4 pt-0 border-t border-white/5 space-y-2.5">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                          <div>
                            <p className="text-xs text-slate-400 mb-0.5">CPF/CNPJ</p>
                            <p className="text-xs text-white font-mono">{h.cpf_cnpj}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-400 mb-0.5">Data</p>
                            <p className="text-xs text-white">{formatDate(h.criado_em)}</p>
                          </div>
                          {h.concluido_em && (
                            <div>
                              <p className="text-xs text-slate-400 mb-0.5">Concluído em</p>
                              <p className="text-xs text-white">{formatDate(h.concluido_em)}</p>
                            </div>
                          )}
                        </div>
                        {h.observacoes && (
                          <div className="bg-white/5 rounded-lg px-4 py-3">
                            <p className="text-xs text-slate-400 mb-1">Observações</p>
                            <p className="text-sm text-slate-300">{h.observacoes}</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Paginação */}
      {Math.ceil(total / 15) > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6 pt-4 border-t border-white/10">
          {Array.from({ length: Math.ceil(total / 15) }).map((_, i) => (
            <button
              key={i}
              onClick={() => fetchPage(i + 1)}
              className={cn('w-8 h-8 rounded-lg text-xs font-medium transition-colors',
                page === i + 1 ? 'glass-button text-white' : 'glass-button-secondary text-slate-400'
              )}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
