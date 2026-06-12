/** UI 0–5 severity labels (maps to internal 0/1/3/6/8/9 on API). */
export const JOINT_SEVERITY_OPTIONS: Array<{ value: number; label: string }> = [
  { value: 0, label: 'No issue' },
  { value: 1, label: 'Slight awareness' },
  { value: 2, label: 'Mild discomfort' },
  { value: 3, label: 'Moderate pain' },
  { value: 4, label: 'Severe pain' },
  { value: 5, label: 'Very severe pain' },
];

export type JointTriage = 'HEALTHY' | 'MILD' | 'SIGNIFICANT';

export const JOINT_TRIAGE_OPTIONS: Array<{
  value: JointTriage;
  label: string;
  hint: string;
}> = [
  {
    value: 'HEALTHY',
    label: 'No pain or discomfort',
    hint: 'Skip joint detail for this session',
  },
  {
    value: 'MILD',
    label: 'Mild discomfort',
    hint: 'Tell us which joints — quick follow-up',
  },
  {
    value: 'SIGNIFICANT',
    label: 'Significant pain',
    hint: 'We will ask for joints and severity',
  },
];

export type JointAreaKey =
  | 'SHOULDER'
  | 'ELBOW'
  | 'WRIST'
  | 'NECK'
  | 'HIP'
  | 'KNEE'
  | 'ANKLE'
  | 'LOWER_BACK';

export const JOINT_AREA_LABELS: Record<JointAreaKey, string> = {
  SHOULDER: 'Shoulders',
  ELBOW: 'Elbows',
  WRIST: 'Wrists',
  NECK: 'Neck',
  HIP: 'Hips',
  KNEE: 'Knees',
  ANKLE: 'Ankles',
  LOWER_BACK: 'Lower Back',
};

export const ALL_JOINT_KEYS: JointAreaKey[] = [
  'SHOULDER',
  'ELBOW',
  'WRIST',
  'NECK',
  'HIP',
  'KNEE',
  'ANKLE',
  'LOWER_BACK',
];

export function uiSeverityToInternal(uiScore: number): number {
  const map: Record<number, number> = {
    0: 0,
    1: 1,
    2: 3,
    3: 6,
    4: 8,
    5: 9,
  };
  const clamped = Math.max(0, Math.min(5, Math.round(uiScore)));
  return map[clamped] ?? 0;
}

/** Rotate session meta: performance always + one of drive/effort/pump */
export function rotatedSessionMetaFields(workoutId: string): {
  showPerformance: true;
  showDrive: boolean;
  showEffort: boolean;
  showPump: boolean;
} {
  const slot = workoutId.charCodeAt(0) % 3;
  return {
    showPerformance: true,
    showDrive: slot === 0,
    showEffort: slot === 1,
    showPump: slot === 2,
  };
}
