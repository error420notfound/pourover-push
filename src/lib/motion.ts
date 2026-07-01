export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const motion = {
  state: 150,
  popover: 200,
  overlay: 300,
  easing: 'cubic-bezier(0.175, 0.885, 0.32, 1.1)',
};
