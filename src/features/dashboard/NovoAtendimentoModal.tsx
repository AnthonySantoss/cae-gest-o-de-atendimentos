import React, { useState, useEffect } from 'react';
import { X, Loader2, Plus } from 'lucide-react';
import { atendimentosApi, cursosApi, empreendedoresApi, type Servico } from '../../lib/api.js';
import { Modal } from './DashboardPage.js';

export default function NovoAtendimentoModal({
  isOpen, onClose, onSuccess
}: {
  isOpen: boolean; onClose: () => void; onSuccess?: () => void;
}) {
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [empreendedoresBusca, setEmpreendedoresBusca] = useState<Array<{id: number; nome: string; cpf_cnpj: string}>>([]);
  const [buscaEmp, setBuscaEmp] = useState('');
  const [empSelecionado, setEmpSelecionado] = useState<{id: number; nome: string} | null>(null);
  const [creatingAtt, setCreatingAtt] = useState(false);

  useEffect(() => {
    if (isOpen && servicos.length === 0) {
      cursosApi.listServicos().then(r => setServicos(r.data));
    }
  }, [isOpen]);

  useEffect(() => {
    if (buscaEmp.length < 2) { setEmpreendedoresBusca([]); return; }
    const t = setTimeout(async () => {
      try {
        const res = await empreendedoresApi.list({ search: buscaEmp, per_page: 5 });
        setEmpreendedoresBusca(res.data);
      } catch (e) {
        console.error(e);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [buscaEmp]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!empSelecionado) return;
    setCreatingAtt(true);
    const form = new FormData(e.currentTarget);
    try {
      await atendimentosApi.create({
        empreendedor_id: empSelecionado.id,
        servico_nome: form.get('servico') as string,
        servico_id: parseInt(form.get('servico_id') as string) || undefined,
        observacoes: form.get('obs') as string || undefined,
      });
      onSuccess?.();
      handleClose();
    } catch(err) {
      alert(err instanceof Error ? err.message : 'Erro ao criar atendimento.');
    } finally {
      setCreatingAtt(false);
    }
  };

  const handleClose = () => {
    onClose();
    setBuscaEmp('');
    setEmpSelecionado(null);
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Novo Atendimento">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-2">Empreendedor *</label>
          {empSelecionado ? (
            <div className="glass-panel rounded-xl px-4 py-3 flex items-center justify-between">
              <span className="text-sm text-white">{empSelecionado.nome}</span>
              <button type="button" onClick={() => { setEmpSelecionado(null); setBuscaEmp(''); }} className="text-slate-400 hover:text-white">
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
                <div className="absolute top-full left-0 right-0 mt-1 glass-popover rounded-xl border border-white/10 z-10 overflow-hidden">
                  {empreendedoresBusca.map(e => (
                    <button
                      key={e.id}
                      type="button"
                      onClick={() => { setEmpSelecionado(e); setBuscaEmp(''); setEmpreendedoresBusca([]); }}
                      className="w-full text-left px-4 py-3 hover:bg-white/5 text-sm text-white flex items-center justify-between"
                    >
                      <span>{e.nome}</span>
                      <span className="text-xs text-slate-400">{e.cpf_cnpj}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-2">Serviço *</label>
          <select
            name="servico"
            required
            className="w-full glass-input rounded-xl px-4 py-3 text-sm appearance-none bg-slate-800/50"
            onChange={e => {
              const opt = e.target.selectedOptions[0];
              const hiddenInput = e.target.form?.querySelector('[name=servico_id]') as HTMLInputElement | null;
              if (hiddenInput) hiddenInput.value = opt.dataset.id ?? '';
            }}
          >
            <option value="">Selecione um serviço...</option>
            {servicos.map(s => (
              <option key={s.id} value={s.nome} data-id={s.id}>{s.nome}</option>
            ))}
          </select>
          <input type="hidden" name="servico_id" />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-2">Observações</label>
          <textarea name="obs" rows={3} className="w-full glass-input rounded-xl px-4 py-3 text-sm resize-none" placeholder="Detalhes adicionais..." />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={handleClose} className="px-4 py-2 rounded-lg glass-button-secondary text-sm">Cancelar</button>
          <button type="submit" disabled={!empSelecionado || creatingAtt} className="px-4 py-2 rounded-lg glass-button text-sm text-white disabled:opacity-50 flex items-center gap-2">
            {creatingAtt ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            Adicionar à Fila
          </button>
        </div>
      </form>
    </Modal>
  );
}
