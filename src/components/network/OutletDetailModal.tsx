import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  X, 
  Printer, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  ShieldCheck, 
  Cable, 
  Server, 
  Layers, 
  Clock, 
  Check, 
  AlertOctagon,
  FileText,
  MapPin,
  Save,
  Sliders,
  Edit3
} from 'lucide-react';
import { 
  NetworkOutlet, 
  NetworkConnection, 
  NetworkCable, 
  NetworkZone, 
  NetworkEquipment, 
  NetworkPhysicalCheck, 
  NetworkContinuityTest, 
  NetworkAnomaly, 
  ContinuityResult 
} from '../../types';

interface OutletDetailModalProps {
  outlet: NetworkOutlet;
  zone?: NetworkZone;
  cable?: NetworkCable;
  connection?: NetworkConnection;
  patchPanel?: NetworkEquipment;
  switchEq?: NetworkEquipment;
  physicalCheck?: NetworkPhysicalCheck;
  continuityTest?: NetworkContinuityTest;
  anomalies: NetworkAnomaly[];
  projectName: string;
  projectCode: string;
  clientName: string;
  onSaveCheck: (check: NetworkPhysicalCheck) => void;
  onSaveTest: (test: NetworkContinuityTest) => void;
  onSaveDetails?: (updated: {
    outlet: NetworkOutlet;
    cable?: NetworkCable;
    connection?: NetworkConnection;
    zone?: NetworkZone;
  }) => void;
  onClose: () => void;
}

