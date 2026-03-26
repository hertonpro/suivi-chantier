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
