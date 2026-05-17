import api from './client';

export type Exercise = {
  id: string;
  name: string;
  primaryMuscle: string;
  secondaryMuscles: string[];
  movementPattern: string;
  exerciseType: string;
  movementClass: string;
  category: string;
  isCompound: boolean;
  metadata: {
    fatigueScore: number | null;
    stabilityDemand: number | null;
  } | null;
};

export type ExerciseDetail = Exercise & {
  metadata: {
    fatigueScore: number | null;
    stabilityDemand: number | null;
    equipmentProfile: {
      name: string;
      requiredEquipment: string;
    } | null;
    executionProfile: {
      zone: string;
      description: string;
      rpeRange: string;
    } | null;
  } | null;
  substitutionPools: Array<{
    id: string;
    priority: number;
    suitableWhenPain: string[];
    exercise: Exercise;
  }>;
};

export type SfrScore = {
  sfrScore: number;
  stimulusAvg: number;
  fatigueAvg: number;
  sampleSize: number;
  updatedAt: string;
} | null;

export const exercisesApi = {
  getExercises: async (params?: {
    primaryMuscle?: string;
    movementPattern?: string;
  }): Promise<Exercise[]> => {
    const query = new URLSearchParams();
    if (params?.primaryMuscle) query.set('primaryMuscle', params.primaryMuscle);
    if (params?.movementPattern) query.set('movementPattern', params.movementPattern);

    const suffix = query.toString();
    const res = await api.get(`/api/v1/exercises${suffix ? `?${suffix}` : ''}`);
    return res.data as Exercise[];
  },

  getExercise: async (exerciseId: string): Promise<ExerciseDetail> => {
    const res = await api.get(`/api/v1/exercises/${exerciseId}`);
    return res.data as ExerciseDetail;
  },

  getExerciseSubstitutions: async (
    exerciseId: string,
  ): Promise<ExerciseDetail['substitutionPools']> => {
    const res = await api.get(`/api/v1/exercises/${exerciseId}/substitutions`);
    return res.data as ExerciseDetail['substitutionPools'];
  },

  getExerciseSfr: async (exerciseId: string): Promise<SfrScore> => {
    const res = await api.get(`/api/v1/analytics/sfr/${exerciseId}`);
    return (res.data ?? null) as SfrScore;
  },
};