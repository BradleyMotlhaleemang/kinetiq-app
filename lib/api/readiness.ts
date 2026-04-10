import api from './client';

export const readinessApi = {
  checkIn: (data: {
    sleepScore: number;
    stressScore: number;
    nutritionScore: number;
    motivationScore: number;
    muscleReadinessScore: number;
    workoutId?: string;
  }) => api.post('/api/v1/readiness/check-in', data),

  latest: () => api.get('/api/v1/readiness/latest'),
};