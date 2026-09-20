import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Cable, 
  Search, 
  Filter, 
  Plus, 
  ShieldCheck, 
  AlertTriangle, 
  Server, 
  Download, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ArrowRight, 
  FileSpreadsheet, 
  Layers, 
  Check, 
  Printer, 
  ExternalLink,
  ChevronRight,
  Database,
  RefreshCw,
  LayoutGrid,
  List,
  Sliders,
  MapPin
} from 'lucide-react';
import { 
  NetworkInspectorData, 
  NetworkOutlet, 
  NetworkConnection, 
  NetworkCable, 
  NetworkZone, 
  NetworkEquipment, 
  NetworkRack, 
  NetworkAnomaly, 
  NetworkPhysicalCheck, 
  NetworkContinuityTest,
  ContinuityResult 
} from '../../types';
import { OutletDetailModal } from './OutletDetailModal';
import { AddOutletModal } from './AddOutletModal';
import { AddAnomalyModal } from './AddAnomalyModal';
import { RacksInventoryModal } from './RacksInventoryModal';
import { generateDossierTechniqueZip } from '../../utils/networkZipExporter';

interface NetworkInspectorTabProps {
  projectId: string;
  projectName: string;
  data: NetworkInspectorData;
  onUpdateData: (newData: NetworkInspectorData) => void;
}

