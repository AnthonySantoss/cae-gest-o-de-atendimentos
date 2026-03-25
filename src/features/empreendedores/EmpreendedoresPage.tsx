import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Filter, History, UserCircle, Plus, X, Loader2, Search, Mail, Phone, Briefcase, FileText, MapPin } from 'lucide-react';
import { empreendedoresApi, type Empreendedor, type CreateEmpreendedorPayload } from '../../lib/api.js';
import { cn } from '../../lib/utils.js';
import { Modal } from '../dashboard/DashboardPage.js';
import toast from 'react-hot-toast';

const STATUS_COLORS: Record<string, string> = {
  'Ativo':           'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  'Em formalização': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  'Inativo':         'bg-slate-500/10 text-slate-400 border-slate-500/20',
};

export default function EmpreendedoresPage({
  searchTerm,
  onVerHistorico,
}: {
  searchTerm: string;
  onVerHistorico: (emp: Empreendedor) => void;
}) {
  const [items, setItems] = useState<Empreendedor[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPerfilEmp, setSelectedPerfilEmp] = useState<Empreendedor | null>(null);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [filterTipo, setFilterTipo] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchData = async (p = 1, search = searchTerm, status = filterStatus, tipo = filterTipo) => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await empreendedoresApi.list({
        search: search || undefined,
        status: status || undefined,
        tipo: tipo || undefined,
        page: p,
        per_page: 15,
      });
      setItems(res.data);
      setTotal(res.total);
      setPage(p);
    } catch (e) {
      console.error('[EmpreendedoresPage] Erro ao buscar empreendedores:', e);
      setFetchError('Não foi possível carregar os dados. Verifique a conexão com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => fetchData(1, searchTerm, filterStatus, filterTipo), 300);
    return () => clearTimeout(t);
  }, [searchTerm, filterStatus, filterTipo]);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCreating(true);
    setError('');
    const form = new FormData(e.currentTarget);
    const payload: CreateEmpreendedorPayload = {
      nome: form.get('nome') as string,
      cpf_cnpj: form.get('cpf_cnpj') as string,
      telefone: form.get('telefone') as string || undefined,
      email: form.get('email') as string || undefined,
      tipo_empresa: form.get('tipo_empresa') as string || undefined,
      nome_empresa: form.get('nome_empresa') as string || undefined,
      segmento: form.get('segmento') as string || undefined,
    };
    try {
      await empreendedoresApi.create(payload);
      toast.success('Empreendedor cadastrado com sucesso!');
      setIsModalOpen(false);
      fetchData(1);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao cadastrar.';
      setError(msg);
      toast.error(msg);
    } finally {
      setCreating(false);
    }
  };

  const totalPages = Math.ceil(total / 15);

  return (
    <>
      <div className="glass-card rounded-2xl p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Users className="text-indigo-400 w-5 h-5" /> Empreendedores
            </h2>
            <p className="text-slate-400 text-sm mt-0.5">{total} cadastrados</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setIsFilterModalOpen(true)}
              className={cn(
                "glass-button-secondary px-4 py-2 rounded-xl text-sm flex items-center gap-2 transition-colors",
                (filterStatus || filterTipo) ? "text-indigo-400 bg-indigo-500/10 border-indigo-500/20" : ""
              )}
            >
              <Filter size={15} /> Filtrar
              {(filterStatus || filterTipo) && <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 ml-1" />}
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="glass-button px-4 py-2 rounded-xl text-sm flex items-center gap-2 text-white"
            >
              <Plus size={15} /> Novo
            </button>
          </div>
        </div>

        {fetchError && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {fetchError}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-xs text-slate-400">
                {['Nome', 'Negócio', 'CPF/CNPJ', 'Tipo', 'Atendimentos', 'Status', 'Ações'].map(h => (
                  <th key={h} className="pb-3 font-medium px-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="text-sm">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-white/5">
                    {Array.from({ length: 7 }).map((__, j) => (
                      <td key={j} className="py-4 px-3">
                        <div className="h-4 bg-white/5 rounded animate-pulse w-20" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <div className="flex flex-col items-center gap-3 text-slate-400">
                      <Search size={36} className="opacity-20" />
                      <p className="text-sm">Nenhum empreendedor encontrado.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                <AnimatePresence>
                  {items.map((emp, idx) => (
                    <motion.tr
                      key={emp.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className="border-b border-white/5 hover:bg-white/5 transition-colors"
                    >
                      <td className="py-3.5 px-3 font-medium text-white">{emp.nome}</td>
                      <td className="py-3.5 px-3 text-slate-300">{emp.nome_empresa ?? '—'}</td>
                      <td className="py-3.5 px-3 text-slate-300 font-mono text-xs">{emp.cpf_cnpj}</td>
                      <td className="py-3.5 px-3 text-slate-300">{emp.tipo_empresa ?? '—'}</td>
                      <td className="py-3.5 px-3 text-slate-300">{emp.total_atendimentos ?? 0}</td>
                      <td className="py-3.5 px-3">
                        <span className={cn('px-2.5 py-1 rounded-full text-xs font-medium border', STATUS_COLORS[emp.status])}>
                          {emp.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="flex gap-3 justify-end">
                          <button
                            onClick={() => onVerHistorico(emp)}
                            className="text-purple-400 hover:text-purple-300 font-medium text-xs flex items-center gap-1 transition-colors"
                          >
                            <History size={13} /> Histórico
                          </button>
                          <button
                            onClick={() => setSelectedPerfilEmp(emp)}
                            className="text-indigo-400 hover:text-indigo-300 font-medium text-xs flex items-center gap-1 transition-colors"
                          >
                            <UserCircle size={13} /> Perfil
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6 pt-4 border-t border-white/10">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => fetchData(i + 1)}
                className={cn(
                  'w-8 h-8 rounded-lg text-xs font-medium transition-colors',
                  page === i + 1 ? 'glass-button text-white' : 'glass-button-secondary text-slate-400'
                )}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Modal: Novo Empreendedor */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 16 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="glass-card w-full max-w-lg rounded-2xl relative z-10 border border-white/20 shadow-2xl"
            >
              <div className="flex items-center justify-between p-5 border-b border-white/10">
                <h2 className="text-lg font-bold text-white">Novo Empreendedor</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white p-1 hover:bg-white/10 rounded-lg transition-colors">
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleCreate} className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Nome Completo *</label>
                    <input required name="nome" type="text" className="w-full glass-input rounded-xl px-4 py-2.5 text-sm" placeholder="Nome do empreendedor" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">CPF / CNPJ *</label>
                    <input required name="cpf_cnpj" type="text" className="w-full glass-input rounded-xl px-4 py-2.5 text-sm font-mono" placeholder="000.000.000-00" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Telefone</label>
                    <input name="telefone" type="text" className="w-full glass-input rounded-xl px-4 py-2.5 text-sm" placeholder="(00) 00000-0000" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Email</label>
                    <input name="email" type="email" className="w-full glass-input rounded-xl px-4 py-2.5 text-sm" placeholder="email@exemplo.com" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Tipo de Empresa</label>
                    <select name="tipo_empresa" className="w-full glass-input rounded-xl px-4 py-2.5 text-sm appearance-none bg-slate-800/50">
                      <option value="">Selecione...</option>
                      {['MEI', 'ME', 'EPP', 'Autônomo', 'Outro'].map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Nome do Negócio</label>
                    <input name="nome_empresa" type="text" className="w-full glass-input rounded-xl px-4 py-2.5 text-sm" placeholder="Ex: Padaria do João" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Segmento</label>
                    <input name="segmento" type="text" className="w-full glass-input rounded-xl px-4 py-2.5 text-sm" placeholder="Ex: Alimentação" />
                  </div>
                </div>

                {error && (
                  <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">
                    {error}
                  </p>
                )}

                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-xl glass-button-secondary text-sm">Cancelar</button>
                  <button type="submit" disabled={creating} className="px-4 py-2 rounded-xl glass-button text-sm text-white disabled:opacity-60 flex items-center gap-2">
                    {creating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                    Cadastrar
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal: Perfil completo */}
      <Modal isOpen={!!selectedPerfilEmp} onClose={() => setSelectedPerfilEmp(null)} title="Perfil do Empreendedor">
        {selectedPerfilEmp && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500/30 to-purple-500/30 border-2 border-white/10 flex items-center justify-center shadow-lg">
                <span className="text-2xl font-bold text-white">{selectedPerfilEmp.nome.charAt(0)}</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">{selectedPerfilEmp.nome}</h3>
                <span className={cn('px-2.5 py-0.5 rounded-full text-[10px] font-medium border inline-block mt-1', STATUS_COLORS[selectedPerfilEmp.status])}>
                  {selectedPerfilEmp.status}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="glass-panel p-3 rounded-xl border-l-2 border-l-indigo-500/50">
                <p className="text-xs text-slate-400 mb-1 flex items-center gap-1"><FileText size={11} /> CPF / CNPJ</p>
                <p className="text-sm font-medium text-white font-mono">{selectedPerfilEmp.cpf_cnpj}</p>
              </div>
              <div className="glass-panel p-3 rounded-xl">
                <p className="text-xs text-slate-400 mb-1 flex items-center gap-1"><Phone size={11} /> Telefone</p>
                <p className="text-sm font-medium text-white">{selectedPerfilEmp.telefone || 'Não informado'}</p>
              </div>
              <div className="glass-panel p-3 rounded-xl col-span-2">
                <p className="text-xs text-slate-400 mb-1 flex items-center gap-1"><Mail size={11} /> E-mail</p>
                <p className="text-sm font-medium text-white">{selectedPerfilEmp.email || 'Não informado'}</p>
              </div>
            </div>

            <div className="glass-panel p-4 rounded-xl space-y-3">
              <h4 className="text-sm font-semibold text-white flex items-center gap-1.5"><Briefcase size={14} className="text-indigo-400"/> Dados do Negócio</h4>
              <div className="grid grid-cols-2 gap-y-3 gap-x-2">
                <div>
                  <p className="text-xs text-slate-400">Tipo</p>
                  <p className="text-sm font-medium text-slate-200">{selectedPerfilEmp.tipo_empresa || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Segmento</p>
                  <p className="text-sm font-medium text-slate-200">{selectedPerfilEmp.segmento || '—'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-slate-400">Nome da Empresa</p>
                  <p className="text-sm font-medium text-slate-200">{selectedPerfilEmp.nome_empresa || '—'}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center py-2 border-t border-white/10">
              <div className="text-center w-1/2 border-r border-white/10">
                <p className="text-xs text-slate-400">Atendimentos</p>
                <p className="text-2xl font-bold text-white">{selectedPerfilEmp.total_atendimentos ?? 0}</p>
              </div>
              <div className="text-center w-1/2">
                <p className="text-xs text-slate-400">Cadastrado em</p>
                <p className="text-sm font-medium text-white mt-1">
                  {new Date(selectedPerfilEmp.criado_em).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
              <button onClick={() => setSelectedPerfilEmp(null)} className="px-4 py-2 rounded-xl glass-button-secondary text-sm font-medium">Fechar</button>
              <button 
                onClick={() => {
                  setSelectedPerfilEmp(null);
                  onVerHistorico(selectedPerfilEmp);
                }} 
                className="px-4 py-2 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30 text-sm font-medium transition-colors hover:bg-purple-500/30 flex items-center gap-2"
              >
                <History size={14} /> Ver Histórico Completo
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal: Filtros */}
      <Modal isOpen={isFilterModalOpen} onClose={() => setIsFilterModalOpen(false)} title="Filtrar Empreendedores">
        <div className="space-y-4 p-2">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Status</label>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="w-full glass-input rounded-xl px-4 py-2.5 text-sm appearance-none bg-slate-800/50"
            >
              <option value="">Todos os status</option>
              <option value="Ativo">Ativo</option>
              <option value="Em formalização">Em formalização</option>
              <option value="Inativo">Inativo</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Tipo de Empresa</label>
            <select
              value={filterTipo}
              onChange={e => setFilterTipo(e.target.value)}
              className="w-full glass-input rounded-xl px-4 py-2.5 text-sm appearance-none bg-slate-800/50"
            >
              <option value="">Todos os tipos</option>
              {['MEI', 'ME', 'EPP', 'Autônomo', 'Outro'].map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-5 border-t border-white/10 mt-6">
            <button
              onClick={() => {
                setFilterStatus('');
                setFilterTipo('');
                setIsFilterModalOpen(false);
              }}
              className="px-4 py-2 rounded-xl glass-button-secondary text-sm transition-colors"
            >
              Limpar Filtros
            </button>
            <button onClick={() => setIsFilterModalOpen(false)} className="px-4 py-2 rounded-xl glass-button text-sm text-white transition-colors">
              Aplicar e Fechar
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
