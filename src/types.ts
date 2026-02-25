export type Priority = 'Haute' | 'Moyenne' | 'Basse';
export type Status = 'Terminé' | 'En cours' | 'Non commencé';

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
  subtitle: string;
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
}
