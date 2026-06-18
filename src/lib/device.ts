export const isMobile = () => typeof window !== 'undefined' && window.innerWidth < 768;
export const isTablet = () => typeof window !== 'undefined' && window.innerWidth < 1024;
export const isLowEnd = () => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  const memory = (navigator as any).deviceMemory;
  const cores = navigator.hardwareConcurrency;
  return (memory && memory < 4) || (cores && cores < 4);
};
export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