export const OutletDetailModal: React.FC<OutletDetailModalProps> = ({
  outlet,
  zone,
  cable,
  connection,
  patchPanel,
  switchEq,
  physicalCheck,
  continuityTest,
  anomalies,
  projectName,
  projectCode,
  clientName,
  onSaveCheck,
  onSaveTest,
  onSaveDetails,
  onClose,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'sheet' | 'controls' | 'manual_edit'>('sheet');

  // Physical Check Form State
  const [fixationOk, setFixationOk] = useState(physicalCheck ? physicalCheck.fixation_ok : true);
  const [labelOk, setLabelOk] = useState(physicalCheck ? physicalCheck.label_ok : true);
  const [connectorOk, setConnectorOk] = useState(physicalCheck ? physicalCheck.connector_ok : true);
  const [cableRouteOk, setCableRouteOk] = useState(physicalCheck ? physicalCheck.cable_route_ok : true);
  const [techName, setTechName] = useState(physicalCheck?.tech_name || 'Herton Field Tech');

  // Continuity Test Form State
  const [testerModel, setTesterModel] = useState(continuityTest?.tester_model || 'Fluke MicroScanner PoE');
  const [testResult, setTestResult] = useState<ContinuityResult>(continuityTest?.result || 'OK');
  const [pinoutDetail, setPinoutDetail] = useState(continuityTest?.pinout_detail || 'Brochage standard EIA/TIA 568B - 4 paires conformes');

  // Manual Edit State (Zone, Patch Panel, Switch Actif)
  const [manualBuilding, setManualBuilding] = useState(zone?.building || 'Bâtiment Principal');
  const [manualRoom, setManualRoom] = useState(zone?.room || outlet.zone_name || 'Local');
  const [manualFloor, setManualFloor] = useState(zone?.floor || 'RDC');
  const [manualCableCode, setManualCableCode] = useState(cable?.code || `C-${outlet.code.replace('PR-', '')}`);
  const [manualCableCategory, setManualCableCategory] = useState(cable?.category || 'CAT6A');
  const [manualCableLength, setManualCableLength] = useState(cable?.length_est || 35);
  const [manualPatchPanel, setManualPatchPanel] = useState(connection?.patch_panel_name || (patchPanel ? `${patchPanel.brand} ${patchPanel.model}` : connection?.patch_panel_id || 'Panneau 1'));
  const [manualPatchPort, setManualPatchPort] = useState(connection?.patch_port || 'Port 01');
  const [manualSwitch, setManualSwitch] = useState(connection?.switch_name || (switchEq ? `${switchEq.brand} ${switchEq.model}` : connection?.switch_id || 'Cisco Catalyst'));
  const [manualSwitchPort, setManualSwitchPort] = useState(connection?.switch_port || 'G0/1');
  const [manualVlan, setManualVlan] = useState(connection?.vlan || 'VLAN 10 - DATA');

  const handleSaveControls = (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date().toISOString().replace('T', ' ').slice(0, 16);

    onSaveCheck({
      id: physicalCheck?.id || `chk_${Date.now()}`,
      outlet_id: outlet.id,
      fixation_ok: fixationOk,
      label_ok: labelOk,
      connector_ok: connectorOk,
      cable_route_ok: cableRouteOk,
      checked_at: now,
      tech_name: techName,
    });

    onSaveTest({
      id: continuityTest?.id || `tst_${Date.now()}`,
      outlet_id: outlet.id,
      tester_model: testerModel,
      result: testResult,
      pinout_detail: pinoutDetail,
      tested_at: now,
    });

    setActiveSubTab('sheet');
  };

  const handleSaveManualDetails = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onSaveDetails) return;

    const updatedZone: NetworkZone = {
      id: zone?.id || `zone_${Date.now()}`,
      project_id: outlet.project_id,
      building: manualBuilding.trim(),
      service: manualRoom.trim(),
      room: manualRoom.trim(),
      floor: manualFloor.trim(),
    };

    const updatedOutlet: NetworkOutlet = {
      ...outlet,
      zone_id: updatedZone.id,
      zone_name: `${manualBuilding.trim()} - ${manualRoom.trim()}`,
    };

    const updatedCable: NetworkCable = {
      id: cable?.id || `cab_${Date.now()}`,
      project_id: outlet.project_id,
      outlet_id: outlet.id,
      code: manualCableCode.trim(),
      category: manualCableCategory as any,
      length_est: Number(manualCableLength) || 30,
    };

    const updatedConnection: NetworkConnection = {
      id: connection?.id || `conn_${Date.now()}`,
      project_id: outlet.project_id,
      outlet_id: outlet.id,
      cable_id: updatedCable.id,
      patch_panel_id: connection?.patch_panel_id || `pp_${Date.now()}`,
      patch_panel_name: manualPatchPanel.trim(),
      patch_port: manualPatchPort.trim(),
      switch_id: connection?.switch_id || `sw_${Date.now()}`,
      switch_name: manualSwitch.trim(),
      switch_port: manualSwitchPort.trim(),
      vlan: manualVlan.trim(),
      status: 'CONNECTE',
    };

    onSaveDetails({
      outlet: updatedOutlet,
      cable: updatedCable,
      connection: updatedConnection,
      zone: updatedZone,
    });

    setActiveSubTab('sheet');
  };

  const handlePrint = () => {
    window.print();
  };

  const isPhysicallyValid = physicalCheck ? (physicalCheck.fixation_ok && physicalCheck.label_ok && physicalCheck.connector_ok && physicalCheck.cable_route_ok) : false;
  const isContinuityOk = continuityTest?.result === 'OK';

  const displayedPp = connection?.patch_panel_name || (patchPanel ? `${patchPanel.brand} ${patchPanel.model}` : connection?.patch_panel_id || 'LCS3 Cat6A');
  const displayedSw = connection?.switch_name || (switchEq ? `${switchEq.brand} ${switchEq.model}` : connection?.switch_id || 'Switch Actif');
  const displayedRoom = outlet.zone_name || (zone ? `${zone.building} - ${zone.room}` : 'Local');

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 z-50 overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 30 }}
        className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 w-full sm:max-w-4xl max-h-[96vh] sm:max-h-[92vh] flex flex-col overflow-hidden"
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-6 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 shrink-0 print:hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-md shrink-0">
                <Cable size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg sm:text-xl font-black tracking-tight">{outlet.code}</h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold bg-slate-800 text-indigo-300 border border-slate-700">
                    {outlet.type}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold ${
                    outlet.status === 'VALIDE' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                    outlet.status === 'A_REPRENDRE' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                    'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}>
                    {outlet.status}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[280px] sm:max-w-md">
                  {displayedRoom}
                </p>
              </div>
            </div>
            <button 
              type="button" 
              onClick={onClose}
              className="sm:hidden w-9 h-9 flex items-center justify-center text-slate-400 hover:text-white rounded-xl hover:bg-slate-800"
            >
              <X size={20} />
            </button>
          </div>

          {/* Sub Navigation Bar - Mobile Thumb Friendly */}
          <div className="flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/80">
            <div className="bg-slate-800/90 p-1 rounded-2xl flex items-center text-xs overflow-x-auto max-w-full">
              <button 
                type="button"
                onClick={() => setActiveSubTab('sheet')}
                className={`px-3 py-2 rounded-xl font-bold transition-all text-xs whitespace-nowrap ${
                  activeSubTab === 'sheet' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                Fiche Recette
              </button>
              <button 
                type="button"
                onClick={() => setActiveSubTab('controls')}
                className={`px-3 py-2 rounded-xl font-bold transition-all text-xs whitespace-nowrap flex items-center gap-1.5 ${
                  activeSubTab === 'controls' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sliders size={13} />
                <span>Contrôles Terrain</span>
              </button>
              <button 
                type="button"
                onClick={() => setActiveSubTab('manual_edit')}
                className={`px-3 py-2 rounded-xl font-bold transition-all text-xs whitespace-nowrap flex items-center gap-1.5 ${
                  activeSubTab === 'manual_edit' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Edit3 size={13} />
                <span>Modifier Raccordement</span>
              </button>
            </div>

            <div className="hidden sm:flex items-center gap-1.5">
              <button 
                type="button"
                onClick={handlePrint}
                className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                title="Imprimer la fiche individuelle"
              >
                <Printer size={18} />
              </button>
              <button 
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-6">
          {activeSubTab === 'sheet' ? (
            /* ============================================================ */
            /* FICHE DE RECETTE TECHNIQUE INDIVIDUELLE (FORMAT IMPRIMABLE)  */
            /* ============================================================ */
            <div className="space-y-6 print:m-0 print:p-0">
              {/* Entête Fiche Recette */}
              <div className="border-b-2 border-slate-900 pb-4 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-widest mb-1">
                    <ShieldCheck size={16} /> Herton Network Field Inspector • Contrôle Final
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900">FICHE DE RECETTE DU POINT RÉSEAU</h2>
                  <p className="text-xs text-slate-500">Document technique d'attestation de continuité et de conformité physique</p>
                </div>
                <div className="text-left sm:text-right text-xs space-y-0.5 bg-slate-50 sm:bg-transparent p-3 sm:p-0 rounded-xl">
                  <div className="font-mono font-bold text-slate-800">RÉF : {outlet.code}</div>
                  <div className="text-slate-500">Projet : <span className="font-semibold text-slate-700">{projectName}</span></div>
                  <div className="text-slate-500">Client : <span className="font-semibold text-slate-700">{clientName}</span></div>
                  <div className="text-slate-500">Code : <span className="font-mono text-slate-700">{projectCode}</span></div>
                </div>
              </div>

              {/* Chaîne de Traçabilité Visuelle (Prise -> Câble -> Patch Panel -> Switch) */}
              <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers size={14} /> Chaîne de Traçabilité (Liaison Physique de Bout en Bout)
                  </h4>
                  <button 
                    type="button" 
                    onClick={() => setActiveSubTab('manual_edit')}
                    className="text-indigo-600 hover:text-indigo-800 text-xs font-bold flex items-center gap-1"
                  >
                    <Edit3 size={13} /> Modifier
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-center">
                  {/* Step 1: Prise */}
                  <div className="bg-white p-3.5 rounded-xl border border-indigo-100 shadow-sm flex flex-col items-center justify-between">
                    <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">1. Prise Murale</span>
                    <span className="font-mono font-black text-slate-900 text-sm mt-1">{outlet.code}</span>
                    <span className="text-[11px] text-slate-500 font-medium">{outlet.type}</span>
                    <span className="mt-2 text-[10px] px-2 py-0.5 bg-indigo-50 text-indigo-700 font-bold rounded-full truncate max-w-full">
                      {displayedRoom}
                    </span>
                  </div>

                  {/* Step 2: Câble */}
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">2. Câble Horizontal</span>
                    <span className="font-mono font-black text-slate-900 text-sm mt-1">{cable?.code || `C-${outlet.code.replace('PR-', '')}`}</span>
                    <span className="text-[11px] text-slate-500 font-medium">{cable?.category || 'CAT6A'} ({cable?.length_est || 35}m)</span>
                    <span className="mt-2 text-[10px] px-2 py-0.5 bg-slate-100 text-slate-600 font-bold rounded-full">
                      Cheminement conforme
                    </span>
                  </div>

                  {/* Step 3: Patch Panel */}
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">3. Panneau Brassage</span>
                    <span className="font-mono font-black text-slate-900 text-sm mt-1">
                      {connection?.patch_port || 'Port 01'}
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium truncate max-w-full" title={displayedPp}>
                      {displayedPp}
                    </span>
                    <span className="mt-2 text-[10px] px-2 py-0.5 bg-slate-100 text-slate-600 font-bold rounded-full">
                      {patchPanel ? `Pos. ${patchPanel.position}` : 'Patch Panel'}
                    </span>
                  </div>

                  {/* Step 4: Switch */}
                  <div className="bg-white p-3.5 rounded-xl border border-emerald-100 shadow-sm flex flex-col items-center justify-between">
                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">4. Commutateur (Switch)</span>
                    <span className="font-mono font-black text-slate-900 text-sm mt-1">
                      {connection?.switch_port || 'G0/1'}
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium truncate max-w-full" title={displayedSw}>
                      {displayedSw}
                    </span>
                    <span className="mt-2 text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold rounded-full">
                      {connection?.vlan || 'VLAN 10'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Grille Contrôle Physique & Continuité */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {/* 1. Contrôle Physique */}
                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <CheckCircle2 size={16} className="text-indigo-600" /> Vérifications Physiques Terrain
                    </h4>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      isPhysicallyValid ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {isPhysicallyValid ? 'CONFORME' : 'RÉSERVE'}
                    </span>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50">
                      <span className="text-slate-600">Fixation Plastron & Boîtier mural :</span>
                      <span className={`font-bold flex items-center gap-1 ${physicalCheck?.fixation_ok ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {physicalCheck?.fixation_ok ? <Check size={14} /> : <AlertOctagon size={14} />}
                        {physicalCheck?.fixation_ok ? 'Correcte' : 'Défaut'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50">
                      <span className="text-slate-600">Étiquetage Normalisé (Code lisible) :</span>
                      <span className={`font-bold flex items-center gap-1 ${physicalCheck?.label_ok ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {physicalCheck?.label_ok ? <Check size={14} /> : <AlertOctagon size={14} />}
                        {physicalCheck?.label_ok ? 'Présent & Conforme' : 'Manquant / Illisible'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50">
                      <span className="text-slate-600">Connecteur RJ45 / Noyau Propre :</span>
                      <span className={`font-bold flex items-center gap-1 ${physicalCheck?.connector_ok ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {physicalCheck?.connector_ok ? <Check size={14} /> : <AlertOctagon size={14} />}
                        {physicalCheck?.connector_ok ? 'Propre / Intègre' : 'Endommagé'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50">
                      <span className="text-slate-600">Rayon de Courbure & Protection Câble :</span>
                      <span className={`font-bold flex items-center gap-1 ${physicalCheck?.cable_route_ok ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {physicalCheck?.cable_route_ok ? <Check size={14} /> : <AlertOctagon size={14} />}
                        {physicalCheck?.cable_route_ok ? 'Respecté' : 'Écrasé / Tension excessive'}
                      </span>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-400 border-t border-slate-100 pt-2 flex justify-between">
                    <span>Inspecteur : <strong>{physicalCheck?.tech_name || 'Herton Field Tech'}</strong></span>
                    <span>Date : {physicalCheck?.checked_at || 'En attente'}</span>
                  </div>
                </div>

                {/* 2. Test Continuité & Brochage */}
                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldCheck size={16} className="text-emerald-600" /> Test de Continuité & Brochage
                    </h4>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      isContinuityOk ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {continuityTest ? continuityTest.result : 'NON TESTÉ'}
                    </span>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                      <div className="text-slate-400 text-[10px] uppercase font-bold">Appareil de Test Utilisé</div>
                      <div className="font-semibold text-slate-800 flex items-center gap-2">
                        <Cable size={14} className="text-indigo-600" />
                        {continuityTest?.tester_model || 'Fluke MicroScanner PoE / Klein VDV'}
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                      <div className="text-slate-400 text-[10px] uppercase font-bold">Détail du Câblage (Brochage Wiremap)</div>
                      <div className="font-mono text-slate-700 text-[11px]">
                        {continuityTest?.pinout_detail || 'Brochage 4 paires (EIA/TIA 568B) vérifié avec continuité blindage.'}
                      </div>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-400 border-t border-slate-100 pt-2 flex justify-between">
                    <span>Test effectué le : {continuityTest?.tested_at || 'En attente'}</span>
                    <span className="font-bold text-emerald-600">{continuityTest?.result === 'OK' ? 'Validé' : 'Défaut détecté'}</span>
                  </div>
                </div>
              </div>

              {/* Réserves / Anomalies associées à cette prise */}
              {anomalies.length > 0 && (
                <div className="bg-amber-50 p-4 sm:p-5 rounded-2xl border border-amber-200 space-y-3">
                  <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-2">
                    <AlertTriangle size={16} className="text-amber-600" /> Réserves et Actions Correctives Associées
                  </h4>
                  <div className="space-y-2">
                    {anomalies.map(anom => (
                      <div key={anom.id} className="bg-white p-3.5 rounded-xl border border-amber-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-amber-900">{anom.code}</span>
                            <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">{anom.severity}</span>
                            <span className="text-[10px] text-slate-400 font-medium">{anom.category}</span>
                          </div>
                          <p className="text-slate-700 mt-1 font-medium">{anom.description}</p>
                          {anom.corrective_action && (
                            <p className="text-emerald-700 font-bold mt-1 text-[11px]">
                              ✓ Action : {anom.corrective_action.action_taken} ({anom.corrective_action.tech_name})
                            </p>
                          )}
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold self-start sm:self-center shrink-0 ${
                          anom.status === 'CLOSED' ? 'bg-emerald-100 text-emerald-800' :
                          anom.status === 'IN_PROGRESS' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {anom.status === 'CLOSED' ? 'RÉSOLUE' : anom.status === 'IN_PROGRESS' ? 'EN COURS' : 'OUVERTE'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Visas & Signatures Imprimables */}
              <div className="border-t-2 border-slate-900 pt-6 mt-8 grid grid-cols-2 gap-8 text-xs">
                <div className="border border-slate-300 p-4 rounded-xl space-y-6">
                  <div className="font-bold text-slate-900 uppercase">Visa Technicien Câbleur / Raccordeur</div>
                  <div className="text-[11px] text-slate-500">Nom : {physicalCheck?.tech_name || 'Herton Field Tech'}</div>
                  <div className="h-12 border-b border-dashed border-slate-300 flex items-end text-[10px] text-slate-400 pb-1">
                    Signature :
                  </div>
                </div>
                <div className="border border-slate-300 p-4 rounded-xl space-y-6">
                  <div className="font-bold text-slate-900 uppercase">Visa Responsable Audit / Recette Terrain</div>
                  <div className="text-[11px] text-slate-500">Nom : Contrôleur Herton.pro</div>
                  <div className="h-12 border-b border-dashed border-slate-300 flex items-end text-[10px] text-slate-400 pb-1">
                    Signature & Date :
                  </div>
                </div>
              </div>
            </div>
          ) : activeSubTab === 'controls' ? (
            /* ============================================================ */
            /* SAISIE DES CONTRÔLES TERRAIN (GRAND FORMAT TACTILE SMARTPHONE)*/
            /* ============================================================ */
            <form onSubmit={handleSaveControls} className="space-y-6">
              <div className="bg-indigo-50/70 p-4 rounded-2xl border border-indigo-100">
                <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <ShieldCheck size={16} className="text-indigo-600" /> Saisie Rapide Smartphone
                </h4>
                <p className="text-xs text-indigo-700">
                  Touchez les cartes pour valider le contrôle physique et sélectionnez le résultat de continuité.
                </p>
              </div>

              {/* Cartes Tactiles Contrôle Physique */}
              <div className="space-y-3">
                <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  1. Contrôle Physique & Aspect (4 Points Normatifs)
                </h5>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Toggle 1: Fixation */}
                  <button
                    type="button"
                    onClick={() => setFixationOk(!fixationOk)}
                    className={`p-4 rounded-2xl border-2 text-left transition-all flex items-center justify-between active:scale-[0.98] ${
                      fixationOk ? 'bg-emerald-50/70 border-emerald-500 text-emerald-950' : 'bg-rose-50/60 border-rose-300 text-rose-950'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-sm">Fixation Plastron & Boîtier</div>
                      <div className="text-xs opacity-70 mt-0.5">Solide, sans jeu, vis serrées</div>
                    </div>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-white shadow-sm ${
                      fixationOk ? 'bg-emerald-600' : 'bg-rose-500'
                    }`}>
                      {fixationOk ? <Check size={18} /> : <X size={18} />}
                    </div>
                  </button>

                  {/* Toggle 2: Étiquetage */}
                  <button
                    type="button"
                    onClick={() => setLabelOk(!labelOk)}
                    className={`p-4 rounded-2xl border-2 text-left transition-all flex items-center justify-between active:scale-[0.98] ${
                      labelOk ? 'bg-emerald-50/70 border-emerald-500 text-emerald-950' : 'bg-rose-50/60 border-rose-300 text-rose-950'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-sm">Étiquetage Normalisé</div>
                      <div className="text-xs opacity-70 mt-0.5">Code {outlet.code} clair & net</div>
                    </div>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-white shadow-sm ${
                      labelOk ? 'bg-emerald-600' : 'bg-rose-500'
                    }`}>
                      {labelOk ? <Check size={18} /> : <X size={18} />}
                    </div>
                  </button>

                  {/* Toggle 3: Connecteur */}
                  <button
                    type="button"
                    onClick={() => setConnectorOk(!connectorOk)}
                    className={`p-4 rounded-2xl border-2 text-left transition-all flex items-center justify-between active:scale-[0.98] ${
                      connectorOk ? 'bg-emerald-50/70 border-emerald-500 text-emerald-950' : 'bg-rose-50/60 border-rose-300 text-rose-950'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-sm">Connecteur RJ45 Intègre</div>
                      <div className="text-xs opacity-70 mt-0.5">Broches dorées, propre, sans poussière</div>
                    </div>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-white shadow-sm ${
                      connectorOk ? 'bg-emerald-600' : 'bg-rose-500'
                    }`}>
                      {connectorOk ? <Check size={18} /> : <X size={18} />}
                    </div>
                  </button>

                  {/* Toggle 4: Cheminement */}
                  <button
                    type="button"
                    onClick={() => setCableRouteOk(!cableRouteOk)}
                    className={`p-4 rounded-2xl border-2 text-left transition-all flex items-center justify-between active:scale-[0.98] ${
                      cableRouteOk ? 'bg-emerald-50/70 border-emerald-500 text-emerald-950' : 'bg-rose-50/60 border-rose-300 text-rose-950'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-sm">Cheminement & Courbure</div>
                      <div className="text-xs opacity-70 mt-0.5">Pas d'écrasement, rayon respecté</div>
                    </div>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-white shadow-sm ${
                      cableRouteOk ? 'bg-emerald-600' : 'bg-rose-500'
                    }`}>
                      {cableRouteOk ? <Check size={18} /> : <X size={18} />}
                    </div>
                  </button>
                </div>
              </div>

              {/* Boutons Tactiles Résultat Continuité */}
              <div className="space-y-3 pt-4 border-t border-slate-200">
                <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  2. Résultat du Test de Continuité
                </h5>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {(['OK', 'OPEN', 'SHORT', 'MISWIRE', 'SPLIT PAIR', 'NO LINK'] as ContinuityResult[]).map(res => (
                    <button
                      key={res}
                      type="button"
                      onClick={() => setTestResult(res)}
                      className={`py-3.5 px-3 rounded-2xl font-black text-xs transition-all active:scale-95 border-2 ${
                        testResult === res
                          ? res === 'OK'
                            ? 'bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-200'
                            : 'bg-rose-600 border-rose-600 text-white shadow-md shadow-rose-200'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {res === 'OK' ? '✓ CONTINUITÉ OK' : `⚠ ${res}`}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                      Modèle de Testeur Utilisé
                    </label>
                    <input 
                      type="text" 
                      value={testerModel}
                      onChange={e => setTesterModel(e.target.value)}
                      className="w-full px-3.5 py-3 sm:py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base sm:text-xs font-semibold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                      Nom de l'Inspecteur / Technicien
                    </label>
                    <input 
                      type="text" 
                      value={techName}
                      onChange={e => setTechName(e.target.value)}
                      className="w-full px-3.5 py-3 sm:py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base sm:text-xs font-semibold text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Détail du Schéma / Brochage (Pinout Wiremap)
                  </label>
                  <input 
                    type="text" 
                    value={pinoutDetail}
                    onChange={e => setPinoutDetail(e.target.value)}
                    className="w-full px-3.5 py-3 sm:py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base sm:text-xs text-slate-900"
                  />
                </div>
              </div>

              {/* Action Bar */}
              <div className="pt-4 border-t border-slate-200 flex gap-3">
                <button
                  type="button"
                  onClick={() => setActiveSubTab('sheet')}
                  className="flex-1 py-3.5 bg-slate-100 text-slate-700 rounded-2xl font-bold text-xs hover:bg-slate-200"
                >
                  RETOUR
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3.5 bg-indigo-600 text-white rounded-2xl font-bold text-xs hover:bg-indigo-700 shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
                >
                  <Save size={16} />
                  <span>VALIDER CE CONTRÔLE</span>
                </button>
              </div>
            </form>
          ) : (
            /* ============================================================ */
            /* SAISIE MANUELLE DIRECTE : ZONE/LOCAL, PATCH PANEL, SWITCH    */
            /* ============================================================ */
            <form onSubmit={handleSaveManualDetails} className="space-y-5">
              <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200 text-xs text-amber-900">
                <div className="font-bold flex items-center gap-1.5 mb-1">
                  <Edit3 size={15} /> Modification Manuelle de la Liaison Réseau
                </div>
                Modifiez librement le nom du local, du panneau de brassage ou du switch actif directement depuis votre smartphone.
              </div>

              {/* 1. Zone / Local Manuel */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs uppercase tracking-wider">
                  <MapPin size={16} />
                  <span>Zone / Local (Saisie Manuelle)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Bâtiment / Zone *
                    </label>
                    <input 
                      type="text"
                      value={manualBuilding}
                      onChange={e => setManualBuilding(e.target.value)}
                      placeholder="Ex: Urgences, Pavillon A..."
                      className="w-full px-3.5 py-3 sm:py-2.5 bg-white border border-slate-200 rounded-xl text-base sm:text-xs font-semibold text-slate-900"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Local / Bureau / Salle *
                    </label>
                    <input 
                      type="text"
                      value={manualRoom}
                      onChange={e => setManualRoom(e.target.value)}
                      placeholder="Ex: Salle de Tri, Bureau 104..."
                      className="w-full px-3.5 py-3 sm:py-2.5 bg-white border border-slate-200 rounded-xl text-base sm:text-xs font-semibold text-slate-900"
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
                    value={manualFloor}
                    onChange={e => setManualFloor(e.target.value)}
                    placeholder="Ex: RDC, 1er Étage..."
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-base sm:text-xs text-slate-700"
                  />
                </div>
              </div>

              {/* 2. Câble */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center gap-2 text-slate-700 font-bold text-xs uppercase tracking-wider">
                  <Cable size={16} />
                  <span>Câble Horizontal</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                      Code Câble
                    </label>
                    <input 
                      type="text"
                      value={manualCableCode}
                      onChange={e => setManualCableCode(e.target.value)}
                      className="w-full px-3.5 py-3 sm:py-2.5 bg-white border border-slate-200 rounded-xl text-base sm:text-xs font-mono text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                      Catégorie
                    </label>
                    <select 
                      value={manualCableCategory}
                      onChange={e => setManualCableCategory(e.target.value as any)}
                      className="w-full px-3.5 py-3 sm:py-2.5 bg-white border border-slate-200 rounded-xl text-base sm:text-xs text-slate-900"
                    >
                      <option value="CAT6A">CAT6A STP</option>
                      <option value="CAT6">CAT6 UTP</option>
                      <option value="CAT5E">CAT5e</option>
                      <option value="FIBRE_OM3">Fibre OM3</option>
                      <option value="FIBRE_OM4">Fibre OM4</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                      Longueur (m)
                    </label>
                    <input 
                      type="number"
                      value={manualCableLength}
                      onChange={e => setManualCableLength(Number(e.target.value))}
                      className="w-full px-3.5 py-3 sm:py-2.5 bg-white border border-slate-200 rounded-xl text-base sm:text-xs text-slate-900"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Patch Panel & Switch Manuel */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs uppercase tracking-wider">
                  <Layers size={16} />
                  <span>Panneau de Brassage & Switch Actif (Saisie Manuelle)</span>
                </div>

                {/* Patch Panel */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-indigo-900 uppercase tracking-wider mb-1">
                      Patch Panel (Manuel) *
                    </label>
                    <input 
                      type="text"
                      value={manualPatchPanel}
                      onChange={e => setManualPatchPanel(e.target.value)}
                      placeholder="Ex: Panneau 1 Baie Urgences, PP-01..."
                      className="w-full px-3.5 py-3 sm:py-2.5 bg-white border border-indigo-200 rounded-xl text-base sm:text-xs font-semibold text-slate-900"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-indigo-900 uppercase tracking-wider mb-1">
                      Port Patch *
                    </label>
                    <input 
                      type="text"
                      value={manualPatchPort}
                      onChange={e => setManualPatchPort(e.target.value)}
                      placeholder="Ex: Port 04"
                      className="w-full px-3.5 py-3 sm:py-2.5 bg-white border border-indigo-200 rounded-xl text-base sm:text-xs font-mono font-bold text-indigo-700"
                      required
                    />
                  </div>
                </div>

                {/* Switch */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-200">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-emerald-900 uppercase tracking-wider mb-1">
                      Switch Actif (Manuel) *
                    </label>
                    <input 
                      type="text"
                      value={manualSwitch}
                      onChange={e => setManualSwitch(e.target.value)}
                      placeholder="Ex: Cisco Catalyst 2960X, Switch Urgences..."
                      className="w-full px-3.5 py-3 sm:py-2.5 bg-white border border-emerald-200 rounded-xl text-base sm:text-xs font-semibold text-slate-900"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-emerald-900 uppercase tracking-wider mb-1">
                      Port Switch *
                    </label>
                    <input 
                      type="text"
                      value={manualSwitchPort}
                      onChange={e => setManualSwitchPort(e.target.value)}
                      placeholder="Ex: G0/4"
                      className="w-full px-3.5 py-3 sm:py-2.5 bg-white border border-emerald-200 rounded-xl text-base sm:text-xs font-mono font-bold text-emerald-700"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                    VLAN Affecté
                  </label>
                  <input 
                    type="text"
                    value={manualVlan}
                    onChange={e => setManualVlan(e.target.value)}
                    placeholder="Ex: VLAN 10 - DATA"
                    className="w-full px-3.5 py-3 sm:py-2.5 bg-white border border-slate-200 rounded-xl text-base sm:text-xs text-slate-900"
                  />
                </div>
              </div>

              {/* Action Bar */}
              <div className="pt-4 border-t border-slate-200 flex gap-3">
                <button
                  type="button"
                  onClick={() => setActiveSubTab('sheet')}
                  className="flex-1 py-3.5 bg-slate-100 text-slate-700 rounded-2xl font-bold text-xs hover:bg-slate-200"
                >
                  RETOUR
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3.5 bg-indigo-600 text-white rounded-2xl font-bold text-xs hover:bg-indigo-700 shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
                >
                  <Save size={16} />
                  <span>ENREGISTRER LES MODIFICATIONS</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
};
