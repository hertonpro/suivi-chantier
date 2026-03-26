import React, { useMemo, useState, useEffect, Component } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Search, 
  Filter, 
  BarChart3, 
  PieChart as PieChartIcon,
  LayoutGrid,
  ChevronDown,
  ChevronUp,
  Info,
  Plus,
  Trash2,
  X,
  Square,
  CheckSquare,
  MessageSquare,
  Settings,
  Edit2,
  EyeOff,
  Eye,
  Download,
  Wallet,
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend,
  LineChart,
  Line
} from 'recharts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { BuildingData, Priority, Status, AppData, ProjectConfig, StepDefinition, TaskStepStatus, Transaction, User, Project, ProjectMember } from './types';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const AuthScreen = ({ onLogin }: { onLogin: (user: User) => void }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, username }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      if (isRegister) {
        setIsRegister(false);
        setError('Compte créé ! Connectez-vous.');
      } else {
        onLogin(data.user);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-8 rounded-3xl shadow-xl border border-slate-200 w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-200">
            <LayoutGrid className="text-white" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">{isRegister ? 'Créer un compte' : 'Connexion'}</h2>
          <p className="text-slate-500 mt-2">Gérez vos chantiers et budgets efficacement</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Nom d'utilisateur</label>
              <input 
                type="text" 
                required
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                placeholder="jean_dupont"
              />
            </div>
          )}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Email</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              placeholder="email@exemple.com"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Mot de passe</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-rose-500 text-xs font-medium text-center">{error}</p>}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 disabled:opacity-50"
          >
            {loading ? 'CHARGEMENT...' : (isRegister ? 'S\'INSCRIRE' : 'SE CONNECTER')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button 
            onClick={() => setIsRegister(!isRegister)}
            className="text-sm font-bold text-indigo-600 hover:text-indigo-700"
          >
            {isRegister ? 'Déjà un compte ? Se connecter' : 'Pas de compte ? S\'inscrire'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const InviteModal = ({ project, onClose }: { project: Project, onClose: () => void }) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'editor' | 'owner'>('editor');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch(`/api/projects/${project.id}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessage('Utilisateur invité avec succès !');
      setEmail('');
    } catch (err: any) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-900">Inviter un collaborateur</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X size={20} className="text-slate-400" />
          </button>
        </div>
        <p className="text-sm text-slate-500 mb-6">Partagez l'accès au projet "{project.name}" avec un autre utilisateur.</p>
        
        <form onSubmit={handleInvite} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Email de l'utilisateur</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              placeholder="collaborateur@exemple.com"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Rôle</label>
            <select 
              value={role}
              onChange={e => setRole(e.target.value as any)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="editor">Éditeur (Peut modifier)</option>
              <option value="owner">Propriétaire (Accès total)</option>
            </select>
          </div>

          {message && <p className={cn("text-xs font-medium text-center", message.includes('succès') ? "text-emerald-500" : "text-rose-500")}>{message}</p>}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 disabled:opacity-50"
          >
            {loading ? 'INVITATION...' : 'ENVOYER L\'INVITATION'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

const ProjectDashboard = ({ user, onSelect, onLogout }: { user: User, onSelect: (p: Project) => void, onLogout: () => void }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [invitingProject, setInvitingProject] = useState<Project | null>(null);
  const [newProject, setNewProject] = useState({ name: '', description: '' });

  useEffect(() => {
    setLoading(true);
    console.log('Fetching projects from frontend...');
    fetch('/api/projects')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch projects');
        return res.json();
      })
      .then(data => {
        console.log('Projects received in frontend:', data);
        if (Array.isArray(data)) {
          setProjects(data);
        } else {
          console.error('Projects data is not an array:', data);
          setProjects([]);
        }
      })
      .catch(err => {
        console.error('Error fetching projects:', err);
        setProjects([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProject),
      });
      const data = await res.json();
      if (res.ok) {
        setProjects([...projects, { id: data.id, ...newProject, created_at: new Date().toISOString(), owner_id: user.id }]);
        setShowCreate(false);
        setNewProject({ name: '', description: '' });
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 font-medium">Chargement de vos projets...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Mes Projets</h1>
            <p className="text-slate-500">Bienvenue, <span className="text-indigo-600 font-bold">{user.username}</span></p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
            >
              <Plus size={20} /> NOUVEAU PROJET
            </button>
            <button 
              onClick={onLogout}
              className="px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold hover:bg-slate-50 transition-all"
            >
              DÉCONNEXION
            </button>
          </div>
        </div>

        {projects.length === 0 ? (
          <div className="bg-white p-20 rounded-3xl border border-dashed border-slate-200 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <LayoutGrid className="text-slate-300" size={40} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Aucun projet trouvé</h3>
            <p className="text-slate-500 mb-8">Commencez par créer votre premier projet de suivi de chantier.</p>
            <button 
              onClick={() => setShowCreate(true)}
              className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all"
            >
              CRÉER UN PROJET
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map(p => (
              <motion.div 
                key={p.id}
                whileHover={{ y: -5 }}
                className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all group relative"
              >
                <div onClick={() => onSelect(p)} className="cursor-pointer">
                  <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-indigo-50 transition-colors">
                    <LayoutGrid className="text-slate-400 group-hover:text-indigo-600 transition-colors" size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-1">{p.name}</h3>
                  <p className="text-sm text-slate-500 mb-4 line-clamp-2">{p.description || 'Pas de description'}</p>
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                  <button 
                    onClick={() => setInvitingProject(p)}
                    className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                  >
                    <Plus size={12} /> Inviter
                  </button>
                  <button onClick={() => onSelect(p)} className="text-slate-300 group-hover:text-indigo-600 transition-colors">
                    <ChevronDown className="-rotate-90" size={16} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        <AnimatePresence>
          {showCreate && (
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md"
              >
                <h2 className="text-2xl font-bold text-slate-900 mb-6">Nouveau Projet</h2>
                <form onSubmit={handleCreate} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Nom du Projet</label>
                    <input 
                      type="text" 
                      required
                      value={newProject.name}
                      onChange={e => setNewProject({ ...newProject, name: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      placeholder="Ex: Résidence Horizon"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Description / Lieu</label>
                    <textarea 
                      value={newProject.description}
                      onChange={e => setNewProject({ ...newProject, description: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none h-24"
                      placeholder="Ex: Construction d'un immeuble R+5 à Paris..."
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button 
                      type="button"
                      onClick={() => setShowCreate(false)}
                      className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all"
                    >
                      ANNULER
                    </button>
                    <button 
                      type="submit"
                      className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
                    >
                      CRÉER
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
          {invitingProject && (
            <InviteModal project={invitingProject} onClose={() => setInvitingProject(null)} />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const BudgetView = ({ 
  transactions, 
  onAdd, 
  onDelete 
}: { 
  transactions: Transaction[], 
  onAdd: (t: Omit<Transaction, 'id'>) => void, 
  onDelete: (id: string) => void 
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTransaction, setNewTransaction] = useState<Omit<Transaction, 'id'>>({
    date: new Date().toISOString().split('T')[0],
    type: 'expense',
    category: 'Matériel',
    amount: 0,
    description: ''
  });
  const devis = 'USD'
  const totals = useMemo(() => {
    const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    return { income, expense, balance: income - expense };
  }, [transactions]);

  const categories = ['Matériel', 'Main d\'œuvre', 'Transport', 'Logistique', 'Autre', 'Paiement Client'];

  const chartData = useMemo(() => {
    const data: Record<string, { income: number, expense: number }> = {};
    transactions.forEach(t => {
      const date = t.date.substring(0, 7); // YYYY-MM
      if (!data[date]) data[date] = { income: 0, expense: 0 };
      if (t.type === 'income') data[date].income += t.amount;
      else data[date].expense += t.amount;
    });
    return Object.entries(data)
      .map(([date, values]) => ({ date, ...values }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [transactions]);

  return (
    <div className="space-y-6">
      {/* Budget Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Revenus Totaux</p>
            <p className="text-2xl font-bold text-emerald-600">{totals.income.toLocaleString()} {devis}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <TrendingDown size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Dépenses Totales</p>
            <p className="text-2xl font-bold text-rose-600">{totals.expense.toLocaleString()} {devis}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Wallet size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Solde Actuel</p>
            <p className="text-2xl font-bold text-indigo-600">{totals.balance.toLocaleString()} {devis}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Transactions List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <Calendar size={18} className="text-slate-400" />
              Historique des Transactions
            </h3>
            <button 
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all"
            >
              {showAddForm ? <X size={14} /> : <Plus size={14} />}
              {showAddForm ? 'ANNULER' : 'NOUVELLE TRANSACTION'}
            </button>
          </div>

          <AnimatePresence>
            {showAddForm && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Date</label>
                    <input 
                      type="date" 
                      value={newTransaction.date}
                      onChange={e => setNewTransaction({ ...newTransaction, date: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Type</label>
                    <select 
                      value={newTransaction.type}
                      onChange={e => setNewTransaction({ ...newTransaction, type: e.target.value as any })}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    >
                      <option value="expense">Dépense</option>
                      <option value="income">Revenu</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Catégorie</label>
                    <select 
                      value={newTransaction.category}
                      onChange={e => setNewTransaction({ ...newTransaction, category: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    >
                      {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Montant (FCFA)</label>
                    <input 
                      type="number" 
                      value={newTransaction.amount || ''}
                      onChange={e => setNewTransaction({ ...newTransaction, amount: Number(e.target.value) })}
                      placeholder="0"
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Description</label>
                    <input 
                      type="text" 
                      value={newTransaction.description}
                      onChange={e => setNewTransaction({ ...newTransaction, description: e.target.value })}
                      placeholder="Détails de l'opération..."
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>
                <button 
                  onClick={() => {
                    if (newTransaction.amount <= 0) return;
                    onAdd(newTransaction);
                    setShowAddForm(false);
                    setNewTransaction({
                      date: new Date().toISOString().split('T')[0],
                      type: 'expense',
                      category: 'Matériel',
                      amount: 0,
                      description: ''
                    });
                  }}
                  className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200"
                >
                  ENREGISTRER LA TRANSACTION
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="data-grid-header">Date</th>
                    <th className="data-grid-header">Description</th>
                    <th className="data-grid-header">Catégorie</th>
                    <th className="data-grid-header text-right">Montant</th>
                    <th className="data-grid-header text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-slate-400 italic text-sm">
                        Aucune transaction enregistrée.
                      </td>
                    </tr>
                  ) : (
                    transactions.map(t => (
                      <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3 text-xs font-medium text-slate-500">{t.date}</td>
                        <td className="px-4 py-3">
                          <p className="text-sm font-bold text-slate-900">{t.description}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase tracking-tight">
                            {t.category}
                          </span>
                        </td>
                        <td className={cn(
                          "px-4 py-3 text-sm font-bold text-right",
                          t.type === 'income' ? "text-emerald-600" : "text-rose-600"
                        )}>
                          {t.type === 'income' ? '+' : '-'}{t.amount.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button 
                            onClick={() => onDelete(t.id)}
                            className="p-1.5 text-slate-300 hover:text-rose-500 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Budget Charts */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-6 flex items-center gap-2">
              <BarChart3 size={16} /> Évolution Mensuelle
            </h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <XAxis dataKey="date" fontSize={10} />
                  <YAxis fontSize={10} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={3} name="Revenus" />
                  <Line type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={3} name="Dépenses" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-6 flex items-center gap-2">
              <PieChartIcon size={16} /> Répartition Dépenses
            </h3>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={Object.entries(
                      transactions
                        .filter(t => t.type === 'expense')
                        .reduce((acc, t) => {
                          acc[t.category] = (acc[t.category] || 0) + t.amount;
                          return acc;
                        }, {} as Record<string, number>)
                    ).map(([name, value]) => ({ name, value }))}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'].map((color, index) => (
                      <Cell key={`cell-${index}`} fill={color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

class ErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean, error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
          <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl text-center">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle size={32} />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Oups ! Quelque chose s'est mal passé.</h1>
            <p className="text-slate-600 mb-6">L'application a rencontré une erreur inattendue.</p>
            <div className="bg-slate-50 p-4 rounded-xl text-left mb-6 overflow-auto max-h-40">
              <code className="text-xs text-red-500">{this.state.error?.message}</code>
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-colors"
            >
              Recharger la page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

const AppContent = () => {
  const [user, setUser] = useState<User | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [appData, setAppData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'Tous'>('Tous');
  const [statusFilter, setStatusFilter] = useState<Status | 'Tous'>('Tous');
  const [editingBuildingId, setEditingBuildingId] = useState<string | null>(null);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'tasks' | 'budget'>('tasks');
  const devis = 'USD'

  // Check for session on mount
  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.user) setUser(data.user);
      })
      .finally(() => setLoading(false));
  }, []);

  // Load data when project is selected
  useEffect(() => {
    if (!selectedProject) {
      setAppData(null);
      return;
    }

    setLoading(true);
    console.log('Fetching data for project:', selectedProject.id);
    fetch(`/api/projects/${selectedProject.id}/data`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch project data');
        return res.json();
      })
      .then(data => {
        console.log('Project data fetched:', data);
        setAppData(data);
      })
      .catch(err => {
        console.error('Error fetching project data:', err);
        setAppData(null);
      })
      .finally(() => setLoading(false));
  }, [selectedProject]);

  // Save data to API
  const saveAllData = async (newData: AppData) => {
    if (!selectedProject) return;
    try {
      await fetch(`/api/projects/${selectedProject.id}/data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newData),
      });
    } catch (err) {
      console.error('Failed to save data:', err);
    }
  };

  const addTransaction = async (transaction: Omit<Transaction, 'id'>) => {
    if (!appData || !selectedProject) return;
    try {
      const res = await fetch(`/api/projects/${selectedProject.id}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transaction),
      });
      const data = await res.json();
      if (res.ok) {
        const newTransaction = { ...transaction, id: data.id };
        const newData = { ...appData, transactions: [newTransaction, ...appData.transactions] };
        setAppData(newData);
      }
    } catch (err) {
      console.error('Failed to add transaction:', err);
    }
  };

  const deleteTransaction = async (id: string) => {
    if (!appData || !selectedProject) return;
    try {
      await fetch(`/api/projects/${selectedProject.id}/transactions/${id}`, { method: 'DELETE' });
      const newData = { ...appData, transactions: appData.transactions.filter(t => t.id !== id) };
      setAppData(newData);
    } catch (err) {
      console.error('Failed to delete transaction:', err);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    setSelectedProject(null);
  };

  // Helper functions
  const calculateProgress = (tasks: Record<string, TaskStepStatus>, steps: StepDefinition[]) => {
    if (!tasks || !steps) return 0;
    const activeSteps = steps.filter(s => !tasks[s.id]?.disabled);
    if (activeSteps.length === 0) return 100;
    const completed = activeSteps.filter(s => tasks[s.id]?.completed).length;
    return (completed / activeSteps.length) * 100;
  };

  const getStatus = (progress: number): Status => {
    if (progress === 100) return 'Terminé';
    if (progress === 0) return 'Non commencé';
    return 'En cours';
  };

  const toggleTaskStep = (buildingId: string, stepId: string) => {
    if (!appData) return;
    const newTasks = appData.tasks.map(item => {
      if (item.id === buildingId) {
        const currentStatus = item.tasks[stepId] || { completed: false };
        return {
          ...item,
          tasks: {
            ...item.tasks,
            [stepId]: { ...currentStatus, completed: !currentStatus.completed }
          }
        };
      }
      return item;
    });
    const newData = { ...appData, tasks: newTasks };
    setAppData(newData);
    saveAllData(newData);
  };

  const toggleStepDisabled = (buildingId: string, stepId: string) => {
    if (!appData) return;
    const newTasks = appData.tasks.map(item => {
      if (item.id === buildingId) {
        const currentStatus = item.tasks[stepId] || { completed: false };
        return {
          ...item,
          tasks: {
            ...item.tasks,
            [stepId]: { ...currentStatus, disabled: !currentStatus.disabled }
          }
        };
      }
      return item;
    });
    const newData = { ...appData, tasks: newTasks };
    setAppData(newData);
    saveAllData(newData);
  };

  const updatePriority = (buildingId: string) => {
    if (!appData) return;
    const priorities: Priority[] = ['Haute', 'Moyenne', 'Basse'];
    const newTasks = appData.tasks.map(item => {
      if (item.id === buildingId) {
        const currentIndex = priorities.indexOf(item.priority);
        const nextIndex = (currentIndex + 1) % priorities.length;
        return { ...item, priority: priorities[nextIndex] };
      }
      return item;
    });
    const newData = { ...appData, tasks: newTasks };
    setAppData(newData);
    saveAllData(newData);
  };

  const updateObservations = (buildingId: string, newObservations: any[]) => {
    if (!appData) return;
    const newTasks = appData.tasks.map(item => {
      if (item.id === buildingId) {
        return { ...item, observations: newObservations };
      }
      return item;
    });
    const newData = { ...appData, tasks: newTasks };
    setAppData(newData);
    saveAllData(newData);
  };

  const updateConfig = (newConfig: ProjectConfig) => {
    if (!appData) return;
    const newData = { ...appData, config: newConfig };
    setAppData(newData);
    saveAllData(newData);
  };

  const exportReport = () => {
    if (!appData) return;

    let report = `RAPPORT DE SUIVI DE CHANTIER - ${appData.config.name}\n`;
    report += `Description: ${appData.config.description}\n`;
    report += `Date d'export: ${new Date().toLocaleString()}\n`;
    report += `--------------------------------------------------\n\n`;

    appData.tasks.forEach(task => {
      const progress = calculateProgress(task.tasks, appData.config.steps);
      const status = getStatus(progress);
      
      report += `TÂCHE: ${task.name}\n`;
      report += `Service: ${task.service || '-'} | Niveau: ${task.level} | Priorité: ${task.priority}\n`;
      report += `Progression: ${Math.round(progress)}% | Statut: ${status}\n\n`;
      
      if (task.observations.length > 0) {
        report += `NOTES & OBSERVATIONS:\n`;
        task.observations.forEach(obs => {
          if (obs.type === 'todo') {
            report += ` [${obs.completed ? '✓' : ' '}] ${obs.text}\n`;
          } else {
            report += ` - ${obs.text}\n`;
          }
        });
      } else {
        report += `Aucune observation.\n`;
      }
      
      report += `\n--------------------------------------------------\n\n`;
    });

    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Rapport_Chantier_${appData.config.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const editingBuilding = useMemo(() => 
    appData?.tasks.find(b => b.id === editingBuildingId), 
    [appData, editingBuildingId]
  );

  // Derived data
  const filteredData = useMemo(() => {
    if (!appData) return [];
    return appData.tasks.filter(item => {
      const progress = calculateProgress(item.tasks, appData.config.steps);
      const status = getStatus(progress);
      
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            item.service.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPriority = priorityFilter === 'Tous' || item.priority === priorityFilter;
      const matchesStatus = statusFilter === 'Tous' || status === statusFilter;

      return matchesSearch && matchesPriority && matchesStatus;
    });
  }, [appData, searchTerm, priorityFilter, statusFilter]);

  const stats = useMemo(() => {
    if (!appData) return { total: 0, finished: 0, inProgress: 0, notStarted: 0 };
    const total = appData.tasks.length;
    const finished = appData.tasks.filter(d => calculateProgress(d.tasks, appData.config.steps) === 100).length;
    const inProgress = appData.tasks.filter(d => {
      const p = calculateProgress(d.tasks, appData.config.steps);
      return p > 0 && p < 100;
    }).length;
    const notStarted = appData.tasks.filter(d => calculateProgress(d.tasks, appData.config.steps) === 0).length;

    return { total, finished, inProgress, notStarted };
  }, [appData]);

  const chartData = useMemo(() => {
    if (!appData) return { pieData: [], taskProgress: [] };
    const pieData = [
      { name: 'Terminé', value: stats.finished, color: '#10b981' },
      { name: 'En cours', value: stats.inProgress, color: '#f59e0b' },
      { name: 'Non commencé', value: stats.notStarted, color: '#ef4444' },
    ];

    const taskProgress = appData.config.steps.map(step => {
      const completed = appData.tasks.filter(d => d.tasks[step.id]?.completed && !d.tasks[step.id]?.disabled).length;
      const totalActive = appData.tasks.filter(d => !d.tasks[step.id]?.disabled).length;
      return {
        name: step.label,
        réalisé: completed,
        restant: totalActive - completed,
      };
    });

    return { pieData, taskProgress };
  }, [appData, stats]);

  if (loading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen onLogin={setUser} />;
  }

  if (!selectedProject) {
    return <ProjectDashboard user={user} onSelect={setSelectedProject} onLogout={handleLogout} />;
  }

  if (loading || !appData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium">Chargement du projet...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-10 max-w-[1600px] mx-auto">
      {/* Header */}
      <header className="mb-8 md:mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-4 mb-4">
            <button 
              onClick={() => setSelectedProject(null)}
              className="p-2 bg-white border border-slate-200 text-slate-400 rounded-xl hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm"
              title="Retour aux projets"
            >
              <LayoutGrid size={20} />
            </button>
            <div 
              className="group cursor-pointer" 
              onClick={() => setIsConfigOpen(true)}
            >
              <div className="flex items-center gap-3">
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">
                  {appData.config.name}
                </h1>
                <Settings size={20} className="text-slate-300 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-sm md:text-base text-slate-500 font-medium">{appData.config.description} • {selectedProject.name}</p>
            </div>
          </div>
          
          <div className="flex gap-2 mt-4">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                exportReport();
              }}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl text-sm font-bold hover:bg-emerald-600 transition-all shadow-sm shadow-emerald-200"
            >
              <Download size={18} />
              EXPORTER
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setActiveTab(activeTab === 'tasks' ? 'budget' : 'tasks');
              }}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-sm",
                activeTab === 'budget' ? "bg-indigo-600 text-white shadow-indigo-200" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              )}
            >
              {activeTab === 'tasks' ? <Wallet size={18} /> : <LayoutGrid size={18} />}
              {activeTab === 'tasks' ? 'GESTION BUDGET' : 'SUIVI CHANTIER'}
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
          <StatCard label="Total" value={stats.total} icon={<LayoutGrid size={16} />} color="slate" />
          <StatCard label="Terminé" value={stats.finished} icon={<CheckCircle2 size={16} />} color="emerald" />
          <StatCard label="En cours" value={stats.inProgress} icon={<Clock size={16} />} color="amber" />
          <StatCard label="Non commencé" value={stats.notStarted} icon={<AlertCircle size={16} />} color="rose" />
        </div>
      </header>

      {activeTab === 'tasks' ? (
        <>
          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 lg:col-span-1">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-6 flex items-center gap-2">
                <PieChartIcon size={16} /> État Global
              </h3>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData.pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {chartData.pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 lg:col-span-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-6 flex items-center gap-2">
                <BarChart3 size={16} /> Progression par Étape
              </h3>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData.taskProgress} layout="vertical" margin={{ left: 40 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="réalisé" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="restant" stackId="a" fill="#f1f5f9" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="bg-white p-4 rounded-t-2xl border-x border-t border-slate-200 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Rechercher une tâche..." 
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-hide">
              <div className="flex items-center gap-2 shrink-0">
                <Filter size={16} className="text-slate-400" />
                <select 
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value as any)}
                >
                  <option value="Tous">Priorités</option>
                  <option value="Haute">Haute</option>
                  <option value="Moyenne">Moyenne</option>
                  <option value="Basse">Basse</option>
                </select>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <select 
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                >
                  <option value="Tous">Statuts</option>
                  <option value="Terminé">Terminé</option>
                  <option value="En cours">En cours</option>
                  <option value="Non commencé">Non commencé</option>
                </select>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="bg-white rounded-b-2xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="data-grid-header">Tâche</th>
                    <th className="data-grid-header">Sous-tâche</th>
                    <th className="data-grid-header">Priorité</th>
                    {appData.config.steps.map(step => (
                      <th key={step.id} className="data-grid-header text-center whitespace-nowrap">{step.label}</th>
                    ))}
                    <th className="data-grid-header">%</th>
                    <th className="data-grid-header">Statut</th>
                    <th className="data-grid-header">Observations</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence mode="popLayout">
                    {filteredData.map((item) => {
                      const progress = calculateProgress(item.tasks, appData.config.steps);
                      const status = getStatus(progress);
                      
                      return (
                        <motion.tr 
                          key={item.id}
                          layout
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="hover:bg-slate-50/80 transition-colors group"
                        >
                          <td className="data-grid-cell font-bold text-slate-900">
                            {item.name}
                          </td>
                          <td className="data-grid-cell">
                            <div className="text-slate-900 font-medium">{item.service || '-'}</div>
                            <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">{item.level}</div>
                          </td>
                          <td className="data-grid-cell">
                            <button onClick={() => updatePriority(item.id)}>
                              <PriorityBadge priority={item.priority} />
                            </button>
                          </td>
                          
                          {/* Task Checkboxes */}
                          {appData.config.steps.map(step => {
                            const stepStatus = item.tasks[step.id] || { completed: false };
                            return (
                              <td key={step.id} className="data-grid-cell text-center">
                                {stepStatus.disabled ? (
                                  <div className="flex items-center justify-center text-slate-200">
                                    <EyeOff size={14} />
                                  </div>
                                ) : (
                                  <button 
                                    onClick={() => toggleTaskStep(item.id, step.id)}
                                    className={cn(
                                      "w-6 h-6 rounded-md border-2 transition-all flex items-center justify-center mx-auto",
                                      stepStatus.completed 
                                        ? "bg-emerald-500 border-emerald-500 text-white shadow-sm shadow-emerald-200" 
                                        : "bg-white border-slate-200 hover:border-slate-300"
                                    )}
                                  >
                                    {stepStatus.completed && <CheckCircle2 size={14} strokeWidth={3} />}
                                  </button>
                                )}
                              </td>
                            );
                          })}

                          <td className="data-grid-cell font-mono text-xs font-bold">
                            {Math.round(progress)}%
                          </td>
                          <td className="data-grid-cell">
                            <StatusBadge status={status} />
                          </td>
                          <td 
                            className="data-grid-cell max-w-[200px] cursor-pointer hover:bg-slate-100/50 transition-colors"
                            onClick={() => setEditingBuildingId(item.id)}
                          >
                            <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                              {item.observations.length > 0 ? (
                                <>
                                  <MessageSquare size={12} className="shrink-0" />
                                  <span className="truncate">
                                    {item.observations.length} note{item.observations.length > 1 ? 's' : ''}
                                    {item.observations.some(o => o.type === 'todo') && 
                                      ` (${item.observations.filter(o => o.type === 'todo' && o.completed).length}/${item.observations.filter(o => o.type === 'todo').length} ✓)`
                                    }
                                  </span>
                                </>
                              ) : (
                                <span className="text-slate-300 italic">Ajouter une note...</span>
                              )}
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-slate-100">
              <AnimatePresence mode="popLayout">
                {filteredData.map((item) => {
                  const progress = calculateProgress(item.tasks, appData.config.steps);
                  const status = getStatus(progress);
                  
                  return (
                    <motion.div 
                      key={item.id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="p-4 space-y-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h4 className="font-bold text-slate-900">{item.name}</h4>
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
                            <span className="text-xs text-slate-500">{item.service || '-'}</span>
                            <span className="text-[10px] text-slate-300 font-mono uppercase tracking-wider">{item.level}</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <button onClick={() => updatePriority(item.id)}>
                            <PriorityBadge priority={item.priority} />
                          </button>
                          <StatusBadge status={status} />
                        </div>
                      </div>

                      {/* Mobile Steps Grid */}
                      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                        {appData.config.steps.map(step => {
                          const stepStatus = item.tasks[step.id] || { completed: false };
                          return (
                            <div key={step.id} className="flex flex-col items-center gap-1.5">
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter truncate w-full text-center">
                                {step.label}
                              </span>
                              {stepStatus.disabled ? (
                                <div className="w-8 h-8 flex items-center justify-center text-slate-200 bg-slate-50 rounded-lg">
                                  <EyeOff size={14} />
                                </div>
                              ) : (
                                <button 
                                  onClick={() => toggleTaskStep(item.id, step.id)}
                                  className={cn(
                                    "w-8 h-8 rounded-lg border-2 transition-all flex items-center justify-center",
                                    stepStatus.completed 
                                      ? "bg-emerald-500 border-emerald-500 text-white shadow-sm" 
                                      : "bg-white border-slate-200"
                                  )}
                                >
                                  {stepStatus.completed && <CheckCircle2 size={16} strokeWidth={3} />}
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-emerald-500 transition-all duration-500" 
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-bold font-mono text-slate-400">{Math.round(progress)}%</span>
                        </div>
                        
                        <button 
                          onClick={() => setEditingBuildingId(item.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                        >
                          <MessageSquare size={14} />
                          {item.observations.length > 0 ? `${item.observations.length} notes` : 'Observations'}
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {filteredData.length === 0 && (
              <div className="py-20 text-center text-slate-400">
                <Search size={48} className="mx-auto mb-4 opacity-20" />
                <p className="text-sm">Aucune tâche trouvée pour ces critères.</p>
              </div>
            )}
          </div>
        </>
      ) : (
        <BudgetView 
          transactions={appData.transactions} 
          onAdd={addTransaction} 
          onDelete={deleteTransaction} 
        />
      )}

      {/* Modal for Observations */}
      <AnimatePresence>
        {editingBuilding && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-none md:rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col h-full md:h-auto md:max-h-[80vh]"
            >
              <div className="p-4 md:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{editingBuilding.name}</h3>
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">{editingBuilding.service} • {editingBuilding.level}</p>
                </div>
                <button 
                  onClick={() => setEditingBuildingId(null)}
                  className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
                {/* Steps Configuration for this task */}
                <section>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Configuration des Étapes</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {appData.config.steps.map(step => {
                      const isDisabled = editingBuilding.tasks[step.id]?.disabled;
                      return (
                        <button 
                          key={step.id}
                          onClick={() => toggleStepDisabled(editingBuilding.id, step.id)}
                          className={cn(
                            "flex items-center justify-between p-2 rounded-xl border text-xs font-medium transition-all",
                            isDisabled 
                              ? "bg-slate-50 border-slate-100 text-slate-400" 
                              : "bg-emerald-50 border-emerald-100 text-emerald-700"
                          )}
                        >
                          <span>{step.label}</span>
                          {isDisabled ? <EyeOff size={12} /> : <Eye size={12} />}
                        </button>
                      );
                    })}
                  </div>
                </section>

                {/* Observations */}
                <section>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Notes & Observations</h4>
                  <div className="space-y-3">
                    {editingBuilding.observations.length === 0 ? (
                      <div className="text-center py-6 text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        <p className="text-xs">Aucune observation.</p>
                      </div>
                    ) : (
                      editingBuilding.observations.map((obs) => (
                        <div key={obs.id} className="group flex items-start gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200">
                          {obs.type === 'todo' ? (
                            <button 
                              onClick={() => {
                                const newObs = editingBuilding.observations.map(o => 
                                  o.id === obs.id ? { ...o, completed: !o.completed } : o
                                );
                                updateObservations(editingBuilding.id, newObs);
                              }}
                              className={cn(
                                "mt-0.5 shrink-0 transition-colors",
                                obs.completed ? "text-emerald-500" : "text-slate-300 hover:text-slate-400"
                              )}
                            >
                              {obs.completed ? <CheckSquare size={18} /> : <Square size={18} />}
                            </button>
                          ) : (
                            <div className="mt-1 shrink-0 text-slate-300">
                              <Info size={16} />
                            </div>
                          )}
                          
                          <div className={cn(
                            "flex-1 text-sm leading-relaxed",
                            obs.completed && "line-through text-slate-400"
                          )}>
                            {obs.text}
                          </div>

                          <button 
                            onClick={() => {
                              const newObs = editingBuilding.observations.filter(o => o.id !== obs.id);
                              updateObservations(editingBuilding.id, newObs);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-300 hover:text-rose-500 transition-all"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </section>
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-100">
                <div className="flex gap-2">
                  <input 
                    id="new-obs-input"
                    type="text" 
                    placeholder="Ajouter une note ou tâche..." 
                    className="flex-1 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const input = e.currentTarget;
                        if (!input.value.trim()) return;
                        const newObs = [
                          ...editingBuilding.observations,
                          { id: Date.now().toString(), text: input.value, type: 'text' }
                        ];
                        updateObservations(editingBuilding.id, newObs);
                        input.value = '';
                      }
                    }}
                  />
                </div>
                <div className="flex gap-2 mt-3">
                  <button 
                    onClick={() => {
                      const input = document.getElementById('new-obs-input') as HTMLInputElement;
                      if (!input.value.trim()) return;
                      const newObs = [
                        ...editingBuilding.observations,
                        { id: Date.now().toString(), text: input.value, type: 'text' }
                      ];
                      updateObservations(editingBuilding.id, newObs);
                      input.value = '';
                    }}
                    className="flex-1 flex items-center justify-center gap-2 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    <Plus size={14} /> NOTE TEXTE
                  </button>
                  <button 
                    onClick={() => {
                      const input = document.getElementById('new-obs-input') as HTMLInputElement;
                      if (!input.value.trim()) return;
                      const newObs = [
                        ...editingBuilding.observations,
                        { id: Date.now().toString(), text: input.value, type: 'todo', completed: false }
                      ];
                      updateObservations(editingBuilding.id, newObs);
                      input.value = '';
                    }}
                    className="flex-1 flex items-center justify-center gap-2 py-2 bg-emerald-500 text-white rounded-xl text-xs font-bold hover:bg-emerald-600 transition-colors shadow-sm shadow-emerald-200"
                  >
                    <Plus size={14} /> TODO LIST
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Project Config Modal */}
      <AnimatePresence>
        {isConfigOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-none md:rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col h-full md:h-auto md:max-h-[80vh]"
            >
              <div className="p-4 md:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="text-lg font-bold text-slate-900">Configuration du Projet</h3>
                <button 
                  onClick={() => setIsConfigOpen(false)}
                  className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Nom du Projet</label>
                    <input 
                      type="text" 
                      value={appData.config.name}
                      onChange={(e) => updateConfig({ ...appData.config, name: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Description</label>
                    <input 
                      type="text" 
                      value={appData.config.description}
                      onChange={(e) => updateConfig({ ...appData.config, description: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Étapes Globales</label>
                  <div className="space-y-2">
                    {appData.config.steps.map((step, idx) => (
                      <div key={step.id} className="flex items-center gap-2">
                        <input 
                          type="text" 
                          value={step.label}
                          onChange={(e) => {
                            const newSteps = [...appData.config.steps];
                            newSteps[idx] = { ...step, label: e.target.value };
                            updateConfig({ ...appData.config, steps: newSteps });
                          }}
                          className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        />
                        <button 
                          onClick={() => {
                            const newSteps = appData.config.steps.filter(s => s.id !== step.id);
                            updateConfig({ ...appData.config, steps: newSteps });
                          }}
                          className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))}
                    <button 
                      onClick={() => {
                        const newId = `step_${Date.now()}`;
                        const newSteps = [...appData.config.steps, { id: newId, label: 'Nouvelle Étape' }];
                        updateConfig({ ...appData.config, steps: newSteps });
                      }}
                      className="w-full flex items-center justify-center gap-2 py-2 border-2 border-dashed border-slate-200 rounded-xl text-xs font-bold text-slate-400 hover:border-slate-300 hover:text-slate-500 transition-all"
                    >
                      <Plus size={14} /> AJOUTER UNE ÉTAPE
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-100">
                <button 
                  onClick={() => setIsConfigOpen(false)}
                  className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors"
                >
                  TERMINER
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const StatCard = ({ label, value, icon, color }: { label: string, value: number, icon: React.ReactNode, color: 'emerald' | 'amber' | 'rose' | 'slate' }) => {
  const colors = {
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    rose: "bg-rose-50 text-rose-600 border-rose-100",
    slate: "bg-slate-50 text-slate-600 border-slate-100",
  };

  return (
    <div className={cn("p-4 rounded-2xl border flex flex-col gap-1", colors[color])}>
      <div className="flex items-center justify-between opacity-80">
        <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
        {icon}
      </div>
      <span className="text-2xl font-bold tracking-tight">{value}</span>
    </div>
  );
};

const PriorityBadge = ({ priority }: { priority: Priority }) => {
  const styles = {
    Haute: "bg-rose-100 text-rose-700",
    Moyenne: "bg-amber-100 text-amber-700",
    Basse: "bg-slate-100 text-slate-700",
  };
  return (
    <span className={cn("px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-tight", styles[priority])}>
      {priority}
    </span>
  );
};

const StatusBadge = ({ status }: { status: Status }) => {
  const styles = {
    'Terminé': "bg-emerald-500 text-white",
    'En cours': "bg-amber-500 text-white",
    'Non commencé': "bg-slate-400 text-white",
  };
  return (
    <span className={cn("status-badge", styles[status])}>
      {status}
    </span>
  );
};
