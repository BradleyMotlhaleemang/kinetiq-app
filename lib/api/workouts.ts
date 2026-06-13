import api from './client';

export type PrescriptionSubstitution = {
  action: 'NONE' | 'MONITOR' | 'SUBSTITUTE';
  reason: string;
  recommended?: { exerciseId: string; name: string; reason: string };
  candidates?: { exerciseId: string; name: string; priority: number }[];
  affectedJoint?: string;
  originalExercise?: { exerciseId: string; name: string };
};

export type Prescription = {
  exerciseId: string;
  action: string;
  actionLabel: string;
  weightTarget: number;
  repRangeLow: number;
  repRangeHigh: number;
  setTarget: number;
  reason: string;
  enginePhase: 'BASELINE' | 'CALIBRATING' | 'LEARNING' | 'ACTIVE';
  physiologicalState: string;
  confidenceLevel: string;
  coachingNote: string | null;
  progressionStep: string | null;
  volumeProgressionReason?: string;
  substitution: PrescriptionSubstitution;
  historicalBestWeight?: number | null;
  prescriptionActive?: boolean;
};

export type LoadAdvisory = {
  shouldWarn: boolean;
  tier: 'NONE' | 'TYPO' | 'PROGRESSION';
  confidence: string;
  active: boolean;
  isWarmup: boolean;
  baselineWeight: number | null;
  baselineE1RM: number | null;
  message: string;
};

export const WEIGHT_JUMP_THRESHOLD = 0.15;

export type WorkoutExerciseRow = {
  id: string;
  exerciseId: string;
  name: string;
  orderIndex: number;
  setsTarget: number;
  repRangeMin: number;
  repRangeMax: number;
  primaryMuscle: string | null;
  movementClass: string | null;
};

export type WorkoutExercisesPayload = {
  workoutId: string;
  sessionType: string;
  splitDayLabel: string | null;
  exercises: WorkoutExerciseRow[];
};

export const workoutsApi = {
  create: (data: { mesocycleId?: string; splitDayLabel?: string }) =>
    api.post('/api/v1/workouts', data),

  start: (workoutId: string) => api.patch(`/api/v1/workouts/${workoutId}/start`),

  findOne: (id: string) => api.get(`/api/v1/workouts/${id}`),

  findActive: () => api.get('/api/v1/workouts/active'),

  getExercises: (workoutId: string) =>
    api.get(`/api/v1/workouts/${workoutId}/exercises`) as Promise<{ data: WorkoutExercisesPayload }>,

  addExercise: (workoutId: string, exerciseId: string) =>
    api.post(`/api/v1/workouts/${workoutId}/exercises`, { exerciseId }),

  removeExercise: (workoutId: string, workoutExerciseId: string) =>
    api.delete(`/api/v1/workouts/${workoutId}/exercises/${workoutExerciseId}`),

  history: () => api.get('/api/v1/workouts/history'),

  getPrescription: (workoutId: string, exerciseId: string) =>
    api.get(
      `/api/v1/workouts/${workoutId}/prescription?exerciseId=${exerciseId}`,
    ) as Promise<{ data: Prescription }>,

  getLoadAdvisory: (
    workoutId: string,
    exerciseId: string,
    weight: number,
    reps: number,
  ) =>
    api.get(
      `/api/v1/workouts/${workoutId}/exercises/${exerciseId}/load-advisory?weight=${weight}&reps=${reps}`,
    ) as Promise<{ data: LoadAdvisory }>,

  confirmSubstitution: (data: {
    workoutId: string;
    exerciseId: string;
    substituteExerciseId: string;
    jointAffected: string;
    scope?: 'SESSION' | 'REMAINING_BLOCK';
  }) => api.post('/api/v1/substitutions/confirm', data),

  addSet: (
    workoutId: string,
    data: {
      exerciseId: string;
      setNumber: number;
      weight: number;
      reps: number;
      rpe?: number;
    },
    idempotencyKey?: string,
  ) =>
    api.post(`/api/v1/workouts/${workoutId}/sets`, data, {
      headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined,
    }),

  complete: (workoutId: string) =>
    api.patch(`/api/v1/workouts/${workoutId}/complete`),

  getCompletionAdvisory: (
    excludeWorkoutId?: string,
    completedAfter?: string,
    completedBefore?: string,
  ) => {
    const params = new URLSearchParams();
    if (excludeWorkoutId) params.set('excludeWorkoutId', excludeWorkoutId);
    if (completedAfter) params.set('completedAfter', completedAfter);
    if (completedBefore) params.set('completedBefore', completedBefore);
    const query = params.toString();
    return api.get(
      `/api/v1/workouts/completion-advisory${query ? `?${query}` : ''}`,
    ) as Promise<{ data: { completedToday: boolean; completedCount: number } }>;
  },
};