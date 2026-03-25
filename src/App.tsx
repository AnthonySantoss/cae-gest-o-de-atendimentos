import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard, Users, History, UserCircle,
  GraduationCap, BarChart3, Search, Bell, Plus,
  Briefcase, Sun, Moon, LogOut, X
} from 'lucide-react';
import { cn } from './lib/utils.js';
import { useAuth } from './lib/auth.js';
import LoginPage from './features/auth/LoginPage.js';
import DashboardPage from './features/dashboard/DashboardPage.js';
import EmpreendedoresPage from './features/empreendedores/EmpreendedoresPage.js';
import HistoricoPage from './features/historico/HistoricoPage.js';
import ConsultoresPage from './features/consultores/ConsultoresPage.js';
import EncaminhamentosPage from './features/encaminhamentos/EncaminhamentosPage.js';
import RelatoriosPage from './features/relatorios/RelatoriosPage.js';
import NovoAtendimentoModal from './features/dashboard/NovoAtendimentoModal.js';
import type { Empreendedor } from './lib/api.js';

type Tab = 'dashboard' | 'empreendedores' | 'historico' | 'consultores' | 'encaminhamentos' | 'relatorios';

const NAV_ITEMS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard',       label: 'Dashboard',      icon: <LayoutDashboard size={19} /> },
  { id: 'empreendedores',  label: 'Empreendedores', icon: <Users size={19} /> },
  { id: 'historico',       label: 'Histórico',      icon: <History size={19} /> },
  { id: 'consultores',     label: 'Consultores',    icon: <UserCircle size={19} /> },
  { id: 'encaminhamentos', label: 'Encaminhamentos',icon: <GraduationCap size={19} /> },
  { id: 'relatorios',      label: 'Relatórios',     icon: <BarChart3 size={19} /> },
];

export default function App() {
  const { isAuthenticated, isLoading, user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedHistoricoEmp, setSelectedHistoricoEmp] = useState<Empreendedor | null>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showNewAttModal, setShowNewAttModal] = useState(false);
  const [refreshFilaCounter, setRefreshFilaCounter] = useState(0);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.classList.toggle('light-mode', next === 'light');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-shape bg-shape-1" /><div className="bg-shape bg-shape-2" />
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
          <Briefcase className="w-8 h-8 text-indigo-400" />
        </motion.div>
      </div>
    );
  }

  if (!isAuthenticated) return <LoginPage />;

  return (
    <div className="min-h-screen flex text-slate-100 font-sans selection:bg-indigo-500/30">
      {/* Background */}
      <div className="bg-shape bg-shape-1" />
      <div className="bg-shape bg-shape-2" />
      <div className="bg-shape bg-shape-3" />

      {/* Sidebar */}
      <motion.aside
        initial={{ x: -64, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 26 }}
        className="w-64 hidden md:flex flex-col glass-panel border-r border-white/10 z-20 relative"
      >
        {/* Logo */}
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Briefcase className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight tracking-tight">CAE</h1>
            <p className="text-xs text-slate-400 font-medium">Gestão de Atendimentos</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-2 space-y-0.5">
          {NAV_ITEMS.map((item, idx) => (
            <motion.button
              key={item.id}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 + idx * 0.04 }}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group text-left',
                activeTab === item.id
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]'
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
              )}
            >
              <span className={cn('transition-colors', activeTab === item.id ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300')}>
                {item.icon}
              </span>
              <span className="font-medium text-sm">{item.label}</span>
              {activeTab === item.id && (
                <motion.div layoutId="sidebar-indicator" className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400" />
              )}
            </motion.button>
          ))}
        </nav>

        {/* User card */}
        <div className="p-4 mt-auto">
          <div className="glass-card rounded-xl p-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500/40 to-purple-500/40 border border-white/10 flex items-center justify-center shrink-0">
              <span className="text-sm font-bold text-white">{user?.nome?.charAt(0)}</span>
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-sm font-medium truncate text-white">{user?.nome}</p>
              <p className="text-xs text-indigo-300 truncate capitalize">{user?.perfil}</p>
            </div>
            <button onClick={logout} className="text-slate-400 hover:text-red-400 transition-colors p-1" title="Sair">
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </motion.aside>

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0 z-10 relative h-screen overflow-y-auto">
        {/* Header */}
        <header className="sticky top-0 z-30 glass-panel border-b border-white/10 px-6 py-3.5 flex items-center justify-between gap-4">
          <div className="flex-1 max-w-xl relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => {
                setSearchTerm(e.target.value);
                if (e.target.value.length > 0 && activeTab !== 'empreendedores') {
                  setActiveTab('empreendedores');
                }
              }}
              placeholder="Buscar empreendedor por nome, CPF ou CNPJ..."
              className="w-full glass-input rounded-full py-2 pl-10 pr-4 text-sm placeholder:text-slate-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full glass-button-secondary text-slate-300 hover:text-white transition-colors"
              aria-label="Alternar tema"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Notificações */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-full glass-button-secondary text-slate-300 hover:text-white"
              >
                <Bell size={18} />
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full shadow-[0_0_6px_rgba(239,68,68,0.8)]" />
              </button>
              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-76 glass-popover rounded-xl shadow-2xl border border-white/10 overflow-hidden z-50"
                  >
                    <div className="p-3 border-b border-white/10 bg-white/5 flex justify-between items-center">
                      <h3 className="font-semibold text-sm">Notificações</h3>
                      <button onClick={() => setShowNotifications(false)} className="text-slate-400 hover:text-white"><X size={13} /></button>
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                      <div className="p-4 text-center">
                        <p className="text-sm font-medium text-slate-300">Sem notificações</p>
                        <p className="text-xs text-slate-500 mt-1">Tudo tranquilo por aqui.</p>
                      </div>
                    </div>
                    <div className="p-2 text-center border-t border-white/10 bg-white/5">
                      <button className="text-xs text-indigo-300 hover:text-indigo-200 font-medium">Histórico de alertas</button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button
              onClick={() => setShowNewAttModal(true)}
              className="glass-button rounded-full px-4 py-2 text-sm font-medium flex items-center gap-2 text-white"
            >
              <Plus size={16} />
              <span className="hidden sm:inline">Novo Atendimento</span>
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="p-6 space-y-6 max-w-7xl mx-auto w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'dashboard' && (
                <DashboardPage
                  onNavigate={tab => setActiveTab(tab as Tab)}
                  onNovoAtendimento={() => setShowNewAttModal(true)}
                  refreshCounter={refreshFilaCounter}
                />
              )}
              {activeTab === 'empreendedores' && (
                <EmpreendedoresPage
                  searchTerm={searchTerm}
                  onVerHistorico={(emp: Empreendedor) => {
                    setSelectedHistoricoEmp(emp);
                    setActiveTab('historico');
                  }}
                />
              )}
              {activeTab === 'historico' && (
                <HistoricoPage
                  selectedEmp={selectedHistoricoEmp}
                  onClearFilter={() => setSelectedHistoricoEmp(null)}
                />
              )}
              {activeTab === 'consultores'     && <ConsultoresPage />}
              {activeTab === 'encaminhamentos' && <EncaminhamentosPage />}
              {activeTab === 'relatorios'      && <RelatoriosPage />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <NovoAtendimentoModal
        isOpen={showNewAttModal}
        onClose={() => setShowNewAttModal(false)}
        onSuccess={() => setRefreshFilaCounter(c => c + 1)}
      />
    </div>
  );
}
