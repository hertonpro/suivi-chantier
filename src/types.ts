export type Priority = 'Haute' | 'Moyenne' | 'Basse';
export type Status = 'Terminé' | 'En cours' | 'Non commencé';

export interface User {
  id: string;
  username: string;
  email: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  created_at: string;
  owner_id: string;
}

export interface ProjectMember {
  user_id: string;
  project_id: string;
  role: 'owner' | 'editor';
  username: string;
  email: string;
}

export interface Observation {
  id: string;
  text: string;
  type: 'text' | 'todo';
  completed?: boolean;
}

export interface StepDefinition {
  id: string;
  label: string;
}

export interface ProjectConfig {
  name: string;
  description: string;
  steps: StepDefinition[];
}

export interface TaskStepStatus {
  completed: boolean;
  disabled?: boolean;
}

export interface BuildingData {
  id: string;
  name: string;
  service: string;
  level: string;
  priority: Priority;
  tasks: Record<string, TaskStepStatus>;
  observations: Observation[];
}

export interface AppData {
  config: ProjectConfig;
  tasks: BuildingData[];
  transactions: Transaction[];
}

export interface Transaction {
  id: string;
  date: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  description: string;
}

// ==========================================
// Herton Network Field Inspector Data Models
// ==========================================

export interface NetworkZone {
  id: string;
  project_id: string;
  building: string;
  service: string;
  room: string;
  floor: string;
}

export interface NetworkRack {
  id: string;
  project_id: string;
  zone_id: string;
  name: string;
  height_u: number;
  status: 'CONFORME' | 'NON_CONFORME' | 'EN_COURS';
}

export interface NetworkEquipment {
  id: string;
  project_id: string;
  rack_id: string;
  type: 'Switch' | 'Patch Panel' | 'UPS' | 'PDU' | 'Routeur';
  brand: string;
  model: string;
  serial_number: string;
  position: string;
  ports_count?: number;
}

export interface NetworkOutlet {
  id: string;
  project_id: string;
  zone_id: string;
  zone_name?: string; // Saisie manuelle directe du local / pièce (ex: "Urgences - Salle de Tri")
  code: string; // Ex: PR-URG-001
  type: 'RJ45' | 'Double RJ45' | 'Fibre';
  status: 'VALIDE' | 'A_REPRENDRE' | 'NON_CONTROLE';
}

export interface NetworkCable {
  id: string;
  project_id: string;
  outlet_id: string;
  code: string; // Ex: C-URG-001
  category: 'CAT6A' | 'CAT6' | 'CAT5E' | 'FIBRE_OM3' | 'FIBRE_OM4';
  length_est: number; // Mètres
}

export interface NetworkConnection {
  id: string;
  project_id: string;
  outlet_id: string;
  cable_id: string;
  patch_panel_id: string;
  patch_panel_name?: string; // Saisie manuelle du panneau de brassage (ex: "PP-01 Baie Urgences")
  patch_port: string; // Ex: '01' ou 'Port 14'
  switch_id: string;
  switch_name?: string; // Saisie manuelle du switch actif (ex: "Cisco 2960X - Urgences")
  switch_port: string; // Ex: 'G0/1'
  vlan?: string;
  status: 'CONNECTE' | 'NON_CONNECTE' | 'EN_ATTENTE';
}

export interface NetworkPhysicalCheck {
  id: string;
  outlet_id: string;
  fixation_ok: boolean;
  label_ok: boolean;
  connector_ok: boolean;
  cable_route_ok: boolean;
  checked_at: string;
  tech_name: string;
}

export type ContinuityResult = 'OK' | 'OPEN' | 'SHORT' | 'MISWIRE' | 'SPLIT PAIR' | 'NO LINK' | 'NT';

export interface NetworkContinuityTest {
  id: string;
  outlet_id: string;
  tester_model: string;
  result: ContinuityResult;
  pinout_detail?: string;
  tested_at: string;
}

export interface NetworkCorrectiveAction {
  action_taken: string;
  retested_ok: boolean;
  fixed_at: string;
  tech_name: string;
}

export interface NetworkAnomaly {
  id: string;
  project_id: string;
  code: string; // Ex: AN-URG-001
  outlet_id?: string;
  category: 'Câblage' | 'Étiquetage' | 'Connecteur' | 'Fixation' | 'Baie' | 'Autre';
  severity: 'Basse' | 'Moyenne' | 'Critique';
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'CLOSED';
  created_at: string;
  corrective_action?: NetworkCorrectiveAction;
}

export interface NetworkPhoto {
  id: string;
  project_id: string;
  entity_type: 'outlet' | 'rack' | 'anomaly';
  entity_id: string;
  url_or_base64: string;
  caption: string;
  created_at: string;
}

export interface NetworkInspectorData {
  project_id: string;
  project_code: string;
  client: string;
  contract_ref: string;
  zones: NetworkZone[];
  racks: NetworkRack[];
  equipments: NetworkEquipment[];
  outlets: NetworkOutlet[];
  cables: NetworkCable[];
  connections: NetworkConnection[];
  physical_checks: Record<string, NetworkPhysicalCheck>; // keyed by outlet_id
  continuity_tests: Record<string, NetworkContinuityTest>; // keyed by outlet_id
  anomalies: NetworkAnomaly[];
  photos: NetworkPhoto[];
}
