export const MUSCLE_COLORS: Record<string, string> = {
  CHEST: '#ff6b6b',
  BACK: '#b1c5ff',
  LATS: '#b1c5ff',
  FRONT_DELT: '#59d8de',
  SIDE_DELT: '#59d8de',
  REAR_DELT: '#59d8de',
  QUADS: '#6cd68f',
  GLUTES: '#ff7ac8',
  HAMSTRINGS: '#f5d76e',
  BICEPS: '#b1c5ff',
  TRICEPS: '#59d8de',
  CALVES: '#59d8de',
  LOWER_BACK: '#f5d76e',
  ABS: '#6cd68f',
};

export function muscleColor(muscle: string | null | undefined, fallback = '#8e909c'): string {
  if (!muscle) return fallback;
  if (MUSCLE_COLORS[muscle]) return MUSCLE_COLORS[muscle];
  if (muscle.includes('CHEST')) return MUSCLE_COLORS.CHEST;
  if (muscle.includes('BACK') || muscle.includes('LAT')) return MUSCLE_COLORS.BACK;
  if (muscle.includes('DELT') || muscle.includes('SHOULDER')) return MUSCLE_COLORS.FRONT_DELT;
  if (muscle.includes('QUAD')) return MUSCLE_COLORS.QUADS;
  if (muscle.includes('GLUTE')) return MUSCLE_COLORS.GLUTES;
  if (muscle.includes('HAMSTRING')) return MUSCLE_COLORS.HAMSTRINGS;
  if (muscle.includes('BICEP')) return MUSCLE_COLORS.BICEPS;
  if (muscle.includes('TRICEP')) return MUSCLE_COLORS.TRICEPS;
  return '#59d8de';
}
