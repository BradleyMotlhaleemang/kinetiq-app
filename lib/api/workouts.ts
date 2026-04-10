import api from './client';

export const workoutsApi = {
  create: (data: { mesocycleId?: string; splitDayLabel?: string }) =>
    api.post('/api/v1/workouts', data),

  findOne: (id: string) => api.get(`/api/v1/workouts/${id}`),

  history: () => api.get('/api/v1/workouts/history'),

  getPrescription: (workoutId: string, exerciseId: string) =>
    api.get(`/api/v1/workouts/${workoutId}/prescription?exerciseId=${exerciseId}`),

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