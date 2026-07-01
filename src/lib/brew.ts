import type { BrewRecipe, BrewStep, StepStatus } from '../types';

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export const formatTime = (seconds: number) => {
  const safeSeconds = Math.max(0, Math.round(seconds));
  const mins = Math.floor(safeSeconds / 60);
  const secs = String(safeSeconds % 60).padStart(2, '0');
  return `${mins}:${secs}`;
};

export const formatApproxTime = (seconds: number) => `~${formatTime(seconds)}`;

export const createId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const updateRecipeCoffee = (recipe: BrewRecipe, coffee: number): BrewRecipe => {
  const nextCoffee = clamp(coffee, 5, 80);
  const nextBloom = recipe.bloomEdited ? recipe.bloom : Math.round(nextCoffee * 3);
  return {
    ...recipe,
    coffee: nextCoffee,
    water: Math.round(nextCoffee * recipe.ratio),
    bloom: nextBloom,
  };
};

export const updateRecipeWater = (recipe: BrewRecipe, water: number): BrewRecipe => {
  const nextWater = clamp(water, 80, 1200);
  const nextCoffee = Number((nextWater / recipe.ratio).toFixed(1));
  const nextBloom = recipe.bloomEdited ? recipe.bloom : Math.round(nextCoffee * 3);
  return {
    ...recipe,
    water: nextWater,
    coffee: nextCoffee,
    bloom: nextBloom,
  };
};

export const updateRecipeRatio = (recipe: BrewRecipe, ratio: number): BrewRecipe => ({
  ...recipe,
  ratio: clamp(Number(ratio.toFixed(1)), 10, 22),
  water: Math.round(recipe.coffee * clamp(ratio, 10, 22)),
});

export const normalizeRecipe = (recipe: BrewRecipe): BrewRecipe => ({
  ...recipe,
  coffee: Number(recipe.coffee.toFixed(1)),
  water: Math.round(recipe.water),
  ratio: Number(recipe.ratio.toFixed(1)),
  bloom: Math.round(clamp(recipe.bloom, 10, recipe.water * 0.45)),
  pours: Math.round(clamp(recipe.pours, 2, 6)),
  brewTime: Math.round(clamp(recipe.brewTime, 90, 420)),
  flowRate: Number(clamp(recipe.flowRate, 1, 8).toFixed(1)),
  temperature: Math.round(clamp(recipe.temperature, 80, 100)),
});

export const buildSchedule = (recipe: BrewRecipe): BrewStep[] => {
  const normalized = normalizeRecipe(recipe);
  const bloom = Math.min(normalized.bloom, normalized.water * 0.45);
  const remainingWater = Math.max(normalized.water - bloom, 0);
  const postBloomPours = Math.max(normalized.pours - 1, 1);
  const bloomDuration = clamp(Math.round(normalized.brewTime * 0.18), 25, 45);
  const remainingTime = Math.max(normalized.brewTime - bloomDuration, postBloomPours * 20);
  const interval = Math.round(remainingTime / postBloomPours);
  const basePour = remainingWater / postBloomPours;

  const steps: BrewStep[] = [
    {
      id: 'bloom',
      name: 'Bloom',
      start: 0,
      duration: bloomDuration,
      pour: Math.round(bloom),
      cumulative: Math.round(bloom),
      instruction: 'Pour in a slow spiral to saturate all the grounds. Keep the water level just below the rim of the filter.',
      target: `${Math.round(bloom)} g`,
    },
  ];

  let cumulative = bloom;
  for (let index = 1; index < normalized.pours; index += 1) {
    const isFinal = index === normalized.pours - 1;
    const pour = isFinal ? normalized.water - cumulative : basePour;
    cumulative += pour;
    steps.push({
      id: `pour-${index + 1}`,
      name: isFinal ? 'Final Pour' : `Pour ${index + 1}`,
      start: bloomDuration + (index - 1) * interval,
      duration: isFinal ? Math.max(normalized.brewTime - (bloomDuration + (index - 1) * interval), 20) : interval,
      pour: Math.round(pour),
      cumulative: Math.round(cumulative),
      instruction: isFinal
        ? `Pour to ${Math.round(cumulative)} g total, then let the bed drain evenly.`
        : `Pour to ${Math.round(cumulative)} g total with a steady center-to-edge spiral.`,
      target: `${Math.round(cumulative)} g total`,
    });
  }

  steps.push({
    id: 'done',
    name: 'Done',
    start: normalized.brewTime,
    duration: 0,
    pour: 0,
    cumulative: normalized.water,
    instruction: 'Remove the dripper when the drawdown finishes. Save the recipe if the cup tasted balanced.',
    target: `${normalized.water} g`,
  });

  return steps;
};

export const getActiveStepIndex = (steps: BrewStep[], elapsed: number) => {
  let activeIndex = 0;
  for (let index = 0; index < steps.length; index += 1) {
    if (elapsed >= steps[index].start) activeIndex = index;
  }
  return activeIndex;
};

export const getStepStatus = (step: BrewStep, activeIndex: number, index: number, elapsed: number): StepStatus => {
  if (step.id === 'done') return elapsed >= step.start ? 'Complete' : 'Pending';
  if (index < activeIndex) return 'Complete';
  if (index === activeIndex) return 'In progress';
  return 'Upcoming';
};
