import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Server, Plus, ShieldCheck, Check, Layers } from 'lucide-react';
import { NetworkRack, NetworkEquipment, NetworkZone } from '../../types';

interface RacksInventoryModalProps {
  racks: NetworkRack[];
  equipments: NetworkEquipment[];
  zones: NetworkZone[];
  projectId: string;
  onAddEquipment: (eq: NetworkEquipment) => void;
  onAddRack: (rack: NetworkRack) => void;
  onClose: () => void;
}

export const RacksInventoryModal: React.FC<RacksInventoryModalProps> = ({
  racks,
  equipments,
  zones,
  projectId,
  onAddEquipment,
  onAddRack,
  onClose,
}) => {
  const [showAddEq, setShowAddEq] = useState(false);
  const [eqType, setEqType] = useState<'Switch' | 'Patch Panel' | 'UPS' | 'PDU' | 'Routeur'>('Switch');
  const [eqBrand, setEqBrand] = useState('Cisco');
  const [eqModel, setEqModel] = useState('Catalyst 2960X');
  const [eqSerial, setEqSerial] = useState('SN-');
  const [eqPosition, setEqPosition] = useState('U10');
  const [eqRackId, setEqRackId] = useState(racks[0]?.id || '');
  const [eqPorts, setEqPorts] = useState(24);

  const handleAddEquipmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newEq: NetworkEquipment = {
      id: `eq_${Date.now()}`,
      project_id: projectId,
      rack_id: eqRackId,
      type: eqType,
      brand: eqBrand.trim(),
      model: eqModel.trim(),
      serial_number: eqSerial.trim(),
      position: eqPosition.trim(),
      ports_count: Number(eqPorts) || 24,
    };
    onAddEquipment(newEq);
    setShowAddEq(false);
  };

  const zonesMap = new Map(zones.map(z => [z.id, z]));

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 z-50 overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 30 }}
        className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 w-full sm:max-w-4xl max-h-[94vh] sm:max-h-[85vh] flex flex-col overflow-hidden"
      >
        <div className="p-4 sm:p-6 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shrink-0 shadow-md">
              <Server size={22} />
            </div>
            <div>
              <h3 className="text-base sm:text-xl font-black tracking-tight">Inventaire des Baies & Matériel</h3>
              <p className="text-xs text-slate-400">Switches, Panneaux de Brassage, PDU, Onduleurs</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              type="button" 
              onClick={() => setShowAddEq(!showAddEq)}
              className="px-3 sm:px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
            >
              <Plus size={16} /> 
              <span className="hidden sm:inline">Ajouter Équipement</span>
              <span className="sm:hidden">+ Matériel</span>
            </button>
            <button 
              type="button" 
              onClick={onClose}
              className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-white rounded-xl hover:bg-slate-800"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {showAddEq && (
            <form onSubmit={handleAddEquipmentSubmit} className="bg-indigo-50/70 p-4 sm:p-5 rounded-2xl border border-indigo-100 space-y-3">
              <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider">
                Nouvel Équipement Actif ou Passif
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">Type</label>
                  <select 
                    value={eqType} 
                    onChange={e => setEqType(e.target.value as any)}
                    className="w-full px-3.5 py-3 sm:py-2 bg-white border border-slate-200 rounded-xl text-base sm:text-xs focus:ring-2 focus:ring-indigo-500/20 text-slate-900"
                  >
                    <option value="Switch">Switch (Commutateur)</option>
                    <option value="Patch Panel">Panneau de Brassage</option>
                    <option value="UPS">Onduleur (UPS)</option>
                    <option value="PDU">PDU Alimentation</option>
                    <option value="Routeur">Routeur / Firewall</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">Marque</label>
                  <input 
                    type="text" 
                    value={eqBrand} 
                    onChange={e => setEqBrand(e.target.value)}
                    className="w-full px-3.5 py-3 sm:py-2 bg-white border border-slate-200 rounded-xl text-base sm:text-xs focus:ring-2 focus:ring-indigo-500/20 text-slate-900"
                    placeholder="Ex: Cisco, Ubiquiti, Legrand"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">Modèle</label>
                  <input 
                    type="text" 
                    value={eqModel} 
                    onChange={e => setEqModel(e.target.value)}
                    className="w-full px-3.5 py-3 sm:py-2 bg-white border border-slate-200 rounded-xl text-base sm:text-xs focus:ring-2 focus:ring-indigo-500/20 text-slate-900"
                    placeholder="Ex: 2960X-48FPS, LCS3"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">Baie / Coffret</label>
                  <select 
                    value={eqRackId} 
                    onChange={e => setEqRackId(e.target.value)}
                    className="w-full px-3.5 py-3 sm:py-2 bg-white border border-slate-200 rounded-xl text-base sm:text-xs focus:ring-2 focus:ring-indigo-500/20 text-slate-900"
                  >
                    {racks.map(r => (
                      <option key={r.id} value={r.id}>{r.name} ({r.height_u}U)</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">Position U</label>
                  <input 
                    type="text" 
                    value={eqPosition} 
                    onChange={e => setEqPosition(e.target.value)}
                    className="w-full px-3.5 py-3 sm:py-2 bg-white border border-slate-200 rounded-xl text-base sm:text-xs focus:ring-2 focus:ring-indigo-500/20 text-slate-900"
                    placeholder="Ex: U12-U13"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">N° de Série (SN)</label>
                  <input 
                    type="text" 
                    value={eqSerial} 
                    onChange={e => setEqSerial(e.target.value)}
                    className="w-full px-3.5 py-3 sm:py-2 bg-white border border-slate-200 rounded-xl text-base sm:text-xs font-mono focus:ring-2 focus:ring-indigo-500/20 text-slate-900"
                    placeholder="Ex: FCW2145A8K9"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">Nombre de Ports</label>
                  <input 
                    type="number" 
                    value={eqPorts} 
                    onChange={e => setEqPorts(Number(e.target.value))}
                    className="w-full px-3.5 py-3 sm:py-2 bg-white border border-slate-200 rounded-xl text-base sm:text-xs focus:ring-2 focus:ring-indigo-500/20 text-slate-900"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowAddEq(false)}
                  className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 shadow"
                >
                  Ajouter à l'inventaire
                </button>
              </div>
            </form>
          )}

          {/* Liste des Baies */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Server size={16} /> Baies & Répartiteurs ({racks.length})
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
              {racks.map(rack => {
                const zone = zonesMap.get(rack.zone_id);
                const rackEqs = equipments.filter(e => e.rack_id === rack.id);

                return (
                  <div key={rack.id} className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h5 className="font-bold text-slate-900 text-sm">{rack.name}</h5>
                        <p className="text-xs text-slate-500">{zone?.building} • {zone?.room}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        rack.status === 'CONFORME' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {rack.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-600 pt-2 border-t border-slate-200">
                      <span>Hauteur : <strong>{rack.height_u} U</strong></span>
                      <span>Équipements : <strong>{rackEqs.length}</strong></span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Liste des Équipements */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Layers size={16} /> Liste Complète des Équipements ({equipments.length})
            </h4>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                      <th className="p-3">Type</th>
                      <th className="p-3">Marque & Modèle</th>
                      <th className="p-3">Baie / Emplacement</th>
                      <th className="p-3">Position U</th>
                      <th className="p-3">N° de Série</th>
                      <th className="p-3 text-center">Ports</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {equipments.map(eq => {
                      const rack = racks.find(r => r.id === eq.rack_id);
                      return (
                        <tr key={eq.id} className="hover:bg-slate-50/50">
                          <td className="p-3">
                            <span className="px-2 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-bold text-[11px] whitespace-nowrap">
                              {eq.type}
                            </span>
                          </td>
                          <td className="p-3 text-slate-900 font-bold whitespace-nowrap">
                            {eq.brand} <span className="font-normal text-slate-600">{eq.model}</span>
                          </td>
                          <td className="p-3 text-slate-500 whitespace-nowrap">{rack?.name || '-'}</td>
                          <td className="p-3 font-mono font-bold text-slate-700 whitespace-nowrap">{eq.position}</td>
                          <td className="p-3 font-mono text-slate-500 whitespace-nowrap">{eq.serial_number}</td>
                          <td className="p-3 text-center font-bold text-slate-700">{eq.ports_count || '-'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
