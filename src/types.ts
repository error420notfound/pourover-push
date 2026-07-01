export type GrindSize = 'Fine' | 'Medium-fine' | 'Medium' | 'Medium-coarse' | 'Coarse';

export type BrewStatus = 'idle' | 'brewing' | 'paused' | 'complete';

export type StepStatus = 'Complete' | 'In progress' | 'Upcoming' | 'Pending';

export interface BrewRecipe {
  id: string;
  name: string;
  dripper: string;
  coffee: number;
  water: number;
  ratio: number;
  grind: GrindSize;
  bloom: number;
  pours: number;
  brewTime: number;
  flowRate: number;
  temperature: number;
  agitation: string;
  equipment: string[];
  notes: string;
  bloomEdited?: boolean;
}

export interface BrewStep {
  id: string;
  name: string;
  start: number;
  duration: number;
  pour: number;
  cumulative: number;
  instruction: string;
  target: string;
}

export interface BrewLogEntry {
  id: string;
  recipe: BrewRecipe;
  date: string;
  completed: boolean;
  elapsed: number;
  tastingNotes?: string;
}
