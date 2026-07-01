import { seedRecipes } from '../data/defaults';
import type { BrewLogEntry, BrewRecipe } from '../types';

const RECIPES_KEY = 'pourover.recipes.v1';
const LOG_KEY = 'pourover.brewLog.v1';

const readJson = <T>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const writeJson = <T>(key: string, value: T) => {
  localStorage.setItem(key, JSON.stringify(value));
};

export const loadRecipes = (): BrewRecipe[] => readJson(RECIPES_KEY, seedRecipes);

export const saveRecipes = (recipes: BrewRecipe[]) => writeJson(RECIPES_KEY, recipes.slice(0, 24));

export const loadBrewLog = (): BrewLogEntry[] => readJson(LOG_KEY, []);

export const saveBrewLog = (entries: BrewLogEntry[]) => writeJson(LOG_KEY, entries.slice(0, 50));