export const NetworkInspectorTab: React.FC<NetworkInspectorTabProps> = ({
  projectId,
  projectName,
  data,
  onUpdateData,
}) => {
  // Navigation inside inspector
  const [subView, setSubView] = useState<'matrix' | 'anomalies' | 'racks' | 'exports'>('matrix');

  // Mobile layout preference: card view vs table view
  const [layoutMode, setLayoutMode] = useState<'cards' | 'table'>('cards');

  // Search & Filters
  const [search, setSearch] = useState('');
  const [zoneFilter, setZoneFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [testFilter, setTestFilter] = useState('ALL');
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Modals state
  const [selectedOutlet, setSelectedOutlet] = useState<NetworkOutlet | null>(null);
  const [showAddOutlet, setShowAddOutlet] = useState(false);
  const [showAddAnomaly, setShowAddAnomaly] = useState(false);
  const [showRacksInventory, setShowRacksInventory] = useState(false);
  const [isExportingZip, setIsExportingZip] = useState(false);
  const [correctiveAnomalyId, setCorrectiveAnomalyId] = useState<string | null>(null);
  const [correctiveActionText, setCorrectiveActionText] = useState('');
  const [correctiveTech, setCorrectiveTech] = useState('Herton Field Tech');

  // Maps for fast lookups
  const zonesMap = useMemo(() => new Map(data.zones.map(z => [z.id, z])), [data.zones]);
  const cablesMap = useMemo(() => new Map(data.cables.map(c => [c.outlet_id, c])), [data.cables]);
  const connectionsMap = useMemo(() => new Map(data.connections.map(cn => [cn.outlet_id, cn])), [data.connections]);
  const equipmentsMap = useMemo(() => new Map(data.equipments.map(e => [e.id, e])), [data.equipments]);
  const racksMap = useMemo(() => new Map(data.racks.map(r => [r.id, r])), [data.racks]);

  // Executive KPI Calculations
  const stats = useMemo(() => {
    const totalOutlets = data.outlets.length;
    const checkedCount = Object.keys(data.physical_checks).length;
    const testedCount = Object.keys(data.continuity_tests).length;
    const fullyControlledCount = data.outlets.filter(o => data.physical_checks[o.id] && data.continuity_tests[o.id]).length;

    const okContinuityCount = Object.values(data.continuity_tests).filter(t => t.result === 'OK').length;
    const continuityRate = testedCount > 0 ? Math.round((okContinuityCount / testedCount) * 100) : 0;
    const progressRate = totalOutlets > 0 ? Math.round((fullyControlledCount / totalOutlets) * 100) : 0;

    const openAnomaliesCount = data.anomalies.filter(a => a.status !== 'CLOSED').length;
    const closedAnomaliesCount = data.anomalies.filter(a => a.status === 'CLOSED').length;
    const racksConformesCount = data.racks.filter(r => r.status === 'CONFORME').length;

    return {
      totalOutlets,
      checkedCount,
      testedCount,
      fullyControlledCount,
      progressRate,
      okContinuityCount,
      continuityRate,
      openAnomaliesCount,
      closedAnomaliesCount,
      racksConformesCount,
      totalRacks: data.racks.length,
    };
  }, [data]);

  // Filtered outlets (with support for manual inputs)
  const filteredOutlets = useMemo(() => {
    return data.outlets.filter(out => {
      const zone = zonesMap.get(out.zone_id);
      const cable = cablesMap.get(out.id);
      const conn = connectionsMap.get(out.id);
      const test = data.continuity_tests[out.id];
      const sw = conn ? equipmentsMap.get(conn.switch_id) : null;
      const pp = conn ? equipmentsMap.get(conn.patch_panel_id) : null;

      const swDisplay = conn?.switch_name || (sw ? `${sw.brand} ${sw.model}` : conn?.switch_id || '');
      const ppDisplay = conn?.patch_panel_name || (pp ? `${pp.brand} ${pp.model}` : conn?.patch_panel_id || '');
      const roomDisplay = out.zone_name || zone?.room || '';
      const buildingDisplay = zone?.building || '';

      // Text search
      if (search.trim()) {
        const query = search.toLowerCase();
        const matchCode = out.code.toLowerCase().includes(query);
        const matchBuilding = buildingDisplay.toLowerCase().includes(query);
        const matchRoom = roomDisplay.toLowerCase().includes(query);
        const matchCable = cable?.code.toLowerCase().includes(query);
        const matchSwitch = swDisplay.toLowerCase().includes(query);
        const matchPp = ppDisplay.toLowerCase().includes(query);
        const matchPort = conn?.patch_port.toLowerCase().includes(query) || conn?.switch_port.toLowerCase().includes(query);
        if (!matchCode && !matchBuilding && !matchRoom && !matchCable && !matchSwitch && !matchPp && !matchPort) {
          return false;
        }
      }

      // Zone filter
      if (zoneFilter !== 'ALL' && out.zone_id !== zoneFilter) {
        return false;
      }

      // Status filter
      if (statusFilter !== 'ALL' && out.status !== statusFilter) {
        return false;
      }

      // Test filter
      if (testFilter !== 'ALL') {
        if (testFilter === 'TESTED_OK' && test?.result !== 'OK') return false;
        if (testFilter === 'TESTED_FAIL' && (!test || test.result === 'OK')) return false;
        if (testFilter === 'NOT_TESTED' && test) return false;
      }

      return true;
    });
  }, [data, search, zoneFilter, statusFilter, testFilter, zonesMap, cablesMap, connectionsMap, equipmentsMap]);

  // Handler: Add new outlet with manual data
  const handleAddOutlet = (
    newOutlet: NetworkOutlet,
    newCable: NetworkCable,
    newConnection: NetworkConnection,
    newZone?: NetworkZone
  ) => {
    const updatedData: NetworkInspectorData = {
      ...data,
      zones: newZone ? [...data.zones, newZone] : data.zones,
      outlets: [newOutlet, ...data.outlets],
      cables: [newCable, ...data.cables],
      connections: [newConnection, ...data.connections],
    };
    onUpdateData(updatedData);
  };

  // Handler: Update outlet manual details (Zone/Local, Patch Panel, Switch Actif)
  const handleSaveDetails = (updated: {
    outlet: NetworkOutlet;
    cable?: NetworkCable;
    connection?: NetworkConnection;
    zone?: NetworkZone;
  }) => {
    const newOutlets = data.outlets.map(o => o.id === updated.outlet.id ? updated.outlet : o);
    const newCables = updated.cable 
      ? data.cables.map(c => c.outlet_id === updated.outlet.id ? updated.cable! : c)
      : data.cables;
    const newConnections = updated.connection
      ? data.connections.map(cn => cn.outlet_id === updated.outlet.id ? updated.connection! : cn)
      : data.connections;
    const newZones = updated.zone
      ? (data.zones.some(z => z.id === updated.zone!.id)
          ? data.zones.map(z => z.id === updated.zone!.id ? updated.zone! : z)
          : [...data.zones, updated.zone])
      : data.zones;

    const updatedData: NetworkInspectorData = {
      ...data,
      outlets: newOutlets,
      cables: newCables,
      connections: newConnections,
      zones: newZones,
    };
    onUpdateData(updatedData);
    setSelectedOutlet(updated.outlet);
  };

  // Handler: Save physical check for an outlet
  const handleSavePhysicalCheck = (check: NetworkPhysicalCheck) => {
    const newChecks = {
      ...data.physical_checks,
      [check.outlet_id]: check,
    };

    const isPhysOk = check.fixation_ok && check.label_ok && check.connector_ok && check.cable_route_ok;
    const test = data.continuity_tests[check.outlet_id];
    const isTestOk = test?.result === 'OK';

    let newStatus: 'VALIDE' | 'A_REPRENDRE' | 'NON_CONTROLE' = 'NON_CONTROLE';
    if (isPhysOk && isTestOk) {
      newStatus = 'VALIDE';
    } else if (!isPhysOk || (test && !isTestOk)) {
      newStatus = 'A_REPRENDRE';
    }

    const newOutlets = data.outlets.map(o => 
      o.id === check.outlet_id ? { ...o, status: newStatus } : o
    );

    const updatedData: NetworkInspectorData = {
      ...data,
      physical_checks: newChecks,
      outlets: newOutlets,
    };
    onUpdateData(updatedData);
  };

  // Handler: Save continuity test for an outlet
  const handleSaveContinuityTest = (test: NetworkContinuityTest) => {
    const newTests = {
      ...data.continuity_tests,
      [test.outlet_id]: test,
    };

    const isTestOk = test.result === 'OK';
    const check = data.physical_checks[test.outlet_id];
    const isPhysOk = check ? (check.fixation_ok && check.label_ok && check.connector_ok && check.cable_route_ok) : false;

    let newStatus: 'VALIDE' | 'A_REPRENDRE' | 'NON_CONTROLE' = 'NON_CONTROLE';
    if (isPhysOk && isTestOk) {
      newStatus = 'VALIDE';
    } else if (!isTestOk || (check && !isPhysOk)) {
      newStatus = 'A_REPRENDRE';
    }

    const newOutlets = data.outlets.map(o => 
      o.id === test.outlet_id ? { ...o, status: newStatus } : o
    );

    const updatedData: NetworkInspectorData = {
      ...data,
      continuity_tests: newTests,
      outlets: newOutlets,
    };
    onUpdateData(updatedData);
  };

  // Handler: Add new equipment
  const handleAddEquipment = (newEq: NetworkEquipment) => {
    onUpdateData({
      ...data,
      equipments: [...data.equipments, newEq],
    });
  };

  // Handler: Add new rack
  const handleAddRack = (newRack: NetworkRack) => {
    onUpdateData({
      ...data,
      racks: [...data.racks, newRack],
    });
  };

  // Handler: Add new anomaly
  const handleAddAnomaly = (newAnomaly: NetworkAnomaly) => {
    let updatedOutlets = data.outlets;
    if (newAnomaly.outlet_id) {
      updatedOutlets = data.outlets.map(o => 
        o.id === newAnomaly.outlet_id ? { ...o, status: 'A_REPRENDRE' as const } : o
      );
    }

    const updatedData: NetworkInspectorData = {
      ...data,
      outlets: updatedOutlets,
      anomalies: [newAnomaly, ...data.anomalies],
    };
    onUpdateData(updatedData);
  };

  // Handler: Close/Fix anomaly
  const handleResolveAnomaly = (anomalyId: string) => {
    if (!correctiveActionText.trim()) return;

    const now = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const updatedAnomalies = data.anomalies.map(a => {
      if (a.id === anomalyId) {
        return {
          ...a,
          status: 'CLOSED' as const,
          corrective_action: {
            action_taken: correctiveActionText.trim(),
            retested_ok: true,
            fixed_at: now,
            tech_name: correctiveTech.trim() || 'Herton Field Tech',
          },
        };
      }
      return a;
    });

    onUpdateData({
      ...data,
      anomalies: updatedAnomalies,
    });
    setCorrectiveAnomalyId(null);
    setCorrectiveActionText('');
  };

  // Handler: Generate ZIP package
  const handleGenerateZip = async () => {
    try {
      setIsExportingZip(true);
      await generateDossierTechniqueZip(data, projectName);
    } catch (err) {
      console.error('Erreur génération ZIP:', err);
    } finally {
      setIsExportingZip(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* ============================================================ */}
      {/* EXECUTIVE BANNER & ACTIONS (OPTIMISÉ SMARTPHONE & TABLETTE)  */}
      {/* ============================================================ */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-4 sm:p-6 md:p-8 text-white shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/30">
              <ShieldCheck size={16} /> Herton Network Field Inspector • Note de Cadrage
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-white leading-tight">
              Contrôle & Recette Finale des Réseaux
            </h2>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-300">
              <span>Projet : <strong className="text-white">{projectName}</strong></span>
              <span className="hidden sm:inline">•</span>
              <span>Client : <strong className="text-white">{data.client}</strong></span>
              <span className="hidden sm:inline">•</span>
              <span>Réf : <strong className="font-mono text-indigo-300">{data.project_code}</strong></span>
            </div>
          </div>

          {/* Action Buttons - Optimized for Phone Tap Targets */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 sm:gap-3 pt-2 lg:pt-0">
            <button 
              onClick={() => setShowAddOutlet(true)}
              className="py-3 px-3.5 sm:px-4 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-2xl font-bold text-xs transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2"
            >
              <Plus size={16} /> 
              <span>+ Prise (Manuel)</span>
            </button>
            <button 
              onClick={() => setShowAddAnomaly(true)}
              className="py-3 px-3.5 sm:px-4 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white rounded-2xl font-bold text-xs transition-all shadow-lg shadow-amber-600/20 flex items-center justify-center gap-2"
            >
              <AlertTriangle size={16} /> 
              <span>+ Réserve</span>
            </button>
            <button 
              onClick={handleGenerateZip}
              disabled={isExportingZip}
              className="col-span-2 sm:col-span-1 py-3 px-4 sm:px-5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-2xl font-bold text-xs transition-all shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isExportingZip ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Création ZIP...</span>
                </>
              ) : (
                <>
                  <Download size={16} /> 
                  <span>Dossier Technique (ZIP)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="mt-6 pt-4 border-t border-slate-800/80">
          <div className="flex items-center justify-between text-xs font-bold mb-2">
            <span className="text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-indigo-400" /> Avancement du Contrôle
            </span>
            <span className="text-indigo-300 font-mono">{stats.fullyControlledCount} / {stats.totalOutlets} prises ({stats.progressRate}%)</span>
          </div>
          <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700/50">
            <div 
              className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full transition-all duration-500"
              style={{ width: `${stats.progressRate}%` }}
            />
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* EXECUTIVE STATS KPI CARDS (RESPONSIVE GRID)                  */}
      {/* ============================================================ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Total Outlets */}
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Cable size={20} className="sm:w-6 sm:h-6" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono">{stats.totalOutlets}</div>
            <div className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Prises Réseau</div>
            <div className="text-[10px] sm:text-[11px] text-slate-500 truncate">{stats.checkedCount} vérifiées</div>
          </div>
        </div>

        {/* Continuity Rate */}
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <ShieldCheck size={20} className="sm:w-6 sm:h-6" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-emerald-600 font-mono">{stats.continuityRate}%</div>
            <div className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Succès Continuité</div>
            <div className="text-[10px] sm:text-[11px] text-slate-500 truncate">{stats.okContinuityCount} conformes</div>
          </div>
        </div>

        {/* Open Anomalies */}
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <AlertTriangle size={20} className="sm:w-6 sm:h-6" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-amber-600 font-mono">{stats.openAnomaliesCount}</div>
            <div className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Réserves Ouvertes</div>
            <div className="text-[10px] sm:text-[11px] text-slate-500 truncate">{stats.closedAnomaliesCount} levées</div>
          </div>
        </div>

        {/* Racks */}
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
            <Server size={20} className="sm:w-6 sm:h-6" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono">{stats.totalRacks}</div>
            <div className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">Baies & Coffrets</div>
            <div className="text-[10px] sm:text-[11px] text-slate-500 truncate">{stats.racksConformesCount} conformes</div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* NAVIGATION TABS (OPTIMISÉE DÉFILEMENT TACTILE MOBILE)        */}
      {/* ============================================================ */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 no-scrollbar">
        <div className="flex items-center gap-1.5 bg-slate-200/70 p-1 rounded-2xl shrink-0">
          <button
            onClick={() => setSubView('matrix')}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              subView === 'matrix' 
                ? 'bg-white text-indigo-700 shadow-sm font-black' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Cable size={15} />
            <span>Matrice Prises</span>
            <span className="px-1.5 py-0.5 rounded-full bg-slate-100 text-[10px] font-mono font-bold">
              {stats.totalOutlets}
            </span>
          </button>

          <button
            onClick={() => setSubView('anomalies')}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              subView === 'anomalies' 
                ? 'bg-white text-amber-700 shadow-sm font-black' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <AlertTriangle size={15} />
            <span>Réserves</span>
            {stats.openAnomaliesCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-mono font-bold">
                {stats.openAnomaliesCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setSubView('racks')}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              subView === 'racks' 
                ? 'bg-white text-slate-900 shadow-sm font-black' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Server size={15} />
            <span>Baies & Équipements</span>
            <span className="px-1.5 py-0.5 rounded-full bg-slate-100 text-[10px] font-mono font-bold">
              {data.racks.length}
            </span>
          </button>

          <button
            onClick={() => setSubView('exports')}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              subView === 'exports' 
                ? 'bg-white text-emerald-700 shadow-sm font-black' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Download size={15} />
            <span>Dossier Technique</span>
          </button>
        </div>

        {/* View Switcher for Matrix (Cards vs Table) */}
        {subView === 'matrix' && (
          <div className="hidden sm:flex items-center bg-slate-200/70 p-1 rounded-2xl shrink-0">
            <button
              type="button"
              onClick={() => setLayoutMode('cards')}
              className={`p-2 rounded-xl text-xs font-bold transition-all ${
                layoutMode === 'cards' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Affichage en cartes"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              type="button"
              onClick={() => setLayoutMode('table')}
              className={`p-2 rounded-xl text-xs font-bold transition-all ${
                layoutMode === 'table' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Affichage en tableau"
            >
              <List size={16} />
            </button>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* SUB-VIEW 1: MATRICE DES PRISES ET RACCORDEMENT                */}
      {/* ============================================================ */}
      {subView === 'matrix' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text" 
                  placeholder="Rechercher par prise, câble, local, switch, patch..." 
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm sm:text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <button
                type="button"
                onClick={() => setShowMobileFilters(!showMobileFilters)}
                className={`sm:hidden p-2.5 rounded-xl border flex items-center gap-1 text-xs font-bold ${
                  showMobileFilters || zoneFilter !== 'ALL' || statusFilter !== 'ALL' || testFilter !== 'ALL'
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                <Filter size={16} />
                {(zoneFilter !== 'ALL' || statusFilter !== 'ALL' || testFilter !== 'ALL') && (
                  <span className="w-2 h-2 rounded-full bg-indigo-600" />
                )}
              </button>
            </div>

            {/* Expandable / Desktop Filters */}
            <div className={`grid grid-cols-1 sm:grid-cols-3 gap-2 ${showMobileFilters ? 'block' : 'hidden sm:grid'}`}>
              <div className="flex items-center gap-1.5 text-slate-600 text-xs">
                <select 
                  value={zoneFilter} 
                  onChange={e => setZoneFilter(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500/20 font-medium"
                >
                  <option value="ALL">Tous les Bâtiments</option>
                  {data.zones.map(z => (
                    <option key={z.id} value={z.id}>{z.building} - {z.room}</option>
                  ))}
                </select>
              </div>

              <select 
                value={statusFilter} 
                onChange={e => setStatusFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500/20 font-medium"
              >
                <option value="ALL">Tous les Statuts</option>
                <option value="VALIDE">Conforme (Validé)</option>
                <option value="A_REPRENDRE">À Reprendre</option>
                <option value="NON_CONTROLE">Non Contrôlé</option>
              </select>

              <select 
                value={testFilter} 
                onChange={e => setTestFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500/20 font-medium"
              >
                <option value="ALL">Tous les Tests</option>
                <option value="TESTED_OK">Test Continuité OK</option>
                <option value="TESTED_FAIL">Défaut de Continuité</option>
                <option value="NOT_TESTED">Non Testé</option>
              </select>
            </div>
          </div>

          {/* Results count indicator */}
          <div className="flex items-center justify-between text-xs text-slate-600 px-1 font-semibold">
            <span>{filteredOutlets.length} prise(s) affichée(s)</span>
            <div className="flex items-center gap-2">
              <span className="sm:hidden text-slate-500 text-[11px]">Format carte mobile actif</span>
            </div>
          </div>

          {/* ============================================================ */}
          {/* MOBILE CARDS VIEW (VISIBLE ON PHONES & WHEN SELECTED)        */}
          {/* ============================================================ */}
          <div className={`space-y-3 ${layoutMode === 'cards' ? 'block' : 'block sm:hidden'}`}>
            {filteredOutlets.length === 0 ? (
              <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-400">
                <Cable className="mx-auto text-slate-300 mb-2" size={32} />
                Aucune prise réseau ne correspond aux filtres.
              </div>
            ) : (
              filteredOutlets.map(out => {
                const zone = zonesMap.get(out.zone_id);
                const cable = cablesMap.get(out.id);
                const conn = connectionsMap.get(out.id);
                const check = data.physical_checks[out.id];
                const test = data.continuity_tests[out.id];
                const pp = conn ? equipmentsMap.get(conn.patch_panel_id) : null;
                const sw = conn ? equipmentsMap.get(conn.switch_id) : null;
                const relatedAnom = data.anomalies.filter(a => a.outlet_id === out.id && a.status !== 'CLOSED');

                const isPhysOk = check ? (check.fixation_ok && check.label_ok && check.connector_ok && check.cable_route_ok) : false;

                const displayedZone = out.zone_name || (zone ? `${zone.building} - ${zone.room}` : 'Local non spécifié');
                const displayedPp = conn?.patch_panel_name || (pp ? `${pp.brand} ${pp.model}` : conn?.patch_panel_id || 'Non raccordé');
                const displayedSw = conn?.switch_name || (sw ? `${sw.brand} ${sw.model}` : conn?.switch_id || 'Non raccordé');

                return (
                  <div 
                    key={out.id}
                    onClick={() => setSelectedOutlet(out)}
                    className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3 hover:border-indigo-300 transition-all active:scale-[0.99] cursor-pointer"
                  >
                    {/* Header Card: Code Prise, Type, Status */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-slate-900 text-base">{out.code}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold">
                          {out.type}
                        </span>
                        {relatedAnom.length > 0 && (
                          <span className="p-1 rounded-md bg-amber-100 text-amber-800" title="Réserve ouverte">
                            <AlertTriangle size={13} />
                          </span>
                        )}
                      </div>

                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        out.status === 'VALIDE' ? 'bg-emerald-100 text-emerald-800' :
                        out.status === 'A_REPRENDRE' ? 'bg-rose-100 text-rose-800' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {out.status}
                      </span>
                    </div>

                    {/* Location Info (Zone / Local Manuel) */}
                    <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl font-medium">
                      <MapPin size={14} className="text-indigo-600 shrink-0" />
                      <span className="truncate">{displayedZone}</span>
                    </div>

                    {/* Traceability Chain Badge Stack */}
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      {/* Patch Panel */}
                      <div className="p-2 rounded-xl bg-indigo-50/70 border border-indigo-100 space-y-0.5">
                        <div className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Panneau Brassage</div>
                        <div className="font-mono font-bold text-indigo-950 truncate">{conn?.patch_port || 'Port ??'}</div>
                        <div className="text-[10px] text-slate-500 truncate" title={displayedPp}>{displayedPp}</div>
                      </div>

                      {/* Switch Actif */}
                      <div className="p-2 rounded-xl bg-emerald-50/70 border border-emerald-100 space-y-0.5">
                        <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Switch Actif</div>
                        <div className="font-mono font-bold text-emerald-950 truncate">{conn?.switch_port || 'G0/??'}</div>
                        <div className="text-[10px] text-slate-500 truncate" title={displayedSw}>{displayedSw}</div>
                      </div>
                    </div>

                    {/* Status Badges & Quick Action */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                      <div className="flex items-center gap-2">
                        {/* Physique */}
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          check 
                            ? isPhysOk ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                            : 'bg-slate-100 text-slate-400'
                        }`}>
                          {check ? (isPhysOk ? '✓ Phys. OK' : '✗ Phys. Défaut') : 'Phys. Non vérifié'}
                        </span>

                        {/* Continuité */}
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          test 
                            ? test.result === 'OK' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                            : 'bg-slate-100 text-slate-400'
                        }`}>
                          {test ? (test.result === 'OK' ? '✓ Test OK' : `⚠ ${test.result}`) : 'Non testé'}
                        </span>
                      </div>

                      <div className="text-indigo-600 font-bold text-xs flex items-center gap-1">
                        Inspecter <ChevronRight size={14} />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* ============================================================ */}
          {/* DESKTOP TABLE VIEW (ACTIVE ON DESKTOP OR WHEN TABLE TOGGLED) */}
          {/* ============================================================ */}
          <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden ${
            layoutMode === 'table' ? 'hidden sm:block' : 'hidden'
          }`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                    <th className="p-3.5">Prise Murale</th>
                    <th className="p-3.5">Zone / Local</th>
                    <th className="p-3.5">Câble Liaison</th>
                    <th className="p-3.5">Brassage (Patch Panel)</th>
                    <th className="p-3.5">Actif (Switch / Port)</th>
                    <th className="p-3.5 text-center">Contrôle Physique</th>
                    <th className="p-3.5 text-center">Continuité</th>
                    <th className="p-3.5 text-center">Statut</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredOutlets.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-12 text-center text-slate-400">
                        <Cable className="mx-auto text-slate-300 mb-2" size={32} />
                        Aucune prise réseau trouvée.
                      </td>
                    </tr>
                  ) : (
                    filteredOutlets.map(out => {
                      const zone = zonesMap.get(out.zone_id);
                      const cable = cablesMap.get(out.id);
                      const conn = connectionsMap.get(out.id);
                      const check = data.physical_checks[out.id];
                      const test = data.continuity_tests[out.id];
                      const pp = conn ? equipmentsMap.get(conn.patch_panel_id) : null;
                      const sw = conn ? equipmentsMap.get(conn.switch_id) : null;
                      const relatedAnom = data.anomalies.filter(a => a.outlet_id === out.id && a.status !== 'CLOSED');

                      const isPhysOk = check ? (check.fixation_ok && check.label_ok && check.connector_ok && check.cable_route_ok) : false;

                      const displayedZone = out.zone_name || (zone ? `${zone.room}` : '-');
                      const displayedBuilding = zone?.building || '';
                      const displayedPp = conn?.patch_panel_name || (pp ? `${pp.brand} ${pp.model}` : conn?.patch_panel_id || '-');
                      const displayedSw = conn?.switch_name || (sw ? `${sw.brand} ${sw.model}` : conn?.switch_id || '-');

                      return (
                        <tr key={out.id} className="hover:bg-slate-50/70 transition-colors">
                          {/* Code Prise */}
                          <td className="p-3.5">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-slate-900 text-xs">{out.code}</span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">
                                {out.type}
                              </span>
                              {relatedAnom.length > 0 && (
                                <span className="p-1 rounded bg-amber-100 text-amber-700" title="Réserve ouverte">
                                  <AlertTriangle size={12} />
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Zone */}
                          <td className="p-3.5">
                            <div className="font-semibold text-slate-800">{displayedZone}</div>
                            {displayedBuilding && <div className="text-[11px] text-slate-400">{displayedBuilding}</div>}
                          </td>

                          {/* Câble */}
                          <td className="p-3.5">
                            <div className="font-mono text-slate-700 font-bold">{cable?.code || '-'}</div>
                            <div className="text-[11px] text-slate-400">{cable?.category} • {cable?.length_est}m</div>
                          </td>

                          {/* Patch Panel */}
                          <td className="p-3.5">
                            <div className="font-mono text-indigo-700 font-bold">{conn?.patch_port || '-'}</div>
                            <div className="text-[11px] text-slate-400 truncate max-w-[140px]" title={displayedPp}>
                              {displayedPp}
                            </div>
                          </td>

                          {/* Switch */}
                          <td className="p-3.5">
                            <div className="font-mono text-emerald-700 font-bold">{conn?.switch_port || '-'}</div>
                            <div className="text-[11px] text-slate-400 truncate max-w-[140px]" title={displayedSw}>
                              {displayedSw}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">{conn?.vlan}</div>
                          </td>

                          {/* Contrôle Physique */}
                          <td className="p-3.5 text-center">
                            {check ? (
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                isPhysOk ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                              }`}>
                                {isPhysOk ? <Check size={12} /> : <XCircle size={12} />}
                                {isPhysOk ? 'OK' : 'DÉFAUT'}
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-400 italic">Non vérifié</span>
                            )}
                          </td>

                          {/* Continuité */}
                          <td className="p-3.5 text-center">
                            {test ? (
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                test.result === 'OK' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                              }`}>
                                {test.result === 'OK' ? <Check size={12} /> : <AlertTriangle size={12} />}
                                {test.result}
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-400 italic">Non testé</span>
                            )}
                          </td>

                          {/* Statut */}
                          <td className="p-3.5 text-center">
                            <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold ${
                              out.status === 'VALIDE' ? 'bg-emerald-100 text-emerald-800' :
                              out.status === 'A_REPRENDRE' ? 'bg-rose-100 text-rose-800' :
                              'bg-slate-100 text-slate-600'
                            }`}>
                              {out.status}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="p-3.5 text-right">
                            <button 
                              type="button"
                              onClick={() => setSelectedOutlet(out)}
                              className="px-3 py-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl font-bold text-xs transition-colors"
                            >
                              Fiche / Test
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* SUB-VIEW 2: REGISTRE DES ANOMALIES & ACTIONS CORRECTIVES     */}
      {/* ============================================================ */}
      {subView === 'anomalies' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle size={18} className="text-amber-500" />
                Registre des Réserves & Non-Conformités
              </h3>
              <p className="text-xs text-slate-500">Traçabilité complète des réserves identifiées et résolutions</p>
            </div>

            <button 
              onClick={() => setShowAddAnomaly(true)}
              className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2"
            >
              <Plus size={16} /> Signaler une anomalie
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.anomalies.map(anom => {
              const outlet = data.outlets.find(o => o.id === anom.outlet_id);
              const isClosed = anom.status === 'CLOSED';

              return (
                <div 
                  key={anom.id}
                  className={`bg-white p-5 rounded-2xl border shadow-sm space-y-4 transition-all ${
                    isClosed ? 'border-slate-200 opacity-80' : 'border-amber-200 ring-1 ring-amber-400/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-slate-900">{anom.code}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        anom.severity === 'Critique' ? 'bg-rose-100 text-rose-800' :
                        anom.severity === 'Moyenne' ? 'bg-amber-100 text-amber-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {anom.severity}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">{anom.category}</span>
                    </div>

                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      anom.status === 'CLOSED' ? 'bg-emerald-100 text-emerald-800' :
                      anom.status === 'IN_PROGRESS' ? 'bg-amber-100 text-amber-800' :
                      'bg-rose-100 text-rose-800'
                    }`}>
                      {anom.status === 'CLOSED' ? 'Résolue' : anom.status === 'IN_PROGRESS' ? 'En cours' : 'Ouverte'}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="text-xs text-slate-700 font-medium leading-relaxed">
                      {anom.description}
                    </div>
                    {outlet && (
                      <div className="text-xs text-indigo-600 font-semibold flex items-center gap-1 pt-1">
                        <Cable size={13} /> Lié à la prise : <strong className="font-mono">{outlet.code}</strong>
                      </div>
                    )}
                  </div>

                  {anom.corrective_action ? (
                    <div className="bg-emerald-50/80 p-3.5 rounded-xl border border-emerald-200 text-xs space-y-1">
                      <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                        <CheckCircle2 size={14} className="text-emerald-600" /> Action Corrective Réalisée
                      </div>
                      <div className="text-emerald-800">{anom.corrective_action.action_taken}</div>
                      <div className="text-[10px] text-emerald-600 pt-1 flex justify-between">
                        <span>Opérateur : {anom.corrective_action.tech_name}</span>
                        <span>Date : {anom.corrective_action.fixed_at}</span>
                      </div>
                    </div>
                  ) : (
                    <div>
                      {correctiveAnomalyId === anom.id ? (
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                            Action corrective mise en œuvre :
                          </label>
                          <textarea 
                            value={correctiveActionText}
                            onChange={e => setCorrectiveActionText(e.target.value)}
                            placeholder="Décrire la réparation (ex: Câble re-serti selon schéma 568B, retesté OK au Fluke)..."
                            className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                            rows={2}
                          />
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setCorrectiveAnomalyId(null)}
                              className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded-lg text-xs font-bold"
                            >
                              Annuler
                            </button>
                            <button
                              type="button"
                              onClick={() => handleResolveAnomaly(anom.id)}
                              className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 shadow-sm"
                            >
                              Clôturer et Marquer Conforme
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setCorrectiveAnomalyId(anom.id);
                            setCorrectiveActionText('');
                          }}
                          className="w-full py-2.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 rounded-xl text-xs font-bold text-slate-600 transition-colors flex items-center justify-center gap-1.5"
                        >
                          <CheckCircle2 size={14} /> Traiter et lever cette réserve
                        </button>
                      )}
                    </div>
                  )}

                  <div className="text-[10px] text-slate-400 pt-2 border-t border-slate-100 flex justify-between">
                    <span>Créée le : {anom.created_at}</span>
                    <span>Projet : {data.project_code}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* SUB-VIEW 3: BAIES ET ÉQUIPEMENTS (ACTIF & PASSIF)             */}
      {/* ============================================================ */}
      {subView === 'racks' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Server size={18} className="text-indigo-600" />
                Baies de Brassage & Matériel Actif/Passif
              </h3>
              <p className="text-xs text-slate-500">Recensement des répartiteurs, switches et panneaux de brassage</p>
            </div>
            <button
              onClick={() => setShowRacksInventory(true)}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2"
            >
              <Plus size={16} /> Gérer l'inventaire matériel
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.racks.map(rk => {
              const zone = zonesMap.get(rk.zone_id);
              const equipmentsInRack = data.equipments.filter(e => e.rack_id === rk.id);

              return (
                <div key={rk.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-mono font-bold text-xs">
                        {rk.height_u}U
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">{rk.name}</h4>
                        <p className="text-xs text-slate-400">{zone?.building} • {zone?.room}</p>
                      </div>
                    </div>

                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      rk.status === 'CONFORME' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {rk.status}
                    </span>
                  </div>

                  {/* Equipments inside this rack */}
                  <div className="space-y-2">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Équipements Installés ({equipmentsInRack.length})
                    </div>
                    <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden bg-slate-50/50">
                      {equipmentsInRack.map(eq => (
                        <div key={eq.id} className="p-2.5 text-xs flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[11px] font-bold px-1.5 py-0.5 bg-white border border-slate-200 rounded text-slate-600">
                              {eq.position}
                            </span>
                            <div>
                              <span className="font-bold text-slate-800">{eq.brand} {eq.model}</span>
                              <span className="text-slate-400 text-[11px] ml-1.5">({eq.type})</span>
                            </div>
                          </div>
                          <span className="font-mono text-[10px] text-slate-400">S/N: {eq.serial_number}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* SUB-VIEW 4: DOSSIER TECHNIQUE FINAL & EXPORTS                */}
      {/* ============================================================ */}
      {subView === 'exports' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
              <Download size={14} /> Pack Documentaire Final Conforme Note de Cadrage
            </div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">
              Génération du Dossier Technique & Recette
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Téléchargez l'archive complète ZIP contenant le rapport général d'audit, la matrice croisée complète au format CSV (Excel), l'inventaire matériel et les fiches techniques individuelles pour chaque point réseau.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <FileText size={18} />
              </div>
              <h4 className="font-bold text-sm text-slate-900">01_Rapport_General.txt</h4>
              <p className="text-xs text-slate-500">Synthèse d'audit, taux de conformité, mentions normatives Herton.pro</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <FileSpreadsheet size={18} />
              </div>
              <h4 className="font-bold text-sm text-slate-900">02_Matrice_Prises.csv</h4>
              <p className="text-xs text-slate-500">Tableau croisé complet compatible Excel avec chaîne de brassage</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <ShieldCheck size={18} />
              </div>
              <h4 className="font-bold text-sm text-slate-900">05_Fiches_Prises/</h4>
              <p className="text-xs text-slate-500">Dossier contenant une fiche de recette individuelle par prise</p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center gap-4">
            <button
              type="button"
              onClick={handleGenerateZip}
              disabled={isExportingZip}
              className="w-full sm:w-auto px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-2xl transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2.5 disabled:opacity-50"
            >
              {isExportingZip ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Compilation de l'archive ZIP en cours...</span>
                </>
              ) : (
                <>
                  <Download size={18} />
                  <span>TÉLÉCHARGER LE DOSSIER TECHNIQUE (.ZIP)</span>
                </>
              )}
            </button>
            <span className="text-xs text-slate-400">
              Compatible Microsoft Excel, LibreOffice et visionneuses de chantier
            </span>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: OUTLET DETAIL / FICHE RECETTE & ÉDITION MANUELLE       */}
      {/* ============================================================ */}
      {selectedOutlet && (
        <OutletDetailModal 
          outlet={selectedOutlet}
          zone={zonesMap.get(selectedOutlet.zone_id)}
          cable={cablesMap.get(selectedOutlet.id)}
          connection={connectionsMap.get(selectedOutlet.id)}
          patchPanel={connectionsMap.get(selectedOutlet.id) ? equipmentsMap.get(connectionsMap.get(selectedOutlet.id)!.patch_panel_id) : undefined}
          switchEq={connectionsMap.get(selectedOutlet.id) ? equipmentsMap.get(connectionsMap.get(selectedOutlet.id)!.switch_id) : undefined}
          physicalCheck={data.physical_checks[selectedOutlet.id]}
          continuityTest={data.continuity_tests[selectedOutlet.id]}
          anomalies={data.anomalies.filter(a => a.outlet_id === selectedOutlet.id)}
          projectName={projectName}
          projectCode={data.project_code}
          clientName={data.client}
          onSaveCheck={handleSavePhysicalCheck}
          onSaveTest={handleSaveContinuityTest}
          onSaveDetails={handleSaveDetails}
          onClose={() => setSelectedOutlet(null)}
        />
      )}

      {/* ============================================================ */}
      {/* MODAL: ADD OUTLET WITH MANUAL INPUTS                         */}
      {/* ============================================================ */}
      {showAddOutlet && (
        <AddOutletModal 
          zones={data.zones}
          equipments={data.equipments}
          projectId={projectId}
          onAdd={handleAddOutlet}
          onClose={() => setShowAddOutlet(false)}
        />
      )}

      {/* ============================================================ */}
      {/* MODAL: ADD ANOMALY                                           */}
      {/* ============================================================ */}
      {showAddAnomaly && (
        <AddAnomalyModal 
          outlets={data.outlets}
          projectId={projectId}
          onAdd={handleAddAnomaly}
          onClose={() => setShowAddAnomaly(false)}
        />
      )}

      {/* ============================================================ */}
      {/* MODAL: RACKS & EQUIPMENTS INVENTORY                          */}
      {/* ============================================================ */}
      {showRacksInventory && (
        <RacksInventoryModal 
          racks={data.racks}
          equipments={data.equipments}
          zones={data.zones}
          projectId={projectId}
          onAddEquipment={handleAddEquipment}
          onAddRack={handleAddRack}
          onClose={() => setShowRacksInventory(false)}
        />
      )}
    </div>
  );
};
