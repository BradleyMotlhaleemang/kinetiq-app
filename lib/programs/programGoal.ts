const STRENGTH_GOALS = new Set(['STRENGTH', 'POWERLIFTING', 'POWERBUILDING']);

export function isHypertrophyGoal(goal?: string | null): boolean {
  return (goal ?? '').toUpperCase() === 'HYPERTROPHY';
}

export function allowsLowRepPrescription(goal?: string | null): boolean {
  return STRENGTH_GOALS.has((goal ?? '').toUpperCase());
}

export const HYPERTROPHY_MIN_REPS_MESSAGE =
  'Hypertrophy programs should use at least 5 reps per set. Lower rep ranges are reserved for strength-focused programs.';

export function validateHypertrophyRepMin(
  goal: string | null | undefined,
  repRangeMin: number,
): string | null {
  if (!isHypertrophyGoal(goal) || repRangeMin >= 5) return null;
  return HYPERTROPHY_MIN_REPS_MESSAGE;
}

export const HYPERTROPHY_REP_MIN = 5;
export const HYPERTROPHY_REP_MAX = 30;
export const STRENGTH_REP_MIN = 1;
export const STRENGTH_REP_MAX = 30;

export type RepRangeViolation = 'low' | 'high';

export function getRepRangeViolation(
  goal: string | null | undefined,
  reps: number,
): RepRangeViolation | null {
  if (allowsLowRepPrescription(goal)) {
    if (reps < STRENGTH_REP_MIN || reps > STRENGTH_REP_MAX) {
      return reps < STRENGTH_REP_MIN ? 'low' : 'high';
    }
    return null;
  }

  if (!isHypertrophyGoal(goal)) return null;

  if (reps < HYPERTROPHY_REP_MIN) return 'low';
  if (reps > HYPERTROPHY_REP_MAX) return 'high';
  return null;
}
