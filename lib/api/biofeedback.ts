import api from './client';

export interface PrePopulationItem {
  muscle: string;
  carrySoreness: boolean;
  lastSorenessLabel: string | null;
  lastSorenessScore: number | null;
}

export const biofeedbackApi = {
  submit: (data: {
    workoutId: string;
    sorenessLog: Record<string, number>;
    muscleGroupFeedback: Array<{
      muscleGroup: string;
      soreness: string;
      jointComfort: string;
      volume: string;
    }>;
    globalJointComfortScore: number;
    jointComfortLog: Record<string, number>;
    sessionPerformance: number;
    trainingDrive: number;
    effortScore: number;
    pumpScore: number;
  }) => api.post('/api/v1/biofeedback', data),

  getPrePopulation: (workoutId: string) =>
    api.get<PrePopulationItem[]>(
      `/api/v1/biofeedback/pre-population?workoutId=${workoutId}`,
    ),

  latest: () => api.get('/api/v1/biofeedback/latest'),
};
