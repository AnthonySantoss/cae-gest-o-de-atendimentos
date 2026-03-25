import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserCircle, Star, Briefcase, Plus, X, Loader2, Edit2, ClipboardCopy, ClipboardCheck, Key } from 'lucide-react';
import { consultoresApi, type Consultor } from '../../lib/api.js';
import { cn } from '../../lib/utils.js';
import toast from 'react-hot-toast';

export default function ConsultoresPage() {
  const [items, setItems] = useState<Consultor[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Form State
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [perfil, setPerfil] = useState('consultor');
  const [especialidade, setEspecialidade] = useState('');
  const [resetSenha, setResetSenha] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const r = await consultoresApi.list();
      setItems(r.data);
    } catch (e) {
      console.error('Erro ao buscar consultores:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    setEditingId(null);
    setNome('');
    setEmail('');
    setPerfil('consultor');
    setEspecialidade('');
    setResetSenha(false);
    setError(null);
    setTempPassword(null);
    setIsModalOpen(true);
  };

  const openEditModal = (c: Consultor) => {
    setEditingId(c.id);
    setNome(c.nome);
    setEmail(c.email);
    setPerfil(c.perfil);
    setEspecialidade(c.especialidade ?? '');
    setResetSenha(false);
    setError(null);
    setTempPassword(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    
    try {
      const payload = {
        nome, 
        email, 
        perfil, 
        especialidade: especialidade || undefined,
        ...(editingId ? { reset_senha: resetSenha } : {})
      };

      let res;
      if (editingId) {
        res = await consultoresApi.update(editingId, payload);
      } else {
        res = await consultoresApi.create(payload);
      }
      
      if (res.tempPassword) {
        setTempPassword(res.tempPassword);
        setCopied(false);
        fetchData(); // Refresh list to get new user without closing modal immediately so they can see PW
        toast.success(editingId ? 'Senha redefinida com sucesso!' : 'Consultor cadastrado com sucesso!');
      } else {
        toast.success('Consultor atualizado com sucesso!');
        setIsModalOpen(false);
        fetchData();
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao salvar consultor.';
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = () => {
    if (tempPassword) {
      navigator.clipboard.writeText(tempPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const PERFIL_COLORS: Record<string, string> = {
    gestor:    'text-blue-400 bg-blue-500/10 border-blue-500/20',
    consultor: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
    admin:     'text-purple-400 bg-purple-500/10 border-purple-500/20',
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <UserCircle className="text-emerald-400 w-5 h-5" /> Gestão de Consultores
          </h2>
          <button
            onClick={openCreateModal}
            className="glass-button px-4 py-2 rounded-xl text-sm flex items-center gap-2 text-white"
          >
            <Plus size={15} /> Novo Consultor
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="glass-card rounded-2xl p-6 animate-pulse">
                <div className="w-20 h-20 rounded-full bg-white/5 mx-auto mb-4" />
                <div className="h-5 bg-white/5 rounded w-32 mx-auto mb-2" />
                <div className="h-3 bg-white/5 rounded w-24 mx-auto" />
              </div>
            ))
          ) : items.length === 0 ? (
            <div className="col-span-1 md:col-span-2 lg:col-span-3 text-center py-12 text-slate-400">
              <UserCircle size={40} className="mx-auto mb-3 opacity-20" />
              <p className="text-sm">Nenhum consultor cadastrado ou ativo.</p>
            </div>
          ) : (
            items.map((c, idx) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.08 }}
                className="glass-card rounded-2xl p-6 flex flex-col items-center text-center group relative"
              >
                <button 
                  onClick={() => openEditModal(c)} 
                  className="absolute top-4 right-4 text-slate-400 hover:text-indigo-400 hover:bg-white/10 p-1.5 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Edit2 size={15} />
                </button>

                {/* Avatar */}
                <div className="relative mb-4">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500/30 to-purple-500/30 border-2 border-white/10 flex items-center justify-center group-hover:border-indigo-500/50 transition-colors">
                    <span className="text-3xl font-bold text-white/60">
                      {c.nome.charAt(0)}
                    </span>
                  </div>
                  {c.media_avaliacao && c.media_avaliacao >= 4.8 && (
                    <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-yellow-500 flex items-center justify-center border-2 border-slate-900">
                      <Star size={12} fill="white" className="text-white" />
                    </div>
                  )}
                </div>

                <h3 className="text-lg font-bold text-white mb-1 truncate w-full px-4">{c.nome}</h3>
                <p className="text-sm text-indigo-300 mb-1">{c.especialidade ?? c.perfil}</p>
                <span className={`text-xs px-2.5 py-1 rounded-full border font-medium mb-4 ${PERFIL_COLORS[c.perfil] ?? ''}`}>
                  {c.perfil.charAt(0).toUpperCase() + c.perfil.slice(1)}
                </span>

                {/* Stats */}
                <div className="w-full grid grid-cols-2 gap-3 border-t border-white/10 pt-4 mt-auto">
                  <div className="glass-panel rounded-xl p-3">
                    <div className="flex items-center justify-center gap-1.5 text-slate-400 mb-1">
                      <Briefcase size={13} />
                      <span className="text-xs">Atendimentos</span>
                    </div>
                    <p className="text-xl font-bold text-white">{c.total_atendimentos}</p>
                  </div>
                  <div className="glass-panel rounded-xl p-3">
                    <div className="flex items-center justify-center gap-1.5 text-slate-400 mb-1">
                      <Star size={13} />
                      <span className="text-xs">Avaliação</span>
                    </div>
                    <p className="text-xl font-bold text-yellow-400">
                      {c.media_avaliacao?.toFixed(1) ?? '—'}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Modal Criar / Editar Consultor */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 16 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="glass-card w-full max-w-md rounded-2xl relative shadow-2xl border border-white/20"
            >
              <div className="flex items-center justify-between p-5 border-b border-white/10">
                <h2 className="text-lg font-bold text-white">
                  {tempPassword ? 'Sucesso!' : (editingId ? 'Editar Consultor' : 'Novo Consultor')}
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white p-1 hover:bg-white/10 rounded-lg transition-colors">
                  <X size={18} />
                </button>
              </div>

              {tempPassword ? (
                <div className="p-6 text-center space-y-5">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto mb-2 text-emerald-400">
                    <Key size={32} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-2">Conta Pronta</h3>
                    <p className="text-sm text-slate-300">
                      A senha temporária de acesso para <strong>{nome}</strong> foi gerada.
                      Por favor, copie e repasse com segurança.
                    </p>
                  </div>
                  
                  <div className="bg-slate-900/80 p-4 rounded-xl border border-white/10 flex items-center justify-between gap-4">
                    <code className="text-lg font-mono text-emerald-400 flex-1 text-left select-all">{tempPassword}</code>
                    <button 
                      onClick={copyToClipboard}
                      className={cn(
                        "p-2.5 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium",
                        copied ? "bg-emerald-500/20 text-emerald-400" : "bg-white/10 text-white hover:bg-white/20"
                      )}
                    >
                      {copied ? <ClipboardCheck size={16} /> : <ClipboardCopy size={16} />}
                      {copied ? 'Copiado!' : 'Copiar'}
                    </button>
                  </div>
                  <button 
                    onClick={() => setIsModalOpen(false)}
                    className="w-full py-3 rounded-xl glass-button text-white font-medium mt-4"
                  >
                    Concluir
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Nome Completo *</label>
                    <input 
                      required 
                      value={nome}
                      onChange={e => setNome(e.target.value)}
                      className="w-full glass-input rounded-xl px-4 py-2.5 text-sm" 
                      placeholder="Nome do profissional" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Email de Acesso *</label>
                    <input 
                      required 
                      type="email"
                      value={email}
                      disabled={!!editingId}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full glass-input rounded-xl px-4 py-2.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed" 
                      placeholder="email@escola.gov.br" 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">Perfil</label>
                      <select 
                        value={perfil}
                        onChange={e => setPerfil(e.target.value)}
                        className="w-full glass-input rounded-xl px-4 py-2.5 text-sm appearance-none bg-slate-800/50"
                      >
                        <option value="consultor">Consultor</option>
                        <option value="gestor">Gestor</option>
                        <option value="admin">Administrador</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">Especialidade</label>
                      <input 
                        value={especialidade}
                        onChange={e => setEspecialidade(e.target.value)}
                        className="w-full glass-input rounded-xl px-4 py-2.5 text-sm" 
                        placeholder="Ex: Finanças, Jurídico..." 
                      />
                    </div>
                  </div>

                  {editingId && (
                    <div className="pt-2">
                      <label className="flex items-center gap-3 p-3 rounded-xl border border-red-500/20 bg-red-500/5 cursor-pointer hover:bg-red-500/10 transition-colors">
                        <input 
                          type="checkbox" 
                          checked={resetSenha}
                          onChange={e => setResetSenha(e.target.checked)}
                          className="w-4 h-4 rounded text-red-500 bg-slate-800 border-white/20 focus:ring-0 focus:ring-offset-0"
                        />
                        <span className="text-sm font-medium text-red-300">Gerar nova senha temporária</span>
                      </label>
                    </div>
                  )}

                  {error && (
                    <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">
                      {error}
                    </p>
                  )}

                  <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-xl glass-button-secondary text-sm font-medium">Cancelar</button>
                    <button type="submit" disabled={saving} className="px-5 py-2 rounded-xl glass-button text-sm font-medium text-white disabled:opacity-60 flex items-center gap-2">
                      {saving ? <Loader2 size={16} className="animate-spin" /> : (editingId ? <Edit2 size={16} /> : <Plus size={16} />)}
                      {editingId ? 'Salvar Alterações' : 'Cadastrar'}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

