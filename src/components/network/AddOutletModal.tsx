import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Plus, Cable, MapPin, Layers, Server, Hash, Building2, Tag } from 'lucide-react';
import { NetworkZone, NetworkEquipment, NetworkOutlet, NetworkCable, NetworkConnection } from '../../types';

interface AddOutletModalProps {
  zones: NetworkZone[];
  equipments: NetworkEquipment[];
  projectId: string;
  onAdd: (
    outlet: NetworkOutlet,
    cable: NetworkCable,
    connection: NetworkConnection,
    newZone?: NetworkZone
  ) => void;
  onClose: () => void;
}

export const AddOutletModal: React.FC<AddOutletModalProps> = ({
  zones,
  equipments,
  projectId,
  onAdd,
  onClose,
}) => {
  // Existing equipment & zones for autocomplete suggestions (datalists)
  const existingBuildings = Array.from(new Set(zones.map(z => z.building).filter(Boolean)));
  const existingRooms = Array.from(new Set(zones.map(z => z.room).filter(Boolean)));
  const existingPatchPanels = equipments
    .filter(e => e.type === 'Patch Panel')
    .map(e => `${e.brand} ${e.model} (${e.position})`);
  const existingSwitches = equipments
    .filter(e => e.type === 'Switch')
    .map(e => `${e.brand} ${e.model}`);

  // 1. Outlet & Zone/Local State (Saisie Manuelle)
  const [code, setCode] = useState('PR-URG-004');
  const [type, setType] = useState<'RJ45' | 'Double RJ45' | 'Fibre'>('RJ45');
  const [building, setBuilding] = useState(existingBuildings[0] || 'Bâtiment Urgences');
  const [room, setRoom] = useState('Salle de Soins 2');
  const [floor, setFloor] = useState('RDC');

  // 2. Cable info
  const [cableCode, setCableCode] = useState('C-URG-004');
  const [category, setCategory] = useState<'CAT6A' | 'CAT6' | 'CAT5E' | 'FIBRE_OM3' | 'FIBRE_OM4'>('CAT6A');
  const [lengthEst, setLengthEst] = useState<number>(35);

  // 3. Brassage & Actif (Saisie Manuelle)
  const [patchPanelName, setPatchPanelName] = useState(existingPatchPanels[0] || 'Panneau 1 (Baie Urgences)');
  const [patchPort, setPatchPort] = useState('Port 04');
  const [switchName, setSwitchName] = useState(existingSwitches[0] || 'Cisco Catalyst 2960X');
  const [switchPort, setSwitchPort] = useState('G0/4');
  const [vlan, setVlan] = useState('VLAN 10 - DATA');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const outletId = `out_${Date.now()}`;
    const cableId = `cab_${Date.now()}`;
    const connId = `conn_${Date.now()}`;

    // Find if a zone with this building and room already exists, or create new
    let targetZone = zones.find(
      z => z.building.toLowerCase() === building.trim().toLowerCase() && 
           z.room.toLowerCase() === room.trim().toLowerCase()
    );

    let createdZone: NetworkZone | undefined;
    if (!targetZone) {
      createdZone = {
        id: `zone_${Date.now()}`,
        project_id: projectId,
        building: building.trim() || 'Bâtiment Principal',
        service: room.trim() || 'Service',
        room: room.trim() || 'Local',
        floor: floor.trim() || 'RDC',
      };
      targetZone = createdZone;
    }

    const newOutlet: NetworkOutlet = {
      id: outletId,
      project_id: projectId,
      zone_id: targetZone.id,
      zone_name: `${building.trim()} - ${room.trim()}`,
      code: code.trim(),
      type,
      status: 'NON_CONTROLE',
    };

    const newCable: NetworkCable = {
      id: cableId,
      project_id: projectId,
      outlet_id: outletId,
      code: cableCode.trim() || `C-${code.trim()}`,
      category,
      length_est: Number(lengthEst) || 30,
    };

    // Link to known equipment ID if matching, otherwise store manual name
    const matchedPp = equipments.find(e => e.type === 'Patch Panel' && `${e.brand} ${e.model} (${e.position})` === patchPanelName);
    const matchedSw = equipments.find(e => e.type === 'Switch' && `${e.brand} ${e.model}` === switchName);

    const newConnection: NetworkConnection = {
      id: connId,
      project_id: projectId,
      outlet_id: outletId,
      cable_id: cableId,
      patch_panel_id: matchedPp ? matchedPp.id : `pp_manual_${Date.now()}`,
      patch_panel_name: patchPanelName.trim(),
      patch_port: patchPort.trim(),
      switch_id: matchedSw ? matchedSw.id : `sw_manual_${Date.now()}`,
      switch_name: switchName.trim(),
      switch_port: switchPort.trim(),
      vlan: vlan.trim(),
      status: 'CONNECTE',
    };

    onAdd(newOutlet, newCable, newConnection, createdZone);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 z-50 overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 w-full sm:max-w-xl max-h-[94vh] sm:max-h-[90vh] flex flex-col overflow-hidden"
      >
        {/* Sticky Modal Header */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shrink-0 shadow-md">
              <Plus size={22} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black tracking-tight">Nouveau Point Réseau</h3>
              <p className="text-xs text-slate-400">Saisie manuelle directe terrain</p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Autocomplete Datalists for quick mobile typing */}
          <datalist id="buildings-list">
            {existingBuildings.map((b, i) => <option key={i} value={b} />)}
          </datalist>
          <datalist id="rooms-list">
            {existingRooms.map((r, i) => <option key={i} value={r} />)}
          </datalist>
          <datalist id="patch-panels-list">
            {existingPatchPanels.map((pp, i) => <option key={i} value={pp} />)}
            <option value="Panneau 1 Baie Principale" />
            <option value="Panneau 2 Baie Secondaire" />
            <option value="Legrand LCS3 24P" />
          </datalist>
          <datalist id="switches-list">
            {existingSwitches.map((sw, i) => <option key={i} value={sw} />)}
            <option value="Cisco Catalyst 2960X" />
            <option value="Cisco Catalyst 3850" />
            <option value="Ubiquiti UniFi Pro 48" />
            <option value="Switch Urgences" />
          </datalist>

          {/* Section 1: Prise & Localisation Manuelle */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs uppercase tracking-wider">
              <MapPin size={16} />
              <span>1. Prise Réseau & Zone / Local (Saisie Manuelle)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Code Prise *
                </label>
                <input 
                  type="text" 
                  value={code} 
                  onChange={e => {
                    setCode(e.target.value);
                    setCableCode(`C-${e.target.value.replace('PR-', '')}`);
                  }}
                  className="w-full px-3.5 py-3 sm:py-2.5 bg-white border border-slate-200 rounded-xl text-base sm:text-xs font-mono font-bold focus:ring-2 focus:ring-indigo-500/20 text-slate-900"
                  placeholder="Ex: PR-URG-004"
                  required 
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Type de Prise
                </label>
                <select 
                  value={type} 
                  onChange={e => setType(e.target.value as any)}
                  className="w-full px-3.5 py-3 sm:py-2.5 bg-white border border-slate-200 rounded-xl text-base sm:text-xs font-medium focus:ring-2 focus:ring-indigo-500/20 text-slate-900"
                >
                  <option value="RJ45">RJ45 Simple</option>
                  <option value="Double RJ45">Double RJ45</option>
                  <option value="Fibre">Fibre Optique</option>
                </select>
              </div>
            </div>

            {/* Saisie Manuelle Zone / Local */}
            <div className="space-y-3 pt-2 border-t border-slate-200/60">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-indigo-900 uppercase tracking-wider mb-1">
                    Bâtiment / Zone (Manuel) *
                  </label>
                  <input 
                    type="text"
                    list="buildings-list"
                    value={building}
                    onChange={e => setBuilding(e.target.value)}
                    placeholder="Ex: Urgences, Maternité, Pavillon B..."
                    className="w-full px-3.5 py-3 sm:py-2.5 bg-white border border-indigo-200 rounded-xl text-base sm:text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500/20"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-indigo-900 uppercase tracking-wider mb-1">
                    Local / Bureau / Salle (Manuel) *
                  </label>
                  <input 
                    type="text"
                    list="rooms-list"
                    value={room}
                    onChange={e => setRoom(e.target.value)}
                    placeholder="Ex: Salle d'examen 2, Bureau Médecin..."
                    className="w-full px-3.5 py-3 sm:py-2.5 bg-white border border-indigo-200 rounded-xl text-base sm:text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500/20"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Étage / Niveau
                </label>
                <input 
                  type="text"
                  value={floor}
                  onChange={e => setFloor(e.target.value)}
                  placeholder="Ex: RDC, 1er Étage, Sous-sol..."
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-base sm:text-xs text-slate-700"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Câble Horizontal */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center gap-2 text-slate-700 font-bold text-xs uppercase tracking-wider">
              <Cable size={16} />
              <span>2. Câble Horizontal de Liaison</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Code Câble
                </label>
                <input 
                  type="text" 
                  value={cableCode} 
                  onChange={e => setCableCode(e.target.value)}
                  className="w-full px-3.5 py-3 sm:py-2.5 bg-white border border-slate-200 rounded-xl text-base sm:text-xs font-mono text-slate-900" 
                  placeholder="Ex: C-URG-004"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Catégorie Câble
                </label>
                <select 
                  value={category} 
                  onChange={e => setCategory(e.target.value as any)}
                  className="w-full px-3.5 py-3 sm:py-2.5 bg-white border border-slate-200 rounded-xl text-base sm:text-xs text-slate-900"
                >
                  <option value="CAT6A">CAT6A STP (Recommandé)</option>
                  <option value="CAT6">CAT6 UTP</option>
                  <option value="CAT5E">CAT5e</option>
                  <option value="FIBRE_OM3">Fibre Optique OM3</option>
                  <option value="FIBRE_OM4">Fibre Optique OM4</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Longueur (mètres)
                </label>
                <input 
                  type="number" 
                  value={lengthEst} 
                  onChange={e => setLengthEst(Number(e.target.value))}
                  className="w-full px-3.5 py-3 sm:py-2.5 bg-white border border-slate-200 rounded-xl text-base sm:text-xs text-slate-900" 
                  min={1}
                  max={120}
                />
              </div>
            </div>
          </div>

          {/* Section 3: Brassage & Actif (Saisie Manuelle) */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs uppercase tracking-wider">
              <Layers size={16} />
              <span>3. Brassage & Switch Actif (Saisie Manuelle)</span>
            </div>

            {/* Patch Panel Manuel */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-indigo-900 uppercase tracking-wider mb-1">
                  Patch Panel (Saisie Manuelle) *
                </label>
                <input 
                  type="text"
                  list="patch-panels-list"
                  value={patchPanelName}
                  onChange={e => setPatchPanelName(e.target.value)}
                  placeholder="Ex: Panneau 1 Baie Urgences, PP-URG-01..."
                  className="w-full px-3.5 py-3 sm:py-2.5 bg-white border border-indigo-200 rounded-xl text-base sm:text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500/20"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-indigo-900 uppercase tracking-wider mb-1">
                  Port Patch *
                </label>
                <input 
                  type="text" 
                  value={patchPort} 
                  onChange={e => setPatchPort(e.target.value)}
                  className="w-full px-3.5 py-3 sm:py-2.5 bg-white border border-indigo-200 rounded-xl text-base sm:text-xs font-mono font-bold text-indigo-700" 
                  placeholder="Ex: Port 04, 04"
                  required
                />
              </div>
            </div>

            {/* Switch Actif Manuel */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-200/60">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-emerald-900 uppercase tracking-wider mb-1">
                  Switch Actif (Saisie Manuelle) *
                </label>
                <input 
                  type="text"
                  list="switches-list"
                  value={switchName}
                  onChange={e => setSwitchName(e.target.value)}
                  placeholder="Ex: Cisco Catalyst 2960X, Switch Urgences..."
                  className="w-full px-3.5 py-3 sm:py-2.5 bg-white border border-emerald-200 rounded-xl text-base sm:text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500/20"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-emerald-900 uppercase tracking-wider mb-1">
                  Port Switch *
                </label>
                <input 
                  type="text" 
                  value={switchPort} 
                  onChange={e => setSwitchPort(e.target.value)}
                  className="w-full px-3.5 py-3 sm:py-2.5 bg-white border border-emerald-200 rounded-xl text-base sm:text-xs font-mono font-bold text-emerald-700" 
                  placeholder="Ex: G0/4, Gi1/0/4"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                VLAN Affecté (Optionnel)
              </label>
              <input 
                type="text" 
                value={vlan} 
                onChange={e => setVlan(e.target.value)}
                className="w-full px-3.5 py-3 sm:py-2.5 bg-white border border-slate-200 rounded-xl text-base sm:text-xs text-slate-900" 
                placeholder="Ex: VLAN 10 - DATA, VLAN 20 - VOIP..."
              />
            </div>
          </div>
        </form>

        {/* Sticky Mobile-Optimized Footer */}
        <div className="p-4 bg-white border-t border-slate-200 flex gap-3 shrink-0 shadow-lg">
          <button 
            type="button" 
            onClick={onClose}
            className="flex-1 py-3.5 sm:py-3 bg-slate-100 text-slate-700 rounded-2xl font-bold text-sm sm:text-xs hover:bg-slate-200 active:scale-95 transition-all"
          >
            ANNULER
          </button>
          <button 
            type="button"
            onClick={handleSubmit}
            className="flex-1 py-3.5 sm:py-3 bg-indigo-600 text-white rounded-2xl font-bold text-sm sm:text-xs hover:bg-indigo-700 active:scale-95 transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2"
          >
            <Plus size={18} />
            <span>ENREGISTRER LA PRISE</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
