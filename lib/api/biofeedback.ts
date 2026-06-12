import api from './client';

export interface PrePopulationItem {
  muscle: string;
  carrySoreness: boolean;
  lastSorenessLabel: string | null;
  lastSorenessScore: number | null;
}

export interface PrePopulationResponse {
  muscles: PrePopulationItem[];
  relevantJoints: string[];
  recentJointHints?: Record<string, number>;
}

export type JointTriage = 'HEALTHY' | 'MILD' | 'SIGNIFICANT';

export const biofeedbackApi = {
  submit: (data: {
    workoutId: string;
    jointTriage?: JointTriage;
    sorenessLog: Record<string, number>;
    muscleGroupFeedback: Array<{
      muscleGroup: string;
      soreness: string;
      jointComfort: string;
      volume: string;
    }>;
    globalJointComfortScore: number;
    jointComfortLog: Record<string, unknown>;
    sessionPerformance: number;
    trainingDrive: number;
    effortScore?: number;
    pumpScore: number;
  }) => api.post('/api/v1/biofeedback', data),

  getPrePopulation: (workoutId: string) =>
    api.get(
      `/api/v1/biofeedback/pre-population?workoutId=${workoutId}`,
    ) as Promise<{ data: PrePopulationResponse }>,

  latest: () => api.get('/api/v1/biofeedback/latest'),
};
