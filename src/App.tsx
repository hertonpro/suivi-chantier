import React, { useMemo, useState, useEffect } from 'react';
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
  Eye
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
  Legend 
} from 'recharts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { BuildingData, Priority, Status, AppData, ProjectConfig, StepDefinition, TaskStepStatus } from './types';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const App = () => {
  const [appData, setAppData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'Tous'>('Tous');
  const [statusFilter, setStatusFilter] = useState<Status | 'Tous'>('Tous');
  const [editingBuildingId, setEditingBuildingId] = useState<string | null>(null);
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  // Load data from API
  useEffect(() => {
    fetch('/api/data')
      .then(res => res.json())
      .then(json => {
        setAppData(json);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load data:', err);
        setLoading(false);
      });
  }, []);

  // Save data to API
  const saveAllData = async (newData: AppData) => {
    try {
      await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newData),
      });
    } catch (err) {
      console.error('Failed to save data:', err);
    }
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

  if (loading || !appData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium">Chargement des données...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-10 max-w-[1600px] mx-auto">
      {/* Header */}
      <header className="mb-8 md:mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="group cursor-pointer" onClick={() => setIsConfigOpen(true)}>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 mb-1 md:mb-2">
              {appData.config.name}
            </h1>
            <Settings size={20} className="text-slate-300 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity mb-1 md:mb-2" />
          </div>
          <p className="text-sm md:text-base text-slate-500 font-medium">{appData.config.subtitle} • Mise à jour en temps réel</p>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
          <StatCard label="Total" value={stats.total} icon={<LayoutGrid size={16} />} color="slate" />
          <StatCard label="Terminé" value={stats.finished} icon={<CheckCircle2 size={16} />} color="emerald" />
          <StatCard label="En cours" value={stats.inProgress} icon={<Clock size={16} />} color="amber" />
          <StatCard label="Non commencé" value={stats.notStarted} icon={<AlertCircle size={16} />} color="rose" />
        </div>
      </header>

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
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Sous-titre</label>
                    <input 
                      type="text" 
                      value={appData.config.subtitle}
                      onChange={(e) => updateConfig({ ...appData.config, subtitle: e.target.value })}
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

export default App;
