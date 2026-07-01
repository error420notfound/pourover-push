import type { BrewRecipe, GrindSize } from '../types';

export const defaultRecipe: BrewRecipe = {
  id: 'recipe-v60-02',
  name: 'V60 · 02',
  dripper: 'V60 02',
  coffee: 20,
  water: 320,
  ratio: 16,
  grind: 'Medium-fine',
  bloom: 60,
  pours: 4,
  brewTime: 165,
  flowRate: 2.5,
  temperature: 93,
  agitation: 'Light swirl after each pour',
  equipment: ['V60 02', 'Paper Filter', 'Gooseneck Kettle', 'Scale'],
  notes: 'Aim for even saturation and steady pours.',
};

export const grindOptions: GrindSize[] = [
  'Fine',
  'Medium-fine',
  'Medium',
  'Medium-coarse',
  'Coarse',
];

export const agitationOptions = [
  'No agitation',
  'Light swirl after bloom',
  'Light swirl after each pour',
  'Single gentle stir',
  'Final drawdown swirl',
];

export const seedRecipes: BrewRecipe[] = [
  defaultRecipe,
  {
    ...defaultRecipe,
    id: 'recipe-v60-01',
    name: 'V60 · 01',
    coffee: 15,
    water: 225,
    ratio: 15,
    bloom: 45,
    brewTime: 150,
    grind: 'Medium',
  },
  {
    ...defaultRecipe,
    id: 'recipe-kalita-185',
    name: 'Kalita Wave 185',
    dripper: 'Kalita Wave 185',
    coffee: 22,
    water: 374,
    ratio: 17,
    bloom: 66,
    brewTime: 170,
    grind: 'Medium-coarse',
  },
  {
    ...defaultRecipe,
    id: 'recipe-chemex-6',
    name: 'Chemex 6 Cup',
    dripper: 'Chemex 6 Cup',
    coffee: 30,
    water: 480,
    ratio: 16,
    bloom: 90,
    pours: 5,
    brewTime: 240,
    grind: 'Coarse',
  },
];
