export type SplitType =
  | 'FULL_BODY'
  | 'PPL'
  | 'UPPER_LOWER'
  | 'BODY_PART_SPLIT'
  | 'POWERBUILDING'
  | 'CUSTOM';

export type MuscleFocus = 'CHEST' | 'BACK' | 'SHOULDERS' | 'QUADS' | 'GLUTES' | 'BALANCED';

export interface TemplateDay {
  label: string;
  exercises: string[];
}

export interface TemplateDefinition {
  id: string;
  programName: string;
  tags: string[];
  splitType: SplitType;
  durationWeeks: number;
  weeklyStructure: TemplateDay[];
  deloadWeek: number;
  muscleFocus: MuscleFocus;
  highIntensity: boolean;
  overview: string;
}

export const MUSCLE_FOCUS_COLOR: Record<MuscleFocus, string> = {
  CHEST: '#ff6b6b',
  BACK: '#6aa9ff',
  SHOULDERS: '#b084ff',
  QUADS: '#6cd68f',
  GLUTES: '#ff7ac8',
  BALANCED: '#59d8de',
};

export const SPLIT_LABELS: Record<SplitType, string> = {
  FULL_BODY: 'Full Body',
  PPL: 'Push Pull Legs',
  UPPER_LOWER: 'Upper Lower',
  BODY_PART_SPLIT: 'Bodybuilding / Hypertrophy',
  POWERBUILDING: 'Powerbuilding',
  CUSTOM: 'Custom Split',
};

export const TEMPLATE_CATALOG: TemplateDefinition[] = [
  {
    id: 'tpl-chest-focused',
    programName: 'Chest Focus',
    tags: ['Physique', 'Chest Priority'],
    splitType: 'UPPER_LOWER',
    durationWeeks: 8,
    weeklyStructure: [
      { label: 'Day 1 - Upper (Chest Bias)', exercises: ['Flat Bench Press', 'Incline DB Press', 'Cable Fly'] },
      { label: 'Day 2 - Lower', exercises: ['Back Squat', 'Romanian Deadlift', 'Leg Press'] },
      { label: 'Day 3 - Upper (Push + Arms)', exercises: ['Incline Press', 'Dips', 'Triceps Pushdown'] },
      { label: 'Day 4 - Lower + Core', exercises: ['Hack Squat', 'Split Squat', 'Hanging Leg Raise'] },
    ],
    deloadWeek: 8,
    muscleFocus: 'CHEST',
    highIntensity: false,
    overview: 'Upper/lower with repeated chest exposures for hypertrophy specialization.',
  },
  {
    id: 'tpl-back-focused',
    programName: 'Back Focus',
    tags: ['Physique', 'Back Density'],
    splitType: 'PPL',
    durationWeeks: 8,
    weeklyStructure: [
      { label: 'Day 1 - Pull (Heavy)', exercises: ['Barbell Row', 'Weighted Pull Up', 'Chest Supported Row'] },
      { label: 'Day 2 - Push', exercises: ['Bench Press', 'Overhead Press', 'Dips'] },
      { label: 'Day 3 - Legs', exercises: ['Back Squat', 'RDL', 'Leg Curl'] },
      { label: 'Day 4 - Pull (Volume)', exercises: ['Lat Pulldown', 'Seated Row', 'Face Pull'] },
      { label: 'Day 5 - Push', exercises: ['Incline DB Press', 'Lateral Raise', 'Triceps Extension'] },
    ],
    deloadWeek: 8,
    muscleFocus: 'BACK',
    highIntensity: true,
    overview: 'Dual pull sessions per week to increase width and density development.',
  },
  {
    id: 'tpl-shoulder-focused',
    programName: 'Shoulder Focus',
    tags: ['Physique', 'Shoulder Cap'],
    splitType: 'BODY_PART_SPLIT',
    durationWeeks: 6,
    weeklyStructure: [
      { label: 'Day 1 - Delts + Triceps', exercises: ['Overhead Press', 'Lateral Raise', 'Rear Delt Fly'] },
      { label: 'Day 2 - Back', exercises: ['Row Variation', 'Pulldown', 'Face Pull'] },
      { label: 'Day 3 - Legs', exercises: ['Squat', 'Leg Press', 'Leg Curl'] },
      { label: 'Day 4 - Chest + Arms', exercises: ['Bench Press', 'Fly', 'Curl'] },
      { label: 'Day 5 - Delts Pump', exercises: ['Machine Press', 'Cable Lateral Raise', 'Rear Delt Row'] },
    ],
    deloadWeek: 6,
    muscleFocus: 'SHOULDERS',
    highIntensity: true,
    overview: 'High-frequency delt work for width and roundness while managing total push fatigue.',
  },
  {
    id: 'tpl-quadzilla',
    programName: 'Quadzilla',
    tags: ['Physique', 'Quad Priority'],
    splitType: 'POWERBUILDING',
    durationWeeks: 8,
    weeklyStructure: [
      { label: 'Day 1 - Lower Strength', exercises: ['High Bar Squat', 'Leg Press', 'Leg Extension'] },
      { label: 'Day 2 - Upper Strength', exercises: ['Bench Press', 'Weighted Row', 'OHP'] },
      { label: 'Day 3 - Lower Volume', exercises: ['Front Squat', 'Hack Squat', 'Walking Lunge'] },
      { label: 'Day 4 - Upper Volume', exercises: ['Incline DB Press', 'Lat Pulldown', 'Lateral Raise'] },
      { label: 'Day 5 - Lower Pump', exercises: ['Leg Press', 'Sissy Squat', 'Leg Extension'] },
    ],
    deloadWeek: 8,
    muscleFocus: 'QUADS',
    highIntensity: true,
    overview: 'Quad-dominant lower sessions with a strength + volume split across the week.',
  },
  {
    id: 'tpl-glute-bbl',
    programName: 'Glute / BBL',
    tags: ['Physique', 'Glute Priority'],
    splitType: 'UPPER_LOWER',
    durationWeeks: 8,
    weeklyStructure: [
      { label: 'Day 1 - Lower (Glute Strength)', exercises: ['Hip Thrust', 'RDL', 'Bulgarian Split Squat'] },
      { label: 'Day 2 - Upper', exercises: ['Bench Press', 'Row', 'Lateral Raise'] },
      { label: 'Day 3 - Lower (Glute Pump)', exercises: ['Cable Kickback', 'Glute Bridge', 'Leg Press High Stance'] },
      { label: 'Day 4 - Upper + Arms', exercises: ['Lat Pulldown', 'DB Press', 'Arms Superset'] },
    ],
    deloadWeek: 8,
    muscleFocus: 'GLUTES',
    highIntensity: false,
    overview: 'Glute-first sequencing with two focused lower sessions each week.',
  },
];
