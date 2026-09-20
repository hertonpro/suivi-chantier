import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, AlertTriangle, Plus } from 'lucide-react';
import { NetworkAnomaly, NetworkOutlet } from '../../types';

interface AddAnomalyModalProps {
  outlets: NetworkOutlet[];
  projectId: string;
  onAdd: (anomaly: NetworkAnomaly) => void;
  onClose: () => void;
}

export const AddAnomalyModal: React.FC<AddAnomalyModalProps> = ({
  outlets,
  projectId,
  onAdd,
  onClose,
}) => {
  const [code, setCode] = useState(`AN-URG-${String(Math.floor(Math.random() * 900 + 100))}`);
  const [outletId, setOutletId] = useState(outlets[0]?.id || '');
  const [category, setCategory] = useState<'Câblage' | 'Étiquetage' | 'Connecteur' | 'Fixation' | 'Baie' | 'Autre'>('Câblage');
  const [severity, setSeverity] = useState<'Basse' | 'Moyenne' | 'Critique'>('Moyenne');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    const newAnomaly: NetworkAnomaly = {
      id: `anom_${Date.now()}`,
      project_id: projectId,
      code: code.trim(),
      outlet_id: outletId || undefined,
      category,
      severity,
      description: description.trim(),
      status: 'OPEN',
      created_at: new Date().toISOString().replace('T', ' ').slice(0, 16),
    };

    onAdd(newAnomaly);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 z-50 overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 30 }}
        className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 w-full sm:max-w-md overflow-hidden max-h-[92vh] flex flex-col"
      >
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 flex items-center justify-center text-white shrink-0 shadow-md">
              <AlertTriangle size={22} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black tracking-tight">Signaler une Réserve</h3>
              <p className="text-xs text-slate-400">Contrôle terrain Herton Field Inspector</p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">Code Réserve *</label>
              <input 
                type="text" 
                value={code} 
                onChange={e => setCode(e.target.value)}
                className="w-full px-3.5 py-3 sm:py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base sm:text-xs font-mono font-bold focus:ring-2 focus:ring-amber-500/20 text-slate-900"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">Point / Prise liée</label>
              <select 
                value={outletId} 
                onChange={e => setOutletId(e.target.value)}
                className="w-full px-3.5 py-3 sm:py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base sm:text-xs focus:ring-2 focus:ring-amber-500/20 text-slate-900"
              >
                <option value="">-- Sans prise (Baie / Général) --</option>
                {outlets.map(o => (
                  <option key={o.id} value={o.id}>{o.code} ({o.type})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">Catégorie</label>
              <select 
                value={category} 
                onChange={e => setCategory(e.target.value as any)}
                className="w-full px-3.5 py-3 sm:py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base sm:text-xs focus:ring-2 focus:ring-amber-500/20 text-slate-900"
              >
                <option value="Câblage">Câblage & Paire</option>
                <option value="Étiquetage">Étiquetage</option>
                <option value="Connecteur">Connecteur RJ45</option>
                <option value="Fixation">Fixation Plastron</option>
                <option value="Baie">Baie / Coffret</option>
                <option value="Autre">Autre</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">Sévérité</label>
              <select 
                value={severity} 
                onChange={e => setSeverity(e.target.value as any)}
                className="w-full px-3.5 py-3 sm:py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base sm:text-xs font-bold focus:ring-2 focus:ring-amber-500/20 text-slate-900"
              >
                <option value="Basse">Basse (Mineur)</option>
                <option value="Moyenne">Moyenne (Bloquant)</option>
                <option value="Critique">Critique (Grave)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">Description détaillée du constat *</label>
            <textarea 
              value={description} 
              onChange={e => setDescription(e.target.value)}
              className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-base sm:text-xs focus:ring-2 focus:ring-amber-500/20 resize-none h-28 text-slate-900"
              placeholder="Ex: Paire 4-5 coupée au niveau de la prise murale. Plastron mal fixé..."
              required
            />
          </div>

          <div className="flex gap-3 pt-3 border-t border-slate-100">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 py-3.5 sm:py-3 bg-slate-100 text-slate-700 rounded-2xl font-bold text-sm sm:text-xs hover:bg-slate-200 transition-colors"
            >
              ANNULER
            </button>
            <button 
              type="submit" 
              className="flex-1 py-3.5 sm:py-3 bg-amber-600 text-white rounded-2xl font-bold text-sm sm:text-xs hover:bg-amber-700 transition-colors shadow-lg shadow-amber-600/20 flex items-center justify-center gap-1.5"
            >
              <Plus size={16} />
              <span>ENREGISTRER LA RÉSERVE</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
