export type TemplateQueryParams = {
  goal?: string;
  level?: string;
  splitStyle?: string;
  daysPerWeekMin?: number;
  daysPerWeekMax?: number;
  search?: string;
  featuredOnly?: boolean;
};

export const GOAL_CHIP_FILTERS = [
  'All Goals',
  'Hypertrophy',
  'Strength',
  'Powerbuilding',
  'Full Body',
] as const;

export type GoalChip = (typeof GOAL_CHIP_FILTERS)[number];

const GOAL_CHIP_TO_API: Record<string, TemplateQueryParams> = {
  Hypertrophy: { goal: 'HYPERTROPHY' },
  Strength: { goal: 'STRENGTH' },
  Powerbuilding: { goal: 'POWERBUILDING' },
  'Full Body': { splitStyle: 'FULL_BODY' },
};

export function goalChipToQuery(chip: GoalChip): TemplateQueryParams {
  if (chip === 'All Goals') return {};
  return GOAL_CHIP_TO_API[chip] ?? {};
}

export function experienceToLevel(experience: string): string | undefined {
  if (experience === 'Any') return undefined;
  return experience.toUpperCase();
}

export function durationToQuery(duration: string): TemplateQueryParams {
  switch (duration) {
    case '≤6w':
      return { daysPerWeekMin: undefined, daysPerWeekMax: undefined };
    case '6–8w':
    case '6-8w':
      return {};
    case '8–12w':
    case '8-12w':
      return {};
    case '12w+':
      return {};
    default:
      return {};
  }
}

export function daysPerWeekToQuery(days: string): TemplateQueryParams {
  if (days === 'Any') return {};
  if (days === '6+') return { daysPerWeekMin: 6 };
  const n = parseInt(days, 10);
  if (!Number.isNaN(n)) return { daysPerWeekMin: n, daysPerWeekMax: n };
  return {};
}

export function mergeTemplateQueries(...parts: TemplateQueryParams[]): TemplateQueryParams {
  return Object.assign({}, ...parts);
}
