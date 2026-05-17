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
};

export const workoutsApi = {
  create: (data: { mesocycleId?: string; splitDayLabel?: string }) =>
    api.post('/api/v1/workouts', data),

  findOne: (id: string) => api.get(`/api/v1/workouts/${id}`),

  history: () => api.get('/api/v1/workouts/history'),

  getPrescription: (workoutId: string, exerciseId: string) =>
    api.get<Prescription>(
      `/api/v1/workouts/${workoutId}/prescription?exerciseId=${exerciseId}`,
    ),

  confirmSubstitution: (data: {
    workoutId: string;
    exerciseId: string;
    substituteExerciseId: string;
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
  ) => api.post(`/api/v1/workouts/${workoutId}/sets`, data),

  complete: (workoutId: string) =>
    api.patch(`/api/v1/workouts/${workoutId}/complete`),
};