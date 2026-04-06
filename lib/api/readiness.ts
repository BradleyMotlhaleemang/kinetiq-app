import api from './client';

export const readinessApi = {
  checkIn: (data: {
    sleepScore: number;
    stressScore: number;
    nutritionScore: number;
    motivationScore: number;
    muscleReadinessScore: number;
    workoutId?: string;
  }) => api.post('/readiness/check-in', data),

  latest: () => api.get('/readiness/latest'),
};