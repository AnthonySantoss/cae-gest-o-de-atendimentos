import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { UserCircle, Star, Briefcase, TrendingUp } from 'lucide-react';
import { consultoresApi, type Consultor } from '../../lib/api.js';

export default function ConsultoresPage() {
  const [items, setItems] = useState<Consultor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    consultoresApi.list().then(r => setItems(r.data)).finally(() => setLoading(false));
  }, []);

  const PERFIL_COLORS: Record<string, string> = {
    gestor:    'text-blue-400 bg-blue-500/10 border-blue-500/20',
    consultor: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
    admin:     'text-purple-400 bg-purple-500/10 border-purple-500/20',
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <UserCircle className="text-emerald-400 w-5 h-5" /> Gestão de Consultores
        </h2>
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
              className="glass-card rounded-2xl p-6 flex flex-col items-center text-center group"
            >
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

              <h3 className="text-lg font-bold text-white mb-1">{c.nome}</h3>
              <p className="text-sm text-indigo-300 mb-1">{c.especialidade ?? c.perfil}</p>
              <span className={`text-xs px-2.5 py-1 rounded-full border font-medium mb-4 ${PERFIL_COLORS[c.perfil] ?? ''}`}>
                {c.perfil.charAt(0).toUpperCase() + c.perfil.slice(1)}
              </span>

              {/* Stats */}
              <div className="w-full grid grid-cols-2 gap-3 border-t border-white/10 pt-4">
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
  );
}
