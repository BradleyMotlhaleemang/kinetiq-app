import api from './client';

export const biofeedbackApi = {
  submit: (data: {
    workoutId?: string;
    sorenessLog: Record<string, number>;
    jointPainLog: Record<string, number>;
    energyLevel: number;
    strengthRating: number;
    muscleFeel: number;
    sleepLastNight: number;
    overallWellbeing: number;
  }) => api.post('/api/v1/biofeedback', data),

  latest: () => api.get('/api/v1/biofeedback/latest'),
};
